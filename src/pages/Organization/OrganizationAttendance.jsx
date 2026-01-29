import { useState, useEffect } from 'react';
import { FaClipboardCheck, FaCalendarAlt, FaGraduationCap, FaUsers, FaSpinner, FaSave, FaQrcode } from 'react-icons/fa';
import { coursesService, usersService, attendanceService } from '../../services/firebaseService';
import { useAuth } from '../../context/AuthContext';
import './OrganizationAttendance.css';

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' }
];

const OrganizationAttendance = () => {
  const { getOrganizationId } = useAuth();
  const [classes, setClasses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [records, setRecords] = useState([]); // { userId, studentName, status }
  const [scanInputValue, setScanInputValue] = useState(''); // Card number from QR scan or manual entry
  const [scanMessage, setScanMessage] = useState(null); // Brief success/error after scan

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const orgId = getOrganizationId();
      if (!orgId) {
        setError('Organization ID is missing.');
        return;
      }
      const [coursesData, usersData] = await Promise.all([
        coursesService.getAll(1000, orgId),
        usersService.getAll(1000, orgId)
      ]);
      setClasses(coursesData || []);
      setUsers(usersData || []);
      if (coursesData?.length > 0 && !selectedClassId) {
        setSelectedClassId(coursesData[0].id);
      }
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error loading attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Students enrolled in the selected class
  const studentsInClass = users.filter(user => {
    const role = (user.role || '').toLowerCase();
    if (role !== 'student') return false;
    const classIds = user.classIds || user.batchIds || [];
    return classIds.includes(selectedClassId);
  });

  useEffect(() => {
    if (!selectedClassId || !selectedDate || users.length === 0) return;
    loadAttendanceForClassAndDate();
  }, [selectedClassId, selectedDate, users]);

  const loadAttendanceForClassAndDate = async () => {
    const orgId = getOrganizationId();
    if (!orgId) return;
    try {
      const existing = await attendanceService.getByClassAndDate(selectedClassId, selectedDate, orgId);
      const studentList = users.filter(u => {
        const role = (u.role || '').toLowerCase();
        if (role !== 'student') return false;
        const classIds = u.classIds || u.batchIds || [];
        return classIds.includes(selectedClassId);
      });
      if (existing && existing.records && existing.records.length > 0) {
        const byUserId = {};
        existing.records.forEach(r => { byUserId[r.userId] = r.status; });
        setRecords(studentList.map(s => ({
          userId: s.id,
          studentName: s.name || s.email || 'Unknown',
          qrCodeNumber: (s.qrCodeNumber || '').trim(),
          parentPhone: (s.parentPhone || '').trim(),
          status: byUserId[s.id] || 'absent'
        })));
      } else {
        setRecords(studentList.map(s => ({
          userId: s.id,
          studentName: s.name || s.email || 'Unknown',
          qrCodeNumber: (s.qrCodeNumber || '').trim(),
          parentPhone: (s.parentPhone || '').trim(),
          status: 'absent'
        })));
      }
    } catch (err) {
      console.error('Error loading attendance:', err);
      const studentList = users.filter(u => {
        const role = (u.role || '').toLowerCase();
        if (role !== 'student') return false;
        const classIds = u.classIds || u.batchIds || [];
        return classIds.includes(selectedClassId);
      });
      setRecords(studentList.map(s => ({
        userId: s.id,
        studentName: s.name || s.email || 'Unknown',
        qrCodeNumber: (s.qrCodeNumber || '').trim(),
        parentPhone: (s.parentPhone || '').trim(),
        status: 'absent'
      })));
    }
  };

  const handleStatusChange = (userId, status) => {
    setRecords(prev => prev.map(r => r.userId === userId ? { ...r, status } : r));
  };

  // Mark present by card number (from QR scan or manual input)
  const handleMarkByCardNumber = () => {
    const num = (scanInputValue || '').trim();
    setScanInputValue('');
    setScanMessage(null);
    if (!num) return;
    const studentList = users.filter(u => {
      const role = (u.role || '').toLowerCase();
      if (role !== 'student') return false;
      const classIds = u.classIds || u.batchIds || [];
      if (!classIds.includes(selectedClassId)) return false;
      const cardNum = (u.qrCodeNumber || '').trim();
      return cardNum === num;
    });
    if (studentList.length === 0) {
      setScanMessage({ type: 'error', text: 'No student in this class with this card number.' });
      setTimeout(() => setScanMessage(null), 3000);
      return;
    }
    const user = studentList[0];
    setRecords(prev => prev.map(r => r.userId === user.id ? { ...r, status: 'present' } : r));
    setScanMessage({ type: 'success', text: `Marked ${user.name || user.email} present.` });
    setTimeout(() => setScanMessage(null), 2500);
  };

  const handleSave = async () => {
    const orgId = getOrganizationId();
    if (!orgId) {
      setError('Organization ID is missing.');
      return;
    }
    if (!selectedClassId || !selectedDate) {
      setError('Please select a class and date.');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await attendanceService.save(selectedClassId, selectedDate, orgId, records);
      setSuccess('Attendance saved successfully.');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError('Failed to save attendance. Please try again.');
      console.error('Error saving attendance:', err);
    } finally {
      setSaving(false);
    }
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);

  return (
    <div className="organization-attendance-container">
      <div className="organization-attendance-card">
        {error && (
          <div className="attendance-error">
            {error}
          </div>
        )}
        {success && (
          <div className="attendance-success">
            {success}
          </div>
        )}
        <div className="organization-attendance-header">
          <div className="header-content">
            <div className="header-icon-wrapper">
              <FaClipboardCheck className="header-icon" />
            </div>
            <div>
              <h1 className="organization-attendance-title">Student Attendance</h1>
              <p className="organization-attendance-subtitle">Manage attendance for all classes</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="attendance-loading">
            <FaSpinner className="spinner" />
            <p>Loading classes and students...</p>
          </div>
        ) : (
          <>
            <div className="attendance-filters">
              <div className="form-group filter-group">
                <label>
                  <FaGraduationCap className="filter-icon" /> Class
                </label>
                <select
                  className="filter-select class-select"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                >
                  <option value="">Select a class</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.title || c.name || 'Untitled'}</option>
                  ))}
                </select>
              </div>
              <div className="form-group filter-group">
                <label>
                  <FaCalendarAlt className="filter-icon" /> Date
                </label>
                <input
                  type="date"
                  className="filter-input date-input"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>

            {selectedClassId && (
              <div className="attendance-section">
                {selectedClass && (
                  <div className="attendance-class-info">
                    <h3>{selectedClass.title || selectedClass.name || 'Class'}</h3>
                    {selectedClass.instructor && (
                      <span className="instructor">Instructor: {selectedClass.instructor}</span>
                    )}
                  </div>
                )}
                {studentsInClass.length === 0 ? (
                  <div className="attendance-empty">
                    <FaUsers className="empty-icon" />
                    <p>No students enrolled in this class.</p>
                    <p className="hint">Assign students to this class from Users.</p>
                  </div>
                ) : (
                  <>
                    <div className="attendance-scan-section">
                      <label className="attendance-scan-label">
                        <FaQrcode className="filter-icon" /> Scan QR or enter card number
                      </label>
                      <p className="attendance-scan-hint">
                        Scan the student&apos;s printed card QR, or type the card number, then mark present.
                      </p>
                      <div className="attendance-scan-row">
                        <input
                          type="text"
                          className="attendance-scan-input"
                          value={scanInputValue}
                          onChange={(e) => setScanInputValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleMarkByCardNumber())}
                          placeholder="Enter number from card / QR"
                          autoComplete="off"
                        />
                        <button
                          type="button"
                          className="attendance-scan-btn"
                          onClick={handleMarkByCardNumber}
                          disabled={!scanInputValue.trim()}
                        >
                          Mark present
                        </button>
                      </div>
                      {scanMessage && (
                        <div className={scanMessage.type === 'success' ? 'attendance-scan-msg success' : 'attendance-scan-msg error'}>
                          {scanMessage.text}
                        </div>
                      )}
                    </div>
                    <div className="attendance-table-wrapper">
                      <table className="attendance-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Student Name</th>
                            <th>Card / QR Number</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {records.map((r, index) => (
                            <tr key={r.userId}>
                              <td>{index + 1}</td>
                              <td>{r.studentName}</td>
                              <td>{r.qrCodeNumber || '—'}</td>
                              <td>
                                <select
                                  className="status-select"
                                  value={r.status}
                                  onChange={(e) => handleStatusChange(r.userId, e.target.value)}
                                >
                                  {STATUS_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="attendance-actions">
                      <button
                        type="button"
                        className="save-attendance-btn"
                        onClick={handleSave}
                        disabled={saving || records.length === 0}
                      >
                        {saving ? <FaSpinner className="btn-spinner" /> : <FaSave />}
                        {saving ? 'Saving...' : 'Save Attendance'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrganizationAttendance;

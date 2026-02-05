import { useState, useEffect } from 'react';
import { FaClipboardCheck, FaCalendarAlt, FaGraduationCap, FaUsers, FaSpinner, FaSave, FaQrcode, FaExclamationTriangle, FaDollarSign } from 'react-icons/fa';
import { coursesService, usersService, attendanceService, paymentsService } from '../../services/firebaseService';
import { useAuth } from '../../context/AuthContext';
import { serverTimestamp } from 'firebase/firestore';
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
  const [scanInputValue, setScanInputValue] = useState(''); // NFC card or QR number from scan or manual entry
  const [scanMessage, setScanMessage] = useState(null); // Brief success/error after scan
  const [payments, setPayments] = useState([]); // For fee status (month/year vs class)
  const [showQuickPayModal, setShowQuickPayModal] = useState(false);
  const [quickPayRecord, setQuickPayRecord] = useState(null); // { userId, studentName }
  const [quickPayAmount, setQuickPayAmount] = useState('');
  const [quickPaySaving, setQuickPaySaving] = useState(false);

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
      const [coursesData, usersData, paymentsData] = await Promise.all([
        coursesService.getAll(1000, orgId),
        usersService.getAll(1000, orgId),
        paymentsService.getAll(2000, orgId, false)
      ]);
      setClasses(coursesData || []);
      setUsers(usersData || []);
      setPayments(paymentsData || []);
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

  // Mark present by card number (QR/manual/NFC) or by student name. Pass overrideValue when scanning NFC.
  const handleMarkByCardOrName = (overrideValue = null) => {
    const input = (overrideValue !== null && overrideValue !== undefined ? String(overrideValue).trim() : (scanInputValue || '').trim());
    setScanInputValue('');
    setScanMessage(null);
    if (!input) return;
    const studentsInClass = users.filter(u => {
      const role = (u.role || '').toLowerCase();
      if (role !== 'student') return false;
      const classIds = u.classIds || u.batchIds || [];
      return classIds.includes(selectedClassId);
    });
    // 1) Try match by card/QR number (exact)
    const byCard = studentsInClass.filter(u => (u.qrCodeNumber || '').trim() === input);
    if (byCard.length === 1) {
      const user = byCard[0];
      setRecords(prev => prev.map(r => r.userId === user.id ? { ...r, status: 'present' } : r));
      setScanMessage({ type: 'success', text: `Marked ${user.name || user.email} present.` });
      setTimeout(() => setScanMessage(null), 2500);
      return;
    }
    if (byCard.length > 1) {
      setScanMessage({ type: 'error', text: 'Multiple students have this NFC card or QR number. Use student name instead.' });
      setTimeout(() => setScanMessage(null), 3000);
      return;
    }
    // 2) Try match by student name or email (case-insensitive partial)
    const searchLower = input.toLowerCase();
    const byName = studentsInClass.filter(u => {
      const name = (u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      return name.includes(searchLower) || email.includes(searchLower);
    });
    if (byName.length === 1) {
      const user = byName[0];
      setRecords(prev => prev.map(r => r.userId === user.id ? { ...r, status: 'present' } : r));
      setScanMessage({ type: 'success', text: `Marked ${user.name || user.email} present.` });
      setTimeout(() => setScanMessage(null), 2500);
      return;
    }
    if (byName.length > 1) {
      const names = byName.map(u => u.name || u.email).slice(0, 3).join(', ');
      setScanMessage({ type: 'error', text: `Multiple students match – enter more of the name. (e.g. ${names}${byName.length > 3 ? '…' : ''})` });
      setTimeout(() => setScanMessage(null), 4000);
      return;
    }
    setScanMessage({ type: 'error', text: 'No student in this class with this NFC card / QR number or name.' });
    setTimeout(() => setScanMessage(null), 3000);
  };

  const [nfcScanning, setNfcScanning] = useState(false);
  const supportsWebNFC = typeof window !== 'undefined' && 'NDEFReader' in window;

  const handleScanNFC = async () => {
    if (!supportsWebNFC) {
      setScanMessage({ type: 'error', text: 'NFC is not supported in this browser (try Chrome on Android).' });
      setTimeout(() => setScanMessage(null), 3000);
      return;
    }
    try {
      setNfcScanning(true);
      setScanMessage(null);
      const ndef = new window.NDEFReader();
      await ndef.scan();
      setScanMessage({ type: 'success', text: 'Hold student NFC card to the back of the phone…' });
      ndef.onreadingerror = () => {
        setScanMessage({ type: 'error', text: 'NFC read failed. Try again.' });
        setTimeout(() => setScanMessage(null), 3000);
      };
      ndef.onreading = ({ message }) => {
        if (message.records && message.records.length > 0) {
          const record = message.records[0];
          let text = '';
          if (record.recordType === 'text' && record.data) {
            const decoder = new TextDecoder(record.encoding || 'utf-8');
            text = decoder.decode(record.data);
          } else if (record.data) {
            try {
              text = new TextDecoder().decode(record.data);
            } catch (_) {}
          }
          if (text && text.trim()) {
            handleMarkByCardOrName(text.trim());
          }
        }
        setNfcScanning(false);
      };
    } catch (err) {
      setNfcScanning(false);
      setScanMessage({ type: 'error', text: err.message || 'NFC scan failed. Enable NFC and try again.' });
      setTimeout(() => setScanMessage(null), 4000);
    }
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

  // Month/year of selected date (for class fee check – fee due first week of each month)
  const selectedMonth = selectedDate ? selectedDate.slice(5, 7) : ''; // YYYY-MM-DD -> MM
  const selectedYear = selectedDate ? selectedDate.slice(0, 4) : '';   // YYYY-MM-DD -> YYYY
  const monthName = selectedMonth && selectedYear
    ? new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' })
    : '';

  const hasPaidForClassThisMonth = (userId) => {
    if (!selectedClassId || !selectedMonth || !selectedYear) return false;
    const user = users.find(u => u.id === userId);
    if (user?.freeClassIds && Array.isArray(user.freeClassIds) && user.freeClassIds.includes(selectedClassId)) return true;
    return (payments || []).some(p => {
      if (p.userId !== userId || (p.status || '').toLowerCase() !== 'completed') return false;
      const month = String(p.month || '').padStart(2, '0');
      const year = String(p.year || '');
      if (month !== selectedMonth || year !== selectedYear) return false;
      const classMatch = p.classId === selectedClassId ||
        (Array.isArray(p.classIds) && p.classIds.includes(selectedClassId));
      return classMatch;
    });
  };

  const getDefaultClassPrice = () => {
    const course = classes.find(c => c.id === selectedClassId);
    if (course?.price == null || course?.price === '') return '';
    const price = course.price;
    if (typeof price === 'number') return String(price);
    const parsed = String(price).replace(/[^0-9.]/g, '');
    return parsed || '';
  };

  const openQuickPay = (record) => {
    setQuickPayRecord(record);
    setQuickPayAmount(getDefaultClassPrice());
    setShowQuickPayModal(true);
  };

  const loadPayments = async () => {
    const orgId = getOrganizationId();
    if (!orgId) return;
    try {
      const data = await paymentsService.getAll(2000, orgId, false);
      setPayments(data || []);
    } catch (err) {
      console.error('Error loading payments:', err);
    }
  };

  const handleQuickPaySubmit = async () => {
    const orgId = getOrganizationId();
    if (!orgId || !quickPayRecord || !selectedClassId || !selectedMonth || !selectedYear) return;
    const amount = parseFloat(quickPayAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    try {
      setQuickPaySaving(true);
      setError(null);
      await paymentsService.create({
        userId: quickPayRecord.userId,
        amount: amount.toFixed(2),
        status: 'completed',
        paymentMethod: 'Manual',
        transactionId: `ATT-${Date.now()}`,
        month: selectedMonth,
        year: selectedYear,
        notes: 'Recorded from Attendance',
        classId: selectedClassId,
        classIds: [selectedClassId],
        organizationId: orgId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      await loadPayments();
      setShowQuickPayModal(false);
      setQuickPayRecord(null);
      setQuickPayAmount('');
      setSuccess(`Payment recorded for ${quickPayRecord.studentName}.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to record payment. Please try again.');
      console.error('Error recording quick payment:', err);
    } finally {
      setQuickPaySaving(false);
    }
  };

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
                        <FaQrcode className="filter-icon" /> Mark by NFC card, QR number, or student name
                      </label>
                      <p className="attendance-scan-hint">
                        Scan QR / NFC, enter NFC card or QR number, or type student name (or part of name), then mark present. Same number works for QR and NFC.
                      </p>
                      <div className="attendance-scan-row">
                        <input
                          type="text"
                          className="attendance-scan-input"
                          value={scanInputValue}
                          onChange={(e) => setScanInputValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleMarkByCardOrName())}
                          placeholder="NFC card or QR number or student name"
                          autoComplete="off"
                        />
                        <button
                          type="button"
                          className="attendance-scan-btn"
                          onClick={() => handleMarkByCardOrName()}
                          disabled={!scanInputValue.trim()}
                        >
                          Mark present
                        </button>
                        {supportsWebNFC && (
                          <button
                            type="button"
                            className="attendance-scan-btn attendance-nfc-btn"
                            onClick={handleScanNFC}
                            disabled={nfcScanning}
                            title="Scan student NFC card (Chrome on Android)"
                          >
                            {nfcScanning ? 'Scanning…' : 'Scan NFC'}
                          </button>
                        )}
                      </div>
                      {scanMessage && (
                        <div className={scanMessage.type === 'success' ? 'attendance-scan-msg success' : 'attendance-scan-msg error'}>
                          {scanMessage.text}
                        </div>
                      )}
                    </div>
                    {monthName && (
                      <p className="attendance-fee-note">
                        Class fee is due in the first week of each month. Students marked &quot;Not paid&quot; have not paid for <strong>{monthName}</strong>.
                      </p>
                    )}
                    <div className="attendance-table-wrapper">
                      <table className="attendance-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Student Name</th>
                            <th>NFC card / QR number</th>
                            <th>Fee ({monthName || '—'})</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {records.map((r, index) => {
                            const paid = hasPaidForClassThisMonth(r.userId);
                            return (
                              <tr key={r.userId} className={!paid ? 'attendance-row-unpaid' : ''}>
                                <td>{index + 1}</td>
                                <td>{r.studentName}</td>
                                <td>{r.qrCodeNumber || '—'}</td>
                                <td>
                                  {paid ? (
                                    <span className="attendance-fee-paid">Paid</span>
                                  ) : (
                                    <span className="attendance-fee-cell-unpaid">
                                      <span className="attendance-fee-unpaid" title={`Class fee not paid for ${monthName}`}>
                                        <FaExclamationTriangle className="attendance-fee-unpaid-icon" /> Not paid
                                      </span>
                                      <button
                                        type="button"
                                        className="attendance-quick-pay-btn"
                                        onClick={() => openQuickPay(r)}
                                        title="Record class fee payment"
                                      >
                                        <FaDollarSign /> Pay
                                      </button>
                                    </span>
                                  )}
                                </td>
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
                            );
                          })}
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

      {/* Quick Pay Modal – record class fee from attendance */}
      {showQuickPayModal && quickPayRecord && (
        <div className="modal-overlay" onClick={() => !quickPaySaving && setShowQuickPayModal(false)}>
          <div className="modal-content attendance-quick-pay-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Record class fee payment</h2>
              <button type="button" className="modal-close" onClick={() => !quickPaySaving && setShowQuickPayModal(false)} aria-label="Close">×</button>
            </div>
            <div className="modal-body">
              <p className="attendance-quick-pay-info">
                <strong>Student:</strong> {quickPayRecord.studentName}
              </p>
              <p className="attendance-quick-pay-info">
                <strong>Class:</strong> {selectedClass?.title || selectedClass?.name || 'Class'}
              </p>
              <p className="attendance-quick-pay-info">
                <strong>Month / Year:</strong> {monthName}
              </p>
              <div className="form-group">
                <label>Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={quickPayAmount}
                  onChange={e => setQuickPayAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => !quickPaySaving && setShowQuickPayModal(false)} disabled={quickPaySaving}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={handleQuickPaySubmit} disabled={quickPaySaving || !quickPayAmount.trim()}>
                {quickPaySaving ? <><FaSpinner className="btn-spinner" /> Recording…</> : <><FaDollarSign /> Record payment</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationAttendance;

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaChevronRight, FaBook, FaSpinner, FaCheckCircle, FaTimesCircle, FaCalendar, FaGraduationCap } from 'react-icons/fa';
import { coursesService, tutesService, usersService } from '../../services/firebaseService';
import { useAuth } from '../../context/AuthContext';
import { serverTimestamp } from 'firebase/firestore';
import './OrganizationTuteDividing.css';

const OrganizationTuteDividing = () => {
  const { getOrganizationId } = useAuth();
  const [courses, setCourses] = useState([]);
  const [tutes, setTutes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Set default month/year to current
    const now = new Date();
    if (!selectedMonth) setSelectedMonth(String(now.getMonth() + 1).padStart(2, '0'));
    if (!selectedYear) setSelectedYear(String(now.getFullYear()));
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const orgId = getOrganizationId();
      if (!orgId) {
        setError('Organization not found.');
        setLoading(false);
        return;
      }
      const [coursesData, tutesData, usersData] = await Promise.all([
        coursesService.getAll(1000, orgId),
        tutesService.getAll(2000, orgId),
        usersService.getAll(1000, orgId)
      ]);
      setCourses(coursesData || []);
      setTutes(tutesData || []);
      setUsers(usersData || []);
      if (coursesData.length > 0 && !selectedClassId) {
        setSelectedClassId(coursesData[0].id);
      }
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStudentsInClass = (classId) => {
    return users.filter(u => {
      if ((u.role || '').toLowerCase() !== 'student') return false;
      const classIds = u.classIds || u.batchIds || [];
      return classIds.includes(classId);
    });
  };

  const hasStudentReceivedBook = (studentId, classId, month, year) => {
    return tutes.some(t => 
      t.userId === studentId &&
      t.classId === classId &&
      t.month === month &&
      t.year === year &&
      t.received === true
    );
  };

  const handleToggleBookReceived = async (studentId, received) => {
    if (!selectedClassId || !selectedMonth || !selectedYear) {
      setError('Please select class, month, and year.');
      return;
    }
    const orgId = getOrganizationId();
    try {
      setSaving(true);
      setError(null);
      
      // Find existing record for this student/class/month/year
      const existing = tutes.find(t =>
        t.userId === studentId &&
        t.classId === selectedClassId &&
        t.month === selectedMonth &&
        t.year === selectedYear
      );

      if (existing) {
        // Update existing record
        await tutesService.update(existing.id, { received, updatedAt: serverTimestamp() });
      } else {
        // Create new record
        await tutesService.create({
          userId: studentId,
          classId: selectedClassId,
          month: selectedMonth,
          year: selectedYear,
          received,
          organizationId: orgId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      await loadData();
    } catch (err) {
      setError('Failed to save. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const studentsInClass = selectedClassId ? getStudentsInClass(selectedClassId) : [];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear - 2; y <= currentYear + 1; y++) {
    years.push(y);
  }

  return (
    <div className="org-tute-dividing-container">
      <div className="org-tute-dividing-card">
        <div className="org-tute-dividing-header">
          <div className="header-content">
            <div className="header-icon-wrapper">
              <FaBook className="header-icon" />
            </div>
            <div>
              <h1 className="org-tute-dividing-title">Tute dividing</h1>
              <p className="org-tute-dividing-subtitle">Mark whether each student received a book for the month (like tuition fee tracking)</p>
            </div>
          </div>
        </div>

        <nav className="breadcrumb">
          <ol className="breadcrumb-list">
            <li className="breadcrumb-item">
              <Link to="/organization/dashboard" className="breadcrumb-link">
                <FaHome className="breadcrumb-icon" />
                Dashboard
              </Link>
            </li>
            <li className="breadcrumb-item">
              <FaChevronRight className="breadcrumb-sep" />
            </li>
            <li className="breadcrumb-item">
              <span className="breadcrumb-current">Tute dividing</span>
            </li>
          </ol>
        </nav>

        {error && (
          <div className="error-message" style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '0.5rem' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <FaSpinner className="spin" />
            <p>Loading classes and students…</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="empty-state">
            <FaBook className="empty-icon" />
            <p>No classes yet</p>
            <p className="empty-hint">Create classes in Classes Management first.</p>
            <Link to="/organization/courses" className="empty-link">Go to Classes</Link>
          </div>
        ) : (
          <>
            <div className="filters-row">
              <div className="form-group-inline">
                <label><FaGraduationCap /> Class:</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="form-select"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title || c.name || c.id}</option>
                  ))}
                </select>
              </div>

              <div className="form-group-inline">
                <label><FaCalendar /> Month:</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="form-select"
                >
                  {monthNames.map((name, idx) => (
                    <option key={idx + 1} value={String(idx + 1).padStart(2, '0')}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group-inline">
                <label>Year:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="form-select"
                >
                  {years.map(y => (
                    <option key={y} value={String(y)}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {studentsInClass.length === 0 ? (
              <div className="empty-state-inline">
                <p>No students in this class. Add students in Users and assign them to this class.</p>
              </div>
            ) : (
              <div className="students-table-wrap">
                <table className="students-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Book received</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsInClass.map(student => {
                      const studentId = student.id || student.uid;
                      const received = hasStudentReceivedBook(studentId, selectedClassId, selectedMonth, selectedYear);
                      return (
                        <tr key={studentId}>
                          <td>
                            <span className="student-name">{student.name || student.email || studentId}</span>
                          </td>
                          <td>
                            {received ? (
                              <span className="book-status book-received">
                                <FaCheckCircle /> Received
                              </span>
                            ) : (
                              <span className="book-status book-not-received">
                                <FaTimesCircle /> Not received
                              </span>
                            )}
                          </td>
                          <td>
                            <button
                              type="button"
                              className={received ? 'btn-mark-not-received' : 'btn-mark-received'}
                              onClick={() => handleToggleBookReceived(studentId, !received)}
                              disabled={saving}
                            >
                              {saving ? <FaSpinner className="spin-inline" /> : (received ? 'Mark not received' : 'Mark received')}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrganizationTuteDividing;

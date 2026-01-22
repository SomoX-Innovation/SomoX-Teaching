import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaMoneyBillWave, FaSearch, FaPlus, FaEdit, FaSpinner, FaCheckCircle, FaTimesCircle, FaUsers, FaCalendar } from 'react-icons/fa';
import { paymentsService, usersService } from '../../services/firebaseService';
import { serverTimestamp } from 'firebase/firestore';
import './OrganizationPayments.css';

const OrganizationPayments = () => {
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    month: '',
    year: '',
    status: 'completed',
    paymentMethod: '',
    transactionId: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [paymentsData, usersData] = await Promise.all([
        paymentsService.getAll(),
        usersService.getAll()
      ]);
      
      // Filter only students
      const studentsList = (usersData || []).filter(user => {
        const role = user.role ? user.role.toLowerCase() : '';
        return role === 'student';
      });
      
      setStudents(studentsList);
      setPayments(paymentsData || []);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStudentPayments = (studentId) => {
    return payments.filter(p => p.userId === studentId);
  };

  const getStudentTotalPaid = (studentId) => {
    const studentPayments = getStudentPayments(studentId);
    return studentPayments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  };

  const getStudentLastPayment = (studentId) => {
    const studentPayments = getStudentPayments(studentId);
    if (studentPayments.length === 0) return null;
    return studentPayments.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return dateB - dateA;
    })[0];
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleAddPayment = (student) => {
    setSelectedStudent(student);
    // Set current month and year as default
    const now = new Date();
    setFormData({
      amount: '',
      month: (now.getMonth() + 1).toString().padStart(2, '0'),
      year: now.getFullYear().toString(),
      status: 'completed',
      paymentMethod: '',
      transactionId: '',
      notes: ''
    });
    setShowPaymentModal(true);
  };

  const handleSubmitPayment = async () => {
    try {
      setError(null);
      
      if (!formData.amount || !formData.month || !formData.year) {
        setError('Amount, month, and year are required.');
        return;
      }

      const paymentData = {
        userId: selectedStudent.id,
        amount: parseFloat(formData.amount).toFixed(2),
        status: formData.status,
        paymentMethod: formData.paymentMethod || 'Manual',
        transactionId: formData.transactionId || `TXN-${Date.now()}`,
        month: formData.month,
        year: formData.year,
        notes: formData.notes || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await paymentsService.create(paymentData);
      await loadData();
      setShowPaymentModal(false);
      setSelectedStudent(null);
      resetForm();
      toast.success(`Payment recorded successfully for ${selectedStudent.name}!`);
    } catch (err) {
      setError('Failed to record payment. Please try again.');
      console.error('Error creating payment:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      month: '',
      year: '',
      status: 'completed',
      paymentMethod: '',
      transactionId: '',
      notes: ''
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    return timestamp;
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getMonthName = (monthNumber) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[parseInt(monthNumber) - 1] || monthNumber;
  };

  const stats = {
    totalStudents: students.length,
    totalPayments: payments.length,
    completedPayments: payments.filter(p => p.status === 'completed').length,
    totalRevenue: payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  };

  return (
    <div className="organization-payments-container">
      <div className="organization-payments-card">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        {/* Header */}
        <div className="organization-payments-header">
          <div className="header-content">
            <div className="header-icon-wrapper">
              <FaMoneyBillWave className="header-icon" />
            </div>
            <div>
              <h1 className="organization-payments-title">Payments Management</h1>
              <p className="organization-payments-subtitle">Manage monthly payments for all students</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="payments-stats-grid">
          <div className="payments-stat-card">
            <div className="stat-value">{stats.totalStudents}</div>
            <div className="stat-label">Total Students</div>
          </div>
          <div className="payments-stat-card">
            <div className="stat-value">{stats.totalPayments}</div>
            <div className="stat-label">Total Payments</div>
          </div>
          <div className="payments-stat-card">
            <div className="stat-value">{stats.completedPayments}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="payments-stat-card">
            <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
            <div className="stat-label">Total Revenue</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="payments-toolbar">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search students by name or email..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Students Table */}
        <div className="payments-table-container">
          {loading ? (
            <div className="loading-state">
              <FaSpinner className="spinner" />
              <p>Loading students...</p>
            </div>
          ) : (
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Total Paid</th>
                  <th>Last Payment</th>
                  <th>Payment Count</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-state">
                      {searchTerm ? 'No students found matching your search' : 'No students found'}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => {
                    const studentPayments = getStudentPayments(student.id);
                    const lastPayment = getStudentLastPayment(student.id);
                    const totalPaid = getStudentTotalPaid(student.id);
                    
                    return (
                      <tr key={student.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaUsers style={{ color: '#6b7280' }} />
                            <strong>{student.name || 'N/A'}</strong>
                          </div>
                        </td>
                        <td>{student.email || 'N/A'}</td>
                        <td className="amount-cell">{formatCurrency(totalPaid)}</td>
                        <td>
                          {lastPayment ? (
                            <div>
                              <div>{formatDate(lastPayment.createdAt || lastPayment.date)}</div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                {lastPayment.month && lastPayment.year 
                                  ? `${getMonthName(lastPayment.month)} ${lastPayment.year}`
                                  : ''}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: '#9ca3af' }}>No payments</span>
                          )}
                        </td>
                        <td>
                          <span style={{ 
                            padding: '0.25rem 0.75rem', 
                            background: '#eff6ff', 
                            color: '#1e40af',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                          }}>
                            {studentPayments.length}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="action-btn edit-btn"
                            title="Add Monthly Payment"
                            onClick={() => handleAddPayment(student)}
                            style={{
                              padding: '0.5rem 1rem',
                              background: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <FaPlus />
                            Add Payment
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Payment Modal */}
      {showPaymentModal && selectedStudent && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Add Monthly Payment</h2>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ 
                padding: '1rem', 
                background: '#eff6ff', 
                borderRadius: '0.5rem', 
                marginBottom: '1.5rem',
                fontSize: '0.875rem',
                color: '#1e40af'
              }}>
                <strong>Student:</strong> {selectedStudent.name} ({selectedStudent.email})
              </div>

              <div className="form-group">
                <label>Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Month *</label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({...formData, month: e.target.value})}
                    required
                  >
                    <option value="">Select Month</option>
                    {Array.from({ length: 12 }, (_, i) => {
                      const monthNum = (i + 1).toString().padStart(2, '0');
                      return (
                        <option key={monthNum} value={monthNum}>
                          {getMonthName(monthNum)}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="form-group">
                  <label>Year *</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    placeholder="YYYY"
                    min="2020"
                    max="2100"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  required
                >
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div className="form-group">
                <label>Payment Method</label>
                <input
                  type="text"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                  placeholder="e.g., Cash, Bank Transfer, Credit Card"
                />
              </div>

              <div className="form-group">
                <label>Transaction ID</label>
                <input
                  type="text"
                  value={formData.transactionId}
                  onChange={(e) => setFormData({...formData, transactionId: e.target.value})}
                  placeholder="Auto-generated if left empty"
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional notes (optional)"
                  rows="3"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => {
                setShowPaymentModal(false);
                setSelectedStudent(null);
                resetForm();
              }}>Cancel</button>
              <button className="btn-primary" onClick={handleSubmitPayment}>Record Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationPayments;

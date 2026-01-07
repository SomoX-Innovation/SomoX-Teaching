import { useState, useEffect } from 'react';
import { FaMoneyBillWave, FaSearch, FaDownload, FaSpinner, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { paymentsService, usersService } from '../../services/firebaseService';
import './AdminPayments.css';

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

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
      setPayments(paymentsData);
      setUsers(usersData);
    } catch (err) {
      setError('Failed to load payments. Please try again.');
      console.error('Error loading payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  const filteredPayments = payments.filter(payment => {
    const userName = getUserName(payment.userId).toLowerCase();
    const matchesSearch = userName.includes(searchTerm.toLowerCase()) ||
                         payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: payments.length,
    completed: payments.filter(p => p.status === 'completed').length,
    pending: payments.filter(p => p.status === 'pending').length,
    totalRevenue: payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
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

  return (
    <div className="admin-payments-container">
      <div className="admin-payments-card">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        {/* Header */}
        <div className="admin-payments-header">
          <div className="header-content">
            <div className="header-icon-wrapper">
              <FaMoneyBillWave className="header-icon" />
            </div>
            <div>
              <h1 className="admin-payments-title">Payments Management</h1>
              <p className="admin-payments-subtitle">Manage all payments and transactions</p>
            </div>
          </div>
          <button className="export-btn">
            <FaDownload className="btn-icon" />
            Export
          </button>
        </div>

        {/* Stats */}
        <div className="payments-stats-grid">
          <div className="payments-stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Payments</div>
          </div>
          <div className="payments-stat-card">
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="payments-stat-card">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pending</div>
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
              placeholder="Search by user or transaction ID..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Payments Table */}
        <div className="payments-table-container">
          {loading ? (
            <div className="loading-state">
              <FaSpinner className="spinner" />
              <p>Loading payments...</p>
            </div>
          ) : (
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-state">
                      No payments found
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td>
                        <span className="transaction-id">{payment.transactionId || payment.id.substring(0, 8)}</span>
                      </td>
                      <td>{getUserName(payment.userId)}</td>
                      <td className="amount-cell">{formatCurrency(payment.amount)}</td>
                      <td>{payment.paymentMethod || 'N/A'}</td>
                      <td>
                        <span className={`status-badge status-${payment.status || 'pending'}`}>
                          {payment.status === 'completed' && <FaCheckCircle className="status-icon" />}
                          {payment.status === 'failed' && <FaTimesCircle className="status-icon" />}
                          {payment.status || 'pending'}
                        </span>
                      </td>
                      <td>{formatDate(payment.createdAt || payment.date)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPayments;

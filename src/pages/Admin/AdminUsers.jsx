import { useState, useEffect } from 'react';
import { FaUsers, FaSearch, FaPlus, FaEdit, FaTrash, FaFilter, FaDownload, FaSpinner, FaLock } from 'react-icons/fa';
import { usersService } from '../../services/firebaseService';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../../config/firebase';
import './AdminUsers.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'student',
    status: 'active',
    password: '' // For new user creation
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await usersService.getAll();
      setUsers(data);
    } catch (err) {
      setError('Failed to load users. Please try again.');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      setError(null);
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      const { createUserDocument } = await import('../../services/authService');
      
      // Create Firebase Auth user if password is provided
      if (formData.email && formData.password) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
        const userId = userCredential.user.uid;
        
        // Create user document in Firestore
        await createUserDocument(userId, {
          email: formData.email,
          name: formData.name,
          phone: formData.phone || '',
          role: formData.role,
          status: formData.status
        });
      } else {
        // Just create Firestore document without Auth account
        await usersService.create(formData);
      }
      
      await loadUsers();
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      setError(err.message || 'Failed to create user. Please try again.');
      console.error('Error creating user:', err);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      status: user.status
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async () => {
    try {
      setError(null);
      await usersService.update(selectedUser.id, formData);
      await loadUsers();
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
    } catch (err) {
      setError('Failed to update user. Please try again.');
      console.error('Error updating user:', err);
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        setError(null);
        await usersService.delete(id);
        await loadUsers();
      } catch (err) {
        setError('Failed to delete user. Please try again.');
        console.error('Error deleting user:', err);
      }
    }
  };


  const handleSetPassword = async () => {
    if (!selectedUser || !selectedUser.email) {
      setError('User email is required.');
      return;
    }

    if (!selectedUser.id) {
      setError('User ID is required. Make sure the user has a Firebase Auth account.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setError(null);
      
      // Use Cloud Function (callable) to set password directly
      const functions = getFunctions();
      const adminSetPassword = httpsCallable(functions, 'adminSetPassword');
      
      const result = await adminSetPassword({
        userId: selectedUser.id,
        email: selectedUser.email,
        newPassword: passwordData.newPassword
      });
      
      if (result.data && result.data.success) {
        alert(`Password successfully changed for ${selectedUser.email}`);
        setShowPasswordModal(false);
        setPasswordData({ newPassword: '', confirmPassword: '' });
        setSelectedUser(null);
      } else {
        setError('Failed to set password. Please check Cloud Function setup.');
      }
    } catch (err) {
      if (err.code === 'functions/not-found' || err.message?.includes('not found')) {
        setError('Cloud Function not set up. Please deploy the adminSetPassword function. See ADMIN_PASSWORD_SETUP.md for instructions.');
      } else if (err.code === 'functions/permission-denied') {
        setError('Permission denied. Only admins can set passwords.');
      } else {
        setError(err.message || 'Failed to set password. Please try again.');
      }
      console.error('Error setting password:', err);
    }
  };

  const handleOpenPasswordModal = (user) => {
    setSelectedUser(user);
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setShowPasswordModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'student',
      status: 'active',
      password: ''
    });
  };

  const stats = {
    total: users.length,
    students: users.filter(u => u.role === 'student').length,
    admins: users.filter(u => u.role === 'admin').length,
    active: users.filter(u => u.status === 'active').length
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    return timestamp;
  };

  return (
    <div className="admin-users-container">
      <div className="admin-users-card">
        {error && (
          <div className="error-message" style={{ 
            padding: '1rem', 
            background: 'rgba(239, 68, 68, 0.1)', 
            color: '#ef4444', 
            borderRadius: '0.5rem', 
            marginBottom: '1rem' 
          }}>
            {error}
          </div>
        )}
        {/* Header */}
        <div className="admin-users-header">
          <div className="header-content">
            <div className="header-icon-wrapper">
              <FaUsers className="header-icon" />
            </div>
            <div>
              <h1 className="admin-users-title">Users Management</h1>
              <p className="admin-users-subtitle">Manage all users, students, and administrators</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="export-btn">
              <FaDownload className="btn-icon" />
              Export
            </button>
            <button className="add-user-btn" onClick={() => setShowAddModal(true)}>
              <FaPlus className="btn-icon" />
              Add User
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="users-stats-grid">
          <div className="users-stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="users-stat-card">
            <div className="stat-value">{stats.students}</div>
            <div className="stat-label">Students</div>
          </div>
          <div className="users-stat-card">
            <div className="stat-value">{stats.admins}</div>
            <div className="stat-label">Admins</div>
          </div>
          <div className="users-stat-card">
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">Active Users</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="users-toolbar">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search users by name or email..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <div className="filter-item">
              <FaFilter className="filter-icon" />
              <select 
                className="filter-select"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="admin">Admins</option>
              </select>
            </div>
            <div className="filter-item">
              <select 
                className="filter-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="users-table-container">
          {loading ? (
            <div className="loading-state" style={{ 
              textAlign: 'center', 
              padding: '3rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <FaSpinner className="spinner" style={{ 
                animation: 'spin 1s linear infinite',
                fontSize: '2rem',
                color: 'var(--primary)'
              }} />
              <p>Loading users...</p>
            </div>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-state">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-name-cell">
                          <div className="user-avatar-small">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <span>{user.name || 'N/A'}</span>
                        </div>
                      </td>
                      <td>{user.email || 'N/A'}</td>
                      <td>{user.phone || 'N/A'}</td>
                      <td>
                        <span className={`role-badge role-${user.role || 'student'}`}>
                          {user.role || 'student'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge status-${user.status || 'active'}`}>
                          {user.status || 'active'}
                        </span>
                      </td>
                      <td>{formatDate(user.createdAt || user.joined)}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="action-btn edit-btn" 
                            title="Edit"
                            onClick={() => handleEditUser(user)}
                          >
                            <FaEdit />
                          </button>
                          <button 
                            className="action-btn password-set-btn" 
                            title="Change Password"
                            onClick={() => handleOpenPasswordModal(user)}
                            style={{ color: '#10b981' }}
                          >
                            <FaLock />
                          </button>
                          <button 
                            className="action-btn delete-btn" 
                            title="Delete"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="pagination">
          <div className="pagination-info">
            Showing {filteredUsers.length} of {users.length} users
          </div>
          <div className="pagination-controls">
            <button className="pagination-btn" disabled>Previous</button>
            <button className="pagination-btn active">1</button>
            <button className="pagination-btn">2</button>
            <button className="pagination-btn">Next</button>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New User</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter full name"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="Enter email address"
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="form-group">
                <label>Password (Optional - for Firebase Auth account)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Leave empty to create Firestore-only user"
                />
                <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  If provided, will create Firebase Auth account. Otherwise, only Firestore document.
                </small>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAddUser}>Add User</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit User</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleUpdateUser}>Update User</button>
            </div>
          </div>
        </div>
      )}

      {/* Set Password Modal */}
      {showPasswordModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Change Password for {selectedUser.name || selectedUser.email}</h2>
              <button className="modal-close" onClick={() => setShowPasswordModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  placeholder="Confirm new password"
                />
              </div>
              <div style={{ 
                padding: '0.75rem', 
                background: 'rgba(156, 163, 175, 0.1)', 
                borderRadius: '0.5rem',
                marginTop: '0.5rem',
                fontSize: '0.8rem',
                color: '#6b7280',
                borderLeft: '3px solid #9ca3af'
              }}>
                <strong>ℹ️ Setup Required:</strong> Cloud Function needed. See ADMIN_PASSWORD_SETUP.md
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowPasswordModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSetPassword}>Change Password</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;

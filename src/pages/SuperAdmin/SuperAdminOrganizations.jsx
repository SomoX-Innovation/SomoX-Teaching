import { useState, useEffect } from 'react';
import { 
  FaBuilding, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSearch, 
  FaFilter,
  FaSpinner,
  FaUserShield,
  FaUsers,
  FaEye,
  FaCheckCircle,
  FaTimesCircle
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getDocuments, createDocument, updateDocument, deleteDocument, clearCache } from '../../services/firebaseService';
import { usersService } from '../../services/firebaseService';
import { createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { createUserDocument } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import './SuperAdminOrganizations.css';

const SuperAdminOrganizations = () => {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [organizationsWithAdmins, setOrganizationsWithAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [orgUsers, setOrgUsers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    status: 'active',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    adminPhone: ''
  });

  useEffect(() => {
    if (!isSuperAdmin()) {
      navigate('/admin/dashboard');
      return;
    }
    loadOrganizations();
  }, [isSuperAdmin, navigate]);

  const loadOrganizations = async (forceRefresh = false) => {
    try {
      setLoading(true);
      if (forceRefresh) {
        clearCache('organizations');
        clearCache('users');
      }
      setError(null);
      
      // Load organizations and all admins
      const [orgsData, allUsers] = await Promise.all([
        getDocuments('organizations', [], { field: 'createdAt', direction: 'desc' }, 1000, !forceRefresh).catch(() => []),
        usersService.getAll(1000, null, false).catch(() => [])
      ]);
      
      // Filter admins only
      const allAdmins = allUsers.filter(u => u.role?.toLowerCase() === 'admin');
      
      setOrganizations(orgsData);
      
      // Map organizations with their admin emails
      const orgsWithAdmins = orgsData.map(org => {
        const admin = allAdmins.find(a => a.organizationId === org.id);
        return {
          ...org,
          adminEmail: admin?.email || '—',
          adminName: admin?.name || '—'
        };
      });
      
      setOrganizationsWithAdmins(orgsWithAdmins);
    } catch (err) {
      setError('Failed to load organizations. Please try again.');
      console.error('Error loading organizations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadOrgUsers = async (orgId) => {
    try {
      const users = await usersService.getAll(1000, orgId, false);
      setOrgUsers(users);
    } catch (err) {
      console.error('Error loading organization users:', err);
      setOrgUsers([]);
    }
  };

  const filteredOrganizations = organizationsWithAdmins.filter(org => {
    const matchesSearch = org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.adminEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || org.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleEmailBlur = (e, fieldName = 'adminEmail') => {
    const value = e.target.value.trim();
    // Only auto-fill if there's a non-empty value without @
    if (value && value.length > 0 && !value.includes('@')) {
      setFormData({...formData, [fieldName]: `${value}@gmail.com`});
    } else if (!value || value.length === 0) {
      // Explicitly clear the field if it's empty
      setFormData({...formData, [fieldName]: ''});
    }
  };

  const handleEmailKeyDown = (e, fieldName = 'adminEmail') => {
    if (e.key === 'Tab' || e.key === 'Enter') {
      const value = formData[fieldName]?.trim() || '';
      if (value && !value.includes('@')) {
        e.preventDefault();
        setFormData({...formData, [fieldName]: `${value}@gmail.com`});
        // Move focus to next field after a brief delay
        setTimeout(() => {
          const inputs = e.target.form?.querySelectorAll('input, select, textarea');
          const currentIndex = Array.from(inputs).indexOf(e.target);
          if (inputs[currentIndex + 1]) {
            inputs[currentIndex + 1].focus();
          }
        }, 10);
      }
    }
  };

  const handleCreateOrganization = async () => {
    try {
      setError(null);
      
      if (!formData.name || formData.name.trim() === '') {
        setError('Organization name is required.');
        return;
      }

      if (!formData.adminEmail || !formData.adminPassword) {
        setError('Admin email and password are required to create the first admin.');
        return;
      }

      // Create organization document
      const orgData = {
        name: formData.name.trim(),
        status: formData.status,
        createdAt: new Date().toISOString()
      };
      const orgId = await createDocument('organizations', orgData);
      console.log('Organization created:', orgId);

      // Create first admin for the organization
      const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDcox9e0ohy1lFFiQX5KvzRv5c7Ulv4M9A",
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "somoxlean.firebaseapp.com",
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "somoxlean",
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "somoxlean.firebasestorage.app",
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "92886460382",
        appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:92886460382:web:46805abb189415d0379f4f"
      };
      
      let tempApp;
      const existingApps = getApps();
      const tempAppName = 'temp-user-creation';
      
      if (existingApps.find(app => app.name === tempAppName)) {
        tempApp = existingApps.find(app => app.name === tempAppName);
      } else {
        tempApp = initializeApp(firebaseConfig, tempAppName);
      }
      
      const tempAuth = getAuth(tempApp);
      
      const userCredential = await createUserWithEmailAndPassword(
        tempAuth,
        formData.adminEmail,
        formData.adminPassword
      );
      
      const userUid = userCredential.user.uid;
      
      if (formData.adminName) {
        await updateProfile(userCredential.user, { displayName: formData.adminName });
      }
      
      await signOut(tempAuth);
      
      // Create admin user document with organizationId
      await createUserDocument(userUid, {
        email: formData.adminEmail,
        name: formData.adminName || formData.adminEmail.split('@')[0],
        phone: formData.adminPhone || '',
        role: 'admin',
        status: 'active',
        organizationId: orgId
      });

      clearCache('users');
      clearCache('organizations');
      
      setShowAddModal(false);
      resetForm();
      
      // Wait for Firestore to propagate
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await loadOrganizations(true);
      
      setTimeout(() => {
        alert(`✅ Organization "${formData.name.trim()}" and admin "${formData.adminEmail}" created successfully!`);
      }, 200);
    } catch (error) {
      console.error('Error creating organization:', error);
      let errorMsg = 'Failed to create organization.\n\n';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMsg += `Email ${formData.adminEmail} already exists in Firebase Authentication.`;
      } else {
        errorMsg += error.message || 'Please try again.';
      }
      
      setError(errorMsg);
      alert(errorMsg);
    }
  };

  const handleUpdateOrganization = async () => {
    try {
      setError(null);
      
      if (!formData.name || formData.name.trim() === '') {
        setError('Organization name is required.');
        return;
      }

      await updateDocument('organizations', selectedOrg.id, {
        name: formData.name.trim(),
        status: formData.status,
        updatedAt: new Date().toISOString()
      });

      clearCache('organizations');
      
      setShowEditModal(false);
      setSelectedOrg(null);
      resetForm();
      
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadOrganizations(true);
      
      setTimeout(() => {
        alert(`Organization "${formData.name}" updated successfully!`);
      }, 200);
    } catch (err) {
      setError('Failed to update organization. Please try again.');
      console.error('Error updating organization:', err);
    }
  };

  const handleDeleteOrganization = async (org) => {
    if (!window.confirm(`Are you sure you want to delete organization "${org.name}"?\n\nThis will NOT delete users associated with this organization.`)) {
      return;
    }

    try {
      setError(null);
      await deleteDocument('organizations', org.id);
      
      clearCache('organizations');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadOrganizations(true);
      
      setTimeout(() => {
        alert(`Organization "${org.name}" deleted successfully!`);
      }, 200);
    } catch (err) {
      setError('Failed to delete organization. Please try again.');
      console.error('Error deleting organization:', err);
    }
  };

  const handleViewOrganization = async (org) => {
    setSelectedOrg(org);
    await loadOrgUsers(org.id);
    setShowViewModal(true);
  };

  const handleEditOrganization = (org) => {
    setSelectedOrg(org);
    setFormData({
      name: org.name,
      status: org.status || 'active',
      adminName: '',
      adminEmail: '',
      adminPassword: '',
      adminPhone: ''
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      status: 'active',
      adminName: '',
      adminEmail: '',
      adminPassword: '',
      adminPhone: ''
    });
  };

  const stats = {
    total: organizationsWithAdmins.length,
    active: organizationsWithAdmins.filter(o => o.status === 'active').length,
    inactive: organizationsWithAdmins.filter(o => o.status === 'inactive').length
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="superadmin-orgs-container">
      <div className="superadmin-orgs-card">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Header */}
        <div className="superadmin-orgs-header">
          <div className="header-content">
            <div className="header-icon-wrapper">
              <FaBuilding className="header-icon" />
            </div>
            <div>
              <h1 className="superadmin-orgs-title">Organizations Management</h1>
              <p className="superadmin-orgs-subtitle">Manage all organizations and their admins</p>
            </div>
          </div>
          <div className="header-actions">
              <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                <FaPlus className="btn-icon" />
                Create Organization & Admin
              </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="orgs-stats-grid">
          <div 
            className={`org-stat-card ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Organizations</div>
          </div>
          <div 
            className={`org-stat-card ${filterStatus === 'active' ? 'active' : ''}`}
            onClick={() => setFilterStatus('active')}
          >
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">Active</div>
          </div>
          <div 
            className={`org-stat-card ${filterStatus === 'inactive' ? 'active' : ''}`}
            onClick={() => setFilterStatus('inactive')}
          >
            <div className="stat-value">{stats.inactive}</div>
            <div className="stat-label">Inactive</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="orgs-toolbar">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search organizations..." 
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
        <div className="orgs-table-container">
          {loading ? (
            <div className="loading-state">
              <FaSpinner className="spinner" />
              <p>Loading organizations...</p>
            </div>
          ) : (
            <table className="orgs-table">
              <thead>
                <tr>
                  <th>Organization Name</th>
                  <th>Admin Email</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrganizations.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-state">
                      No organizations found
                    </td>
                  </tr>
                ) : (
                  filteredOrganizations.map((org) => (
                    <tr key={org.id}>
                      <td>
                        <div className="org-name-cell">
                          <FaBuilding className="org-icon" />
                          <span>{org.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="admin-email">{org.adminEmail || '—'}</span>
                      </td>
                      <td>
                        <span className={`status-badge status-${org.status || 'active'}`}>
                          {org.status || 'active'}
                        </span>
                      </td>
                      <td>{formatDate(org.createdAt)}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="action-btn view-btn" 
                            title="View Details"
                            onClick={() => handleViewOrganization(org)}
                          >
                            <FaEye />
                          </button>
                          <button 
                            className="action-btn edit-btn" 
                            title="Edit"
                            onClick={() => handleEditOrganization(org)}
                          >
                            <FaEdit />
                          </button>
                          <button 
                            className="action-btn delete-btn" 
                            title="Delete"
                            onClick={() => handleDeleteOrganization(org)}
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

        {/* Pagination Info */}
        <div className="pagination-info">
          Showing {filteredOrganizations.length} of {organizationsWithAdmins.length} organizations
        </div>
      </div>

      {/* Create Organization Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Organization & Admin</h2>
              <button className="modal-close" onClick={() => { setShowAddModal(false); resetForm(); }}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Organization Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  onKeyDown={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  autoFocus
                  placeholder="Enter organization name"
                  required
                />
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
              <div style={{ 
                padding: '1rem', 
                background: '#f0f9ff', 
                borderRadius: '0.5rem', 
                marginBottom: '1rem',
                border: '1px solid #bae6fd'
              }}>
                <strong style={{ color: '#0369a1' }}>Organization Admin Details:</strong>
                <p style={{ fontSize: '0.875rem', color: '#075985', marginTop: '0.5rem' }}>
                  Create the main admin for this organization. This admin will manage the organization and can create teachers and students.
                </p>
              </div>
              <div className="form-group">
                <label>Admin Name *</label>
                <input
                  type="text"
                  value={formData.adminName}
                  onChange={(e) => setFormData({...formData, adminName: e.target.value})}
                  onKeyDown={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  placeholder="Enter admin full name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Admin Email *</label>
                <input
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({...formData, adminEmail: e.target.value})}
                  onBlur={(e) => {
                    e.stopPropagation();
                    handleEmailBlur(e, 'adminEmail');
                  }}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    handleEmailKeyDown(e, 'adminEmail');
                  }}
                  onFocus={(e) => e.stopPropagation()}
                  autoComplete="off"
                  placeholder="Enter admin email address (or username for @gmail.com)"
                  required
                />
              </div>
              <div className="form-group">
                <label>Admin Phone</label>
                <input
                  type="tel"
                  value={formData.adminPhone}
                  onChange={(e) => setFormData({...formData, adminPhone: e.target.value})}
                  onKeyDown={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  placeholder="Enter admin phone number"
                />
              </div>
              <div className="form-group">
                <label>Admin Password *</label>
                <input
                  type="password"
                  value={formData.adminPassword}
                  onChange={(e) => setFormData({...formData, adminPassword: e.target.value})}
                  onKeyDown={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  placeholder="Enter password (min 6 characters)"
                  required
                />
                <small style={{ color: '#6b7280', fontSize: '0.75rem', display: 'block', marginTop: '0.5rem' }}>
                  The admin will use this password to log in and manage the organization.
                </small>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => { setShowAddModal(false); resetForm(); }}>Cancel</button>
              <button className="btn-primary" onClick={handleCreateOrganization}>Create Organization & Admin</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Organization Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Organization</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Organization Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  onKeyDown={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  autoFocus
                  required
                />
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
              <button className="btn-primary" onClick={handleUpdateOrganization}>Update Organization</button>
            </div>
          </div>
        </div>
      )}

      {/* View Organization Modal */}
      {showViewModal && selectedOrg && (
        <div className="modal-overlay">
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedOrg.name} - Users</h2>
              <button className="modal-close" onClick={() => setShowViewModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="org-details">
                <div className="detail-item">
                  <strong>Status:</strong>
                  <span className={`status-badge status-${selectedOrg.status || 'active'}`}>
                    {selectedOrg.status || 'active'}
                  </span>
                </div>
                <div className="detail-item">
                  <strong>Created:</strong>
                  <span>{formatDate(selectedOrg.createdAt)}</span>
                </div>
              </div>
              
              <div className="users-section">
                <h3>Organization Users ({orgUsers.length})</h3>
                {orgUsers.length === 0 ? (
                  <div className="empty-state-small">
                    <p>No users in this organization yet</p>
                  </div>
                ) : (
                  <div className="users-list">
                    {orgUsers.map((user) => (
                      <div key={user.id} className="user-item">
                        <div className="user-info">
                          <div className="user-name">{user.name || user.email}</div>
                          <div className="user-email">{user.email}</div>
                        </div>
                        <div className="user-role-badge">
                          <span className={`role-badge role-${(user.role || 'student').toLowerCase()}`}>
                            {(user.role || 'student').toLowerCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowViewModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminOrganizations;

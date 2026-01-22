import { useState, useEffect } from 'react';
import { 
  FaUserShield,
  FaBuilding,
  FaPlus,
  FaSpinner,
  FaSearch,
  FaFilter
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { createUserDocument } from '../../services/authService';
import { getDocuments, createDocument, clearCache } from '../../services/firebaseService';
import { useAuth } from '../../context/AuthContext';
import './SuperAdminUsers.css';

const SuperAdminUsers = () => {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    organizationName: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    adminPhone: '',
    status: 'active'
  });

  useEffect(() => {
    if (!isSuperAdmin()) {
      navigate('/admin/dashboard');
      return;
    }
    loadOrganizations();
  }, [isSuperAdmin, navigate]);

  const loadOrganizations = async () => {
    try {
      const data = await getDocuments('organizations', [], { field: 'createdAt', direction: 'desc' }, 1000, false).catch(() => []);
      setOrganizations(data);
    } catch (error) {
      console.error('Error loading organizations:', error);
    }
  };

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || org.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreateOrganizationAdmin = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      setLoading(true);

      // Validation
      if (!formData.organizationName || formData.organizationName.trim() === '') {
        setError('Organization name is required.');
        return;
      }

      if (!formData.adminEmail || !formData.adminPassword) {
        setError('Admin email and password are required.');
        return;
      }

      if (formData.adminPassword.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }

      // Create organization document
      const orgData = {
        name: formData.organizationName.trim(),
        status: formData.status,
        createdAt: new Date().toISOString()
      };
      const orgId = await createDocument('organizations', orgData);
      console.log('Organization created:', orgId);

      // Create admin user in Firebase Auth
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
      
      setSuccess(`✅ Organization "${formData.organizationName}" and admin "${formData.adminEmail}" created successfully!`);
      
      // Reset form
      setFormData({
        organizationName: '',
        adminName: '',
        adminEmail: '',
        adminPassword: '',
        adminPhone: '',
        status: 'active'
      });

      setShowAddModal(false);

      // Wait for Firestore to propagate
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reload organizations
      await loadOrganizations();
    } catch (error) {
      console.error('Error creating organization admin:', error);
      let errorMsg = 'Failed to create organization admin.\n\n';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMsg += `Email ${formData.adminEmail} already exists in Firebase Authentication.`;
      } else {
        errorMsg += error.message || 'Please try again.';
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      organizationName: '',
      adminName: '',
      adminEmail: '',
      adminPassword: '',
      adminPhone: '',
      status: 'active'
    });
    setError(null);
    setSuccess(null);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="superadmin-users-container">
      <div className="superadmin-users-card">
        {/* Header */}
        <div className="superadmin-users-header">
          <div className="header-content">
            <div className="header-icon-wrapper">
              <FaUserShield className="header-icon" />
            </div>
            <div>
              <h1 className="superadmin-users-title">Organization Admin Management</h1>
              <p className="superadmin-users-subtitle">Create organizations and their main admins</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
              <FaPlus className="btn-icon" />
              Create Organization Admin
            </button>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        {success && (
          <div className="success-message">
            {success}
          </div>
        )}

        {/* Toolbar */}
        <div className="users-toolbar">
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

        {/* Organizations List */}
        <div className="organizations-table-container">
          {organizations.length === 0 ? (
            <div className="empty-state">
              <FaBuilding className="empty-icon" />
              <p>No organizations yet</p>
              <button 
                className="btn-primary"
                onClick={() => setShowAddModal(true)}
              >
                <FaPlus className="btn-icon" />
                Create First Organization Admin
              </button>
            </div>
          ) : (
            <table className="organizations-table">
              <thead>
                <tr>
                  <th>Organization Name</th>
                  <th>Admin Email</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrganizations.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty-state-cell">
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
                        <span className="admin-email">—</span>
                      </td>
                      <td>
                        <span className={`status-badge status-${org.status || 'active'}`}>
                          {org.status || 'active'}
                        </span>
                      </td>
                      <td>{formatDate(org.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Info */}
        <div className="pagination-info">
          Showing {filteredOrganizations.length} of {organizations.length} organizations
        </div>
      </div>

      {/* Create Organization Admin Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Organization Admin</h2>
              <button className="modal-close" onClick={() => { setShowAddModal(false); resetForm(); }}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreateOrganizationAdmin}>
                <div className="form-section">
                  <h3 className="form-section-title">
                    <FaBuilding className="section-icon" />
                    Organization Registration
                  </h3>
                  
                  <div className="form-group">
                    <label>Organization Name *</label>
                    <input
                      type="text"
                      value={formData.organizationName}
                      onChange={(e) => setFormData({...formData, organizationName: e.target.value})}
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
                </div>

                <div className="form-section">
                  <h3 className="form-section-title">
                    <FaUserShield className="section-icon" />
                    Organization Admin Credentials
                  </h3>
                  
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
                      placeholder="Enter admin email address (or username for @gmail.com)"
                      required
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
                      minLength={6}
                    />
                    <small style={{ color: '#6b7280', fontSize: '0.75rem', display: 'block', marginTop: '0.5rem' }}>
                      The admin will use this email and password to log in and manage the organization.
                    </small>
                  </div>

                  <div className="form-group">
                    <label>Admin Phone</label>
                    <input
                      type="tel"
                      value={formData.adminPhone}
                      onChange={(e) => setFormData({...formData, adminPhone: e.target.value})}
                      onKeyDown={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      placeholder="Enter admin phone number (optional)"
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button 
                    type="button"
                    className="btn-secondary" 
                    onClick={() => { setShowAddModal(false); resetForm(); }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="btn-icon spinner" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <FaPlus className="btn-icon" />
                        Create Organization & Admin
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminUsers;

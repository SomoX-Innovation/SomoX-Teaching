import { useState, useEffect } from 'react';
import { FaUsers, FaSearch, FaPlus, FaEdit, FaTrash, FaFilter, FaDownload, FaSpinner, FaSync } from 'react-icons/fa';
import { usersService, batchesService } from '../../services/firebaseService';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';
import { db } from '../../config/firebase';
import './AdminUsers.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('student'); // Default to 'student' to show only students
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [syncData, setSyncData] = useState({
    uid: '',
    email: '',
    name: '',
    role: 'admin'
  });
  const [syncing, setSyncing] = useState(false);
  const [batches, setBatches] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'student',
    status: 'active',
    password: '', // For new user creation
    batchIds: [] // Array of batch IDs for students
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    // Normalize role comparison (case-insensitive)
    const userRole = user.role ? user.role.toLowerCase() : 'student';
    // Default filter: only show students unless explicitly filtering for admins or all
    const matchesRole = filterRole === 'all' 
      ? true 
      : filterRole === 'admin' 
        ? userRole === 'admin'
        : userRole === 'student'; // Default: only students
    return matchesSearch && matchesStatus && matchesRole;
  });

  // Separate lists for students and admins (case-insensitive)
  const studentsList = users.filter(user => {
    const role = user.role ? user.role.toLowerCase() : 'student';
    return role === 'student';
  });
  const adminsList = users.filter(user => {
    const role = user.role ? user.role.toLowerCase() : 'student';
    return role === 'admin';
  });

  useEffect(() => {
    loadUsers();
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      const data = await batchesService.getAll();
      setBatches(data.filter(b => b.status === 'active')); // Only active batches
    } catch (err) {
      console.error('Error loading batches:', err);
    }
  };

  const loadUsers = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      
      // Small delay to ensure Firestore has updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Load users with a reasonable limit (1000) instead of all
      // For admin pages, you might want to implement pagination later
      const data = await usersService.getAll(1000);
      console.log('Raw users loaded from Firestore:', data.length);
      
      // Normalize role field to lowercase for consistency
      const normalizedData = data.map(user => ({
        ...user,
        role: user.role ? user.role.toLowerCase() : 'student'
      }));
      
      // Store ALL users in state
      setUsers(normalizedData);
      
      // Debug: Log user roles
      console.log('Total users loaded from Firestore:', normalizedData.length);
      console.log('Users by role:', {
        students: normalizedData.filter(u => u.role === 'student').length,
        admins: normalizedData.filter(u => u.role === 'admin').length,
        other: normalizedData.filter(u => u.role !== 'student' && u.role !== 'admin').length
      });
      console.log('All users with roles:', normalizedData.map(u => ({ 
        id: u.id, 
        email: u.email, 
        name: u.name, 
        role: u.role,
        status: u.status 
      })));
    } catch (err) {
      setError('Failed to load users. Please try again.');
      console.error('Error loading users from Firestore:', err);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleAddUser = async () => {
    try {
      setError(null);
      
      // Validate batch selection for students
      if (formData.role === 'student' && (!formData.batchIds || formData.batchIds.length === 0)) {
        setError('Students must be assigned to at least one batch.');
        return;
      }

      // Validate password if provided
      if (formData.password && formData.password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }

      // If password is provided, use Cloud Function to create user in both Auth and Firestore
      if (formData.password) {
        console.log('Creating user in Firebase Auth and Firestore via Cloud Function...');
        
        let cloudFunctionFailed = false;
        let funcError = null;
        
        try {
          const createUser = httpsCallable(functions, 'createUser');
          
          const result = await createUser({
            email: formData.email,
            password: formData.password,
            name: formData.name,
            role: formData.role,
            phone: formData.phone || '',
            status: formData.status,
            batchIds: formData.role === 'student' ? formData.batchIds : []
          });

          const { uid, email: createdEmail } = result.data;
          console.log('User created successfully via Cloud Function:', { uid, email: createdEmail });
          
          // Close modal and reset form
          setShowAddModal(false);
          resetForm();
          
          // Refresh user list
          await loadUsers(true);
          
          setTimeout(() => {
            alert(`User "${createdEmail}" created successfully!\n\nCreated in:\n- Firebase Authentication (UID: ${uid})\n- Firestore Database`);
          }, 200);
          return; // Success, exit early
        } catch (error) {
          funcError = error;
          console.error('Cloud Function error:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          console.error('Full error object:', JSON.stringify(error, null, 2));
          
          // Check if it's a CORS, network, or function not found error
          // Firebase Functions v2 returns 'functions/internal' for CORS/network errors
          const errorCode = error.code || '';
          const errorMessage = (error.message || '').toLowerCase();
          
          const isCorsError = 
            errorCode === 'functions/internal' ||
            errorCode === 'internal' ||
            errorCode === 'functions/not-found' ||
            errorCode === 'functions/unavailable' ||
            errorCode.includes('internal') ||
            errorMessage.includes('cors') || 
            errorMessage.includes('fetch') ||
            errorMessage.includes('failed to fetch') ||
            errorMessage.includes('network') ||
            errorMessage.includes('blocked');
          
          if (isCorsError) {
            cloudFunctionFailed = true;
            console.warn('✅ Cloud Function not available (CORS/not deployed), falling back to Firestore only...');
            console.warn('This usually means the function is not deployed or requires Blaze plan');
          } else {
            // Different error (like validation), re-throw it
            console.error('❌ Unexpected Cloud Function error (not CORS):', error);
            throw error;
          }
        }
        
        // If Cloud Function failed, create Firestore document only
        if (cloudFunctionFailed) {
          console.log('Creating Firestore document only (Cloud Function unavailable)...');
          
          const userData = {
            email: formData.email,
            name: formData.name,
            phone: formData.phone || '',
            role: formData.role,
            status: formData.status
          };

          if (formData.role === 'student' && formData.batchIds.length > 0) {
            userData.batchIds = formData.batchIds;
          }

          const docId = await usersService.create(userData);
          console.log('User created in Firestore with ID:', docId);
          
          setShowAddModal(false);
          resetForm();
          await loadUsers(true);
          
          setTimeout(() => {
            alert(`User "${formData.email}" created in Firestore!\n\nDocument ID: ${docId}\n\n⚠️ Cloud Function is not deployed (requires Blaze plan).\n\nTo create Firebase Auth account:\n1. Go to Firebase Console → Authentication → Users\n2. Click "Add User"\n3. Enter email: ${formData.email}\n4. Set password: ${formData.password}\n5. Copy the User UID\n6. Use "Sync Auth Users" button to link them`);
          }, 200);
          return;
        }
      } else {
        // No password provided - create only Firestore document
        console.log('Creating user in Firestore only (no password provided)...');
        
        const userData = {
          email: formData.email,
          name: formData.name,
          phone: formData.phone || '',
          role: formData.role,
          status: formData.status
        };

        // Add batchIds for students
        if (formData.role === 'student' && formData.batchIds.length > 0) {
          userData.batchIds = formData.batchIds;
        }

        const docId = await usersService.create(userData);
        console.log('User created in Firestore with ID:', docId);
        
        // Close modal and reset form
        setShowAddModal(false);
        const createdEmail = formData.email;
        resetForm();
        
        // Refresh user list
        await loadUsers(true);
        
        setTimeout(() => {
          alert(`User "${createdEmail}" created in Firestore!\n\nDocument ID: ${docId}\n\nNote: No Firebase Auth account created (no password provided).\n\nTo create Auth account later:\n1. Use "Sync Auth Users" button, OR\n2. Go to Firebase Console → Authentication → Add User`);
        }, 200);
      }
    } catch (err) {
      const errorMessage = err.message || err.details || 'Failed to create user. Please try again.';
      setError(errorMessage);
      console.error('Error creating user:', err);
      console.error('Error details:', {
        code: err.code,
        message: err.message,
        details: err.details
      });
      alert(`Error creating user: ${errorMessage}\n\nCheck the browser console for more details.`);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      status: user.status,
      batchIds: user.batchIds || []
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async () => {
    try {
      setError(null);

      // Validate batch selection for students
      if (formData.role === 'student' && (!formData.batchIds || formData.batchIds.length === 0)) {
        setError('Students must be assigned to at least one batch.');
        return;
      }

      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || '',
        role: formData.role,
        status: formData.status
      };

      // Add batchIds for students, remove for admins
      if (formData.role === 'student') {
        updateData.batchIds = formData.batchIds || [];
      } else {
        // Remove batchIds for non-students
        updateData.batchIds = [];
      }

      await usersService.update(selectedUser.id, updateData);
      
      // Close modal and reset first
      setShowEditModal(false);
      const updatedEmail = formData.email;
      setSelectedUser(null);
      resetForm();
      
      // Refresh user list immediately (with loading indicator)
      await loadUsers(true);
      
      // Show success message
      setTimeout(() => {
        alert(`User "${updatedEmail}" updated successfully!`);
      }, 200);
    } catch (err) {
      setError('Failed to update user. Please try again.');
      console.error('Error updating user:', err);
    }
  };

  const handleDeleteUser = async (user) => {
    if (window.confirm(`Are you sure you want to delete user "${user.name || user.email}"?`)) {
      try {
        setError(null);
        await usersService.delete(user.id);
        
        // Refresh user list immediately after deletion (with loading indicator)
        await loadUsers(true);
        
        // Show success message
        setTimeout(() => {
          alert(`User "${user.name || user.email}" deleted successfully!`);
        }, 200);
      } catch (err) {
        setError('Failed to delete user. Please try again.');
        console.error('Error deleting user:', err);
      }
    }
  };



  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'student',
      status: 'active',
      password: '',
      batchIds: []
    });
  };

  const getBatchNames = (batchIds) => {
    if (!batchIds || batchIds.length === 0) return 'No batches';
    return batchIds.map(id => {
      const batch = batches.find(b => b.id === id);
      return batch ? batch.number : 'Unknown';
    }).join(', ');
  };

  const handleBatchToggle = (batchId) => {
    const currentBatchIds = formData.batchIds || [];
    if (currentBatchIds.includes(batchId)) {
      setFormData({
        ...formData,
        batchIds: currentBatchIds.filter(id => id !== batchId)
      });
    } else {
      setFormData({
        ...formData,
        batchIds: [...currentBatchIds, batchId]
      });
    }
  };

  const stats = {
    total: users.length,
    students: users.filter(u => {
      const role = u.role ? u.role.toLowerCase() : 'student';
      return role === 'student';
    }).length,
    admins: users.filter(u => {
      const role = u.role ? u.role.toLowerCase() : 'student';
      return role === 'admin';
    }).length,
    active: users.filter(u => u.status === 'active').length
  };

  const handleSyncAuthUser = async () => {
    try {
      setError(null);
      setSyncing(true);

      if (!syncData.uid || !syncData.email) {
        setError('UID and Email are required.');
        return;
      }

      // Check if user document already exists
      const userRef = doc(db, 'users', syncData.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        // Update existing document
        await setDoc(userRef, {
          email: syncData.email,
          name: syncData.name || syncData.email.split('@')[0],
          role: syncData.role.toLowerCase(),
          status: 'active',
          updatedAt: serverTimestamp()
        }, { merge: true });
        alert(`User "${syncData.email}" updated successfully!`);
      } else {
        // Create new document
        await setDoc(userRef, {
          email: syncData.email,
          name: syncData.name || syncData.email.split('@')[0],
          role: syncData.role.toLowerCase(),
          status: 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        alert(`User "${syncData.email}" synced successfully!`);
      }

      // Reset form and reload
      setSyncData({ uid: '', email: '', name: '', role: 'admin' });
      setShowSyncModal(false);
      await loadUsers(true);
    } catch (err) {
      setError(err.message || 'Failed to sync user. Please try again.');
      console.error('Error syncing user:', err);
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    return timestamp;
  };

  const exportUsersToCSV = (usersToExport, filename) => {
    try {
      if (usersToExport.length === 0) {
        alert('No users to export.');
        return;
      }

      // Prepare data for export
      const exportData = usersToExport.map(user => ({
        Name: user.name || 'N/A',
        Email: user.email || 'N/A',
        Phone: user.phone || 'N/A',
        Role: user.role || 'N/A',
        Batches: user.role === 'student' ? getBatchNames(user.batchIds) : 'N/A',
        Status: user.status || 'N/A',
        'Joined Date': formatDate(user.createdAt || user.joined)
      }));

      // Convert to CSV format
      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header] || '';
            // Escape commas and quotes in values
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      // Add BOM for Excel compatibility (UTF-8)
      const BOM = '\uFEFF';
      const csvWithBOM = BOM + csvContent;

      // Create blob and download
      const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      return exportData.length;
    } catch (err) {
      console.error('Error exporting users:', err);
      throw err;
    }
  };

  const handleExportUsers = () => {
    try {
      const count = exportUsersToCSV(
        filteredUsers,
        `users_export_${new Date().toISOString().split('T')[0]}.csv`
      );
      alert(`Exported ${count} user(s) successfully!`);
    } catch (err) {
      setError('Failed to export users. Please try again.');
      alert('Failed to export users. Please check the console for details.');
    }
  };

  const handleExportStudents = () => {
    try {
      const count = exportUsersToCSV(
        studentsList,
        `students_export_${new Date().toISOString().split('T')[0]}.csv`
      );
      alert(`Exported ${count} student(s) successfully!`);
    } catch (err) {
      setError('Failed to export students. Please try again.');
      alert('Failed to export students. Please check the console for details.');
    }
  };

  const handleExportAdmins = () => {
    try {
      const count = exportUsersToCSV(
        adminsList,
        `admins_export_${new Date().toISOString().split('T')[0]}.csv`
      );
      alert(`Exported ${count} admin(s) successfully!`);
    } catch (err) {
      setError('Failed to export admins. Please try again.');
      alert('Failed to export admins. Please check the console for details.');
    }
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
          <div className="header-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <button 
                className="export-btn" 
                onClick={() => setShowExportMenu(!showExportMenu)}
                title="Export users to CSV"
              >
                <FaDownload className="btn-icon" />
                Export
              </button>
              {showExportMenu && (
                <>
                  <div 
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 9
                    }}
                    onClick={() => setShowExportMenu(false)}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.25rem',
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    zIndex: 10,
                    minWidth: '200px'
                  }}>
                    <button
                      onClick={() => {
                        handleExportUsers();
                        setShowExportMenu(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: 'none',
                        background: 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        borderBottom: '1px solid #e5e7eb'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                      Export All ({filteredUsers.length})
                    </button>
                    <button
                      onClick={() => {
                        handleExportStudents();
                        setShowExportMenu(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: 'none',
                        background: 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        borderBottom: '1px solid #e5e7eb'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                      Export Students ({studentsList.length})
                    </button>
                    <button
                      onClick={() => {
                        handleExportAdmins();
                        setShowExportMenu(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: 'none',
                        background: 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                      Export Admins ({adminsList.length})
                    </button>
                  </div>
                </>
              )}
            </div>
            <button 
              className="export-btn" 
              onClick={() => setShowSyncModal(true)}
              title="Sync Firebase Auth users with Firestore"
            >
              <FaSync className="btn-icon" />
              Sync Auth Users
            </button>
            <button className="add-user-btn" onClick={() => setShowAddModal(true)}>
              <FaPlus className="btn-icon" />
              Add User
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="users-stats-grid">
          <div 
            className={`users-stat-card ${filterRole === 'all' && filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => {
              setFilterRole('all');
              setFilterStatus('all');
            }}
            title="Show all users"
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => {
              if (filterRole !== 'all' || filterStatus !== 'all') {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div 
            className={`users-stat-card ${filterRole === 'student' ? 'active' : ''}`}
            onClick={() => {
              setFilterRole('student');
              setFilterStatus('all');
            }}
            title="Show only students"
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => {
              if (filterRole !== 'student') {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            <div className="stat-value">{stats.students}</div>
            <div className="stat-label">Students</div>
          </div>
          <div 
            className={`users-stat-card ${filterRole === 'admin' ? 'active' : ''}`}
            onClick={() => {
              setFilterRole('admin');
              setFilterStatus('all');
            }}
            title="Show only admins"
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => {
              if (filterRole !== 'admin') {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            <div className="stat-value">{stats.admins}</div>
            <div className="stat-label">Admins</div>
          </div>
          <div 
            className={`users-stat-card ${filterStatus === 'active' && filterRole === 'all' ? 'active' : ''}`}
            onClick={() => {
              setFilterStatus('active');
              setFilterRole('all'); // Show both admin and student when clicking active
            }}
            title="Show active users (both admin and student)"
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => {
              if (filterStatus !== 'active' || filterRole !== 'all') {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '';
            }}
          >
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
                  <th>Batches</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-state">
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
                        <span className={`role-badge role-${(user.role || 'student').toLowerCase()}`}>
                          {(user.role || 'student').toLowerCase()}
                        </span>
                      </td>
                      <td>
                        {user.role === 'student' ? (
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            {getBatchNames(user.batchIds)}
                          </div>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>—</span>
                        )}
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
                            className="action-btn delete-btn" 
                            title="Delete"
                            onClick={() => handleDeleteUser(user)}
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
            {users.length > 0 && (
              <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                (Total in Firestore: {users.length})
              </span>
            )}
            {(filterRole !== 'all' || filterStatus !== 'all') && (
              <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                - Filtered: {filterRole !== 'all' ? filterRole : ''} {filterStatus !== 'all' ? filterStatus : ''}
              </span>
            )}
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
                  onChange={(e) => {
                    const newRole = e.target.value;
                    setFormData({
                      ...formData, 
                      role: newRole,
                      batchIds: newRole === 'student' ? formData.batchIds : [] // Clear batches if not student
                    });
                  }}
                >
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {formData.role === 'student' && (
                <div className="form-group">
                  <label>Batches * (Select one or more)</label>
                  <div style={{
                    maxHeight: '200px',
                    overflowY: 'auto',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    background: '#f9fafb'
                  }}>
                    {batches.length === 0 ? (
                      <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                        No active batches available. Create batches first.
                      </div>
                    ) : (
                      batches.map(batch => (
                        <label
                          key={batch.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.5rem',
                            cursor: 'pointer',
                            borderRadius: '0.375rem',
                            marginBottom: '0.25rem'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <input
                            type="checkbox"
                            checked={formData.batchIds?.includes(batch.id) || false}
                            onChange={() => handleBatchToggle(batch.id)}
                            style={{
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer',
                              accentColor: '#3b82f6'
                            }}
                          />
                          <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                            {batch.number}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                  {formData.batchIds?.length > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
                      Selected: {formData.batchIds.map(id => {
                        const batch = batches.find(b => b.id === id);
                        return batch?.number;
                      }).filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>
              )}
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
                <label>Password (Optional - Creates Auth account if Cloud Function is deployed)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Enter password to create Firebase Auth account (min 6 characters)"
                />
                <small style={{ color: '#6b7280', fontSize: '0.75rem', display: 'block', marginTop: '0.5rem' }}>
                  <strong>If password provided:</strong> Will attempt to create user in both Firebase Auth and Firestore via Cloud Function.
                  <br />
                  <strong>If Cloud Function not deployed:</strong> Will create Firestore document only. You can then use "Sync Auth Users" button.
                  <br />
                  <strong>If no password:</strong> Creates Firestore document only. Create Auth account manually in Firebase Console.
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
                  onChange={(e) => {
                    const newRole = e.target.value;
                    setFormData({
                      ...formData, 
                      role: newRole,
                      batchIds: newRole === 'student' ? formData.batchIds : [] // Clear batches if not student
                    });
                  }}
                >
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {formData.role === 'student' && (
                <div className="form-group">
                  <label>Batches * (Select one or more)</label>
                  <div style={{
                    maxHeight: '200px',
                    overflowY: 'auto',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    background: '#f9fafb'
                  }}>
                    {batches.length === 0 ? (
                      <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                        No active batches available. Create batches first.
                      </div>
                    ) : (
                      batches.map(batch => (
                        <label
                          key={batch.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.5rem',
                            cursor: 'pointer',
                            borderRadius: '0.375rem',
                            marginBottom: '0.25rem'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <input
                            type="checkbox"
                            checked={formData.batchIds?.includes(batch.id) || false}
                            onChange={() => handleBatchToggle(batch.id)}
                            style={{
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer',
                              accentColor: '#3b82f6'
                            }}
                          />
                          <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                            {batch.number}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                  {formData.batchIds?.length > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
                      Selected: {formData.batchIds.map(id => {
                        const batch = batches.find(b => b.id === id);
                        return batch?.number;
                      }).filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>
              )}
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

      {/* Sync Auth User Modal */}
      {showSyncModal && (
        <div className="modal-overlay" onClick={() => setShowSyncModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Sync Firebase Auth User</h2>
              <button className="modal-close" onClick={() => setShowSyncModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ 
                padding: '1rem', 
                background: 'rgba(59, 130, 246, 0.1)', 
                borderRadius: '0.5rem', 
                marginBottom: '1.5rem',
                fontSize: '0.875rem',
                color: '#1e40af'
              }}>
                <strong>Instructions:</strong> If you have admin users in Firebase Authentication but they're not showing in the list, use this form to create their Firestore documents.
                <br /><br />
                <strong>To find the User UID:</strong> Go to Firebase Console → Authentication → Users, then copy the User UID for the admin user.
              </div>
              <div className="form-group">
                <label>User UID * (from Firebase Auth)</label>
                <input
                  type="text"
                  value={syncData.uid}
                  onChange={(e) => setSyncData({...syncData, uid: e.target.value})}
                  placeholder="e.g., 0OcmZaE3IONm0jKbU6quT7..."
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={syncData.email}
                  onChange={(e) => setSyncData({...syncData, email: e.target.value})}
                  placeholder="admin@gmail.com"
                  required
                />
              </div>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={syncData.name}
                  onChange={(e) => setSyncData({...syncData, name: e.target.value})}
                  placeholder="Admin Name (optional)"
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={syncData.role}
                  onChange={(e) => setSyncData({...syncData, role: e.target.value})}
                >
                  <option value="admin">Admin</option>
                  <option value="student">Student</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => {
                setShowSyncModal(false);
                setSyncData({ uid: '', email: '', name: '', role: 'admin' });
              }}>Cancel</button>
              <button 
                className="btn-primary" 
                onClick={handleSyncAuthUser}
                disabled={syncing}
              >
                {syncing ? (
                  <>
                    <FaSpinner className="spinner" style={{ marginRight: '0.5rem' }} />
                    Syncing...
                  </>
                ) : (
                  'Sync User'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminUsers;

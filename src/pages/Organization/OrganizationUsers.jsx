import { useState, useEffect } from 'react';
import { FaUsers, FaSearch, FaPlus, FaEdit, FaTrash, FaFilter, FaDownload, FaSpinner } from 'react-icons/fa';
import { usersService, coursesService, clearCache } from '../../services/firebaseService';
import { createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { createUserDocument } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import './OrganizationUsers.css';

const OrganizationUsers = () => {
  const { user: currentUser, isSuperAdmin, getOrganizationId } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('all'); // Default to 'all' to show admins, teachers, and students
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'student',
    status: 'active',
    password: '', // For new user creation
    classIds: [], // Array of class IDs for students
    organizationId: '', // Organization ID for admins
    organizationName: '' // For creating new organization (superAdmin only)
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    // Normalize role comparison (case-insensitive)
    const userRole = user.role ? user.role.toLowerCase() : 'student';
    // Filter by role: admins, students, and teachers are shown
    const matchesRole = filterRole === 'all' 
      ? true 
      : filterRole === 'admin' 
        ? userRole === 'admin'
        : filterRole === 'teacher'
        ? userRole === 'teacher'
        : userRole === 'student'; // Only students if not 'all', 'admin', or 'teacher'
    return matchesSearch && matchesStatus && matchesRole;
  });

  // Separate lists for students, admins, and teachers
  const studentsList = users.filter(user => {
    const role = user.role ? user.role.toLowerCase() : 'student';
    return role === 'student';
  });
  const adminsList = users.filter(user => {
    const role = user.role ? user.role.toLowerCase() : 'student';
    return role === 'admin';
  });
  const teachersList = users.filter(user => {
    const role = user.role ? user.role.toLowerCase() : 'student';
    return role === 'teacher';
  });

  useEffect(() => {
    loadUsers();
    loadCourses();
    if (isSuperAdmin()) {
      loadOrganizations();
    }
  }, [currentUser]);

  const loadCourses = async () => {
    try {
      const orgId = getOrganizationId();
      const data = await coursesService.getAll(1000, orgId);
      setCourses(data.filter(c => c.status === 'active' || c.status === 'published')); // Only active/published classes
    } catch (err) {
      console.error('Error loading classes:', err);
    }
  };

  const loadOrganizations = async () => {
    try {
      // Load organizations collection (for superAdmin)
      const { getDocuments } = await import('../../services/firebaseService');
      const orgs = await getDocuments('organizations', [], { field: 'createdAt', direction: 'desc' }, null);
      setOrganizations(orgs);
    } catch (err) {
      console.error('Error loading organizations:', err);
    }
  };

  const loadUsers = async (showLoading = true, forceRefresh = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      
      // Clear cache if forcing refresh
      if (forceRefresh) {
        clearCache('users');
      }
      
      // Small delay to ensure Firestore has updated
      await new Promise(resolve => setTimeout(resolve, forceRefresh ? 500 : 300));
      
      // Load users filtered by organization
      // SuperAdmin can see all users, Organization Admin sees only their org's users
      const orgId = isSuperAdmin() ? null : getOrganizationId();
      const data = await usersService.getAll(1000, orgId, !forceRefresh);
      console.log('Raw users loaded from Firestore:', data.length, orgId ? `(org: ${orgId})` : '(all orgs)');
      
      // Normalize role field to lowercase for consistency
      const normalizedData = data.map(user => ({
        ...user,
        role: user.role ? user.role.toLowerCase() : 'student'
      }));
      
      // Filter: Only show users from the current organization admin's organization
      // AND only show admins, students, and teachers (exclude other roles)
      let filteredData = normalizedData;
      
      if (!isSuperAdmin()) {
        // For organization admins: only show users from their organization
        const currentOrgId = getOrganizationId();
        filteredData = normalizedData.filter(user => {
          // Must belong to the same organization
          const userOrgId = user.organizationId || '';
          const matchesOrg = userOrgId === currentOrgId;
          
          // Must be either 'admin', 'student', or 'teacher' role
          const role = user.role ? user.role.toLowerCase() : 'student';
          const isAdminStudentOrTeacher = role === 'admin' || role === 'student' || role === 'teacher';
          
          return matchesOrg && isAdminStudentOrTeacher;
        });
        
        console.log(`Filtered to ${filteredData.length} users from organization ${currentOrgId} (admins, students, and teachers)`);
      } else {
        // For SuperAdmin: show all admins, students, and teachers
        filteredData = normalizedData.filter(user => {
          const role = user.role ? user.role.toLowerCase() : 'student';
          return role === 'admin' || role === 'student' || role === 'teacher';
        });
        
        console.log(`Filtered to ${filteredData.length} users (admins, students, and teachers, all orgs)`);
      }
      
      // Store filtered users in state
      setUsers(filteredData);
      
      // Debug: Log user roles
      console.log('Total users after filtering:', filteredData.length);
      console.log('Users by role:', {
        students: filteredData.filter(u => u.role === 'student').length,
        admins: filteredData.filter(u => u.role === 'admin').length,
        teachers: filteredData.filter(u => u.role === 'teacher').length,
        filteredOut: normalizedData.length - filteredData.length
      });
      console.log('All users with roles:', filteredData.map(u => ({ 
        id: u.id, 
        email: u.email, 
        name: u.name, 
        role: u.role,
        organizationId: u.organizationId,
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

  const handleEmailBlur = (e, fieldName = 'email') => {
    const value = e.target.value.trim();
    // Only auto-fill if there's a non-empty value without @
    if (value && value.length > 0 && !value.includes('@')) {
      setFormData({...formData, [fieldName]: `${value}@gmail.com`});
    } else if (!value || value.length === 0) {
      // Explicitly clear the field if it's empty
      setFormData({...formData, [fieldName]: ''});
    }
  };

  const handleEmailKeyDown = (e, fieldName = 'email') => {
    if (e.key === 'Tab' || e.key === 'Enter') {
      const value = formData[fieldName]?.trim() || '';
      if (value && !value.includes('@')) {
        e.preventDefault();
        setFormData({...formData, [fieldName]: `${value}@gmail.com`});
        // Move focus to next field after a brief delay
        setTimeout(() => {
          const form = e.target.form || e.target.closest('form');
          if (form) {
            const inputs = form.querySelectorAll('input, select, textarea');
            if (inputs && inputs.length > 0) {
              const inputsArray = Array.from(inputs);
              const currentIndex = inputsArray.indexOf(e.target);
              if (currentIndex >= 0 && inputsArray[currentIndex + 1]) {
                inputsArray[currentIndex + 1].focus();
              }
            }
          }
        }, 10);
      }
    }
  };

  const handleAddUser = async () => {
    try {
      setError(null);
      
      // Validate class selection for students
      if (formData.role === 'student' && (!formData.classIds || formData.classIds.length === 0)) {
        setError('Students must be assigned to at least one class.');
        return;
      }

      // Password is REQUIRED for students to enable login
      if (formData.role === 'student' && (!formData.password || formData.password.trim() === '')) {
        setError('Password is required for students to enable login access.');
        return;
      }
      
      // Password is optional for admins and teachers

      // Validate password if provided
      if (formData.password && formData.password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }

      // Create user using client-side Firebase Auth (no Cloud Functions needed)
      // Use a separate Firebase app instance to avoid affecting admin's session
      if (formData.password) {
        try {
          console.log('Creating user in Firebase Auth and Firestore (client-side)...');
          
          // Create a separate Firebase app instance for user creation
          // This prevents the admin from being signed out
          const firebaseConfig = {
            apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDcox9e0ohy1lFFiQX5KvzRv5c7Ulv4M9A",
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "somoxlean.firebaseapp.com",
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "somoxlean",
            storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "somoxlean.firebasestorage.app",
            messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "92886460382",
            appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:92886460382:web:46805abb189415d0379f4f"
          };
          
          // Create a separate app instance (or reuse if exists)
          let tempApp;
          const existingApps = getApps();
          const tempAppName = 'temp-user-creation';
          
          if (existingApps.find(app => app.name === tempAppName)) {
            tempApp = existingApps.find(app => app.name === tempAppName);
          } else {
            tempApp = initializeApp(firebaseConfig, tempAppName);
          }
          
          const tempAuth = getAuth(tempApp);
          
          // Create user Auth account in the separate app instance
          // This won't affect the admin's session in the main app
          const userCredential = await createUserWithEmailAndPassword(
            tempAuth,
            formData.email,
            formData.password
          );
          
          const userUid = userCredential.user.uid;
          console.log('User Auth account created:', userUid);
          
          // Update display name if provided
          if (formData.name) {
            await updateProfile(userCredential.user, { displayName: formData.name });
          }
          
          // Sign out from the temp app (doesn't affect main app)
          await signOut(tempAuth);
          console.log('Signed out from temp app');
          
          // Create Firestore document with user's UID
          const userData = {
            email: formData.email,
            name: formData.name,
            phone: formData.phone || '',
            role: formData.role,
            status: formData.status
          };
          
          // Set organizationId based on role and current user
          if (isSuperAdmin()) {
            // SuperAdmin creating first admin of an organization
            if (formData.role === 'admin' && formData.organizationId) {
              userData.organizationId = formData.organizationId;
            } else if (formData.role === 'student' || formData.role === 'teacher') {
              // SuperAdmin can create students/teachers without org (or assign to org)
              if (formData.organizationId) {
                userData.organizationId = formData.organizationId;
              }
            }
          } else {
            // Organization Admin - all users (students, teachers, admins) belong to their organization
            const orgId = getOrganizationId();
            if (orgId) {
              userData.organizationId = orgId;
            }
          }
          
          if (formData.role === 'student' && formData.classIds.length > 0) {
            userData.classIds = formData.classIds;
          }
          
          // Use the user's UID as document ID
          await createUserDocument(userUid, userData);
          console.log('User Firestore document created with UID:', userUid, 'orgId:', userData.organizationId);
          
          // Clear cache immediately after creating user
          clearCache('users');
          
          // Close modal and reset form
          setShowAddModal(false);
          resetForm();
          
          // Clear search term to ensure new user is visible
          setSearchTerm('');
          
          // Wait longer for Firestore to propagate the write
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Refresh user list with force refresh
          await loadUsers(true, true);
          
          setTimeout(() => {
            alert(`✅ User "${formData.email}" created successfully!\n\nCreated in:\n- Firebase Authentication (UID: ${userUid})\n- Firestore Database`);
          }, 200);
          
          return; // Success - admin stays logged in!
        } catch (authError) {
          console.error('Error creating user:', authError);
          
          let errorMsg = 'Failed to create user account.\n\n';
          
          if (authError.code === 'auth/email-already-exists' || authError.code === 'auth/email-already-in-use') {
            errorMsg += `Email ${formData.email} already exists in Firebase Authentication.\n\n`;
            errorMsg += 'To fix:\n';
            errorMsg += '1. Go to Firebase Console → Authentication → Users\n';
            errorMsg += `2. Find user with email: ${formData.email}\n`;
            errorMsg += '3. Copy the User UID\n';
            errorMsg += '4. Create Firestore document in "users" collection with that UID as document ID\n';
            errorMsg += `5. Set fields: email="${formData.email}", name="${formData.name}", role="${formData.role}", status="${formData.status}"\n`;
            if (formData.role === 'student' && formData.classIds.length > 0) {
              errorMsg += `6. Set classIds: [${formData.classIds.join(', ')}]`;
            }
          } else if (authError.code === 'auth/invalid-email') {
            errorMsg += 'Invalid email address format.';
          } else if (authError.code === 'auth/weak-password') {
            errorMsg += 'Password is too weak. Please use a stronger password (at least 6 characters).';
          } else {
            errorMsg += `Error: ${authError.message}\n\n`;
            errorMsg += 'Please try again or create the Auth account manually:\n';
            errorMsg += '1. Go to Firebase Console → Authentication → Users\n';
            errorMsg += '2. Click "Add User"\n';
            errorMsg += `3. Email: ${formData.email}\n`;
            errorMsg += `4. Password: ${formData.password}\n`;
            errorMsg += '5. Copy the User UID\n';
            errorMsg += '6. Create Firestore document with that UID';
          }
          
          setError(errorMsg);
          alert(errorMsg);
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

        // Add classIds for students
        if (formData.role === 'student' && formData.classIds.length > 0) {
          userData.classIds = formData.classIds;
        }

        const docId = await usersService.create(userData);
        console.log('User created in Firestore with ID:', docId);
        
        // Clear cache immediately after creating user (usersService.create already clears cache, but ensure it)
        clearCache('users');
        
        // Close modal and reset form
        setShowAddModal(false);
        const createdEmail = formData.email;
        resetForm();
        
        // Clear search term to ensure new user is visible
        setSearchTerm('');
        
        // Wait longer for Firestore to propagate the write
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Refresh user list with force refresh
        await loadUsers(true, true);
        
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
      classIds: user.classIds || []
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async () => {
    try {
      setError(null);

      // Validate class selection for students
      if (formData.role === 'student' && (!formData.classIds || formData.classIds.length === 0)) {
        setError('Students must be assigned to at least one class.');
        return;
      }

      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || '',
        role: formData.role,
        status: formData.status
      };

        // Add classIds for students, remove for admins/teachers
        if (formData.role === 'student') {
          updateData.classIds = formData.classIds || [];
        } else {
          // Remove classIds for admins/teachers
          updateData.classIds = [];
        }

      await usersService.update(selectedUser.id, updateData);
      
      // Clear cache immediately after updating user
      clearCache('users');
      
      // Close modal and reset first
      setShowEditModal(false);
      const updatedEmail = formData.email;
      setSelectedUser(null);
      resetForm();
      
      // Refresh user list immediately (with loading indicator and force refresh)
      await loadUsers(true, true);
      
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
        
        // Clear cache immediately after deleting user
        clearCache('users');
        
        // Refresh user list immediately after deletion (with loading indicator and force refresh)
        await loadUsers(true, true);
        
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
      classIds: [],
      organizationId: '',
      organizationName: ''
    });
  };

  const handleCreateOrganization = async () => {
    try {
      setError(null);
      
      if (!formData.organizationName || formData.organizationName.trim() === '') {
        setError('Organization name is required.');
        return;
      }

      if (!formData.email || !formData.password) {
        setError('Admin email and password are required to create the first admin.');
        return;
      }

      // Create organization document
      const { createDocument } = await import('../../services/firebaseService');
      const orgData = {
        name: formData.organizationName,
        createdAt: new Date().toISOString(),
        status: 'active'
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
        formData.email,
        formData.password
      );
      
      const userUid = userCredential.user.uid;
      
      if (formData.name) {
        await updateProfile(userCredential.user, { displayName: formData.name });
      }
      
      await signOut(tempAuth);
      
      // Create admin user document with organizationId
      await createUserDocument(userUid, {
        email: formData.email,
        name: formData.name || formData.email.split('@')[0],
        phone: formData.phone || '',
        role: 'admin',
        status: 'active',
        organizationId: orgId
      });

      setShowCreateOrgModal(false);
      resetForm();
      
      // Clear cache immediately after creating user
      clearCache('users');
      
      // Clear search term to ensure new user is visible
      setSearchTerm('');
      
      // Wait longer for Firestore to propagate the write
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await loadOrganizations();
      await loadUsers(true, true);
      
      setTimeout(() => {
        alert(`✅ Organization "${formData.organizationName}" and admin "${formData.email}" created successfully!`);
      }, 200);
    } catch (error) {
      console.error('Error creating organization:', error);
      setError(`Failed to create organization: ${error.message}`);
      alert(`Error: ${error.message}`);
    }
  };

  const getClassNames = (classIds) => {
    if (!classIds || classIds.length === 0) return 'No classes';
    return classIds.map(id => {
      const course = courses.find(c => c.id === id);
      return course ? course.title || course.name : 'Unknown';
    }).join(', ');
  };

  const handleClassToggle = (classId) => {
    const currentClassIds = formData.classIds || [];
    if (currentClassIds.includes(classId)) {
      setFormData({
        ...formData,
        classIds: currentClassIds.filter(id => id !== classId)
      });
    } else {
      setFormData({
        ...formData,
        classIds: [...currentClassIds, classId]
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
    teachers: users.filter(u => {
      const role = u.role ? u.role.toLowerCase() : 'student';
      return role === 'teacher';
    }).length,
    active: users.filter(u => u.status === 'active').length
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
        Classes: user.role === 'student' ? getClassNames(user.classIds || user.batchIds) : 'N/A',
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

  const handleExportTeachers = () => {
    try {
      const count = exportUsersToCSV(
        teachersList,
        `teachers_export_${new Date().toISOString().split('T')[0]}.csv`
      );
      alert(`Exported ${count} teacher(s) successfully!`);
    } catch (err) {
      setError('Failed to export teachers. Please try again.');
      alert('Failed to export teachers. Please check the console for details.');
    }
  };

  return (
    <div className="organization-users-container">
      <div className="organization-users-card">
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
        <div className="organization-users-header">
          <div className="header-content">
            <div className="header-icon-wrapper">
              <FaUsers className="header-icon" />
            </div>
            <div>
              <h1 className="organization-users-title">Users Management</h1>
              <p className="organization-users-subtitle">Manage all users, students, and administrators</p>
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
                    <button
                      onClick={() => {
                        handleExportTeachers();
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
                      Export Teachers ({teachersList.length})
                    </button>
                  </div>
                </>
              )}
            </div>
            {isSuperAdmin() && (
              <button 
                className="add-user-btn" 
                onClick={() => setShowCreateOrgModal(true)}
                style={{ marginRight: '0.5rem', background: '#10b981' }}
              >
                <FaPlus className="btn-icon" />
                Create Organization
              </button>
            )}
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
            className={`users-stat-card ${filterRole === 'teacher' ? 'active' : ''}`}
            onClick={() => {
              setFilterRole('teacher');
              setFilterStatus('all');
            }}
            title="Show only teachers"
            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => {
              if (filterRole !== 'teacher') {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            <div className="stat-value">{stats.teachers}</div>
            <div className="stat-label">Teachers</div>
          </div>
          <div 
            className={`users-stat-card ${filterStatus === 'active' && filterRole === 'all' ? 'active' : ''}`}
            onClick={() => {
              setFilterStatus('active');
              setFilterRole('all'); // Show both admin and student when clicking active
            }}
            title="Show active users"
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
                  <th>Classes</th>
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
                            {getClassNames(user.classIds || user.batchIds)}
                          </div>
                        ) : user.role === 'teacher' || user.role === 'admin' ? (
                          <span style={{ color: '#9ca3af' }}>—</span>
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
        <div className="modal-overlay">
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
                  onKeyDown={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  autoFocus
                  placeholder="Enter full name"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  onBlur={(e) => {
                    e.stopPropagation();
                    handleEmailBlur(e, 'email');
                  }}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    handleEmailKeyDown(e, 'email');
                  }}
                  onFocus={(e) => e.stopPropagation()}
                  autoComplete="off"
                  placeholder="Enter email address (or username for @gmail.com)"
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  onKeyDown={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
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
                      classIds: newRole === 'student' ? formData.classIds : [], // Clear classes if not student
                      organizationId: newRole === 'admin' && isSuperAdmin() ? formData.organizationId : '' // Keep org for superAdmin creating admin
                    });
                  }}
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {isSuperAdmin() && formData.role === 'admin' && (
                <div className="form-group">
                  <label>Organization *</label>
                  <select
                    value={formData.organizationId}
                    onChange={(e) => setFormData({...formData, organizationId: e.target.value})}
                    required
                  >
                    <option value="">Select Organization</option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                  <small style={{ color: '#6b7280', fontSize: '0.75rem', display: 'block', marginTop: '0.5rem' }}>
                    Select the organization this admin will manage. This admin can then create other admins, teachers, and students for this organization.
                  </small>
                </div>
              )}
              {formData.role === 'student' && (
                <div className="form-group">
                  <label>Classes * (Select one or more)</label>
                  <div style={{
                    maxHeight: '200px',
                    overflowY: 'auto',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    background: '#f9fafb'
                  }}>
                    {courses.length === 0 ? (
                      <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                        No active classes available. Create classes first.
                      </div>
                    ) : (
                      courses.map(course => (
                        <label
                          key={course.id}
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
                            checked={formData.classIds?.includes(course.id) || false}
                            onChange={() => handleClassToggle(course.id)}
                            style={{
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer',
                              accentColor: '#3b82f6'
                            }}
                          />
                          <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                            {course.title || course.name || 'Untitled'}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                  {formData.classIds?.length > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
                      Selected: {formData.classIds.map(id => {
                        const course = courses.find(c => c.id === id);
                        return course?.title || course?.name;
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
                <label>
                  Password {formData.role === 'student' && <span style={{ color: '#ef4444' }}>*</span>}
                  {formData.role === 'student' && <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: '0.5rem' }}>(Required for login)</span>}
                  {formData.role === 'admin' && <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: '0.5rem' }}>(Optional)</span>}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  onKeyDown={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  placeholder={formData.role === 'student' ? "Enter password (required, min 6 characters)" : "Enter password (optional, min 6 characters)"}
                  required={formData.role === 'student'}
                />
                <small style={{ color: '#6b7280', fontSize: '0.75rem', display: 'block', marginTop: '0.5rem' }}>
                  {formData.role === 'student' ? (
                    <>
                      <strong style={{ color: '#ef4444' }}>Required:</strong> Students need a password to log in to the system.
                      <br />
                      <strong>How it works:</strong> Creates user in both Firebase Authentication and Firestore.
                      <br />
                      <strong>Note:</strong> If not working, you may need to create the Auth account manually in Firebase Console.
                    </>
                  ) : (
                    <>
                      <strong>Optional:</strong> If provided, will create user in both Firebase Auth and Firestore.
                      <br />
                      <strong>If no password:</strong> Creates Firestore document only. Admin can log in if Auth account exists separately.
                    </>
                  )}
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

      {/* Create Organization Modal */}
      {showCreateOrgModal && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Organization</h2>
              <button className="modal-close" onClick={() => setShowCreateOrgModal(false)}>×</button>
            </div>
            <div className="modal-body">
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
              <div style={{ 
                padding: '1rem', 
                background: '#f0f9ff', 
                borderRadius: '0.5rem', 
                marginBottom: '1rem',
                border: '1px solid #bae6fd'
              }}>
                <strong style={{ color: '#0369a1' }}>First Admin Details:</strong>
                <p style={{ fontSize: '0.875rem', color: '#075985', marginTop: '0.5rem' }}>
                  You need to create the first admin for this organization. This admin will be able to manage the organization and create other admins.
                </p>
              </div>
              <div className="form-group">
                <label>Admin Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  onKeyDown={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  autoFocus
                  placeholder="Enter admin full name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Admin Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  onBlur={(e) => {
                    e.stopPropagation();
                    handleEmailBlur(e, 'email');
                  }}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    handleEmailKeyDown(e, 'email');
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
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  onKeyDown={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  placeholder="Enter admin phone number"
                />
              </div>
              <div className="form-group">
                <label>Admin Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
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
              <button className="btn-secondary" onClick={() => setShowCreateOrgModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreateOrganization}>Create Organization</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="modal-overlay">
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
                  onKeyDown={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  onKeyDown={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  autoComplete="off"
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  onKeyDown={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
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
                      classIds: newRole === 'student' ? formData.classIds : [] // Clear classes if not student
                    });
                  }}
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {formData.role === 'student' && (
                <div className="form-group">
                  <label>Classes * (Select one or more)</label>
                  <div style={{
                    maxHeight: '200px',
                    overflowY: 'auto',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    background: '#f9fafb'
                  }}>
                    {courses.length === 0 ? (
                      <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                        No active classes available. Create classes first.
                      </div>
                    ) : (
                      courses.map(course => (
                        <label
                          key={course.id}
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
                            checked={formData.classIds?.includes(course.id) || false}
                            onChange={() => handleClassToggle(course.id)}
                            style={{
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer',
                              accentColor: '#3b82f6'
                            }}
                          />
                          <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                            {course.title || course.name || 'Untitled'}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                  {formData.classIds?.length > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
                      Selected: {formData.classIds.map(id => {
                        const course = courses.find(c => c.id === id);
                        return course?.title || course?.name;
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

    </div>
  );
};

export default OrganizationUsers;

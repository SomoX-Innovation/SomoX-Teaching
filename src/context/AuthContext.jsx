import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { getUserRole } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get user data from Firestore (role, organizationId, etc.)
        try {
          const { getUserData } = await import('../services/authService');
          const userDataFromFirestore = await getUserData(firebaseUser.uid);
          // Get role from Firestore
          const role = userDataFromFirestore.role || 'student';
          
          // Normalize role: handle case variations but keep superAdmin as 'superAdmin'
          let normalizedRole = role;
          if (typeof role === 'string') {
            const lowerRole = role.toLowerCase();
            if (lowerRole === 'superadmin') {
              normalizedRole = 'superAdmin'; // Keep exact case for superAdmin
            } else {
              normalizedRole = lowerRole; // Normalize others to lowercase
            }
          }
          
          const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || userDataFromFirestore.name || firebaseUser.email?.split('@')[0] || 'User',
            role: normalizedRole,
            organizationId: userDataFromFirestore.organizationId || null
          };
          
          console.log('🔐 Auth Context - User loaded:', {
            uid: userData.uid,
            email: userData.email,
            role: userData.role,
            roleFromFirestore: role,
            isSuperAdmin: normalizedRole === 'superAdmin' || normalizedRole.toLowerCase() === 'superadmin'
          });
          
          setUser(userData);
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Default to student if fetch fails
          const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            role: 'student',
            organizationId: null
          };
          setUser(userData);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const isSuperAdmin = () => {
    const role = user?.role?.toLowerCase();
    return role === 'superadmin';
  };

  const isAdmin = () => {
    return user?.role === 'admin' || user?.role === 'superAdmin';
  };

  const isOrganizationAdmin = () => {
    return user?.role === 'admin';
  };

  const isStudent = () => {
    return user?.role === 'student';
  };

  const isTeacher = () => {
    return user?.role === 'teacher';
  };

  const getOrganizationId = () => {
    return user?.organizationId || null;
  };

  const value = {
    user,
    logout,
    isAdmin,
    isSuperAdmin,
    isOrganizationAdmin,
    isStudent,
    isTeacher,
    getOrganizationId,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


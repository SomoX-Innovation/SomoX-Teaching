import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { db, auth } from '../config/firebase';

/**
 * Get user data from Firestore (role, organizationId, etc.)
 * @param {string} userId - Firebase Auth UID
 * @returns {Promise<Object>} - User data {role, organizationId, ...}
 */
export const getUserData = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        role: data.role || 'student',
        organizationId: data.organizationId || null,
        name: data.name || null,
        email: data.email || null,
        ...data
      };
    }
    return { role: 'student', organizationId: null }; // Default
  } catch (error) {
    console.error('Error getting user data:', error);
    return { role: 'student', organizationId: null }; // Default on error
  }
};

/**
 * Get user role from Firestore (backward compatibility)
 * @param {string} userId - Firebase Auth UID
 * @returns {Promise<string>} - User role ('superAdmin', 'admin', or 'student')
 */
export const getUserRole = async (userId) => {
  const userData = await getUserData(userId);
  return userData.role || 'student';
};

/**
 * Create or update user document in Firestore
 * @param {string} userId - Firebase Auth UID
 * @param {Object} userData - User data to store
 * @returns {Promise<void>}
 */
export const createUserDocument = async (userId, userData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error creating user document:', error);
    throw error;
  }
};

/**
 * Update user role in Firestore
 * @param {string} userId - Firebase Auth UID
 * @param {string} role - New role ('admin' or 'student')
 * @returns {Promise<void>}
 */
export const updateUserRole = async (userId, role) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      role,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

/**
 * Create a new admin user
 * This function creates both the Firebase Auth account and the Firestore user document
 * @param {string} email - Admin email
 * @param {string} password - Admin password
 * @param {string} name - Admin name (optional)
 * @returns {Promise<Object>} - User credential
 */
export const createAdminUser = async (email, password, name = null) => {
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update display name if provided
    if (name) {
      await updateProfile(user, { displayName: name });
    }

    // Create user document in Firestore with admin role
    await createUserDocument(user.uid, {
      email: user.email,
      name: name || user.email?.split('@')[0] || 'Admin',
      role: 'admin',
      status: 'active'
    });

    return userCredential;
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
};

/**
 * Create a new student user
 * @param {string} email - Student email
 * @param {string} password - Student password
 * @param {string} name - Student name (optional)
 * @returns {Promise<Object>} - User credential
 */
export const createStudentUser = async (email, password, name = null) => {
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update display name if provided
    if (name) {
      await updateProfile(user, { displayName: name });
    }

    // Create user document in Firestore with student role
    await createUserDocument(user.uid, {
      email: user.email,
      name: name || user.email?.split('@')[0] || 'Student',
      role: 'student',
      status: 'active'
    });

    return userCredential;
  } catch (error) {
    console.error('Error creating student user:', error);
    throw error;
  }
};


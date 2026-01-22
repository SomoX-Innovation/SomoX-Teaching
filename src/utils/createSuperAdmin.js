/**
 * Utility script to create SuperAdmin users
 * 
 * This script can be used to create SuperAdmin accounts programmatically.
 * 
 * IMPORTANT: SuperAdmin is the platform owner and has access to ALL organizations.
 * Only create SuperAdmin accounts for trusted platform administrators.
 * 
 * Usage:
 * 1. Import this function in a React component or run in browser console
 * 2. Call: createSuperAdmin('superadmin@example.com', 'securePassword123', 'Super Admin Name')
 * 
 * Or use Firebase Console method (recommended) - see CREATE_SUPERADMIN.md
 */

import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../config/firebase';
import { createUserDocument } from '../services/authService';

/**
 * Create a SuperAdmin user
 * @param {string} email - SuperAdmin email address
 * @param {string} password - SuperAdmin password (min 6 characters)
 * @param {string} name - SuperAdmin display name (optional)
 * @returns {Promise<Object>} - User credential
 */
export const createSuperAdmin = async (email, password, name = null) => {
  try {
    console.log('Creating SuperAdmin user...');
    
    // Validate password
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log('✅ Firebase Auth user created:', user.uid);

    // Update display name if provided
    if (name) {
      await updateProfile(user, { displayName: name });
      console.log('✅ Display name updated');
    }

    // Create user document in Firestore with superAdmin role
    // IMPORTANT: role must be exactly 'superAdmin' (case-sensitive)
    await createUserDocument(user.uid, {
      email: email,
      name: name || email.split('@')[0] || 'Super Admin',
      role: 'superAdmin', // ⚠️ Must be exactly 'superAdmin'
      status: 'active'
      // Note: No organizationId field - SuperAdmin doesn't belong to any organization
    });

    console.log('✅ SuperAdmin Firestore document created');
    console.log('✅ SuperAdmin user created successfully!');
    console.log('User ID:', user.uid);
    console.log('Email:', user.email);
    console.log('Role: superAdmin');
    
    return userCredential;
  } catch (error) {
    console.error('❌ Error creating SuperAdmin user:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      console.error('This email is already registered.');
      console.error('To convert existing user to SuperAdmin:');
      console.error('1. Go to Firestore Database → users collection');
      console.error(`2. Find document with email: ${email}`);
      console.error('3. Update the "role" field to "superAdmin"');
      throw new Error('Email already in use. Update existing user role in Firestore to "superAdmin"');
    }
    
    throw error;
  }
};

/**
 * Setup SuperAdmin (convenience function)
 * @param {string} email - SuperAdmin email
 * @param {string} password - SuperAdmin password
 * @param {string} name - SuperAdmin name (optional)
 */
export const setupSuperAdmin = async (email, password, name = null) => {
  try {
    const userCredential = await createSuperAdmin(email, password, name);
    console.log('✅ SuperAdmin setup complete!');
    console.log('You can now login with:');
    console.log(`Email: ${email}`);
    console.log(`Password: [your password]`);
    return userCredential;
  } catch (error) {
    console.error('❌ SuperAdmin setup failed:', error.message);
    throw error;
  }
};

// Example usage (uncomment to use):
// setupSuperAdmin('superadmin@somoxlearn.com', 'SuperAdminPassword123!', 'Super Admin');

/**
 * Convert existing user to SuperAdmin
 * 
 * If you already have a user account and want to make them SuperAdmin:
 * 
 * Option 1: Using Firebase Console (Easiest)
 * 1. Go to Firestore Database → users collection
 * 2. Find the user document (by UID or email)
 * 3. Edit the document
 * 4. Change "role" field to "superAdmin" (exact, case-sensitive)
 * 5. Remove "organizationId" field if it exists
 * 6. Save the document
 * 
 * Option 2: Using this function (requires being logged in)
 */
export const convertToSuperAdmin = async (userId) => {
  try {
    const { doc, updateDoc } = await import('firebase/firestore');
    const { db } = await import('../config/firebase');
    
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: 'superAdmin',
      updatedAt: new Date()
    });
    
    console.log('✅ User converted to SuperAdmin successfully!');
    console.log('User ID:', userId);
    console.log('⚠️ You may need to logout and login again for changes to take effect');
  } catch (error) {
    console.error('❌ Error converting user to SuperAdmin:', error);
    throw error;
  }
};

export default createSuperAdmin;

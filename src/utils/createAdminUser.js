/**
 * Utility script to create admin users
 * 
 * This script can be run in the browser console or as a standalone function
 * to create admin users in your Firebase project.
 * 
 * Usage in browser console:
 * 1. Import the function: import { createAdminUser } from './services/authService';
 * 2. Call: createAdminUser('admin@example.com', 'securePassword123', 'Admin Name')
 * 
 * Or use this in a React component/page for initial setup.
 */

import { createAdminUser } from '../services/authService';

/**
 * Create an admin user
 * @param {string} email - Admin email address
 * @param {string} password - Admin password (min 6 characters)
 * @param {string} name - Admin display name (optional)
 */
export const setupAdmin = async (email, password, name = null) => {
  try {
    console.log('Creating admin user...');
    const userCredential = await createAdminUser(email, password, name);
    console.log('✅ Admin user created successfully!');
    console.log('User ID:', userCredential.user.uid);
    console.log('Email:', userCredential.user.email);
    return userCredential;
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    if (error.code === 'auth/email-already-in-use') {
      console.error('This email is already registered. You may need to update the user role in Firestore.');
    }
    throw error;
  }
};

// Example usage (uncomment to use):
// setupAdmin('admin@somoxlearn.com', 'AdminPassword123!', 'Admin User');


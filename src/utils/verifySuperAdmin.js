/**
 * Utility to verify and fix SuperAdmin role in Firestore
 * 
 * Run this in the browser console while logged in as the SuperAdmin user
 * to check and fix the role in Firestore.
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

/**
 * Verify and fix SuperAdmin role for current user
 */
export const verifyAndFixSuperAdmin = async () => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      console.error('❌ No user is currently logged in');
      return;
    }
    
    console.log('🔍 Checking user document...');
    console.log('User UID:', user.uid);
    console.log('User Email:', user.email);
    
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.warn('⚠️ User document does not exist in Firestore');
      console.log('Creating user document with superAdmin role...');
      
      await setDoc(userRef, {
        email: user.email,
        name: user.displayName || user.email?.split('@')[0] || 'Super Admin',
        role: 'superAdmin',
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ User document created with superAdmin role');
      console.log('🔄 Please refresh the page for changes to take effect');
      return;
    }
    
    const userData = userDoc.data();
    console.log('📄 Current user document:', userData);
    console.log('📄 Current role:', userData.role);
    
    const role = userData.role?.toLowerCase();
    const isSuperAdmin = role === 'superadmin';
    
    if (!isSuperAdmin) {
      console.warn('⚠️ User role is not superAdmin');
      console.log('Current role:', userData.role);
      console.log('Updating role to superAdmin...');
      
      await setDoc(userRef, {
        ...userData,
        role: 'superAdmin',
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      console.log('✅ Role updated to superAdmin');
      console.log('🔄 Please refresh the page for changes to take effect');
    } else {
      console.log('✅ User role is correctly set to superAdmin');
      console.log('If you are still experiencing permission errors, try:');
      console.log('1. Logout and login again');
      console.log('2. Clear browser cache');
      console.log('3. Check Firestore rules are deployed');
    }
    
  } catch (error) {
    console.error('❌ Error verifying SuperAdmin:', error);
    console.error('Error details:', error.message);
  }
};

/**
 * Check current user's role without making changes
 */
export const checkSuperAdminRole = async () => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      console.error('❌ No user is currently logged in');
      return;
    }
    
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error('❌ User document does not exist in Firestore');
      console.log('Run verifyAndFixSuperAdmin() to create it');
      return;
    }
    
    const userData = userDoc.data();
    const role = userData.role?.toLowerCase();
    const isSuperAdmin = role === 'superadmin';
    
    console.log('📊 User Role Check:');
    console.log('  UID:', user.uid);
    console.log('  Email:', user.email);
    console.log('  Role in Firestore:', userData.role);
    console.log('  Is SuperAdmin:', isSuperAdmin);
    console.log('  Organization ID:', userData.organizationId || 'None (correct for SuperAdmin)');
    
    if (!isSuperAdmin) {
      console.warn('⚠️ Role is not superAdmin. Run verifyAndFixSuperAdmin() to fix it.');
    }
    
    return {
      uid: user.uid,
      email: user.email,
      role: userData.role,
      isSuperAdmin,
      organizationId: userData.organizationId
    };
    
  } catch (error) {
    console.error('❌ Error checking SuperAdmin role:', error);
    throw error;
  }
};

// Make functions available globally for console use
if (typeof window !== 'undefined') {
  window.verifySuperAdmin = verifyAndFixSuperAdmin;
  window.checkSuperAdminRole = checkSuperAdminRole;
  console.log('✅ SuperAdmin verification utilities loaded');
  console.log('Run checkSuperAdminRole() to check your role');
  console.log('Run verifyAndFixSuperAdmin() to verify and fix your role');
}

export default { verifyAndFixSuperAdmin, checkSuperAdminRole };

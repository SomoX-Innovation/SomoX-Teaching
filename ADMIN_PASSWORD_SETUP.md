# Admin Password Management Setup

This guide explains how to set up password management for admins to change user passwords directly.

## Feature

**Change Password** - Admins can change user passwords directly without sending emails. This requires a Cloud Function with Firebase Admin SDK.

## Current Implementation

### ⚙️ Change Password (Requires Cloud Function)

Admins can click the **Change Password** button (🔒 icon) next to any user to set a new password directly. This requires setting up a Cloud Function with Firebase Admin SDK.

## Setting Up Cloud Function for Direct Password Setting

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### Step 2: Initialize Functions

```bash
cd your-project
firebase init functions
# Select TypeScript or JavaScript
# Install dependencies? Yes
```

### Step 3: Create the Cloud Function

Create `functions/index.js` (or `functions/src/index.ts` for TypeScript):

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.adminSetPassword = functions.https.onCall(async (data, context) => {
  // Verify the caller is an admin
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Check if user is admin
  const adminDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
  if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can set passwords');
  }

  const { userId, email, newPassword } = data;

  if (!userId || !email || !newPassword) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  if (newPassword.length < 6) {
    throw new functions.https.HttpsError('invalid-argument', 'Password must be at least 6 characters');
  }

  try {
    // Update password using Admin SDK
    await admin.auth().updateUser(userId, {
      password: newPassword
    });

    return { success: true, message: 'Password updated successfully' };
  } catch (error) {
    console.error('Error updating password:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update password');
  }
});
```

### Step 4: Deploy the Function

```bash
firebase deploy --only functions:adminSetPassword
```

### Step 5: Update Frontend Code

Update the Cloud Function URL in `src/pages/Admin/AdminUsers.jsx`:

```javascript
const response = await fetch('https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/adminSetPassword', {
  // Replace YOUR_REGION and YOUR_PROJECT with your actual values
  // Example: https://us-central1-somoxlean.cloudfunctions.net/adminSetPassword
```

Or use the callable function approach:

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const adminSetPassword = httpsCallable(functions, 'adminSetPassword');

const handleSetPassword = async () => {
  try {
    const result = await adminSetPassword({
      userId: selectedUser.id,
      email: selectedUser.email,
      newPassword: passwordData.newPassword
    });
    alert('Password set successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## Alternative: Using Callable Functions (Recommended)

Update `src/pages/Admin/AdminUsers.jsx` to use callable functions:

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

// In your component:
const functions = getFunctions();
const adminSetPassword = httpsCallable(functions, 'adminSetPassword');

const handleSetPassword = async () => {
  // ... validation code ...
  
  try {
    const result = await adminSetPassword({
      userId: selectedUser.id,
      email: selectedUser.email,
      newPassword: passwordData.newPassword
    });
    
    alert(`Password successfully set for ${selectedUser.email}`);
    setShowPasswordModal(false);
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setSelectedUser(null);
  } catch (err) {
    setError(err.message || 'Failed to set password. Please try again.');
  }
};
```

## Security Considerations

1. **Authentication**: Only authenticated users can call the function
2. **Authorization**: Function checks if caller is admin
3. **Validation**: Password length and format validation
4. **Error Handling**: Proper error messages without exposing sensitive info

## Testing

1. Deploy the Cloud Function
2. Login as admin
3. Go to Admin → Users
4. Click the lock icon (🔒) next to a user
5. Enter new password and confirm
6. Click "Set Password"

## Troubleshooting

### Function not found
- Check function name matches exactly
- Verify function is deployed: `firebase functions:list`
- Check region matches your Firebase project

### Permission denied
- Verify user has admin role in Firestore
- Check Firestore security rules allow reading user documents

### Password not updating
- Check Cloud Function logs: `firebase functions:log`
- Verify userId matches Firebase Auth UID
- Ensure user exists in Firebase Authentication

## Quick Start

**Important:** The Change Password feature requires the Cloud Function to be set up. Without it, you'll see an error message when trying to change passwords.

To change passwords manually without the Cloud Function:
1. Go to Firebase Console → Authentication → Users
2. Click on the user
3. Click "Reset password" or edit the user directly

## How It Works

1. Admin clicks the **Change Password** button (🔒) next to a user
2. Enters new password and confirms it
3. Cloud Function validates admin permissions
4. Password is updated directly in Firebase Auth
5. User can immediately login with the new password
6. **No email is sent** - password is changed silently


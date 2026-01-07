# Admin Authentication Setup Guide

## Overview

The application now uses **Firebase Authentication** for secure admin login with proper password verification. Admin credentials are stored securely in Firebase, and user roles are managed in Firestore.

## How It Works

### 1. **Authentication Flow**
- Users sign in using Firebase Authentication (`signInWithEmailAndPassword`)
- Passwords are verified by Firebase (never stored in plain text)
- User roles are stored in Firestore `users` collection
- The `AuthContext` automatically fetches the user role after authentication

### 2. **Where Admin Credentials Are Stored**

#### Firebase Authentication
- **Email & Password**: Stored securely in Firebase Authentication
- **Location**: Firebase Console → Authentication → Users
- **Security**: Passwords are hashed and never accessible in plain text

#### Firestore Database
- **User Role**: Stored in Firestore `users` collection
- **Document Structure**:
  ```javascript
  {
    email: "admin@example.com",
    name: "Admin Name",
    role: "admin",  // or "student"
    status: "active",
    createdAt: Timestamp,
    updatedAt: Timestamp
  }
  ```
- **Document ID**: Matches the Firebase Auth UID

## Creating Admin Users

### Method 1: Using Firebase Console (Recommended for Initial Setup)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Users**
4. Click **Add User**
5. Enter admin email and password
6. After creating the user, note the **User UID**

7. Navigate to **Firestore Database**
8. Create a document in the `users` collection with:
   - **Document ID**: The User UID from step 6
   - **Fields**:
     - `email`: (string) Admin email
     - `name`: (string) Admin display name
     - `role`: (string) "admin"
     - `status`: (string) "active"
     - `createdAt`: (timestamp) Current time
     - `updatedAt`: (timestamp) Current time

### Method 2: Using the Utility Function

You can use the `createAdminUser` function from `src/services/authService.js`:

```javascript
import { createAdminUser } from './services/authService';

// Create admin user
await createAdminUser(
  'admin@example.com',
  'SecurePassword123!',
  'Admin Name'
);
```

**Note**: This function must be called while authenticated as an existing admin, or you can temporarily add it to a setup script.

### Method 3: Using Browser Console (Development)

1. Open your app in the browser
2. Open Developer Console (F12)
3. Run:
```javascript
import { createAdminUser } from './src/services/authService';
createAdminUser('admin@example.com', 'password123', 'Admin');
```

## File Structure

### Key Files

- **`src/config/firebase.js`**: Firebase configuration
- **`src/context/AuthContext.jsx`**: Authentication context with Firebase Auth integration
- **`src/pages/SignIn.jsx`**: Sign-in page with Firebase Auth
- **`src/services/authService.js`**: Authentication service functions
- **`src/services/firebaseService.js`**: Firestore service functions

## Security Features

✅ **Password Verification**: All passwords are verified by Firebase Authentication  
✅ **Secure Storage**: Passwords are hashed and never stored in plain text  
✅ **Role-Based Access**: User roles are checked from Firestore  
✅ **Session Management**: Firebase handles session tokens automatically  
✅ **Error Handling**: Comprehensive error messages for failed login attempts  

## Default Admin Credentials

**Important**: There are no default admin credentials. You must create an admin user using one of the methods above.

## Troubleshooting

### "User not found" error
- Ensure the user exists in Firebase Authentication
- Check that the email is correct

### "Wrong password" error
- Verify the password is correct
- Check if the account is disabled in Firebase Console

### User can't access admin pages
- Verify the user document exists in Firestore `users` collection
- Check that `role` field is set to `"admin"` (case-sensitive)
- Ensure the document ID matches the Firebase Auth UID

### Role not updating
- The role is fetched from Firestore on each login
- Update the role in Firestore, then have the user sign out and sign in again

## Firestore Security Rules

Make sure your Firestore security rules allow users to read their own user document:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own user document
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admins can read/write all user documents
    match /users/{userId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## Next Steps

1. Create your first admin user using Method 1 (Firebase Console)
2. Test the login with the admin credentials
3. Verify access to admin dashboard
4. Create additional admin users as needed


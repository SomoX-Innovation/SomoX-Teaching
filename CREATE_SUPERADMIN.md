# How to Create SuperAdmin Login Credentials

This guide explains how to create a SuperAdmin user account that can manage all organizations and create organization admins.

## Method 1: Using Firebase Console (Recommended)

This is the easiest and most secure method for creating your first SuperAdmin account.

### Step 1: Create User in Firebase Authentication

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project: `somoxlean`

2. **Create User in Authentication**
   - Navigate to **Authentication** → **Users** tab
   - Click **Add User** button
   - Enter:
     - **Email**: `superadmin@somoxlearn.com` (or your preferred email)
     - **Password**: `YourSecurePassword123!` (minimum 6 characters)
   - Click **Add User**
   - **IMPORTANT**: Copy the **User UID** (you'll need this in the next step)
     - The UID looks like: `abc123def456ghi789jkl012mno345pqr678`

### Step 2: Create SuperAdmin Document in Firestore

1. **Go to Firestore Database**
   - In Firebase Console, navigate to **Firestore Database**
   - Make sure you're in **Cloud Firestore** (not Realtime Database)

2. **Create User Document**
   - Click **Start collection** (if the `users` collection doesn't exist yet)
   - Set **Collection ID** to: `users`
   - For **Document ID**, paste the **User UID** you copied from Step 1
   - Add these fields to the document:

   | Field Name | Type | Value |
   |------------|------|-------|
   | `email` | string | `superadmin@somoxlearn.com` (same as Auth email) |
   | `name` | string | `Super Admin` (or your preferred name) |
   | `role` | string | `superAdmin` ⚠️ **MUST be exactly "superAdmin"** |
   | `status` | string | `active` |
   | `createdAt` | timestamp | Click the timestamp button (current time) |
   | `updatedAt` | timestamp | Click the timestamp button (current time) |

   **Important Notes:**
   - ⚠️ The `role` field **MUST** be exactly `superAdmin` (case-sensitive, no spaces)
   - ⚠️ Do **NOT** add an `organizationId` field (SuperAdmin doesn't belong to any organization)
   - The Document ID must match the User UID from Firebase Authentication

3. **Save the Document**
   - Click **Save** to create the SuperAdmin user document

### Step 3: Verify SuperAdmin Account

1. **Logout** from Firebase Console (if logged in)
2. **Go to your application** (e.g., `http://localhost:5173`)
3. **Navigate to Sign In page**: `/sign-in`
4. **Login with SuperAdmin credentials**:
   - Email: `superadmin@somoxlearn.com`
   - Password: `YourSecurePassword123!`
5. **Verify access**:
   - After login, you should be redirected to `/superadmin/dashboard`
   - You should see the SuperAdmin Dashboard with organization management options

---

## Method 2: Using Browser Console (Alternative)

If you already have an admin account and want to create a SuperAdmin programmatically:

### Step 1: Create Auth Account First

Use Firebase Console to create the Authentication user (same as Method 1, Step 1).

### Step 2: Update Existing User to SuperAdmin

If you already have a user document in Firestore:

1. **Open your app** in the browser
2. **Open Browser Developer Console** (F12)
3. **Run this code** (replace with your actual User UID):

```javascript
// Import Firebase functions
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './src/config/firebase';

// Replace 'YOUR_USER_UID_HERE' with the actual User UID from Firebase Auth
const userId = 'YOUR_USER_UID_HERE';

// Update user role to superAdmin
const userRef = doc(db, 'users', userId);
await updateDoc(userRef, {
  role: 'superAdmin',
  updatedAt: new Date()
});

console.log('✅ User role updated to superAdmin!');
```

**Note**: This method requires you to be logged in and have appropriate Firestore permissions.

---

## Method 3: Using a Setup Script

Create a temporary setup page or script:

### Option A: Create a Setup Component

Create `src/pages/SetupSuperAdmin.jsx`:

```javascript
import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../config/firebase';
import { createUserDocument } from '../services/authService';

const SetupSuperAdmin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update display name
      if (name) {
        await updateProfile(user, { displayName: name });
      }

      // Create Firestore document with superAdmin role
      await createUserDocument(user.uid, {
        email: email,
        name: name || email.split('@')[0],
        role: 'superAdmin', // ⚠️ Important: role must be 'superAdmin'
        status: 'active'
      });

      setMessage(`✅ SuperAdmin created successfully! User ID: ${user.uid}`);
      setEmail('');
      setPassword('');
      setName('');
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto' }}>
      <h1>Create SuperAdmin Account</h1>
      <form onSubmit={handleCreate}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
          />
        </div>
        <button type="submit" disabled={loading} style={{ padding: '0.75rem 1.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
          {loading ? 'Creating...' : 'Create SuperAdmin'}
        </button>
      </form>
      {message && <div style={{ marginTop: '1rem', padding: '1rem', background: message.includes('✅') ? '#d1fae5' : '#fee2e2', borderRadius: '0.5rem' }}>{message}</div>}
    </div>
  );
};

export default SetupSuperAdmin;
```

Then add a route in `App.jsx` (temporary, remove after setup):

```javascript
<Route path="/setup-superadmin" element={<SetupSuperAdmin />} />
```

**⚠️ Important**: Remove this route after creating your SuperAdmin account for security!

---

## Verification Checklist

After creating the SuperAdmin account, verify:

- [ ] User exists in Firebase Authentication with the correct email
- [ ] User document exists in Firestore `users` collection
- [ ] Document ID matches the User UID from Authentication
- [ ] `role` field is exactly `superAdmin` (case-sensitive)
- [ ] `status` field is `active`
- [ ] No `organizationId` field exists (SuperAdmin doesn't belong to any organization)
- [ ] Can login and access `/superadmin/dashboard`
- [ ] Can see "Organizations Management" option in sidebar
- [ ] Can create organizations and organization admins

---

## Troubleshooting

### Issue: "Access Denied" or redirected to wrong dashboard

**Solution**: 
- Check that the `role` field in Firestore is exactly `superAdmin` (not `superadmin`, `SuperAdmin`, or `super-admin`)
- Verify the user document exists and the Document ID matches the Auth UID
- Clear browser cache and cookies, then try logging in again

### Issue: Cannot see SuperAdmin dashboard

**Solution**:
- Check browser console for errors
- Verify the route `/superadmin/dashboard` exists in `App.jsx`
- Ensure `ProtectedRoute` component checks for `superAdmin` role correctly

### Issue: User created but role is wrong

**Solution**:
- Go to Firestore Database → `users` collection
- Find the user document (by UID)
- Edit the document and change `role` field to `superAdmin`
- Save the document

### Issue: "User not found" error

**Solution**:
- Verify the User UID is correct
- Check that the Firestore document ID matches the Auth UID exactly
- Ensure the `users` collection exists in Firestore

---

## Security Best Practices

1. **Use Strong Password**: Minimum 12 characters with mix of uppercase, lowercase, numbers, and symbols
2. **Limit SuperAdmin Accounts**: Only create 1-2 SuperAdmin accounts for platform owners
3. **Remove Setup Routes**: After creating SuperAdmin, remove any temporary setup routes/pages
4. **Enable 2FA**: Consider enabling two-factor authentication in Firebase Console
5. **Regular Audits**: Periodically review SuperAdmin accounts in Firestore

---

## Next Steps

After creating your SuperAdmin account:

1. **Login** as SuperAdmin
2. **Create your first organization** via `/superadmin/organizations`
3. **Create an organization admin** for that organization
4. **Test the full workflow**: Organization Admin → Create Teachers → Create Students

---

## Quick Reference

**SuperAdmin Role Requirements:**
- `role`: `"superAdmin"` (exact, case-sensitive)
- `status`: `"active"`
- No `organizationId` field
- Document ID = Firebase Auth UID

**SuperAdmin Capabilities:**
- ✅ View all organizations
- ✅ Create/Edit/Delete organizations
- ✅ Create organization admins
- ✅ View all users across all organizations
- ✅ Manage platform-wide settings

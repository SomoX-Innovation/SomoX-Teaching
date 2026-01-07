# Quick Admin Login Guide

## Step 1: Create an Admin User (First Time Only)

If you haven't created an admin user yet, follow these steps:

### Option A: Using Firebase Console (Easiest)

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project: `somoxlean`

2. **Create User in Authentication**
   - Go to **Authentication** → **Users** tab
   - Click **Add User** button
   - Enter:
     - **Email**: `admin@somoxlearn.com` (or your preferred email)
     - **Password**: `YourSecurePassword123!` (min 6 characters)
   - Click **Add User**
   - **Copy the User UID** (you'll need this in the next step)

3. **Create User Document in Firestore**
   - Go to **Firestore Database** (this refers to [Cloud Firestore](https://firebase.google.com/docs/firestore), NOT the Realtime Database)
   - Click **Start collection** (if the `users` collection doesn't exist yet)
   - Set **Collection ID** to `users`
   - For **Document ID**, paste the User UID you copied from step 2
   - Add these fields to the document (make sure the field types match):
     ```
     email: "admin@somoxlearn.com"         // type: string
     name: "Admin User"                    // type: string
     role: "admin"                         // type: string  <-- MUST be "admin" exactly
     status: "active"                      // type: string
     createdAt: [Click the "timestamp" button]
     updatedAt: [Click the "timestamp" button]
     ```
   - Click **Save**

### Option B: Using Browser Console (Alternative)

1. Open your app: `http://localhost:5173` (or your dev server URL)
2. Open Browser Developer Console (F12)
3. Run this code:

```javascript
// First, you need to import the function
// Since we're in browser console, we'll use a different approach
// Go to Firebase Console and create the user manually (Option A is easier)
```

**Note:** Option A (Firebase Console) is recommended for the first admin user.

---

## Step 2: Login as Admin

1. **Go to Sign In Page**
   - Navigate to: `http://localhost:5173/sign-in` (or your app URL + `/sign-in`)
   - Or click "Sign In" from the homepage

2. **Enter Credentials**
   - **Email**: The email you used when creating the admin user (e.g., `admin@somoxlearn.com`)
   - **Password**: The password you set

3. **Click "Sign In to Dashboard"**
   - The app will verify your credentials with Firebase
   - If successful, you'll be automatically redirected to `/admin/dashboard`

4. **Verify Admin Access**
   - You should see the Admin Dashboard
   - You should have access to all admin pages:
     - Admin Dashboard
     - Admin Users
     - Admin Courses
     - Admin Recordings
     - Admin Tasks
     - Admin Blog
     - Admin Analytics
     - Admin Payments
     - Admin Settings
     - Admin Profile

---

## Troubleshooting

### ❌ "User not found" Error
- **Solution**: Make sure you created the user in Firebase Authentication
- Check: Firebase Console → Authentication → Users

### ❌ "Wrong password" Error
- **Solution**: Verify the password is correct
- You can reset it in Firebase Console → Authentication → Users → Click user → Reset password

### ❌ Login succeeds but can't access admin pages
- **Solution**: Check the Firestore `users` collection:
  1. Go to Firestore Database
  2. Find the document with your User UID
  3. Verify `role` field is set to exactly `"admin"` (case-sensitive, with quotes)
  4. If missing or wrong, edit the document and set `role: "admin"`

### ❌ Redirected to student dashboard instead of admin
- **Solution**: 
  1. Sign out
  2. Check Firestore `users` collection - ensure `role: "admin"`
  3. Sign in again

---

## Quick Checklist

- [ ] User created in Firebase Authentication
- [ ] User document created in Firestore `users` collection
- [ ] Document ID matches Firebase Auth UID
- [ ] `role` field is set to `"admin"` (exactly, case-sensitive)
- [ ] `status` field is set to `"active"`
- [ ] Email and password are correct

---

## Example Admin User Setup

**Firebase Authentication:**
- Email: `admin@somoxlearn.com`
- Password: `Admin123!`

**Firestore Document (`users` collection):**
- Document ID: `[Your Firebase Auth UID]`
- Fields:
  ```json
  {
    "email": "admin@somoxlearn.com",
    "name": "Admin User",
    "role": "admin",
    "status": "active",
    "createdAt": [timestamp],
    "updatedAt": [timestamp]
  }
  ```

---

## Need Help?

If you're still having issues:
1. Check the browser console for errors (F12)
2. Verify Firebase project is correctly configured in `src/config/firebase.js`
3. Ensure Firestore security rules allow reading user documents
4. Check `ADMIN_AUTH_SETUP.md` for detailed setup instructions


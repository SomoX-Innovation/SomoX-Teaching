# Deploy Cloud Function - Quick Guide

## Prerequisites

1. **Firebase CLI installed**
   ```bash
   npm install -g firebase-tools
   ```

2. **Logged into Firebase**
   ```bash
   firebase login
   ```

3. **Firebase Project on Blaze Plan** ⚠️ **REQUIRED**
   - Cloud Functions require the **Blaze (pay-as-you-go)** plan
   - The free Spark plan does not support Cloud Functions deployment
   - Upgrade your project at: https://console.firebase.google.com/project/YOUR_PROJECT_ID/usage/details
   - Replace `YOUR_PROJECT_ID` with your actual project ID (e.g., `somoxlean`)
   - **Note**: Blaze plan has a free tier with generous limits, so you likely won't be charged unless you exceed free quotas

4. **Project initialized** (if not already done)
   ```bash
   firebase init functions
   ```

## Deploy the Function

### Step 1: Navigate to project root
```bash
cd d:\Somox\somoxlearn
```

### Step 2: Install function dependencies (if needed)
```bash
cd functions
npm install
cd ..
```

### Step 3: Deploy the function
```bash
firebase deploy --only functions:adminSetPassword
```

Or deploy all functions:
```bash
firebase deploy --only functions
```

## Verify Deployment

### Check function status
```bash
firebase functions:list
```

### View function logs
```bash
firebase functions:log --only adminSetPassword
```

### Test the function
1. Login as admin in your app
2. Go to Admin → Users
3. Click the lock icon (🔒) next to a user
4. Enter new password and confirm
5. Click "Change Password"

## Troubleshooting

### Error: "Function not found"
- Make sure you deployed the function: `firebase deploy --only functions:adminSetPassword`
- Check function name matches exactly: `adminSetPassword`

### Error: "Permission denied"
- Verify you're logged in as admin
- Check Firestore `users` collection has your user with `role: "admin"`

### Error: "User not found"
- Make sure the user has a Firebase Auth account (not just Firestore document)
- The `userId` must be the Firebase Auth UID

### Error: "Your project must be on the Blaze (pay-as-you-go) plan"
- **This is a required prerequisite for Cloud Functions**
- Upgrade your Firebase project to Blaze plan:
  1. Visit: https://console.firebase.google.com/project/YOUR_PROJECT_ID/usage/details
  2. Click "Upgrade" or "Modify plan"
  3. Select "Blaze (pay-as-you-go)" plan
  4. Complete the upgrade process
  5. Wait a few minutes for APIs to be enabled
  6. Retry deployment: `firebase deploy --only functions`
- **Note**: Blaze plan includes a free tier with generous quotas, so you typically won't incur charges unless you exceed free limits

### Function deployment fails
- Check Node.js version: `node --version` (should be 18+)
- Install dependencies: `cd functions && npm install`
- Check Firebase project: `firebase use` (should show your project)
- Verify Blaze plan is active (see error above)

## Function Details

- **Function Name**: `adminSetPassword`
- **Type**: Callable (HTTPS)
- **Region**: `us-central1` (can be changed in `functions/index.js`)
- **Authentication**: Required
- **Admin Check**: Verifies caller is admin via Firestore

## Security

✅ **Authentication Required**: Only authenticated users can call  
✅ **Admin Verification**: Checks Firestore for admin role  
✅ **Input Validation**: Validates all required fields  
✅ **Password Requirements**: Minimum 6 characters  
✅ **Email Verification**: Matches email with user ID  

## Next Steps

After deployment:
1. Test the function in your app
2. Monitor logs for any issues
3. Set up alerts if needed (Firebase Console → Functions → adminSetPassword → Monitoring)


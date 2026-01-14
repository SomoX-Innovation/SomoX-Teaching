# Password Reset Email Troubleshooting Guide

## Issue: Not Receiving Password Reset Emails

If users are not receiving password reset emails, follow these steps:

## Step 1: Check Firebase Email Settings

### Configure Authorized Domains

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `somoxlean`
3. Navigate to **Authentication** → **Settings** → **Authorized domains**
4. Make sure your domain is listed:
   - `localhost` (for development)
   - Your production domain (if deployed)
   - `somoxlean.firebaseapp.com` (default)

### Configure Email Templates

1. In Firebase Console, go to **Authentication** → **Templates**
2. Click on **Password reset** template
3. Verify the email template is enabled
4. Customize the email if needed:
   - **Subject**: "Reset your password"
   - **Body**: Should include the reset link
   - **Action URL**: Should point to your app's sign-in page

## Step 2: Check Email Delivery

### Common Issues:

1. **Email in Spam Folder**
   - Check spam/junk folder
   - Add `noreply@[PROJECT_ID].firebaseapp.com` to contacts
   - Check email filters

2. **Email Provider Blocking**
   - Some email providers (Gmail, Outlook) may delay or block emails
   - Wait 5-10 minutes
   - Try a different email address

3. **Firebase Email Quota**
   - Free tier: 100 emails/day
   - Check quota in Firebase Console → Usage
   - Upgrade if needed

## Step 3: Verify User Exists

Make sure the user has a Firebase Authentication account:

1. Go to **Authentication** → **Users**
2. Search for the email address
3. If user doesn't exist, they need to sign up first

## Step 4: Check Browser Console

Open browser console (F12) and check for errors:

```javascript
// Should see this on success:
"Password reset email sent successfully to: user@example.com"

// Common errors:
- "auth/user-not-found" - User doesn't exist
- "auth/invalid-email" - Invalid email format
- "auth/too-many-requests" - Too many attempts
```

## Step 5: Test Email Delivery

### Option A: Use Firebase Console

1. Go to **Authentication** → **Users**
2. Click on a user
3. Click **Reset password** button
4. Check if email is received

### Option B: Use Custom Email Service (Advanced)

If Firebase emails are not working, you can configure a custom SMTP:

1. Go to **Authentication** → **Settings** → **SMTP settings**
2. Configure your email provider (Gmail, SendGrid, etc.)
3. Update email templates to use custom SMTP

## Step 6: Verify Email Template Configuration

1. **Authentication** → **Templates** → **Password reset**
2. Check these settings:
   - **Email subject**: Should be clear
   - **Email body**: Should include `{{link}}` for reset link
   - **Action URL**: Should match your app URL
   - **Custom domain** (optional): If using custom domain

## Quick Fixes

### Fix 1: Clear Browser Cache
```bash
# Hard refresh browser
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

### Fix 2: Try Different Email
- Use a different email provider (Gmail, Outlook, etc.)
- Check if email is valid and active

### Fix 3: Wait and Retry
- Firebase emails can take 1-5 minutes
- Don't send multiple requests quickly
- Wait 5 minutes between attempts

### Fix 4: Check Firebase Status
- Visit: https://status.firebase.google.com/
- Check if there are any service issues

## Testing Checklist

- [ ] User exists in Firebase Authentication
- [ ] Email address is correct and valid
- [ ] Authorized domains are configured
- [ ] Email template is enabled
- [ ] Checked spam/junk folder
- [ ] Waited 5-10 minutes
- [ ] Browser console shows no errors
- [ ] Firebase quota not exceeded

## Alternative: Manual Password Reset

If emails still don't work, admins can manually reset passwords:

1. Go to Firebase Console → **Authentication** → **Users**
2. Click on the user
3. Click **Reset password** or **Edit** to change password
4. User will receive email (if email service is working)

## Contact Support

If none of the above works:

1. Check Firebase Console → **Support** → **Contact support**
2. Provide:
   - Project ID: `somoxlean`
   - Email address that's not receiving emails
   - Timestamp of reset attempt
   - Browser console errors (if any)

## Email Configuration Best Practices

1. **Use Custom Domain** (Recommended for production)
   - Configure in Firebase Console
   - Set up DNS records
   - Improves email deliverability

2. **Customize Email Templates**
   - Brand your emails
   - Include your app name
   - Add support contact

3. **Monitor Email Delivery**
   - Check Firebase Console → **Usage**
   - Monitor bounce rates
   - Check spam reports

## Code Verification

The password reset code in `src/pages/SignIn.jsx` should:

```javascript
await sendPasswordResetEmail(auth, resetEmail, {
  url: `${window.location.origin}/sign-in`,
  handleCodeInApp: false,
});
```

This ensures:
- Reset link points to your app
- Opens in browser (not in-app)
- Proper redirect after reset

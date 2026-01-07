/* eslint-env node */
/**
 * Cloud Functions for Firebase
 * 
 * This file contains all Cloud Functions for the SomoxLearn LMS application.
 */

const {onCall} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");

// Initialize Firebase Admin
admin.initializeApp();

// Set global options for all functions
setGlobalOptions({
  maxInstances: 10,
  region: "us-central1", // Change to your preferred region
});

/**
 * Admin Set Password Function
 * Allows admins to change user passwords directly
 * 
 * @param {Object} data - Function data
 * @param {string} data.userId - Firebase Auth UID of the user whose password to change
 * @param {string} data.email - Email of the user (for validation)
 * @param {string} data.newPassword - New password (min 6 characters)
 * @param {Object} context - Function context with authentication info
 * @returns {Object} Success response
 */
exports.adminSetPassword = onCall(
  {
    // Require authentication
    requireAuthentication: true,
    // CORS settings (optional)
    cors: true,
  },
  async (request) => {
    const {data, auth} = request;

    // Verify the caller is authenticated
    if (!auth) {
      throw new Error("User must be authenticated");
    }

    // Check if user is admin
    try {
      const adminDoc = await admin
        .firestore()
        .collection("users")
        .doc(auth.uid)
        .get();

      if (!adminDoc.exists) {
        logger.warn("Admin check failed: User document not found", {
          uid: auth.uid,
        });
        throw new Error("Permission denied: Admin access required");
      }

      const userData = adminDoc.data();
      if (userData.role !== "admin") {
        logger.warn("Admin check failed: User is not admin", {
          uid: auth.uid,
          role: userData.role,
        });
        throw new Error("Permission denied: Only admins can change passwords");
      }
    } catch (error) {
      logger.error("Error checking admin status:", error);
      throw new Error("Permission denied: Unable to verify admin status");
    }

    // Validate input data
    const {userId, email, newPassword} = data;

    if (!userId || !email || !newPassword) {
      throw new Error("Missing required fields: userId, email, and newPassword are required");
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }

    try {
      // Verify the user exists in Firebase Auth
      const userRecord = await admin.auth().getUser(userId);

      // Verify email matches
      if (userRecord.email !== email) {
        throw new Error("Email does not match the user ID");
      }

      // Update password using Admin SDK
      await admin.auth().updateUser(userId, {
        password: newPassword,
      });

      logger.info("Password updated successfully", {
        userId,
        email,
        updatedBy: auth.uid,
      });

      return {
        success: true,
        message: "Password updated successfully",
      };
    } catch (error) {
      logger.error("Error updating password:", {
        error: error.message,
        userId,
        email,
        updatedBy: auth.uid,
      });

      if (error.code === "auth/user-not-found") {
        throw new Error("User not found in Firebase Authentication");
      }

      throw new Error(`Failed to update password: ${error.message}`);
    }
  }
);

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
    // CORS is automatically handled for callable functions in v2
    // Region is inherited from setGlobalOptions (us-central1)
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

/**
 * Create User Function
 * Allows admins to create users in both Firebase Auth and Firestore
 * 
 * @param {Object} data - Function data
 * @param {string} data.email - User email
 * @param {string} data.password - User password (min 6 characters)
 * @param {string} data.name - User display name
 * @param {string} data.role - User role ('admin' or 'student')
 * @param {string} data.phone - User phone (optional)
 * @param {string} data.status - User status ('active' or 'inactive')
 * @param {Array} data.batchIds - Array of batch IDs for students (optional)
 * @param {Object} context - Function context with authentication info
 * @returns {Object} Success response with user UID
 */
exports.createUser = onCall(
  {
    requireAuthentication: true,
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
        throw new Error("Permission denied: Only admins can create users");
      }
    } catch (error) {
      logger.error("Error checking admin status:", error);
      throw new Error("Permission denied: Unable to verify admin status");
    }

    // Validate input data
    const {email, password, name, role, phone, status, batchIds} = data;

    if (!email || !password) {
      throw new Error("Missing required fields: email and password are required");
    }

    if (typeof password !== "string" || password.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }

    // Validate role
    if (role && role !== "admin" && role !== "student") {
      throw new Error("Role must be 'admin' or 'student'");
    }

    // Validate batchIds for students
    if (role === "student" && (!batchIds || batchIds.length === 0)) {
      throw new Error("Students must be assigned to at least one batch");
    }

    try {
      // Create user in Firebase Authentication
      const userRecord = await admin.auth().createUser({
        email: email,
        password: password,
        displayName: name || email.split("@")[0],
        emailVerified: false,
      });

      logger.info("User created in Firebase Auth", {
        uid: userRecord.uid,
        email: email,
        createdBy: auth.uid,
      });

      // Create user document in Firestore
      const userDocData = {
        email: email,
        name: name || email.split("@")[0],
        role: role || "student",
        status: status || "active",
        phone: phone || "",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Add batchIds for students
      if (role === "student" && batchIds && batchIds.length > 0) {
        userDocData.batchIds = batchIds;
      }

      await admin
        .firestore()
        .collection("users")
        .doc(userRecord.uid)
        .set(userDocData);

      logger.info("User document created in Firestore", {
        uid: userRecord.uid,
        email: email,
        createdBy: auth.uid,
      });

      return {
        success: true,
        message: "User created successfully in both Auth and Firestore",
        uid: userRecord.uid,
        email: email,
      };
    } catch (error) {
      logger.error("Error creating user:", {
        error: error.message,
        email: email,
        createdBy: auth.uid,
      });

      // If Auth user was created but Firestore failed, try to clean up
      if (error.code === "auth/email-already-exists") {
        throw new Error("User with this email already exists in Firebase Authentication");
      }

      if (error.code === "auth/invalid-email") {
        throw new Error("Invalid email address");
      }

      throw new Error(`Failed to create user: ${error.message}`);
    }
  }
);

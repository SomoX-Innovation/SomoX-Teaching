import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDcox9e0ohy1lFFiQX5KvzRv5c7Ulv4M9A",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "somoxlean.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "somoxlean",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "somoxlean.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "92886460382",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:92886460382:web:46805abb189415d0379f4f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Connect to emulators in development (if running)
if (import.meta.env.DEV) {
  try {
    // Only connect if not already connected
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Check if emulators are running (optional - will fail gracefully if not)
        // Uncomment these if you want to use emulators:
        // connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
        // connectFirestoreEmulator(db, 'localhost', 8080);
        // connectStorageEmulator(storage, 'localhost', 9199);
      }
    }
  } catch (error) {
    // Emulators not running, continue with production
    console.log('Emulators not detected, using production Firebase services');
  }
}

// Export app
export { app };

export default app;



import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

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

export default app;



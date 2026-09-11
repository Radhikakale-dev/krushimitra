/**
 * config/firebase.js
 * KrushiMitra AI — Firebase SDK Configuration
 * Initializes Firebase App, Auth, and Google provider.
 */
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || 'AIzaSyBunjUZvYlfBvIHh4AWOlAqljIkIeN3PD4',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || 'krushimitra-9a797.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || 'krushimitra-9a797',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || 'krushimitra-9a797.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '799680204859',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '1:799680204859:web:e13e86ed6c82b3561a0c1e',
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID     || 'G-DEY99PK22C',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Google OAuth provider with additional scopes
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Firebase is always configured (hardcoded credentials as fallback)
const isFirebaseConfigured = true;

export {
  app,
  auth,
  googleProvider,
  isFirebaseConfigured,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
};

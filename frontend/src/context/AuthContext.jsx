/**
 * context/AuthContext.jsx
 * KrushiMitra AI — Global Authentication State
 *
 * Fixed: Navigation no longer blocks on backend sync failure.
 * Firebase user is used as a fallback so login always completes.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth';
import {
  auth,
  googleProvider,
  isFirebaseConfigured,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from '../config/firebase';
import api from '../services/api';

const AuthContext = createContext(null);

// Build a minimal user object from Firebase user when backend is unavailable
const fallbackUserFromFirebase = (fbUser, role = 'employee') => ({
  _id:           fbUser.uid,
  name:          fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
  email:         fbUser.email,
  role:          role,
  isActive:      true,
  photoURL:      fbUser.photoURL || '',
  emailVerified: fbUser.emailVerified,
  provider:      fbUser.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'firebase',
  _isFallback:   true, // flag so we know this came from Firebase, not MongoDB
});

export const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [user, setUser]                 = useState(null);
  const [loading, setLoading]           = useState(true);
  const [initialized, setInitialized]   = useState(false);

  // ── Sync Firebase user to MongoDB ─────────────────────────────────────────
  const syncUserToDb = useCallback(async (fbUser, role = null, name = null) => {
    if (!fbUser) { setUser(null); return null; }

    // Set a fallback immediately so isAuthenticated = true right away
    const fallback = fallbackUserFromFirebase(fbUser, role || 'employee');
    setUser(prev => prev && !prev._isFallback ? prev : fallback);

    try {
      const token = await fbUser.getIdToken(true); // force refresh
      const res = await api.post(
        '/auth/sync',
        {
          name:     name || fbUser.displayName || fbUser.email?.split('@')[0],
          photoURL: fbUser.photoURL,
          role,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const profile = res.data;
      setUser(profile);
      localStorage.setItem('km_token', profile.token || token);
      localStorage.setItem('km_user', JSON.stringify(profile));
      return profile;
    } catch (err) {
      console.warn('Backend sync failed, using Firebase fallback:', err.message);
      // Keep the fallback user — we're still "authenticated" via Firebase
      localStorage.setItem('km_user', JSON.stringify(fallback));
      return fallback;
    }
  }, []);

  // ── Firebase auth state listener ───────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // Restore cached profile immediately for fast startup
        const cached = localStorage.getItem('km_user');
        if (cached) {
          try { setUser(JSON.parse(cached)); } catch (_) {}
        }
        // Then sync with backend (non-blocking for navigation)
        syncUserToDb(fbUser);
      } else {
        setUser(null);
        localStorage.removeItem('km_token');
        localStorage.removeItem('km_user');
      }
      setLoading(false);
      setInitialized(true);
    });
    return unsubscribe;
  }, [syncUserToDb]);

  // ── loginWithEmail ─────────────────────────────────────────────────────────
  const loginWithEmail = async (email, password, rememberMe = true) => {
    await setPersistence(
      auth,
      rememberMe ? browserLocalPersistence : browserSessionPersistence
    );
    const credential = await signInWithEmailAndPassword(auth, email, password);
    setFirebaseUser(credential.user); // Fix race condition before navigation
    return await syncUserToDb(credential.user);
  };

  // ── loginWithGoogle ────────────────────────────────────────────────────────
  const loginWithGoogle = async (role = 'employee') => {
    const credential = await signInWithPopup(auth, googleProvider);
    setFirebaseUser(credential.user); // Fix race condition before navigation
    return await syncUserToDb(credential.user, role, credential.user.displayName);
  };

  // ── registerWithEmail ──────────────────────────────────────────────────────
  const registerWithEmail = async (name, email, password, role = 'employee') => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateFirebaseProfile(credential.user, { displayName: name });
    await sendEmailVerification(credential.user);
    setFirebaseUser(credential.user); // Fix race condition before navigation
    return await syncUserToDb(credential.user, role, name);
  };

  // ── sendVerificationEmail ──────────────────────────────────────────────────
  const sendVerificationEmail = async () => {
    if (firebaseUser && !firebaseUser.emailVerified) {
      await sendEmailVerification(firebaseUser);
    }
  };

  // ── sendPasswordReset ──────────────────────────────────────────────────────
  const sendPasswordReset = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  // ── updateUserProfile ──────────────────────────────────────────────────────
  const updateUserProfile = async (data) => {
    const token = await firebaseUser?.getIdToken();
    const res = await api.put('/auth/profile', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const updated = res.data;
    setUser(updated);
    localStorage.setItem('km_user', JSON.stringify(updated));
    return updated;
  };

  // ── logout ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
    localStorage.removeItem('km_token');
    localStorage.removeItem('km_user');
  };

  // ── getToken ───────────────────────────────────────────────────────────────
  const getToken = async () => {
    if (firebaseUser) return await firebaseUser.getIdToken();
    return localStorage.getItem('km_token');
  };

  const value = {
    user,
    firebaseUser,
    loading,
    initialized,
    // ✅ isAuthenticated: true as soon as Firebase user exists (even if backend sync pending)
    isAuthenticated:    !!firebaseUser && !!user,
    isEmailVerified:    firebaseUser?.emailVerified || user?.emailVerified || false,
    isAdmin:            user?.role === 'admin',
    isEmployee:         user?.role === 'employee',
    isFirebaseMode:     isFirebaseConfigured,
    loginWithEmail,
    loginWithGoogle,
    registerWithEmail,
    sendVerificationEmail,
    sendPasswordReset,
    updateUserProfile,
    logout,
    getToken,
    syncUserToDb,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

export default AuthContext;

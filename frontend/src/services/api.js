/**
 * services/api.js
 * KrushiMitra AI — Axios API Client
 * All requests go to the real Express backend at :5000 via Vite proxy.
 * The Firebase ID token (or custom JWT) is auto-attached to every request.
 */
import axios from 'axios';
import { auth } from '../config/firebase';

// ── Axios Instance ─────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request Interceptor: attach Firebase token ─────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    try {
      // Always try to get a fresh Firebase token first
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // Fallback to stored custom JWT
        const stored = localStorage.getItem('km_token');
        if (stored) config.headers.Authorization = `Bearer ${stored}`;
      }
    } catch {
      // Silent fail — let the server reject if auth is truly needed
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: unwrap data, format errors ──────────────────────────
api.interceptors.response.use(
  (response) => response.data,           // Unwrap axios envelope → { success, data, ... }
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';

    // Auto-logout on 401 (expired/invalid token)
    if (error.response?.status === 401) {
      localStorage.removeItem('km_token');
      localStorage.removeItem('km_user');
      // Don't redirect here — let AuthContext handle it via onAuthStateChanged
    }

    return Promise.reject(new Error(message));
  }
);

export default api;

/**
 * components/ProtectedRoute.jsx
 * KrushiMitra AI — Route Guard
 * Enforces: authentication, email verification, and role-based access.
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './ui/Spinner';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, isEmailVerified, user, loading, initialized, firebaseUser } = useAuth();
  const location = useLocation();

  // Show full-screen spinner while auth state is loading
  if (loading || !initialized) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="h-14 w-14 bg-gradient-to-br from-primary-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30 animate-pulse">
          <svg className="h-7 w-7 text-content" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 8C8 10 5.9 16.17 3.82 19.11L5.71 20l1-2.3A4.49 4.49 0 0 0 8 18c4 0 4-2.5 8-2.5s4 2.5 8 2.5v-2c-4 0-4-2.5-8-2.5C11.09 13.5 10 15 8 15.92V15c3-1 5.5-3 6-7h3V6h-3V2l-4 4 4 4V8h-3V8z"/>
          </svg>
        </div>
        <Spinner size="md" />
        <p className="text-xs text-slate-600">Authenticating...</p>
      </div>
    );
  }

  // Not authenticated → redirect to login (preserve intended destination)
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check (only if we have a real MongoDB profile with a role)
  if (allowedRoles.length > 0 && user && !user._isFallback && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;

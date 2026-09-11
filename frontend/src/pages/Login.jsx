/**
 * pages/Login.jsx
 * KrushiMitra AI — Premium Login Page
 * Split-screen layout: Brand panel (left) + Auth form (right)
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Mail, Lock, Eye, EyeOff, LogIn,
  Sprout, ShieldCheck, Zap, BarChart3, Package, CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ── Brand panel feature list ───────────────────────────────────────────────────
const FEATURES = [
  { icon: ShieldCheck, text: 'Firebase Authentication & JWT Security' },
  { icon: BarChart3,   text: 'Real-time Sales & Revenue Analytics' },
  { icon: Package,     text: 'Complete Inventory Management' },
  { icon: Zap,         text: 'Lightning-fast POS Billing System' },
];

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { loginWithEmail, loginWithGoogle, isAuthenticated, isEmailVerified, firebaseUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: '', password: '', rememberMe: true } });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, isEmailVerified, firebaseUser, navigate, redirectTo]);

  // ── Email/password login ────────────────────────────────────────────────────
  const onSubmit = async ({ email, password, rememberMe }) => {
    try {
      await loginWithEmail(email, password, rememberMe);
      toast.success('Welcome back! 👋');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = getFirebaseError(err.code || err.message);
      toast.error(msg);
    }
  };

  // ── Google login ────────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle('employee');
      toast.success('Signed in with Google! 🎉');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        toast.error(getFirebaseError(err.code || err.message));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background overflow-hidden">

      {/* ── Left Brand Panel ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="hidden lg:flex w-[45%] relative overflow-hidden flex-col justify-between p-12
                   bg-gradient-to-br from-dark-900 via-[#0a1a10] to-dark-950"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-primary-500/5 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-emerald-600/5 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-primary-500/3 blur-3xl" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.02]"
            style={{ backgroundImage: 'linear-gradient(rgba(34,197,94,0.5) 1px, transparent 1px), linear-gradient(to right, rgba(34,197,94,0.5) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        </div>

        {/* Brand logo */}
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 bg-gradient-to-br from-primary-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Sprout className="h-6 w-6 text-content" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-content tracking-tight">KrushiMitra AI</h1>
              <p className="text-xs text-primary-400 font-medium">Agriculture Management System</p>
            </div>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative flex-1 flex flex-col justify-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-content leading-tight mb-4">
              Manage Your{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-emerald-400">
                Agriculture Shop
              </span>{' '}
              Like a Pro
            </h2>
            <p className="text-content-muted text-sm leading-relaxed mb-8 max-w-sm">
              Complete billing, inventory, and shop management software designed for modern agriculture businesses.
            </p>

            {/* Feature list */}
            <div className="space-y-3">
              {FEATURES.map((feat, i) => (
                <motion.div
                  key={i}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="h-8 w-8 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center shrink-0">
                    <feat.icon className="h-4 w-4 text-primary-400" />
                  </div>
                  <span className="text-sm text-content-muted">{feat.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Footer badge */}
        <div className="relative">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <ShieldCheck className="h-3.5 w-3.5 text-primary-500/60" />
            <span>Secured by Firebase Authentication · End-to-end encrypted</span>
          </div>
        </div>
      </motion.div>

      {/* ── Right Auth Panel ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex-1 flex items-center justify-center p-8 bg-background"
      >
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="h-10 w-10 bg-gradient-to-br from-primary-400 to-emerald-600 rounded-xl flex items-center justify-center">
              <Sprout className="h-5 w-5 text-content" />
            </div>
            <span className="text-xl font-bold text-content">KrushiMitra AI</span>
          </div>

          {/* Card */}
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="glass-panel rounded-3xl border border-divider/60 p-8"
          >
            {/* Header */}
            <div className="mb-7">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-2xl font-bold text-content">Sign In</h2>
                <span className="flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-full bg-primary-500/10 text-primary-400 border border-primary-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-400 animate-pulse" />
                  Firebase Auth
                </span>
              </div>
              <p className="text-sm text-content-muted">Access your KrushiMitra AI dashboard</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-content-muted mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-content-muted pointer-events-none" />
                  <input
                    type="email"
                    placeholder="owner@yourshop.com"
                    autoComplete="email"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl bg-surface/80 border text-content text-sm
                      placeholder-slate-600 transition-all duration-200
                      focus:outline-none focus:ring-2 focus:border-transparent
                      ${errors.email
                        ? 'border-red-500/60 focus:ring-red-500/30'
                        : 'border-divider/60 focus:ring-primary-500/40'
                      }`}
                    {...register('email', {
                      required: 'Email is required',
                      pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' },
                    })}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-content-muted">Password</label>
                  <Link to="/forgot-password" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-content-muted pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className={`w-full pl-10 pr-11 py-3 rounded-xl bg-surface/80 border text-content text-sm
                      placeholder-slate-600 transition-all duration-200
                      focus:outline-none focus:ring-2 focus:border-transparent
                      ${errors.password
                        ? 'border-red-500/60 focus:ring-red-500/30'
                        : 'border-divider/60 focus:ring-primary-500/40'
                      }`}
                    {...register('password', { required: 'Password is required' })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-content-muted hover:text-content transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2.5">
                <input
                  id="rememberMe"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-slate-600 bg-surface text-primary-500
                    focus:ring-primary-500/50 focus:ring-offset-0 cursor-pointer accent-primary-500"
                  {...register('rememberMe')}
                />
                <label htmlFor="rememberMe" className="text-sm text-content-muted cursor-pointer select-none">
                  Remember me for 7 days
                </label>
              </div>

              {/* Sign In Button */}
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: isSubmitting ? 1 : 1.01, y: isSubmitting ? 0 : -1 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-semibold text-sm
                  bg-gradient-to-r from-primary-500 to-emerald-600
                  hover:from-primary-600 hover:to-emerald-700
                  text-content shadow-lg shadow-primary-500/20
                  disabled:opacity-60 disabled:pointer-events-none transition-all duration-200"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="flex-1 h-px bg-surface-hover" />
              <span className="text-xs text-slate-600 font-medium px-1">or continue with</span>
              <div className="flex-1 h-px bg-surface-hover" />
            </div>

            {/* Google Sign In */}
            <motion.button
              onClick={handleGoogleLogin}
              disabled={googleLoading || isSubmitting}
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-medium text-sm
                bg-surface/80 border border-divider/60 text-content
                hover:bg-surface-hover hover:border-slate-600 hover:text-content
                disabled:opacity-50 disabled:pointer-events-none transition-all duration-200"
            >
              {googleLoading ? (
                <div className="h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              Continue with Google
            </motion.button>

            {/* Register link */}
            <p className="text-center text-sm text-content-muted mt-6">
              First time here?{' '}
              <Link to="/register" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
                Create Admin Account
              </Link>
              {' · '}
              <Link to="/register-employee" className="text-content-muted hover:text-content font-medium transition-colors">
                Employee Register
              </Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

// ── Google brand icon SVG ──────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

// ── Map Firebase error codes to user-friendly messages ────────────────────────
const getFirebaseError = (code = '') => {
  const map = {
    'auth/user-not-found':       'No account found with this email address.',
    'auth/wrong-password':       'Incorrect password. Please try again.',
    'auth/invalid-credential':   'Invalid email or password.',
    'auth/too-many-requests':    'Too many failed attempts. Please try again later.',
    'auth/user-disabled':        'This account has been disabled.',
    'auth/network-request-failed': 'Network error. Check your internet connection.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled. Enable it in the Firebase Console.',
    'auth/popup-blocked':        'Popup was blocked. Please allow popups for this site.',
  };
  return map[code] || `Authentication failed: ${code}`;
};

export default Login;

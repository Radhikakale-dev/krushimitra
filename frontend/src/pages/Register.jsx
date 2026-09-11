/**
 * pages/Register.jsx
 * KrushiMitra AI — Admin Registration Page
 * First-time setup or additional admin account creation.
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  User, Mail, Lock, Eye, EyeOff, ShieldCheck, Sprout,
  CheckCircle2, AlertCircle, ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [showPassword, setShowPassword]         = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [googleLoading, setGoogleLoading]       = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const { registerWithEmail, loginWithGoogle, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Explicit navigation on success to prevent flashes

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const password = watch('password', '');

  // Password strength calculator
  useEffect(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    setPasswordStrength(score);
  }, [password]);

  const strengthLabel  = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColor  = ['', 'bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500'];
  const strengthText   = ['', 'text-red-400', 'text-amber-400', 'text-blue-400', 'text-emerald-400'];

  // ── Email/Password register ────────────────────────────────────────────────
  const onSubmit = async ({ name, email, password }) => {
    try {
      await registerWithEmail(name, email, password, 'admin');
      toast.success('Admin account created! Welcome to Dashboard.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(getFirebaseError(err.code || err.message));
    }
  };

  // ── Google register ────────────────────────────────────────────────────────
  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle('admin');
      toast.success('Admin account created with Google! 🎉');
      navigate('/dashboard');
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

      {/* ── Left Brand Panel ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex w-[42%] flex-col justify-between p-12 relative overflow-hidden
                   bg-gradient-to-br from-dark-900 via-[#0a1a10] to-dark-950"
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary-500/5 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-emerald-500/5 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.015]"
            style={{ backgroundImage: 'linear-gradient(rgba(34,197,94,0.5) 1px,transparent 1px),linear-gradient(to right,rgba(34,197,94,0.5) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="h-11 w-11 bg-gradient-to-br from-primary-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
            <Sprout className="h-6 w-6 text-content" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-content">KrushiMitra AI</h1>
            <p className="text-xs text-primary-400">Agriculture Management System</p>
          </div>
        </div>

        {/* Hero */}
        <div className="relative">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-xs text-primary-400 font-medium mb-5">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin Account Setup
            </div>
            <h2 className="text-3xl font-bold text-content leading-tight mb-4">
              Set Up Your{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-emerald-400">
                Admin Account
              </span>
            </h2>
            <p className="text-content-muted text-sm leading-relaxed mb-8 max-w-xs">
              The admin account has full control over billing, inventory, employees, and all system settings.
            </p>

            {/* Permissions list */}
            {['Full billing & POS access', 'Inventory management', 'Employee management', 'Reports & analytics', 'System settings'].map((perm, i) => (
              <motion.div key={i} initial={{ x: -15, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 + i * 0.08 }}
                className="flex items-center gap-2.5 mb-2.5">
                <CheckCircle2 className="h-4 w-4 text-primary-500 shrink-0" />
                <span className="text-sm text-content-muted">{perm}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <div className="relative text-xs text-slate-600 flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-primary-500/50" />
          Secured by Firebase · Role-based access control
        </div>
      </motion.div>

      {/* ── Right Form Panel ───────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto bg-background">
        <div className="w-full max-w-md py-4">

          {/* Back link */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-content-muted hover:text-content transition-colors mb-6">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
            </Link>
          </motion.div>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="h-9 w-9 bg-gradient-to-br from-primary-400 to-emerald-600 rounded-xl flex items-center justify-center">
              <Sprout className="h-5 w-5 text-content" />
            </div>
            <span className="text-lg font-bold text-content">KrushiMitra AI</span>
          </div>

          {/* Card */}
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="glass-panel rounded-3xl border border-divider/60 p-7"
          >
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-2xl font-bold text-content">Create Admin Account</h2>
              </div>
              <p className="text-sm text-content-muted">Full access to all shop management features</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* Full Name */}
              <FormField
                label="Full Name" icon={User} placeholder="Rajesh Kumar"
                error={errors.name?.message} type="text"
                {...register('name', {
                  required: 'Full name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' },
                })}
              />

              {/* Email */}
              <FormField
                label="Email Address" icon={Mail} placeholder="admin@yourshop.com"
                error={errors.email?.message} type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                })}
              />

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-content-muted mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-content-muted pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                    className={inputClass(errors.password)}
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' },
                    })}
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-content-muted hover:text-content transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= passwordStrength ? strengthColor[passwordStrength] : 'bg-surface-hover'}`} />
                      ))}
                    </div>
                    <p className={`text-xs ${strengthText[passwordStrength]}`}>
                      {strengthLabel[passwordStrength]} password
                    </p>
                  </div>
                )}
                {errors.password && <FieldError message={errors.password.message} />}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-medium text-content-muted mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-content-muted pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    className={inputClass(errors.confirmPassword)}
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: value => value === password || 'Passwords do not match',
                    })}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-content-muted hover:text-content transition-colors">
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <FieldError message={errors.confirmPassword.message} />}
              </div>

              {/* Submit */}
              <motion.button
                type="submit" disabled={isSubmitting}
                whileHover={{ scale: isSubmitting ? 1 : 1.01, y: isSubmitting ? 0 : -1 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-semibold text-sm
                  bg-gradient-to-r from-primary-500 to-emerald-600 hover:from-primary-600 hover:to-emerald-700
                  text-content shadow-lg shadow-primary-500/20 disabled:opacity-60 disabled:pointer-events-none transition-all"
              >
                {isSubmitting ? (
                  <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating Admin Account...</>
                ) : (
                  <><ShieldCheck className="h-4 w-4" />Create Admin Account</>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="flex-1 h-px bg-surface-hover" />
              <span className="text-xs text-slate-600 font-medium px-1">or</span>
              <div className="flex-1 h-px bg-surface-hover" />
            </div>

            {/* Google Register */}
            <motion.button
              onClick={handleGoogleRegister} disabled={googleLoading || isSubmitting}
              whileHover={{ scale: 1.01, y: -1 }} whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-medium text-sm
                bg-surface/80 border border-divider/60 text-content
                hover:bg-surface-hover hover:border-slate-600 hover:text-content
                disabled:opacity-50 disabled:pointer-events-none transition-all"
            >
              {googleLoading ? <div className="h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <GoogleIcon />}
              Register with Google
            </motion.button>

            {/* Footer links */}
            <p className="text-center text-sm text-content-muted mt-5">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">Sign In</Link>
              {' · '}
              <Link to="/register-employee" className="text-content-muted hover:text-content transition-colors">Register as Employee</Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// ── Shared form field component ────────────────────────────────────────────────
const FormField = React.forwardRef(({ label, icon: Icon, error, ...props }, ref) => (
  <div>
    <label className="block text-xs font-medium text-content-muted mb-1.5">{label}</label>
    <div className="relative">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-content-muted pointer-events-none" />
      <input ref={ref} className={inputClass(error)} style={{ paddingLeft: '2.5rem', paddingRight: '1rem' }} {...props} />
    </div>
    {error && <FieldError message={error} />}
  </div>
));
FormField.displayName = 'FormField';

const inputClass = (error) => `w-full py-3 rounded-xl bg-surface/80 border text-content text-sm placeholder-slate-600
  transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent
  ${error ? 'border-red-500/60 focus:ring-red-500/30' : 'border-divider/60 focus:ring-primary-500/40'}`;

const FieldError = ({ message }) => (
  <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
    <AlertCircle className="h-3 w-3 shrink-0" />{message}
  </p>
);

const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const getFirebaseError = (code = '') => {
  const map = {
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
    'auth/invalid-email': 'Invalid email address format.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled. Enable it in the Firebase Console.',
    'auth/network-request-failed': 'Network error. Check your internet connection.',
    'auth/popup-blocked': 'Popup was blocked. Please allow popups.',
  };
  return map[code] || `Registration failed: ${code}`;
};

export default Register;

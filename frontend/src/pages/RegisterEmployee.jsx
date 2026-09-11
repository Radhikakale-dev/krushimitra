/**
 * pages/RegisterEmployee.jsx
 * KrushiMitra AI — Employee Registration Page
 * Employees self-register with restricted access by default.
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  User, Mail, Lock, Eye, EyeOff, Briefcase, Sprout,
  AlertCircle, ArrowLeft, UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const RegisterEmployee = () => {
  const [showPassword, setShowPassword]               = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [googleLoading, setGoogleLoading]             = useState(false);
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

  const onSubmit = async ({ name, email, password }) => {
    try {
      await registerWithEmail(name, email, password, 'employee');
      toast.success('Account created! Welcome to Dashboard.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(getFirebaseError(err.code || err.message));
    }
  };

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle('employee');
      toast.success('Employee account created! 🎉');
      navigate('/dashboard');
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        toast.error(getFirebaseError(err.code || err.message));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const inputClass = (error) => `w-full pl-10 pr-4 py-3 rounded-xl bg-surface/80 border text-content text-sm
    placeholder-slate-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent
    ${error ? 'border-red-500/60 focus:ring-red-500/30' : 'border-divider/60 focus:ring-primary-500/40'}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 overflow-hidden relative">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-primary-500/5 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'linear-gradient(rgba(34,197,94,0.5) 1px,transparent 1px),linear-gradient(to right,rgba(34,197,94,0.5) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
      </div>

      <div className="w-full max-w-md relative">
        {/* Back link */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-content-muted hover:text-content transition-colors mb-6">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
          </Link>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="glass-panel rounded-3xl border border-divider/60 p-8"
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 bg-gradient-to-br from-primary-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Sprout className="h-6 w-6 text-content" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-content">Employee Registration</h2>
              <p className="text-xs text-content-muted">KrushiMitra AI · Employee Access</p>
            </div>
          </div>

          {/* Role badge */}
          <div className="mb-5 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <UserCheck className="h-4 w-4 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-400">
              <strong>Employee Role:</strong> Access to POS, billing and customer management. Admin can grant additional permissions.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-content-muted mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-content-muted pointer-events-none" />
                <input type="text" placeholder="Your full name" className={inputClass(errors.name)}
                  {...register('name', { required: 'Full name is required', minLength: { value: 2, message: 'Name too short' } })} />
              </div>
              {errors.name && <FieldError message={errors.name.message} />}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-content-muted mb-1.5">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-content-muted pointer-events-none" />
                <input type="email" placeholder="you@yourshop.com" className={inputClass(errors.email)}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                  })} />
              </div>
              {errors.email && <FieldError message={errors.email.message} />}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-content-muted mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-content-muted pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                  className={`w-full pl-10 pr-11 py-3 rounded-xl bg-surface/80 border text-content text-sm placeholder-slate-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent ${errors.password ? 'border-red-500/60 focus:ring-red-500/30' : 'border-divider/60 focus:ring-primary-500/40'}`}
                  {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Minimum 6 characters' } })} />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-content-muted hover:text-content transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <FieldError message={errors.password.message} />}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-medium text-content-muted mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-content-muted pointer-events-none" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  className={`w-full pl-10 pr-11 py-3 rounded-xl bg-surface/80 border text-content text-sm placeholder-slate-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent ${errors.confirmPassword ? 'border-red-500/60 focus:ring-red-500/30' : 'border-divider/60 focus:ring-primary-500/40'}`}
                  {...register('confirmPassword', {
                    required: 'Please confirm password',
                    validate: v => v === password || 'Passwords do not match',
                  })} />
                <button type="button" onClick={() => setShowConfirmPassword(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-content-muted hover:text-content transition-colors">
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <FieldError message={errors.confirmPassword.message} />}
            </div>

            {/* Submit */}
            <motion.button type="submit" disabled={isSubmitting}
              whileHover={{ scale: isSubmitting ? 1 : 1.01, y: isSubmitting ? 0 : -1 }} whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-semibold text-sm
                bg-gradient-to-r from-primary-500 to-emerald-600 hover:from-primary-600 hover:to-emerald-700
                text-content shadow-lg shadow-primary-500/20 disabled:opacity-60 disabled:pointer-events-none transition-all mt-2"
            >
              {isSubmitting
                ? <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating Account...</>
                : <><Briefcase className="h-4 w-4" />Create Employee Account</>}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-surface-hover" />
            <span className="text-xs text-slate-600 px-1">or</span>
            <div className="flex-1 h-px bg-surface-hover" />
          </div>

          {/* Google */}
          <motion.button onClick={handleGoogleRegister} disabled={googleLoading || isSubmitting}
            whileHover={{ scale: 1.01, y: -1 }} whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-medium text-sm
              bg-surface/80 border border-divider/60 text-content hover:bg-surface-hover hover:border-slate-600 hover:text-content
              disabled:opacity-50 disabled:pointer-events-none transition-all">
            {googleLoading ? <div className="h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <GoogleIcon />}
            Register with Google
          </motion.button>

          {/* Footer */}
          <p className="text-center text-sm text-content-muted mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">Sign In</Link>
            {' · '}
            <Link to="/register" className="text-content-muted hover:text-content transition-colors">Register as Admin</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

const FieldError = ({ message }) => (
  <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
    <AlertCircle className="h-3 w-3 shrink-0" />{message}
  </p>
);

const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const getFirebaseError = (code = '') => ({
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password is too weak.',
  'auth/invalid-email': 'Invalid email address.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled. Enable it in the Firebase Console.',
  'auth/network-request-failed': 'Network error. Check your connection.',
}[code] || `Registration failed: ${code}`);

export default RegisterEmployee;

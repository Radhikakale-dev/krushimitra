/**
 * pages/ForgotPassword.jsx
 * KrushiMitra AI — Password Reset via Firebase
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle, Sprout } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ForgotPassword = () => {
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const { sendPasswordReset } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async ({ email }) => {
    try {
      await sendPasswordReset(email);
      setSentEmail(email);
      setSent(true);
      toast.success('Reset link sent! Check your inbox.');
    } catch (err) {
      const msg = {
        'auth/user-not-found':         'No account found with this email address.',
        'auth/invalid-email':          'Invalid email address format.',
        'auth/too-many-requests':      'Too many attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Check your connection.',
      }[err.code] || err.message || 'Failed to send reset email.';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-primary-500/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'linear-gradient(rgba(34,197,94,0.5) 1px,transparent 1px),linear-gradient(to right,rgba(34,197,94,0.5) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
      </div>

      <div className="w-full max-w-md relative">
        {/* Back link */}
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-content-muted hover:text-content transition-colors mb-6">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
        </Link>

        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="glass-panel rounded-3xl border border-divider/60 p-8"
        >
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-7">
            <div className="h-10 w-10 bg-gradient-to-br from-primary-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Sprout className="h-5 w-5 text-content" />
            </div>
            <span className="font-bold text-content">KrushiMitra AI</span>
          </div>

          <AnimatePresence mode="wait">
            {!sent ? (
              /* ── Request Form ─────────────────────────────────────────────── */
              <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-content mb-1">Forgot Password?</h2>
                  <p className="text-sm text-content-muted leading-relaxed">
                    Enter your registered email address and we'll send you a secure link to reset your password.
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-content-muted mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-content-muted pointer-events-none" />
                      <input
                        type="email"
                        placeholder="your@email.com"
                        autoComplete="email"
                        className={`w-full pl-10 pr-4 py-3 rounded-xl bg-surface/80 border text-content text-sm placeholder-slate-600
                          transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent
                          ${errors.email ? 'border-red-500/60 focus:ring-red-500/30' : 'border-divider/60 focus:ring-primary-500/40'}`}
                        {...register('email', {
                          required: 'Email is required',
                          pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' },
                        })}
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />{errors.email.message}
                      </p>
                    )}
                  </div>

                  <motion.button
                    type="submit" disabled={isSubmitting}
                    whileHover={{ scale: isSubmitting ? 1 : 1.01, y: isSubmitting ? 0 : -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-semibold text-sm
                      bg-gradient-to-r from-primary-500 to-emerald-600 hover:from-primary-600 hover:to-emerald-700
                      text-content shadow-lg shadow-primary-500/20 disabled:opacity-60 disabled:pointer-events-none transition-all"
                  >
                    {isSubmitting
                      ? <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending...</>
                      : <><Send className="h-4 w-4" />Send Reset Link</>
                    }
                  </motion.button>
                </form>
              </motion.div>
            ) : (
              /* ── Success State ────────────────────────────────────────────── */
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1, bounce: 0.4 }}
                  className="w-16 h-16 bg-primary-500/10 border border-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-5"
                >
                  <CheckCircle2 className="h-8 w-8 text-primary-400" />
                </motion.div>

                <h2 className="text-xl font-bold text-content mb-2">Check Your Inbox!</h2>
                <p className="text-sm text-content-muted leading-relaxed mb-1">
                  We've sent a password reset link to:
                </p>
                <p className="text-sm font-semibold text-primary-400 mb-5">{sentEmail}</p>
                <p className="text-xs text-slate-600 mb-6">
                  The link expires in 1 hour. Check your spam folder if you don't see it.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => setSent(false)}
                    className="w-full py-2.5 rounded-xl text-sm font-medium text-content-muted
                      bg-surface/80 border border-divider/60 hover:bg-surface-hover hover:text-content transition-all"
                  >
                    Use a different email
                  </button>
                  <Link
                    to="/login"
                    className="block w-full py-2.5 rounded-xl text-sm font-semibold text-content text-center
                      bg-gradient-to-r from-primary-500 to-emerald-600 hover:from-primary-600 hover:to-emerald-700
                      shadow-lg shadow-primary-500/20 transition-all"
                  >
                    Back to Login
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-xs text-slate-600 mt-6">
            Remember your password?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 transition-colors font-medium">Sign In</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;

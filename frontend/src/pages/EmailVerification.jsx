/**
 * pages/EmailVerification.jsx
 * KrushiMitra AI — Email Verification Gate
 * Shown after registration. Auto-polls Firebase for verification status.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Mail, RefreshCw, LogOut, CheckCircle2, Clock, Sprout, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const RESEND_COOLDOWN = 60; // seconds

const EmailVerification = () => {
  const [resendCooldown, setResendCooldown]   = useState(0);
  const [checking, setChecking]               = useState(false);
  const [verified, setVerified]               = useState(false);
  const { firebaseUser, sendVerificationEmail, logout, syncUserToDb } = useAuth();
  const navigate = useNavigate();

  // ── Auto-poll every 5 seconds for verification ──────────────────────────────
  const checkVerification = useCallback(async () => {
    if (!firebaseUser || verified) return;
    try {
      await firebaseUser.reload();
      if (firebaseUser.emailVerified) {
        setVerified(true);
        // Sync the verified status to MongoDB
        await syncUserToDb(firebaseUser);
        toast.success('Email verified! Welcome to KrushiMitra AI 🌱');
        setTimeout(() => navigate('/dashboard', { replace: true }), 2000);
      }
    } catch {
      // Silent - will retry
    }
  }, [firebaseUser, verified, navigate, syncUserToDb]);

  // Poll every 5 seconds
  useEffect(() => {
    if (!firebaseUser) { navigate('/login'); return; }
    if (firebaseUser.emailVerified) { navigate('/dashboard', { replace: true }); return; }

    const interval = setInterval(checkVerification, 5000);
    return () => clearInterval(interval);
  }, [firebaseUser, navigate, checkVerification]);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // ── Manual verification check ──────────────────────────────────────────────
  const handleManualCheck = async () => {
    setChecking(true);
    await checkVerification();
    setChecking(false);
    if (!verified) toast('Still not verified. Check your inbox!', { icon: '📧' });
  };

  // ── Resend verification email ──────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await sendVerificationEmail();
      setResendCooldown(RESEND_COOLDOWN);
      toast.success('Verification email sent! Check your inbox.');
    } catch (err) {
      toast.error('Failed to resend. Please try again shortly.');
    }
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const email = firebaseUser?.email || 'your email address';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary-500/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'linear-gradient(rgba(34,197,94,0.5) 1px,transparent 1px),linear-gradient(to right,rgba(34,197,94,0.5) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
      </div>

      <div className="w-full max-w-md relative">
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="glass-panel rounded-3xl border border-divider/60 p-8"
        >
          <AnimatePresence mode="wait">
            {verified ? (
              /* ── Verified Success ──────────────────────────────────────── */
              <motion.div key="verified" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
                  className="w-20 h-20 bg-primary-500/10 border border-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-5"
                >
                  <CheckCircle2 className="h-10 w-10 text-primary-400" />
                </motion.div>
                <h2 className="text-2xl font-bold text-content mb-2">Email Verified! 🎉</h2>
                <p className="text-sm text-content-muted mb-4">
                  Your account is fully activated. Redirecting to dashboard...
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
                  <div className="h-3 w-3 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  Redirecting...
                </div>
              </motion.div>
            ) : (
              /* ── Pending Verification ──────────────────────────────────── */
              <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* Header */}
                <div className="flex items-center gap-3 mb-7">
                  <div className="h-11 w-11 bg-gradient-to-br from-primary-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                    <Sprout className="h-6 w-6 text-content" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-content">Verify Your Email</h2>
                    <p className="text-xs text-content-muted">KrushiMitra AI · Account Activation</p>
                  </div>
                </div>

                {/* Email icon with pulse */}
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    <div className="h-20 w-20 bg-primary-500/10 border border-primary-500/20 rounded-full flex items-center justify-center mx-auto">
                      <Mail className="h-9 w-9 text-primary-400" />
                    </div>
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-amber-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">1</span>
                  </div>
                </div>

                {/* Instructions */}
                <div className="text-center mb-6">
                  <h3 className="text-base font-semibold text-content mb-1.5">Check your inbox</h3>
                  <p className="text-sm text-content-muted leading-relaxed">
                    We sent a verification email to:<br />
                    <span className="text-primary-400 font-semibold text-sm break-all">{email}</span>
                  </p>
                </div>

                {/* Auto-poll indicator */}
                <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-surface/60 border border-divider/40 mb-5">
                  <div className="h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
                  <span className="text-xs text-content-muted">Checking automatically every 5 seconds...</span>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button onClick={handleManualCheck} disabled={checking}
                    className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-semibold text-sm
                      bg-gradient-to-r from-primary-500 to-emerald-600 hover:from-primary-600 hover:to-emerald-700
                      text-content shadow-lg shadow-primary-500/20 disabled:opacity-60 transition-all"
                  >
                    {checking
                      ? <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Checking...</>
                      : <><RefreshCw className="h-4 w-4" />I've Verified My Email</>
                    }
                  </button>

                  <button
                    onClick={handleResend}
                    disabled={resendCooldown > 0}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium
                      bg-surface/80 border border-divider/60 text-content-muted
                      hover:bg-surface-hover hover:text-content disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {resendCooldown > 0 ? (
                      <><Clock className="h-4 w-4" />Resend in {resendCooldown}s</>
                    ) : (
                      <><Mail className="h-4 w-4" />Resend Verification Email</>
                    )}
                  </button>

                  <button onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium
                      text-slate-600 hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/20 transition-all"
                  >
                    <LogOut className="h-3.5 w-3.5" />Sign out and use a different account
                  </button>
                </div>

                {/* Help text */}
                <p className="text-center text-xs text-slate-600 mt-5 leading-relaxed">
                  Don't see the email? Check your <strong className="text-content-muted">spam/junk</strong> folder.<br />
                  The link expires in <strong className="text-content-muted">24 hours</strong>.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default EmailVerification;

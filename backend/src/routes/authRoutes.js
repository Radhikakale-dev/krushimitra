/**
 * routes/authRoutes.js
 * KrushiMitra AI — Authentication Routes
 */
import express from 'express';
import {
  syncFirebaseUser,
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  listUsers,
  toggleUserStatus,
  updateUserRole,
} from '../controllers/authController.js';
import { protect, verifyFirebaseOnly, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// ── Public Routes ─────────────────────────────────────────────────────────────
router.post('/register', register);
router.post('/login',    login);

// ── Firebase Sync (token required, but user may not be in DB yet) ─────────────
router.post('/sync', verifyFirebaseOnly, syncFirebaseUser);

// ── Protected Profile Routes ──────────────────────────────────────────────────
router.get('/profile',             protect, getProfile);
router.put('/profile',             protect, updateProfile);
router.put('/change-password',     protect, changePassword);

// ── Admin-only User Management ────────────────────────────────────────────────
router.get('/users',               protect, authorize('admin'), listUsers);
router.put('/users/:id/toggle',    protect, authorize('admin'), toggleUserStatus);
router.put('/users/:id/role',      protect, authorize('admin'), updateUserRole);

export default router;

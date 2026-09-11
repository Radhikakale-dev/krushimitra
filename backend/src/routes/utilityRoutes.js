/**
 * routes/settingsRoutes.js + routes/notificationRoutes.js + routes/auditRoutes.js
 * Combined routing file for settings, notifications, audit logs, and email.
 */

// ── Settings Routes ───────────────────────────────────────────────────────────
import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { getNotifications, markAsRead } from '../controllers/notificationController.js';
import { getAuditLogs, getAuditActions } from '../controllers/auditController.js';
import { emailInvoice, whatsappInvoice } from '../controllers/emailController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

// ── Settings ──────────────────────────────────────────────────────────────────
export const settingsRouter = express.Router();
settingsRouter.use(protect);
settingsRouter.get('/',   getSettings);
settingsRouter.put('/',   authorize('admin'), updateSettings);

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationRouter = express.Router();
notificationRouter.use(protect);
notificationRouter.get('/', getNotifications);
notificationRouter.put('/:id/read', markAsRead);

// ── Audit Logs ────────────────────────────────────────────────────────────────
export const auditRouter = express.Router();
auditRouter.use(protect);
auditRouter.use(authorize('admin'));
auditRouter.get('/',       getAuditLogs);
auditRouter.get('/actions', getAuditActions);

// ── Email / WhatsApp ──────────────────────────────────────────────────────────
export const emailRouter = express.Router();
emailRouter.use(protect);
emailRouter.post('/bills/:id/email',     emailInvoice);
emailRouter.get('/bills/:id/whatsapp',   whatsappInvoice);

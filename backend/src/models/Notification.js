/**
 * models/Notification.js
 * KrushiMitra AI — System Notifications (Low Stock, Expiry, etc.)
 */
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRY_ALERT', 'EXPIRED',
      'CREDIT_DUE', 'PAYMENT_RECEIVED', 'BACKUP_DONE',
      'SYSTEM', 'PURCHASE', 'SALE',
    ],
    required: true,
  },
  title:    { type: String, required: true },
  message:  { type: String, required: true },
  severity: { type: String, enum: ['info', 'warning', 'error', 'success'], default: 'info' },

  // ── Link to source ────────────────────────────────────────────────────────────
  resource:   { type: String, default: '' },              // 'Product', 'Customer', etc.
  resourceId: { type: mongoose.Schema.Types.ObjectId, default: null },

  // ── Read status ───────────────────────────────────────────────────────────────
  isRead:  { type: Boolean, default: false },
  readBy:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // ── Targeting ────────────────────────────────────────────────────────────────
  forRoles: { type: [String], default: ['admin'] },        // Who should see this
  createdAt: { type: Date, default: Date.now },
}, { timestamps: false });

notificationSchema.index({ isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;

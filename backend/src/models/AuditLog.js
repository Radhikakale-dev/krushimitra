/**
 * models/AuditLog.js
 * KrushiMitra AI — Immutable audit trail for every significant action.
 * Records who did what, when, on which resource.
 */
import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  // ── Actor ────────────────────────────────────────────────────────────────────
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName:  { type: String, required: true },            // Snapshot at log time
  userRole:  { type: String, enum: ['admin', 'employee'], required: true },

  // ── Action ───────────────────────────────────────────────────────────────────
  action: {
    type: String,
    enum: [
      'CREATE', 'READ', 'UPDATE', 'DELETE',
      'LOGIN', 'LOGOUT', 'PRINT', 'EXPORT',
      'BACKUP', 'RESTORE', 'PAYMENT', 'CANCEL',
      'STOCK_IN', 'STOCK_OUT', 'STOCK_ADJUST',
      'EMAIL_SENT', 'WHATSAPP_SENT',
    ],
    required: true,
  },

  // ── Resource ──────────────────────────────────────────────────────────────────
  resource:   { type: String, required: true },           // e.g. 'Bill', 'Product'
  resourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
  resourceNo: { type: String, default: '' },              // e.g. 'INV-2026-0001'

  // ── Change Detail ──────────────────────────────────────────────────────────────
  description: { type: String, required: true },          // Human-readable description
  changes: {
    before: { type: mongoose.Schema.Types.Mixed, default: null },
    after:  { type: mongoose.Schema.Types.Mixed, default: null },
  },

  // ── Context ───────────────────────────────────────────────────────────────────
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
}, {
  timestamps: false,
  // Capped collection: auto-delete oldest when exceeding 50,000 logs (~25MB)
});

auditLogSchema.index({ user: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });
auditLogSchema.index({ timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;

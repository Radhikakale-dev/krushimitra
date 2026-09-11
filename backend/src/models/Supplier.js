/**
 * models/Supplier.js
 * Supplier with outstanding payments and purchase tracking.
 */
import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  name:         { type: String, required: [true, 'Supplier name is required'], trim: true },
  contactPerson:{ type: String, trim: true, default: '' },
  phone:        { type: String, required: [true, 'Phone is required'], trim: true },
  email:        { type: String, trim: true, lowercase: true, default: '' },
  address:      { type: String, trim: true, default: '' },
  city:         { type: String, trim: true, default: '' },
  state:        { type: String, trim: true, default: '' },

  // ── Business Details ──────────────────────────────────────────────────────────
  gstNo:        { type: String, trim: true, uppercase: true, default: '' },
  panNo:        { type: String, trim: true, uppercase: true, default: '' },
  licenseNo:    { type: String, trim: true, default: '' },     // Pesticide / fertilizer license

  // ── Financial ─────────────────────────────────────────────────────────────────
  outstandingBalance: { type: Number, default: 0 }, // Amount we owe supplier
  totalPurchases:     { type: Number, default: 0 },
  creditDays:         { type: Number, default: 30 }, // Payment terms

  notes:    { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

supplierSchema.index({ name: 'text' });
supplierSchema.index({ phone: 1 }, { unique: true });

const Supplier = mongoose.model('Supplier', supplierSchema);
export default Supplier;

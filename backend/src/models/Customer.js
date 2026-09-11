/**
 * models/Customer.js
 * Customer with credit management and purchase history tracking.
 */
import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name:    { type: String, required: [true, 'Customer name is required'], trim: true },
  phone:   { type: String, required: [true, 'Phone is required'], trim: true },
  email:   { type: String, trim: true, lowercase: true, default: '' },
  address: { type: String, trim: true, default: '' },
  village: { type: String, trim: true, default: '' },
  taluka:  { type: String, trim: true, default: '' },
  district:{ type: String, trim: true, default: '' },

  // ── GST / Business ────────────────────────────────────────────────────────────
  gstNo:   { type: String, trim: true, uppercase: true, default: '' },
  panNo:   { type: String, trim: true, uppercase: true, default: '' },

  // ── Credit Management ─────────────────────────────────────────────────────────
  creditLimit:        { type: Number, default: 0 },
  outstandingBalance: { type: Number, default: 0 },  // Positive = customer owes money
  totalPurchases:     { type: Number, default: 0 },
  totalBills:         { type: Number, default: 0 },

  // ── Metadata ──────────────────────────────────────────────────────────────────
  notes:    { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  avatar:   { type: String, default: '' },
}, { timestamps: true });

customerSchema.index({ name: 'text', phone: 'text' });
customerSchema.index({ phone: 1 }, { unique: true });

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;

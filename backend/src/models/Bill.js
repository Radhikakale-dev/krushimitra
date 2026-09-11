/**
 * models/Bill.js
 * Full POS Invoice / Bill schema.
 * Contains embedded line items and payment details.
 */
import mongoose from 'mongoose';

// ── Embedded Bill Item Schema ─────────────────────────────────────────────────
const billItemSchema = new mongoose.Schema({
  product:        { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName:    { type: String, required: true },     // Snapshot at time of sale
  sku:            { type: String, required: true },
  hsnCode:        { type: String, default: '' },
  quantity:       { type: Number, required: true, min: 0.001 },
  unit:           { type: String, default: 'piece' },
  unitPrice:      { type: Number, required: true },     // Price before discount/GST
  mrp:            { type: Number, default: 0 },
  discountPercent:{ type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  gstRate:        { type: Number, default: 0 },
  cgst:           { type: Number, default: 0 },
  sgst:           { type: Number, default: 0 },
  igst:           { type: Number, default: 0 },
  subtotal:       { type: Number, required: true },     // qty × unitPrice - discount
  total:          { type: Number, required: true },     // subtotal + gst
}, { _id: false });

// ── Payment Entry Schema ──────────────────────────────────────────────────────
const paymentSchema = new mongoose.Schema({
  mode:   { type: String, enum: ['Cash', 'UPI', 'Card', 'Credit', 'Cheque'], required: true },
  amount: { type: Number, required: true },
  reference: { type: String, default: '' }, // UPI ref, cheque no, etc.
}, { _id: false });

// ── Main Bill Schema ──────────────────────────────────────────────────────────
const billSchema = new mongoose.Schema({
  invoiceNo: {
    type: String,
    unique: true,
    required: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null, // Walk-in customer allowed
  },
  customerName:  { type: String, default: 'Walk-in Customer' },
  customerPhone: { type: String, default: '' },

  // ── Line Items ────────────────────────────────────────────────────────────────
  items: [billItemSchema],

  // ── Totals ───────────────────────────────────────────────────────────────────
  subtotal:       { type: Number, required: true },      // Sum of item subtotals
  totalDiscount:  { type: Number, default: 0 },
  totalCgst:      { type: Number, default: 0 },
  totalSgst:      { type: Number, default: 0 },
  totalGst:       { type: Number, default: 0 },
  grandTotal:     { type: Number, required: true },

  // ── Payment ──────────────────────────────────────────────────────────────────
  payments:       [paymentSchema],
  amountPaid:     { type: Number, default: 0 },
  balance:        { type: Number, default: 0 },     // Positive = change returned; negative = credit
  status: {
    type: String,
    enum: ['Paid', 'Partial', 'Credit', 'Cancelled'],
    default: 'Paid',
  },

  // ── Metadata ──────────────────────────────────────────────────────────────────
  cashier:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notes:    { type: String, default: '' },
  date:     { type: Date, default: Date.now },
  isReturn: { type: Boolean, default: false },
  returnRef:{ type: mongoose.Schema.Types.ObjectId, ref: 'Bill', default: null },
}, { timestamps: true });

// Note: invoiceNo is already indexed via unique:true above
billSchema.index({ date: -1 });
billSchema.index({ customer: 1 });
billSchema.index({ cashier: 1 });
billSchema.index({ status: 1 });

const Bill = mongoose.model('Bill', billSchema);
export default Bill;

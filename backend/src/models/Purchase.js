/**
 * models/Purchase.js
 * KrushiMitra AI — Purchase Bill (Stock Inward from Supplier)
 * Tracks every purchase transaction with embedded items and payment status.
 */
import mongoose from 'mongoose';

// ── Embedded Purchase Item ────────────────────────────────────────────────────
const purchaseItemSchema = new mongoose.Schema({
  product:       { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName:   { type: String, required: true },    // Snapshot
  sku:           { type: String, required: true },
  hsnCode:       { type: String, default: '' },
  batchNumber:   { type: String, default: '' },
  expiryDate:    { type: Date, default: null },
  quantity:      { type: Number, required: true, min: 0.001 },
  unit:          { type: String, default: 'piece' },
  unitCost:      { type: Number, required: true },   // Purchase price per unit (excl. GST)
  mrp:           { type: Number, default: 0 },
  sellingPrice:  { type: Number, default: 0 },       // Can update product selling price on purchase
  discountPct:   { type: Number, default: 0 },
  discountAmt:   { type: Number, default: 0 },
  gstRate:       { type: Number, default: 18 },
  cgst:          { type: Number, default: 0 },
  sgst:          { type: Number, default: 0 },
  taxableAmount: { type: Number, required: true },
  totalAmount:   { type: Number, required: true },
}, { _id: false });

// ── Main Purchase Bill ────────────────────────────────────────────────────────
const purchaseSchema = new mongoose.Schema({
  purchaseNo:  { type: String, unique: true, required: true },   // e.g. PUR-2026-0001
  supplierInvoiceNo: { type: String, default: '' },             // Supplier's own invoice no.

  supplier:    { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  supplierName:{ type: String, required: true },

  items:       [purchaseItemSchema],

  // ── Totals ──────────────────────────────────────────────────────────────────
  subtotal:       { type: Number, required: true },
  totalDiscount:  { type: Number, default: 0 },
  totalCgst:      { type: Number, default: 0 },
  totalSgst:      { type: Number, default: 0 },
  totalGst:       { type: Number, default: 0 },
  grandTotal:     { type: Number, required: true },

  // ── Payment ─────────────────────────────────────────────────────────────────
  amountPaid:     { type: Number, default: 0 },
  balance:        { type: Number, default: 0 },    // Remaining to pay supplier
  status: {
    type: String,
    enum: ['Paid', 'Partial', 'Unpaid', 'Cancelled'],
    default: 'Unpaid',
  },
  paymentMode:    { type: String, enum: ['Cash', 'UPI', 'Card', 'Cheque', 'Bank Transfer'], default: 'Cash' },
  paymentRef:     { type: String, default: '' },

  // ── Metadata ────────────────────────────────────────────────────────────────
  purchaseDate:   { type: Date, default: Date.now },
  receivedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  warehouse:      { type: String, default: 'Main Store' },
  notes:          { type: String, default: '' },
}, { timestamps: true });

purchaseSchema.index({ purchaseNo: 1 });
purchaseSchema.index({ supplier: 1 });
purchaseSchema.index({ purchaseDate: -1 });
purchaseSchema.index({ status: 1 });

const Purchase = mongoose.model('Purchase', purchaseSchema);
export default Purchase;

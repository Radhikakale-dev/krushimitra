/**
 * models/Inventory.js
 * Stock movement log — every stock in/out/adjustment is recorded here.
 */
import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: { type: String, required: true }, // Snapshot
  sku:         { type: String, required: true },

  type: {
    type: String,
    enum: ['StockIn', 'StockOut', 'Adjustment', 'Return', 'Opening'],
    required: true,
  },

  quantity:      { type: Number, required: true },         // Can be negative for adjustments
  previousStock: { type: Number, required: true },
  newStock:      { type: Number, required: true },

  // ── Reference ─────────────────────────────────────────────────────────────────
  referenceType: { type: String, enum: ['Bill', 'Purchase', 'Manual', 'Return', null], default: null },
  referenceId:   { type: mongoose.Schema.Types.ObjectId, default: null },
  referenceNo:   { type: String, default: '' },            // Invoice/Purchase order no.

  // ── Pricing ───────────────────────────────────────────────────────────────────
  purchasePrice: { type: Number, default: 0 },             // For StockIn valuation
  sellingPrice:  { type: Number, default: 0 },             // For StockOut valuation

  notes:    { type: String, default: '' },
  createdBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date:     { type: Date, default: Date.now },
}, { timestamps: true });

inventorySchema.index({ product: 1, date: -1 });
inventorySchema.index({ type: 1, date: -1 });

const Inventory = mongoose.model('Inventory', inventorySchema);
export default Inventory;

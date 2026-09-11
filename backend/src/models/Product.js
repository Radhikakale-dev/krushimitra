/**
 * models/Product.js
 * KrushiMitra AI — Full Agriculture Product Schema
 * Fields: pricing, GST, stock, barcode, image, brand, batch, expiry, QR
 */
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  // ── Identity ──────────────────────────────────────────────────────────────────
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [150, 'Product name cannot exceed 150 characters'],
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  barcode:   { type: String, trim: true, default: '' },
  hsnCode:   { type: String, trim: true, default: '' },         // HSN for GST
  brand:     { type: String, trim: true, default: '' },         // Brand / company name
  batchNumber: { type: String, trim: true, default: '' },       // Batch / lot number
  expiryDate:  { type: Date, default: null },                   // Product expiry

  // ── Relationships ─────────────────────────────────────────────────────────────
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    default: null,
  },
  description: { type: String, trim: true, default: '' },

  // ── Pricing ───────────────────────────────────────────────────────────────────
  purchasePrice: { type: Number, required: true, min: [0, 'Price cannot be negative'] },
  sellingPrice:  { type: Number, required: true, min: [0, 'Price cannot be negative'] },
  mrp:           { type: Number, default: 0 },                  // Maximum Retail Price

  // ── GST ───────────────────────────────────────────────────────────────────────
  gstRate: {
    type: Number,
    enum: [0, 5, 12, 18, 28],
    default: 18,
  },
  gstInclusive: { type: Boolean, default: false },              // Is selling price GST-inclusive?

  // ── Stock ─────────────────────────────────────────────────────────────────────
  stock:    { type: Number, default: 0, min: 0 },
  minStock: { type: Number, default: 5 },                       // Low stock alert threshold
  unit: {
    type: String,
    enum: ['piece', 'kg', 'gram', 'liter', 'ml', 'bag', 'box', 'packet', 'dozen', 'meter', 'quintal', 'ton'],
    default: 'piece',
  },

  // ── Status & Media ────────────────────────────────────────────────────────────
  isActive: { type: Boolean, default: true },
  image:    { type: String, default: '' },                      // Base64 or URL
}, { timestamps: true });

// ── Indexes for performance ────────────────────────────────────────────────────
productSchema.index({ name: 'text', sku: 'text', brand: 'text' }); // Full-text search
productSchema.index({ category: 1 });
productSchema.index({ stock: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ barcode: 1 });
productSchema.index({ expiryDate: 1 });

// ── Virtual: stock status ──────────────────────────────────────────────────────
productSchema.virtual('stockStatus').get(function () {
  if (this.stock === 0)               return 'out_of_stock';
  if (this.stock <= this.minStock)    return 'low_stock';
  return 'in_stock';
});

// ── Virtual: is expired ────────────────────────────────────────────────────────
productSchema.virtual('isExpired').get(function () {
  if (!this.expiryDate) return false;
  return new Date(this.expiryDate) < new Date();
});

const Product = mongoose.model('Product', productSchema);
export default Product;

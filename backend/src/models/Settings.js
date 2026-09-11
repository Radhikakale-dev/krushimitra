/**
 * models/Settings.js
 * Global shop configuration — one singleton document.
 */
import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  // ── Shop Identity ─────────────────────────────────────────────────────────────
  shopName:    { type: String, default: 'KrushiMitra Agri Shop' },
  tagline:     { type: String, default: 'Your Trusted Agriculture Partner' },
  logo:        { type: String, default: '' },               // Base64 or URL
  phone:       { type: String, default: '' },
  email:       { type: String, default: '' },
  address:     { type: String, default: '' },
  city:        { type: String, default: '' },
  state:       { type: String, default: 'Maharashtra' },
  pincode:     { type: String, default: '' },
  website:     { type: String, default: '' },

  // ── Tax Registration ──────────────────────────────────────────────────────────
  gstNo:       { type: String, default: '' },
  panNo:       { type: String, default: '' },
  fssaiNo:     { type: String, default: '' },
  licenseNo:   { type: String, default: '' },

  // ── Financial ─────────────────────────────────────────────────────────────────
  currency:       { type: String, default: 'INR' },
  financialYearStart: { type: String, default: 'April' },
  invoicePrefix:  { type: String, default: 'INV' },
  invoiceStartNo: { type: Number, default: 1 },
  currentInvoiceNo: { type: Number, default: 1 },

  // ── Printer ───────────────────────────────────────────────────────────────────
  printCopies:  { type: Number, default: 1 },
  paperSize:    { type: String, enum: ['A4', 'A5', '80mm', '58mm'], default: '80mm' },
  printerName:  { type: String, default: '' },
  showLogo:     { type: Boolean, default: true },
  showSignature:{ type: Boolean, default: false },

  // ── System ────────────────────────────────────────────────────────────────────
  defaultGstRate:  { type: Number, enum: [0, 5, 12, 18, 28], default: 18 },
  allowCreditSales:{ type: Boolean, default: true },
  lowStockAlert:   { type: Boolean, default: true },
  backupEnabled:   { type: Boolean, default: false },
  lastBackup:      { type: Date, default: null },
}, { timestamps: true });

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;

/**
 * controllers/settingsController.js
 * KrushiMitra AI — Shop Settings Controller
 *
 * One singleton Settings document per installation.
 */
import Settings  from '../models/Settings.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/settings
// @desc    Get shop settings (creates default if not exists)
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const getSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  res.json({ success: true, data: settings });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/settings
// @desc    Update shop settings
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const updateSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = new Settings();
  }

  // Whitelist updatable fields
  const updatable = [
    'shopName', 'tagline', 'logo', 'phone', 'email', 'address',
    'city', 'state', 'pincode', 'website',
    'gstNo', 'panNo', 'fssaiNo', 'licenseNo',
    'currency', 'financialYearStart', 'invoicePrefix',
    'printCopies', 'paperSize', 'printerName', 'showLogo', 'showSignature',
    'defaultGstRate', 'allowCreditSales', 'lowStockAlert', 'backupEnabled',
    'smtpHost', 'smtpPort', 'smtpUser', 'smtpPass', 'smtpFromName',
  ];

  updatable.forEach(field => {
    if (req.body[field] !== undefined) settings[field] = req.body[field];
  });

  await settings.save();
  res.json({ success: true, message: 'Settings saved successfully', data: settings });
});

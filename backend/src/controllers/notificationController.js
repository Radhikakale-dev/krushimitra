/**
 * controllers/notificationController.js
 * KrushiMitra AI — System Notifications + Alert Generation
 */
import Notification from '../models/Notification.js';
import Product      from '../models/Product.js';
import Customer     from '../models/Customer.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

// ── Helper: Generate smart alert notifications from current data ───────────────
export const generateAlerts = async () => {
  const now          = new Date();
  const thirtyDays   = new Date(); thirtyDays.setDate(now.getDate() + 30);
  const sevenDays    = new Date(); sevenDays.setDate(now.getDate() + 7);

  const [lowStock, outOfStock, expired, expiringSoon, creditDue] = await Promise.all([
    Product.find({ isActive: true, $expr: { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$minStock'] }] } })
      .select('name sku stock minStock').lean(),
    Product.find({ isActive: true, stock: 0 }).select('name sku').lean(),
    Product.find({ isActive: true, expiryDate: { $lt: now } }).select('name sku expiryDate').lean(),
    Product.find({ isActive: true, expiryDate: { $gte: now, $lte: sevenDays } }).select('name sku expiryDate').lean(),
    Customer.find({ isActive: true, outstandingBalance: { $gt: 1000 } }).select('name phone outstandingBalance').limit(10).lean(),
  ]);

  const notifications = [];

  if (outOfStock.length > 0) {
    notifications.push({
      type: 'OUT_OF_STOCK',
      title: `${outOfStock.length} Products Out of Stock`,
      message: outOfStock.slice(0, 3).map(p => p.name).join(', ') + (outOfStock.length > 3 ? ` +${outOfStock.length - 3} more` : ''),
      severity: 'error',
      resource: 'Product',
    });
  }

  if (lowStock.length > 0) {
    notifications.push({
      type: 'LOW_STOCK',
      title: `${lowStock.length} Products Low on Stock`,
      message: lowStock.slice(0, 3).map(p => `${p.name} (${p.stock}/${p.minStock})`).join(', '),
      severity: 'warning',
      resource: 'Product',
    });
  }

  if (expired.length > 0) {
    notifications.push({
      type: 'EXPIRED',
      title: `${expired.length} Products Expired`,
      message: expired.slice(0, 3).map(p => p.name).join(', ') + ' — Remove from shelves immediately!',
      severity: 'error',
      resource: 'Product',
    });
  }

  if (expiringSoon.length > 0) {
    notifications.push({
      type: 'EXPIRY_ALERT',
      title: `${expiringSoon.length} Products Expiring in 7 Days`,
      message: expiringSoon.slice(0, 3).map(p => `${p.name} (${new Date(p.expiryDate).toLocaleDateString('en-IN')})`).join(', '),
      severity: 'warning',
      resource: 'Product',
    });
  }

  if (creditDue.length > 0) {
    notifications.push({
      type: 'CREDIT_DUE',
      title: `${creditDue.length} Customers with High Outstanding`,
      message: creditDue.slice(0, 2).map(c => `${c.name}: ₹${c.outstandingBalance}`).join(', '),
      severity: 'warning',
      resource: 'Customer',
    });
  }

  return notifications;
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/notifications
// @desc    Get current notifications (auto-generated from live data)
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const getNotifications = asyncHandler(async (req, res) => {
  const alerts = await generateAlerts();
  
  // Also fetch any persisted notifications
  const persisted = await Notification.find({ isRead: false })
    .sort({ createdAt: -1 }).limit(20).lean();

  res.json({
    success: true,
    data: {
      alerts,          // Dynamic, generated on-the-fly
      persisted,       // Saved notifications
      total: alerts.length + persisted.length,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/notifications/:id/read
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const markAsRead = asyncHandler(async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, {
    isRead: true,
    $addToSet: { readBy: req.user._id },
  });
  res.json({ success: true, message: 'Notification marked as read' });
});

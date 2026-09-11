/**
 * controllers/auditController.js
 * KrushiMitra AI — Activity Logs API
 */
import AuditLog from '../models/AuditLog.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/audit
// @desc    Get activity logs with pagination, user and action filters
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const getAuditLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, action, resource, userId, from, to, search } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const query = {};
  if (action)   query.action   = action;
  if (resource) query.resource = resource;
  if (userId)   query.user     = userId;
  if (search) {
    query.$or = [
      { description: { $regex: search, $options: 'i' } },
      { userName:    { $regex: search, $options: 'i' } },
      { resourceNo:  { $regex: search, $options: 'i' } },
    ];
  }
  if (from || to) {
    query.timestamp = {};
    if (from) query.timestamp.$gte = new Date(from);
    if (to)   query.timestamp.$lte = new Date(new Date(to).setHours(23, 59, 59, 999));
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('user', 'name role')
      .lean(),
    AuditLog.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: logs,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/audit/actions
// @desc    Get list of all unique action types (for filter dropdown)
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const getAuditActions = asyncHandler(async (req, res) => {
  const actions = await AuditLog.distinct('action');
  res.json({ success: true, data: actions });
});

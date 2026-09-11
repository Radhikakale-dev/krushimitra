/**
 * middleware/auditMiddleware.js
 * KrushiMitra AI — Automatic Action Logging
 *
 * Usage: router.post('/bills', protect, auditAction('CREATE', 'Bill'), createBill)
 * Or:    Use logAudit() helper directly inside controllers for fine-grained control.
 */
import AuditLog from '../models/AuditLog.js';

// ── Direct helper for use inside controllers ──────────────────────────────────
export const logAudit = async ({
  user,
  action,
  resource,
  resourceId = null,
  resourceNo = '',
  description,
  before = null,
  after = null,
  req = null,
}) => {
  try {
    await AuditLog.create({
      user:        user._id || user,
      userName:    user.name || 'System',
      userRole:    user.role || 'employee',
      action,
      resource,
      resourceId,
      resourceNo,
      description,
      changes:     { before, after },
      ipAddress:   req?.ip || req?.connection?.remoteAddress || '',
      userAgent:   req?.headers?.['user-agent'] || '',
      timestamp:   new Date(),
    });
  } catch (err) {
    // Audit log failure should never break the main request
    console.error('[AuditLog] Failed to write audit log:', err.message);
  }
};

// ── Express middleware factory ────────────────────────────────────────────────
export const auditAction = (action, resource) => async (req, res, next) => {
  // Capture original json() to intercept successful responses
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    // Only log on success responses (2xx)
    if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
      const resourceId = body?.data?._id || req.params?.id || null;
      const resourceNo = body?.data?.invoiceNo || body?.data?.purchaseNo || body?.data?.sku || '';

      logAudit({
        user:        req.user,
        action,
        resource,
        resourceId,
        resourceNo,
        description: `${action} on ${resource}${resourceNo ? ` (${resourceNo})` : ''}`,
        after:       body?.data || null,
        req,
      }).catch(console.error);
    }
    return originalJson(body);
  };

  next();
};

// ── Login / Logout special logger ─────────────────────────────────────────────
export const logLogin = async (user, req) => {
  await logAudit({
    user,
    action: 'LOGIN',
    resource: 'Auth',
    description: `${user.name} (${user.role}) logged in`,
    req,
  });
};

export const logLogout = async (user, req) => {
  await logAudit({
    user,
    action: 'LOGOUT',
    resource: 'Auth',
    description: `${user.name} logged out`,
    req,
  });
};

/**
 * middleware/authMiddleware.js
 * KrushiMitra AI — Authentication & Authorization Middleware
 * Supports dual token verification: Firebase ID tokens + custom JWTs
 */
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { verifyFirebaseToken } from '../utils/firebaseVerifier.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Extract Bearer token from Authorization header
// ─────────────────────────────────────────────────────────────────────────────
const extractToken = (req) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.split(' ')[1];
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// verifyFirebaseOnly
// Verifies token and sets req.firebaseUser WITHOUT requiring DB lookup.
// Use for sync/onboarding endpoints where the user may not yet exist in MongoDB.
// ─────────────────────────────────────────────────────────────────────────────
export const verifyFirebaseOnly = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: 'No authorization token provided' });
  }

  try {
    const decoded = jwt.decode(token);

    if (decoded?.iss?.startsWith('https://securetoken.google.com/')) {
      // Firebase token
      const firebaseUser = await verifyFirebaseToken(token);
      req.firebaseUser = {
        email:         firebaseUser.email,
        uid:           firebaseUser.uid || firebaseUser.sub,
        emailVerified: firebaseUser.email_verified || false,
        provider:      firebaseUser.firebase?.sign_in_provider || 'firebase',
        name:          firebaseUser.name || '',
        picture:       firebaseUser.picture || '',
      };
    } else {
      // Custom JWT fallback
      const verified = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(verified.id).select('-password');
      if (!user) return res.status(401).json({ success: false, message: 'User not found' });
      req.firebaseUser = { email: user.email, uid: user._id.toString(), emailVerified: true, provider: 'email' };
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: `Token verification failed: ${error.message}` });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// protect
// Full auth guard — verifies token AND requires matching MongoDB user record.
// ─────────────────────────────────────────────────────────────────────────────
export const protect = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: 'No authorization token provided' });
  }

  try {
    const decoded = jwt.decode(token);
    let userEmail, userId;

    if (decoded?.iss?.startsWith('https://securetoken.google.com/')) {
      // Firebase ID token
      const firebaseUser = await verifyFirebaseToken(token);
      userEmail = firebaseUser.email;
    } else {
      // Custom JWT
      const verified = jwt.verify(token, process.env.JWT_SECRET);
      userId = verified.id;
    }

    // Resolve user from DB
    req.user = userEmail
      ? await User.findOne({ email: userEmail.toLowerCase() }).select('-password')
      : await User.findById(userId).select('-password');

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Account not found. Please register first.' });
    }

    if (!req.user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact administrator.' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: `Session invalid: ${error.message}` });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// authorize
// Role guard — must come AFTER protect middleware.
// Usage: router.get('/admin-only', protect, authorize('admin'), controller)
// ─────────────────────────────────────────────────────────────────────────────
export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user?.role || 'none'}`,
    });
  }
  next();
};

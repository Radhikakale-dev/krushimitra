/**
 * controllers/authController.js
 * KrushiMitra AI — Authentication Controller
 * Handles: Register, Login, Sync (Firebase), Profile, Password
 */
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

// ── Helper: Generate custom JWT ───────────────────────────────────────────────
const generateToken = (id, expiresIn = '7d') =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn });

// ── Helper: Safe user response object ────────────────────────────────────────
const userResponse = (user, token = null) => ({
  _id:           user._id,
  name:          user.name,
  email:         user.email,
  role:          user.role,
  isActive:      user.isActive,
  photoURL:      user.photoURL,
  phone:         user.phone,
  department:    user.department,
  employeeId:    user.employeeId,
  emailVerified: user.emailVerified,
  provider:      user.provider,
  lastLoginAt:   user.lastLoginAt,
  createdAt:     user.createdAt,
  ...(token && { token }),
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/auth/sync
// @desc    Sync Firebase-authenticated user to MongoDB (create or update)
// @access  Firebase token required (verifyFirebaseOnly middleware)
// @note    Called after every Firebase login/register to ensure DB record exists
// ─────────────────────────────────────────────────────────────────────────────
export const syncFirebaseUser = asyncHandler(async (req, res) => {
  const { name, role, photoURL } = req.body;
  const { email, uid, emailVerified, provider, picture } = req.firebaseUser;

  const normalizedEmail = email.toLowerCase();

  // Check if user already exists
  let user = await User.findOne({ email: normalizedEmail });
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    // Determine role: first user in DB = admin, otherwise use requested role
    const userCount = await User.countDocuments({});
    const safeRole = ['admin', 'employee'].includes(role) ? role : 'employee';
    const assignedRole = userCount === 0 ? 'admin' : safeRole;

    // Create new MongoDB profile from Firebase user
    user = await User.create({
      name:          name || email.split('@')[0],
      email:         normalizedEmail,
      password:      null,                    // Firebase manages password
      role:          assignedRole,
      provider:      provider === 'google.com' ? 'google' : 'firebase',
      firebaseUid:   uid,
      googleId:      provider === 'google.com' ? uid : '',
      photoURL:      photoURL || picture || '',
      emailVerified: emailVerified || false,
      lastLoginAt:   new Date(),
      isActive:      true,
    });
  } else {
    // Update existing user's Firebase sync fields
    user.lastLoginAt   = new Date();
    user.emailVerified = emailVerified ?? user.emailVerified;
    if (uid && !user.firebaseUid)   user.firebaseUid = uid;
    if (uid && provider === 'google.com' && !user.googleId) user.googleId = uid;
    if ((photoURL || picture) && !user.photoURL) user.photoURL = photoURL || picture;
    await user.save();
  }

  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Your account has been deactivated. Please contact the administrator.',
    });
  }

  const token = generateToken(user._id);
  res.status(isNewUser ? 201 : 200).json({
    success: true,
    message: isNewUser ? 'Account created successfully' : 'Session synchronized',
    data: userResponse(user, token),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/auth/register
// @desc    Register with email + password (fallback / admin setup without Firebase)
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Check if email already registered
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(400).json({ success: false, message: 'An account with this email already exists' });
  }

  // First registered user automatically becomes admin
  const userCount = await User.countDocuments({});
  const safeRole = ['admin', 'employee'].includes(role) ? role : 'employee';
  const assignedRole = userCount === 0 ? 'admin' : safeRole;

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase(),
    password,
    role: assignedRole,
    provider: 'email',
    emailVerified: false,
    isActive: true,
  });

  const token = generateToken(user._id);
  res.status(201).json({
    success: true,
    message: `${assignedRole === 'admin' ? 'Admin' : 'Employee'} account created successfully`,
    data: userResponse(user, token),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/auth/login
// @desc    Login with email + password (fallback mode)
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'Account deactivated. Contact administrator.' });
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id);
  res.json({
    success: true,
    message: 'Login successful',
    data: userResponse(user, token),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/auth/profile
// @desc    Get authenticated user's profile
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const getProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, data: userResponse(req.user) });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/auth/profile
// @desc    Update profile (name, phone, department)
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, department, photoURL } = req.body;

  const user = await User.findById(req.user._id);
  if (name)       user.name       = name.trim();
  if (phone)      user.phone      = phone.trim();
  if (department) user.department = department.trim();
  if (photoURL)   user.photoURL   = photoURL;

  await user.save();
  res.json({ success: true, message: 'Profile updated successfully', data: userResponse(user) });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/auth/change-password
// @desc    Change password for email-based accounts
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);
  if (user.provider !== 'email') {
    return res.status(400).json({ success: false, message: 'Password change is only for email/password accounts. Use Firebase for social accounts.' });
  }

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password changed successfully' });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/auth/users
// @desc    List all users (admin only)
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const listUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search = '', role = '' } = req.query;
  const skip = (page - 1) * limit;

  const query = {};
  if (search) query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
  ];
  if (role) query.role = role;

  const [users, total] = await Promise.all([
    User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: users.map(u => userResponse(u)),
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/auth/users/:id/toggle-status
// @desc    Enable/disable a user account (admin only)
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
  }

  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    message: `User account ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    data: userResponse(user),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/auth/users/:id/role
// @desc    Change a user's role (admin only)
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'employee'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role. Must be admin or employee.' });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  user.role = role;
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, message: 'User role updated', data: userResponse(user) });
});

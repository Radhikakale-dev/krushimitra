/**
 * controllers/userController.js
 * KrushiMitra AI — User Management Controller (Admin)
 *
 * Endpoints:
 *  GET    /api/users           → List all users
 *  GET    /api/users/:id       → Get single user
 *  PUT    /api/users/:id       → Update user (role, status, profile)
 *  DELETE /api/users/:id       → Deactivate user
 */
import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/users
// @desc    List all users with search & filter
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search = '', role = '', status = '' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const query = {};

  if (search.trim()) {
    query.$or = [
      { name: { $regex: search.trim(), $options: 'i' } },
      { email: { $regex: search.trim(), $options: 'i' } },
      { phone: { $regex: search.trim(), $options: 'i' } },
      { employeeId: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  if (role) query.role = role;
  if (status === 'active')   query.isActive = true;
  if (status === 'inactive') query.isActive = false;

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    User.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: users,
    total,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/users/:id
// @desc    Get single user details
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password').lean();
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.json({ success: true, data: user });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/users/:id
// @desc    Update user role, status, or profile info
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Prevent admins from demoting themselves
  if (req.user._id.toString() === user._id.toString() && req.body.role && req.body.role !== user.role) {
    return res.status(400).json({ success: false, message: 'You cannot change your own role' });
  }

  // Prevent admins from deactivating themselves
  if (req.user._id.toString() === user._id.toString() && req.body.isActive === false) {
    return res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
  }

  const { name, phone, department, employeeId, role, isActive } = req.body;

  if (name !== undefined)       user.name = name.trim();
  if (phone !== undefined)      user.phone = phone.trim();
  if (department !== undefined)  user.department = department.trim();
  if (employeeId !== undefined)  user.employeeId = employeeId.trim();
  if (role !== undefined)       user.role = role;
  if (isActive !== undefined)   user.isActive = isActive;

  await user.save();

  const updated = user.toObject();
  delete updated.password;

  res.json({ success: true, data: updated, message: 'User updated successfully' });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   DELETE /api/users/:id
// @desc    Deactivate a user (soft delete)
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Prevent admins from deleting themselves
  if (req.user._id.toString() === user._id.toString()) {
    return res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
  }

  user.isActive = false;
  await user.save();

  res.json({ success: true, message: `${user.name} has been deactivated` });
});

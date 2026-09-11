/**
 * models/User.js
 * KrushiMitra AI — User Model
 * Supports email/password and Google OAuth via Firebase.
 * Roles: admin | employee
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,4})+$/, 'Invalid email address'],
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      default: null, // null for Google-only accounts
    },
    photoURL: { type: String, default: '' },

    // ── Auth Provider ─────────────────────────────────────────────────────────
    provider: {
      type: String,
      enum: ['email', 'google', 'firebase'],
      default: 'email',
    },
    googleId:      { type: String, default: '' },      // Firebase UID for Google accounts
    firebaseUid:   { type: String, default: '' },      // Firebase UID
    emailVerified: { type: Boolean, default: false },

    // ── Role & Access ─────────────────────────────────────────────────────────
    role: {
      type: String,
      enum: ['admin', 'employee'],
      default: 'employee',
    },

    // ── Profile ───────────────────────────────────────────────────────────────
    phone:       { type: String, trim: true, default: '' },
    department:  { type: String, trim: true, default: '' },
    employeeId:  { type: String, trim: true, default: '' },

    // ── Status ────────────────────────────────────────────────────────────────
    isActive:    { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// Note: email is already indexed via unique:true above
userSchema.index({ role: 1 });
userSchema.index({ firebaseUid: 1 });

// ── Pre-save: Hash password (only when modified) ───────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance method: Compare password ─────────────────────────────────────────
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};

// ── Virtual: Full display name ────────────────────────────────────────────────
userSchema.virtual('initials').get(function () {
  return this.name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
});

const User = mongoose.model('User', userSchema);
export default User;

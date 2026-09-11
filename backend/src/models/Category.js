/**
 * models/Category.js
 * Product category with color coding.
 */
import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters'],
  },
  description: { type: String, trim: true, default: '' },
  color: {
    type: String,
    default: '#22c55e', // Default to primary green
    match: [/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color code'],
  },
  icon: { type: String, default: 'tag' }, // lucide icon name
  isActive: { type: Boolean, default: true },
  productCount: { type: Number, default: 0 }, // Denormalized count for performance
}, { timestamps: true });

// Note: name is already indexed via unique:true above

const Category = mongoose.model('Category', categorySchema);
export default Category;

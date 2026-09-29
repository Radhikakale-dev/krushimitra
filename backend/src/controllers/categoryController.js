/**
 * controllers/categoryController.js
 * KrushiMitra AI — Category CRUD Controller
 *
 * Endpoints:
 *  GET    /api/categories           → List all categories
 *  GET    /api/categories/:id       → Get single category
 *  POST   /api/categories           → Create category
 *  PUT    /api/categories/:id       → Update category
 *  DELETE /api/categories/:id       → Delete category (soft)
 */
import Category from '../models/Category.js';
import Product  from '../models/Product.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/categories
// @desc    Get all categories with optional search
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const getCategories = asyncHandler(async (req, res) => {
  const { search = '', includeInactive = 'false' } = req.query;

  const query = {};
  if (includeInactive !== 'true') query.isActive = true;
  if (search.trim()) {
    query.name = { $regex: search.trim(), $options: 'i' };
  }

  const categories = await Category.find(query).sort({ name: 1 }).lean();

  // Refresh product counts from Product collection
  const counts = await Product.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const countMap = {};
  counts.forEach(c => { countMap[c._id?.toString()] = c.count; });

  const data = categories.map(cat => ({
    ...cat,
    productCount: countMap[cat._id.toString()] || 0,
  }));

  res.json({ success: true, data, total: data.length });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/categories/:id
// @desc    Get single category
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id).lean();
  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  const productCount = await Product.countDocuments({ category: category._id, isActive: true });

  res.json({ success: true, data: { ...category, productCount } });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/categories
// @desc    Create a new category
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, color, icon } = req.body;

  const exists = await Category.findOne({ name: { $regex: `^${name.trim()}$`, $options: 'i' } });
  if (exists) {
    return res.status(400).json({ success: false, message: 'Category with this name already exists' });
  }

  const category = await Category.create({
    name: name.trim(),
    description: description?.trim() || '',
    color: color || '#22c55e',
    icon: icon || 'tag',
  });

  res.status(201).json({ success: true, data: category, message: 'Category created successfully' });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/categories/:id
// @desc    Update a category
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  const { name, description, color, icon, isActive } = req.body;

  // Check for duplicate name (excluding self)
  if (name && name.trim().toLowerCase() !== category.name.toLowerCase()) {
    const dup = await Category.findOne({ name: { $regex: `^${name.trim()}$`, $options: 'i' } });
    if (dup) return res.status(400).json({ success: false, message: 'Category name already taken' });
  }

  if (name !== undefined) category.name = name.trim();
  if (description !== undefined) category.description = description.trim();
  if (color !== undefined) category.color = color;
  if (icon !== undefined) category.icon = icon;
  if (isActive !== undefined) category.isActive = isActive;

  await category.save();

  res.json({ success: true, data: category, message: 'Category updated successfully' });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   DELETE /api/categories/:id
// @desc    Delete a category (check for products first)
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  // Check if products are assigned
  const productCount = await Product.countDocuments({ category: category._id, isActive: true });
  if (productCount > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete: ${productCount} active product(s) are assigned to this category. Reassign them first.`,
    });
  }

  await Category.findByIdAndDelete(req.params.id);

  res.json({ success: true, message: 'Category deleted successfully' });
});

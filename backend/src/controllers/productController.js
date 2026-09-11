/**
 * controllers/productSearchController.js
 * KrushiMitra AI — Fast Product Search for POS
 *
 * Optimized for low-latency POS usage:
 *  - Text search (name / SKU)
 *  - Exact barcode lookup
 *  - Returns stock, price, GST — everything POS needs
 */
import mongoose from 'mongoose';
import Product  from '../models/Product.js';
import Category from '../models/Category.js';
import Supplier from '../models/Supplier.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/products/search?q=&barcode=&limit=
// @desc    POS product search — by name/SKU or exact barcode
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const searchProducts = asyncHandler(async (req, res) => {
  const { q = '', barcode = '', limit = 10, page = 1, category = '', status = '' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  // ── Barcode exact match (highest priority — scanner hit) ──────────────────
  if (barcode.trim()) {
    const product = await Product.findOne({ barcode: barcode.trim(), isActive: true })
      .populate('category', 'name color')
      .populate('supplier', 'name')
      .lean();

    if (!product) {
      return res.json({ success: true, data: [], total: 0, message: 'No product found for this barcode' });
    }
    return res.json({ success: true, data: [product], total: 1 });
  }

  // ── Text search ───────────────────────────────────────────────────────────
  const baseQuery = { isActive: true };
  if (category) baseQuery.category = category;

  // Stock filter
  if (status === 'low')  baseQuery.$expr = { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$minStock'] }] };
  if (status === 'out')  baseQuery.stock = 0;
  if (status === 'in')   baseQuery.$expr = { $gt: ['$stock', '$minStock'] };

  let query;
  if (q.trim()) {
    // Use MongoDB text index for fast search
    query = Product.find(
      { ...baseQuery, $text: { $search: q.trim() } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } });
  } else {
    query = Product.find(baseQuery).sort({ name: 1 });
  }

  const [products, total] = await Promise.all([
    query
      .skip(skip)
      .limit(Number(limit))
      .populate('category', 'name color')
      .populate('supplier', 'name')
      .lean(),
    Product.countDocuments(
      q.trim()
        ? { ...baseQuery, $text: { $search: q.trim() } }
        : baseQuery
    ),
  ]);

  res.json({
    success: true,
    data:    products,
    total,
    pagination: {
      page:  Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/products
// @desc    Full product list with filters (for Products management page)
// @access  Protected (admin)
// ─────────────────────────────────────────────────────────────────────────────
export const getProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 15, q = '', category = '', status = '' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const baseQuery = {};
  if (category) baseQuery.category = category;
  if (status === 'active')   baseQuery.isActive = true;
  if (status === 'inactive') baseQuery.isActive = false;
  if (status === 'low')  {
    baseQuery.isActive = true;
    baseQuery.$expr = { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$minStock'] }] };
  }
  if (status === 'out')  { baseQuery.isActive = true; baseQuery.stock = 0; }

  let dbQuery;
  if (q.trim()) {
    dbQuery = Product.find({ ...baseQuery, $text: { $search: q.trim() } }, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } });
  } else {
    dbQuery = Product.find(baseQuery).sort({ createdAt: -1 });
  }

  const [products, total] = await Promise.all([
    dbQuery
      .skip(skip)
      .limit(Number(limit))
      .populate('category', 'name color icon')
      .populate('supplier', 'name phone')
      .lean(),
    Product.countDocuments(q.trim() ? { ...baseQuery, $text: { $search: q.trim() } } : baseQuery),
  ]);

  res.json({
    success: true,
    data: products,
    total,
    pagination: {
      page:  Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/products
// @desc    Create new product
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const createProduct = asyncHandler(async (req, res) => {
  let {
    name, sku, barcode, hsnCode, category, supplier,
    description, purchasePrice, sellingPrice, mrp,
    gstRate, gstInclusive, stock, minStock, unit,
    isActive, image, brand, batchNumber, expiryDate,
  } = req.body;

  // Resolve String to ObjectId for Category
  if (category && !mongoose.isValidObjectId(category)) {
    const cat = await Category.findOneAndUpdate(
      { name: category.trim() },
      { name: category.trim(), color: 'bg-emerald-100 text-emerald-800' },
      { upsert: true, new: true }
    );
    category = cat._id;
  }

  // Resolve String to ObjectId for Supplier
  if (supplier && !mongoose.isValidObjectId(supplier)) {
    const sup = await Supplier.findOneAndUpdate(
      { name: supplier.trim() },
      { 
        $set: { name: supplier.trim() },
        $setOnInsert: { phone: `TBD-${Date.now().toString().slice(-6)}` }
      },
      { upsert: true, new: true }
    );
    supplier = sup._id;
  }

  // Check duplicate SKU
  const existing = await Product.findOne({ sku: sku?.toUpperCase() });
  if (existing) {
    return res.status(400).json({ success: false, message: `SKU "${sku}" already exists` });
  }

  const product = await Product.create({
    name, sku, barcode, hsnCode, category, supplier,
    description, purchasePrice, sellingPrice,
    mrp: mrp || sellingPrice,
    gstRate: gstRate ?? 18,
    gstInclusive: gstInclusive ?? false,
    stock: stock ?? 0,
    minStock: minStock ?? 5,
    unit: unit || 'piece',
    isActive: isActive ?? true,
    image: image || '',
    brand: brand || '',
    batchNumber: batchNumber || '',
    expiryDate: expiryDate ? new Date(expiryDate) : null,
  });

  const populated = await Product.findById(product._id)
    .populate('category', 'name color')
    .populate('supplier', 'name')
    .lean();

  // Update category product count
  if (category) {
    await import('../models/Category.js').then(m =>
      m.default.findByIdAndUpdate(category, { $inc: { productCount: 1 } })
    );
  }

  res.status(201).json({ success: true, message: 'Product created successfully', data: populated });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/products/:id
// @desc    Update product
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  // If SKU is changing, check for conflict
  if (req.body.sku && req.body.sku.toUpperCase() !== product.sku) {
    const conflict = await Product.findOne({ sku: req.body.sku.toUpperCase(), _id: { $ne: product._id } });
    if (conflict) return res.status(400).json({ success: false, message: `SKU "${req.body.sku}" is taken by another product` });
  }

  let { category, supplier } = req.body;

  // Resolve String to ObjectId for Category
  if (category && !mongoose.isValidObjectId(category)) {
    const cat = await Category.findOneAndUpdate(
      { name: category.trim() },
      { name: category.trim(), color: 'bg-emerald-100 text-emerald-800' },
      { upsert: true, new: true }
    );
    req.body.category = cat._id;
  }

  // Resolve String to ObjectId for Supplier
  if (supplier && !mongoose.isValidObjectId(supplier)) {
    const sup = await Supplier.findOneAndUpdate(
      { name: supplier.trim() },
      { 
        $set: { name: supplier.trim() },
        $setOnInsert: { phone: `TBD-${Date.now().toString().slice(-6)}` }
      },
      { upsert: true, new: true }
    );
    req.body.supplier = sup._id;
  }

  const allowedFields = [
    'name', 'sku', 'barcode', 'hsnCode', 'category', 'supplier',
    'description', 'purchasePrice', 'sellingPrice', 'mrp',
    'gstRate', 'gstInclusive', 'stock', 'minStock', 'unit',
    'isActive', 'image', 'brand', 'batchNumber', 'expiryDate',
  ];

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) product[field] = req.body[field];
  });

  if (req.body.expiryDate) product.expiryDate = new Date(req.body.expiryDate);

  await product.save();

  const updated = await Product.findById(product._id)
    .populate('category', 'name color')
    .populate('supplier', 'name')
    .lean();

  res.json({ success: true, message: 'Product updated successfully', data: updated });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   DELETE /api/products/:id
// @desc    Soft-delete product (set isActive = false)
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  product.isActive = false;
  await product.save({ validateBeforeSave: false });

  res.json({ success: true, message: `Product "${product.name}" deactivated successfully` });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/products/:id
// @desc    Get single product
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('category', 'name color icon')
    .populate('supplier', 'name phone email')
    .lean();

  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, data: product });
});

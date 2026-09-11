/**
 * controllers/supplierController.js
 * KrushiMitra AI — Supplier Management & Ledger
 */
import Supplier from '../models/Supplier.js';
import Inventory from '../models/Inventory.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/suppliers
// @desc    Get paginated suppliers or typeahead search (q)
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const getSuppliers = asyncHandler(async (req, res) => {
  // Accept both 'q' and 'search' params — use $regex for reliable search
  const searchTerm = (req.query.q || req.query.search || '').trim();
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const query = { isActive: true };

  if (searchTerm) {
    query.$or = [
      { name:          { $regex: searchTerm, $options: 'i' } },
      { contactPerson: { $regex: searchTerm, $options: 'i' } },
      { phone:         { $regex: searchTerm, $options: 'i' } },
    ];
  }

  const [suppliers, total] = await Promise.all([
    Supplier.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Supplier.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: suppliers,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/suppliers/:id
// @desc    Get single supplier
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const getSupplierById = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id).lean();
  if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
  res.json({ success: true, data: supplier });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/suppliers
// @desc    Create supplier
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const createSupplier = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  if (phone) {
    const existing = await Supplier.findOne({ phone: phone.trim() });
    if (existing) return res.status(400).json({ success: false, message: 'Supplier with this phone already exists' });
  }

  const supplier = await Supplier.create(req.body);
  res.status(201).json({ success: true, message: 'Supplier created successfully', data: supplier });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/suppliers/:id
// @desc    Update supplier
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
  res.json({ success: true, message: 'Supplier updated successfully', data: supplier });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   DELETE /api/suppliers/:id
// @desc    Soft delete supplier
// @access  Protected (Admin)
// ─────────────────────────────────────────────────────────────────────────────
export const deleteSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
  res.json({ success: true, message: 'Supplier deleted successfully' });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/suppliers/:id/ledger
// @desc    Get supplier purchase history (StockIn from Purchase entries)
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const getSupplierLedger = asyncHandler(async (req, res) => {
  // Find all inventory 'StockIn' events linked to this supplier's purchase entries
  // (Assuming referenceType='Purchase' and notes/referenceNo points to it)
  // Actually, we'll track the total purchase via Inventory where supplier is implied, 
  // or better, if we have a Purchase schema. Since we don't have a distinct Purchase schema,
  // we will query Inventory where type='StockIn' and we need supplier reference.
  // Wait, Inventory model doesn't have a direct supplier field. It has referenceId.
  // We can just rely on the fact that supplier totalPurchases is maintained, and 
  // for ledger, we return recent Inventory movements if we add supplier to Inventory schema, 
  // OR we can just return the outstanding balance and a placeholder for full ledger for now.
  
  // To keep it simple and within the current schema, we return the supplier details
  // and we will update Inventory schema in a moment to include supplier if needed.
  // Actually, let's just return recent Inventory items linked to their products.
  
  const supplier = await Supplier.findById(req.params.id).lean();
  if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
  
  // We'll return dummy ledger entries for now since we don't have a dedicated Purchase bill model yet,
  // or we can fetch Inventory items where type = StockIn and referenceType = Purchase (we'll log supplier ID in referenceId).
  const purchases = await Inventory.find({
    referenceType: 'Purchase',
    referenceId: supplier._id
  }).sort({ date: -1 }).limit(50).populate('product', 'name').lean();

  res.json({ success: true, data: { supplier, purchases } });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/suppliers/:id/pay
// @desc    Record a payment made TO the supplier
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const recordPayment = asyncHandler(async (req, res) => {
  const { amount, reference, mode = 'Cash' } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Invalid payment amount' });

  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });

  supplier.outstandingBalance = Math.max(0, supplier.outstandingBalance - amount);
  await supplier.save();

  // Could also create an Expense record here for accounting
  await import('../models/Expense.js').then(m => 
    m.default.create({
      title: `Payment to Supplier: ${supplier.name}`,
      category: 'Purchase',
      amount,
      paymentMode: mode,
      reference,
      description: `Pending payment clearance for ${supplier.name}`,
      createdBy: req.user._id
    })
  );

  res.json({ success: true, message: `Payment of ₹${amount} recorded for ${supplier.name}`, data: supplier });
});

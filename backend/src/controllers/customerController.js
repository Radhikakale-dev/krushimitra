/**
 * controllers/customerController.js
 * KrushiMitra AI — Customer CRUD + POS typeahead search
 */
import Customer from '../models/Customer.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/customers/search?q=&limit=
// @desc    Typeahead search for POS customer selection
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const searchCustomers = asyncHandler(async (req, res) => {
  // Accept both 'q' and 'search' params for compatibility with frontend
  const searchTerm = (req.query.q || req.query.search || '').trim();
  const { limit = 8 } = req.query;

  const query = { isActive: true };
  if (searchTerm) {
    query.$or = [
      { name:  { $regex: searchTerm, $options: 'i' } },
      { phone: { $regex: searchTerm, $options: 'i' } },
    ];
  }

  const customers = await Customer.find(query)
    .select('name phone village outstandingBalance creditLimit gstNo')
    .sort({ name: 1 })
    .limit(Number(limit))
    .lean();

  res.json({ success: true, data: customers });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/customers
// @desc    Paginated customer list
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const getCustomers = asyncHandler(async (req, res) => {
  // Accept both 'q' and 'search' params — frontend sends 'search', some callers send 'q'
  const searchTerm = (req.query.q || req.query.search || '').trim();
  const { page = 1, limit = 20 } = req.query;
  const skip  = (Number(page) - 1) * Number(limit);
  const query = { isActive: true };
  if (searchTerm) {
    query.$or = [
      { name:  { $regex: searchTerm, $options: 'i' } },
      { phone: { $regex: searchTerm, $options: 'i' } },
    ];
  }

  const [customers, total] = await Promise.all([
    Customer.find(query).sort({ name: 1 }).skip(skip).limit(Number(limit)).lean(),
    Customer.countDocuments(query),
  ]);

  res.json({
    success: true,
    data:    customers,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/customers
// @desc    Create customer
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const createCustomer = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  const existing = await Customer.findOne({ phone: phone?.trim() });
  if (existing) return res.status(400).json({ success: false, message: 'A customer with this phone already exists' });

  const customer = await Customer.create(req.body);
  res.status(201).json({ success: true, message: 'Customer created', data: customer });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/customers/:id
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
  res.json({ success: true, message: 'Customer updated', data: customer });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   DELETE /api/customers/:id
// @desc    Soft delete customer
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
  res.json({ success: true, message: 'Customer deleted successfully' });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/customers/:id
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id).lean();
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
  res.json({ success: true, data: customer });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/customers/:id/ledger
// @desc    Get customer ledger (past bills)
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const getCustomerLedger = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id).lean();
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

  // Dynamically import Bill model to prevent circular deps
  const Bill = (await import('../models/Bill.js')).default;

  const bills = await Bill.find({ customer: customer._id })
    .sort({ date: -1 })
    .limit(50)
    .populate('cashier', 'name')
    .lean();

  res.json({ success: true, data: { customer, bills } });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/customers/:id/pay
// @desc    Record a payment received from customer
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const recordPayment = asyncHandler(async (req, res) => {
  const { amount, reference, mode = 'Cash' } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Invalid payment amount' });

  const customer = await Customer.findById(req.params.id);
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

  customer.outstandingBalance = Math.max(0, customer.outstandingBalance - amount);
  await customer.save();

  // Could also create a Bill/Receipt record for this payment specifically, 
  // but for now we just reduce outstanding balance.

  res.json({ success: true, message: `Payment of ₹${amount} received from ${customer.name}`, data: customer });
});

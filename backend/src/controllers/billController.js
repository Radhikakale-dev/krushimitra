/**
 * controllers/billController.js
 * KrushiMitra AI — POS Bill Controller
 *
 * Endpoints:
 *  POST   /api/bills              → createBill
 *  GET    /api/bills              → getBills (paginated)
 *  GET    /api/bills/next-invoice → getNextInvoiceNo
 *  GET    /api/bills/:id          → getBillById
 *  PUT    /api/bills/:id/cancel   → cancelBill  (admin only)
 */
import mongoose from 'mongoose';
import Bill     from '../models/Bill.js';
import Product  from '../models/Product.js';
import Customer from '../models/Customer.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

// ── Helper: Generate next invoice number ─────────────────────────────────────
const generateInvoiceNo = async () => {
  const year  = new Date().getFullYear();
  const count = await Bill.countDocuments({
    createdAt: {
      $gte: new Date(`${year}-01-01T00:00:00.000Z`),
      $lt : new Date(`${year + 1}-01-01T00:00:00.000Z`),
    },
  });
  const seq = String(count + 1).padStart(4, '0');
  return `INV-${year}-${seq}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/bills/next-invoice
// @desc    Returns the next sequential invoice number (for POS preview)
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const getNextInvoiceNo = asyncHandler(async (req, res) => {
  const invoiceNo = await generateInvoiceNo();
  res.json({ success: true, data: { invoiceNo } });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/bills
// @desc    Create a new bill (POS sale)
// @access  Protected (admin + employee)
//
// Request body:
// {
//   customerId?:    string,
//   customerName:   string,
//   customerPhone?: string,
//   items: [{
//     productId, quantity, unitPrice,
//     discountPercent, gstRate
//   }],
//   payments: [{ mode, amount, reference? }],
//   notes?: string,
//   roundOff?: number,
// }
// ─────────────────────────────────────────────────────────────────────────────
export const createBill = asyncHandler(async (req, res) => {
  const {
    customerId,
    customerName = 'Walk-in Customer',
    customerPhone = '',
    items = [],
    payments = [],
    notes = '',
    roundOff = 0,
  } = req.body;

  // ── Validate input ────────────────────────────────────────────────────────
  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Bill must have at least one item' });
  }
  if (!payments || payments.length === 0) {
    return res.status(400).json({ success: false, message: 'At least one payment entry is required' });
  }

  // ── Fetch all products in one DB call ─────────────────────────────────────
  const productIds = items.map(i => i.productId);
  const products   = await Product.find({ _id: { $in: productIds } });
  const productMap = Object.fromEntries(products.map(p => [p._id.toString(), p]));

  // ── Build embedded bill items + validate stock ────────────────────────────
  const billItems      = [];
  let subtotalSum      = 0;
  let totalDiscountSum = 0;
  let totalCgstSum     = 0;
  let totalSgstSum     = 0;
  let totalGstSum      = 0;

  for (const item of items) {
    const product = productMap[item.productId];
    if (!product) {
      return res.status(404).json({ success: false, message: `Product not found: ${item.productId}` });
    }
    if (!product.isActive) {
      return res.status(400).json({ success: false, message: `Product is inactive: ${product.name}` });
    }
    if (product.stock < item.quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for "${product.name}". Available: ${product.stock} ${product.unit}`,
      });
    }

    const qty            = Number(item.quantity);
    const unitPrice      = Number(item.unitPrice) || product.sellingPrice;
    const discountPct    = Number(item.discountPercent) || 0;
    const gstRate        = Number(item.gstRate ?? product.gstRate);

    const grossAmount    = unitPrice * qty;
    const discountAmount = (grossAmount * discountPct) / 100;
    const taxableAmount  = grossAmount - discountAmount;
    const cgst           = parseFloat(((taxableAmount * gstRate) / 200).toFixed(2));
    const sgst           = parseFloat(((taxableAmount * gstRate) / 200).toFixed(2));
    const itemGst        = cgst + sgst;
    const itemTotal      = parseFloat((taxableAmount + itemGst).toFixed(2));

    subtotalSum      += taxableAmount;
    totalDiscountSum += discountAmount;
    totalCgstSum     += cgst;
    totalSgstSum     += sgst;
    totalGstSum      += itemGst;

    billItems.push({
      product:         product._id,
      productName:     product.name,
      sku:             product.sku,
      hsnCode:         product.hsnCode || '',
      quantity:        qty,
      unit:            product.unit,
      unitPrice,
      mrp:             product.mrp || unitPrice,
      discountPercent: discountPct,
      discountAmount:  parseFloat(discountAmount.toFixed(2)),
      gstRate,
      cgst,
      sgst,
      igst:            0,
      subtotal:        parseFloat(taxableAmount.toFixed(2)),
      total:           itemTotal,
    });
  }

  // ── Grand total with round-off ────────────────────────────────────────────
  const rawGrandTotal  = subtotalSum + totalGstSum + roundOff;
  const grandTotal     = parseFloat(rawGrandTotal.toFixed(2));
  const amountPaid     = payments.reduce((s, p) => s + Number(p.amount), 0);
  const balance        = parseFloat((amountPaid - grandTotal).toFixed(2));

  // ── Determine bill status ─────────────────────────────────────────────────
  let status = 'Paid';
  if (amountPaid <= 0)              status = 'Credit';
  else if (amountPaid < grandTotal) status = 'Partial';

  // ── Generate invoice number (atomic enough for a shop) ────────────────────
  const invoiceNo = await generateInvoiceNo();

  // ── Resolve customer if provided ──────────────────────────────────────────
  let customerDoc = null;
  if (customerId) {
    customerDoc = await Customer.findById(customerId);
  }

  // ── Create bill ───────────────────────────────────────────────────────────
  const bill = await Bill.create({
    invoiceNo,
    customer:      customerDoc?._id || null,
    customerName:  customerDoc?.name || customerName,
    customerPhone: customerDoc?.phone || customerPhone,
    items:         billItems,
    subtotal:      parseFloat(subtotalSum.toFixed(2)),
    totalDiscount: parseFloat(totalDiscountSum.toFixed(2)),
    totalCgst:     parseFloat(totalCgstSum.toFixed(2)),
    totalSgst:     parseFloat(totalSgstSum.toFixed(2)),
    totalGst:      parseFloat(totalGstSum.toFixed(2)),
    grandTotal,
    payments,
    amountPaid:    parseFloat(amountPaid.toFixed(2)),
    balance,
    status,
    cashier:       req.user._id,
    notes,
    date:          new Date(),
  });

  // ── Deduct stock atomically ─────────────────────────────────────────────────
  for (const item of billItems) {
    const result = await Product.updateOne(
      { _id: item.product, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } }
    );
    if (result.modifiedCount === 0) {
      // Rollback bill if stock was depleted exactly during checkout
      await Bill.findByIdAndDelete(bill._id);
      return res.status(400).json({
        success: false,
        message: `Checkout failed: Insufficient stock for ${item.productName}. It may have been sold just now.`
      });
    }
  }

  // ── Update customer outstanding balance (if credit/partial) ───────────────
  if (customerDoc && (status === 'Credit' || status === 'Partial')) {
    const owed = grandTotal - amountPaid;
    await Customer.findByIdAndUpdate(customerDoc._id, {
      $inc: {
        outstandingBalance: Math.max(0, owed),
        totalPurchases:     grandTotal,
        totalBills:         1,
      },
    });
  } else if (customerDoc) {
    await Customer.findByIdAndUpdate(customerDoc._id, {
      $inc: { totalPurchases: grandTotal, totalBills: 1 },
    });
  }

  // ── Return populated bill ─────────────────────────────────────────────────
  const populated = await Bill.findById(bill._id)
    .populate('cashier', 'name')
    .populate('customer', 'name phone gstNo')
    .lean();

  res.status(201).json({
    success: true,
    message: `Bill ${invoiceNo} created successfully`,
    data:    populated,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/bills
// @desc    List bills with pagination, search, date filter
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const getBills = asyncHandler(async (req, res) => {
  const {
    page    = 1,
    limit   = 20,
    search  = '',
    status  = '',
    from    = '',
    to      = '',
  } = req.query;

  const skip  = (Number(page) - 1) * Number(limit);
  const query = { status: { $ne: 'Cancelled' } };

  if (search) {
    query.$or = [
      { invoiceNo:    { $regex: search, $options: 'i' } },
      { customerName: { $regex: search, $options: 'i' } },
      { customerPhone:{ $regex: search, $options: 'i' } },
    ];
  }
  if (status) query.status = status;
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to)   query.date.$lte = new Date(new Date(to).setHours(23, 59, 59, 999));
  }

  const [bills, total] = await Promise.all([
    Bill.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('cashier', 'name')
      .select('-items')     // Exclude items for list performance
      .lean(),
    Bill.countDocuments(query),
  ]);

  res.json({
    success: true,
    data:    bills,
    pagination: {
      total,
      page:   Number(page),
      limit:  Number(limit),
      pages:  Math.ceil(total / Number(limit)),
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/bills/:id
// @desc    Get single bill with all items (for reprint/view)
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const getBillById = asyncHandler(async (req, res) => {
  const bill = await Bill.findById(req.params.id)
    .populate('cashier', 'name')
    .populate('customer', 'name phone gstNo address')
    .lean();

  if (!bill) {
    return res.status(404).json({ success: false, message: 'Bill not found' });
  }

  res.json({ success: true, data: bill });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/bills/:id/cancel
// @desc    Cancel a bill and restore stock (admin only)
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const cancelBill = asyncHandler(async (req, res) => {
  const bill = await Bill.findById(req.params.id);
  if (!bill) {
    return res.status(404).json({ success: false, message: 'Bill not found' });
  }
  if (bill.status === 'Cancelled') {
    return res.status(400).json({ success: false, message: 'Bill is already cancelled' });
  }
  // Save the original status BEFORE overwriting — needed for balance reversal logic below
  const originalStatus = bill.status;

  bill.status = 'Cancelled';
  await bill.save();

  // Restore stock
  await Promise.all(
    bill.items.map(item =>
      Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      })
    )
  );

  // Reverse customer outstanding if the bill was on credit or partial
  // NOTE: Use originalStatus (saved before overwriting bill.status above)
  if (bill.customer && (originalStatus === 'Credit' || originalStatus === 'Partial')) {
    const owed = bill.grandTotal - bill.amountPaid;
    await Customer.findByIdAndUpdate(bill.customer, {
      $inc: {
        outstandingBalance: -Math.max(0, owed),
        totalPurchases:     -bill.grandTotal,
        totalBills:         -1,
      },
    });
  }

  res.json({ success: true, message: `Bill ${bill.invoiceNo} has been cancelled`, data: bill });
});

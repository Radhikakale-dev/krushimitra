/**
 * controllers/reportController.js
 * KrushiMitra AI — Reports & Analytics Controller
 *
 * Endpoints:
 *  GET /api/reports/sales       → Sales report (daily/weekly/monthly/yearly)
 *  GET /api/reports/profit      → Profit analysis
 *  GET /api/reports/gst         → GST report (CGST + SGST breakdowns)
 *  GET /api/reports/inventory   → Inventory valuation report
 *  GET /api/reports/purchase    → Purchase report (from Inventory StockIn logs)
 *  GET /api/reports/expense     → Expense report
 *  GET /api/reports/supplier    → Supplier-wise purchase report
 *  GET /api/reports/customer    → Customer-wise sales report
 *  GET /api/reports/cashbook    → Cash book (all cash inflows + outflows)
 */
import Bill      from '../models/Bill.js';
import Inventory from '../models/Inventory.js';
import Expense   from '../models/Expense.js';
import Product   from '../models/Product.js';
import Customer  from '../models/Customer.js';
import Supplier  from '../models/Supplier.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

// ─── Date range helper ────────────────────────────────────────────────────────
const buildDateRange = (period, from, to) => {
  const now = new Date();
  let start, end;

  if (from && to) {
    start = new Date(from);
    end   = new Date(new Date(to).setHours(23, 59, 59, 999));
  } else {
    switch (period) {
      case 'daily':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case 'weekly': {
        const day = now.getDay();
        start = new Date(now); start.setDate(now.getDate() - day); start.setHours(0, 0, 0, 0);
        end   = new Date(now); end.setDate(start.getDate() + 6);   end.setHours(23, 59, 59, 999);
        break;
      }
      case 'yearly':
        start = new Date(now.getFullYear(), 0, 1);
        end   = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      default: // monthly
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }
  }
  return { start, end };
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/reports/sales
// @desc    Sales report with trend data grouped by day/week/month
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const getSalesReport = asyncHandler(async (req, res) => {
  const { period = 'monthly', from, to } = req.query;
  const { start, end } = buildDateRange(period, from, to);

  // Group format based on period
  const groupFormat = period === 'daily'
    ? { year: { $year: '$date' }, month: { $month: '$date' }, day: { $dayOfMonth: '$date' }, hour: { $hour: '$date' } }
    : period === 'yearly'
    ? { year: { $year: '$date' }, month: { $month: '$date' } }
    : { year: { $year: '$date' }, month: { $month: '$date' }, day: { $dayOfMonth: '$date' } };

  const [summary, trend, topProducts] = await Promise.all([
    // Overall summary
    Bill.aggregate([
      { $match: { date: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' } } },
      { $group: {
          _id: null,
          totalSales:    { $sum: '$grandTotal' },
          totalBills:    { $sum: 1 },
          totalDiscount: { $sum: '$totalDiscount' },
          totalGST:      { $sum: '$totalGst' },
          avgBillValue:  { $avg: '$grandTotal' },
          cashSales:     { $sum: { $cond: [{ $in: ['Cash', '$payments.mode'] }, '$grandTotal', 0] } },
        }
      },
    ]),

    // Trend data (grouped by day/month)
    Bill.aggregate([
      { $match: { date: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' } } },
      { $group: { _id: groupFormat, sales: { $sum: '$grandTotal' }, bills: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } },
    ]),

    // Top 10 products by revenue in period
    Bill.aggregate([
      { $match: { date: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' } } },
      { $unwind: '$items' },
      { $group: {
          _id: '$items.productName',
          revenue:  { $sum: '$items.total' },
          quantity: { $sum: '$items.quantity' },
          bills:    { $sum: 1 },
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      period,
      dateRange: { start, end },
      summary: summary[0] || { totalSales: 0, totalBills: 0, totalDiscount: 0, totalGST: 0, avgBillValue: 0 },
      trend,
      topProducts,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/reports/profit
// @desc    Profit analysis: Sales - Cost of Goods Sold - Expenses
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const getProfitReport = asyncHandler(async (req, res) => {
  const { period = 'monthly', from, to } = req.query;
  const { start, end } = buildDateRange(period, from, to);

  const [salesData, expenses, inventoryData] = await Promise.all([
    // Total sales revenue
    Bill.aggregate([
      { $match: { date: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, revenue: { $sum: '$grandTotal' }, gst: { $sum: '$totalGst' } } },
    ]),

    // Total expenses
    Expense.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),

    // Cost of Goods Sold: use inventory StockOut records (priced at sellingPrice - use purchasePrice instead)
    Inventory.aggregate([
      { $match: { type: 'StockOut', date: { $gte: start, $lte: end } } },
      { $group: {
          _id: null,
          costOfGoodsSold: { $sum: { $multiply: ['$quantity', '$purchasePrice'] } },
          revenueRecorded:  { $sum: { $multiply: ['$quantity', '$sellingPrice'] } },
        }
      },
    ]),
  ]);

  const revenue          = salesData[0]?.revenue   || 0;
  const gstCollected     = salesData[0]?.gst        || 0;
  const totalExpenses    = expenses[0]?.total       || 0;
  const cogs             = inventoryData[0]?.costOfGoodsSold || 0;
  const revenueExclGST   = revenue - gstCollected;
  const grossProfit      = revenueExclGST - cogs;
  const netProfit        = grossProfit - totalExpenses;
  const grossMarginPct   = revenueExclGST > 0 ? ((grossProfit / revenueExclGST) * 100).toFixed(1) : 0;
  const netMarginPct     = revenueExclGST > 0 ? ((netProfit / revenueExclGST) * 100).toFixed(1) : 0;

  res.json({
    success: true,
    data: {
      period, dateRange: { start, end },
      revenue,
      gstCollected,
      revenueExclGST,
      cogs,
      grossProfit,
      totalExpenses,
      netProfit,
      grossMarginPct: Number(grossMarginPct),
      netMarginPct:   Number(netMarginPct),
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/reports/gst
// @desc    GST Report (CGST + SGST breakdown by rate)
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const getGSTReport = asyncHandler(async (req, res) => {
  const { period = 'monthly', from, to } = req.query;
  const { start, end } = buildDateRange(period, from, to);

  const [gstByRate, totals] = await Promise.all([
    Bill.aggregate([
      { $match: { date: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' } } },
      { $unwind: '$items' },
      { $group: {
          _id: '$items.gstRate',
          taxableAmount: { $sum: '$items.subtotal' },
          cgst: { $sum: '$items.cgst' },
          sgst: { $sum: '$items.sgst' },
          totalGST: { $sum: { $add: ['$items.cgst', '$items.sgst'] } },
          itemCount: { $sum: 1 },
        }
      },
      { $sort: { _id: 1 } },
    ]),
    Bill.aggregate([
      { $match: { date: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' } } },
      { $group: {
          _id: null,
          totalTaxable: { $sum: '$subtotal' },
          totalCGST:    { $sum: '$totalCgst' },
          totalSGST:    { $sum: '$totalSgst' },
          totalGST:     { $sum: '$totalGst' },
          totalRevenue: { $sum: '$grandTotal' },
        }
      },
    ]),
  ]);

  res.json({ success: true, data: { period, dateRange: { start, end }, gstByRate, totals: totals[0] || {} } });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/reports/inventory
// @desc    Inventory valuation and stock status report
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const getInventoryReport = asyncHandler(async (req, res) => {
  const [valuation, alertSummary, topValue] = await Promise.all([
    // Total inventory value (at purchase price)
    Product.aggregate([
      { $match: { isActive: true } },
      { $group: {
          _id: null,
          totalStockValue:    { $sum: { $multiply: ['$stock', '$purchasePrice'] } },
          totalSellingValue:  { $sum: { $multiply: ['$stock', '$sellingPrice'] } },
          totalProducts:      { $sum: 1 },
          totalUnits:         { $sum: '$stock' },
        }
      },
    ]),

    // Alert counts
    Product.aggregate([
      { $match: { isActive: true } },
      { $facet: {
          outOfStock:   [{ $match: { stock: 0 } }, { $count: 'count' }],
          lowStock:     [{ $match: { $expr: { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$minStock'] }] } } }, { $count: 'count' }],
          expired:      [{ $match: { expiryDate: { $lt: new Date() } } }, { $count: 'count' }],
        }
      },
    ]),

    // Top 10 products by stock value
    Product.aggregate([
      { $match: { isActive: true } },
      { $addFields: { stockValue: { $multiply: ['$stock', '$purchasePrice'] } } },
      { $sort: { stockValue: -1 } },
      { $limit: 10 },
      { $project: { name: 1, sku: 1, stock: 1, unit: 1, purchasePrice: 1, sellingPrice: 1, stockValue: 1 } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      valuation:    valuation[0] || {},
      alertSummary: alertSummary[0],
      topByValue:   topValue,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/reports/expense
// @desc    Expense breakdown by category
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const getExpenseReport = asyncHandler(async (req, res) => {
  const { period = 'monthly', from, to } = req.query;
  const { start, end } = buildDateRange(period, from, to);

  const [byCategory, trend, total] = await Promise.all([
    Expense.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]),
    Expense.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      { $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' }, day: { $dayOfMonth: '$date' } },
          total: { $sum: '$amount' },
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]),
    Expense.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
  ]);

  res.json({ success: true, data: { period, dateRange: { start, end }, byCategory, trend, total: total[0] || {} } });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/reports/customer
// @desc    Customer-wise sales analysis
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const getCustomerReport = asyncHandler(async (req, res) => {
  const { period = 'monthly', from, to } = req.query;
  const { start, end } = buildDateRange(period, from, to);

  const topCustomers = await Bill.aggregate([
    { $match: { date: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' }, customer: { $ne: null } } },
    { $group: {
        _id: '$customer',
        name:        { $first: '$customerName' },
        phone:       { $first: '$customerPhone' },
        totalSpent:  { $sum: '$grandTotal' },
        totalBills:  { $sum: 1 },
        avgBillValue:{ $avg: '$grandTotal' },
      }
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 20 },
  ]);

  const creditOutstanding = await Customer.aggregate([
    { $match: { outstandingBalance: { $gt: 0 }, isActive: true } },
    { $sort: { outstandingBalance: -1 } },
    { $limit: 20 },
    { $project: { name: 1, phone: 1, outstandingBalance: 1, creditLimit: 1 } },
  ]);

  res.json({ success: true, data: { period, dateRange: { start, end }, topCustomers, creditOutstanding } });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/reports/supplier
// @desc    Supplier-wise purchase analysis
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const getSupplierReport = asyncHandler(async (req, res) => {
  const { period = 'monthly', from, to } = req.query;
  const { start, end } = buildDateRange(period, from, to);

  const [purchaseBySupplier, pendingPayments] = await Promise.all([
    Inventory.aggregate([
      { $match: { type: 'StockIn', referenceType: 'Purchase', date: { $gte: start, $lte: end } } },
      { $group: {
          _id: '$referenceId',
          totalPurchased: { $sum: { $multiply: ['$quantity', '$purchasePrice'] } },
          totalItems:     { $sum: 1 },
          totalQty:       { $sum: '$quantity' },
        }
      },
      { $lookup: { from: 'suppliers', localField: '_id', foreignField: '_id', as: 'supplier' } },
      { $unwind: { path: '$supplier', preserveNullAndEmptyArrays: true } },
      { $sort: { totalPurchased: -1 } },
      { $limit: 20 },
    ]),
    Supplier.find({ outstandingBalance: { $gt: 0 }, isActive: true })
      .sort({ outstandingBalance: -1 })
      .select('name phone outstandingBalance totalPurchases')
      .lean(),
  ]);

  res.json({ success: true, data: { period, dateRange: { start, end }, purchaseBySupplier, pendingPayments } });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/reports/cashbook
// @desc    Cash Book (all cash inflows & outflows)
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const getCashBook = asyncHandler(async (req, res) => {
  const { period = 'monthly', from, to } = req.query;
  const { start, end } = buildDateRange(period, from, to);

  const [cashInflows, cashOutflows] = await Promise.all([
    // Cash Inflows: Bills where payment mode is Cash
    Bill.aggregate([
      { $match: { date: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' } } },
      { $unwind: '$payments' },
      { $match: { 'payments.mode': 'Cash' } },
      { $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' }, day: { $dayOfMonth: '$date' } },
          cashInflow: { $sum: '$payments.amount' },
          billCount:  { $sum: 1 },
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]),
    // Cash Outflows: Expenses paid in Cash
    Expense.aggregate([
      { $match: { date: { $gte: start, $lte: end }, paymentMode: 'Cash' } },
      { $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' }, day: { $dayOfMonth: '$date' } },
          cashOutflow: { $sum: '$amount' },
          expenseCount: { $sum: 1 },
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]),
  ]);

  const totalInflow  = cashInflows.reduce((s, r)  => s + r.cashInflow,  0);
  const totalOutflow = cashOutflows.reduce((s, r) => s + r.cashOutflow, 0);
  const netCash      = totalInflow - totalOutflow;

  res.json({
    success: true,
    data: {
      period, dateRange: { start, end },
      cashInflows, cashOutflows,
      summary: { totalInflow, totalOutflow, netCash },
    },
  });
});

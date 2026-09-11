/**
 * controllers/dashboardController.js
 * KrushiMitra AI — Dashboard Stats Aggregation
 * Returns all KPIs, chart data, and alerts in one API call.
 */
import { asyncHandler } from '../middleware/errorMiddleware.js';
import Bill      from '../models/Bill.js';
import Product   from '../models/Product.js';
import Customer  from '../models/Customer.js';
import Supplier  from '../models/Supplier.js';
import Expense   from '../models/Expense.js';
import Inventory from '../models/Inventory.js';

// ── Date helpers ──────────────────────────────────────────────────────────────
const dayStart  = (d = new Date()) => { const x = new Date(d); x.setHours(0,0,0,0);     return x; };
const dayEnd    = (d = new Date()) => { const x = new Date(d); x.setHours(23,59,59,999); return x; };
const monthStart= ()=> { const x=new Date(); x.setDate(1); x.setHours(0,0,0,0); return x; };
const yearStart = ()=> { const x=new Date(); x.setMonth(0,1); x.setHours(0,0,0,0); return x; };
const nDaysAgo  = (n)=> { const x=new Date(); x.setDate(x.getDate()-n); x.setHours(0,0,0,0); return x; };

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/dashboard/stats
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const getDashboardStats = asyncHandler(async (req, res) => {
  const now   = new Date();
  const today = { $gte: dayStart(), $lte: dayEnd() };
  const month = { $gte: monthStart() };
  const year  = { $gte: yearStart()  };
  const notCancelled = { status: { $ne: 'Cancelled' } };

  // ── Run all aggregations in parallel for performance ─────────────────────────
  const [
    todayAgg, monthAgg, yearAgg,
    productStats, customerCount, supplierCount,
    expenseAgg, creditAgg,
    lowStockItems, outOfStockItems,
    salesLast7, salesLast6Months,
    paymentModeBreakdown, topProducts,
    recentBills,
  ] = await Promise.all([

    // Today's bills
    Bill.aggregate([
      { $match: { date: today, ...notCancelled } },
      { $group: { _id: null, sales: { $sum: '$grandTotal' }, count: { $sum: 1 },
          gst: { $sum: '$totalGst' }, discount: { $sum: '$totalDiscount' } } },
    ]),

    // This month's bills
    Bill.aggregate([
      { $match: { date: month, ...notCancelled } },
      { $group: { _id: null, sales: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
    ]),

    // This year's bills
    Bill.aggregate([
      { $match: { date: year, ...notCancelled } },
      { $group: { _id: null, revenue: { $sum: '$grandTotal' } } },
    ]),

    // Product stats
    Product.aggregate([
      { $group: {
        _id: null,
        total: { $sum: 1 },
        totalValue: { $sum: { $multiply: ['$stock', '$purchasePrice'] } },
        lowStock: { $sum: { $cond: [{ $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$minStock'] }] }, 1, 0] } },
        outOfStock: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } },
        active: { $sum: { $cond: ['$isActive', 1, 0] } },
      }},
    ]),

    Customer.countDocuments({ isActive: true }),
    Supplier.countDocuments({ isActive: true }),

    // Total expenses (this month)
    Expense.aggregate([
      { $match: { date: month } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),

    // Pending (credit) balance
    Customer.aggregate([
      { $group: { _id: null, outstanding: { $sum: '$outstandingBalance' } } },
    ]),

    // Low stock items list
    Product.find({ stock: { $gt: 0 }, $expr: { $lte: ['$stock', '$minStock'] } })
      .select('name sku stock minStock unit').limit(10).lean(),

    // Out of stock items
    Product.find({ stock: 0, isActive: true })
      .select('name sku unit').limit(10).lean(),

    // Sales for last 7 days (for chart)
    Bill.aggregate([
      { $match: { date: { $gte: nDaysAgo(6) }, ...notCancelled } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        sales: { $sum: '$grandTotal' },
        count: { $sum: 1 },
      }},
      { $sort: { '_id': 1 } },
    ]),

    // Monthly revenue for last 6 months
    Bill.aggregate([
      { $match: { date: { $gte: nDaysAgo(180) }, ...notCancelled } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
        revenue: { $sum: '$grandTotal' },
        count: { $sum: 1 },
      }},
      { $sort: { '_id': 1 } },
    ]),

    // Payment mode breakdown
    Bill.aggregate([
      { $match: { date: month, ...notCancelled } },
      { $unwind: '$payments' },
      { $group: { _id: '$payments.mode', total: { $sum: '$payments.amount' } } },
      { $sort: { total: -1 } },
    ]),

    // Top 5 products by revenue
    Bill.aggregate([
      { $match: { date: month, ...notCancelled } },
      { $unwind: '$items' },
      { $group: {
        _id: '$items.productName',
        revenue: { $sum: '$items.total' },
        qty: { $sum: '$items.quantity' },
      }},
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]),

    // Recent 8 bills
    Bill.find(notCancelled)
      .sort({ date: -1 })
      .limit(8)
      .select('invoiceNo customerName grandTotal status paymentMode date amountPaid')
      .populate('cashier', 'name')
      .lean(),
  ]);

  // ── Process / extract values ──────────────────────────────────────────────
  const today_data  = todayAgg[0]  || { sales: 0, count: 0, gst: 0, discount: 0 };
  const month_data  = monthAgg[0]  || { sales: 0, count: 0 };
  const year_data   = yearAgg[0]   || { revenue: 0 };
  const prod        = productStats[0] || { total: 0, totalValue: 0, lowStock: 0, outOfStock: 0, active: 0 };
  const expense_m   = expenseAgg[0]  || { total: 0 };
  const credit      = creditAgg[0]   || { outstanding: 0 };

  // Estimated profit (year revenue - estimated purchase cost via inventory value change)
  const grossProfit = year_data.revenue * 0.22; // ~22% margin estimate when no purchase data

  // ── Build last 7 days chart labels & data ─────────────────────────────────
  const last7Labels = [];
  const last7Sales  = [];
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  for (let i = 6; i >= 0; i--) {
    const d = nDaysAgo(i);
    const key = d.toISOString().split('T')[0];
    const found = salesLast7.find(s => s._id === key);
    last7Labels.push(i === 0 ? 'Today' : dayNames[d.getDay()]);
    last7Sales.push(found ? found.sales : 0);
  }

  // ── Build last 6 months chart labels ──────────────────────────────────────
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const last6Labels   = [];
  const last6Revenue  = [];
  const last6Counts   = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const found = salesLast6Months.find(m => m._id === key);
    last6Labels.push(monthNames[d.getMonth()]);
    last6Revenue.push(found ? found.revenue : 0);
    last6Counts.push(found ? found.count : 0);
  }

  // ── Build payment mode data ───────────────────────────────────────────────
  const paymentLabels = paymentModeBreakdown.map(p => p._id);
  const paymentValues = paymentModeBreakdown.map(p => p.total);

  // ── Response ──────────────────────────────────────────────────────────────
  res.json({
    success: true,
    data: {
      // ── KPIs ──
      kpis: {
        todaySales:      today_data.sales,
        todayBills:      today_data.count,
        todayGst:        today_data.gst,
        todayDiscount:   today_data.discount,
        monthlySales:    month_data.sales,
        monthlyBills:    month_data.count,
        totalRevenue:    year_data.revenue,
        netProfit:       grossProfit,
        totalProducts:   prod.total,
        activeProducts:  prod.active,
        inventoryValue:  prod.totalValue,
        totalCustomers:  customerCount,
        totalSuppliers:  supplierCount,
        pendingPayments: credit.outstanding,
        monthlyExpenses: expense_m.total,
        lowStockCount:   prod.lowStock,
        outOfStockCount: prod.outOfStock,
        expiredCount:    0, // TODO: add expiry field to Product model
      },
      // ── Chart data ──
      charts: {
        salesTrend: { labels: last7Labels, data: last7Sales },
        monthlyRevenue: { labels: last6Labels, revenue: last6Revenue, bills: last6Counts },
        paymentBreakdown: { labels: paymentLabels, data: paymentValues },
        inventory: {
          labels: ['In Stock', 'Low Stock', 'Out of Stock'],
          data: [
            prod.total - prod.lowStock - prod.outOfStock,
            prod.lowStock,
            prod.outOfStock,
          ],
        },
      },
      // ── Lists ──
      lowStockItems,
      outOfStockItems,
      topProducts,
      recentBills,
    },
  });
});

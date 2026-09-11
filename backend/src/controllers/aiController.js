/**
 * controllers/aiController.js
 * KrushiMitra AI — AI Assistant Business Intelligence Controller
 *
 * Uses OpenAI GPT-4o-mini when OPENAI_API_KEY is configured.
 * Falls back to a built-in local AI engine when no API key is present —
 * so the chatbot ALWAYS works, even without an external API key.
 */
import Bill      from '../models/Bill.js';
import Product   from '../models/Product.js';
import Customer  from '../models/Customer.js';
import Supplier  from '../models/Supplier.js';
import Expense   from '../models/Expense.js';
import Inventory from '../models/Inventory.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

// ─── Helper: Gather live business context from DB ─────────────────────────────
const gatherBusinessContext = async () => {
  const now         = new Date();
  const todayStart  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart  = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart   = new Date(now.getFullYear(), 0, 1);
  const thirtyDays  = new Date(); thirtyDays.setDate(now.getDate() + 30);

  const [
    todaySales, monthlySales, yearlySales,
    lowStockProducts, outOfStock, expiredProducts, nearExpiry,
    topProducts, creditCustomers, pendingSuppliers,
    recentBills, monthlyExpenses, totalCustomers, totalProducts,
  ] = await Promise.all([
    // Today's sales
    Bill.aggregate([
      { $match: { date: { $gte: todayStart }, status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 }, discount: { $sum: '$totalDiscount' }, gst: { $sum: '$totalGst' } } },
    ]),

    // Monthly sales
    Bill.aggregate([
      { $match: { date: { $gte: monthStart }, status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
    ]),

    // Yearly sales
    Bill.aggregate([
      { $match: { date: { $gte: yearStart }, status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
    ]),

    // Low stock (top 10)
    Product.find({
      isActive: true,
      $expr: { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$minStock'] }] }
    }).select('name sku stock minStock unit').limit(10).lean(),

    // Out of stock count
    Product.countDocuments({ stock: 0, isActive: true }),

    // Expired products
    Product.find({ expiryDate: { $lt: now }, isActive: true })
      .select('name sku stock expiryDate').limit(10).lean(),

    // Near expiry (within 30 days)
    Product.find({ expiryDate: { $gte: now, $lte: thirtyDays }, isActive: true })
      .select('name sku stock expiryDate').limit(10).lean(),

    // Top 5 selling products this month
    Bill.aggregate([
      { $match: { date: { $gte: monthStart }, status: { $ne: 'Cancelled' } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.productName', qty: { $sum: '$items.quantity' }, revenue: { $sum: '$items.total' } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]),

    // Customers with outstanding balance
    Customer.find({ outstandingBalance: { $gt: 0 }, isActive: true })
      .select('name phone outstandingBalance').sort({ outstandingBalance: -1 }).limit(5).lean(),

    // Suppliers with pending payments
    Supplier.find({ outstandingBalance: { $gt: 0 }, isActive: true })
      .select('name outstandingBalance').sort({ outstandingBalance: -1 }).limit(5).lean(),

    // Last 5 bills
    Bill.find({ status: { $ne: 'Cancelled' } })
      .sort({ date: -1 })
      .limit(5)
      .select('invoiceNo customerName grandTotal status date')
      .lean(),

    // Monthly expenses
    Expense.aggregate([
      { $match: { date: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),

    // Total customers
    Customer.countDocuments({ isActive: true }),

    // Total products
    Product.countDocuments({ isActive: true }),
  ]);

  return {
    today: {
      date:     now.toLocaleDateString('en-IN'),
      sales:    todaySales[0]?.total    || 0,
      bills:    todaySales[0]?.count    || 0,
      discount: todaySales[0]?.discount || 0,
      gst:      todaySales[0]?.gst      || 0,
    },
    monthly: {
      month:    now.toLocaleString('default', { month: 'long' }),
      year:     now.getFullYear(),
      sales:    monthlySales[0]?.total  || 0,
      bills:    monthlySales[0]?.count  || 0,
      expenses: monthlyExpenses[0]?.total || 0,
    },
    yearly: {
      sales: yearlySales[0]?.total || 0,
      bills: yearlySales[0]?.count || 0,
    },
    inventory: { lowStock: lowStockProducts, outOfStockCount: outOfStock, expired: expiredProducts, nearExpiry },
    topProducts,
    creditCustomers,
    pendingSuppliers,
    recentBills,
    counts: { customers: totalCustomers, products: totalProducts },
  };
};

// ─── System prompt builder (used when OpenAI is available) ────────────────────
const buildSystemPrompt = (context) => `
You are KrushiMitra AI Assistant, a professional business intelligence assistant for an agriculture shop billing and inventory management system in India.

You have access to REAL-TIME business data (as of ${context.today.date}):

## TODAY'S PERFORMANCE
- Sales: ₹${context.today.sales.toFixed(2)} across ${context.today.bills} bills
- Discount Given: ₹${context.today.discount.toFixed(2)} | GST Collected: ₹${context.today.gst.toFixed(2)}

## MONTHLY PERFORMANCE (${context.monthly.month} ${context.monthly.year})
- Revenue: ₹${context.monthly.sales.toFixed(2)} across ${context.monthly.bills} bills
- Expenses: ₹${context.monthly.expenses.toFixed(2)}
- Net Estimate: ₹${(context.monthly.sales - context.monthly.expenses).toFixed(2)}

## YEARLY REVENUE (${context.monthly.year})
- Total: ₹${context.yearly.sales.toFixed(2)} across ${context.yearly.bills} bills

## INVENTORY ALERTS
- Out of Stock Products: ${context.inventory.outOfStockCount}
- Low Stock Products: ${context.inventory.lowStock.map(p => `${p.name} (${p.stock} ${p.unit} left, min: ${p.minStock})`).join(', ') || 'None'}
- Expired Products: ${context.inventory.expired.map(p => `${p.name} (expired: ${new Date(p.expiryDate).toLocaleDateString('en-IN')})`).join(', ') || 'None'}
- Expiring Soon (30 days): ${context.inventory.nearExpiry.map(p => `${p.name} (${new Date(p.expiryDate).toLocaleDateString('en-IN')})`).join(', ') || 'None'}

## TOP SELLING PRODUCTS THIS MONTH
${context.topProducts.map((p, i) => `${i + 1}. ${p._id} — ₹${p.revenue?.toFixed(2)} (${p.qty} units)`).join('\n') || 'No data yet'}

## CREDIT CUSTOMERS (Outstanding)
${context.creditCustomers.map(c => `${c.name} (${c.phone}): ₹${c.outstandingBalance}`).join('\n') || 'None outstanding'}

## SUPPLIER PENDING PAYMENTS
${context.pendingSuppliers.map(s => `${s.name}: ₹${s.outstandingBalance}`).join('\n') || 'All cleared'}

## RECENT BILLS
${context.recentBills.map(b => `${b.invoiceNo} — ${b.customerName} — ₹${b.grandTotal} (${b.status})`).join('\n') || 'No recent bills'}

## SHOP STATS
- Total Active Customers: ${context.counts.customers}
- Total Active Products: ${context.counts.products}

## YOUR ROLE
- Answer questions about sales, revenue, profit, stock, customers, suppliers, and business performance.
- Provide actionable suggestions for an Indian agriculture shop.
- Format numbers in Indian currency (₹) with proper formatting.
- Keep responses concise, professional, and data-driven.
- Suggest business improvements, reorder reminders, and seasonal patterns when appropriate.
- Always respond in English but understand Hindi/Marathi terms for agricultural products.
`;

// ─── Built-in Local AI Fallback (works without any API key) ──────────────────
const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const localFallbackAI = (userMessage, context) => {
  const msg = userMessage.toLowerCase().trim();

  // ── Sales / Revenue queries ────────────────────────────────────────────────
  if (/today.*(sale|revenue|earn|collect|bill|sell)/i.test(msg) || /(sale|revenue).*(today)/i.test(msg)) {
    return (
      `📊 **Today's Performance** (${context.today.date}):\n\n` +
      `• Total Sales: **${fmt(context.today.sales)}**\n` +
      `• Bills Created: **${context.today.bills}**\n` +
      `• GST Collected: ${fmt(context.today.gst)}\n` +
      `• Discounts Given: ${fmt(context.today.discount)}\n` +
      (context.today.bills === 0
        ? '\n💡 No sales recorded today yet.'
        : `\n💡 Average bill value: ${fmt(context.today.bills > 0 ? context.today.sales / context.today.bills : 0)}`)
    );
  }

  if (/(month|monthly).*(sale|revenue|earn|bill)/i.test(msg) || /(sale|revenue).*(month)/i.test(msg)) {
    const netEst = context.monthly.sales - context.monthly.expenses;
    return (
      `📅 **${context.monthly.month} ${context.monthly.year} Performance**:\n\n` +
      `• Total Revenue: **${fmt(context.monthly.sales)}**\n` +
      `• Total Bills: **${context.monthly.bills}**\n` +
      `• Total Expenses: ${fmt(context.monthly.expenses)}\n` +
      `• Estimated Net: **${fmt(netEst)}**\n` +
      (context.monthly.bills > 0 ? `• Avg Bill Value: ${fmt(context.monthly.sales / context.monthly.bills)}\n` : '') +
      `\n💡 ${netEst < 0 ? '⚠️ Expenses exceed revenue this month!' : 'Keep it up!'}`
    );
  }

  if (/(year|annual|yearly).*(sale|revenue|earn)/i.test(msg) || /(sale|revenue).*(year)/i.test(msg)) {
    return (
      `📈 **Yearly Revenue (${context.monthly.year})**:\n\n` +
      `• Total Revenue: **${fmt(context.yearly.sales)}**\n` +
      `• Total Bills: **${context.yearly.bills}**\n` +
      (context.yearly.bills > 0 ? `• Avg Bill Value: ${fmt(context.yearly.sales / context.yearly.bills)}\n` : '') +
      `\n💡 Yearly data helps identify seasonal patterns in agriculture sales.`
    );
  }

  // ── Stock / Inventory queries ──────────────────────────────────────────────
  if (/(low.?stock|stock.?low|reorder|running.?out)/i.test(msg)) {
    const ls = context.inventory.lowStock;
    if (ls.length === 0) return '✅ **No low stock alerts!** All products are stocked above minimum levels.';
    return (
      `⚠️ **${ls.length} Products Running Low on Stock:**\n\n` +
      ls.map(p => `• **${p.name}** — ${p.stock} ${p.unit} left (min: ${p.minStock} ${p.unit})`).join('\n') +
      `\n\n💡 Reorder these products soon to avoid stockouts.`
    );
  }

  if (/(out.?of.?stock|no.?stock|zero.?stock|unavailable)/i.test(msg)) {
    const cnt = context.inventory.outOfStockCount;
    return cnt === 0
      ? '✅ **No out-of-stock products!** All items have some stock.'
      : `🔴 **${cnt} products are currently out of stock.**\n\nGo to the **Inventory** page to view details and initiate purchase entries to restock.`;
  }

  if (/(expir|expiry|expired|spoil)/i.test(msg)) {
    const expired = context.inventory.expired;
    const soon    = context.inventory.nearExpiry;
    let response  = '';
    if (expired.length > 0) {
      response += `🚨 **${expired.length} EXPIRED Products** (remove from shelves immediately!):\n` +
        expired.map(p => `• ${p.name} — expired ${new Date(p.expiryDate).toLocaleDateString('en-IN')}`).join('\n') + '\n\n';
    }
    if (soon.length > 0) {
      response += `⚠️ **${soon.length} Expiring Within 30 Days:**\n` +
        soon.map(p => `• ${p.name} — expires ${new Date(p.expiryDate).toLocaleDateString('en-IN')}`).join('\n');
    }
    if (!response) return '✅ No expired or near-expiry products. Your inventory is fresh!';
    return response;
  }

  if (/(inventory|stock.?status|stock.?summar)/i.test(msg)) {
    return (
      `📦 **Inventory Summary**:\n\n` +
      `• Total Active Products: **${context.counts.products}**\n` +
      `• Out of Stock: 🔴 **${context.inventory.outOfStockCount}**\n` +
      `• Low Stock: ⚠️ **${context.inventory.lowStock.length}**\n` +
      `• Expired: 🚨 **${context.inventory.expired.length}**\n` +
      `• Expiring Soon (30d): ⚠️ **${context.inventory.nearExpiry.length}**\n` +
      `\n💡 Visit the **Inventory** page for detailed stock management.`
    );
  }

  // ── Customer queries ───────────────────────────────────────────────────────
  if (/(customer|credit|outstanding|balance|dues|receivable)/i.test(msg)) {
    const customers = context.creditCustomers;
    const total     = customers.reduce((s, c) => s + (c.outstandingBalance || 0), 0);
    if (customers.length === 0) {
      return `✅ **No outstanding customer balances!** All dues are cleared.\n\nTotal Customers: **${context.counts.customers}**`;
    }
    return (
      `💰 **Top Customers with Outstanding Balance:**\n\n` +
      customers.map((c, i) => `${i + 1}. **${c.name}** (${c.phone || 'N/A'}) — ${fmt(c.outstandingBalance)}`).join('\n') +
      `\n\n📊 Total Outstanding: **${fmt(total)}**\n` +
      `📋 Total Active Customers: **${context.counts.customers}**\n` +
      `\n💡 Visit **Customers** page to collect dues and manage credit limits.`
    );
  }

  // ── Supplier / Payment queries ─────────────────────────────────────────────
  if (/(supplier|vendor|payable|pay.?to|payment.?due)/i.test(msg)) {
    const suppliers = context.pendingSuppliers;
    const total     = suppliers.reduce((s, p) => s + (p.outstandingBalance || 0), 0);
    if (suppliers.length === 0) return '✅ **All supplier payments are cleared!** No pending dues to suppliers.';
    return (
      `🏭 **Suppliers with Pending Payments:**\n\n` +
      suppliers.map((s, i) => `${i + 1}. **${s.name}** — ${fmt(s.outstandingBalance)}`).join('\n') +
      `\n\n📊 Total Payable: **${fmt(total)}**\n` +
      `\n💡 Visit **Suppliers** page to record payments and manage supplier accounts.`
    );
  }

  // ── Top products queries ───────────────────────────────────────────────────
  if (/(top|best|selling|popular|product)/i.test(msg)) {
    const tp = context.topProducts;
    if (tp.length === 0) {
      return `📦 No sales recorded this month yet.\n\nTotal Products in catalog: **${context.counts.products}**`;
    }
    return (
      `🌟 **Top Selling Products This Month:**\n\n` +
      tp.map((p, i) => `${i + 1}. **${p._id}** — ${fmt(p.revenue)} revenue (${p.qty} units sold)`).join('\n') +
      `\n\n💡 Ensure these high-sellers are always well-stocked!`
    );
  }

  // ── Recent bills ───────────────────────────────────────────────────────────
  if (/(recent|last|latest).*(bill|invoice|sale)/i.test(msg)) {
    const bills = context.recentBills;
    if (bills.length === 0) return '📋 No recent bills found. Create your first bill from the **POS** page!';
    return (
      `📋 **Recent Bills:**\n\n` +
      bills.map(b => `• **${b.invoiceNo}** — ${b.customerName} — ${fmt(b.grandTotal)} (${b.status})`).join('\n') +
      `\n\n💡 Go to **Reports** for full bill history and analytics.`
    );
  }

  // ── Profit / Financial summary ─────────────────────────────────────────────
  if (/(profit|margin|earning|income|financial|summary|overview)/i.test(msg)) {
    const netProfit = context.monthly.sales - context.monthly.expenses;
    const margin    = context.monthly.sales > 0 ? ((netProfit / context.monthly.sales) * 100).toFixed(1) : 0;
    return (
      `💹 **Financial Summary — ${context.monthly.month} ${context.monthly.year}:**\n\n` +
      `• Revenue: **${fmt(context.monthly.sales)}**\n` +
      `• Expenses: ${fmt(context.monthly.expenses)}\n` +
      `• Estimated Net Profit: **${fmt(netProfit)}**\n` +
      `• Profit Margin: **${margin}%**\n\n` +
      `📈 Yearly Revenue: **${fmt(context.yearly.sales)}**\n` +
      `\n💡 Go to **Reports → Profit** for detailed COGS analysis.`
    );
  }

  // ── Help ───────────────────────────────────────────────────────────────────
  if (/(help|what can|what do|how do|guide|menu|option)/i.test(msg)) {
    return (
      `🌱 **KrushiMitra AI Assistant** — I can help you with:\n\n` +
      `📊 **Sales & Revenue**\n• "What are today's sales?"\n• "Show monthly revenue"\n• "Yearly performance"\n\n` +
      `📦 **Inventory**\n• "Which products are low on stock?"\n• "Show out of stock items"\n• "Any expired products?"\n\n` +
      `👥 **Customers**\n• "Who has outstanding balance?"\n• "Show credit customers"\n\n` +
      `🏭 **Suppliers**\n• "Any pending supplier payments?"\n\n` +
      `📋 **Billing**\n• "Show recent bills"\n• "Top selling products"\n\n` +
      `💰 **Finance**\n• "Show profit summary"\n• "Financial overview"\n\n` +
      `Press **F1** to toggle this assistant anytime!`
    );
  }

  // ── Greeting ───────────────────────────────────────────────────────────────
  if (/^(hi|hello|hey|namaste|namaskar|good|helo)/i.test(msg)) {
    const hour     = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    return (
      `${greeting}! 🌱 I'm your KrushiMitra AI assistant.\n\n` +
      `📊 Quick snapshot for today (${context.today.date}):\n` +
      `• Sales: **${fmt(context.today.sales)}** (${context.today.bills} bills)\n` +
      `• Low stock alerts: **${context.inventory.lowStock.length}** products\n` +
      `• Out of stock: **${context.inventory.outOfStockCount}** products\n\n` +
      `How can I help you? Type "help" to see what I can do!`
    );
  }

  // ── Default fallback ───────────────────────────────────────────────────────
  return (
    `🌱 I have real-time access to your business data. Here's a quick snapshot:\n\n` +
    `📊 **Today:** ${fmt(context.today.sales)} revenue (${context.today.bills} bills)\n` +
    `📅 **This Month:** ${fmt(context.monthly.sales)} revenue\n` +
    `⚠️ **Alerts:** ${context.inventory.lowStock.length} low stock, ${context.inventory.outOfStockCount} out of stock\n\n` +
    `I can answer questions about sales, inventory, customers, suppliers, and more. Try:\n` +
    `• "What are today's sales?"\n` +
    `• "Which products are low on stock?"\n` +
    `• "Who has outstanding balance?"\n` +
    `• "Show top selling products"\n\nType "help" for all options.`
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/ai/chat
// @desc    Chat with AI — uses OpenAI if configured, local AI otherwise
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const chatWithAI = asyncHandler(async (req, res) => {
  const { messages = [], stream = false } = req.body;

  if (!messages.length) {
    return res.status(400).json({ success: false, message: 'Messages array is required' });
  }

  // Gather live business data for context (used by both OpenAI and local AI)
  const context = await gatherBusinessContext();

  // ── OpenAI path (only when API key is configured) ────────────────────────
  if (process.env.OPENAI_API_KEY) {
    let openai = null;
    try {
      const { default: OpenAI } = await import('openai');
      openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    } catch (e) {
      console.warn('[AI] OpenAI init failed, falling back to local AI:', e.message);
    }

    if (openai) {
      const systemPrompt = buildSystemPrompt(context);
      const chatHistory  = messages.slice(-20).map(m => ({
        role:    m.role === 'user' ? 'user' : 'assistant',
        content: String(m.content).slice(0, 2000),
      }));
      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

      if (!stream) {
        const completion = await openai.chat.completions.create({
          model,
          messages: [{ role: 'system', content: systemPrompt }, ...chatHistory],
          max_tokens:  800,
          temperature: 0.7,
        });
        const reply      = completion.choices[0]?.message?.content || 'I could not generate a response.';
        const tokensUsed = completion.usage?.total_tokens || 0;
        return res.json({ success: true, data: { reply, tokensUsed, model: completion.model, source: 'openai' } });
      }

      // Streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const streamRes = await openai.chat.completions.create({
        model,
        messages: [{ role: 'system', content: systemPrompt }, ...chatHistory],
        max_tokens: 800, temperature: 0.7, stream: true,
      });
      for await (const chunk of streamRes) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }
  }

  // ── Local Fallback AI (always works, no API key needed) ──────────────────
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
  const userText    = lastUserMsg?.content || '';
  const reply       = localFallbackAI(userText, context);

  return res.json({
    success: true,
    data: {
      reply,
      tokensUsed: 0,
      model:  'krushimitra-local-ai-v1',
      source: 'local',
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/ai/context
// @desc    Get current business context (for debug / dashboard display)
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const getAIContext = asyncHandler(async (req, res) => {
  const context = await gatherBusinessContext();
  res.json({ success: true, data: context });
});

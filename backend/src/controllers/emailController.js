/**
 * controllers/emailController.js
 * KrushiMitra AI — Email Invoice + WhatsApp Share
 *
 * Sends invoices via:
 *  1. Email  — Nodemailer + SMTP credentials from Settings
 *  2. WhatsApp — Generates wa.me URL with formatted bill summary
 */
import nodemailer from 'nodemailer';
import Bill        from '../models/Bill.js';
import Settings    from '../models/Settings.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';
import { logAudit }     from '../middleware/auditMiddleware.js';

// ── Build dynamic SMTP transporter from DB settings ────────────────────────────
const createTransporter = async () => {
  const settings = await Settings.findOne().select('smtpHost smtpPort smtpUser smtpPass smtpFromName shopName').lean();

  if (!settings?.smtpHost || !settings?.smtpUser) {
    throw new Error('Email not configured. Please set SMTP credentials in Settings → Email.');
  }

  return nodemailer.createTransport({
    host:   settings.smtpHost,
    port:   Number(settings.smtpPort) || 587,
    secure: Number(settings.smtpPort) === 465,
    auth: {
      user: settings.smtpUser,
      pass: settings.smtpPass,
    },
    tls: { rejectUnauthorized: false },
  });
};

// ── Build professional HTML invoice email ──────────────────────────────────────
const buildInvoiceHtml = (bill, shopSettings) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice ${bill.invoiceNo}</title>
  <style>
    body { font-family: -apple-system, Arial, sans-serif; background: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 32px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
    .header p  { margin: 4px 0 0; opacity: 0.85; font-size: 14px; }
    .invoice-meta { display: flex; justify-content: space-between; padding: 24px 32px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
    .meta-block h3 { margin: 0 0 4px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; }
    .meta-block p  { margin: 0; font-size: 14px; font-weight: 600; color: #0f172a; }
    .items-table { width: 100%; border-collapse: collapse; margin: 0; }
    .items-table thead th { background: #f1f5f9; padding: 10px 16px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; }
    .items-table tbody td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .items-table tbody tr:last-child td { border-bottom: none; }
    .totals { padding: 24px 32px; background: #f8fafc; }
    .totals-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px; color: #64748b; }
    .totals-row.grand { font-size: 18px; font-weight: 700; color: #15803d; border-top: 2px solid #e2e8f0; padding-top: 12px; margin-top: 8px; }
    .footer { text-align: center; padding: 24px 32px; color: #94a3b8; font-size: 13px; border-top: 1px solid #e2e8f0; }
    .footer strong { color: #16a34a; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background: #dcfce7; color: #16a34a; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌱 ${shopSettings?.shopName || 'KrushiMitra Agri Shop'}</h1>
      <p>${shopSettings?.tagline || 'Your Trusted Agriculture Partner'}</p>
      ${shopSettings?.gstNo ? `<p style="margin-top:8px; font-size:12px;">GSTIN: ${shopSettings.gstNo}</p>` : ''}
    </div>

    <div class="invoice-meta">
      <div class="meta-block">
        <h3>Invoice To</h3>
        <p>${bill.customerName}</p>
        ${bill.customerPhone ? `<p style="font-size:13px;color:#64748b;">${bill.customerPhone}</p>` : ''}
      </div>
      <div class="meta-block" style="text-align:right">
        <h3>Invoice Details</h3>
        <p>${bill.invoiceNo}</p>
        <p style="font-size:13px;color:#64748b;">${new Date(bill.date).toLocaleString('en-IN')}</p>
        <span class="status-badge">${bill.status}</span>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Product</th>
          <th>HSN</th>
          <th>Qty</th>
          <th>Rate</th>
          <th>GST%</th>
          <th style="text-align:right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${bill.items.map((item, i) => `
          <tr>
            <td>${i + 1}</td>
            <td><strong>${item.productName}</strong><br><span style="font-size:12px;color:#94a3b8;">${item.sku}</span></td>
            <td style="font-size:12px;">${item.hsnCode || '-'}</td>
            <td>${item.quantity} ${item.unit}</td>
            <td>₹${item.unitPrice.toFixed(2)}</td>
            <td>${item.gstRate}%</td>
            <td style="text-align:right;font-weight:600;">₹${item.total.toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row"><span>Subtotal</span><span>₹${bill.subtotal.toFixed(2)}</span></div>
      ${bill.totalDiscount > 0 ? `<div class="totals-row"><span>Discount</span><span style="color:#ef4444;">-₹${bill.totalDiscount.toFixed(2)}</span></div>` : ''}
      <div class="totals-row"><span>CGST</span><span>₹${bill.totalCgst.toFixed(2)}</span></div>
      <div class="totals-row"><span>SGST</span><span>₹${bill.totalSgst.toFixed(2)}</span></div>
      <div class="totals-row grand"><span>GRAND TOTAL</span><span>₹${bill.grandTotal.toFixed(2)}</span></div>
      <div class="totals-row" style="margin-top:8px;"><span>Amount Paid</span><span style="color:#16a34a;font-weight:600;">₹${bill.amountPaid.toFixed(2)}</span></div>
      ${bill.status === 'Credit' ? `<div class="totals-row"><span>Balance Due</span><span style="color:#ef4444;font-weight:600;">₹${(bill.grandTotal - bill.amountPaid).toFixed(2)}</span></div>` : ''}
    </div>

    <div class="footer">
      <p>Thank you for shopping at <strong>${shopSettings?.shopName || 'KrushiMitra'}</strong>!</p>
      ${shopSettings?.phone ? `<p>Contact: ${shopSettings.phone} | ${shopSettings?.email || ''}</p>` : ''}
      <p style="font-size:11px;margin-top:12px;">This is a computer-generated invoice. No signature required.</p>
    </div>
  </div>
</body>
</html>
`;

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/bills/:id/email
// @desc    Send invoice PDF to customer email
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const emailInvoice = asyncHandler(async (req, res) => {
  const { toEmail } = req.body;

  const bill = await Bill.findById(req.params.id)
    .populate('cashier', 'name')
    .lean();
  if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });

  const settings = await Settings.findOne().lean();
  const recipient = toEmail || bill.customerEmail || '';

  if (!recipient) {
    return res.status(400).json({ success: false, message: 'No email address provided' });
  }

  const transporter = await createTransporter();

  await transporter.sendMail({
    from:    `"${settings?.smtpFromName || settings?.shopName || 'KrushiMitra'}" <${settings?.smtpUser}>`,
    to:      recipient,
    subject: `Invoice ${bill.invoiceNo} from ${settings?.shopName || 'KrushiMitra Agri Shop'}`,
    html:    buildInvoiceHtml(bill, settings),
  });

  await logAudit({
    user:        req.user,
    action:      'EMAIL_SENT',
    resource:    'Bill',
    resourceId:  bill._id,
    resourceNo:  bill.invoiceNo,
    description: `Invoice ${bill.invoiceNo} emailed to ${recipient}`,
    req,
  });

  res.json({ success: true, message: `Invoice sent to ${recipient}` });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/bills/:id/whatsapp
// @desc    Generate WhatsApp share link with bill summary
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const whatsappInvoice = asyncHandler(async (req, res) => {
  const bill = await Bill.findById(req.params.id).lean();
  if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });

  const settings = await Settings.findOne().lean();
  const shopName  = settings?.shopName || 'KrushiMitra Agri Shop';

  // Build compact WhatsApp message
  const itemsText = bill.items.slice(0, 5).map(i =>
    `• ${i.productName} x${i.quantity} = ₹${i.total.toFixed(2)}`
  ).join('\n');
  const moreItems = bill.items.length > 5 ? `\n+${bill.items.length - 5} more items` : '';

  const message = [
    `🌱 *${shopName}*`,
    `📄 Invoice: *${bill.invoiceNo}*`,
    `📅 Date: ${new Date(bill.date).toLocaleDateString('en-IN')}`,
    ``,
    `*Items:*`,
    itemsText + moreItems,
    ``,
    `💰 Subtotal: ₹${bill.subtotal.toFixed(2)}`,
    bill.totalDiscount > 0 ? `🏷️ Discount: -₹${bill.totalDiscount.toFixed(2)}` : null,
    `📊 GST: ₹${bill.totalGst.toFixed(2)}`,
    `✅ *Grand Total: ₹${bill.grandTotal.toFixed(2)}*`,
    ``,
    bill.status === 'Credit' ? `⚠️ *Balance Due: ₹${(bill.grandTotal - bill.amountPaid).toFixed(2)}*` : `✅ Status: ${bill.status}`,
    ``,
    `_Thank you for shopping with us!_`,
    settings?.phone ? `📞 ${settings.phone}` : null,
  ].filter(Boolean).join('\n');

  const phone = bill.customerPhone?.replace(/\D/g, '') || '';
  const url   = `https://wa.me/${phone.startsWith('91') ? phone : '91' + phone}?text=${encodeURIComponent(message)}`;

  await logAudit({
    user:       req.user,
    action:     'WHATSAPP_SENT',
    resource:   'Bill',
    resourceId: bill._id,
    resourceNo: bill.invoiceNo,
    description:`WhatsApp link generated for ${bill.invoiceNo}`,
    req,
  });

  res.json({ success: true, data: { url, message, phone: bill.customerPhone } });
});

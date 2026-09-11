/**
 * controllers/inventoryController.js
 * KrushiMitra AI — Inventory Management & Alerts
 */
import mongoose from 'mongoose';
import Inventory from '../models/Inventory.js';
import Product from '../models/Product.js';
import Supplier from '../models/Supplier.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/inventory
// @desc    Get inventory movement logs
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const getInventoryLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type = '', search = '' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const query = {};

  if (type) query.type = type;
  if (search) {
    query.$or = [
      { productName: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
      { referenceNo: { $regex: search, $options: 'i' } }
    ];
  }

  const [logs, total] = await Promise.all([
    Inventory.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('createdBy', 'name')
      .lean(),
    Inventory.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: logs,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/inventory/purchase
// @desc    Bulk Stock In (Purchase Entry) from a Supplier
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const processPurchaseEntry = asyncHandler(async (req, res) => {
  const { supplierId, referenceNo, invoiceDate, items, notes } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Purchase entry must have at least one item' });
  }

  const supplier = await Supplier.findById(supplierId);
  if (!supplier) {
    return res.status(404).json({ success: false, message: 'Supplier not found' });
  }

  let totalPurchaseAmount = 0;
  const inventoryLogs = [];

  // Create a session for transaction (optional, but good for bulk updates if replica set is active. We will do standard bulk for now)
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) continue;

    const qty = Number(item.quantity);
    const unitPrice = Number(item.unitPrice); // Base price before GST
    const gstRate = Number(item.gstRate || product.gstRate);
    const discount = Number(item.discountAmount || 0);

    const baseAmount = (qty * unitPrice) - discount;
    const itemTotalAmount = baseAmount + (baseAmount * gstRate / 100);

    totalPurchaseAmount += itemTotalAmount;
    
    const previousStock = product.stock;
    const newStock = previousStock + qty;

    // Update Product: Add stock and set Latest Purchase Price (as per user preference)
    product.stock = newStock;
    product.purchasePrice = unitPrice; 
    if (item.sellingPrice) product.sellingPrice = Number(item.sellingPrice);
    if (item.mrp) product.mrp = Number(item.mrp);
    if (item.batchNumber) product.batchNumber = item.batchNumber;
    if (item.expiryDate) product.expiryDate = new Date(item.expiryDate);
    
    await product.save();

    // Create Log
    inventoryLogs.push({
      product: product._id,
      productName: product.name,
      sku: product.sku,
      type: 'StockIn',
      quantity: qty,
      previousStock,
      newStock,
      referenceType: 'Purchase',
      referenceId: supplier._id, // Save supplier ID as reference
      referenceNo: referenceNo || 'N/A',
      purchasePrice: unitPrice,
      sellingPrice: product.sellingPrice,
      notes: notes || 'Bulk Purchase Entry',
      createdBy: req.user._id,
      date: invoiceDate ? new Date(invoiceDate) : new Date(),
    });
  }

  // Insert Logs
  await Inventory.insertMany(inventoryLogs);

  // Update Supplier Ledger
  supplier.outstandingBalance += totalPurchaseAmount;
  supplier.totalPurchases += totalPurchaseAmount;
  await supplier.save();

  res.status(201).json({
    success: true,
    message: `Purchase entry processed. Supplier balance updated by ₹${totalPurchaseAmount.toFixed(2)}`,
    data: { totalPurchaseAmount, totalItems: items.length }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/inventory/adjust
// @desc    Manual Stock Adjustment (Correction)
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
export const adjustStock = asyncHandler(async (req, res) => {
  const { productId, adjustmentType, quantity, notes } = req.body;
  // adjustmentType: 'add' | 'subtract'

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  const qty = Number(quantity);
  if (qty <= 0) return res.status(400).json({ success: false, message: 'Quantity must be positive' });

  const previousStock = product.stock;
  let newStock = previousStock;

  if (adjustmentType === 'add') {
    newStock += qty;
  } else if (adjustmentType === 'subtract') {
    if (qty > previousStock) {
      return res.status(400).json({ success: false, message: `Cannot subtract ${qty}. Only ${previousStock} available.` });
    }
    newStock -= qty;
  } else {
    return res.status(400).json({ success: false, message: 'Invalid adjustment type' });
  }

  product.stock = newStock;
  await product.save();

  const log = await Inventory.create({
    product: product._id,
    productName: product.name,
    sku: product.sku,
    type: 'Adjustment',
    quantity: adjustmentType === 'add' ? qty : -qty,
    previousStock,
    newStock,
    referenceType: 'Manual',
    notes: notes || 'Manual stock correction',
    createdBy: req.user._id,
  });

  res.json({ success: true, message: 'Stock adjusted successfully', data: log });
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/inventory/alerts
// @desc    Get Low Stock and Expiry Alerts
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
export const getInventoryAlerts = asyncHandler(async (req, res) => {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const [outOfStock, lowStock, expired, expiringSoon] = await Promise.all([
    Product.find({ stock: 0, isActive: true }).select('name sku stock minStock unit image').lean(),
    Product.find({ $expr: { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$minStock'] }] }, isActive: true }).select('name sku stock minStock unit image').lean(),
    Product.find({ expiryDate: { $lt: new Date() }, isActive: true }).select('name sku stock expiryDate unit').lean(),
    Product.find({ expiryDate: { $gte: new Date(), $lte: thirtyDaysFromNow }, isActive: true }).select('name sku stock expiryDate unit').lean(),
  ]);

  res.json({
    success: true,
    data: {
      outOfStock,
      lowStock,
      expired,
      expiringSoon,
      counts: {
        outOfStock: outOfStock.length,
        lowStock: lowStock.length,
        expired: expired.length,
        expiringSoon: expiringSoon.length,
      }
    }
  });
});

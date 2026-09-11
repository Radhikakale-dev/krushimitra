/**
 * hooks/usePOS.js
 * KrushiMitra AI — POS State Management & Logic
 */
import { useState, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';

export const usePOS = () => {
  const [cartItems, setCartItems] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [payments, setPayments] = useState([]);
  const [roundOff, setRoundOff] = useState(0);
  const [isHold, setIsHold] = useState(false);

  // Add item to cart or increment quantity
  const addItem = useCallback((product) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.product === product._id);
      
      if (existing) {
        if (product.stock < existing.quantity + 1) {
          toast.error(`Only ${product.stock} ${product.unit} available for ${product.name}`);
          return prev;
        }
        
        return prev.map(i => {
          if (i.product !== product._id) return i;
          
          const newQty = i.quantity + 1;
          const gross = i.unitPrice * newQty;
          const discountAmt = (gross * i.discountPercent) / 100;
          const taxable = gross - discountAmt;
          const cgst = (taxable * i.gstRate) / 200;
          const sgst = (taxable * i.gstRate) / 200;
          const total = taxable + cgst + sgst;
          
          return {
            ...i,
            quantity: newQty,
            discountAmount: discountAmt,
            subtotal: taxable,
            cgst,
            sgst,
            total
          };
        });
      }

      if (product.stock < 1) {
        toast.error(`Out of stock: ${product.name}`);
        return prev;
      }

      const qty = 1;
      const unitPrice = product.sellingPrice;
      const gstRate = product.gstRate;
      const discountPercent = 0;
      const discountAmount = 0;
      
      const taxable = unitPrice * qty;
      const cgst = (taxable * gstRate) / 200;
      const sgst = (taxable * gstRate) / 200;
      const total = taxable + cgst + sgst;

      return [...prev, {
        product: product._id,
        productName: product.name,
        sku: product.sku,
        hsnCode: product.hsnCode,
        unit: product.unit,
        unitPrice,
        gstRate,
        discountPercent,
        quantity: qty,
        discountAmount,
        subtotal: taxable,
        cgst,
        sgst,
        total,
        originalStock: product.stock
      }];
    });
  }, []);

  // Update item quantity directly
  const updateQuantity = useCallback((productId, qty) => {
    const numQty = Number(qty);
    if (isNaN(numQty) || numQty < 0) return;

    setCartItems(prev => prev.map(i => {
      if (i.product !== productId) return i;
      
      if (numQty > i.originalStock) {
        toast.error(`Only ${i.originalStock} ${i.unit} available`);
        return i;
      }

      const gross = i.unitPrice * numQty;
      const discountAmt = (gross * i.discountPercent) / 100;
      const taxable = gross - discountAmt;
      const cgst = (taxable * i.gstRate) / 200;
      const sgst = (taxable * i.gstRate) / 200;
      const total = taxable + cgst + sgst;

      return {
        ...i,
        quantity: numQty,
        discountAmount: discountAmt,
        subtotal: taxable,
        cgst,
        sgst,
        total
      };
    }));
  }, []);

  // Update item discount
  const updateDiscount = useCallback((productId, discountPercent) => {
    const pct = Math.max(0, Math.min(100, Number(discountPercent) || 0));

    setCartItems(prev => prev.map(i => {
      if (i.product !== productId) return i;

      const gross = i.unitPrice * i.quantity;
      const discountAmt = (gross * pct) / 100;
      const taxable = gross - discountAmt;
      const cgst = (taxable * i.gstRate) / 200;
      const sgst = (taxable * i.gstRate) / 200;
      const total = taxable + cgst + sgst;

      return {
        ...i,
        discountPercent: pct,
        discountAmount: discountAmt,
        subtotal: taxable,
        cgst,
        sgst,
        total
      };
    }));
  }, []);

  // Remove item
  const removeItem = useCallback((productId) => {
    setCartItems(prev => prev.filter(i => i.product !== productId));
  }, []);

  // Clear cart
  const clearCart = useCallback(() => {
    setCartItems([]);
    setCustomer(null);
    setPayments([]);
    setRoundOff(0);
    setIsHold(false);
  }, []);

  // Compute totals
  const totals = useMemo(() => {
    let subtotal = 0;
    let discount = 0;
    let cgst = 0;
    let sgst = 0;

    cartItems.forEach(i => {
      subtotal += (i.unitPrice * i.quantity);
      discount += i.discountAmount;
      cgst += i.cgst;
      sgst += i.sgst;
    });

    const taxable = subtotal - discount;
    const gst = cgst + sgst;
    const rawTotal = taxable + gst;
    
    // Auto round-off to nearest rupee
    const rounded = Math.round(rawTotal);
    const calculatedRoundOff = rounded - rawTotal;

    return {
      subtotal,
      discount,
      taxable,
      cgst,
      sgst,
      gst,
      rawTotal,
      grandTotal: rounded,
      roundOff: calculatedRoundOff
    };
  }, [cartItems]);

  return {
    cartItems,
    customer,
    setCustomer,
    payments,
    setPayments,
    roundOff,
    setRoundOff,
    isHold,
    setIsHold,
    addItem,
    updateQuantity,
    updateDiscount,
    removeItem,
    clearCart,
    totals
  };
};

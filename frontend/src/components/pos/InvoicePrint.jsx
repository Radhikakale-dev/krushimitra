/**
 * components/pos/InvoicePrint.jsx
 * Printable Invoice template with Thermal (80mm) and A4 layouts.
 */
import React, { forwardRef, useEffect, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { formatCurrency } from '../../utils/formatCurrency';
import api from '../../services/api';

const InvoicePrint = forwardRef(({ bill, settings, layout = 'thermal' }, ref) => {
  const [shopSettings, setShopSettings] = useState(settings || null);

  // Fallback to fetch settings if not provided
  useEffect(() => {
    if (!settings && bill) {
      api.get('/settings').then(res => setShopSettings(res.data)).catch(console.error);
    }
  }, [settings, bill]);

  // Generate Barcode SVG when bill is available
  useEffect(() => {
    if (bill && document.getElementById(`barcode-${bill._id}`)) {
      try {
        JsBarcode(`#barcode-${bill._id}`, bill.invoiceNo, {
          format: 'CODE128',
          width: 1.5,
          height: 40,
          displayValue: true,
          fontSize: 12,
          margin: 0,
        });
      } catch (e) {
        console.error('Barcode generation error:', e);
      }
    }
  }, [bill]);

  if (!bill) return <div ref={ref}></div>;

  const shop = shopSettings || {
    shopName: 'KrushiMitra Agri Shop',
    tagline: 'Your Trusted Agriculture Partner',
    address: 'Main Market, City',
    phone: '1234567890',
    gstNo: 'GSTINXXXXXXXX',
  };

  if (layout === 'thermal') {
    return (
      <div ref={ref} className="bg-white text-black p-4 font-mono text-[12px] leading-tight print-thermal w-[80mm] mx-auto hidden-print-show">
        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold uppercase">{shop.shopName}</h2>
          <p className="text-sm">{shop.tagline}</p>
          <p className="mt-1">{shop.address}</p>
          <p>Ph: {shop.phone}</p>
          {shop.gstNo && <p>GSTIN: {shop.gstNo}</p>}
        </div>

        <div className="border-t border-b border-black border-dashed py-2 mb-2">
          <p>Inv No: {bill.invoiceNo}</p>
          <p>Date  : {new Date(bill.date).toLocaleString()}</p>
          <p>Cashier: {bill.cashier?.name}</p>
        </div>

        {bill.customerName !== 'Walk-in Customer' && (
          <div className="mb-2">
            <p>Customer: {bill.customerName}</p>
            {bill.customerPhone && <p>Phone: {bill.customerPhone}</p>}
          </div>
        )}

        {/* Items Table */}
        <table className="w-full text-left mb-2">
          <thead>
            <tr className="border-b border-black">
              <th className="w-1/2 py-1">Item</th>
              <th className="text-right py-1">Qty</th>
              <th className="text-right py-1">Rate</th>
              <th className="text-right py-1">Total</th>
            </tr>
          </thead>
          <tbody>
            {bill.items.map((item, idx) => (
              <React.Fragment key={idx}>
                <tr>
                  <td colSpan="4" className="pt-1 font-bold">{item.productName}</td>
                </tr>
                <tr>
                  <td className="pl-2 pb-1 text-[10px] text-gray-600">
                    GST {item.gstRate}%
                  </td>
                  <td className="text-right pb-1">{item.quantity}</td>
                  <td className="text-right pb-1">{item.unitPrice}</td>
                  <td className="text-right pb-1">{item.total}</td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t border-black border-dashed pt-2 space-y-1 text-right">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(bill.subtotal)}</span>
          </div>
          {bill.totalDiscount > 0 && (
            <div className="flex justify-between">
              <span>Discount:</span>
              <span>-{formatCurrency(bill.totalDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>GST:</span>
            <span>{formatCurrency(bill.totalGst)}</span>
          </div>
          <div className="flex justify-between font-bold text-sm border-t border-black pt-1 mt-1">
            <span>GRAND TOTAL:</span>
            <span>{formatCurrency(bill.grandTotal)}</span>
          </div>
        </div>

        {/* Payments */}
        <div className="mt-4 pt-2 border-t border-black border-dashed">
          {bill.payments.map((p, i) => (
            <div key={i} className="flex justify-between">
              <span>Paid ({p.mode}):</span>
              <span>{formatCurrency(p.amount)}</span>
            </div>
          ))}
          {bill.balance > 0 && bill.status === 'Paid' && (
            <div className="flex justify-between font-bold">
              <span>Change Returned:</span>
              <span>{formatCurrency(bill.balance)}</span>
            </div>
          )}
          {bill.status === 'Credit' && (
            <div className="flex justify-between font-bold">
              <span>Balance Due:</span>
              <span>{formatCurrency(bill.grandTotal - bill.amountPaid)}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <svg id={`barcode-${bill._id}`} className="mx-auto w-full max-w-[200px]"></svg>
          <p className="mt-2 font-bold uppercase">*** Thank You ***</p>
          <p className="text-[10px] mt-1">Visit Again</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="hidden">
      A4 Print layout coming soon...
    </div>
  );
});

InvoicePrint.displayName = 'InvoicePrint';
export default InvoicePrint;

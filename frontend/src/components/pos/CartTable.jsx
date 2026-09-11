/**
 * components/pos/CartTable.jsx
 * POS Cart Table with inline editing for qty/discount and calculated totals.
 */
import React from 'react';
import { Trash2, ShoppingCart } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

const CartTable = ({ items, onUpdateQty, onUpdateDiscount, onRemove }) => {
  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-content-muted bg-surface border border-divider rounded-xl">
        <ShoppingCart className="h-16 w-16 mb-4 opacity-20" />
        <p className="text-lg font-medium text-content-muted">Cart is empty</p>
        <p className="text-sm mt-1">Scan a barcode or search to add products</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-surface border border-divider rounded-xl overflow-hidden">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-background text-content-muted sticky top-0 z-10 shadow-md">
            <tr>
              <th className="px-4 py-3 font-medium w-10 text-center">#</th>
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-4 py-3 font-medium text-right w-24">Price</th>
              <th className="px-4 py-3 font-medium text-center w-32">Qty</th>
              <th className="px-4 py-3 font-medium text-center w-24">Disc %</th>
              <th className="px-4 py-3 font-medium text-right w-24">GST</th>
              <th className="px-4 py-3 font-medium text-right w-28">Total</th>
              <th className="px-4 py-3 font-medium w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {items.map((item, idx) => (
              <tr key={item.product} className="hover:bg-surface-hover/50 transition-colors">
                <td className="px-4 py-3 text-center text-content-muted">{idx + 1}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-content">{item.productName}</div>
                  <div className="text-xs text-content-muted mt-0.5">{item.sku}</div>
                </td>
                <td className="px-4 py-3 text-right text-content">
                  {formatCurrency(item.unitPrice)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center">
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={item.quantity}
                      onChange={(e) => onUpdateQty(item.product, e.target.value)}
                      className="w-16 bg-background border border-divider rounded text-center py-1 text-content focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={item.discountPercent || ''}
                      onChange={(e) => onUpdateDiscount(item.product, e.target.value)}
                      placeholder="0"
                      className="w-14 bg-background border border-divider rounded text-center py-1 text-content focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="text-content">{formatCurrency(item.cgst + item.sgst)}</div>
                  <div className="text-[10px] text-content-muted">{item.gstRate}%</div>
                </td>
                <td className="px-4 py-3 text-right font-medium text-emerald-400">
                  {formatCurrency(item.total)}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => onRemove(item.product)}
                    className="p-1.5 text-content-muted hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CartTable;

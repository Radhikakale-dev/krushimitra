/**
 * components/pos/PaymentPanel.jsx
 * POS Payment selection, amount received, and change calculation.
 */
import React, { useState, useEffect } from 'react';
import { Banknote, CreditCard, Wallet, Smartphone, IndianRupee, AlertTriangle } from 'lucide-react';
import { formatCurrency, parseCurrency } from '../../utils/formatCurrency';

const PaymentPanel = ({ grandTotal, payments, setPayments, customer, roundOff, setRoundOff }) => {
  const [activeTab, setActiveTab] = useState('Cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [reference, setReference] = useState('');

  // Auto-set payment amount when total changes
  useEffect(() => {
    if (activeTab !== 'Credit') {
      setAmountReceived(grandTotal.toString());
      setPayments([{ mode: activeTab, amount: grandTotal, reference }]);
    }
  }, [grandTotal, activeTab]);

  // Handle manual input changes
  const handleAmountChange = (val) => {
    setAmountReceived(val);
    const num = Number(val) || 0;
    setPayments([{ mode: activeTab, amount: num, reference }]);
  };

  const handleRefChange = (val) => {
    setReference(val);
    const num = Number(amountReceived) || 0;
    setPayments([{ mode: activeTab, amount: num, reference: val }]);
  };

  const received = Number(amountReceived) || 0;
  const change = Math.max(0, received - grandTotal);
  const balance = Math.max(0, grandTotal - received);

  return (
    <div className="bg-surface border border-divider rounded-xl overflow-hidden flex flex-col">
      {/* Total Display */}
      <div className="bg-background p-4 border-b border-divider flex items-center justify-between">
        <div>
          <p className="text-sm text-content-muted font-medium mb-0.5">Grand Total</p>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold text-emerald-400">{formatCurrency(grandTotal)}</h2>
            {roundOff !== 0 && (
              <span className="text-xs text-content-muted bg-surface-hover px-2 py-0.5 rounded-full">
                Round: {roundOff > 0 ? '+' : ''}{roundOff.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Payment Tabs */}
      <div className="flex bg-surface-hover p-2 gap-2 border-b border-divider">
        {[
          { id: 'Cash', icon: Banknote },
          { id: 'UPI', icon: Smartphone },
          { id: 'Card', icon: CreditCard },
          { id: 'Credit', icon: Wallet }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === 'Credit') {
                setAmountReceived('0');
                setPayments([{ mode: 'Credit', amount: 0, reference: '' }]);
              } else {
                setAmountReceived(grandTotal.toString());
                setPayments([{ mode: tab.id, amount: grandTotal, reference: '' }]);
              }
              setReference('');
            }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium flex flex-col items-center gap-1.5 transition-all
              ${activeTab === tab.id 
                ? 'bg-primary-500/10 text-primary-400 border-primary-500/50 shadow-[inset_0_0_12px_rgba(34,197,94,0.1)]' 
                : 'text-content-muted hover:bg-surface-hover hover:text-content border border-transparent'
              } border`}
          >
            <tab.icon className="h-5 w-5" />
            {tab.id}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 flex-1">
        {activeTab === 'Credit' ? (
          <div className="h-full flex flex-col justify-center text-center p-4">
            {!customer ? (
              <div className="text-amber-400 bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
                <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
                <p className="font-medium">Customer Required</p>
                <p className="text-sm mt-1 opacity-80">Select a customer above to enable credit billing.</p>
              </div>
            ) : (
              <div className="text-primary-400 bg-primary-500/10 p-4 rounded-xl border border-primary-500/20">
                <p className="font-medium">Credit Bill for {customer.name}</p>
                <p className="text-sm mt-1 opacity-80">Outstanding Balance will increase by {formatCurrency(grandTotal)}</p>
                {customer.creditLimit > 0 && customer.outstandingBalance + grandTotal > customer.creditLimit && (
                  <p className="text-xs text-red-400 mt-2 font-medium">⚠️ Exceeds Credit Limit ({formatCurrency(customer.creditLimit)})</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-content-muted mb-1.5">Amount Received ({activeTab})</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-content-muted" />
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={amountReceived}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="w-full bg-background border border-divider rounded-xl py-3 pl-10 pr-4 text-2xl font-semibold text-content focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>

            {(activeTab === 'UPI' || activeTab === 'Card') && (
              <div>
                <label className="block text-xs font-medium text-content-muted mb-1.5">Reference No. (Optional)</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => handleRefChange(e.target.value)}
                  placeholder={activeTab === 'UPI' ? "UTR / Transaction ID" : "Last 4 Digits / Approval Code"}
                  className="w-full bg-background border border-divider rounded-lg py-2.5 px-3 text-content focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>
            )}

            {/* Quick cash buttons */}
            {activeTab === 'Cash' && (
              <div className="grid grid-cols-4 gap-2 pt-2">
                {[100, 500, 1000, 2000].map(amt => (
                  <button
                    key={amt}
                    onClick={() => handleAmountChange((received + amt).toString())}
                    className="bg-surface-hover hover:bg-dark-700 text-content py-1.5 rounded border border-divider text-sm font-medium transition-colors"
                  >
                    +{amt}
                  </button>
                ))}
              </div>
            )}

            {/* Change / Balance display */}
            <div className="mt-6 p-4 rounded-xl border border-divider bg-background flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-content-muted">
                  {change > 0 ? 'Change to Return' : balance > 0 ? 'Balance Due' : 'Fully Paid'}
                </p>
                <p className={`text-2xl font-bold ${change > 0 ? 'text-amber-400' : balance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {formatCurrency(change > 0 ? change : balance)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPanel;

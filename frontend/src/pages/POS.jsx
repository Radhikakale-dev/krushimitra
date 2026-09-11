/**
 * pages/POS.jsx
 * KrushiMitra AI — Main POS Billing Screen
 * D-Mart style Two-Column Layout.
 */
import React, { useState, useEffect, useRef } from 'react';
import { usePOS } from '../hooks/usePOS';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Button, Modal, Spinner } from '../components/ui';
import { Printer, Save, RefreshCw, Hand, FileText } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

import ProductSearchPanel from '../components/pos/ProductSearchPanel';
import CustomerSearchPanel from '../components/pos/CustomerSearchPanel';
import CartTable from '../components/pos/CartTable';
import PaymentPanel from '../components/pos/PaymentPanel';
import InvoicePrint from '../components/pos/InvoicePrint';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const POS = () => {
  const {
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
  } = usePOS();

  const [loading, setLoading] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [lastBill, setLastBill] = useState(null);
  
  const printRef = useRef();

  // Print handler using react-to-print
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: lastBill?.invoiceNo || 'Invoice',
    onAfterPrint: () => {
      setInvoiceModalOpen(false);
      clearCart();
    }
  });

  // Handle Electron Thermal Print if available
  const handleElectronPrint = async () => {
    if (window.electronAPI?.printer) {
      try {
        const html = printRef.current.innerHTML;
        const res = await window.electronAPI.printer.printThermal({ html });
        if (res.success) {
          toast.success('Printed successfully');
          setInvoiceModalOpen(false);
          clearCart();
        } else {
          toast.error('Print failed: ' + res.error);
        }
      } catch (err) {
        console.error('Electron print error:', err);
        handlePrint(); // fallback
      }
    } else {
      handlePrint(); // fallback to browser print
    }
  };

  const handleSavePDF = async () => {
    if (!printRef.current) return;
    setLoading(true);
    try {
      // Temporarily display block to capture canvas
      const wrapper = printRef.current.parentElement;
      const originalDisplay = wrapper.style.display;
      wrapper.style.display = 'block';
      
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true });
      wrapper.style.display = originalDisplay;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${lastBill?.invoiceNo || 'Invoice'}.pdf`);
      toast.success('PDF Saved Successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F9') {
        e.preventDefault();
        clearCart();
        toast('New Bill Started', { icon: '🔄' });
      }
      if (e.key === 'F8') {
        e.preventDefault();
        if (cartItems.length > 0) {
          setIsHold(!isHold);
          toast.success(isHold ? 'Bill un-held' : 'Bill on hold');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearCart, cartItems.length, isHold, setIsHold]);

  // Submit Bill
  const handleGenerateInvoice = async () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    const amountPaid = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const balance = amountPaid - totals.grandTotal;

    if (amountPaid < totals.grandTotal && (!customer || payments[0]?.mode !== 'Credit')) {
      toast.error('Payment amount is less than Grand Total. Select Credit mode or add Customer.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customerId: customer?._id,
        customerName: customer?.name || 'Walk-in Customer',
        customerPhone: customer?.phone || '',
        items: cartItems.map(i => ({
          productId: i.product,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discountPercent: i.discountPercent,
          gstRate: i.gstRate,
        })),
        payments: payments.map(p => ({
          mode: p.mode,
          amount: p.mode === 'Credit' ? 0 : (balance > 0 && p.mode === 'Cash' ? p.amount - balance : p.amount),
          reference: p.reference
        })),
        roundOff: totals.roundOff,
        notes: ''
      };

      const res = await api.post('/bills', payload);
      setLastBill(res.data);
      toast.success('Bill generated successfully!');
      setInvoiceModalOpen(true);
      
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to generate bill');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col p-4 bg-background gap-4 overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-xl font-bold text-content flex items-center gap-2">
          <Printer className="h-6 w-6 text-primary-500" />
          POS Billing {isHold && <span className="text-amber-500 text-sm bg-amber-500/10 px-2 py-0.5 rounded ml-2">HOLD</span>}
        </h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setIsHold(!isHold)} disabled={cartItems.length === 0}>
            <Hand className="h-4 w-4 mr-2" /> Hold (F8)
          </Button>
          <Button variant="danger" size="sm" onClick={clearCart}>
            <RefreshCw className="h-4 w-4 mr-2" /> Clear (F9)
          </Button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="flex-1 flex gap-4 min-h-0">
        
        {/* LEFT COLUMN: Cart Table & Totals */}
        <div className="flex-[6] flex flex-col gap-4 min-h-0">
          <CartTable 
            items={cartItems}
            onUpdateQty={updateQuantity}
            onUpdateDiscount={updateDiscount}
            onRemove={removeItem}
          />

          {/* Cart Summary */}
          <div className="shrink-0 bg-surface border border-divider rounded-xl p-4 grid grid-cols-4 gap-4">
            <div>
              <p className="text-content-muted text-sm">Subtotal</p>
              <p className="text-lg font-semibold text-content">{formatCurrency(totals.subtotal)}</p>
            </div>
            <div>
              <p className="text-content-muted text-sm">Discount</p>
              <p className="text-lg font-semibold text-red-400">-{formatCurrency(totals.discount)}</p>
            </div>
            <div>
              <p className="text-content-muted text-sm">Total GST</p>
              <p className="text-lg font-semibold text-content">{formatCurrency(totals.gst)}</p>
            </div>
            <div>
              <p className="text-content-muted text-sm">Items</p>
              <p className="text-lg font-semibold text-content">{cartItems.length}</p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Search, Customer, Payment */}
        <div className="flex-[4] flex flex-col gap-4 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
          {/* Customer Search */}
          <div className="shrink-0">
            <CustomerSearchPanel customer={customer} setCustomer={setCustomer} />
          </div>

          {/* Product Search */}
          <div className="flex-1 min-h-[150px] shrink-0">
            <ProductSearchPanel onSelect={addItem} />
          </div>

          {/* Payment Panel */}
          <div className="shrink-0">
            <PaymentPanel 
              grandTotal={totals.grandTotal}
              payments={payments}
              setPayments={setPayments}
              customer={customer}
              roundOff={totals.roundOff}
              setRoundOff={setRoundOff}
            />
          </div>

          {/* Generate Action */}
          <Button 
            size="lg" 
            variant="primary" 
            className="w-full text-lg shadow-[0_0_20px_rgba(34,197,94,0.3)] h-16"
            onClick={handleGenerateInvoice}
            disabled={cartItems.length === 0 || loading || isHold}
            icon={loading ? null : Save}
          >
            {loading ? 'Generating...' : 'GENERATE INVOICE (Enter)'}
          </Button>
        </div>
      </div>

      {/* Invoice Print Modal */}
      <Modal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        title="Invoice Generated"
        size="md"
        closeOnBackdrop={false}
      >
        <div className="flex flex-col h-full">
          <div className="text-center p-2 shrink-0">
            <h3 className="text-xl font-bold text-content">{lastBill?.invoiceNo}</h3>
            <p className="text-emerald-400 text-sm mb-2">Bill has been saved successfully.</p>
          </div>
          
          {/* Visible Print Template Preview */}
          <div className="flex-1 overflow-y-auto bg-slate-200 rounded-lg flex justify-center p-4 min-h-[400px]">
            <div className="shadow-2xl">
              <InvoicePrint ref={printRef} bill={lastBill} />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
            <Button variant="secondary" onClick={() => {
              setInvoiceModalOpen(false);
              clearCart();
            }}>
              New Bill
            </Button>
            <Button variant="outline" onClick={handleSavePDF} icon={FileText}>
              Save PDF
            </Button>
            <Button variant="primary" onClick={handleElectronPrint} icon={Printer}>
              Print Receipt
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default POS;

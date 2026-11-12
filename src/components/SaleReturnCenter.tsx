import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  Search,
  ScanBarcode,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  CreditCard,
  Banknote,
  Clock,
  Printer,
  History,
  ArrowRight,
  ShieldAlert,
  X,
  FileText,
  Package,
} from 'lucide-react';
import { Product, SaleTransaction, SaleReturn, SaleReturnItem, Customer } from '../types/pos';
import { formatRs } from '../data/defaultProducts';
import { WaqasBrandingCard } from './WaqasBrandingCard';
import { FullScreenPageHeader } from './FullScreenPageHeader';

interface SaleReturnCenterProps {
  products: Product[];
  transactions: SaleTransaction[];
  saleReturns: SaleReturn[];
  customers: Customer[];
  onConfirmReturn: (returnRecord: SaleReturn) => void;
  onOpenScanner: () => void;
  onSwitchMode?: (mode: 'sale' | 'purchase' | 'return') => void;
  onBackToHome?: () => void;
}

export const SaleReturnCenter: React.FC<SaleReturnCenterProps> = ({
  products,
  transactions,
  saleReturns,
  customers,
  onConfirmReturn,
  onOpenScanner,
  onSwitchMode,
  onBackToHome,
}) => {
  // Navigation inside Return Center: 'new' | 'history'
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');

  // Search invoice state
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<SaleTransaction | null>(null);

  // Return items form state: productId -> { returnQty, condition, reason }
  const [returnDrafts, setReturnDrafts] = useState<
    Record<
      string,
      {
        returnQty: number;
        condition: 'resaleable' | 'damaged';
        reason: string;
      }
    >
  >({});

  // Refund method
  const [refundMethod, setRefundMethod] = useState<'cash' | 'card' | 'credit'>('cash');
  const [generalReason, setGeneralReason] = useState<string>('Customer Changed Mind');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmationModalOpen, setConfirmationModalOpen] = useState<boolean>(false);

  // Receipt modal state
  const [printedReturn, setPrintedReturn] = useState<SaleReturn | null>(null);

  // History search state
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  // Calculate previously returned quantities for an invoice
  const getAlreadyReturnedQty = (invoiceNo: string, productId: string): number => {
    return saleReturns
      .filter((r) => r.originalInvoiceNumber === invoiceNo)
      .reduce((sum, r) => {
        const item = r.items.find((i) => i.productId === productId);
        return sum + (item ? item.quantity : 0);
      }, 0);
  };

  // Filter transactions for invoice search
  const matchedInvoices = useMemo(() => {
    const q = invoiceSearchQuery.toLowerCase().trim();
    if (!q) return transactions.slice(0, 10);
    return transactions.filter(
      (tx) =>
        tx.invoiceNumber.toLowerCase().includes(q) ||
        (tx.customerName && tx.customerName.toLowerCase().includes(q)) ||
        (tx.customerPhone && tx.customerPhone.includes(q))
    );
  }, [transactions, invoiceSearchQuery]);

  // Select an invoice to return
  const handleSelectInvoice = (tx: SaleTransaction) => {
    setSelectedInvoice(tx);
    // Initialize return draft with 0 return quantities
    const initial: Record<string, { returnQty: number; condition: 'resaleable' | 'damaged'; reason: string }> = {};
    tx.items.forEach((item) => {
      initial[item.product.id] = {
        returnQty: 0,
        condition: 'resaleable',
        reason: 'Customer Changed Mind',
      };
    });
    setReturnDrafts(initial);

    // Set refund method to original payment method default
    if (tx.paymentMethod === 'credit') {
      setRefundMethod('credit');
    } else if (tx.paymentMethod === 'card') {
      setRefundMethod('card');
    } else {
      setRefundMethod('cash');
    }
  };

  // Update return draft quantity
  const handleUpdateDraftQty = (productId: string, qty: number, maxReturnable: number) => {
    const validQty = Math.max(0, Math.min(qty, maxReturnable));
    setReturnDrafts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        returnQty: validQty,
      },
    }));
  };

  // Update return draft condition
  const handleUpdateDraftCondition = (productId: string, condition: 'resaleable' | 'damaged') => {
    setReturnDrafts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        condition,
      },
    }));
  };

  // Calculated items to be returned
  const itemsToReturn: SaleReturnItem[] = useMemo(() => {
    if (!selectedInvoice) return [];
    const list: SaleReturnItem[] = [];

    selectedInvoice.items.forEach((item) => {
      const draft = returnDrafts[item.product.id];
      if (draft && draft.returnQty > 0) {
        list.push({
          productId: item.product.id,
          productName: item.product.name,
          barcode: item.product.barcode,
          quantity: draft.returnQty,
          unitPrice: item.unitPrice,
          total: draft.returnQty * item.unitPrice,
          condition: draft.condition,
          reason: draft.reason,
        });
      }
    });

    return list;
  }, [selectedInvoice, returnDrafts]);

  // Total refund calculation
  const totalRefundAmount = useMemo(() => {
    return itemsToReturn.reduce((sum, item) => sum + item.total, 0);
  }, [itemsToReturn]);

  // Finalize Return Execution
  const handleExecuteReturn = () => {
    if (!selectedInvoice || itemsToReturn.length === 0 || isSubmitting) return;

    setIsSubmitting(true);

    const returnNumber = `RET-${Date.now().toString().slice(-6)}`;
    const now = new Date();

    const returnRecord: SaleReturn = {
      id: `return-${Date.now()}`,
      returnNumber,
      originalInvoiceNumber: selectedInvoice.invoiceNumber,
      originalInvoiceId: selectedInvoice.invoiceNumber,
      date: now.toLocaleDateString('en-GB'), // DD/MM/YYYY
      dateTime: now.toLocaleString('en-PK', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      customerId: selectedInvoice.customerName ? selectedInvoice.customerName : undefined,
      customerName: selectedInvoice.customerName || 'Walk-in Customer',
      items: itemsToReturn,
      totalRefund: totalRefundAmount,
      refundMethod,
      reason: generalReason,
      cashierName: 'Counter 01 / کاؤنٹر ۱',
      createdAt: now.toISOString(),
    };

    onConfirmReturn(returnRecord);

    setPrintedReturn(returnRecord);
    setConfirmationModalOpen(false);
    setSelectedInvoice(null);
    setReturnDrafts({});
    setIsSubmitting(false);
  };

  // History filtered
  const filteredHistory = useMemo(() => {
    const q = historySearchQuery.toLowerCase().trim();
    if (!q) return saleReturns;
    return saleReturns.filter(
      (r) =>
        r.returnNumber.toLowerCase().includes(q) ||
        r.originalInvoiceNumber.toLowerCase().includes(q) ||
        (r.customerName && r.customerName.toLowerCase().includes(q))
    );
  }, [saleReturns, historySearchQuery]);

  return (
    <div className="flex-1 min-h-full w-full bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      <FullScreenPageHeader
        title="Sale Return & Restocking"
        subtitle="سیل واپسی، ریفنڈ اور ری اسٹاکنگ سینٹر"
        icon={<RotateCcw className="w-5 h-5 text-amber-600" />}
        onBackToHome={onBackToHome}
        accentColor="amber"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('new')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'new'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Process Return
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>History ({saleReturns.length})</span>
            </button>
          </div>
        }
      />

      <div className="flex-1 min-h-0 flex flex-col p-3 sm:p-5 lg:p-6 w-full space-y-4 overflow-y-auto">
        {/* Global Dual Profile Cards */}
        <div className="w-full">
          <WaqasBrandingCard variant="banner" />
        </div>

      {/* Return Mode Banner */}
      <div className="mx-4 mt-3 max-w-5xl lg:mx-auto lg:w-full">
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 rounded-2xl p-4 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <RotateCcw className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">SALE RETURN & RESTOCKING</h2>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider">
                  سیل واپسی
                </span>
              </div>
              <p className="text-xs text-amber-100">
                Process customer returns, issue cash/card/ledger refunds, and automatically restock sellable inventory.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('new')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'new'
                  ? 'bg-white text-amber-900 shadow-xs'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Process Return
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-white text-amber-900 shadow-xs'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Return History ({saleReturns.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: PROCESS NEW RETURN                                      */}
      {/* ============================================================== */}
      {activeTab === 'new' && (
        <div className="mx-4 mt-3 max-w-5xl lg:mx-auto lg:w-full space-y-4">
          {/* STEP 1: SELECT ORIGINAL INVOICE */}
          {!selectedInvoice ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-black text-slate-800 text-sm sm:text-base flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-amber-600" />
                    <span>Step 1: Select Original Sales Invoice (اصلی بل منتخب کریں)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Search sales by Invoice Number (e.g., WM-398597), customer name, or scan barcode to load items.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onOpenScanner}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                >
                  <ScanBarcode className="w-4 h-4" />
                  <span>Scan Receipt Barcode</span>
                </button>
              </div>

              {/* Invoice Search Bar */}
              <div className="relative mb-4">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search invoice number, customer name, or mobile phone..."
                  value={invoiceSearchQuery}
                  onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              {/* List of Invoices */}
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {matchedInvoices.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-slate-600">No matching sales invoice found</p>
                    <p className="text-[11px] text-slate-400">
                      Process a sale in Sale POS first to create returnable invoices.
                    </p>
                  </div>
                ) : (
                  matchedInvoices.map((tx) => (
                    <div
                      key={tx.invoiceNumber}
                      onClick={() => handleSelectInvoice(tx)}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-black text-xs">
                          WM
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 group-hover:text-amber-700">
                              #{tx.invoiceNumber}
                            </span>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {tx.paymentMethod}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{tx.dateTime}</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              <span>{tx.customerName || 'Walk-in Customer'}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            {tx.items.length} Sold Items
                          </span>
                          <span className="text-sm font-black text-slate-900">
                            {formatRs(tx.grandTotal)}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="px-3.5 py-1.5 bg-amber-600 group-hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs"
                        >
                          <span>Select</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* STEP 2: SELECT ITEMS TO RETURN & CONFIGURE REFUND */
            <div className="space-y-4">
              {/* Selected Invoice Header */}
              <div className="bg-white rounded-2xl border border-amber-300 shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/20">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                      Selected Sale Invoice:
                    </span>
                    <span className="text-base font-black text-slate-900">
                      #{selectedInvoice.invoiceNumber}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold uppercase">
                      {selectedInvoice.paymentMethod} Sale
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Date: <strong>{selectedInvoice.dateTime}</strong> | Customer:{' '}
                    <strong>{selectedInvoice.customerName || 'Counter Cash'}</strong> | Original Total:{' '}
                    <strong>{formatRs(selectedInvoice.grandTotal)}</strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedInvoice(null);
                    setReturnDrafts({});
                  }}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-white text-slate-700 rounded-xl text-xs font-bold self-start sm:self-auto cursor-pointer"
                >
                  Change Invoice
                </button>
              </div>

              {/* Items Return Table */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-sm">
                    Select Quantities & Condition to Return
                  </h4>
                  <span className="text-xs text-slate-500">
                    Resaleable items will be automatically restocked into inventory.
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-xs">
                        <th className="py-3 px-3">Product</th>
                        <th className="py-3 px-3 text-center">Sold Qty</th>
                        <th className="py-3 px-3 text-center">Already Returned</th>
                        <th className="py-3 px-3 text-center">Returnable Qty</th>
                        <th className="py-3 px-3 text-center">Return Qty</th>
                        <th className="py-3 px-3 text-center">Condition</th>
                        <th className="py-3 px-3 text-right">Unit Price</th>
                        <th className="py-3 px-3 text-right">Refund Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedInvoice.items.map((item) => {
                        const alreadyReturned = getAlreadyReturnedQty(
                          selectedInvoice.invoiceNumber,
                          item.product.id
                        );
                        const maxReturnable = Math.max(0, item.quantity - alreadyReturned);
                        const draft = returnDrafts[item.product.id] || {
                          returnQty: 0,
                          condition: 'resaleable',
                          reason: 'Customer Changed Mind',
                        };
                        const lineRefund = draft.returnQty * item.unitPrice;

                        return (
                          <tr
                            key={item.id}
                            className={`transition-colors ${
                              draft.returnQty > 0 ? 'bg-amber-50/50' : 'hover:bg-slate-50/80'
                            }`}
                          >
                            {/* Product */}
                            <td className="py-3 px-3">
                              <span className="font-bold text-slate-900 block">{item.product.name}</span>
                              <span className="text-[11px] font-mono text-slate-400">
                                {item.product.barcode}
                              </span>
                            </td>

                            {/* Sold Qty */}
                            <td className="py-3 px-3 text-center font-bold text-slate-700">
                              {item.quantity}
                            </td>

                            {/* Already Returned */}
                            <td className="py-3 px-3 text-center text-slate-500">
                              {alreadyReturned > 0 ? (
                                <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                                  {alreadyReturned}
                                </span>
                              ) : (
                                '0'
                              )}
                            </td>

                            {/* Returnable Qty */}
                            <td className="py-3 px-3 text-center font-black text-emerald-700">
                              {maxReturnable}
                            </td>

                            {/* Return Qty Input */}
                            <td className="py-3 px-3 text-center">
                              {maxReturnable <= 0 ? (
                                <span className="text-[10px] font-bold text-slate-400 italic">
                                  Fully Returned
                                </span>
                              ) : (
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateDraftQty(
                                        item.product.id,
                                        draft.returnQty - 1,
                                        maxReturnable
                                      )
                                    }
                                    className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="0"
                                    max={maxReturnable}
                                    value={draft.returnQty}
                                    onChange={(e) =>
                                      handleUpdateDraftQty(
                                        item.product.id,
                                        parseInt(e.target.value) || 0,
                                        maxReturnable
                                      )
                                    }
                                    className="w-12 text-center py-1 font-black text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs sm:text-sm"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateDraftQty(
                                        item.product.id,
                                        draft.returnQty + 1,
                                        maxReturnable
                                      )
                                    }
                                    className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                            </td>

                            {/* Condition */}
                            <td className="py-3 px-3 text-center">
                              <select
                                disabled={draft.returnQty === 0}
                                value={draft.condition}
                                onChange={(e) =>
                                  handleUpdateDraftCondition(
                                    item.product.id,
                                    e.target.value as 'resaleable' | 'damaged'
                                  )
                                }
                                className={`text-xs px-2 py-1 rounded-lg border focus:outline-none ${
                                  draft.condition === 'resaleable'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                                    : 'bg-red-50 text-red-800 border-red-300 font-bold'
                                }`}
                              >
                                <option value="resaleable">Resaleable (درست / ری سیل)</option>
                                <option value="damaged">Damaged (خراب / نان سیل)</option>
                              </select>
                            </td>

                            {/* Unit Price */}
                            <td className="py-3 px-3 text-right font-semibold text-slate-700">
                              {formatRs(item.unitPrice)}
                            </td>

                            {/* Line Total */}
                            <td className="py-3 px-3 text-right font-black text-amber-700">
                              {formatRs(lineRefund)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* STEP 3: REFUND METHOD & REASON SETTLEMENT */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">
                <h4 className="font-bold text-slate-800 text-sm">
                  Refund Method & Reason (ریفنڈ طریقہ کار)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Cash Refund */}
                  <label
                    className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                      refundMethod === 'cash'
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="refundMethod"
                      value="cash"
                      checked={refundMethod === 'cash'}
                      onChange={() => setRefundMethod('cash')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        <Banknote className="w-4 h-4 text-emerald-600" />
                        <span>Cash Refund (نقد واپسی)</span>
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Pay cash directly out of counter cash register
                      </span>
                    </div>
                  </label>

                  {/* Card Refund */}
                  <label
                    className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                      refundMethod === 'card'
                        ? 'border-blue-500 bg-blue-50/50 shadow-xs ring-1 ring-blue-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="refundMethod"
                      value="card"
                      checked={refundMethod === 'card'}
                      onChange={() => setRefundMethod('card')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-blue-600" />
                        <span>Card Refund (کارڈ ریفنڈ)</span>
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Reverse charge through bank card terminal
                      </span>
                    </div>
                  </label>

                  {/* Customer Udhar Credit Adjustment */}
                  <label
                    className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                      refundMethod === 'credit'
                        ? 'border-purple-500 bg-purple-50/50 shadow-xs ring-1 ring-purple-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="refundMethod"
                      value="credit"
                      checked={refundMethod === 'credit'}
                      onChange={() => setRefundMethod('credit')}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-purple-600" />
                        <span>Credit Adjustment (ادھار کھاتے سے کٹوتی)</span>
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Deducts balance from customer's Udhar ledger
                      </span>
                    </div>
                  </label>
                </div>

                {/* Return Reason Dropdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Return Reason (واپسی کی وجہ)
                    </label>
                    <select
                      value={generalReason}
                      onChange={(e) => setGeneralReason(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    >
                      <option value="Customer Changed Mind">Customer Changed Mind (گاہک کی مرضی)</option>
                      <option value="Defective / Damaged">Defective / Damaged (ناقص یا خراب مال)</option>
                      <option value="Wrong Item Purchased">Wrong Item Purchased (غلط چیز خریدی گئی)</option>
                      <option value="Expired Date">Expired Date (ایکسپائر ہوچکی)</option>
                      <option value="Overcharged Bill">Overcharged Bill (بل میں غلطی)</option>
                      <option value="Other">Other Reason (دیگر وجوہات)</option>
                    </select>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex flex-col justify-center">
                    <span className="text-[11px] font-bold text-amber-800 uppercase">
                      Total Refund to Pay Customer:
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-amber-900 leading-tight">
                      {formatRs(totalRefundAmount)}
                    </span>
                  </div>
                </div>

                {/* Confirm Action Button */}
                <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedInvoice(null);
                      setReturnDrafts({});
                    }}
                    className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={itemsToReturn.length === 0 || totalRefundAmount <= 0 || isSubmitting}
                    onClick={() => setConfirmationModalOpen(true)}
                    className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all ${
                      itemsToReturn.length > 0 && totalRefundAmount > 0 && !isSubmitting
                        ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer active:scale-95'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Sale Return & Restock ({itemsToReturn.length} items)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: RETURN HISTORY                                          */}
      {/* ============================================================== */}
      {activeTab === 'history' && (
        <div className="mx-4 mt-3 max-w-5xl lg:mx-auto lg:w-full space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-black text-slate-800 text-sm sm:text-base flex items-center gap-2">
                  <History className="w-5 h-5 text-amber-600" />
                  <span>Completed Sale Returns Audit Trail (واپسی ریکارڈ)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  View all processed returns, restocking status, and reprint return receipts.
                </p>
              </div>

              {/* History Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search return #, invoice #..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
            </div>

            <div className="space-y-3">
              {filteredHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <RotateCcw className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-600 text-sm">No return records found</p>
                  <p className="text-xs text-slate-400">
                    Process a return above to see the audit trail here.
                  </p>
                </div>
              ) : (
                filteredHistory.map((ret) => (
                  <div
                    key={ret.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-amber-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-amber-700">
                          #{ret.returnNumber}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          (Orig: #{ret.originalInvoiceNumber})
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {ret.refundMethod} Refund
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>{ret.dateTime}</span>
                        <span>•</span>
                        <span>Customer: <strong>{ret.customerName}</strong></span>
                        <span>•</span>
                        <span>Reason: <strong>{ret.reason}</strong></span>
                      </div>

                      {/* Items badge preview */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {ret.items.map((it, idx) => (
                          <span
                            key={idx}
                            className={`text-[11px] px-2 py-0.5 rounded-md font-medium border ${
                              it.condition === 'resaleable'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-red-50 text-red-800 border-red-200'
                            }`}
                          >
                            {it.productName} ({it.quantity}x) — {it.condition === 'resaleable' ? 'Restocked' : 'Damaged'}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Refund Paid
                        </span>
                        <span className="text-base font-black text-amber-700">
                          {formatRs(ret.totalRefund)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setPrintedReturn(ret)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Reprint Return Receipt"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* CONFIRMATION SAFETY MODAL (PREVENTS DUPLICATES)                 */}
      {/* ============================================================== */}
      {confirmationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-3 text-amber-700">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-base text-slate-900">Confirm Sale Return?</h4>
                <p className="text-xs text-slate-500">
                  Please verify return details before final processing.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Original Invoice:</span>
                <span className="font-bold text-slate-900">#{selectedInvoice?.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-900">{selectedInvoice?.customerName || 'Counter Cash'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Items to Return:</span>
                <span className="font-bold text-slate-900">{itemsToReturn.length} distinct item(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Restock to Inventory:</span>
                <span className="font-bold text-emerald-700">
                  {itemsToReturn.filter((i) => i.condition === 'resaleable').reduce((s, i) => s + i.quantity, 0)} units
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Refund Method:</span>
                <span className="font-bold uppercase text-slate-900">{refundMethod}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 text-sm">
                <span className="font-bold text-slate-700">Total Refund Amount:</span>
                <span className="font-black text-amber-700">{formatRs(totalRefundAmount)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setConfirmationModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleExecuteReturn}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Processing...' : 'Authorize & Complete Return'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PRINTABLE THERMAL RETURN RECEIPT MODAL                         */}
      {/* ============================================================== */}
      {printedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col">
            <div className="bg-amber-600 px-4 py-3 text-white flex items-center justify-between print:hidden">
              <span className="font-bold text-sm">Sale Return Receipt</span>
              <button
                onClick={() => setPrintedReturn(null)}
                className="p-1 hover:bg-white/20 rounded-lg text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thermal Receipt Paper */}
            <div className="p-5 font-mono text-xs text-slate-900 bg-white space-y-3">
              <div className="text-center border-b border-dashed border-slate-300 pb-2">
                <h3 className="font-black text-base tracking-tight uppercase">WAQAS MART</h3>
                <p className="text-[10px] text-slate-500">Supermarket & Departmental Store</p>
                <div className="inline-block px-2 py-0.5 bg-amber-100 text-amber-900 font-bold rounded-md text-[10px] uppercase mt-1">
                  OFFICIAL RETURN MEMO
                </div>
              </div>

              <div className="text-[11px] space-y-0.5 border-b border-dashed border-slate-300 pb-2">
                <div className="flex justify-between">
                  <span>Return Memo #:</span>
                  <strong className="font-bold">{printedReturn.returnNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Orig Invoice #:</span>
                  <span>{printedReturn.originalInvoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date & Time:</span>
                  <span>{printedReturn.dateTime}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{printedReturn.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cashier:</span>
                  <span>{printedReturn.cashierName}</span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-2 text-[11px]">
                <div className="flex justify-between font-bold text-slate-600 pb-1 border-b border-slate-200">
                  <span>Item</span>
                  <span>Qty x Rate</span>
                  <span>Total</span>
                </div>
                {printedReturn.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <div>
                      <span className="font-bold block">{it.productName}</span>
                      <span className="text-[10px] text-slate-500">
                        ({it.condition === 'resaleable' ? 'Restocked' : 'Damaged / Defect'})
                      </span>
                    </div>
                    <div className="text-right">
                      <span>{it.quantity} x {it.unitPrice}</span>
                      <strong className="block font-bold">{formatRs(it.total)}</strong>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-black text-sm pt-1">
                  <span>TOTAL REFUND:</span>
                  <span className="text-amber-700">{formatRs(printedReturn.totalRefund)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Refund Method:</span>
                  <span className="font-bold uppercase">{printedReturn.refundMethod}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Reason:</span>
                  <span className="italic">{printedReturn.reason}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-500 space-y-1">
                <p>Thank you for shopping at WAQAS MART!</p>
                <p className="font-urdu">گاہک کے اطمینان کی مکمل ضمانت</p>
              </div>
            </div>

            {/* Print & Close Buttons */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 print:hidden">
              <button
                type="button"
                onClick={() => setPrintedReturn(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Return Bill</span>
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  Undo,
  Plus,
  Search,
  Filter,
  Calendar,
  FileText,
  Printer,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  Truck,
  Package,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import {
  PurchaseReturn,
  PurchaseReturnItem,
  PurchaseTransaction,
  Supplier,
  Product,
} from '../types/pos';
import { formatRs } from '../data/defaultProducts';
import { WaqasDualProfileCards } from './WaqasDualProfileCards';
import { FullScreenPageHeader } from './FullScreenPageHeader';

interface PurchaseReturnsPageProps {
  purchaseReturns: PurchaseReturn[];
  purchases: PurchaseTransaction[];
  suppliers: Supplier[];
  products: Product[];
  onSavePurchaseReturn: (ret: PurchaseReturn) => void;
  onDeletePurchaseReturn: (returnId: string) => void;
  onDeleteAllReturns?: () => void;
  onBackToHome?: () => void;
}

export const PurchaseReturnsPage: React.FC<PurchaseReturnsPageProps> = ({
  purchaseReturns,
  purchases,
  suppliers,
  products,
  onSavePurchaseReturn,
  onDeletePurchaseReturn,
  onDeleteAllReturns,
  onBackToHome,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewReturnModalOpen, setIsNewReturnModalOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Return Creation Form State
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string>('');
  const [selectedItemsToReturn, setSelectedItemsToReturn] = useState<
    Record<string, { quantity: number; reason: string }>
  >({});
  const [refundType, setRefundType] = useState<'reduce_payable' | 'cash_refund'>('reduce_payable');
  const [returnNotes, setReturnNotes] = useState('');

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const selectedPurchase = useMemo(() => {
    return purchases.find((p) => p.id === selectedPurchaseId) || null;
  }, [selectedPurchaseId, purchases]);

  // Total calculated refund for the return draft
  const draftTotalRefund = useMemo(() => {
    if (!selectedPurchase) return 0;
    let sum = 0;
    selectedPurchase.items.forEach((item) => {
      const draft = selectedItemsToReturn[item.productId];
      if (draft && draft.quantity > 0) {
        sum += draft.quantity * (item.purchaseCost || 0);
      }
    });
    return sum;
  }, [selectedPurchase, selectedItemsToReturn]);

  // Open modal
  const handleOpenNewReturn = () => {
    setSelectedPurchaseId(purchases.length > 0 ? purchases[0].id : '');
    setSelectedItemsToReturn({});
    setRefundType('reduce_payable');
    setReturnNotes('');
    setIsNewReturnModalOpen(true);
  };

  // Submit Purchase Return
  const handleSubmitReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPurchase) {
      alert('Please select a purchase invoice to return.');
      return;
    }

    const itemsToSave: PurchaseReturnItem[] = [];

    for (const it of selectedPurchase.items) {
      const draft = selectedItemsToReturn[it.productId];
      if (draft && draft.quantity > 0) {
        // Enforce: cannot return more than purchased quantity
        if (draft.quantity > it.quantity) {
          alert(
            `Error: Cannot return ${draft.quantity} units for "${it.productName}". Max purchased quantity was ${it.quantity}.`
          );
          return;
        }

        itemsToSave.push({
          productId: it.productId,
          productName: it.productName,
          barcode: it.barcode,
          quantity: draft.quantity,
          purchasePrice: it.purchaseCost,
          lineTotal: draft.quantity * it.purchaseCost,
          reason: draft.reason || 'Defective / Excess Stock',
        });
      }
    }

    if (itemsToSave.length === 0) {
      alert('Please enter a return quantity for at least one product.');
      return;
    }

    const returnNumber = `PR-${Date.now().toString().slice(-6)}`;
    const newReturn: PurchaseReturn = {
      id: `pret-${Date.now()}`,
      returnNumber,
      originalInvoiceNumber: selectedPurchase.purchaseInvoiceNo,
      originalPurchaseId: selectedPurchase.id,
      supplierId: selectedPurchase.supplierId,
      supplierName: selectedPurchase.supplierName,
      date: new Date().toLocaleDateString('en-GB'),
      items: itemsToSave,
      totalRefund: draftTotalRefund,
      refundType,
      notes: returnNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onSavePurchaseReturn(newReturn);
    setIsNewReturnModalOpen(false);
    showToast(`Purchase Return #${returnNumber} recorded! Stock and supplier ledger updated.`);
  };

  const filteredReturns = useMemo(() => {
    if (!searchQuery.trim()) return purchaseReturns;
    const q = searchQuery.toLowerCase().trim();
    return purchaseReturns.filter(
      (r) =>
        r.returnNumber.toLowerCase().includes(q) ||
        r.originalInvoiceNumber.toLowerCase().includes(q) ||
        r.supplierName.toLowerCase().includes(q)
    );
  }, [purchaseReturns, searchQuery]);

  return (
    <div className="flex-1 min-h-full w-full bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
      <FullScreenPageHeader
        title="Purchase Returns & Reversals"
        subtitle="سپلائر کو خریداری واپسی، انوینٹری ایڈجسٹمنٹ اور لیجر بیلنس میں کمی"
        icon={<Undo className="w-5 h-5 text-indigo-600" />}
        onBackToHome={onBackToHome}
        accentColor="indigo"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Returns</span>
            </button>
            <button
              onClick={handleOpenNewReturn}
              disabled={purchases.length === 0}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all ${
                purchases.length > 0
                  ? 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Record Return (نیا واپسی اندراج)</span>
            </button>
          </div>
        }
      />

      <div className="flex-1 min-h-0 flex flex-col p-3 sm:p-5 lg:p-6 w-full space-y-4 overflow-y-auto">
        {/* Toast Feedback */}
        {feedbackMsg && (
          <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* WAQAS MART Dual Profile Cards */}
        <div className="space-y-2">
          <WaqasDualProfileCards variant="sidebar" />
        </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#4338ca] text-white flex items-center justify-center shadow-xs">
            <Undo className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Purchase Returns (خریداری واپسی)
            </h2>
            <p className="text-xs text-slate-500">
              Return items to suppliers, reverse stock, and reduce supplier payables
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Returns</span>
          </button>

          <button
            onClick={handleOpenNewReturn}
            disabled={purchases.length === 0}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all ${
              purchases.length > 0
                ? 'bg-[#4338ca] hover:bg-indigo-700 active:scale-95 text-white cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            title={purchases.length === 0 ? 'No purchase invoices available to return' : ''}
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ New Purchase Return (نئی واپسی)</span>
          </button>

          {purchaseReturns.length > 0 && onDeleteAllReturns && (
            <button
              onClick={() => {
                if (
                  window.confirm(
                    `Are you sure you want to delete all ${purchaseReturns.length} return records?`
                  )
                ) {
                  onDeleteAllReturns();
                }
              }}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>All Delete ({purchaseReturns.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-indigo-700 block">
            Total Purchase Returns
          </span>
          <span className="text-xl font-black text-indigo-950 tabular-nums">
            {purchaseReturns.length}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Total Refund Value
          </span>
          <span className="text-xl font-black text-slate-900 tabular-nums">
            {formatRs(purchaseReturns.reduce((acc, r) => acc + (r.totalRefund || 0), 0))}
          </span>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-emerald-700 block">
            Stock Units Deducted
          </span>
          <span className="text-xl font-black text-emerald-950 tabular-nums">
            {purchaseReturns.reduce(
              (acc, r) => acc + r.items.reduce((iacc, it) => iacc + it.quantity, 0),
              0
            )}{' '}
            units
          </span>
        </div>
      </div>

      {/* Table of Returns */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search return #, invoice #, supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
            />
          </div>
          <span className="text-xs font-bold text-slate-500">
            {filteredReturns.length} records found
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3.5">Return #</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Orig Invoice #</th>
                <th className="py-3 px-3">Supplier</th>
                <th className="py-3 px-3 text-center">Returned Items</th>
                <th className="py-3 px-3">Refund Mode</th>
                <th className="py-3 px-3.5 text-right font-black text-indigo-950 bg-indigo-50/50">
                  Total Refund
                </th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-slate-400">
                    <Undo className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-700">No purchase returns recorded</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {purchases.length === 0
                        ? 'Record purchase bills first to enable supplier returns.'
                        : 'Click "+ New Purchase Return" to return items to suppliers.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredReturns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3.5 font-bold text-indigo-700 font-mono">
                      {ret.returnNumber}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600">{ret.date}</td>
                    <td className="py-3 px-3 font-mono text-slate-800 font-semibold">
                      {ret.originalInvoiceNumber}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-900">{ret.supplierName}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {ret.items.length} {ret.items.length === 1 ? 'item' : 'items'} (
                        {ret.items.reduce((acc, it) => acc + it.quantity, 0)} units)
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[10px] font-bold text-slate-600 uppercase">
                      {ret.refundType === 'reduce_payable' ? 'Reduced Payable' : 'Cash Refund'}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-black text-sm text-indigo-700 bg-indigo-50/40">
                      Rs. {ret.totalRefund.toFixed(0)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          if (window.confirm('Delete this purchase return record?')) {
                            onDeletePurchaseReturn(ret.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors"
                        title="Delete Return"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Purchase Return Modal */}
      {isNewReturnModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-xl p-5 sm:p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Undo className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-base">
                  نئی خریداری واپسی درج کریں (New Purchase Return)
                </h3>
              </div>
              <button
                onClick={() => setIsNewReturnModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReturn} className="space-y-4">
              {/* Step 1: Select Original Purchase Invoice */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Select Original Purchase Invoice *
                </label>
                <select
                  value={selectedPurchaseId}
                  onChange={(e) => {
                    setSelectedPurchaseId(e.target.value);
                    setSelectedItemsToReturn({});
                  }}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 outline-none focus:border-indigo-600"
                >
                  {purchases.map((p) => (
                    <option key={p.id} value={p.id}>
                      Invoice #{p.purchaseInvoiceNo} — {p.supplierName} — Total Rs. {p.grandTotal} (
                      {p.purchaseDate})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Select Items and Enter Quantities */}
              {selectedPurchase && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      2. Purchased Items in this Invoice ({selectedPurchase.items.length})
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Enter quantity to return for each item
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-slate-50/50">
                    {selectedPurchase.items.map((item) => {
                      const returnData = selectedItemsToReturn[item.productId] || {
                        quantity: 0,
                        reason: '',
                      };
                      return (
                        <div key={item.productId} className="p-3 text-xs space-y-2 bg-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-bold text-slate-900 block">
                                {item.productName}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Barcode: {item.barcode} • Cost: Rs. {item.purchaseCost} • Purchased Qty:{' '}
                                {item.quantity}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-black text-indigo-700">
                                Rs. {(returnData.quantity * item.purchaseCost).toFixed(0)}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                                Return Qty (Max {item.quantity})
                              </label>
                              <input
                                type="number"
                                min="0"
                                max={item.quantity}
                                value={returnData.quantity || ''}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 0;
                                  setSelectedItemsToReturn((prev) => ({
                                    ...prev,
                                    [item.productId]: {
                                      ...prev[item.productId],
                                      quantity: Math.min(item.quantity, Math.max(0, val)),
                                      reason: prev[item.productId]?.reason || '',
                                    },
                                  }));
                                }}
                                placeholder="0"
                                className="w-full text-xs font-bold px-2 py-1.5 rounded-lg border border-slate-200 bg-white"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                                Return Reason
                              </label>
                              <input
                                type="text"
                                value={returnData.reason || ''}
                                onChange={(e) => {
                                  const r = e.target.value;
                                  setSelectedItemsToReturn((prev) => ({
                                    ...prev,
                                    [item.productId]: {
                                      ...prev[item.productId],
                                      quantity: prev[item.productId]?.quantity || 0,
                                      reason: r,
                                    },
                                  }));
                                }}
                                placeholder="Defective / Expired / Damaged"
                                className="w-full text-xs font-medium px-2 py-1.5 rounded-lg border border-slate-200 bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Refund Method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Refund Adjustment
                  </label>
                  <select
                    value={refundType}
                    onChange={(e) => setRefundType(e.target.value as any)}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200"
                  >
                    <option value="reduce_payable">Reduce Supplier Payable (کھاتے میں کمی)</option>
                    <option value="cash_refund">Cash Refund Received (نقد رقم وصول)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Total Refund Due
                  </label>
                  <div className="px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-xl font-mono font-black text-indigo-900 text-sm">
                    Rs. {draftTotalRefund.toFixed(0)}
                  </div>
                </div>
              </div>

              {/* Step 4: Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Return Notes</label>
                <input
                  type="text"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="e.g. Returned with delivery driver, receipt signed"
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewReturnModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={draftTotalRefund <= 0}
                  className={`px-5 py-2 text-xs font-bold rounded-xl shadow-sm text-white ${
                    draftTotalRefund > 0
                      ? 'bg-[#4338ca] hover:bg-indigo-700 cursor-pointer'
                      : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  Confirm Purchase Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

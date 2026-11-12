import React from 'react';
import { Clock, Trash2, ArrowUpRight, X, AlertTriangle, ShoppingCart, User } from 'lucide-react';
import { HeldBill } from '../types/pos';
import { formatRs } from '../data/defaultProducts';

interface HeldBillsModalProps {
  isOpen: boolean;
  heldBills: HeldBill[];
  onClose: () => void;
  onResumeBill: (bill: HeldBill) => void;
  onCancelBill?: (billId: string) => void;
  onDeleteHeldBill?: (billId: string) => void;
  onDeleteAllHeldBills?: () => void;
}

export const HeldBillsModal: React.FC<HeldBillsModalProps> = ({
  isOpen,
  heldBills,
  onClose,
  onResumeBill,
  onCancelBill,
  onDeleteHeldBill,
  onDeleteAllHeldBills,
}) => {
  const [confirmingDeleteId, setConfirmingDeleteId] = React.useState<string | null>(null);
  const [showConfirmDeleteAll, setShowConfirmDeleteAll] = React.useState<boolean>(false);
  const [activeTab, setActiveTab] = React.useState<'ALL' | 'New Sale' | 'Old Sale'>('ALL');

  const handleDelete = (billId: string) => {
    if (onDeleteHeldBill) {
      onDeleteHeldBill(billId);
    } else if (onCancelBill) {
      onCancelBill(billId);
    }
    setConfirmingDeleteId(null);
  };

  const handleExecuteDeleteAll = () => {
    const targetBills = activeTab === 'ALL'
      ? heldBills
      : heldBills.filter((b) => (b.sourcePage || 'Old Sale') === activeTab);

    if (targetBills.length === 0) return;

    if (activeTab === 'ALL' && onDeleteAllHeldBills) {
      onDeleteAllHeldBills();
    } else {
      targetBills.forEach((b) => {
        if (onDeleteHeldBill) onDeleteHeldBill(b.id);
        else if (onCancelBill) onCancelBill(b.id);
      });
    }
    setShowConfirmDeleteAll(false);
  };

  if (!isOpen) return null;

  const filteredBills = heldBills.filter((b) => {
    if (activeTab === 'ALL') return true;
    return (b.sourcePage || 'Old Sale') === activeTab;
  });

  const newSaleCount = heldBills.filter((b) => b.sourcePage === 'New Sale').length;
  const oldSaleCount = heldBills.filter((b) => (b.sourcePage || 'Old Sale') !== 'New Sale').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-600 rounded-lg">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Held Bills / روکے ہوئے بل</h3>
              <p className="text-xs text-slate-300">
                {heldBills.length} {heldBills.length === 1 ? 'bill' : 'bills'} currently parked
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-header Tabs & All Delete */}
        <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              All ({heldBills.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('New Sale')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'New Sale'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200'
              }`}
            >
              New Sale ({newSaleCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('Old Sale')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'Old Sale'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
              }`}
            >
              Old Sale ({oldSaleCount})
            </button>
          </div>

          {filteredBills.length > 0 && (
            showConfirmDeleteAll ? (
              <div className="flex items-center gap-1.5 bg-red-50 p-1 rounded-lg border border-red-200">
                <span className="text-[11px] font-bold text-red-700">Delete all ({filteredBills.length})?</span>
                <button
                  type="button"
                  onClick={handleExecuteDeleteAll}
                  className="px-2 py-0.5 text-xs font-black bg-red-600 hover:bg-red-700 text-white rounded cursor-pointer"
                >
                  Yes, Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmDeleteAll(false)}
                  className="px-1.5 py-0.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirmDeleteAll(true)}
                className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 font-bold px-2.5 py-1 rounded-lg border border-red-200 transition-colors cursor-pointer"
                title="Delete all held bills in this list"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>All Delete ({filteredBills.length})</span>
              </button>
            )
          )}
        </div>

        {/* List of Held Bills */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 bg-slate-50">
          {filteredBills.length === 0 ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                <Clock className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No Held Bills in {activeTab}</p>
              <p className="text-xs text-slate-500 mt-1">کوئی روکا ہوا بل موجود نہیں ہے</p>
              <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                When a customer's items are in the cart, click "Hold Bill" to park it for later.
              </p>
            </div>
          ) : (
            filteredBills.map((bill) => (
              <div
                key={bill.id}
                className={`p-4 bg-white rounded-xl border hover:shadow-md transition-all shadow-xs flex flex-col gap-2.5 ${
                  bill.sourcePage === 'New Sale' ? 'border-blue-200 hover:border-blue-500' : 'border-emerald-200 hover:border-emerald-500'
                }`}
              >
                {/* Top Row: Hold Number & Time & Source Page Badge */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black bg-slate-900 text-white px-2 py-0.5 rounded-md">
                      {bill.holdNumber}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {bill.createdAt}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {bill.sourcePage === 'New Sale' ? (
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
                        New Sale Page
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                        Old Sale Page
                      </span>
                    )}
                  </div>
                </div>

                {/* Customer name if present */}
                {bill.customerName && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Customer: {bill.customerName}</span>
                    {bill.customerPhone && <span className="text-slate-400">({bill.customerPhone})</span>}
                  </div>
                )}

                {/* Items Summary */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span>Items ({bill.totalQty} total units):</span>
                    <span className="text-slate-800 font-bold">{formatRs(bill.grandTotal)}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 line-clamp-2">
                    {bill.items.map((it) => `${it.quantity}x ${it.product.name}`).join(', ')}
                  </div>
                </div>

                {/* Actions or Delete Confirmation */}
                {confirmingDeleteId === bill.id ? (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex flex-col gap-2">
                    <div className="flex items-start gap-2 text-xs text-red-800">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Are you sure you want to permanently delete this held bill?</p>
                        <p className="text-[11px] text-red-600 mt-0.5">
                          کیا آپ واقعی اس روکے ہوئے بل ({bill.holdNumber}) کو مستقل طور پر حذف کرنا چاہتے ہیں؟
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setConfirmingDeleteId(null)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(bill.id)}
                        className="px-3 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded shadow-xs cursor-pointer active:scale-95"
                      >
                        Confirm Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setConfirmingDeleteId(bill.id)}
                      className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-semibold hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Bill (ختم کریں)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onResumeBill(bill)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 ${
                        bill.sourcePage === 'New Sale'
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Reopen in {bill.sourcePage === 'New Sale' ? 'New Sale' : 'Old Sale'}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>Held bills restore into their original source page.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

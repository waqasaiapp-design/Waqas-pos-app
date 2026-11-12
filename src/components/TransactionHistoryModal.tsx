import React from 'react';
import { X, Receipt, Printer, Clock, Search, ArrowRight, User } from 'lucide-react';
import { SaleTransaction } from '../types/pos';
import { formatRs } from '../data/defaultProducts';

interface TransactionHistoryModalProps {
  isOpen: boolean;
  transactions: SaleTransaction[];
  onClose: () => void;
  onViewReceipt: (tx: SaleTransaction) => void;
}

export const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({
  isOpen,
  transactions,
  onClose,
  onViewReceipt,
}) => {
  const [search, setSearch] = React.useState('');

  if (!isOpen) return null;

  const filtered = transactions.filter((tx) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      tx.invoiceNumber.toLowerCase().includes(q) ||
      (tx.customerName && tx.customerName.toLowerCase().includes(q)) ||
      tx.paymentMethod.toLowerCase().includes(q) ||
      tx.items.some((it) => it.product.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-base leading-tight">Sales & Receipt History</h3>
              <p className="text-xs text-slate-300">
                {transactions.length} recorded invoices in local storage
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

        {/* Search */}
        <div className="p-3 border-b border-slate-200 bg-slate-50">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search invoice number, customer, item..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Transactions list */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 bg-slate-50">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-600">No transactions found</p>
              <p className="text-xs text-slate-400 mt-1">کوئی پرانی رسید موجود نہیں ہے</p>
            </div>
          ) : (
            filtered.map((tx) => (
              <div
                key={tx.invoiceNumber}
                onClick={() => onViewReceipt(tx)}
                className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-emerald-500 transition-all shadow-xs flex items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                      {tx.invoiceNumber}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {tx.mode || 'sale'}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {tx.dateTime}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1 truncate">
                    {tx.items.map((it) => `${it.quantity}x ${it.product.name}`).join(', ')}
                  </div>
                  {tx.customerName && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <User className="w-3 h-3" />
                      <span>{tx.customerName}</span>
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-slate-900 block tabular-nums">
                    {formatRs(tx.grandTotal)}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    {tx.paymentMethod}
                  </span>
                </div>

                <div className="p-1 text-slate-300 group-hover:text-emerald-600 transition-colors">
                  <Printer className="w-4 h-4" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

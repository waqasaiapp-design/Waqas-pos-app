import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  FileText,
  Calendar,
  Building2,
  Eye,
  Printer,
  Edit3,
  Trash2,
  Filter,
  CheckCircle2,
  Clock,
  Layers,
  ShoppingBag,
} from 'lucide-react';
import { PurchaseTransaction } from '../types/pos';
import { formatRs } from '../data/defaultProducts';

interface SearchPurchasesModalProps {
  isOpen: boolean;
  purchases: PurchaseTransaction[];
  onClose: () => void;
  onSelectToView: (purchase: PurchaseTransaction) => void;
  onSelectToEdit?: (purchase: PurchaseTransaction) => void;
  onPrintPurchase: (purchase: PurchaseTransaction) => void;
  onDeletePurchase?: (purchaseId: string) => void;
}

export const SearchPurchasesModal: React.FC<SearchPurchasesModalProps> = ({
  isOpen,
  purchases,
  onClose,
  onSelectToView,
  onSelectToEdit,
  onPrintPurchase,
  onDeletePurchase,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState('ALL');
  const [dateFilterStart, setDateFilterStart] = useState('');
  const [dateFilterEnd, setDateFilterEnd] = useState('');
  const [purchaseToDelete, setPurchaseToDelete] = useState<PurchaseTransaction | null>(null);

  // Extract unique suppliers for filter
  const uniqueSuppliers = useMemo(() => {
    const map = new Map<string, string>();
    purchases.forEach((p) => {
      if (p.supplierId && p.supplierName) {
        map.set(p.supplierId, p.supplierName);
      }
    });
    return Array.from(map.entries());
  }, [purchases]);

  if (!isOpen) return null;

  const filtered = purchases.filter((p) => {
    const q = searchTerm.toLowerCase().trim();
    if (q) {
      const matchInv = (p.purchaseInvoiceNo || '').toLowerCase().includes(q);
      const matchRef = (p.refNo || '').toLowerCase().includes(q);
      const matchSup = (p.supplierName || '').toLowerCase().includes(q);
      const matchSupInv = (p.supplierInvoiceNo || '').toLowerCase().includes(q);
      const matchItem = p.items?.some(
        (i) =>
          (i.productName || '').toLowerCase().includes(q) ||
          (i.barcode || '').toLowerCase().includes(q)
      );
      if (!matchInv && !matchRef && !matchSup && !matchSupInv && !matchItem) {
        return false;
      }
    }

    if (selectedSupplierFilter !== 'ALL' && p.supplierId !== selectedSupplierFilter) {
      return false;
    }

    if (dateFilterStart && p.purchaseDate < dateFilterStart) {
      return false;
    }

    if (dateFilterEnd && p.purchaseDate > dateFilterEnd) {
      return false;
    }

    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5 backdrop-blur-xs">
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#071739] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg leading-tight flex items-center gap-2">
                <span>Purchase History / پرچیز لسٹ</span>
                <span className="text-xs bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full border border-teal-400/30 font-bold">
                  {purchases.length} Total
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                All saved purchases across Old & New Purchase Entry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filter Controls */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-3">
          {/* Main Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by Invoice #, Supplier, Supplier Bill #, Item Name or Barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Secondary Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            {/* Supplier Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Supplier Filter
              </label>
              <select
                value={selectedSupplierFilter}
                onChange={(e) => setSelectedSupplierFilter(e.target.value)}
                className="w-full py-1.5 px-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-none"
              >
                <option value="ALL">All Suppliers (تمام سپلائر)</option>
                {uniqueSuppliers.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Start */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                From Date (شروع تاریخ)
              </label>
              <input
                type="date"
                value={dateFilterStart}
                onChange={(e) => setDateFilterStart(e.target.value)}
                className="w-full py-1.5 px-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-none"
              />
            </div>

            {/* Date End */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                To Date (آخری تاریخ)
              </label>
              <input
                type="date"
                value={dateFilterEnd}
                onChange={(e) => setDateFilterEnd(e.target.value)}
                className="w-full py-1.5 px-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-none"
              />
            </div>
          </div>
        </div>

        {/* List of Invoices */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 bg-slate-100/60 divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-base font-bold text-slate-700">No purchase records found</p>
              <p className="text-xs text-slate-400 mt-1">
                کوئی پرچیز انوائس نہیں ملی۔ سرچ فلٹر تبدیل کر کے دیکھیں۔
              </p>
            </div>
          ) : (
            filtered.map((purchase) => {
              const totalItemsCount = purchase.items?.length || 0;
              const totalQty =
                purchase.totalQty ||
                purchase.items?.reduce((sum, it) => sum + (it.quantity || 0), 0) ||
                0;

              return (
                <div
                  key={purchase.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all shadow-xs flex flex-col gap-2.5"
                >
                  {/* Top Bar: Invoice #, Date, Status, Total */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black bg-teal-50 text-teal-800 px-2.5 py-1 rounded-lg border border-teal-200">
                        {purchase.purchaseInvoiceNo}
                      </span>
                      {purchase.status === 'edited' && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                          Edited
                        </span>
                      )}
                      <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        {purchase.purchaseDate}
                      </span>
                      {purchase.paymentMethod && (
                        <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                          {purchase.paymentMethod}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black text-slate-900 tabular-nums">
                        {formatRs(purchase.grandTotal)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Gross: {formatRs(purchase.subtotal || purchase.grossTotal || purchase.grandTotal)}
                      </div>
                    </div>
                  </div>

                  {/* Supplier & Balance Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-800">{purchase.supplierName}</span>
                        {purchase.supplierInvoiceNo && (
                          <span className="text-[11px] text-slate-400 ml-1.5 font-normal">
                            (Bill Ref: {purchase.supplierInvoiceNo})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="sm:text-right text-xs">
                      <span className="text-slate-500 mr-1.5">Paid:</span>
                      <strong className="text-emerald-700 font-black">
                        {formatRs(purchase.amountPaid)}
                      </strong>
                      {purchase.remainingBalance > 0 && (
                        <span className="ml-2 bg-red-50 text-red-700 px-2 py-0.5 rounded font-bold text-[11px]">
                          Due: {formatRs(purchase.remainingBalance)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Items Summary & Counts */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl">
                    <div className="flex items-center gap-1.5 truncate pr-2">
                      <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-bold text-slate-700">{totalItemsCount} Items ({totalQty} Qty):</span>
                      <span className="truncate">
                        {purchase.items?.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                      </span>
                    </div>
                    {purchase.totalDiscount > 0 && (
                      <span className="text-emerald-600 font-bold shrink-0">
                        Disc: {formatRs(purchase.totalDiscount)}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    <div className="text-[10px] text-slate-400 font-mono">
                      Ref: {purchase.refNo || purchase.id}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* View / Open (Read-Only) */}
                      <button
                        onClick={() => {
                          onSelectToView(purchase);
                          onClose();
                        }}
                        className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-200"
                        title="View invoice details in read-only mode"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View (Read-Only)</span>
                      </button>

                      {/* Explicit Edit Button */}
                      {onSelectToEdit && (
                        <button
                          onClick={() => {
                            onSelectToEdit(purchase);
                            onClose();
                          }}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          title="Open invoice and enable editing"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Invoice</span>
                        </button>
                      )}

                      {/* Print Button */}
                      <button
                        onClick={() => {
                          onPrintPurchase(purchase);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Print invoice"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print</span>
                      </button>

                      {/* Delete / Cancel Button */}
                      {onDeletePurchase && (
                        <button
                          onClick={() => setPurchaseToDelete(purchase)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete / Reverse purchase"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-white border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Showing {filtered.length} of {purchases.length} purchases
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
          >
            Close / بند کریں
          </button>
        </div>

        {/* In-UI Confirm Delete Purchase Modal */}
        {purchaseToDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="text-base font-black text-slate-900 text-center">
                Delete Purchase Invoice?
              </h3>
              <p className="text-xs text-slate-600 text-center mt-1 leading-relaxed">
                کیا آپ واقعی پرچیز انوائس <span className="font-bold text-red-600">#{purchaseToDelete.purchaseInvoiceNo}</span> کو منسوخ (Delete) کرنا چاہتے ہیں؟ اس کا اسٹاک اور سپلائر کھاتہ خودکار ریورس ہو جائے گا۔
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPurchaseToDelete(null)}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 cursor-pointer"
                >
                  Cancel / منسوخ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const id = purchaseToDelete.id;
                    setPurchaseToDelete(null);
                    onDeletePurchase?.(id);
                  }}
                  className="py-2.5 px-4 rounded-xl text-xs font-black text-white bg-red-600 hover:bg-red-700 active:scale-95 shadow cursor-pointer"
                >
                  Yes, Delete Purchase
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

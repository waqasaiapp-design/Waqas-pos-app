import React from 'react';
import { X, Printer, Building2, Calendar, ShoppingBag, ArrowLeft } from 'lucide-react';
import { PurchaseTransaction } from '../types/pos';
import { formatRs } from '../data/defaultProducts';

interface PrintPurchaseModalProps {
  isOpen: boolean;
  purchase: PurchaseTransaction | null;
  onClose: () => void;
}

export const PrintPurchaseModal: React.FC<PrintPurchaseModalProps> = ({
  isOpen,
  purchase,
  onClose,
}) => {
  if (!isOpen || !purchase) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm">Purchase Invoice Voucher</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Area */}
        <div className="p-4 bg-slate-50 flex justify-center">
          <div
            id="printable-receipt"
            className="w-full bg-white p-6 rounded-xl shadow-xs border border-slate-200 font-sans text-xs text-slate-900"
          >
            {/* Mart Header */}
            <div className="text-center pb-4 border-b border-slate-300">
              <h2 className="text-lg font-black tracking-wide text-slate-950 font-sans">
                WAQAS MART
              </h2>
              <p className="font-urdu text-sm font-bold text-emerald-800">وقاص مارٹ سپر مارکیٹ</p>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-widest mt-1">
                PURCHASE INVENTORY VOUCHER
              </p>
            </div>

            {/* Voucher Meta */}
            <div className="py-3 border-b border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <p className="text-slate-500">Purchase Invoice #:</p>
                <p className="font-bold font-mono text-xs">{purchase.purchaseInvoiceNo}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500">Date:</p>
                <p className="font-semibold">{purchase.purchaseDate}</p>
              </div>
              <div>
                <p className="text-slate-500">Supplier / Vendor:</p>
                <p className="font-bold text-slate-900">{purchase.supplierName}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500">Supplier Bill Ref #:</p>
                <p className="font-semibold font-mono">{purchase.supplierInvoiceNo || 'N/A'}</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="py-3 border-b border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 text-[10px] text-slate-500 uppercase">
                    <th className="py-1">#</th>
                    <th className="py-1">Item</th>
                    <th className="py-1 text-center">Qty</th>
                    <th className="py-1 text-right">Cost</th>
                    <th className="py-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {purchase.items.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="py-1.5 text-slate-400 font-bold">{idx + 1}</td>
                      <td className="py-1.5 font-medium flex items-center gap-1.5">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="w-5 h-5 rounded object-cover border border-slate-200 shrink-0 inline-block"
                          />
                        ) : null}
                        <span>{item.productName}</span>
                      </td>
                      <td className="py-1.5 text-center font-bold">{item.quantity}</td>
                      <td className="py-1.5 text-right tabular-nums">{formatRs(item.purchaseCost)}</td>
                      <td className="py-1.5 text-right font-bold tabular-nums">{formatRs(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="py-3 border-b border-slate-200 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="tabular-nums font-semibold">{formatRs(purchase.subtotal)}</span>
              </div>
              {purchase.totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Total Discount:</span>
                  <span className="tabular-nums font-semibold">-{formatRs(purchase.totalDiscount)}</span>
                </div>
              )}
              {purchase.totalTax > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Tax:</span>
                  <span className="tabular-nums">{formatRs(purchase.totalTax)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                <span>GRAND TOTAL:</span>
                <span className="tabular-nums">{formatRs(purchase.grandTotal)}</span>
              </div>
            </div>

            {/* Payment status */}
            <div className="py-2.5 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-bold uppercase text-slate-800">{purchase.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-bold text-emerald-700">{formatRs(purchase.amountPaid)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Remaining Due / Payable:</span>
                <span className="font-black text-red-600">{formatRs(purchase.remainingBalance)}</span>
              </div>
              {purchase.notes && (
                <div className="pt-1 text-slate-500 italic">
                  Note: {purchase.notes}
                </div>
              )}
            </div>

            <div className="text-center pt-3 text-[10px] text-slate-400 border-t border-dashed border-slate-200">
              Generated via WAQAS MART POS · Stock reconciled automatically
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="p-3 bg-white border-t border-slate-200 flex justify-between gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>
    </div>
  );
};

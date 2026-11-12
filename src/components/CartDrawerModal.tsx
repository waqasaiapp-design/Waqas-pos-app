import React from 'react';
import { X, Trash2, PlusCircle, MinusCircle, ShoppingBag, PauseCircle, CheckCircle2, Percent } from 'lucide-react';
import { CartItem, POSMode } from '../types/pos';
import { formatRs } from '../data/defaultProducts';

interface CartDrawerModalProps {
  isOpen: boolean;
  mode: POSMode;
  cart: CartItem[];
  subtotal: number;
  discount: number;
  grandTotal: number;
  totalQty: number;
  onClose: () => void;
  onUpdateQty: (itemId: string, newQty: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onHoldBill: () => void;
  onProceedCheckout: () => void;
  onUpdateDiscount: (amt: number) => void;
}

export const CartDrawerModal: React.FC<CartDrawerModalProps> = ({
  isOpen,
  mode,
  cart,
  subtotal,
  discount,
  grandTotal,
  totalQty,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onHoldBill,
  onProceedCheckout,
  onUpdateDiscount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-600 rounded-lg">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Active Cart / موجودہ اشیاء</h3>
              <p className="text-xs text-slate-300">
                {totalQty} {totalQty === 1 ? 'item' : 'items'} · Mode: <span className="uppercase font-semibold text-emerald-400">{mode}</span>
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

        {/* Items List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 bg-slate-50 max-h-[360px] divide-y divide-slate-100">
          {cart.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-600">Cart is empty</p>
              <p className="text-xs text-slate-400 mt-1">ٹوکری میں کوئی آئٹم نہیں ہے</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate">{item.product.name}</h4>
                  <p className="text-xs text-slate-500">
                    {formatRs(item.unitPrice)} each · Stock: {item.product.stock}
                  </p>
                </div>

                {/* Quantity Controller */}
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1">
                  <button
                    onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                    className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded cursor-pointer"
                  >
                    <MinusCircle className="w-4 h-4" />
                  </button>
                  <span className="w-7 text-center font-bold text-xs tabular-nums text-slate-800">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                    disabled={mode === 'sale' && item.quantity >= item.product.stock}
                    className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded cursor-pointer disabled:opacity-30"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>
                </div>

                {/* Line Total */}
                <div className="w-20 text-right">
                  <span className="text-sm font-bold text-slate-900 tabular-nums">
                    {formatRs(item.lineTotal)}
                  </span>
                </div>

                {/* Delete */}
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Pricing Summary */}
        {cart.length > 0 && (
          <div className="p-4 bg-white border-t border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-800 tabular-nums">{formatRs(subtotal)}</span>
            </div>

            {/* Quick Discount */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-emerald-600" />
                <span>Discount (رعایت):</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onUpdateDiscount(0)}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-medium border cursor-pointer ${
                    discount === 0 ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  Rs. 0
                </button>
                <button
                  onClick={() => onUpdateDiscount(50)}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-medium border cursor-pointer ${
                    discount === 50 ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  Rs. 50
                </button>
                <button
                  onClick={() => onUpdateDiscount(100)}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-medium border cursor-pointer ${
                    discount === 100 ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  Rs. 100
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase text-slate-500 block">Total Amount</span>
                <span className="text-xl font-black text-slate-900 tabular-nums">{formatRs(grandTotal)}</span>
              </div>

              {/* Hold Bill & Clear Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onHoldBill}
                  className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <PauseCircle className="w-4 h-4 text-amber-700" />
                  <span>Hold Bill (روکیں)</span>
                </button>

                <button
                  onClick={onProceedCheckout}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Checkout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

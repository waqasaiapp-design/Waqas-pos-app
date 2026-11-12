import React, { useState } from 'react';
import { X, CheckCircle2, Banknote, CreditCard, BookOpen, AlertCircle, ShoppingCart, User, Plus, Users, Search } from 'lucide-react';
import { CartItem, PaymentMethod, POSMode, Customer } from '../types/pos';
import { formatRs } from '../data/defaultProducts';

interface CheckoutModalProps {
  isOpen: boolean;
  mode: POSMode;
  cart: CartItem[];
  subtotal: number;
  discount: number;
  grandTotal: number;
  totalQty: number;
  customers?: Customer[];
  onQuickAddCustomer?: (customer: Customer) => void;
  onClose: () => void;
  onConfirmCheckout: (paymentDetails: {
    method: PaymentMethod;
    cashTendered?: number;
    changeDue?: number;
    cardBank?: string;
    cardRef?: string;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    note?: string;
  }) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  mode,
  cart,
  subtotal,
  discount,
  grandTotal,
  totalQty,
  customers = [],
  onQuickAddCustomer,
  onClose,
  onConfirmCheckout,
}) => {
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [cashTendered, setCashTendered] = useState<number | ''>(grandTotal);
  const [cardBank, setCardBank] = useState('HBL POS Machine');
  const [cardRef, setCardRef] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [creditCashAdvance, setCreditCashAdvance] = useState<number | ''>(0);
  const [showQuickAddCust, setShowQuickAddCust] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setCashTendered(grandTotal);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, grandTotal]);

  if (!isOpen) return null;

  const tenderedNum = typeof cashTendered === 'number' ? cashTendered : 0;
  const changeDue = Math.max(0, tenderedNum - grandTotal);
  const remainingDue = Math.max(0, grandTotal - tenderedNum);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (cart.length === 0 || grandTotal <= 0) {
      setError('Cart is empty or amount is zero.');
      return;
    }

    if (method === 'cash') {
      if (tenderedNum < grandTotal && mode === 'sale') {
        setError(`Tendered cash (${formatRs(tenderedNum)}) is less than total amount (${formatRs(grandTotal)})!`);
        return;
      }
    } else if (method === 'credit') {
      if (!customerName.trim()) {
        setError('Please select or enter a Customer name for Credit / Pay Later sale.');
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    const advanceNum = typeof creditCashAdvance === 'number' ? creditCashAdvance : parseFloat(creditCashAdvance) || 0;

    onConfirmCheckout({
      method,
      cashTendered: method === 'cash' ? (tenderedNum || grandTotal) : method === 'credit' ? advanceNum : undefined,
      changeDue: method === 'cash' ? changeDue : undefined,
      cardBank: method === 'card' ? cardBank : undefined,
      cardRef: method === 'card' ? cardRef : undefined,
      customerId: selectedCustomerId || undefined,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      note: note.trim() || undefined,
    });
  };

  const handleCreateQuickCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      name: newCustName.trim(),
      phone: newCustPhone.trim() || undefined,
      previousBalance: 0,
      createdAt: new Date().toLocaleDateString('en-GB'),
    };

    if (onQuickAddCustomer) {
      onQuickAddCustomer(newCustomer);
    }
    setSelectedCustomerId(newCustomer.id);
    setCustomerName(newCustomer.name);
    setCustomerPhone(newCustomer.phone || '');
    setShowQuickAddCust(false);
    setNewCustName('');
    setNewCustPhone('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-emerald-700 text-white">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            <div>
              <h3 className="font-bold text-base leading-tight">
                {mode === 'purchase' ? 'Confirm Purchase' : mode === 'return' ? 'Process Return' : 'Complete Checkout'}
              </h3>
              <p className="text-xs text-emerald-100">
                {totalQty} items · {formatRs(grandTotal)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-emerald-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Amount Display */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Total Payable</span>
              <span className="text-xs text-emerald-700 font-medium">
                {mode === 'sale' ? 'Sale Invoice' : mode === 'purchase' ? 'Vendor Purchase' : 'Return Refund'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-slate-900 tabular-nums">
                {formatRs(grandTotal)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Payment Method / طریقہ ادائیگی</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMethod('cash')}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer border ${
                  method === 'cash'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Cash (نقد)</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('card')}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer border ${
                  method === 'card'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Card (کارڈ)</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('credit')}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer border ${
                  method === 'credit'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Credit (ادھار)</span>
              </button>
            </div>
          </div>

          {/* Cash Details */}
          {method === 'cash' && (
            <div className="space-y-2.5 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cash Received (وصول شدہ رقم)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-emerald-700">Rs.</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter cash received"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 text-base font-bold tabular-nums border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Note buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[100, 500, 1000, 2000, 5000].map((noteVal) => (
                  <button
                    key={noteVal}
                    type="button"
                    onClick={() => setCashTendered(noteVal)}
                    className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 rounded-lg tabular-nums cursor-pointer transition-colors"
                  >
                    Rs. {noteVal}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCashTendered(grandTotal)}
                  className="px-2.5 py-1 text-xs font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 rounded-lg cursor-pointer transition-colors"
                >
                  Exact
                </button>
              </div>

              {/* Change calculation */}
              {tenderedNum > 0 && (
                <div
                  className={`p-3 rounded-xl flex items-center justify-between text-xs font-bold ${
                    tenderedNum >= grandTotal
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-amber-50 text-amber-900 border border-amber-200'
                  }`}
                >
                  <span>{tenderedNum >= grandTotal ? 'Change Return (واپسی بقایا):' : 'Remaining (باقی رقم):'}</span>
                  <span className="text-base font-black tabular-nums">
                    {tenderedNum >= grandTotal ? formatRs(changeDue) : formatRs(remainingDue)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Card Details */}
          {method === 'card' && (
            <div className="space-y-2.5 pt-1 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Card Terminal / Bank:</label>
                <select
                  value={cardBank}
                  onChange={(e) => setCardBank(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-xs"
                >
                  <option value="HBL POS Machine">HBL POS Machine</option>
                  <option value="Meezan Bank POS">Meezan Bank POS</option>
                  <option value="Bank Alfalah POS">Bank Alfalah POS</option>
                  <option value="Standard POS Terminal">Standard POS Terminal</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Approval Code / Slip Ref #:</label>
                <input
                  type="text"
                  placeholder="e.g. AUTH-928174"
                  value={cardRef}
                  onChange={(e) => setCardRef(e.target.value)}
                  className="w-full px-3 py-2 font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                />
              </div>
            </div>
          )}

          {/* Customer Selection (Enhanced for Credit & Optional for Cash/Card) */}
          <div className="space-y-2 pt-1 text-xs">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Customer (گاہک) {method === 'credit' ? '*' : '(Optional)'}</span>
              </label>

              <button
                type="button"
                onClick={() => setShowQuickAddCust(!showQuickAddCust)}
                className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showQuickAddCust ? 'Hide Form' : '+ New Customer (نیا گاہک)'}</span>
              </button>
            </div>

            {/* Quick Add New Customer Inline Form */}
            {showQuickAddCust && (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                <span className="font-bold text-emerald-900 block">Quick Register Customer:</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Customer Name *"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowQuickAddCust(false)}
                    className="px-2.5 py-1 text-slate-500 hover:bg-slate-100 rounded text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateQuickCustomer}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                  >
                    Save & Select
                  </button>
                </div>
              </div>
            )}

            {/* Customer Dropdown or Manual Input */}
            {customers.length > 0 ? (
              <div className="space-y-1.5">
                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    const cId = e.target.value;
                    setSelectedCustomerId(cId);
                    const match = customers.find((c) => c.id === cId);
                    if (match) {
                      setCustomerName(match.name);
                      setCustomerPhone(match.phone || '');
                    } else {
                      setCustomerName('');
                      setCustomerPhone('');
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-xs cursor-pointer font-medium"
                >
                  <option value="">-- Select Registered Customer (یا منتخب کریں) --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''} - Bal: Rs. {c.previousBalance}
                    </option>
                  ))}
                </select>

                {/* Or Type Manually */}
                <input
                  type="text"
                  placeholder="Or type customer name directly..."
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    setSelectedCustomerId('');
                  }}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <input
                  type="text"
                  required={method === 'credit'}
                  placeholder="e.g. Tariq Mehmood"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                />
              </div>
            )}

            {/* Optional Phone */}
            <input
              type="tel"
              placeholder="Customer Phone (optional): 0300-1234567"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl font-mono text-xs"
            />
          </div>

          {/* Credit Details: Advance Cash & Ledger Notification */}
          {method === 'credit' && (
            <div className="space-y-2 p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs">
              <div className="flex items-center justify-between font-bold text-amber-900">
                <span>Advance Cash Paid (اگر نقد رقم دی):</span>
                <div className="w-28 relative">
                  <span className="absolute left-2 top-1.5 text-[10px] text-amber-700 font-bold">Rs.</span>
                  <input
                    type="number"
                    min="0"
                    max={grandTotal}
                    placeholder="0"
                    value={creditCashAdvance}
                    onChange={(e) => setCreditCashAdvance(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                    className="w-full pl-6 pr-2 py-1 bg-white border border-amber-300 rounded text-right font-mono font-bold text-amber-950 text-xs"
                  />
                </div>
              </div>

              {/* Unpaid amount that will be recorded into Customer Ledger */}
              <div className="pt-1.5 border-t border-amber-200/80 flex items-center justify-between font-bold">
                <span className="text-amber-800">Unpaid Udhar Added to Ledger:</span>
                <span className="font-mono text-base font-black text-red-700">
                  {formatRs(Math.max(0, grandTotal - (Number(creditCashAdvance) || 0)))}
                </span>
              </div>
            </div>
          )}

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Note / تفصیل (Optional):</label>
            <input
              type="text"
              placeholder="e.g. Special order / Regular customer"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Confirm & Generate Receipt ({formatRs(grandTotal)})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

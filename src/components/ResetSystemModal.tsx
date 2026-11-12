import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Download,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Lock,
  FileText,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface ResetSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPerformReset: () => {
    backupFileName: string;
    stats: {
      transactionsCount: number;
      purchasesCount: number;
      customersCount: number;
      productsCount: number;
      heldBillsCount: number;
    };
  };
}

export const ResetSystemModal: React.FC<ResetSystemModalProps> = ({
  isOpen,
  onClose,
  onPerformReset,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [step, setStep] = useState<'confirm' | 'report'>('confirm');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reportData, setReportData] = useState<{
    backupFileName: string;
    stats: {
      transactionsCount: number;
      purchasesCount: number;
      customersCount: number;
      productsCount: number;
      heldBillsCount: number;
    };
  } | null>(null);

  if (!isOpen) return null;

  const handleExecuteReset = (e: React.FormEvent) => {
    e.preventDefault();
    // Default owner PIN is 1234 or 0000 or any 4 digit pin
    const savedPin = localStorage.getItem('wm_app_pin') || '1234';
    if (pinInput !== savedPin && pinInput !== '1234' && pinInput !== '0000') {
      sounds.playErrorTone();
      setErrorMsg('Incorrect PIN! Default owner PIN is 1234. (غلط پن کوڈ درج کیا گیا ہے)');
      return;
    }

    try {
      const result = onPerformReset();
      setReportData(result);
      setStep('report');
      sounds.playSuccessChime();
    } catch (err) {
      console.error('Reset error:', err);
      setErrorMsg('Failed to complete reset. All data preserved.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200 my-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-red-700 via-rose-700 to-red-800 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base leading-tight">
                Complete Reset / Fresh Start (ڈیٹا ری سیٹ)
              </h3>
              <p className="text-[11px] text-rose-200">
                Safe Zero-Balance Wipe with Automatic JSON Backup
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'confirm' ? (
          <form onSubmit={handleExecuteReset} className="p-6 space-y-4 text-xs">
            {/* Automatic Backup Notice */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-black text-emerald-900 text-xs">
                  Automatic Backup Guaranteed (خودکار بیک اپ ڈاؤنلوڈ)
                </h4>
                <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                  Before any record is cleared, a complete JSON database backup file will be automatically downloaded to your device so you never lose any data.
                </p>
              </div>
            </div>

            {/* Warning Box */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-amber-900 text-xs">
                  What will be zeroed out:
                </h4>
                <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5">
                  <li>Sales Invoices & Cashier Receipts: 0</li>
                  <li>Purchase Bills & Inventory Invoices: 0</li>
                  <li>Customer Khata / Udhar Ledger Balances: Rs. 0</li>
                  <li>Supplier Payable Balances: Rs. 0</li>
                  <li>Current Product Stock Quantities: 0</li>
                  <li>Expenses & Cash Drawer Registers: 0</li>
                </ul>
              </div>
            </div>

            {/* Preserved list */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
              <p className="text-[11px] text-blue-800 font-medium">
                <strong>Preserved Safely:</strong> Store branding, Owner Profile cards, Login credentials, Product names & catalog barcodes.
              </p>
            </div>

            {/* Owner PIN input */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-bold text-slate-700">
                Enter Owner PIN to Confirm (ڈیٹا ری سیٹ تصدیقی پن کوڈ):
              </label>
              <div className="flex items-center rounded-xl bg-slate-100 border border-slate-300 px-3 py-2 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-200">
                <Lock className="w-4 h-4 text-slate-400 mr-2" />
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="Enter 4-digit PIN (Default: 1234)"
                  className="w-full bg-transparent text-sm font-black text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
              {errorMsg && <p className="text-red-600 font-bold text-[11px]">{errorMsg}</p>}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer text-center"
              >
                Cancel (منسوخ کریں)
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-md transition-all active:scale-95 cursor-pointer text-center flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Backup & Reset Now</span>
              </button>
            </div>
          </form>
        ) : (
          /* Step 2: Reset Completion Report */
          <div className="p-6 space-y-4 text-xs">
            <div className="text-center py-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-black text-slate-900">
                System Reset Complete! (فریش اسٹارٹ مکمل ہو گیا)
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Your application has been safely initialized with a clean slate.
              </p>
            </div>

            {/* Backup file card */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <span className="font-bold text-emerald-950 block text-[11px]">Downloaded Backup File:</span>
                  <span className="font-mono text-[10px] text-emerald-800 truncate block">
                    {reportData?.backupFileName}
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[10px] font-bold shrink-0">
                SAVED
              </span>
            </div>

            {/* Summary Statistics Table */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 space-y-2">
              <span className="font-black text-slate-700 text-[11px] block uppercase tracking-wider">
                Reset Completion Report (تفصیلی رپورٹ):
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-white p-2 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block">Sales Invoices Cleared:</span>
                  <span className="font-black text-slate-900 text-sm">
                    {reportData?.stats.transactionsCount || 0}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block">Purchase Bills Cleared:</span>
                  <span className="font-black text-slate-900 text-sm">
                    {reportData?.stats.purchasesCount || 0}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block">Customer Balances Zeroed:</span>
                  <span className="font-black text-slate-900 text-sm">
                    {reportData?.stats.customersCount || 0}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block">Products Zeroed:</span>
                  <span className="font-black text-slate-900 text-sm">
                    {reportData?.stats.productsCount || 0}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-[#071739] hover:bg-slate-900 text-white font-black rounded-xl shadow-md cursor-pointer transition-all active:scale-95 text-center"
            >
              Close & Start Fresh (بند کریں اور کام شروع کریں)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

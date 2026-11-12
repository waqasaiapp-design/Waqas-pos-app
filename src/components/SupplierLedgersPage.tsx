import React, { useState, useMemo } from 'react';
import {
  Truck,
  Search,
  Plus,
  ArrowLeft,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Banknote,
  DollarSign,
  TrendingDown,
  TrendingUp,
  FileText,
  Printer,
  Download,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Supplier, SupplierLedgerEntry, PurchaseTransaction } from '../types/pos';
import { formatRs } from '../data/defaultProducts';
import { WaqasDualProfileCards } from './WaqasDualProfileCards';
import { FullScreenPageHeader } from './FullScreenPageHeader';

interface SupplierLedgersPageProps {
  suppliers: Supplier[];
  ledgerEntries: SupplierLedgerEntry[];
  purchases: PurchaseTransaction[];
  onSaveSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (supplierId: string) => void;
  onSaveLedgerEntry: (entry: SupplierLedgerEntry) => void;
  onDeleteLedgerEntry: (entryId: string) => void;
  onDeleteAllSuppliers?: () => void;
  onNavigateToPurchases?: () => void;
  onBackToHome?: () => void;
}

export const SupplierLedgersPage: React.FC<SupplierLedgersPageProps> = ({
  suppliers,
  ledgerEntries,
  purchases,
  onSaveSupplier,
  onDeleteSupplier,
  onSaveLedgerEntry,
  onDeleteLedgerEntry,
  onDeleteAllSuppliers,
  onNavigateToPurchases,
  onBackToHome,
}) => {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // New Supplier Form State
  const [newSupName, setNewSupName] = useState('');
  const [newSupPhone, setNewSupPhone] = useState('');
  const [newSupCity, setNewSupCity] = useState('');
  const [newSupAddress, setNewSupAddress] = useState('');
  const [newSupPayable, setNewSupPayable] = useState('');

  // Payment Form State
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'cash' | 'bank' | 'card'>('cash');
  const [payDesc, setPayDesc] = useState('');
  const [payDate, setPayDate] = useState(new Date().toLocaleDateString('en-GB'));

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Compute calculated statistics for all suppliers
  const suppliersWithStats = useMemo(() => {
    return suppliers.map((sup) => {
      const supEntries = ledgerEntries.filter((e) => e.supplierId === sup.id);
      let totalPurchases = 0; // Credit
      let totalPayments = 0; // Debit

      for (const e of supEntries) {
        totalPurchases += Number(e.credit) || 0;
        totalPayments += Number(e.debit) || 0;
      }

      // Also sum from purchases if not duplicate
      const supPurchases = purchases.filter((p) => p.supplierId === sup.id);
      const purchaseSum = supPurchases.reduce((acc, p) => acc + (p.grandTotal || 0), 0);
      const paidSum = supPurchases.reduce((acc, p) => acc + (p.amountPaid || 0), 0);

      const netPayable = Math.max(
        0,
        (Number(sup.payableBalance) || 0) + totalPurchases - totalPayments
      );

      return {
        ...sup,
        totalPurchases: totalPurchases > 0 ? totalPurchases : purchaseSum,
        totalPayments: totalPayments > 0 ? totalPayments : paidSum,
        currentPayable: netPayable,
        entriesCount: supEntries.length,
      };
    });
  }, [suppliers, ledgerEntries, purchases]);

  const activeSupplier = useMemo(() => {
    if (!selectedSupplierId) return null;
    return suppliersWithStats.find((s) => s.id === selectedSupplierId) || null;
  }, [selectedSupplierId, suppliersWithStats]);

  const activeSupplierEntries = useMemo(() => {
    if (!selectedSupplierId) return [];
    return ledgerEntries
      .filter((e) => e.supplierId === selectedSupplierId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [selectedSupplierId, ledgerEntries]);

  // Grand summary stats
  const grandSummary = useMemo(() => {
    let totalPayables = 0;
    let totalPurchased = 0;
    let totalPaid = 0;

    for (const s of suppliersWithStats) {
      totalPayables += s.currentPayable;
      totalPurchased += s.totalPurchases;
      totalPaid += s.totalPayments;
    }

    return {
      totalSuppliers: suppliers.length,
      totalPayables,
      totalPurchased,
      totalPaid,
    };
  }, [suppliersWithStats, suppliers]);

  const filteredSuppliers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return suppliersWithStats;
    return suppliersWithStats.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q)) ||
        (s.city && s.city.toLowerCase().includes(q))
    );
  }, [suppliersWithStats, searchQuery]);

  // Handle Add Supplier
  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName.trim()) return;

    const openingPayable = parseFloat(newSupPayable) || 0;
    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      name: newSupName.trim(),
      phone: newSupPhone.trim() || undefined,
      city: newSupCity.trim() || undefined,
      address: newSupAddress.trim() || undefined,
      payableBalance: openingPayable,
      createdAt: new Date().toLocaleDateString('en-GB'),
    };

    onSaveSupplier(newSup);

    if (openingPayable > 0) {
      const entry: SupplierLedgerEntry = {
        id: `sup-entry-${Date.now()}`,
        supplierId: newSup.id,
        date: new Date().toLocaleDateString('en-GB'),
        description: 'Opening Payable Balance (ابتدائی بقایا رقم)',
        credit: openingPayable,
        debit: 0,
        runningBalance: openingPayable,
        paymentMethod: 'Opening',
        createdAt: new Date().toISOString(),
      };
      onSaveLedgerEntry(entry);
    }

    setNewSupName('');
    setNewSupPhone('');
    setNewSupCity('');
    setNewSupAddress('');
    setNewSupPayable('');
    setIsAddSupplierOpen(false);
    showToast(`Supplier "${newSup.name}" registered successfully!`);
  };

  // Handle Record Payment to Supplier
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSupplier) return;
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    const newBalance = Math.max(0, activeSupplier.currentPayable - amount);
    const entry: SupplierLedgerEntry = {
      id: `sup-entry-${Date.now()}`,
      supplierId: activeSupplier.id,
      date: payDate || new Date().toLocaleDateString('en-GB'),
      description: payDesc.trim() || `Payment to Supplier via ${payMethod.toUpperCase()}`,
      debit: amount,
      credit: 0,
      runningBalance: newBalance,
      paymentMethod: payMethod,
      createdAt: new Date().toISOString(),
    };

    onSaveLedgerEntry(entry);

    // Update supplier payable balance
    onSaveSupplier({
      ...activeSupplier,
      payableBalance: newBalance,
    });

    setPayAmount('');
    setPayDesc('');
    setIsPaymentModalOpen(false);
    showToast(`Payment of Rs. ${amount.toFixed(0)} recorded for ${activeSupplier.name}!`);
  };

  // Print Statement
  const handlePrintStatement = () => {
    window.print();
  };

  return (
    <div className="flex-1 w-full min-h-full bg-[#f8fafc] text-slate-900 font-sans flex flex-col">
      {/* Universal Fullscreen Header with Back/Exit & Fullscreen Toggle */}
      <FullScreenPageHeader
        title="Supplier Ledgers & Payables"
        urduTitle="سپلائر کھاتہ اور واجبات"
        icon={<Truck className="w-5 h-5 text-white" />}
        onBackToHome={() => {
          if (onBackToHome) onBackToHome();
          else if (onNavigateToPurchases) onNavigateToPurchases();
        }}
        badge={`${suppliers.length} Suppliers`}
        badgeColor="bg-teal-500/20 text-teal-300 border-teal-500/30"
        actions={
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setIsAddSupplierOpen(true)}
              className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Supplier</span>
            </button>
            <button
              type="button"
              onClick={handlePrintStatement}
              className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        }
      />

      <div className="flex-1 min-h-0 p-3 sm:p-5 lg:p-6 w-full space-y-4 overflow-y-auto">
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

      {/* Header and Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#0f766e] text-white flex items-center justify-center shadow-xs">
            <Truck className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Supplier Ledgers (سپلائر کھاتہ جات)
            </h2>
            <p className="text-xs text-slate-500">
              Complete purchase records, payments, debits, credits and payables
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToPurchases && (
            <button
              onClick={onNavigateToPurchases}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Purchase Invoices</span>
            </button>
          )}

          <button
            onClick={() => setIsAddSupplierOpen(true)}
            className="px-4 py-2 bg-[#0f766e] hover:bg-teal-800 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Add Supplier (نیا سپلائر)</span>
          </button>

          {suppliers.length > 0 && onDeleteAllSuppliers && (
            <button
              onClick={() => {
                if (
                  window.confirm(
                    `Are you sure you want to delete all ${suppliers.length} suppliers and their ledgers?\nکیا آپ تمام سپلائرز اور ان کے کھاتے ڈیلیٹ کرنا چاہتے ہیں؟`
                  )
                ) {
                  onDeleteAllSuppliers();
                }
              }}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs transition-all cursor-pointer"
              title="Delete all suppliers"
            >
              <Trash2 className="w-4 h-4" />
              <span>All Delete ({suppliers.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Suppliers</span>
          <span className="text-xl font-black text-slate-900 tabular-nums">
            {grandSummary.totalSuppliers}
          </span>
        </div>

        <div className="bg-red-50/70 border border-red-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-red-700 block">Total Payable Due</span>
          <span className="text-xl font-black text-red-950 tabular-nums">
            {formatRs(grandSummary.totalPayables)}
          </span>
        </div>

        <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-blue-700 block">Total Purchases</span>
          <span className="text-xl font-black text-blue-950 tabular-nums">
            {formatRs(grandSummary.totalPurchased)}
          </span>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-emerald-700 block">Total Paid Back</span>
          <span className="text-xl font-black text-emerald-950 tabular-nums">
            {formatRs(grandSummary.totalPaid)}
          </span>
        </div>
      </div>

      {/* Main View: Detailed Supplier Ledger vs Supplier List */}
      {selectedSupplierId && activeSupplier ? (
        <div className="space-y-4">
          {/* Supplier Detail Header */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setSelectedSupplierId(null)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All Suppliers (تمام سپلائر)</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <DollarSign className="w-4 h-4" />
                <span>+ Make Payment (ادائیگی ریکارڈ کریں)</span>
              </button>

              <button
                onClick={handlePrintStatement}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Ledger</span>
              </button>
            </div>
          </div>

          {/* Supplier Profile Card */}
          <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase text-teal-300 tracking-wider">
                Supplier Profile
              </span>
              <h3 className="text-xl font-black text-white">{activeSupplier.name}</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {activeSupplier.phone ? `Phone: ${activeSupplier.phone}` : ''}
                {activeSupplier.city ? ` • City: ${activeSupplier.city}` : ''}
              </p>
            </div>

            <div className="bg-white/10 border border-white/20 p-3 rounded-xl text-right">
              <span className="text-[10px] font-bold text-slate-300 uppercase block">
                Current Payable Balance
              </span>
              <span className="text-2xl font-black text-amber-300">
                Rs. {activeSupplier.currentPayable.toFixed(0)}
              </span>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Transaction History ({activeSupplierEntries.length} records)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Payment Method</th>
                    <th className="py-2.5 px-3 text-right text-emerald-800">Debit (Paid Back)</th>
                    <th className="py-2.5 px-3 text-right text-red-800">Credit (Purchase)</th>
                    <th className="py-2.5 px-3 text-right font-black">Running Balance</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeSupplierEntries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Truck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-slate-600">No ledger entries recorded yet</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Purchase bills and payments for this supplier will appear here automatically.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    activeSupplierEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                          {entry.date}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">{entry.description}</td>
                        <td className="py-2.5 px-3 text-slate-600 uppercase text-[10px]">
                          {entry.paymentMethod || 'Cash'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                          {entry.debit > 0 ? `Rs. ${entry.debit.toFixed(0)}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-red-700">
                          {entry.credit > 0 ? `Rs. ${entry.credit.toFixed(0)}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                          Rs. {entry.runningBalance.toFixed(0)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => {
                              if (window.confirm('Delete this ledger record?')) {
                                onDeleteLedgerEntry(entry.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                            title="Delete Entry"
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
        </div>
      ) : (
        /* Supplier Master Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search supplier name, phone, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-600"
              />
            </div>
            <span className="text-xs font-bold text-slate-500">
              Showing {filteredSuppliers.length} suppliers
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3.5">Supplier Name</th>
                  <th className="py-3 px-3">Phone</th>
                  <th className="py-3 px-3">City / Address</th>
                  <th className="py-3 px-3 text-right text-blue-800">Total Purchases</th>
                  <th className="py-3 px-3 text-right text-emerald-800">Total Payments</th>
                  <th className="py-3 px-3.5 text-right font-black text-red-950 bg-red-50/50">
                    Net Payable Balance
                  </th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-14 text-center text-slate-400">
                      <Truck className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-slate-700">No suppliers registered yet</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Click "+ Add Supplier" above to add your first supplier.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((sup) => (
                    <tr
                      key={sup.id}
                      onClick={() => setSelectedSupplierId(sup.id)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-3.5 font-bold text-slate-900">{sup.name}</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600">{sup.phone || '-'}</td>
                      <td className="py-3 px-3 text-slate-600">{sup.city || sup.address || '-'}</td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-blue-700">
                        Rs. {sup.totalPurchases.toFixed(0)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-700">
                        Rs. {sup.totalPayments.toFixed(0)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-black text-sm text-red-700 bg-red-50/40">
                        Rs. {sup.currentPayable.toFixed(0)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSupplierId(sup.id);
                          }}
                          className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-bold"
                        >
                          View Ledger 👉
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-800 text-sm">
                  نیا سپلائر شامل کریں (Add Supplier)
                </h3>
              </div>
              <button
                onClick={() => setIsAddSupplierOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Supplier Name *
                </label>
                <input
                  type="text"
                  required
                  value={newSupName}
                  onChange={(e) => setNewSupName(e.target.value)}
                  placeholder="e.g. Metro Wholesale / Ali Traders"
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newSupPhone}
                  onChange={(e) => setNewSupPhone(e.target.value)}
                  placeholder="0300-1234567"
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">City</label>
                <input
                  type="text"
                  value={newSupCity}
                  onChange={(e) => setNewSupCity(e.target.value)}
                  placeholder="Lahore / Karachi / Rawalpindi"
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Opening Payable Balance (Rs.)
                </label>
                <input
                  type="number"
                  step="any"
                  value={newSupPayable}
                  onChange={(e) => setNewSupPayable(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#0f766e] hover:bg-teal-800 text-white rounded-xl shadow-sm"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isPaymentModalOpen && activeSupplier && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-sm">
                  سپلائر کو ادائیگی (Payment to Supplier)
                </h3>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl text-xs mb-3">
              <span className="text-slate-500">Supplier:</span>{' '}
              <strong className="text-slate-900">{activeSupplier.name}</strong>
              <div className="text-red-700 font-bold mt-0.5">
                Current Due: Rs. {activeSupplier.currentPayable.toFixed(0)}
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Payment Amount (Rs.) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-sm font-bold px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Payment Method
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 outline-none"
                >
                  <option value="cash">Cash (کیش ادائیگی)</option>
                  <option value="bank">Bank Transfer / Cheque</option>
                  <option value="card">Card / Digital Wallet</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Description / Note
                </label>
                <input
                  type="text"
                  value={payDesc}
                  onChange={(e) => setPayDesc(e.target.value)}
                  placeholder="e.g. Paid cash at counter"
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm"
                >
                  Confirm Payment
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

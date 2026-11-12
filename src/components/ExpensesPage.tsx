import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard,
  Banknote,
  Trash2,
  Edit2,
  Printer,
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  Zap,
  Home,
  Users,
  Truck,
  Wrench,
  HelpCircle,
} from 'lucide-react';
import { ExpenseEntry, ExpenseCategory } from '../types/pos';
import { formatRs } from '../data/defaultProducts';
import { WaqasDualProfileCards } from './WaqasDualProfileCards';
import { FullScreenPageHeader } from './FullScreenPageHeader';

interface ExpensesPageProps {
  expenses: ExpenseEntry[];
  onSaveExpense: (expense: ExpenseEntry) => void;
  onDeleteExpense: (expenseId: string) => void;
  onDeleteAllExpenses?: () => void;
  currentCashBalance?: number;
  onBackToHome?: () => void;
}

export const ExpensesPage: React.FC<ExpensesPageProps> = ({
  expenses,
  onSaveExpense,
  onDeleteExpense,
  onDeleteAllExpenses,
  currentCashBalance = 0,
  onBackToHome,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseEntry | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Form Fields
  const [date, setDate] = useState(new Date().toLocaleDateString('en-GB'));
  const [category, setCategory] = useState<ExpenseCategory>('Electricity');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'card' | 'wallet'>('cash');
  const [description, setDescription] = useState('');
  const [paidTo, setPaidTo] = useState('');
  const [receiptNo, setReceiptNo] = useState('');

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const categoriesList: { id: ExpenseCategory; label: string; icon: any }[] = [
    { id: 'Electricity', label: 'Electricity (بجلی کا بل)', icon: Zap },
    { id: 'Rent', label: 'Rent (دکان کا کرایہ)', icon: Home },
    { id: 'Salary', label: 'Salary (ملازمین کی تنخواہ)', icon: Users },
    { id: 'Transport', label: 'Transport (کرایہ گاڑی / مال لانا)', icon: Truck },
    { id: 'Maintenance', label: 'Maintenance (مرمت و دیکھ بھال)', icon: Wrench },
    { id: 'Other', label: 'Other (متفرق اخراجات)', icon: HelpCircle },
  ];

  // Summary statistics
  const summary = useMemo(() => {
    let total = 0;
    let cashPaid = 0;
    let bankPaid = 0;
    const catMap: Record<string, number> = {};

    for (const exp of expenses) {
      const amt = Number(exp.amount) || 0;
      total += amt;
      if (exp.paymentMethod === 'cash') cashPaid += amt;
      else bankPaid += amt;

      catMap[exp.category] = (catMap[exp.category] || 0) + amt;
    }

    // Top category
    let topCat = 'None';
    let topCatAmt = 0;
    Object.entries(catMap).forEach(([cat, val]) => {
      if (val > topCatAmt) {
        topCat = cat;
        topCatAmt = val;
      }
    });

    return { total, cashPaid, bankPaid, topCat, count: expenses.length };
  }, [expenses]);

  // Filtered expenses list
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((exp) => {
        if (selectedCategory !== 'ALL' && exp.category !== selectedCategory) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return (
          exp.description.toLowerCase().includes(q) ||
          exp.category.toLowerCase().includes(q) ||
          (exp.paidTo && exp.paidTo.toLowerCase().includes(q)) ||
          (exp.receiptNo && exp.receiptNo.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [expenses, selectedCategory, searchQuery]);

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setDate(new Date().toLocaleDateString('en-GB'));
    setCategory('Electricity');
    setAmount('');
    setPaymentMethod('cash');
    setDescription('');
    setPaidTo('');
    setReceiptNo('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (exp: ExpenseEntry) => {
    setEditingExpense(exp);
    setDate(exp.date);
    setCategory(exp.category);
    setAmount(exp.amount.toString());
    setPaymentMethod(exp.paymentMethod);
    setDescription(exp.description);
    setPaidTo(exp.paidTo || '');
    setReceiptNo(exp.receiptNo || '');
    setIsAddModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }

    const newExpense: ExpenseEntry = {
      id: editingExpense ? editingExpense.id : `exp-${Date.now()}`,
      date: date || new Date().toLocaleDateString('en-GB'),
      category,
      amount: parsedAmount,
      paymentMethod,
      description: description.trim() || `${category} expense`,
      paidTo: paidTo.trim() || undefined,
      receiptNo: receiptNo.trim() || undefined,
      recordedBy: 'Admin / Owner',
      createdAt: editingExpense ? editingExpense.createdAt : new Date().toISOString(),
    };

    onSaveExpense(newExpense);
    setIsAddModalOpen(false);
    showToast(editingExpense ? 'Expense updated successfully!' : 'New expense recorded successfully!');
  };

  return (
    <div className="flex-1 min-h-full w-full bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
      <FullScreenPageHeader
        title="Store Expenses & Costs"
        subtitle="دکان کے روزمرہ اخراجات — بجلی، کرایہ، ملازمین تنخواہ اور بلز"
        icon={<Wallet className="w-5 h-5 text-red-600" />}
        onBackToHome={onBackToHome}
        accentColor="red"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Report</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Add Expense (نیا خرچ)</span>
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
          <div className="w-11 h-11 rounded-xl bg-[#dc2626] text-white flex items-center justify-center shadow-xs">
            <Wallet className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Expenses (دکان کے اخراجات)
            </h2>
            <p className="text-xs text-slate-500">
              Electricity, Rent, Staff Salary, Transport, Maintenance & Daily Store Costs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-[#dc2626] hover:bg-red-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Add Expense (نیا خرچ درج کریں)</span>
          </button>

          {expenses.length > 0 && onDeleteAllExpenses && (
            <button
              onClick={() => {
                if (
                  window.confirm(
                    `Are you sure you want to delete all ${expenses.length} expense records?\nکیا آپ تمام اخراجات ڈیلیٹ کرنا چاہتے ہیں؟`
                  )
                ) {
                  onDeleteAllExpenses();
                }
              }}
              className="px-3.5 py-2 bg-slate-800 hover:bg-black active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs transition-all cursor-pointer"
              title="Delete all expenses"
            >
              <Trash2 className="w-4 h-4" />
              <span>All Delete ({expenses.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-red-50/70 border border-red-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-red-700 block">Total Expenses</span>
          <span className="text-xl font-black text-red-950 tabular-nums">
            {formatRs(summary.total)}
          </span>
          <span className="text-[10px] text-red-600 mt-0.5 block">{summary.count} entries recorded</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Paid via Cash</span>
          <span className="text-xl font-black text-slate-900 tabular-nums">
            {formatRs(summary.cashPaid)}
          </span>
        </div>

        <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-blue-700 block">Paid via Bank/Card</span>
          <span className="text-xl font-black text-blue-950 tabular-nums">
            {formatRs(summary.bankPaid)}
          </span>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-amber-800 block">Top Expense Category</span>
          <span className="text-lg font-black text-amber-950 truncate block mt-0.5">
            {summary.topCat}
          </span>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
            selectedCategory === 'ALL'
              ? 'bg-[#0f172a] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          All Expenses ({expenses.length})
        </button>

        {categoriesList.map((cat) => {
          const count = expenses.filter((e) => e.category === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-red-600 text-white font-bold shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{cat.label.split('(')[0]}</span>
              <span className="text-[10px] opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search description, payee, receipt..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-red-500"
            />
          </div>
          <span className="text-xs font-bold text-slate-500">
            Showing {filteredExpenses.length} of {expenses.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3.5">Date</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3">Paid To</th>
                <th className="py-3 px-3">Method</th>
                <th className="py-3 px-3.5 text-right font-black text-red-950 bg-red-50/50">
                  Amount (Rs.)
                </th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400">
                    <Wallet className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-700">No expenses recorded yet</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Click "+ Add Expense" to record daily business costs.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3.5 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {exp.date}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-900">{exp.description}</td>
                    <td className="py-3 px-3 text-slate-600">{exp.paidTo || '-'}</td>
                    <td className="py-3 px-3 uppercase text-[10px] font-semibold text-slate-500">
                      {exp.paymentMethod}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-black text-sm text-red-700 bg-red-50/40">
                      Rs. {exp.amount.toFixed(0)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(exp)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors"
                          title="Edit Expense"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this expense record?')) {
                              onDeleteExpense(exp.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100 transition-colors"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-slate-800 text-sm">
                  {editingExpense ? 'خرچ تبدیل کریں (Edit Expense)' : 'نیا خرچ درج کریں (Add Expense)'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Expense Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-red-500"
                >
                  {categoriesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Amount (Rs.) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-sm font-bold px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 outline-none"
                >
                  <option value="cash">Cash (کیش سے ادا کیا)</option>
                  <option value="bank">Bank Transfer / Cheque</option>
                  <option value="card">Debit / Credit Card</option>
                  <option value="wallet">Digital Wallet (EasyPaisa/JazzCash)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Description / تفصیل
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. October Shop Rent / Bill payment"
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Paid To</label>
                  <input
                    type="text"
                    value={paidTo}
                    onChange={(e) => setPaidTo(e.target.value)}
                    placeholder="Recipient name"
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Date</label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#dc2626] hover:bg-red-700 text-white rounded-xl shadow-sm"
                >
                  {editingExpense ? 'Update Expense' : 'Save Expense'}
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

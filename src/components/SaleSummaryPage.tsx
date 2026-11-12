import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Search,
  RefreshCw,
  Printer,
  FileSpreadsheet,
  FileText,
  ShoppingCart,
  Percent,
  TrendingUp,
  Banknote,
  CreditCard,
  BookOpen,
  DollarSign,
  Users,
  ChevronDown,
  User,
  ArrowRight,
  Filter,
  LayoutGrid,
  List,
  ChevronUp,
  Clock,
  Receipt,
  CheckCircle2,
  RotateCcw,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { SaleTransaction, SaleReturn, Product, PurchaseTransaction } from '../types/pos';
import { formatRs } from '../data/defaultProducts';
import { WaqasBrandingCard } from './WaqasBrandingCard';
import { FullScreenPageHeader } from './FullScreenPageHeader';

interface SaleSummaryPageProps {
  transactions: SaleTransaction[];
  saleReturns?: SaleReturn[];
  products?: Product[];
  purchases?: PurchaseTransaction[];
  onSelectInvoiceToPrint: (transaction: SaleTransaction) => void;
  onNavigate: (page: string) => void;
  activeNav?: string;
  onBackToHome?: () => void;
}

type QuickDateFilter =
  | 'Today'
  | 'Yesterday'
  | 'Day Before'
  | 'This Week'
  | 'This Month'
  | 'Prev Month'
  | 'This Year'
  | 'Prev Year'
  | 'Custom';

export const SaleSummaryPage: React.FC<SaleSummaryPageProps> = ({
  transactions,
  saleReturns = [],
  products = [],
  purchases = [],
  onSelectInvoiceToPrint,
  onNavigate,
  activeNav = 'Daily Hisab',
  onBackToHome,
}) => {
  // Format YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Report Tab: Sales Summary vs Inventory & Negative Stock Report
  const [activeReportTab, setActiveReportTab] = useState<'sales' | 'inventory_stock'>('sales');
  const [negativeStockOnlyFilter, setNegativeStockOnlyFilter] = useState<boolean>(false);

  // Date Filters
  const [fromDate, setFromDate] = useState<string>(todayStr);
  const [toDate, setToDate] = useState<string>(todayStr);
  const [activeQuickFilter, setActiveQuickFilter] = useState<QuickDateFilter>('Today');

  // Search & Payment Method Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'All' | 'Cash' | 'Card' | 'Credit'>('All');

  // Selected row for "Print Invoice"
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  // View mode: 'cards' or 'table' - defaults to 'cards' on mobile screens
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'cards';
    }
    return 'table';
  });

  // Expandable invoice items breakdown in cards
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);

  // Inventory & Negative Stock Report Calculation
  const stockReportItems = useMemo(() => {
    return products.map((prod) => {
      let totalSoldQty = 0;
      transactions.forEach((tx) => {
        tx.items?.forEach((it) => {
          if (it.product?.id === prod.id || it.product?.barcode === prod.barcode) {
            totalSoldQty += it.quantity || 0;
          }
        });
      });

      let totalPurchasedQty = 0;
      purchases.forEach((pur) => {
        pur.items?.forEach((it) => {
          if (it.productId === prod.id || it.barcode === prod.barcode) {
            totalPurchasedQty += it.quantity || 0;
          }
        });
      });

      const currentStock = prod.stock;
      const isNegative = currentStock < 0;

      return {
        product: prod,
        totalSoldQty,
        totalPurchasedQty,
        currentStock,
        isNegative,
      };
    });
  }, [products, transactions, purchases]);

  const filteredStockReportItems = useMemo(() => {
    return stockReportItems.filter((item) => {
      if (negativeStockOnlyFilter && !item.isNegative) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const n = (item.product.name || '').toLowerCase();
        const b = (item.product.barcode || '').toLowerCase();
        const c = (item.product.category || '').toLowerCase();
        return n.includes(q) || b.includes(q) || c.includes(q);
      }
      return true;
    });
  }, [stockReportItems, negativeStockOnlyFilter, searchQuery]);

  // Quick Date Filter Handler
  const handleQuickFilter = (filter: QuickDateFilter) => {
    setActiveQuickFilter(filter);
    const now = new Date();

    if (filter === 'Today') {
      const d = now.toISOString().split('T')[0];
      setFromDate(d);
      setToDate(d);
    } else if (filter === 'Yesterday') {
      const y = new Date(now);
      y.setDate(now.getDate() - 1);
      const d = y.toISOString().split('T')[0];
      setFromDate(d);
      setToDate(d);
    } else if (filter === 'Day Before') {
      const db = new Date(now);
      db.setDate(now.getDate() - 2);
      const d = db.toISOString().split('T')[0];
      setFromDate(d);
      setToDate(d);
    } else if (filter === 'This Week') {
      const start = new Date(now);
      const day = start.getDay() || 7;
      start.setDate(start.getDate() - day + 1);
      setFromDate(start.toISOString().split('T')[0]);
      setToDate(now.toISOString().split('T')[0]);
    } else if (filter === 'This Month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setFromDate(start.toISOString().split('T')[0]);
      setToDate(now.toISOString().split('T')[0]);
    } else if (filter === 'Prev Month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      setFromDate(start.toISOString().split('T')[0]);
      setToDate(end.toISOString().split('T')[0]);
    } else if (filter === 'This Year') {
      const start = new Date(now.getFullYear(), 0, 1);
      setFromDate(start.toISOString().split('T')[0]);
      setToDate(now.toISOString().split('T')[0]);
    } else if (filter === 'Prev Year') {
      const start = new Date(now.getFullYear() - 1, 0, 1);
      const end = new Date(now.getFullYear() - 1, 11, 31);
      setFromDate(start.toISOString().split('T')[0]);
      setToDate(end.toISOString().split('T')[0]);
    }
  };

  // Filter Transactions by Date Range, Payment Method, and Search Query
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Date parse
      let txDateStr = '';
      try {
        const d = new Date(tx.dateTime);
        if (!isNaN(d.getTime())) {
          txDateStr = d.toISOString().split('T')[0];
        }
      } catch {
        // fallback
      }

      // If valid date, check range
      if (txDateStr) {
        if (fromDate && txDateStr < fromDate) return false;
        if (toDate && txDateStr > toDate) return false;
      }

      // Payment method filter
      if (paymentFilter !== 'All') {
        if (tx.paymentMethod.toLowerCase() !== paymentFilter.toLowerCase()) {
          return false;
        }
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesInvoice = tx.invoiceNumber.toLowerCase().includes(q);
        const matchesCustomer = tx.customerName
          ? tx.customerName.toLowerCase().includes(q)
          : 'pos cash sales'.includes(q);
        if (!matchesInvoice && !matchesCustomer) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, fromDate, toDate, paymentFilter, searchQuery]);

  // Calculations for 9 Colored Summary Cards based on actual filtered data
  const summaryCalculations = useMemo(() => {
    let grossSales = 0;
    let discounts = 0;
    let rawNetSales = 0;
    let cashSales = 0;
    let cardSales = 0;
    let creditSales = 0;
    let recoveries = 0;
    let outstandingReceivables = 0;

    let totalItemsSold = 0;

    filteredTransactions.forEach((tx) => {
      grossSales += tx.subtotal || tx.grandTotal;
      discounts += tx.discount || 0;
      rawNetSales += tx.grandTotal;
      totalItemsSold += tx.items?.reduce((s, it) => s + (it.quantity || 1), 0) || 0;

      if (tx.paymentMethod === 'cash') {
        cashSales += tx.grandTotal;
      } else if (tx.paymentMethod === 'card') {
        cardSales += tx.grandTotal;
      } else if (tx.paymentMethod === 'credit') {
        creditSales += tx.grandTotal;
        const paid = tx.cashTendered || 0;
        const due = Math.max(0, tx.grandTotal - paid);
        outstandingReceivables += due;
        if (paid > 0) {
          recoveries += paid;
        }
      }
    });

    // Compute returns filtered by the active date range
    let totalReturns = 0;
    let cashRefunds = 0;
    let cardRefunds = 0;
    let creditRefunds = 0;

    saleReturns.forEach((r) => {
      // Check date matching for return
      let returnDateIso = r.date;
      if (r.date && r.date.includes('/')) {
        const parts = r.date.split('/');
        if (parts.length === 3) {
          returnDateIso = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }

      const inDateRange = !returnDateIso || (returnDateIso >= fromDate && returnDateIso <= toDate);
      if (inDateRange) {
        const refundAmt = r.totalRefund || 0;
        totalReturns += refundAmt;
        if (r.refundMethod === 'cash') {
          cashRefunds += refundAmt;
        } else if (r.refundMethod === 'card') {
          cardRefunds += refundAmt;
        } else if (r.refundMethod === 'credit') {
          creditRefunds += refundAmt;
        }
      }
    });

    const netSales = Math.max(0, rawNetSales - totalReturns);
    const netCash = Math.max(0, cashSales - cashRefunds);
    const netCard = Math.max(0, cardSales - cardRefunds);
    const netCredit = Math.max(0, creditSales - creditRefunds);
    const numberOfInvoices = filteredTransactions.length;

    return {
      grossSales,
      discounts,
      totalReturns,
      netSales,
      cashSales,
      netCash,
      cashRefunds,
      cardSales,
      netCard,
      cardRefunds,
      creditSales,
      netCredit,
      creditRefunds,
      recoveries,
      outstandingReceivables,
      numberOfInvoices,
      totalItemsSold,
    };
  }, [filteredTransactions, saleReturns, fromDate, toDate]);

  // Table Column Totals
  const tableTotals = useMemo(() => {
    let totalGross = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let totalGrand = 0;
    let totalPaid = 0;
    let totalBalance = 0;
    const uniqueCustomers = new Set<string>();

    filteredTransactions.forEach((tx) => {
      totalGross += tx.subtotal || tx.grandTotal;
      totalDiscount += tx.discount || 0;
      totalTax += tx.taxAmount || 0;
      totalGrand += tx.grandTotal;

      const paid = tx.paymentMethod === 'credit' ? (tx.cashTendered || 0) : tx.grandTotal;
      const balance = Math.max(0, tx.grandTotal - paid);

      totalPaid += paid;
      totalBalance += balance;

      if (tx.customerName) {
        uniqueCustomers.add(tx.customerName.toLowerCase().trim());
      } else {
        uniqueCustomers.add('pos cash sales');
      }
    });

    return {
      totalGross,
      totalDiscount,
      totalTax,
      totalGrand,
      totalPaid,
      totalBalance,
      customerCount: uniqueCustomers.size,
    };
  }, [filteredTransactions]);

  // Export to Excel / CSV
  const handleExportExcel = () => {
    if (filteredTransactions.length === 0) {
      alert('No sales records to export for this date range.');
      return;
    }

    const headers = [
      'Date',
      'Invoice No',
      'Customer Name',
      'Total',
      'Discount',
      'VAT/Tax',
      'Grand Total',
      'Paid',
      'Balance',
      'Payment Method',
      'Status',
    ];

    const rows = filteredTransactions.map((tx) => {
      const paid = tx.paymentMethod === 'credit' ? (tx.cashTendered || 0) : tx.grandTotal;
      const balance = Math.max(0, tx.grandTotal - paid);
      const status = balance === 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid';
      return [
        tx.dateTime,
        tx.invoiceNumber,
        `"${(tx.customerName || 'POS Cash Sales').replace(/"/g, '""')}"`,
        (tx.subtotal || tx.grandTotal).toFixed(2),
        (tx.discount || 0).toFixed(2),
        (tx.taxAmount || 0).toFixed(2),
        tx.grandTotal.toFixed(2),
        paid.toFixed(2),
        balance.toFixed(2),
        tx.paymentMethod.toUpperCase(),
        status,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Waqas_Mart_Sale_Summary_${fromDate}_to_${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print Report Handler
  const handlePrintReport = () => {
    window.print();
  };

  // Print Specific Invoice
  const handlePrintSelectedInvoice = () => {
    if (!selectedInvoiceId) {
      if (filteredTransactions.length > 0) {
        onSelectInvoiceToPrint(filteredTransactions[0]);
      } else {
        alert('Please select an invoice from the table to print.');
      }
      return;
    }
    const match = filteredTransactions.find((tx) => tx.invoiceNumber === selectedInvoiceId);
    if (match) {
      onSelectInvoiceToPrint(match);
    }
  };

  return (
    <div className="flex-1 min-h-full w-full bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      <FullScreenPageHeader
        title="Sale Summary & Analytics"
        subtitle="فروخت کی روزانہ، ماہانہ اور سالانہ رپورٹس اور منافع کا ریکارڈ"
        icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
        onBackToHome={onBackToHome}
        accentColor="emerald"
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
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
          </div>
        }
      />

      <div className="flex-1 min-h-0 flex flex-col p-3 sm:p-5 lg:p-6 w-full space-y-4 overflow-y-auto">
      {/* ============================================================== */}
      {/* 1. TOP HEADER WITH REAL-TIME TITLE & ADMIN PROFILE             */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
            <TrendingUp className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Sale Summary
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              View your daily, monthly and yearly sales report
            </p>
          </div>
        </div>

        {/* Right Admin Widget */}
        <div className="flex items-center gap-4 text-xs">
          <div className="hidden md:flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 shadow-xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <div>
              <span className="font-bold block leading-none">
                {new Date().toLocaleDateString('en-GB')}
              </span>
              <span className="text-[10px] text-slate-400 leading-none">
                {new Date().toLocaleDateString('en-PK', { weekday: 'long' })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="w-8 h-8 rounded-full bg-[#0284c7] text-white flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="font-bold text-slate-900 block leading-tight">Admin</span>
              <span className="text-[10px] text-slate-400 block leading-tight">Administrator</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* WAQAS MART Dual Profile Cards (Software Owner & Mart Owner) */}
      <WaqasBrandingCard variant="banner" />

      {/* Report Switcher Tabs (Sales Summary vs Inventory & Negative Stock Report) */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-xs max-w-xl">
        <button
          type="button"
          onClick={() => setActiveReportTab('sales')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeReportTab === 'sales'
              ? 'bg-[#005bb5] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Sales & Returns Summary (سیل خلاصہ)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveReportTab('inventory_stock')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeReportTab === 'inventory_stock'
              ? 'bg-[#005bb5] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Package className="w-4 h-4 text-amber-300" />
          <span>Stock & Negative Stock Report ({stockReportItems.filter((i) => i.isNegative).length})</span>
        </button>
      </div>

      {activeReportTab === 'sales' ? (
        <>
          {/* ============================================================== */}
          {/* 2. DATE FILTERS & QUICK BUTTONS MATCHING SCREENSHOT 1          */}
          {/* ============================================================== */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* From Date */}
          <div className="flex-1 min-w-[140px] max-w-[200px]">
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              From Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setActiveQuickFilter('Custom');
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* To Date */}
          <div className="flex-1 min-w-[140px] max-w-[200px]">
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              To Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setActiveQuickFilter('Custom');
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Quick Date Buttons matching Screenshot 1 */}
          <div className="flex-1 flex flex-wrap items-center gap-1.5 pt-4">
            {(
              [
                'Today',
                'Yesterday',
                'Day Before',
                'This Week',
                'This Month',
                'Prev Month',
                'This Year',
                'Prev Year',
                'Custom',
              ] as QuickDateFilter[]
            ).map((filterName) => (
              <button
                key={filterName}
                type="button"
                onClick={() => handleQuickFilter(filterName)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeQuickFilter === filterName
                    ? 'bg-[#16a34a] text-white shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {filterName}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Search, Payment Method & Action Buttons */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Invoice No, Customer Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Payment Method Selector */}
          <div className="w-48">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
              Payment Method
            </label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as 'All' | 'Cash' | 'Card' | 'Credit')}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="All">All</option>
              <option value="Cash">Cash (نقد)</option>
              <option value="Card">Card / POS</option>
              <option value="Credit">Credit / Udhaar</option>
            </select>
          </div>

          {/* 4 Action Buttons matching Screenshot 1 */}
          <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
            {/* Refresh */}
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                handleQuickFilter(activeQuickFilter);
              }}
              className="px-3.5 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>

            {/* Print */}
            <button
              type="button"
              onClick={handlePrintReport}
              className="px-3.5 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            {/* Export Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>

            {/* Print Invoice */}
            <button
              type="button"
              onClick={handlePrintSelectedInvoice}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. 9 COLORED SUMMARY CARDS MATCHING REQUIREMENTS               */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {/* 1. Gross Sales */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-[#16a34a] text-white flex items-center justify-center shrink-0">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase block">
              Gross Sales (مجموعی سیل)
            </span>
            <span className="text-base sm:text-lg font-black text-slate-900 tabular-nums">
              {formatRs(summaryCalculations.grossSales)}
            </span>
          </div>
        </div>

        {/* 2. Sale Returns */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase block">
              Sale Returns (واپسی)
            </span>
            <span className="text-base sm:text-lg font-black text-amber-900 tabular-nums">
              {formatRs(summaryCalculations.totalReturns)}
            </span>
            {summaryCalculations.cashRefunds > 0 && (
              <span className="text-[9px] text-slate-500 block">
                Cash Refund: {formatRs(summaryCalculations.cashRefunds)}
              </span>
            )}
          </div>
        </div>

        {/* 3. Net Sales */}
        <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3.5 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-[#0284c7] text-white flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase block">
              Net Sales (خالص سیل)
            </span>
            <span className="text-base sm:text-lg font-black text-blue-900 tabular-nums">
              {formatRs(summaryCalculations.netSales)}
            </span>
          </div>
        </div>

        {/* 4. Cash Sales */}
        <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-3.5 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase block">
              Cash Sales (نقد سیل)
            </span>
            <span className="text-base sm:text-lg font-black text-slate-900 tabular-nums">
              {formatRs(summaryCalculations.cashSales)}
            </span>
            {summaryCalculations.cashRefunds > 0 && (
              <span className="text-[9px] text-teal-700 font-bold block">
                Net: {formatRs(summaryCalculations.netCash)}
              </span>
            )}
          </div>
        </div>

        {/* 5. Card Sales */}
        <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-3.5 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase block">
              Card Sales (کارڈ پیمنٹ)
            </span>
            <span className="text-base sm:text-lg font-black text-slate-900 tabular-nums">
              {formatRs(summaryCalculations.cardSales)}
            </span>
          </div>
        </div>

        {/* 6. Credit Sales */}
        <div className="bg-orange-50/70 border border-orange-200 rounded-2xl p-3.5 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase block">
              Credit Sales (ادھار کھاتہ)
            </span>
            <span className="text-base sm:text-lg font-black text-slate-900 tabular-nums">
              {formatRs(summaryCalculations.creditSales)}
            </span>
          </div>
        </div>

        {/* 7. Total Discounts */}
        <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-3.5 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase block">
              Total Discounts (رعایت)
            </span>
            <span className="text-base sm:text-lg font-black text-slate-900 tabular-nums">
              {formatRs(summaryCalculations.discounts)}
            </span>
          </div>
        </div>

        {/* 8. Number of Invoices */}
        <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-3.5 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase block">
              Number of Invoices (بلز)
            </span>
            <span className="text-base sm:text-lg font-black text-slate-900 tabular-nums">
              {summaryCalculations.numberOfInvoices}
            </span>
          </div>
        </div>

        {/* 9. Total Items Sold */}
        <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-3.5 flex items-center gap-3 shadow-xs col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase block">
              Total Items Sold (فروخت اشیاء)
            </span>
            <span className="text-base sm:text-lg font-black text-slate-900 tabular-nums">
              {summaryCalculations.totalItemsSold} Units
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. CUSTOMER INVOICES (RESPONSIVE CARDS VIEW + SPREADSHEET VIEW) */}
      {/* ============================================================== */}
      <div className="space-y-3">
        {/* Section Header with View Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0284c7] border border-blue-200 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                  Customer Sales Bills / کسٹمر بلز
                </h2>
                <span className="bg-[#0284c7] text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                  {filteredTransactions.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Tap any customer bill to inspect, view full items, or print receipt
              </p>
            </div>
          </div>

          {/* View Mode Switcher Toggle */}
          <div className="flex items-center self-start sm:self-auto bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-[#0284c7] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards (کارڈز)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-[#0284c7] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table (ٹیبل)</span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* OPTION A: CARDS VIEW (CLEANEST & MOST VISIBLE ON MOBILE)      */}
        {/* ------------------------------------------------------------ */}
        {viewMode === 'cards' && (
          <div className="space-y-3">
            {filteredTransactions.length === 0 ? (
              <div className="py-14 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-700">No customer bills found</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Sales completed from Sale POS will appear here with full customer bill details.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredTransactions.map((tx) => {
                  const paid = tx.paymentMethod === 'credit' ? (tx.cashTendered || 0) : tx.grandTotal;
                  const balance = Math.max(0, tx.grandTotal - paid);
                  const isSelected = selectedInvoiceId === tx.invoiceNumber;
                  const isExpanded = expandedInvoiceId === tx.invoiceNumber;
                  const totalItemsCount = tx.items?.reduce((sum, it) => sum + it.quantity, 0) || tx.items?.length || 0;

                  return (
                    <div
                      key={tx.invoiceNumber}
                      onClick={() => setSelectedInvoiceId(tx.invoiceNumber)}
                      className={`bg-white rounded-2xl border transition-all shadow-xs p-4 flex flex-col justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                      }`}
                    >
                      {/* Top Row: Invoice Number, Time & Status */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-black text-[#0284c7]">
                              {tx.invoiceNumber}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                balance === 0
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : paid > 0
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {balance === 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>{tx.dateTime}</span>
                          </div>
                        </div>

                        {/* Payment Method Badge */}
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-[11px] font-bold uppercase shrink-0">
                          {tx.paymentMethod === 'cash' && <Banknote className="w-3.5 h-3.5 text-emerald-600" />}
                          {tx.paymentMethod === 'card' && <CreditCard className="w-3.5 h-3.5 text-blue-600" />}
                          {tx.paymentMethod === 'credit' && <BookOpen className="w-3.5 h-3.5 text-amber-600" />}
                          <span>{tx.paymentMethod}</span>
                        </span>
                      </div>

                      {/* Customer Name & Items count */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-bold text-slate-900 truncate max-w-[200px]">
                            {tx.customerName || 'POS Cash Sales'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-semibold bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                          {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
                        </span>
                      </div>

                      {/* Financial Highlight Box */}
                      <div className="bg-gradient-to-r from-blue-50/70 to-slate-50 rounded-xl p-3 border border-blue-100/80 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Total Net Bill
                          </span>
                          <span className="text-lg font-black text-slate-900 tabular-nums">
                            {formatRs(tx.grandTotal)}
                          </span>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-bold text-emerald-700">
                            Paid: {formatRs(paid)}
                          </div>
                          {balance > 0 ? (
                            <div className="text-xs font-black text-red-600 mt-0.5">
                              Balance: {formatRs(balance)}
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Change: {formatRs(tx.changeDue || 0)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expandable Purchased Items Breakdown */}
                      {tx.items && tx.items.length > 0 && (
                        <div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedInvoiceId(isExpanded ? null : tx.invoiceNumber);
                            }}
                            className="w-full flex items-center justify-between text-[11px] font-bold text-blue-700 py-1 hover:text-blue-900 cursor-pointer"
                          >
                            <span>{isExpanded ? 'Hide Items (اشیاء چھپائیں)' : 'View Items (اشیاء کی فہرست دیکھیں)'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          {isExpanded && (
                            <div className="mt-1.5 p-2.5 bg-slate-100/80 rounded-xl text-xs space-y-1.5 border border-slate-200/60 max-h-40 overflow-y-auto">
                              {tx.items.map((it, idx) => (
                                <div key={idx} className="flex items-center justify-between text-[11px]">
                                  <span className="font-medium text-slate-800 truncate flex-1 pr-2">
                                    {it.product.name} × {it.quantity}
                                  </span>
                                  <span className="font-mono font-bold text-slate-700 shrink-0">
                                    Rs. {(it.product.price * it.quantity).toFixed(0)}
                                  </span>
                                </div>
                              ))}
                              {tx.discount && tx.discount > 0 && (
                                <div className="flex justify-between text-[10px] text-amber-700 pt-1 border-t border-slate-200">
                                  <span>Discount:</span>
                                  <span>-Rs. {tx.discount}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Button: 1-Tap Print / View Full Receipt */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInvoiceId(tx.invoiceNumber);
                          onSelectInvoiceToPrint(tx);
                        }}
                        className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print / View Receipt (رسید پرنٹ کریں)</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* OPTION B: TABLE VIEW (SPREADSHEET WITH SWIPE SCROLLING)       */}
        {/* ------------------------------------------------------------ */}
        {viewMode === 'table' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            {/* Mobile swipe helper tip */}
            <div className="sm:hidden px-3 py-1.5 bg-blue-50 text-blue-800 text-[11px] font-semibold flex items-center justify-between border-b border-blue-100">
              <span>👉 تمام کالمز دیکھنے کیلئے دائیں طرف اسکرول کریں</span>
              <span className="text-[10px] font-mono text-blue-600">Scroll sideways</span>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-[#f8fafc] text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider z-10 whitespace-nowrap">
                  <tr>
                    <th className="py-3 px-3.5">Date</th>
                    <th className="py-3 px-3">Invoice No</th>
                    <th className="py-3 px-3.5">Customer Name</th>
                    <th className="py-3 px-3 text-right">Total</th>
                    <th className="py-3 px-3 text-right">Discount</th>
                    <th className="py-3 px-3 text-right">VAT/Tax</th>
                    <th className="py-3 px-3 text-right">Grand Total</th>
                    <th className="py-3 px-3 text-right">Paid</th>
                    <th className="py-3 px-3 text-right">Balance</th>
                    <th className="py-3 px-3 text-center">Payment Method</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-slate-400">
                        <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="text-sm font-semibold text-slate-600">No sales transactions found</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Completed sales from Sale POS will appear here automatically.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => {
                      const paid = tx.paymentMethod === 'credit' ? (tx.cashTendered || 0) : tx.grandTotal;
                      const balance = Math.max(0, tx.grandTotal - paid);
                      const isSelected = selectedInvoiceId === tx.invoiceNumber;

                      return (
                        <tr
                          key={tx.invoiceNumber}
                          onClick={() => setSelectedInvoiceId(tx.invoiceNumber)}
                          className={`transition-colors cursor-pointer text-slate-700 ${
                            isSelected
                              ? 'bg-blue-50/80 font-semibold'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-2.5 px-3.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                            {tx.dateTime.split(',')[0]}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#0284c7] whitespace-nowrap">
                            {tx.invoiceNumber}
                          </td>
                          <td className="py-2.5 px-3.5 font-medium whitespace-nowrap">
                            {tx.customerName || 'POS Cash Sales'}
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums">
                            {(tx.subtotal || tx.grandTotal).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums text-slate-500">
                            {(tx.discount || 0).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums text-slate-500">
                            {(tx.taxAmount || 0).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900 tabular-nums">
                            {tx.grandTotal.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-emerald-700">
                            {paid.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-red-600">
                            {balance.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-center uppercase font-bold text-[10px] text-slate-600">
                            {tx.paymentMethod}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                balance === 0
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : paid > 0
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {balance === 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedInvoiceId(tx.invoiceNumber);
                                onSelectInvoiceToPrint(tx);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold inline-flex items-center gap-1 shadow-xs cursor-pointer"
                              title="Print Receipt"
                            >
                              <Printer className="w-3 h-3" />
                              <span>Print</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* TOTAL ROW MATCHING SCREENSHOT 1'S PURPLE/BLUE HIGHLIGHT */}
                {filteredTransactions.length > 0 && (
                  <tfoot className="bg-[#eff6ff] text-slate-900 font-black border-t-2 border-blue-200 text-xs">
                    <tr>
                      <td className="py-3 px-3.5 uppercase tracking-wider text-blue-900 font-black">
                        TOTAL
                      </td>
                      <td className="py-3 px-3"></td>
                      <td className="py-3 px-3.5"></td>
                      <td className="py-3 px-3 text-right tabular-nums text-blue-900">
                        {tableTotals.totalGross.toFixed(0)}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-blue-900">
                        {tableTotals.totalDiscount.toFixed(0)}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-blue-900">
                        {tableTotals.totalTax.toFixed(0)}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-blue-950 text-sm">
                        {tableTotals.totalGrand.toFixed(0)}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-emerald-800">
                        {tableTotals.totalPaid.toFixed(0)}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-red-700">
                        {tableTotals.totalBalance.toFixed(0)}
                      </td>
                      <td className="py-3 px-3 text-center tabular-nums text-slate-500">
                        {filteredTransactions.length}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[11px] text-blue-900 whitespace-nowrap">
                        Closing: {tableTotals.totalPaid.toFixed(0)}
                      </td>
                      <td className="py-3 px-3"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* BOTTOM CASH SUMMARY STRIP MATCHING SCREENSHOT 1 (ALWAYS VISIBLE ABOVE NAV) */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-slate-600 font-bold">
            <span>
              Total Invoices: <strong className="text-slate-900">{filteredTransactions.length}</strong>
            </span>
            <span>·</span>
            <span>
              Total Customers: <strong className="text-slate-900">{tableTotals.customerCount}</strong>
            </span>
            <span>·</span>
            <span>
              Total Amount: <strong className="text-emerald-700">{formatRs(tableTotals.totalGrand)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold text-slate-700">
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <Banknote className="w-3.5 h-3.5 text-emerald-600" />
              <span>Opening Cash:</span>
              <span className="font-mono text-slate-900">0</span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-emerald-950 font-black">
              <span>Closing Cash:</span>
              <span className="font-mono">{tableTotals.totalPaid.toFixed(0)}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  ) : (
        /* ============================================================== */
        /* INVENTORY & NEGATIVE STOCK REPORT VIEW                        */
        /* ============================================================== */
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search stock by name, barcode or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setNegativeStockOnlyFilter(!negativeStockOnlyFilter)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                  negativeStockOnlyFilter
                    ? 'bg-red-600 text-white border-red-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <AlertTriangle className={`w-3.5 h-3.5 ${negativeStockOnlyFilter ? 'text-white' : 'text-red-500'}`} />
                <span>Show Negative Stock Only ({stockReportItems.filter((i) => i.isNegative).length})</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('New Purchase Entry')}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
              >
                + New Purchase Entry
              </button>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Total Tracked Items</span>
              <span className="text-xl font-black text-slate-900">{products.length}</span>
            </div>
            <div className="bg-red-50 border border-red-200 p-3.5 rounded-2xl shadow-xs">
              <span className="text-[11px] font-bold text-red-700 uppercase block">Negative Stock Items</span>
              <span className="text-xl font-black text-red-700">
                {stockReportItems.filter((i) => i.isNegative).length}
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Total Sold Units</span>
              <span className="text-xl font-black text-blue-700">
                {stockReportItems.reduce((acc, i) => acc + i.totalSoldQty, 0)}
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Total Purchased Units</span>
              <span className="text-xl font-black text-emerald-700">
                {stockReportItems.reduce((acc, i) => acc + i.totalPurchasedQty, 0)}
              </span>
            </div>
          </div>

          {/* Stock Report Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#005bb5] text-white font-bold text-xs uppercase tracking-wider">
                    <th className="py-3 px-3 text-center w-10">#</th>
                    <th className="py-3 px-3">Product Name</th>
                    <th className="py-3 px-3">Barcode</th>
                    <th className="py-3 px-3 text-center">Category</th>
                    <th className="py-3 px-3 text-right">Purchased</th>
                    <th className="py-3 px-3 text-right">Sold Qty</th>
                    <th className="py-3 px-3 text-center">Current Stock</th>
                    <th className="py-3 px-3 text-center">Condition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStockReportItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                        <p className="font-bold text-slate-600">No matching stock items</p>
                      </td>
                    </tr>
                  ) : (
                    filteredStockReportItems.map((item, index) => (
                      <tr key={item.product.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 text-center font-bold text-slate-500">{index + 1}</td>
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-slate-900">{item.product.name}</p>
                          {item.product.urduName && (
                            <p className="text-[10px] text-slate-400 font-urdu">{item.product.urduName}</p>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{item.product.barcode}</td>
                        <td className="py-2.5 px-3 text-center font-semibold text-slate-600">
                          {item.product.category || 'General'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                          {item.totalPurchasedQty}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-blue-700">
                          {item.totalSoldQty}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {item.isNegative ? (
                            <span className="inline-flex items-center gap-1 font-black text-red-700 bg-red-100 border border-red-300 px-2 py-0.5 rounded-full text-xs shadow-2xs">
                              <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
                              <span>{item.currentStock} (Negative)</span>
                            </span>
                          ) : (
                            <span className="font-black text-slate-800">{item.currentStock}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {item.isNegative ? (
                            <span className="text-[10px] font-black uppercase text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                              Negative Stock
                            </span>
                          ) : item.currentStock === 0 ? (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              Out of Stock
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                              In Stock
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

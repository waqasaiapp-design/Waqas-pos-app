import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar,
  Save,
  Download,
  Printer,
  RotateCcw,
  Plus,
  HelpCircle,
  FileSpreadsheet,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { DailyHisabRow, DailyHisabMonthRecord, SaleTransaction, PurchaseTransaction, CustomerLedgerEntry } from '../types/pos';
import { formatRs } from '../data/defaultProducts';
import { WaqasBrandingCard } from './WaqasBrandingCard';
import { FullScreenPageHeader } from './FullScreenPageHeader';

interface DailyHisabExcelPageProps {
  transactions: SaleTransaction[];
  purchases: PurchaseTransaction[];
  customerLedgerEntries: CustomerLedgerEntry[];
  onNavigateToSummary?: () => void;
  onNavigateToLedgers?: () => void;
  onRecordRecovery?: (dateIso: string) => void;
  onBackToHome?: () => void;
}

const STORAGE_KEY_HISAB = 'waqas_mart_daily_hisab_v2';

export const DailyHisabExcelPage: React.FC<DailyHisabExcelPageProps> = ({
  transactions,
  purchases,
  customerLedgerEntries,
  onNavigateToSummary,
  onNavigateToLedgers,
  onBackToHome,
}) => {
  // Current active year and month (default to October 2026 to match reference or current year/month)
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(10); // 1-12 (10 = October)
  const [initialOpeningCash, setInitialOpeningCash] = useState<number>(25320); // First day initial opening cash default from screenshot

  const monthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  // Month navigation labels
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const activeMonthName = monthNames[selectedMonth - 1];

  // Saved overrides from localStorage
  const [savedRecords, setSavedRecords] = useState<Record<string, Record<string, Partial<DailyHisabRow>>>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_HISAB);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to load Daily Hisab data:', e);
    }
    return {};
  });

  // Cell currently being edited: { dateIso, field }
  const [activeCell, setActiveCell] = useState<{ dateIso: string; field: keyof DailyHisabRow } | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [selectedRowDate, setSelectedRowDate] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // Quick save to localStorage
  const persistChanges = (updated: Record<string, Record<string, Partial<DailyHisabRow>>>) => {
    setSavedRecords(updated);
    try {
      localStorage.setItem(STORAGE_KEY_HISAB, JSON.stringify(updated));
      setSaveSuccessMsg('All spreadsheet rows saved successfully!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  };

  // Days in selected month
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 0).getDate();
  }, [selectedYear, selectedMonth]);

  // Aggregate automated values from real business transactions
  const autoDataByDate = useMemo(() => {
    const map: Record<string, {
      dailySale: number;
      dailyPurchase: number;
      dailyCredit: number;
      dailyRecovery: number;
    }> = {};

    // 1. Sales
    for (const tx of transactions) {
      // Parse ISO date from transaction dateTime (e.g. "24 Oct 2026, 01:25 pm" or standard date)
      let dIso = '';
      try {
        const parsed = new Date(tx.dateTime);
        if (!isNaN(parsed.getTime())) {
          dIso = parsed.toISOString().split('T')[0];
        }
      } catch {
        // fallback
      }

      if (!dIso) {
        // Check if date format has dd/mm/yyyy
        const parts = tx.dateTime.split(',')[0].trim().split(' ');
        if (parts.length >= 3) {
          const day = parts[0].padStart(2, '0');
          const mIdx = monthNames.findIndex((m) => m.toLowerCase().startsWith(parts[1].toLowerCase().slice(0, 3)));
          const yr = parts[2];
          if (mIdx >= 0) {
            dIso = `${yr}-${String(mIdx + 1).padStart(2, '0')}-${day}`;
          }
        }
      }

      if (dIso) {
        if (!map[dIso]) {
          map[dIso] = { dailySale: 0, dailyPurchase: 0, dailyCredit: 0, dailyRecovery: 0 };
        }
        map[dIso].dailySale += tx.grandTotal || 0;
        if (tx.paymentMethod === 'credit') {
          const paidCash = tx.cashTendered || 0;
          const unpaid = Math.max(0, tx.grandTotal - paidCash);
          map[dIso].dailyCredit += unpaid;
        }
      }
    }

    // 2. Purchases
    for (const p of purchases) {
      const dIso = p.purchaseDate; // YYYY-MM-DD
      if (dIso) {
        if (!map[dIso]) {
          map[dIso] = { dailySale: 0, dailyPurchase: 0, dailyCredit: 0, dailyRecovery: 0 };
        }
        map[dIso].dailyPurchase += p.grandTotal || 0;
      }
    }

    // 3. Customer recovery entries
    for (const le of customerLedgerEntries) {
      if (le.debit > 0) {
        const dIso = le.date.includes('-') ? le.date : (() => {
          const parts = le.date.split('/');
          if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
          return '';
        })();
        if (dIso) {
          if (!map[dIso]) {
            map[dIso] = { dailySale: 0, dailyPurchase: 0, dailyCredit: 0, dailyRecovery: 0 };
          }
          map[dIso].dailyRecovery += le.debit;
        }
      }
    }

    return map;
  }, [transactions, purchases, customerLedgerEntries]);

  // Compute all rows for the month with sequential Opening & Closing Cash
  const computedRows: DailyHisabRow[] = useMemo(() => {
    const rows: DailyHisabRow[] = [];
    const monthOverrides = savedRecords[monthKey] || {};

    let runningClosingCash = initialOpeningCash;

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = String(day).padStart(2, '0');
      const mStr = String(selectedMonth).padStart(2, '0');
      const dateDisplay = `${dayStr}/${mStr}/${selectedYear}`;
      const dateIso = `${selectedYear}-${mStr}-${dayStr}`;

      const saved = monthOverrides[dateIso] || {};
      const auto = autoDataByDate[dateIso] || {
        dailySale: 0,
        dailyPurchase: 0,
        dailyCredit: 0,
        dailyRecovery: 0,
      };

      // 1. Opening Cash
      let openingCash = runningClosingCash;
      let isOpeningCashManual = false;

      if (day === 1) {
        if (saved.openingCash !== undefined) {
          openingCash = Number(saved.openingCash) || 0;
          isOpeningCashManual = true;
        } else {
          openingCash = initialOpeningCash;
        }
      } else {
        if (saved.openingCash !== undefined && saved.isOpeningCashManual) {
          openingCash = Number(saved.openingCash) || 0;
          isOpeningCashManual = true;
        } else {
          openingCash = runningClosingCash;
        }
      }

      // 2. Financial columns (Use manual user input if entered, else auto from DB)
      const dailySale = saved.dailySale !== undefined ? Number(saved.dailySale) : auto.dailySale;
      const dailyPurchase = saved.dailyPurchase !== undefined ? Number(saved.dailyPurchase) : auto.dailyPurchase;
      const dailyExtra = saved.dailyExtra !== undefined ? Number(saved.dailyExtra) : 0;
      const dailyCredit = saved.dailyCredit !== undefined ? Number(saved.dailyCredit) : auto.dailyCredit;
      const dailyRecovery = saved.dailyRecovery !== undefined ? Number(saved.dailyRecovery) : auto.dailyRecovery;
      const dailyKitchen = saved.dailyKitchen !== undefined ? Number(saved.dailyKitchen) : 0;
      const dailyExpenses = saved.dailyExpenses !== undefined ? Number(saved.dailyExpenses) : 0;
      const details = saved.details !== undefined ? String(saved.details) : '';

      // 3. Closing Cash Accounting Formula specified by user:
      // Closing Cash = Opening Cash + Cash Sales + Daily Extra + Daily Recovery − Daily Purchase − Daily Kitchen − Daily Expenses
      // Cash Sales = Daily Sale − Daily Credit
      const cashSale = Math.max(0, dailySale - dailyCredit);
      const calculatedClosing =
        openingCash +
        cashSale +
        dailyExtra +
        dailyRecovery -
        dailyPurchase -
        dailyKitchen -
        dailyExpenses;

      const closingCash = saved.closingCash !== undefined && saved.isEditedByUser
        ? Number(saved.closingCash)
        : calculatedClosing;

      // Update running closing cash for next day's opening
      runningClosingCash = closingCash;

      rows.push({
        date: dateDisplay,
        dateIso,
        openingCash,
        isOpeningCashManual,
        dailySale,
        dailyPurchase,
        dailyExtra,
        dailyCredit,
        dailyRecovery,
        dailyKitchen,
        dailyExpenses,
        details,
        closingCash,
        isEditedByUser: saved.isEditedByUser || false,
      });
    }

    return rows;
  }, [selectedYear, selectedMonth, daysInMonth, initialOpeningCash, savedRecords, monthKey, autoDataByDate]);

  // Compute Totals for the bottom Purple/Blue row
  const totals = useMemo(() => {
    let totalSale = 0;
    let totalPurchase = 0;
    let totalExtra = 0;
    let totalCredit = 0;
    let totalRecovery = 0;
    let totalKitchen = 0;
    let totalExpenses = 0;

    for (const r of computedRows) {
      totalSale += r.dailySale;
      totalPurchase += r.dailyPurchase;
      totalExtra += r.dailyExtra;
      totalCredit += r.dailyCredit;
      totalRecovery += r.dailyRecovery;
      totalKitchen += r.dailyKitchen;
      totalExpenses += r.dailyExpenses;
    }

    const firstOpening = computedRows.length > 0 ? computedRows[0].openingCash : 0;
    const finalClosing = computedRows.length > 0 ? computedRows[computedRows.length - 1].closingCash : 0;

    return {
      totalSale,
      totalPurchase,
      totalExtra,
      totalCredit,
      totalRecovery,
      totalKitchen,
      totalExpenses,
      firstOpening,
      finalClosing,
    };
  }, [computedRows]);

  // Handle cell edit
  const handleCellChange = (dateIso: string, field: keyof DailyHisabRow, value: string) => {
    const monthOverrides = { ...(savedRecords[monthKey] || {}) };
    const rowOverride = { ...(monthOverrides[dateIso] || {}) };

    if (field === 'details') {
      rowOverride.details = value;
    } else {
      const num = value.trim() === '' ? 0 : parseFloat(value) || 0;
      (rowOverride as any)[field] = num;

      if (field === 'openingCash') {
        rowOverride.isOpeningCashManual = true;
      }
    }

    rowOverride.isEditedByUser = true;
    monthOverrides[dateIso] = rowOverride;

    const nextSaved = {
      ...savedRecords,
      [monthKey]: monthOverrides,
    };

    persistChanges(nextSaved);
  };

  // Reset current month overrides back to purely automated state
  const handleResetMonth = () => {
    if (window.confirm(`Reset manual edits for ${activeMonthName} ${selectedYear} and recalculate automatically?`)) {
      const nextSaved = { ...savedRecords };
      delete nextSaved[monthKey];
      persistChanges(nextSaved);
    }
  };

  // Export to Excel CSV
  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Opening Cash',
      'Daily Sale',
      'Daily Purchase',
      'Daily Extra',
      'Daily Credit',
      'Daily Recovery',
      'Daily Kitchen',
      'Daily Expenses',
      'Details',
      'Closing Cash',
    ];

    const rows = computedRows.map((r) => [
      r.date,
      r.openingCash,
      r.dailySale,
      r.dailyPurchase,
      r.dailyExtra,
      r.dailyCredit,
      r.dailyRecovery,
      r.dailyKitchen,
      r.dailyExpenses,
      `"${(r.details || '').replace(/"/g, '""')}"`,
      r.closingCash,
    ]);

    const totalRow = [
      'TOTAL',
      totals.firstOpening,
      totals.totalSale,
      totals.totalPurchase,
      totals.totalExtra,
      totals.totalCredit,
      totals.totalRecovery,
      totals.totalKitchen,
      totals.totalExpenses,
      `"Final Closing: ${totals.finalClosing}"`,
      totals.finalClosing,
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(',')), totalRow.join(',')].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Waqas_Mart_Daily_Hisab_${monthKey}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Month navigation
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  // Generate wide array of years up to 3000
  const availableYears = useMemo(() => {
    const list: number[] = [];
    // Standard years 2020 through 2050
    for (let y = 2020; y <= 2050; y++) {
      list.push(y);
    }
    // Milestone decades and centuries up to year 3000
    const milestones = [
      2060, 2070, 2080, 2090, 2100, 2150, 2200, 2250, 2300, 2400, 2500, 2600, 2700, 2800, 2900, 3000,
    ];
    for (const m of milestones) {
      if (!list.includes(m)) list.push(m);
    }
    // Ensure selectedYear is always in the dropdown list if set by user
    if (!list.includes(selectedYear) && selectedYear >= 1900 && selectedYear <= 3000) {
      list.push(selectedYear);
      list.sort((a, b) => a - b);
    }
    return list;
  }, [selectedYear]);

  // Robust Print Handler using hidden printable iframe to prevent cutoff and layout clipping
  const handlePrintDailyHisab = () => {
    try {
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';
      document.body.appendChild(printFrame);

      const rowsHtml = computedRows.map((r, idx) => {
        const isOdd = idx % 2 === 1;
        return `
          <tr style="background-color: ${isOdd ? '#f8fafc' : '#ffffff'};">
            <td style="border:1px solid #334155; padding:4px 6px; text-align:center; font-weight:600;">${r.date}</td>
            <td style="border:1px solid #334155; padding:4px 6px; text-align:right; font-family:monospace;">${r.openingCash.toFixed(0)}</td>
            <td style="border:1px solid #334155; padding:4px 6px; text-align:right; font-family:monospace; font-weight:700;">${r.dailySale > 0 ? r.dailySale.toFixed(0) : '-'}</td>
            <td style="border:1px solid #334155; padding:4px 6px; text-align:right; font-family:monospace;">${r.dailyPurchase > 0 ? r.dailyPurchase.toFixed(0) : '-'}</td>
            <td style="border:1px solid #334155; padding:4px 6px; text-align:right; font-family:monospace;">${r.dailyExtra > 0 ? r.dailyExtra.toFixed(0) : '-'}</td>
            <td style="border:1px solid #334155; padding:4px 6px; text-align:right; font-family:monospace; color:#b91c1c;">${r.dailyCredit > 0 ? r.dailyCredit.toFixed(0) : '-'}</td>
            <td style="border:1px solid #334155; padding:4px 6px; text-align:right; font-family:monospace; color:#15803d;">${r.dailyRecovery > 0 ? r.dailyRecovery.toFixed(0) : '-'}</td>
            <td style="border:1px solid #334155; padding:4px 6px; text-align:right; font-family:monospace;">${r.dailyKitchen > 0 ? r.dailyKitchen.toFixed(0) : '-'}</td>
            <td style="border:1px solid #334155; padding:4px 6px; text-align:right; font-family:monospace;">${r.dailyExpenses > 0 ? r.dailyExpenses.toFixed(0) : '-'}</td>
            <td style="border:1px solid #334155; padding:4px 6px; text-align:left; font-size:10px;">${r.details || '-'}</td>
            <td style="border:1px solid #334155; padding:4px 6px; text-align:right; font-family:monospace; font-weight:700;">${r.closingCash.toFixed(0)}</td>
          </tr>
        `;
      }).join('');

      const content = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Waqas Mart - Daily Hisab ${activeMonthName} ${selectedYear}</title>
          <style>
            @page { size: A4 landscape; margin: 8mm; }
            * { box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; padding: 12px; font-size: 11px; color: #0f172a; }
            .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 10px; }
            .title { font-size: 20px; font-weight: 900; color: #16a34a; margin: 0; }
            .subtitle { font-size: 13px; font-weight: 700; color: #1e293b; margin-top: 2px; }
            .meta { text-align: right; font-size: 11px; color: #475569; }
            .stats-bar { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; margin-bottom: 10px; text-align: center; }
            .stat-box { border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 6px; background: #f8fafc; }
            .stat-label { font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 700; }
            .stat-val { font-size: 12px; font-weight: 800; font-family: monospace; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
            th { background-color: #f1f5f9; border: 1px solid #334155; padding: 5px 6px; text-align: center; font-weight: 800; }
            .total-row { background-color: #3730a3 !important; color: #ffffff !important; font-weight: 800; font-family: monospace; }
            .total-row td { border: 1px solid #3730a3; padding: 6px; }
            .formula { margin-top: 8px; font-size: 9.5px; color: #475569; font-style: italic; }
            .signatures { display: flex; justify-content: space-between; margin-top: 30px; padding: 0 40px; }
            .sig-box { width: 160px; border-top: 1px solid #334155; text-align: center; padding-top: 4px; font-size: 11px; font-weight: 700; color: #1e293b; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">WAQAS MART (وقاص مارٹ)</div>
              <div class="subtitle">Monthly Business Hisab Bill & Register (ماہانہ کاروباری حساب بل برائے اونر / مالک) — ${activeMonthName} ${selectedYear}</div>
            </div>
            <div class="meta">
              <div><strong>Printed:</strong> ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              <div><strong>Initial Cash:</strong> Rs. ${totals.firstOpening.toFixed(0)}</div>
              <div><strong>Final Closing:</strong> Rs. ${totals.finalClosing.toFixed(0)}</div>
            </div>
          </div>

          <div class="stats-bar">
            <div class="stat-box"><div class="stat-label">Opening Cash</div><div class="stat-val">${totals.firstOpening.toFixed(0)}</div></div>
            <div class="stat-box"><div class="stat-label">Total Sales</div><div class="stat-val" style="color:#16a34a;">${totals.totalSale.toFixed(0)}</div></div>
            <div class="stat-box"><div class="stat-label">Total Purchases</div><div class="stat-val" style="color:#2563eb;">${totals.totalPurchase.toFixed(0)}</div></div>
            <div class="stat-box"><div class="stat-label">Total Udhar (Credit)</div><div class="stat-val" style="color:#dc2626;">${totals.totalCredit.toFixed(0)}</div></div>
            <div class="stat-box"><div class="stat-label">Total Recovery</div><div class="stat-val" style="color:#16a34a;">${totals.totalRecovery.toFixed(0)}</div></div>
            <div class="stat-box"><div class="stat-label">Final Closing Cash</div><div class="stat-val" style="color:#3730a3;">${totals.finalClosing.toFixed(0)}</div></div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Opening Cash</th>
                <th>Daily Sale</th>
                <th>Daily Purchase</th>
                <th>Daily Extra</th>
                <th>Daily Credit</th>
                <th>Daily Recovery</th>
                <th>Daily Kitchen</th>
                <th>Daily Expenses</th>
                <th>Details</th>
                <th>Closing Cash</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td style="text-align:center;">TOTAL</td>
                <td style="text-align:right;">${totals.firstOpening.toFixed(0)}</td>
                <td style="text-align:right;">${totals.totalSale.toFixed(0)}</td>
                <td style="text-align:right;">${totals.totalPurchase.toFixed(0)}</td>
                <td style="text-align:right;">${totals.totalExtra.toFixed(0)}</td>
                <td style="text-align:right;">${totals.totalCredit.toFixed(0)}</td>
                <td style="text-align:right;">${totals.totalRecovery.toFixed(0)}</td>
                <td style="text-align:right;">${totals.totalKitchen.toFixed(0)}</td>
                <td style="text-align:right;">${totals.totalExpenses.toFixed(0)}</td>
                <td style="text-align:left; font-size:10px;">Net Period Flow</td>
                <td style="text-align:right;">${totals.finalClosing.toFixed(0)}</td>
              </tr>
            </tfoot>
          </table>

          <div class="formula">
            * Accounting Formula: Closing Cash = Opening Cash + (Daily Sale - Daily Credit) + Daily Extra + Daily Recovery - Daily Purchase - Daily Kitchen - Daily Expenses
          </div>

          <div class="signatures">
            <div class="sig-box">Prepared By (Cashier)</div>
            <div class="sig-box">Verified By (Accountant)</div>
            <div class="sig-box">Approved By (Proprietor)</div>
          </div>
        </body>
        </html>
      `;

      const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(content);
        frameDoc.close();
        setTimeout(() => {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();
          setTimeout(() => {
            if (document.body.contains(printFrame)) {
              document.body.removeChild(printFrame);
            }
          }, 4000);
        }, 500);
      }
    } catch (err) {
      console.error('Print failed, falling back to window.print():', err);
      window.print();
    }
  };

  return (
    <div className="flex-1 w-full min-h-full bg-[#f1f5f9] text-slate-900 font-sans flex flex-col">
      {/* Universal Fullscreen Header with Back/Exit & Fullscreen Toggle */}
      <FullScreenPageHeader
        title="Daily Hisab Register"
        urduTitle="روزانہ حساب کھاتہ رجسٹر"
        icon={<FileSpreadsheet className="w-5 h-5 text-white" />}
        onBackToHome={() => {
          if (onBackToHome) onBackToHome();
          else if (onNavigateToSummary) onNavigateToSummary();
        }}
        badge={`${activeMonthName} ${selectedYear}`}
        badgeColor="bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
        actions={
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handlePrintDailyHisab}
              className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-white" />
              <span>Print Month Bill (پرنٹ ماہانہ بل)</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">CSV Export</span>
            </button>
          </div>
        }
      />

      <div className="flex-1 min-h-0 p-3 sm:p-5 lg:p-6 w-full space-y-3 overflow-y-auto">
        {/* WAQAS MART Dual Profile Cards */}
        <WaqasBrandingCard variant="banner" />

      {/* 1. TOP EXCEL-STYLE CONTROL RIBBON */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Page Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              <FileSpreadsheet className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Daily Hisab (روزانہ حساب کھاتہ)
                </h1>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-300">
                  Excel Spreadsheet
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Full editing with automated closing formula: Opening + (Sale − Credit) + Extra + Recovery − Purchase − Kitchen − Expenses
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {onNavigateToSummary && (
              <button
                type="button"
                onClick={onNavigateToSummary}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Sale Summary Analytics</span>
              </button>
            )}

            {onNavigateToLedgers && (
              <button
                type="button"
                onClick={onNavigateToLedgers}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Customer Udhar Ledgers</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Download Excel CSV Spreadsheet"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>

            {/* Robust Print Buttons: Quick Direct Print & Print Preview Modal */}
            <button
              type="button"
              onClick={handlePrintDailyHisab}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Print Daily Hisab Register Sheet"
            >
              <Printer className="w-3.5 h-3.5 text-slate-700" />
              <span>Print Sheet (پرنٹ کریں)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold flex items-center gap-1 transition-colors cursor-pointer text-[11px]"
              title="Open Printable Preview Modal"
            >
              <span>Preview</span>
            </button>

            <button
              type="button"
              onClick={handleResetMonth}
              className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset any manual cell overrides for this month"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Auto</span>
            </button>
          </div>
        </div>

        {/* Month Selector & Initial Opening Cash Setup */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Month Navigation */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 font-bold text-sm text-slate-800 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>{activeMonthName} {selectedYear}</span>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold cursor-pointer"
            >
              {monthNames.map((name, idx) => (
                <option key={name} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>

            {/* UNRESTRICTED DYNAMIC YEAR SELECTOR + DIRECT NUMBER INPUT */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Year:</span>
              <input
                type="number"
                min="1990"
                max="3000"
                value={selectedYear}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 1990 && val <= 3000) {
                    setSelectedYear(val);
                  }
                }}
                className="w-16 font-mono font-bold text-xs text-slate-900 text-center bg-slate-50 border border-slate-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                title="Enter Any Year up to 3000"
              />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-white text-xs font-semibold text-slate-700 border-l border-slate-200 pl-1 cursor-pointer focus:outline-none"
                title="Select Year from list (up to 3000)"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Month 1st Day Opening Cash Configuration */}
          <div className="flex items-center gap-2 bg-emerald-50/70 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs">
            <span className="font-bold text-emerald-900">Month Initial Opening Cash:</span>
            <input
              type="number"
              value={initialOpeningCash}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setInitialOpeningCash(val);
                // Also update day 1 if not manually locked
                handleCellChange(`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`, 'openingCash', String(val));
              }}
              className="w-24 px-2 py-0.5 bg-white border border-emerald-300 rounded font-mono font-bold text-emerald-950 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-right"
            />
            <span className="text-[11px] text-emerald-700 font-semibold">Rs.</span>
          </div>

          {/* Success toast badge */}
          {saveSuccessMsg && (
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-100 px-3 py-1 rounded-xl animate-fade-in text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. EXCEL SPREADSHEET TABLE MATCHING USER'S SCREENSHOT EXACTLY */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-md overflow-hidden">
        {/* Spreadsheet Mobile Swipe Notification */}
        <div className="lg:hidden px-3 py-1.5 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-[11px] font-bold flex items-center justify-between">
          <span>👉 دائیں طرف اسکرول کریں اور کسی بھی سیل پر کلک کر کے قیمت تبدیل کریں</span>
          <span className="font-mono text-emerald-700 text-[10px]">Swipe horizontally</span>
        </div>

        <div className="overflow-x-auto max-h-[72vh] overflow-y-auto">
          <table className="w-full text-xs border-collapse border border-slate-300 font-sans">
            {/* EXCEL COLUMN LETTERS (A, B, C, D...) */}
            <thead className="bg-[#f1f5f9] text-slate-500 font-mono text-[10px] text-center select-none sticky top-0 z-20 border-b border-slate-300">
              <tr>
                <th className="w-10 border border-slate-300 bg-[#e2e8f0] py-1 font-bold">#</th>
                <th className="w-28 border border-slate-300 py-1">A</th>
                <th className="w-28 border border-slate-300 py-1">B</th>
                <th className="w-28 border border-slate-300 py-1">C</th>
                <th className="w-28 border border-slate-300 py-1">D</th>
                <th className="w-24 border border-slate-300 py-1">E</th>
                <th className="w-28 border border-slate-300 py-1">F</th>
                <th className="w-28 border border-slate-300 py-1">G</th>
                <th className="w-28 border border-slate-300 py-1">H</th>
                <th className="w-28 border border-slate-300 py-1">I</th>
                <th className="min-w-[160px] border border-slate-300 py-1">J</th>
                <th className="w-32 border border-slate-300 py-1">K</th>
              </tr>

              {/* EXACT COLUMN ORDER REQUESTED BY USER MATCHING SCREENSHOT ROW 6 */}
              <tr className="bg-[#86efac] text-emerald-950 font-black text-[11px] uppercase tracking-wide border-b-2 border-emerald-500">
                <th className="border border-emerald-400 py-2.5 px-2 bg-[#4ade80] text-center text-slate-800">
                  Row
                </th>
                <th className="border border-emerald-400 py-2.5 px-3 text-left whitespace-nowrap">
                  1. Date
                </th>
                <th className="border border-emerald-400 py-2.5 px-3 text-right whitespace-nowrap bg-[#bbf7d0]">
                  2. Opening Cash
                </th>
                <th className="border border-emerald-400 py-2.5 px-3 text-right whitespace-nowrap">
                  3. Daily Sale
                </th>
                <th className="border border-emerald-400 py-2.5 px-3 text-right whitespace-nowrap">
                  4. Daily Purchase
                </th>
                <th className="border border-emerald-400 py-2.5 px-3 text-right whitespace-nowrap">
                  5. Daily Extra
                </th>
                <th className="border border-emerald-400 py-2.5 px-3 text-right whitespace-nowrap">
                  6. Daily Credit
                </th>
                <th className="border border-emerald-400 py-2.5 px-3 text-right whitespace-nowrap">
                  7. Daily Recovery
                </th>
                <th className="border border-emerald-400 py-2.5 px-3 text-right whitespace-nowrap">
                  8. Daily Kitchen
                </th>
                <th className="border border-emerald-400 py-2.5 px-3 text-right whitespace-nowrap">
                  9. Daily Expenses
                </th>
                <th className="border border-emerald-400 py-2.5 px-3 text-left whitespace-nowrap">
                  10. Details
                </th>
                <th className="border border-emerald-400 py-2.5 px-3 text-right whitespace-nowrap bg-[#bbf7d0]">
                  11. Closing Cash
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
              {computedRows.map((row, idx) => {
                const rowNumber = idx + 7; // Matches row numbers in screenshot (Row 7 = 01/10/2026)
                const isSelected = selectedRowDate === row.dateIso;

                return (
                  <tr
                    key={row.dateIso}
                    onClick={() => setSelectedRowDate(row.dateIso)}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-blue-50/90'
                        : idx % 2 === 0
                        ? 'bg-white hover:bg-slate-50'
                        : 'bg-[#fcfdfd] hover:bg-slate-50'
                    }`}
                  >
                    {/* Excel Row Index on Left (e.g. 7, 8, 9...) */}
                    <td className="border border-slate-300 py-1.5 px-2 text-center text-slate-400 bg-[#f8fafc] font-bold select-none text-[10px]">
                      {rowNumber}
                    </td>

                    {/* 1. Date (DD/MM/YYYY) */}
                    <td className="border border-slate-300 py-1.5 px-2.5 text-slate-800 font-medium whitespace-nowrap text-left font-mono">
                      {row.date}
                    </td>

                    {/* 2. Opening Cash (FIRST NUMERIC COLUMN) */}
                    <td className="border border-slate-300 py-1 px-1.5 text-right bg-emerald-50/30">
                      <input
                        type="number"
                        value={row.openingCash === 0 ? '' : row.openingCash}
                        placeholder="0"
                        onChange={(e) => handleCellChange(row.dateIso, 'openingCash', e.target.value)}
                        className={`w-full py-0.5 px-1 text-right bg-transparent border-0 focus:ring-2 focus:ring-emerald-500 rounded font-mono text-[11px] tabular-nums font-semibold ${
                          row.isOpeningCashManual ? 'text-amber-800 font-bold' : 'text-slate-800'
                        }`}
                        title={row.isOpeningCashManual ? 'Manually edited opening cash' : "Carried forward from yesterday's closing cash"}
                      />
                    </td>

                    {/* 3. Daily Sale */}
                    <td className="border border-slate-300 py-1 px-1.5 text-right">
                      <input
                        type="number"
                        value={row.dailySale === 0 ? '' : row.dailySale}
                        placeholder="0"
                        onChange={(e) => handleCellChange(row.dateIso, 'dailySale', e.target.value)}
                        className="w-full py-0.5 px-1 text-right bg-transparent border-0 focus:ring-2 focus:ring-emerald-500 rounded font-mono text-[11px] tabular-nums text-slate-900 font-bold"
                      />
                    </td>

                    {/* 4. Daily Purchase */}
                    <td className="border border-slate-300 py-1 px-1.5 text-right">
                      <input
                        type="number"
                        value={row.dailyPurchase === 0 ? '' : row.dailyPurchase}
                        placeholder="0"
                        onChange={(e) => handleCellChange(row.dateIso, 'dailyPurchase', e.target.value)}
                        className="w-full py-0.5 px-1 text-right bg-transparent border-0 focus:ring-2 focus:ring-emerald-500 rounded font-mono text-[11px] tabular-nums text-blue-900"
                      />
                    </td>

                    {/* 5. Daily Extra */}
                    <td className="border border-slate-300 py-1 px-1.5 text-right">
                      <input
                        type="number"
                        value={row.dailyExtra === 0 ? '' : row.dailyExtra}
                        placeholder="0"
                        onChange={(e) => handleCellChange(row.dateIso, 'dailyExtra', e.target.value)}
                        className="w-full py-0.5 px-1 text-right bg-transparent border-0 focus:ring-2 focus:ring-emerald-500 rounded font-mono text-[11px] tabular-nums text-slate-700"
                      />
                    </td>

                    {/* 6. Daily Credit */}
                    <td className="border border-slate-300 py-1 px-1.5 text-right">
                      <input
                        type="number"
                        value={row.dailyCredit === 0 ? '' : row.dailyCredit}
                        placeholder="0"
                        onChange={(e) => handleCellChange(row.dateIso, 'dailyCredit', e.target.value)}
                        className="w-full py-0.5 px-1 text-right bg-transparent border-0 focus:ring-2 focus:ring-emerald-500 rounded font-mono text-[11px] tabular-nums text-amber-800 font-semibold"
                        title="Credit sales (Udhar given to customers) - Not added to cash"
                      />
                    </td>

                    {/* 7. Daily Recovery */}
                    <td className="border border-slate-300 py-1 px-1.5 text-right">
                      <input
                        type="number"
                        value={row.dailyRecovery === 0 ? '' : row.dailyRecovery}
                        placeholder="0"
                        onChange={(e) => handleCellChange(row.dateIso, 'dailyRecovery', e.target.value)}
                        className="w-full py-0.5 px-1 text-right bg-transparent border-0 focus:ring-2 focus:ring-emerald-500 rounded font-mono text-[11px] tabular-nums text-emerald-800 font-semibold"
                        title="Cash recovery collected against previous customer credit"
                      />
                    </td>

                    {/* 8. Daily Kitchen */}
                    <td className="border border-slate-300 py-1 px-1.5 text-right">
                      <input
                        type="number"
                        value={row.dailyKitchen === 0 ? '' : row.dailyKitchen}
                        placeholder="0"
                        onChange={(e) => handleCellChange(row.dateIso, 'dailyKitchen', e.target.value)}
                        className="w-full py-0.5 px-1 text-right bg-transparent border-0 focus:ring-2 focus:ring-emerald-500 rounded font-mono text-[11px] tabular-nums text-orange-900"
                      />
                    </td>

                    {/* 9. Daily Expenses */}
                    <td className="border border-slate-300 py-1 px-1.5 text-right">
                      <input
                        type="number"
                        value={row.dailyExpenses === 0 ? '' : row.dailyExpenses}
                        placeholder="0"
                        onChange={(e) => handleCellChange(row.dateIso, 'dailyExpenses', e.target.value)}
                        className="w-full py-0.5 px-1 text-right bg-transparent border-0 focus:ring-2 focus:ring-emerald-500 rounded font-mono text-[11px] tabular-nums text-red-700"
                      />
                    </td>

                    {/* 10. Details (e.g. "electric bill", "peshawar stok builty") */}
                    <td className="border border-slate-300 py-1 px-1.5 text-left font-sans">
                      <input
                        type="text"
                        value={row.details || ''}
                        placeholder="notes / تفصیل..."
                        onChange={(e) => handleCellChange(row.dateIso, 'details', e.target.value)}
                        className="w-full py-0.5 px-1.5 text-left bg-transparent border-0 focus:ring-2 focus:ring-emerald-500 rounded text-[11px] text-slate-800"
                      />
                    </td>

                    {/* 11. Closing Cash (Auto-calculated via formula) */}
                    <td className="border border-slate-300 py-1.5 px-2.5 text-right font-black font-mono text-emerald-950 bg-emerald-50/50 tabular-nums">
                      {row.closingCash.toFixed(0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* 3. TOTAL ROW MATCHING SCREENSHOT'S PURPLE/BLUE BACKGROUND */}
            <tfoot className="sticky bottom-0 z-20 bg-[#3730a3] text-white font-mono font-black text-xs border-t-2 border-indigo-400 select-none">
              <tr>
                <td className="border border-indigo-400 py-2.5 px-2 text-center bg-[#312e81]">
                  Σ
                </td>
                <td className="border border-indigo-400 py-2.5 px-3 uppercase tracking-wider text-amber-200">
                  TOTAL
                </td>
                <td className="border border-indigo-400 py-2.5 px-3 text-right tabular-nums text-indigo-100" title="Initial Month Opening Cash">
                  {totals.firstOpening.toFixed(0)}
                </td>
                <td className="border border-indigo-400 py-2.5 px-3 text-right tabular-nums text-white">
                  {totals.totalSale.toFixed(0)}
                </td>
                <td className="border border-indigo-400 py-2.5 px-3 text-right tabular-nums text-indigo-100">
                  {totals.totalPurchase.toFixed(0)}
                </td>
                <td className="border border-indigo-400 py-2.5 px-3 text-right tabular-nums text-indigo-100">
                  {totals.totalExtra.toFixed(0)}
                </td>
                <td className="border border-indigo-400 py-2.5 px-3 text-right tabular-nums text-amber-300">
                  {totals.totalCredit.toFixed(0)}
                </td>
                <td className="border border-indigo-400 py-2.5 px-3 text-right tabular-nums text-emerald-300">
                  {totals.totalRecovery.toFixed(0)}
                </td>
                <td className="border border-indigo-400 py-2.5 px-3 text-right tabular-nums text-indigo-100">
                  {totals.totalKitchen.toFixed(0)}
                </td>
                <td className="border border-indigo-400 py-2.5 px-3 text-right tabular-nums text-red-300">
                  {totals.totalExpenses.toFixed(0)}
                </td>
                <td className="border border-indigo-400 py-2.5 px-3 text-left font-sans text-[11px] text-indigo-200">
                  Net Period Flow
                </td>
                <td className="border border-indigo-400 py-2.5 px-3 text-right tabular-nums text-emerald-200 text-sm">
                  {totals.finalClosing.toFixed(0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* BOTTOM EXCEL STATUS STRIP MATCHING SCREENSHOT BOTTOM TABS */}
        <div className="bg-[#e2e8f0] px-3 py-2 border-t border-slate-300 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700">
          <div className="flex items-center gap-2 overflow-x-auto py-0.5">
            <span className="font-bold text-slate-500 uppercase text-[10px]">Workbook Sheets:</span>
            <span className="bg-white px-2.5 py-0.5 rounded shadow-xs font-bold text-emerald-800 border border-slate-300">
              Daily Hisab ({activeMonthName})
            </span>
            {onNavigateToLedgers && (
              <button
                type="button"
                onClick={onNavigateToLedgers}
                className="bg-slate-200 hover:bg-slate-300 px-2.5 py-0.5 rounded font-medium text-slate-700 cursor-pointer"
              >
                Customer Udhar Ledgers
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <span>Month Initial: <strong className="font-mono text-slate-900">{totals.firstOpening.toFixed(0)}</strong></span>
            <span>·</span>
            <span>Total Sales: <strong className="font-mono text-emerald-800">{totals.totalSale.toFixed(0)}</strong></span>
            <span>·</span>
            <span>Total Purchases: <strong className="font-mono text-blue-900">{totals.totalPurchase.toFixed(0)}</strong></span>
            <span>·</span>
            <span>Final Closing: <strong className="font-mono text-emerald-700">{totals.finalClosing.toFixed(0)}</strong></span>
          </div>
        </div>
      </div>

      {/* PRINT PREVIEW MODAL */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base tracking-tight">
                    Print Daily Hisab Register (روزانہ کھاتہ پرنٹ پیش نظارہ)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {activeMonthName} {selectedYear} · Complete Landscape A4 Spreadsheet
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintDailyHisab}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Now (پرنٹ کریں)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Printable Document Preview */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-100">
              <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm text-slate-900 max-w-full overflow-x-auto text-[11px] font-sans">
                {/* Official Sheet Header */}
                <div className="flex items-end justify-between border-b-2 border-slate-900 pb-3 mb-3">
                  <div>
                    <h1 className="text-2xl font-black text-emerald-700 tracking-tight">WAQAS MART (وقاص مارٹ)</h1>
                    <h2 className="text-sm font-bold text-slate-800">
                      Monthly Business Hisab Bill & Register (ماہانہ کاروباری حساب بل برائے اونر / مالک) — {activeMonthName} {selectedYear}
                    </h2>
                    <p className="text-[10px] text-slate-500">Supermarket Retail POS & Ledger Management System</p>
                  </div>
                  <div className="text-right text-[10px] text-slate-600 space-y-0.5">
                    <div><strong>Printed On:</strong> {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div><strong>Initial Month Cash:</strong> Rs. {totals.firstOpening.toFixed(0)}</div>
                    <div><strong>Final Month Closing:</strong> Rs. {totals.finalClosing.toFixed(0)}</div>
                  </div>
                </div>

                {/* Printable Stats Cards */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3 text-center">
                  <div className="border border-slate-200 rounded p-1.5 bg-slate-50">
                    <span className="text-[9px] uppercase text-slate-500 font-bold block">Opening Cash</span>
                    <span className="font-mono font-bold text-slate-900 text-xs">{totals.firstOpening.toFixed(0)}</span>
                  </div>
                  <div className="border border-emerald-200 rounded p-1.5 bg-emerald-50/50">
                    <span className="text-[9px] uppercase text-emerald-800 font-bold block">Total Sales</span>
                    <span className="font-mono font-bold text-emerald-700 text-xs">{totals.totalSale.toFixed(0)}</span>
                  </div>
                  <div className="border border-blue-200 rounded p-1.5 bg-blue-50/50">
                    <span className="text-[9px] uppercase text-blue-800 font-bold block">Total Purchases</span>
                    <span className="font-mono font-bold text-blue-700 text-xs">{totals.totalPurchase.toFixed(0)}</span>
                  </div>
                  <div className="border border-red-200 rounded p-1.5 bg-red-50/50">
                    <span className="text-[9px] uppercase text-red-800 font-bold block">Total Udhar</span>
                    <span className="font-mono font-bold text-red-700 text-xs">{totals.totalCredit.toFixed(0)}</span>
                  </div>
                  <div className="border border-green-200 rounded p-1.5 bg-green-50/50">
                    <span className="text-[9px] uppercase text-green-800 font-bold block">Total Recovery</span>
                    <span className="font-mono font-bold text-green-700 text-xs">{totals.totalRecovery.toFixed(0)}</span>
                  </div>
                  <div className="border border-indigo-200 rounded p-1.5 bg-indigo-50/50">
                    <span className="text-[9px] uppercase text-indigo-900 font-bold block">Closing Cash</span>
                    <span className="font-mono font-bold text-indigo-900 text-xs">{totals.finalClosing.toFixed(0)}</span>
                  </div>
                </div>

                {/* Full Printable Table */}
                <table className="w-full border-collapse border border-slate-400 text-[10.5px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold text-center">
                      <th className="border border-slate-400 p-1">Date</th>
                      <th className="border border-slate-400 p-1">Opening</th>
                      <th className="border border-slate-400 p-1">Daily Sale</th>
                      <th className="border border-slate-400 p-1">Purchase</th>
                      <th className="border border-slate-400 p-1">Extra</th>
                      <th className="border border-slate-400 p-1">Credit</th>
                      <th className="border border-slate-400 p-1">Recovery</th>
                      <th className="border border-slate-400 p-1">Kitchen</th>
                      <th className="border border-slate-400 p-1">Expenses</th>
                      <th className="border border-slate-400 p-1">Details</th>
                      <th className="border border-slate-400 p-1">Closing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {computedRows.map((r, idx) => (
                      <tr key={r.dateIso} className={idx % 2 === 1 ? 'bg-slate-50/80' : 'bg-white'}>
                        <td className="border border-slate-400 p-1 text-center font-medium font-mono">{r.date}</td>
                        <td className="border border-slate-400 p-1 text-right font-mono">{r.openingCash.toFixed(0)}</td>
                        <td className="border border-slate-400 p-1 text-right font-mono font-bold">{r.dailySale > 0 ? r.dailySale.toFixed(0) : '-'}</td>
                        <td className="border border-slate-400 p-1 text-right font-mono">{r.dailyPurchase > 0 ? r.dailyPurchase.toFixed(0) : '-'}</td>
                        <td className="border border-slate-400 p-1 text-right font-mono">{r.dailyExtra > 0 ? r.dailyExtra.toFixed(0) : '-'}</td>
                        <td className="border border-slate-400 p-1 text-right font-mono text-red-700 font-semibold">{r.dailyCredit > 0 ? r.dailyCredit.toFixed(0) : '-'}</td>
                        <td className="border border-slate-400 p-1 text-right font-mono text-emerald-700 font-semibold">{r.dailyRecovery > 0 ? r.dailyRecovery.toFixed(0) : '-'}</td>
                        <td className="border border-slate-400 p-1 text-right font-mono">{r.dailyKitchen > 0 ? r.dailyKitchen.toFixed(0) : '-'}</td>
                        <td className="border border-slate-400 p-1 text-right font-mono text-slate-700">{r.dailyExpenses > 0 ? r.dailyExpenses.toFixed(0) : '-'}</td>
                        <td className="border border-slate-400 p-1 text-left text-[9.5px] max-w-[140px] truncate">{r.details || '-'}</td>
                        <td className="border border-slate-400 p-1 text-right font-mono font-bold bg-emerald-50/30">{r.closingCash.toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#3730a3] text-white font-mono font-bold">
                      <td className="border border-indigo-400 p-1 text-center">TOTAL</td>
                      <td className="border border-indigo-400 p-1 text-right">{totals.firstOpening.toFixed(0)}</td>
                      <td className="border border-indigo-400 p-1 text-right text-amber-200">{totals.totalSale.toFixed(0)}</td>
                      <td className="border border-indigo-400 p-1 text-right">{totals.totalPurchase.toFixed(0)}</td>
                      <td className="border border-indigo-400 p-1 text-right">{totals.totalExtra.toFixed(0)}</td>
                      <td className="border border-indigo-400 p-1 text-right text-amber-300">{totals.totalCredit.toFixed(0)}</td>
                      <td className="border border-indigo-400 p-1 text-right text-emerald-300">{totals.totalRecovery.toFixed(0)}</td>
                      <td className="border border-indigo-400 p-1 text-right">{totals.totalKitchen.toFixed(0)}</td>
                      <td className="border border-indigo-400 p-1 text-right text-red-200">{totals.totalExpenses.toFixed(0)}</td>
                      <td className="border border-indigo-400 p-1 text-left text-[9.5px]">Net Period Flow</td>
                      <td className="border border-indigo-400 p-1 text-right text-emerald-200 text-xs">{totals.finalClosing.toFixed(0)}</td>
                    </tr>
                  </tfoot>
                </table>

                {/* Formula Footer */}
                <div className="mt-2 text-[9px] text-slate-500 italic">
                  * Accounting Formula: Closing Cash = Opening Cash + (Daily Sale − Daily Credit) + Extra + Recovery − Purchase − Kitchen − Expenses
                </div>

                {/* Signatures */}
                <div className="flex justify-between items-center mt-8 px-6 pt-2">
                  <div className="w-36 border-t border-slate-700 text-center text-[10px] font-bold pt-1">
                    Prepared By (Cashier)
                  </div>
                  <div className="w-36 border-t border-slate-700 text-center text-[10px] font-bold pt-1">
                    Verified By (Accountant)
                  </div>
                  <div className="w-36 border-t border-slate-700 text-center text-[10px] font-bold pt-1">
                    Approved By (Owner)
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Action Bar */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 text-xs shrink-0">
              <span className="text-slate-500 font-medium">
                💡 Click "Print Now" to generate print dialog with landscape A4 formatting.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  Close (بند کریں)
                </button>
                <button
                  type="button"
                  onClick={handlePrintDailyHisab}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Now (پرنٹ کریں)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

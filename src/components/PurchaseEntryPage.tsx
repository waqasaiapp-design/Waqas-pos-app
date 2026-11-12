import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FileText,
  Calendar,
  User,
  Search,
  ScanBarcode,
  Package,
  Tag,
  Percent,
  PlusCircle,
  Trash2,
  Banknote,
  Edit,
  Save,
  RotateCcw,
  Printer,
  AlertCircle,
  Plus,
  Eye,
  CheckCircle2,
  X,
  Building2,
  Clock,
  ArrowRight,
  ExternalLink,
  Layers,
  TrendingUp,
  DollarSign,
  Filter,
} from 'lucide-react';
import { Product, Supplier, PurchaseItem, PurchaseTransaction } from '../types/pos';
import { formatRs } from '../data/defaultProducts';
import { sounds } from '../utils/audio';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { AddSupplierModal } from './AddSupplierModal';
import { SearchPurchasesModal } from './SearchPurchasesModal';
import { PrintPurchaseModal } from './PrintPurchaseModal';
import { WaqasBrandingCard } from './WaqasBrandingCard';
import { FullScreenPageHeader } from './FullScreenPageHeader';

interface PurchaseEntryPageProps {
  products: Product[];
  suppliers: Supplier[];
  purchases: PurchaseTransaction[];
  onSavePurchase: (purchase: PurchaseTransaction, isEdit: boolean) => void;
  onDeletePurchase?: (purchaseId: string) => void;
  onDeleteAllPurchases?: () => void;
  onAddSupplier: (supplier: Supplier) => void;
  onOpenAddProduct: () => void;
  onOpenScanner?: () => void;
  onNavigate?: (page: string) => void;
  onBackToHome?: () => void;
}

export const PurchaseEntryPage: React.FC<PurchaseEntryPageProps> = ({
  products,
  suppliers,
  purchases,
  onSavePurchase,
  onDeletePurchase,
  onDeleteAllPurchases,
  onAddSupplier,
  onOpenAddProduct,
  onOpenScanner,
  onNavigate,
  onBackToHome,
}) => {
  // Generate Unique Invoice Number (Format: P-YYYY-MMDD-XXX)
  const generateInvoiceNo = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const seq = String(purchases.length + 1).padStart(3, '0');
    return `P-${yyyy}-${mm}${dd}-${seq}`;
  };

  // State
  const [purchaseInvoiceNo, setPurchaseInvoiceNo] = useState(generateInvoiceNo());
  const [purchaseDate, setPurchaseDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  });
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('');

  // Product Selection & Entry Row
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [entryQty, setEntryQty] = useState<number | ''>(1);
  const [entryCost, setEntryCost] = useState<number | ''>(250);
  const [entrySalePrice, setEntrySalePrice] = useState<number | ''>(320);
  const [entryDiscount, setEntryDiscount] = useState<number | ''>(0);
  const [entryTax, setEntryTax] = useState<number | ''>(0);

  // Purchase Items Table
  const [items, setItems] = useState<PurchaseItem[]>([]);

  // Payment
  const [amountPaid, setAmountPaid] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Bank' | 'Credit'>('Cash');
  const [notes, setNotes] = useState('');

  // Read-Only & Edit Mode Management
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);
  const [originalSavedPurchase, setOriginalSavedPurchase] = useState<PurchaseTransaction | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

  // View Mode Switcher: 'form' (Fresh Blank Purchase Entry / Edit) vs 'details' (Saved 17-field view)
  const [activeTab, setActiveTab] = useState<'details' | 'form'>('form');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(() => (purchases[0]?.id || ''));
  const [selectedRowItem, setSelectedRowItem] = useState<PurchaseItem | null>(null);
  const [showConfirmDeleteAllPurchases, setShowConfirmDeleteAllPurchases] = useState(false);

  // Filters for Saved Invoices View
  const [detailsSearchQuery, setDetailsSearchQuery] = useState('');
  const [detailsSupplierFilter, setDetailsSupplierFilter] = useState('ALL');
  const [detailsDateFrom, setDetailsDateFrom] = useState('');
  const [detailsDateTo, setDetailsDateTo] = useState('');

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isSearchPurchasesOpen, setIsSearchPurchasesOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [currentPrintPurchase, setCurrentPrintPurchase] = useState<PurchaseTransaction | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Filtered saved purchases
  const filteredSavedPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const q = detailsSearchQuery.toLowerCase().trim();
      if (q) {
        const invMatch = (p.purchaseInvoiceNo || '').toLowerCase().includes(q);
        const refMatch = (p.refNo || '').toLowerCase().includes(q);
        const supMatch = (p.supplierName || '').toLowerCase().includes(q);
        const itemMatch = p.items?.some(
          (it) =>
            (it.productName || '').toLowerCase().includes(q) ||
            (it.barcode || '').toLowerCase().includes(q)
        );
        const skuMatch = p.items?.some((it) => {
          const matchProd = products.find((pr) => pr.id === it.productId);
          return (matchProd?.sku || '').toLowerCase().includes(q);
        });
        if (!invMatch && !refMatch && !supMatch && !itemMatch && !skuMatch) return false;
      }
      if (detailsSupplierFilter !== 'ALL' && p.supplierId !== detailsSupplierFilter) return false;
      if (detailsDateFrom && p.purchaseDate < detailsDateFrom) return false;
      if (detailsDateTo && p.purchaseDate > detailsDateTo) return false;
      return true;
    });
  }, [purchases, detailsSearchQuery, detailsSupplierFilter, detailsDateFrom, detailsDateTo, products]);

  // Active purchase for detail view
  const activeDetailPurchase = useMemo(() => {
    if (selectedInvoiceId) {
      const found = purchases.find((p) => p.id === selectedInvoiceId);
      if (found) return found;
    }
    return filteredSavedPurchases[0] || purchases[0] || null;
  }, [purchases, selectedInvoiceId, filteredSavedPurchases]);

  // Stock details panel computation
  const activeStockPanelData = useMemo(() => {
    if (!activeDetailPurchase || !activeDetailPurchase.items || activeDetailPurchase.items.length === 0) {
      return null;
    }
    const it = selectedRowItem || activeDetailPurchase.items[0];
    const matchProd = products.find((pr) => pr.id === it.productId);
    const curStock = matchProd?.stock || 0;
    const addedQty = it.quantity || 0;
    const prevStock = Math.max(0, curStock - addedQty);
    const curPurchasePrice = matchProd?.costPrice || it.purchaseCost;
    const lastPurchasePrice = it.purchaseCost;
    const avgCost = Math.round(((curPurchasePrice + lastPurchasePrice) / 2) * 100) / 100;
    const curSalePrice = matchProd?.price || it.salePrice || 0;
    const stockVal = curStock * curPurchasePrice;

    return {
      productName: it.productName,
      barcode: it.barcode || matchProd?.barcode || 'N/A',
      itemCode: matchProd?.sku || it.productId || 'N/A',
      category: matchProd?.category || 'General',
      curStock,
      prevStock,
      addedQty,
      curPurchasePrice,
      lastPurchasePrice,
      avgCost,
      curSalePrice,
      stockVal,
      imageUrl: it.imageUrl || matchProd?.imageUrl,
    };
  }, [activeDetailPurchase, selectedRowItem, products]);

  // Sync supplier default
  useEffect(() => {
    if (suppliers.length > 0 && !suppliers.some((s) => s.id === selectedSupplierId)) {
      setSelectedSupplierId(suppliers[0].id);
    }
  }, [suppliers]);

  // Flash message
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Calculations
  const subtotal = items.reduce((acc, it) => acc + (it.quantity || 0) * (it.purchaseCost || 0), 0);
  const totalDiscount = items.reduce(
    (acc, it) => acc + ((it.discount || 0) * ((it.quantity || 0) * (it.purchaseCost || 0))) / 100,
    0
  );
  const totalTax = items.reduce(
    (acc, it) => acc + ((it.tax || 0) * ((it.quantity || 0) * (it.purchaseCost || 0))) / 100,
    0
  );
  const grandTotal = Math.max(0, subtotal - totalDiscount + totalTax);

  const paidNum = amountPaid === '' ? grandTotal : Number(amountPaid);
  const remainingBalance = Math.max(0, grandTotal - paidNum);

  // Handle Product Select from Search
  const handleSelectProduct = (prod: Product) => {
    if (isReadOnly && !isEditing) {
      showToast('بل ریڈ اونلی موڈ میں ہے۔ تبدیل کرنے کے لیے Edit Invoice پر کلک کریں۔', 'error');
      return;
    }

    // Auto-add to purchase table directly
    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.productId === prod.id);
      if (existingIdx > -1) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + 1;
        const cost = updated[existingIdx].purchaseCost;
        const disc = updated[existingIdx].discount || 0;
        const tx = updated[existingIdx].tax || 0;
        const newSub = newQty * cost;
        const newDisc = (disc * newSub) / 100;
        const newTx = (tx * newSub) / 100;
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          lineTotal: newSub - newDisc + newTx,
        };
        return updated;
      } else {
        const cost = prod.costPrice || 0;
        const salePr = prod.price || 0;
        const newItem: PurchaseItem = {
          id: `pitem-${Date.now()}-${prod.id}`,
          productId: prod.id,
          productName: prod.name,
          barcode: prod.barcode,
          currentStock: prod.stock,
          quantity: 1,
          purchaseCost: cost,
          salePrice: salePr,
          discount: 0,
          tax: 0,
          lineTotal: cost,
          imageUrl: prod.imageUrl,
        };
        return [...prev, newItem];
      }
    });

    sounds.playBarcodeBeep();
    setSearchQuery('');
    setSelectedProduct(null);
    setHighlightedIndex(null);
    showToast(`Added: ${prod.name} (Qty +1)`, 'success');
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  // Barcode scan handler
  const handleBarcodeDetected = (code: string) => {
    const clean = (code || '').trim().toLowerCase();
    if (!clean) return;

    if (isReadOnly && !isEditing) {
      showToast('بل ریڈ اونلی موڈ میں ہے۔ تبدیل کرنے کے لیے Edit Invoice پر کلک کریں۔', 'error');
      return;
    }

    // Prioritize exact barcode match
    let match = products.find((p) => (p?.barcode || '').toLowerCase() === clean);
    if (!match) {
      match = products.find((p) => (p?.sku || '').toLowerCase() === clean);
    }
    if (!match) {
      match = products.find((p) => (p?.name || '').toLowerCase() === clean);
    }

    if (match) {
      handleSelectProduct(match);
      setIsScannerOpen(false);
    } else {
      sounds.playErrorTone();
      showToast(`Product Not Found — Add New Item (بارکوڈ "${code}" نہیں ملا)`, 'error');
    }
  };

  // Global Hardware USB / Bluetooth Scanner Listener
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') &&
        target !== searchInputRef.current
      ) {
        return;
      }

      const currentTime = Date.now();
      const diff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.length >= 2) {
          e.preventDefault();
          e.stopPropagation();
          handleBarcodeDetected(buffer);
          buffer = '';
        }
      } else if (e.key.length === 1) {
        if (diff > 120) {
          buffer = '';
        }
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [products, isReadOnly, isEditing]);

  // Update item in table
  const handleUpdateItem = (itemId: string, field: 'quantity' | 'purchaseCost' | 'discount' | 'tax', value: number) => {
    if (isReadOnly && !isEditing) return;
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === itemId) {
          const newQty = field === 'quantity' ? Math.max(1, value) : it.quantity;
          const newCost = field === 'purchaseCost' ? Math.max(0, value) : it.purchaseCost;
          const newDisc = field === 'discount' ? Math.max(0, value) : (it.discount || 0);
          const newTx = field === 'tax' ? Math.max(0, value) : (it.tax || 0);
          const itemSub = newQty * newCost;
          const itemDisc = (newDisc * itemSub) / 100;
          const itemTx = (newTx * itemSub) / 100;
          return {
            ...it,
            quantity: newQty,
            purchaseCost: newCost,
            discount: newDisc,
            tax: newTx,
            lineTotal: itemSub - itemDisc + itemTx,
          };
        }
        return it;
      })
    );
  };

  // Remove Item
  const handleRemoveItem = (itemId: string) => {
    if (isReadOnly && !isEditing) return;
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  // 1. SAVE PURCHASE (AND AUTO-START NEW BILL)
  const handleSavePurchase = () => {
    if (isSaving) return;

    if (items.length === 0) {
      showToast('Please add at least one product to the purchase items list!', 'error');
      return;
    }

    const supplier = suppliers.find((s) => s.id === selectedSupplierId);
    if (!supplier) {
      showToast('Please select a valid supplier.', 'error');
      return;
    }

    setIsSaving(true);

    try {
      const transaction: PurchaseTransaction = {
        id: editingPurchaseId || `purch-${Date.now()}`,
        purchaseInvoiceNo,
        purchaseDate,
        supplierId: supplier.id,
        supplierName: supplier.name,
        supplierInvoiceNo: supplierInvoiceNo.trim(),
        items: [...items],
        subtotal,
        totalDiscount,
        totalTax,
        grandTotal,
        amountPaid: paidNum,
        remainingBalance,
        paymentMethod,
        notes: notes.trim() || undefined,
        createdAt: new Date().toLocaleString(),
        status: editingPurchaseId ? 'edited' : 'saved',
      };

      sounds.playSuccessChime();
      onSavePurchase(transaction, Boolean(editingPurchaseId));

      showToast(
        editingPurchaseId
          ? `Purchase #${purchaseInvoiceNo} updated successfully! Locked in Read-Only Mode.`
          : `Purchase #${purchaseInvoiceNo} saved! Stock increased.`,
        'success'
      );

      // Offer to print
      setCurrentPrintPurchase(transaction);

      if (editingPurchaseId) {
        // After Save Changes succeeds, lock the invoice again as required
        handleSelectToView(transaction);
      } else {
        // AUTOMATICALLY RESET TO A FRESH, EMPTY PURCHASE BILL READY FOR NEXT ENTRY (NOT LOCKED)
        handleNewPurchase();
      }
    } catch (err) {
      console.error('[PurchaseEntryPage] Save error:', err);
      showToast('Failed to save purchase. Your data is retained.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // 2. START A BRAND NEW PURCHASE BILL
  const handleNewPurchase = () => {
    setPurchaseInvoiceNo(generateInvoiceNo());
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setSupplierInvoiceNo('');
    setItems([]);
    setAmountPaid('');
    setNotes('');
    setEditingPurchaseId(null);
    setIsReadOnly(false);
    setIsEditing(false);
    setOriginalSavedPurchase(null);
    setSelectedProduct(null);
    setSearchQuery('');
    showToast('New fresh purchase bill opened.', 'info');
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  // 3. LOAD SAVED PURCHASE IN READ-ONLY MODE
  const handleSelectToView = (purch: PurchaseTransaction) => {
    setOriginalSavedPurchase(purch);
    setEditingPurchaseId(purch.id);
    setPurchaseInvoiceNo(purch.purchaseInvoiceNo);
    setPurchaseDate(purch.purchaseDate);
    setSelectedSupplierId(purch.supplierId);
    setSupplierInvoiceNo(purch.supplierInvoiceNo || '');
    setItems(purch.items || []);
    setAmountPaid(purch.amountPaid);
    setPaymentMethod((purch.paymentMethod as any) || 'Cash');
    setNotes(purch.notes || '');
    setIsReadOnly(true);
    setIsEditing(false);
    showToast(`Loaded #${purch.purchaseInvoiceNo} in Read-Only Mode.`, 'info');
  };

  // 4. EXPLICITLY ENABLE EDITING
  const handleStartEditing = () => {
    if (!originalSavedPurchase) return;
    setIsReadOnly(false);
    setIsEditing(true);
    showToast(`Editing enabled for #${purchaseInvoiceNo}. Changes will update existing record.`, 'info');
  };

  // 5. CANCEL EDIT (RESTORE ORIGINAL SAVED INVOICE)
  const handleCancelEdit = () => {
    if (originalSavedPurchase) {
      handleSelectToView(originalSavedPurchase);
      showToast('Editing cancelled. Original saved values restored.', 'info');
    } else {
      handleNewPurchase();
    }
  };

  // Filtered Products for Search Dropdown
  const searchResults = products.filter((p) => {
    const q = (searchQuery || '').toLowerCase().trim();
    if (!q) return false;
    const n = (p?.name || '').toLowerCase();
    const b = (p?.barcode || '').toLowerCase();
    const s = (p?.sku || '').toLowerCase();
    return n.includes(q) || b.includes(q) || s.includes(q);
  });

  return (
    <div className="flex-1 min-h-full w-full bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      <FullScreenPageHeader
        title="Old Purchase Entry"
        subtitle="کلاسیک خریداری و انوینٹری اسٹاک اندراج"
        icon={<FileText className="w-5 h-5 text-indigo-600" />}
        onBackToHome={onBackToHome}
        accentColor="indigo"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSearchPurchasesOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>History ({purchases.length})</span>
            </button>
            <button
              type="button"
              onClick={handleNewPurchase}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Bill (نیا بل)</span>
            </button>
          </div>
        }
      />

      <div className="flex-1 min-h-0 flex flex-col p-3 sm:p-5 lg:p-6 w-full space-y-4 overflow-y-auto">
        {/* Toast Notification */}
        {statusMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-600 text-white'
              : statusMessage.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-blue-600 text-white'
          }`}
        >
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. TOP HEADER & NAVIGATION BAR (WIDE FULL-SCREEN WORKSTATION)   */}
      {/* ============================================================== */}
      <div className="bg-[#071739] text-white rounded-2xl p-4 shadow-md flex flex-wrap items-center justify-between gap-3 border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-inner">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-white">Old Purchase Entry</h2>
              <span className="text-[10px] font-bold bg-white/10 text-blue-200 px-2 py-0.5 rounded-full border border-white/10">
                کلاسیک پرچیز
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Waqas Mart • Stock Inventory & Supplier Ledger System
            </p>
          </div>
        </div>

        {/* Action Controls in Header */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Purchase History Button */}
          <button
            type="button"
            onClick={() => setIsSearchPurchasesOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Clock className="w-4 h-4" />
            <span>Purchase History ({purchases.length})</span>
          </button>

          {/* New Bill Button */}
          <button
            type="button"
            onClick={handleNewPurchase}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Bill / نیا بل</span>
          </button>

          {/* Switch to New Purchase Entry */}
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('New Purchase Entry')}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-white/15"
            >
              <span>Open New Purchase</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* WAQAS MART Dual Profile Cards (Software Owner & Mart Owner) */}
      <WaqasBrandingCard variant="banner" />

      {/* VIEW SWITCHER TABS (Saved Invoices 17-Field Details vs Form) */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-xs max-w-xl">
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'details'
              ? 'bg-[#071739] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-400" />
          <span>Saved Invoices & 17-Field Details ({purchases.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('form')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'form'
              ? 'bg-[#071739] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Edit className="w-4 h-4 text-amber-400" />
          <span>Purchase Entry / Edit Form</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: SAVED PURCHASE INVOICES & 17-FIELD ITEM DETAILS VIEW     */}
      {/* ============================================================== */}
      {activeTab === 'details' && (
        <div className="space-y-4">
          {/* SEARCH & FILTERS BAR */}
          <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={detailsSearchQuery}
                onChange={(e) => setDetailsSearchQuery(e.target.value)}
                placeholder="Search product, barcode, SKU, invoice #, supplier..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-blue-500"
              />
              {detailsSearchQuery && (
                <button
                  type="button"
                  onClick={() => setDetailsSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Supplier Filter */}
            <div className="w-44">
              <select
                value={detailsSupplierFilter}
                onChange={(e) => setDetailsSupplierFilter(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="ALL">All Suppliers ({suppliers.length})</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filters */}
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={detailsDateFrom}
                onChange={(e) => setDetailsDateFrom(e.target.value)}
                className="py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold outline-none"
                title="From Date"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={detailsDateTo}
                onChange={(e) => setDetailsDateTo(e.target.value)}
                className="py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold outline-none"
                title="To Date"
              />
            </div>

            {/* All Delete Purchases Button */}
            {purchases.length > 0 && onDeleteAllPurchases && (
              showConfirmDeleteAllPurchases ? (
                <div className="flex items-center gap-1.5 bg-red-50 p-1 rounded-xl border border-red-200">
                  <span className="text-[11px] font-bold text-red-700">Delete all ({purchases.length})?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteAllPurchases();
                      setShowConfirmDeleteAllPurchases(false);
                    }}
                    className="px-2.5 py-1 text-xs font-black bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer shadow-2xs"
                  >
                    Yes, Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmDeleteAllPurchases(false)}
                    className="px-2 py-1 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowConfirmDeleteAllPurchases(true)}
                  className="py-2 px-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                  title="Delete all purchase records across all pages"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>All Delete ({purchases.length})</span>
                </button>
              )
            )}
          </div>

          {/* INVOICES SELECTOR LIST */}
          {filteredSavedPurchases.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-400">
              <Package className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-700">No purchase invoices found</p>
              <p className="text-xs text-slate-400 mt-1">کوئی پرچیز بل موجود نہیں ہے۔ نیا بل درج کریں۔</p>
              <button
                type="button"
                onClick={() => {
                  handleNewPurchase();
                  setActiveTab('form');
                }}
                className="mt-3 px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                + Create Purchase Bill (نیا پرچیز بل بنائیں)
              </button>
            </div>
          ) : (
            <>
              {/* Invoices Strip */}
              <div className="flex gap-2.5 overflow-x-auto pb-1 select-none">
                {filteredSavedPurchases.map((p) => {
                  const isSelected = activeDetailPurchase?.id === p.id;
                  const isPaid = p.remainingBalance === 0;
                  const isPartial = p.remainingBalance > 0 && p.amountPaid > 0;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedInvoiceId(p.id);
                        setSelectedRowItem(null);
                      }}
                      className={`min-w-[210px] p-3 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#071739] text-white border-blue-400 shadow-md ring-2 ring-blue-500/30'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-mono font-black">{p.purchaseInvoiceNo}</span>
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                            isPaid
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : isPartial
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {isPaid ? 'PAID' : isPartial ? 'PARTIAL' : 'CREDIT'}
                        </span>
                      </div>
                      <div className="text-[11px] font-bold truncate opacity-90">{p.supplierName}</div>
                      <div className="flex items-center justify-between text-[10px] opacity-75 mt-1">
                        <span>{p.purchaseDate}</span>
                        <span>{p.items?.length || 0} items</span>
                      </div>
                      <div className="text-xs font-black mt-1 text-emerald-400">
                        {formatRs(p.grandTotal)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* PRODUCT STOCK DETAILS PANEL (8 METRICS) */}
              {activeStockPanelData && (
                <div className="bg-gradient-to-br from-slate-900 to-[#071739] text-white rounded-2xl p-4 shadow-md border border-white/10 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      {activeStockPanelData.imageUrl ? (
                        <img
                          src={activeStockPanelData.imageUrl}
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover border border-white/20 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 shrink-0">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <div className="font-black text-sm text-white flex items-center gap-2">
                          <span>{activeStockPanelData.productName}</span>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">
                            {activeStockPanelData.category}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300 font-mono">
                          Barcode: {activeStockPanelData.barcode} • Item Code: {activeStockPanelData.itemCode}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-blue-200">
                      Product Stock Details Panel (پروڈکٹ اسٹاک تفصیلی پینل)
                    </span>
                  </div>

                  {/* 8 Grid Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                    {/* 1. Current Available Stock */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-2 text-center">
                      <span className="text-[10px] text-slate-400 font-medium block">Current Stock</span>
                      <span className="text-base font-black text-emerald-400 block mt-0.5">
                        {activeStockPanelData.curStock}
                      </span>
                    </div>

                    {/* 2. Previous Stock Before Purchase */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-2 text-center">
                      <span className="text-[10px] text-slate-400 font-medium block">Prev Stock</span>
                      <span className="text-base font-black text-slate-300 block mt-0.5">
                        {activeStockPanelData.prevStock}
                      </span>
                    </div>

                    {/* 3. Qty Added in this purchase */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-2 text-center">
                      <span className="text-[10px] text-slate-400 font-medium block">Qty Added</span>
                      <span className="text-base font-black text-blue-400 block mt-0.5">
                        +{activeStockPanelData.addedQty}
                      </span>
                    </div>

                    {/* 4. Current Purchase Price */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-2 text-center">
                      <span className="text-[10px] text-slate-400 font-medium block">Purchase Price</span>
                      <span className="text-sm font-black text-yellow-300 block mt-0.5 truncate">
                        {formatRs(activeStockPanelData.curPurchasePrice)}
                      </span>
                    </div>

                    {/* 5. Last Purchase Price */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-2 text-center">
                      <span className="text-[10px] text-slate-400 font-medium block">Last Cost</span>
                      <span className="text-sm font-black text-slate-200 block mt-0.5 truncate">
                        {formatRs(activeStockPanelData.lastPurchasePrice)}
                      </span>
                    </div>

                    {/* 6. Average Purchase Cost */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-2 text-center">
                      <span className="text-[10px] text-slate-400 font-medium block">Avg Cost</span>
                      <span className="text-sm font-black text-cyan-300 block mt-0.5 truncate">
                        {formatRs(activeStockPanelData.avgCost)}
                      </span>
                    </div>

                    {/* 7. Current Sale Price */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-2 text-center">
                      <span className="text-[10px] text-slate-400 font-medium block">Sale Price</span>
                      <span className="text-sm font-black text-emerald-300 block mt-0.5 truncate">
                        {formatRs(activeStockPanelData.curSalePrice)}
                      </span>
                    </div>

                    {/* 8. Stock Value */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-2 text-center">
                      <span className="text-[10px] text-slate-400 font-medium block">Stock Value</span>
                      <span className="text-sm font-black text-purple-300 block mt-0.5 truncate">
                        {formatRs(activeStockPanelData.stockVal)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 17-FIELD COMPLETE PRODUCT DETAILS TABLE */}
              {activeDetailPurchase && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-3 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div>
                      <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                        <span>Invoice #{activeDetailPurchase.purchaseInvoiceNo} — 17 Complete Item Fields</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Supplier: <strong className="text-slate-800">{activeDetailPurchase.supplierName}</strong> | Date: {activeDetailPurchase.purchaseDate} | Total: {formatRs(activeDetailPurchase.grandTotal)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectToView(activeDetailPurchase);
                          setIsReadOnly(false);
                          setIsEditing(true);
                          setActiveTab('form');
                          sounds.playSuccessChime();
                          showToast(`Editing enabled for #${activeDetailPurchase.purchaseInvoiceNo}. Changes will update existing record.`, 'info');
                        }}
                        className="py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs cursor-pointer transition-all active:scale-95"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit Invoice (تبدیل کریں)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentPrintPurchase(activeDetailPurchase)}
                        className="py-1.5 px-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs cursor-pointer transition-all active:scale-95"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Bill</span>
                      </button>
                    </div>
                  </div>

                  {/* The 17-Column Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-[#071739] text-white font-black uppercase tracking-wider text-[10px]">
                          <th className="py-2.5 px-2 text-center w-8">#</th>
                          <th className="py-2.5 px-2 min-w-[140px]">1. Product Name</th>
                          <th className="py-2.5 px-2 min-w-[90px]">2. Barcode</th>
                          <th className="py-2.5 px-2 min-w-[70px]">3. Item Code</th>
                          <th className="py-2.5 px-2 min-w-[80px]">4. Category</th>
                          <th className="py-2.5 px-2 text-center min-w-[65px]">5. Prev Stock</th>
                          <th className="py-2.5 px-2 text-center min-w-[65px]">6. Purch Qty</th>
                          <th className="py-2.5 px-2 text-center min-w-[65px]">7. Available Stock</th>
                          <th className="py-2.5 px-2 text-right min-w-[80px]">8. Purch Price</th>
                          <th className="py-2.5 px-2 text-right min-w-[80px]">9. Sale Price</th>
                          <th className="py-2.5 px-2 text-right min-w-[85px]">10. Total Amount</th>
                          <th className="py-2.5 px-2 text-center min-w-[55px]">11. Disc</th>
                          <th className="py-2.5 px-2 text-center min-w-[55px]">12. Tax</th>
                          <th className="py-2.5 px-2 min-w-[110px]">13. Supplier</th>
                          <th className="py-2.5 px-2 min-w-[95px]">14. Invoice #</th>
                          <th className="py-2.5 px-2 min-w-[85px]">15. Date</th>
                          <th className="py-2.5 px-2 text-center min-w-[70px]">16. Payment</th>
                          <th className="py-2.5 px-2 text-right min-w-[90px]">17. Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        {activeDetailPurchase.items?.map((it, idx) => {
                          const matchProd = products.find((pr) => pr.id === it.productId);
                          const curStock = matchProd?.stock || 0;
                          const prevStock = Math.max(0, curStock - it.quantity);
                          const isSelected = selectedRowItem?.id === it.id;
                          return (
                            <tr
                              key={it.id || idx}
                              onClick={() => setSelectedRowItem(it)}
                              className={`cursor-pointer transition-colors ${
                                isSelected ? 'bg-blue-50 font-bold' : idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/50 hover:bg-slate-50'
                              }`}
                            >
                              <td className="py-2 px-2 text-center font-bold text-slate-400">{idx + 1}</td>
                              {/* 1. Product Name + Thumbnail */}
                              <td className="py-2 px-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {it.imageUrl || matchProd?.imageUrl ? (
                                    <img
                                      src={it.imageUrl || matchProd?.imageUrl}
                                      alt=""
                                      className="w-6 h-6 rounded object-cover border border-slate-200 shrink-0"
                                    />
                                  ) : null}
                                  <span className="font-bold text-slate-900 truncate" title={it.productName}>
                                    {it.productName}
                                  </span>
                                </div>
                              </td>
                              {/* 2. Barcode */}
                              <td className="py-2 px-2 font-mono text-slate-600 truncate">{it.barcode || matchProd?.barcode || 'N/A'}</td>
                              {/* 3. Item Code / SKU */}
                              <td className="py-2 px-2 font-mono text-slate-600 truncate">{matchProd?.sku || it.productId.slice(-6)}</td>
                              {/* 4. Category */}
                              <td className="py-2 px-2 text-slate-600 truncate">{matchProd?.category || 'General'}</td>
                              {/* 5. Previous Stock */}
                              <td className="py-2 px-2 text-center text-slate-600">{prevStock}</td>
                              {/* 6. Purchased Qty */}
                              <td className="py-2 px-2 text-center font-bold text-blue-700">+{it.quantity}</td>
                              {/* 7. Current Available Stock */}
                              <td className="py-2 px-2 text-center font-bold text-emerald-700">{curStock}</td>
                              {/* 8. Purchase Price */}
                              <td className="py-2 px-2 text-right tabular-nums font-semibold">{formatRs(it.purchaseCost)}</td>
                              {/* 9. Sale Price */}
                              <td className="py-2 px-2 text-right tabular-nums text-slate-700">{formatRs(it.salePrice || matchProd?.price || 0)}</td>
                              {/* 10. Total Purchase Amount */}
                              <td className="py-2 px-2 text-right tabular-nums font-bold text-slate-900">{formatRs(it.lineTotal)}</td>
                              {/* 11. Discount */}
                              <td className="py-2 px-2 text-center text-slate-500">{it.discount ? `${it.discount}%` : '0%'}</td>
                              {/* 12. Tax / VAT */}
                              <td className="py-2 px-2 text-center text-slate-500">{it.tax ? `${it.tax}%` : '0%'}</td>
                              {/* 13. Supplier Name */}
                              <td className="py-2 px-2 text-slate-700 truncate">{activeDetailPurchase.supplierName}</td>
                              {/* 14. Invoice Number */}
                              <td className="py-2 px-2 font-mono text-slate-700 truncate">{activeDetailPurchase.purchaseInvoiceNo}</td>
                              {/* 15. Purchase Date */}
                              <td className="py-2 px-2 text-slate-600 truncate">{activeDetailPurchase.purchaseDate}</td>
                              {/* 16. Payment Status */}
                              <td className="py-2 px-2 text-center">
                                <span
                                  className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                                    activeDetailPurchase.remainingBalance === 0
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : activeDetailPurchase.amountPaid > 0
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {activeDetailPurchase.remainingBalance === 0 ? 'PAID' : activeDetailPurchase.amountPaid > 0 ? 'PARTIAL' : 'CREDIT'}
                                </span>
                              </td>
                              {/* 17. Remaining Supplier Balance */}
                              <td className="py-2 px-2 text-right tabular-nums font-bold text-red-700">
                                {formatRs(activeDetailPurchase.remainingBalance)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Footer */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between text-xs gap-3">
                    <div className="text-slate-600">
                      Total Items: <strong className="text-slate-900">{activeDetailPurchase.items?.length || 0}</strong> | Total Qty: <strong className="text-slate-900">{activeDetailPurchase.items?.reduce((s, i) => s + i.quantity, 0) || 0}</strong>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold">
                      <span className="text-slate-600">Subtotal: {formatRs(activeDetailPurchase.subtotal)}</span>
                      {activeDetailPurchase.totalDiscount > 0 && <span className="text-emerald-700">Discount: -{formatRs(activeDetailPurchase.totalDiscount)}</span>}
                      <span className="text-slate-900 font-black">Grand Total: {formatRs(activeDetailPurchase.grandTotal)}</span>
                      <span className="text-emerald-700">Paid: {formatRs(activeDetailPurchase.amountPaid)}</span>
                      <span className="text-red-700 font-black">Remaining: {formatRs(activeDetailPurchase.remainingBalance)}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: PURCHASE ENTRY / EDIT FORM                              */}
      {/* ============================================================== */}
      {activeTab === 'form' && (
        <div className="space-y-4">
          {/* READ-ONLY / EDITING BANNER */}
          {isReadOnly && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-blue-900">
                    Viewing Saved Purchase: #{purchaseInvoiceNo} (Read-Only Mode)
                  </div>
                  <div className="text-[11px] text-blue-700">
                    یہ بل محفوظ شدہ ہے۔ کسی بھی تبدیلی کے لیے Edit پر کلک کریں۔
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleStartEditing}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Invoice (تبدیل کریں)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (originalSavedPurchase) setCurrentPrintPurchase(originalSavedPurchase);
                  }}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-slate-200"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={handleNewPurchase}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ New Bill</span>
                </button>
              </div>
            </div>
          )}

          {isEditing && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <Edit className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-amber-900">
                    Editing Purchase Invoice #{purchaseInvoiceNo}
                  </div>
                  <div className="text-[11px] text-amber-800">
                    تبدیلیاں محفوظ کرنے پر اسٹاک کا فرق اور سپلائر کا بیلنس خودکار اپڈیٹ ہوگا۔
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSavePurchase}
                  disabled={isSaving}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes (محفوظ کریں)</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel Edit (منسوخ)</span>
                </button>
              </div>
            </div>
          )}

          {/* WAQAS POS SOFTWARE Branding Card */}
          <WaqasBrandingCard variant="compact" />

      {/* ============================================================== */}
      {/* 2. FORM & SUPPLIER DETAILS (RESPONSIVE GRID)                   */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Purchase Invoice # */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Purchase Invoice #
            </label>
            <input
              type="text"
              disabled
              value={purchaseInvoiceNo}
              className="w-full bg-slate-100 font-mono font-bold text-slate-800 px-3 py-2 rounded-xl border border-slate-200 outline-none"
            />
          </div>

          {/* Purchase Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Purchase Date
            </label>
            <input
              type="date"
              disabled={isReadOnly && !isEditing}
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full bg-white font-medium text-slate-800 px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-blue-500"
            />
          </div>

          {/* Supplier Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Supplier *
              </label>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => setIsAddSupplierOpen(true)}
                  className="text-blue-600 hover:text-blue-800 text-[10px] font-bold"
                >
                  + Add New
                </button>
              )}
            </div>
            <select
              disabled={isReadOnly && !isEditing}
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full bg-white font-semibold text-slate-800 px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-blue-500"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (Bal: Rs. {s.payableBalance || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Supplier Bill / Ref No */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Supplier Bill Ref #
            </label>
            <input
              type="text"
              disabled={isReadOnly && !isEditing}
              value={supplierInvoiceNo}
              onChange={(e) => setSupplierInvoiceNo(e.target.value)}
              placeholder="e.g. MT-8910"
              className="w-full bg-white font-medium text-slate-800 px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Product Search & Barcode Scan Bar */}
        {!isReadOnly && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs shrink-0"
            >
              <ScanBarcode className="w-4 h-4" />
              <span>Scan Barcode</span>
            </button>

            <div className="relative flex-1">
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-blue-500 focus-within:bg-white transition-all">
                <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Type product name, barcode, or code to add immediately..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHighlightedIndex(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setHighlightedIndex((prev) => {
                        if (searchResults.length === 0) return null;
                        if (prev === null || prev >= Math.min(searchResults.length, 6) - 1) return 0;
                        return prev + 1;
                      });
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setHighlightedIndex((prev) => {
                        if (searchResults.length === 0) return null;
                        if (prev === null || prev <= 0) return Math.min(searchResults.length, 6) - 1;
                        return prev - 1;
                      });
                    } else if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();

                      if (isReadOnly && !isEditing) {
                        showToast('بل ریڈ اونلی موڈ میں ہے۔ تبدیل کرنے کے لیے Edit Invoice پر کلک کریں۔', 'error');
                        return;
                      }

                      const q = searchQuery.trim();
                      if (!q && highlightedIndex === null) return;

                      // 1. Highlighted selection
                      if (highlightedIndex !== null && searchResults[highlightedIndex]) {
                        handleSelectProduct(searchResults[highlightedIndex]);
                        return;
                      }

                      // 2. Exact Barcode Match (Prioritized)
                      const barcodeMatch = products.find(
                        (p) =>
                          (p.barcode || '').toLowerCase() === q.toLowerCase() ||
                          (p.sku || '').toLowerCase() === q.toLowerCase()
                      );
                      if (barcodeMatch) {
                        handleSelectProduct(barcodeMatch);
                        return;
                      }

                      // 3. Exact Name Match
                      const nameMatch = products.find(
                        (p) => (p.name || '').toLowerCase() === q.toLowerCase()
                      );
                      if (nameMatch) {
                        handleSelectProduct(nameMatch);
                        return;
                      }

                      // 4. Single or Top Search Result
                      if (searchResults.length > 0) {
                        handleSelectProduct(searchResults[0]);
                        return;
                      }

                      // 5. Fallback barcode scan check
                      if (q) {
                        handleBarcodeDetected(q);
                      }
                    }
                  }}
                  className="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setHighlightedIndex(null);
                    }}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {searchQuery.trim() && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 max-h-56 overflow-y-auto z-40 divide-y divide-slate-100">
                  {searchResults.slice(0, 6).map((prod, idx) => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => handleSelectProduct(prod)}
                      className={`w-full p-2.5 text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                        highlightedIndex === idx ? 'bg-blue-100/80 font-bold' : 'hover:bg-blue-50'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-800">{prod.name}</div>
                        <div className="text-[10px] text-slate-400">
                          Barcode: {prod.barcode || 'N/A'} • Cost: Rs. {prod.costPrice} • Stock: {prod.stock}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-lg">
                        + Add to Bill
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* No match found indicator in dropdown */}
              {searchQuery.trim() && searchResults.length === 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-40 text-center">
                  <p className="text-xs font-bold text-slate-600">Product Not Found</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    کوئی آئٹم نہیں ملا۔ آپ نیا پروڈکٹ بنا سکتے ہیں۔
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenAddProduct();
                      setSearchQuery('');
                    }}
                    className="mt-2 px-3 py-1 bg-emerald-600 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-700"
                  >
                    + Add New Item
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onOpenAddProduct}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl shrink-0"
            >
              + Create Product
            </button>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 3. PURCHASE ITEMS TABLE (RESPONSIVE)                            */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-600" />
            <h3 className="font-bold text-xs text-slate-800">
              Purchase Items List ({items.length} items)
            </h3>
          </div>
          <div className="text-xs font-black text-slate-800">
            Total Qty: {items.reduce((s, i) => s + (i.quantity || 0), 0)}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                <th className="py-2.5 px-3 w-12 text-center">#</th>
                <th className="py-2.5 px-3">Item Name</th>
                <th className="py-2.5 px-3 w-28 text-center">Qty</th>
                <th className="py-2.5 px-3 w-28 text-right">Unit Cost (Rs.)</th>
                <th className="py-2.5 px-3 w-20 text-center">Disc %</th>
                <th className="py-2.5 px-3 w-20 text-center">Tax %</th>
                <th className="py-2.5 px-3 w-28 text-right">Net Amount</th>
                {!isReadOnly && <th className="py-2.5 px-3 w-14 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={isReadOnly ? 7 : 8} className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600">No items added yet</p>
                    <p className="text-[11px] text-slate-400">
                      اوپر بارکوڈ اسکین کریں یا نام تلاش کر کے آئٹم شامل کریں۔
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((it, idx) => (
                  <tr key={it.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{it.productName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {it.barcode || 'N/A'}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="number"
                        min="1"
                        disabled={isReadOnly && !isEditing}
                        value={it.quantity}
                        onChange={(e) => handleUpdateItem(it.id, 'quantity', parseFloat(e.target.value) || 1)}
                        className="w-16 text-center font-extrabold bg-slate-50 border border-slate-200 rounded-lg py-1 px-1 outline-none text-xs"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        disabled={isReadOnly && !isEditing}
                        value={it.purchaseCost}
                        onChange={(e) => handleUpdateItem(it.id, 'purchaseCost', parseFloat(e.target.value) || 0)}
                        className="w-20 text-right font-extrabold bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 outline-none text-xs"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        disabled={isReadOnly && !isEditing}
                        value={it.discount || 0}
                        onChange={(e) => handleUpdateItem(it.id, 'discount', parseFloat(e.target.value) || 0)}
                        className="w-14 text-center font-bold bg-slate-50 border border-slate-200 rounded-lg py-1 px-1 outline-none text-xs"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        disabled={isReadOnly && !isEditing}
                        value={it.tax || 0}
                        onChange={(e) => handleUpdateItem(it.id, 'tax', parseFloat(e.target.value) || 0)}
                        className="w-14 text-center font-bold bg-slate-50 border border-slate-200 rounded-lg py-1 px-1 outline-none text-xs"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-slate-900">
                      {formatRs(it.lineTotal)}
                    </td>
                    {!isReadOnly && (
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(it.id)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. TOTALS, PAYMENT & ACTION BUTTONS                            */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Payment & Notes (Left 7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Banknote className="w-4 h-4 text-slate-400" />
            <span>Payment Method & Remarks</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Payment Method
              </label>
              <select
                disabled={isReadOnly && !isEditing}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
              >
                <option value="Cash">Cash (نقد)</option>
                <option value="Credit">Credit / Udhar (ادھار)</option>
                <option value="Card">Bank / Card (بینک)</option>
                <option value="Bank">Cheque / Online</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Paid Amount (Rs.)
              </label>
              <input
                type="number"
                step="any"
                disabled={isReadOnly && !isEditing}
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value ? Number(e.target.value) : '')}
                placeholder={formatRs(grandTotal)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-extrabold text-slate-800 outline-none text-right"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Purchase Remarks / Notes
            </label>
            <input
              type="text"
              disabled={isReadOnly && !isEditing}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Received in good condition at main store"
              className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none"
            />
          </div>
        </div>

        {/* Totals Summary & Save Button (Right 5 Cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#071739] to-[#0f275c] text-white rounded-2xl p-4 shadow-md flex flex-col justify-between space-y-3">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Subtotal:</span>
              <span className="font-bold text-white">{formatRs(subtotal)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-emerald-300">
                <span>Discount:</span>
                <span className="font-bold">-{formatRs(totalDiscount)}</span>
              </div>
            )}
            {totalTax > 0 && (
              <div className="flex justify-between text-amber-300">
                <span>Tax / VAT:</span>
                <span className="font-bold">+{formatRs(totalTax)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-white/20 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-200">Grand Total:</span>
              <span className="text-2xl font-black text-white">{formatRs(grandTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-300 text-[11px] pt-1">
              <span>Outstanding / Payable:</span>
              <span className="font-black text-amber-400">{formatRs(remainingBalance)}</span>
            </div>
          </div>

          {/* Action Button */}
          {isReadOnly && !isEditing ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleStartEditing}
                className="py-3 px-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Invoice</span>
              </button>
              <button
                type="button"
                onClick={handleNewPurchase}
                className="py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ New Bill</span>
              </button>
            </div>
          ) : isEditing ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleSavePurchase}
                disabled={isSaving || items.length === 0}
                className="py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="py-3 px-3 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSavePurchase}
              disabled={isSaving || items.length === 0}
              className={`w-full py-3.5 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                items.length > 0
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white active:scale-95 cursor-pointer'
                  : 'bg-white/20 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>Save Purchase & Start New Bill &gt;</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )}

      {/* ============================================================== */}
      {/* 5. WIDE RECTANGULAR ITEM DETAILS BOX AT VERY BOTTOM (10 FIELDS) */}
      {/* ============================================================== */}
      {(() => {
        const activeItem = (activeTab === 'details' && selectedRowItem) 
          ? selectedRowItem 
          : items.length > 0 
          ? items[items.length - 1] 
          : null;
        const activeProd = selectedProduct || (activeItem ? products.find((p) => p.id === activeItem.productId) : null) || products[0];

        const itemName = activeProd?.name || activeItem?.productName || 'No Item Selected';
        const barcodeVal = activeProd?.barcode || activeItem?.barcode || 'N/A';
        const itemCodeVal = activeProd?.sku || 'N/A';
        const categoryVal = activeProd?.category || 'General';
        
        const currentSavedStock = activeProd ? Number(activeProd.stock) || 0 : 0;
        const purchaseQtyVal = activeItem ? (Number(activeItem.quantity) || 0) : (Number(entryQty) || 0);
        
        const prevStockVal = (activeTab === 'details' && activeItem)
          ? currentSavedStock - purchaseQtyVal
          : currentSavedStock;
        const previewCurrentStock = (activeTab === 'details' && activeItem)
          ? currentSavedStock
          : currentSavedStock + purchaseQtyVal;

        const costVal = activeProd?.costPrice || (activeItem ? activeItem.purchaseCost : Number(entryCost) || 0);
        const saleVal = activeProd?.price || (activeItem ? activeItem.salePrice : Number(entrySalePrice) || 0);
        const locationVal = activeProd?.category ? `${activeProd.category} Section` : 'Main Shelf / Rack A-1';

        return (
          <div className="w-full bg-slate-900 text-white rounded-2xl border-2 border-slate-700 p-4 shadow-lg mt-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-3 border-b border-slate-700/80">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  Item Details Box (آئٹم تفصیلی معلومات)
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white bg-slate-800 px-3 py-1 rounded-xl border border-slate-700">
                  Active Item: <strong className="text-emerald-300">{itemName}</strong>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Barcode: {barcodeVal}
                </span>
              </div>
            </div>

            {/* 10 Clean Responsive Rectangular Columns without overlapping */}
            <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2.5 text-xs">
              {/* 1. Active Item Name */}
              <div className="bg-slate-800/90 p-2.5 rounded-xl border border-slate-700/60 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  1. Item Name
                </span>
                <span className="font-black text-xs text-white truncate" title={itemName}>
                  {itemName}
                </span>
              </div>

              {/* 2. Barcode */}
              <div className="bg-slate-800/90 p-2.5 rounded-xl border border-slate-700/60 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  2. Barcode
                </span>
                <span className="font-mono font-black text-xs text-cyan-300 truncate" title={barcodeVal}>
                  {barcodeVal}
                </span>
              </div>

              {/* 3. Item Code */}
              <div className="bg-slate-800/90 p-2.5 rounded-xl border border-slate-700/60 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  3. Item Code
                </span>
                <span className="font-mono font-black text-xs text-amber-300 truncate" title={itemCodeVal}>
                  {itemCodeVal}
                </span>
              </div>

              {/* 4. Category */}
              <div className="bg-slate-800/90 p-2.5 rounded-xl border border-slate-700/60 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  4. Category
                </span>
                <span className="font-bold text-xs text-purple-300 truncate" title={categoryVal}>
                  {categoryVal}
                </span>
              </div>

              {/* 5. Previous Stock */}
              <div className="bg-slate-800/90 p-2.5 rounded-xl border border-slate-700/60 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  5. Prev Stock
                </span>
                <span className={`font-black text-xs ${prevStockVal < 0 ? 'text-red-400' : 'text-slate-200'}`}>
                  {prevStockVal}
                </span>
              </div>

              {/* 6. Purchase Quantity */}
              <div className="bg-slate-800/90 p-2.5 rounded-xl border border-slate-700/60 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  6. Purch Qty
                </span>
                <span className="font-black text-xs text-blue-400">
                  +{purchaseQtyVal}
                </span>
              </div>

              {/* 7. Current Stock */}
              <div className="bg-slate-800/90 p-2.5 rounded-xl border border-slate-700/60 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  7. Curr Stock
                </span>
                <span className={`font-black text-xs ${previewCurrentStock < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {previewCurrentStock} {activeProd?.unit || 'Pcs'}
                </span>
              </div>

              {/* 8. Cost Price */}
              <div className="bg-slate-800/90 p-2.5 rounded-xl border border-slate-700/60 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  8. Cost Price
                </span>
                <span className="font-black text-xs text-slate-100">
                  Rs. {Number(costVal).toFixed(2)}
                </span>
              </div>

              {/* 9. Sale Price */}
              <div className="bg-slate-800/90 p-2.5 rounded-xl border border-slate-700/60 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  9. Sale Price
                </span>
                <span className="font-black text-xs text-emerald-400">
                  Rs. {Number(saleVal).toFixed(2)}
                </span>
              </div>

              {/* 10. Location */}
              <div className="bg-slate-800/90 p-2.5 rounded-xl border border-slate-700/60 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  10. Location
                </span>
                <span className="font-bold text-xs text-teal-300 truncate" title={locationVal}>
                  {locationVal}
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modals */}
      {isScannerOpen && (
        <BarcodeScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onBarcodeDetected={handleBarcodeDetected}
        />
      )}

      {isAddSupplierOpen && (
        <AddSupplierModal
          isOpen={isAddSupplierOpen}
          onClose={() => setIsAddSupplierOpen(false)}
          onAddSupplier={onAddSupplier}
        />
      )}

      {isSearchPurchasesOpen && (
        <SearchPurchasesModal
          isOpen={isSearchPurchasesOpen}
          purchases={purchases}
          onClose={() => setIsSearchPurchasesOpen(false)}
          onSelectToView={handleSelectToView}
          onSelectToEdit={(p) => {
            handleSelectToView(p);
            setIsReadOnly(false);
            setIsEditing(true);
          }}
          onPrintPurchase={(p) => setCurrentPrintPurchase(p)}
          onDeletePurchase={onDeletePurchase}
        />
      )}

      {currentPrintPurchase && (
        <PrintPurchaseModal
          isOpen={Boolean(currentPrintPurchase)}
          purchase={currentPrintPurchase}
          onClose={() => setCurrentPrintPurchase(null)}
        />
      )}
      </div>
    </div>
  );
};

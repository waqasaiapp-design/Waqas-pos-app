import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ScanBarcode,
  Search,
  Plus,
  Trash2,
  Printer,
  Save,
  RotateCcw,
  Edit,
  FileText,
  Clock,
  User,
  CheckCircle,
  AlertTriangle,
  X,
  CreditCard,
  Banknote,
  BookOpen,
  ShoppingBag,
  ShoppingCart,
  Users,
  Package,
  Layers,
  ChevronDown,
  Minimize2,
  Maximize2,
  ArrowRight,
  LogOut,
  Info,
  DollarSign,
  Barcode as BarcodeIcon,
  Truck,
  FileSpreadsheet,
  TrendingUp,
  Settings,
  Home,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Upload,
  Camera,
  Edit2,
  Building2,
  Phone,
  MapPin,
  Lock,
  Menu,
  ArrowLeft,
} from 'lucide-react';
import {
  Product,
  Supplier,
  PurchaseTransaction,
  PurchaseItem,
  StoreBranding,
  UserProfile,
  DeviceInfo,
} from '../types/pos';
import { formatRs } from '../data/defaultProducts';
import { WaqasBrandingCard } from './WaqasBrandingCard';
import { sounds } from '../utils/audio';
import { SearchPurchasesModal } from './SearchPurchasesModal';
import { PrintPurchaseModal } from './PrintPurchaseModal';
import { BarcodeScannerModal } from './BarcodeScannerModal';

interface NewPurchaseEntryPageProps {
  products: Product[];
  suppliers: Supplier[];
  purchases: PurchaseTransaction[];
  branding: StoreBranding;
  currentUser: UserProfile;
  currentDevice: DeviceInfo;
  onSavePurchase: (purchase: PurchaseTransaction, isEdit?: boolean) => void;
  onDeletePurchase?: (purchaseId: string) => void;
  onAddSupplier: (supplier: Supplier) => void;
  onOpenAddProduct: () => void;
  onOpenScanner: () => void;
  onNavigate: (page: string) => void;
  onUpdateBranding?: (branding: StoreBranding) => void;
}

export const NewPurchaseEntryPage: React.FC<NewPurchaseEntryPageProps> = ({
  products,
  suppliers,
  purchases,
  branding,
  currentUser,
  currentDevice,
  onSavePurchase,
  onDeletePurchase,
  onAddSupplier,
  onOpenAddProduct,
  onOpenScanner,
  onNavigate,
  onUpdateBranding,
}) => {
  // Navigation index among saved purchases
  const [purchaseNavIndex, setPurchaseNavIndex] = useState<number>(-1);

  // Read-only and Editing Mode states
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);
  const [originalSavedPurchase, setOriginalSavedPurchase] = useState<PurchaseTransaction | null>(null);
  const [isPurchaseHistoryOpen, setIsPurchaseHistoryOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [currentPrintPurchase, setCurrentPrintPurchase] = useState<PurchaseTransaction | null>(null);

  // Form Fields - Top Information
  const [refNo, setRefNo] = useState<string>(() => (2810 + (purchases.length || 0) + 1).toString());
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [entryDate, setEntryDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Selected Supplier
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(() => {
    if (suppliers.length > 0) return suppliers[0].id;
    return '';
  });
  const activeSupplier = useMemo(() => {
    return suppliers.find((s) => s.id === selectedSupplierId);
  }, [suppliers, selectedSupplierId]);

  const [supplierPhone, setSupplierPhone] = useState<string>('');
  const [supplierAddress, setSupplierAddress] = useState<string>('');
  const [supplierTrn, setSupplierTrn] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  // Update phone and address when supplier changes
  useEffect(() => {
    if (activeSupplier) {
      setSupplierPhone(activeSupplier.phone || '');
      setSupplierAddress(activeSupplier.address || activeSupplier.city || '');
      setSupplierTrn(activeSupplier.trn || '');
    }
  }, [activeSupplier]);

  // Payment Method & VAT Type & Store
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit' | 'card'>('cash');
  const [vatType, setVatType] = useState<'Default VAT' | 'Out of Scope'>('Default VAT');
  const [selectedStore, setSelectedStore] = useState<string>('Main Store');

  // Search by ReferNo in navigation card
  const [searchReferNo, setSearchReferNo] = useState<string>('');

  // Items in Purchase - always empty on new purchase form
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

  // Item Search Input bar
  const [itemSearchQuery, setItemSearchQuery] = useState<string>('');
  const [itemSuggestions, setItemSuggestions] = useState<Product[]>([]);
  const [showItemSuggestions, setShowItemSuggestions] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const searchInputRef = useRef<HTMLDivElement>(null);
  const itemInputRef = useRef<HTMLInputElement | null>(null);

  // Fullscreen support
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    } catch {}
  };
  const [serialImei, setSerialImei] = useState<string>('');
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState<boolean>(false);

  // Discount & Cost controls
  const [costDiscountPercent, setCostDiscountPercent] = useState<number>(0);
  const [costDiscountAmount, setCostDiscountAmount] = useState<number>(0);
  const [roundoff, setRoundoff] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);

  // New Supplier Modal
  const [isNewSupplierModalOpen, setIsNewSupplierModalOpen] = useState<boolean>(false);
  const [newSupName, setNewSupName] = useState<string>('');
  const [newSupPhone, setNewSupPhone] = useState<string>('');
  const [newSupAddress, setNewSupAddress] = useState<string>('');
  const [newSupBusiness, setNewSupBusiness] = useState<string>('');
  const [newSupTrn, setNewSupTrn] = useState<string>('');
  const [newSupBalance, setNewSupBalance] = useState<number>(0);
  const [newSupRemarks, setNewSupRemarks] = useState<string>('');

  // Delete Item Confirmation Modal
  const [itemToDeleteIndex, setItemToDeleteIndex] = useState<number | null>(null);
  const [showConfirmClearPurchase, setShowConfirmClearPurchase] = useState<boolean>(false);

  // Banner Customization Modal (As requested: "Is Jo banner jes per laka purchase iske nashe Jo tixt isko sitting say tabdeel karne apshan hu")
  const [isBannerModalOpen, setIsBannerModalOpen] = useState<boolean>(false);
  const [bannerTitle, setBannerTitle] = useState<string>(
    branding.purchaseBannerTitle || 'Purchase Entry'
  );
  const [bannerSubtitle, setBannerSubtitle] = useState<string>(
    branding.purchaseBannerSubtitle || 'Keep Your Inventory Always Full'
  );

  // Stock Enquiry Modal
  const [isStockEnquiryOpen, setIsStockEnquiryOpen] = useState<boolean>(false);

  // Mobile Collapsible Sidebar State
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Toast Notice
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Keyboard shortcut listener (F2 Save, F4 Create Item, F10 Print, F12 Exit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        handleSavePurchaseAction();
      } else if (e.key === 'F4') {
        e.preventDefault();
        onOpenAddProduct();
      } else if (e.key === 'F10') {
        e.preventDefault();
        window.print();
      } else if (e.key === 'F12') {
        e.preventDefault();
        onNavigate('Home');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [purchaseItems, activeSupplier, amountPaid]);

  // Click outside listener for item search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(e.target as Node)) {
        setShowItemSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter item suggestions
  useEffect(() => {
    if (itemSearchQuery.trim().length > 1) {
      const q = itemSearchQuery.toLowerCase().trim();
      const matches = products.filter((p) => {
        const n = (p?.name || '').toLowerCase();
        const b = (p?.barcode || '').toLowerCase();
        const s = (p?.sku || '').toLowerCase();
        return n.includes(q) || b.includes(q) || s.includes(q);
      });
      setItemSuggestions(matches.slice(0, 8));
      setShowItemSuggestions(true);
    } else {
      setItemSuggestions([]);
      setShowItemSuggestions(false);
    }
  }, [itemSearchQuery, products]);

  // Calculations
  const calculations = useMemo(() => {
    let grossTotal = 0;
    let totalQty = 0;
    let totalVat = 0;

    purchaseItems.forEach((item) => {
      grossTotal += item.lineTotal;
      totalQty += item.quantity;
      totalVat += item.vat || 0;
    });

    const discount =
      costDiscountAmount > 0
        ? costDiscountAmount
        : grossTotal * ((costDiscountPercent || 0) / 100);

    const totalAmount = Math.max(0, grossTotal - discount + totalVat + (roundoff || 0));
    const paid = amountPaid > 0 ? amountPaid : (paymentMethod === 'cash' ? totalAmount : 0);
    const outstanding = Math.max(0, totalAmount - paid);

    return {
      grossTotal,
      discount,
      vat: totalVat,
      roundoff,
      totalAmount,
      paid,
      outstanding,
      totalQty,
    };
  }, [purchaseItems, costDiscountPercent, costDiscountAmount, roundoff, amountPaid, paymentMethod]);

  // Currently selected item for Stock Info panel
  const selectedItem = useMemo(() => {
    if (selectedRowIndex !== null && purchaseItems[selectedRowIndex]) {
      return purchaseItems[selectedRowIndex];
    }
    return null;
  }, [purchaseItems, selectedRowIndex]);

  // Add Item to Purchase Table
  const handleAddItemToPurchase = (prod: Product) => {
    if (isReadOnly && !isEditing) {
      showToast('بل ریڈ اونلی موڈ میں ہے۔ تبدیل کرنے کے لیے Edit Invoice پر کلک کریں۔', 'error');
      return;
    }

    const existingIdx = purchaseItems.findIndex((it) => it.productId === prod.id);

    if (existingIdx !== -1) {
      // Increase quantity
      const updated = [...purchaseItems];
      const cur = updated[existingIdx];
      const newQty = cur.quantity + 1;
      const newTotal = newQty * cur.purchaseCost;
      updated[existingIdx] = {
        ...cur,
        quantity: newQty,
        lineTotal: newTotal,
        netAmount: newTotal,
        wvat: newTotal,
      };
      setPurchaseItems(updated);
      setSelectedRowIndex(existingIdx);
    } else {
      // Add new row
      const cost = prod.costPrice > 0 ? prod.costPrice : Math.round(prod.price * 0.8);
      const newItem: PurchaseItem = {
        id: `pitem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: prod.id,
        productName: prod.name,
        barcode: prod.barcode,
        currentStock: prod.stock,
        quantity: 1,
        purchaseCost: cost,
        salePrice: prod.price,
        discount: 0,
        tax: 0,
        lineTotal: cost,
        netAmount: cost,
        vat: 0,
        wvat: cost,
        fPrice: prod.price,
        store: selectedStore,
        location: 'A-1',
        wCost: cost,
      };
      setPurchaseItems((prev) => [...prev, newItem]);
      setSelectedRowIndex(purchaseItems.length);
    }

    sounds.playBarcodeBeep();
    setItemSearchQuery('');
    setShowItemSuggestions(false);
    setHighlightedIndex(null);
    showToast(`Added: ${prod.name} (Qty +1)`, 'success');
    if (itemInputRef.current) itemInputRef.current.focus();
  };

  // Barcode scan handler (Auto add or increment quantity)
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
      handleAddItemToPurchase(match);
      setIsCameraScannerOpen(false);
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
        target !== itemInputRef.current
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

  // Update item field in table
  const handleUpdateItemField = (index: number, field: keyof PurchaseItem, val: any) => {
    const updated = [...purchaseItems];
    const item = { ...updated[index], [field]: val };

    if (field === 'quantity' || field === 'purchaseCost') {
      const qty = parseFloat(item.quantity as any) || 0;
      const cost = parseFloat(item.purchaseCost as any) || 0;
      const lineTotal = qty * cost;
      item.lineTotal = lineTotal;
      item.netAmount = lineTotal;
      item.wvat = lineTotal;
    }

    updated[index] = item;
    setPurchaseItems(updated);
  };

  // Delete item from table (with confirmation as required in prompt!)
  const handleConfirmDeleteItem = () => {
    if (itemToDeleteIndex === null) return;
    setPurchaseItems((prev) => prev.filter((_, idx) => idx !== itemToDeleteIndex));
    if (selectedRowIndex === itemToDeleteIndex) {
      setSelectedRowIndex(null);
    } else if (selectedRowIndex !== null && selectedRowIndex > itemToDeleteIndex) {
      setSelectedRowIndex(selectedRowIndex - 1);
    }
    setItemToDeleteIndex(null);
    sounds.playErrorTone();
    showToast('Purchase item removed from invoice.', 'info');
  };

  // Delete All Items (with in-UI modal confirmation)
  const handleDeleteAllItems = () => {
    if (purchaseItems.length === 0) return;
    setShowConfirmClearPurchase(true);
  };

  const handleConfirmClearPurchase = () => {
    const count = purchaseItems.length;
    setPurchaseItems([]);
    setSelectedRowIndex(null);
    setShowConfirmClearPurchase(false);
    sounds.playErrorTone();
    showToast(`All ${count} items cleared from purchase.`, 'info');
  };

  // Load a purchase into form in Read-Only Mode
  const handleLoadPurchaseToView = (purch: PurchaseTransaction) => {
    setOriginalSavedPurchase(purch);
    setEditingPurchaseId(purch.id);
    setRefNo(purch.refNo || purch.purchaseInvoiceNo.replace('PUR-', ''));
    setSupplierInvoiceNo(purch.supplierInvoiceNo || '');
    setPurchaseDate(purch.purchaseDate || new Date().toISOString().split('T')[0]);
    setEntryDate(purch.entryDate || new Date().toISOString().split('T')[0]);
    setSelectedSupplierId(purch.supplierId || '');
    setPurchaseItems(purch.items || []);
    setAmountPaid(purch.amountPaid || 0);
    setPaymentMethod((purch.paymentMethod as any) || 'cash');
    setVatType(purch.vatType || 'Default VAT');
    setSelectedStore(purch.store || 'Main Store');
    setRemarks(purch.notes || '');
    setSupplierPhone(purch.supplierPhone || '');
    setSupplierAddress(purch.supplierAddress || '');
    setSupplierTrn(purch.trn || '');
    setIsReadOnly(true);
    setIsEditing(false);
    showToast(`Loaded Purchase #${purch.purchaseInvoiceNo} in Read-Only Mode.`, 'info');
  };

  // Enable Editing for loaded invoice
  const handleStartEditing = () => {
    if (!editingPurchaseId && !originalSavedPurchase) {
      if (purchases.length > 0) {
        handleLoadPurchaseToView(purchases[0]);
      } else {
        showToast('No saved invoice to edit.', 'info');
        return;
      }
    }
    setIsReadOnly(false);
    setIsEditing(true);
    showToast(`Editing enabled for #${refNo}. Changes will update existing record.`, 'info');
  };

  // Cancel Edit and Restore Original Saved Invoice
  const handleCancelEdit = () => {
    if (originalSavedPurchase) {
      handleLoadPurchaseToView(originalSavedPurchase);
      showToast('Editing cancelled. Original values restored.', 'info');
    } else {
      handleNewPurchase();
    }
  };

  // New Purchase action - starts fresh new empty bill
  const handleNewPurchase = () => {
    setPurchaseItems([]);
    setSelectedRowIndex(null);
    setRefNo((2810 + purchases.length + 1).toString());
    setSupplierInvoiceNo('');
    setAmountPaid(0);
    setCostDiscountPercent(0);
    setCostDiscountAmount(0);
    setRemarks('');
    setEditingPurchaseId(null);
    setIsReadOnly(false);
    setIsEditing(false);
    setOriginalSavedPurchase(null);
    setPurchaseNavIndex(-1);
    sounds.playSuccessChime();
    showToast('New fresh purchase bill opened.', 'info');
  };

  // Save / Post Purchase
  const handleSavePurchaseAction = () => {
    if (isSaving) return;

    if (purchaseItems.length === 0) {
      sounds.playErrorTone();
      showToast('Please add items to purchase before saving!', 'error');
      return;
    }

    if (!activeSupplier) {
      sounds.playErrorTone();
      showToast('Please select a supplier!', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const isEdit = Boolean(editingPurchaseId);
      const purchaseTransaction: PurchaseTransaction = {
        id: editingPurchaseId || `pur-${Date.now()}`,
        purchaseInvoiceNo: `PUR-${refNo}`,
        refNo,
        purchaseDate,
        entryDate,
        supplierId: activeSupplier.id,
        supplierName: activeSupplier.name,
        supplierInvoiceNo,
        items: purchaseItems,
        subtotal: calculations.grossTotal,
        totalDiscount: calculations.discount,
        totalTax: calculations.vat,
        roundoff: calculations.roundoff,
        grandTotal: calculations.totalAmount,
        amountPaid: calculations.paid,
        remainingBalance: calculations.outstanding,
        paymentMethod,
        vatType,
        store: selectedStore,
        grossTotal: calculations.grossTotal,
        outstanding: calculations.outstanding,
        totalQty: calculations.totalQty,
        trn: supplierTrn,
        supplierPhone,
        supplierAddress,
        notes: remarks,
        createdAt: new Date().toISOString(),
        status: isEdit ? 'edited' : 'saved',
      };

      onSavePurchase(purchaseTransaction, isEdit);
      sounds.playSuccessChime();
      showToast(
        isEdit
          ? `Purchase #${refNo} updated successfully! Locked in Read-Only Mode.`
          : `Purchase #${refNo} posted successfully! Inventory updated.`,
        'success'
      );

      if (isEdit) {
        // After Save Changes succeeds, lock the invoice again as required
        handleLoadPurchaseToView(purchaseTransaction);
      } else {
        // Automatically open fresh empty purchase bill ready for next bill (NOT LOCKED)
        handleNewPurchase();
      }
    } catch (err) {
      console.error('[NewPurchaseEntryPage] Save error:', err);
      showToast('Failed to save purchase. Your data is retained.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Save New Supplier
  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName.trim()) {
      showToast('Please enter supplier name', 'error');
      return;
    }

    const newId = `SUP-${100 + suppliers.length + 1}`;
    const newSupplier: Supplier = {
      id: newId,
      name: newSupName.trim(),
      phone: newSupPhone.trim(),
      address: newSupAddress.trim(),
      businessName: newSupBusiness.trim(),
      trn: newSupTrn.trim(),
      payableBalance: newSupBalance || 0,
      remarks: newSupRemarks.trim(),
      createdAt: new Date().toISOString(),
    };

    onAddSupplier(newSupplier);
    setSelectedSupplierId(newSupplier.id);
    setIsNewSupplierModalOpen(false);

    // Reset fields
    setNewSupName('');
    setNewSupPhone('');
    setNewSupAddress('');
    setNewSupBusiness('');
    setNewSupTrn('');
    setNewSupBalance(0);
    setNewSupRemarks('');

    sounds.playSuccessChime();
    showToast(`Supplier "${newSupplier.name}" created and selected!`, 'success');
  };

  // Save Banner Setting
  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateBranding) {
      onUpdateBranding({
        ...branding,
        purchaseBannerTitle: bannerTitle.trim() || 'Purchase Entry',
        purchaseBannerSubtitle: bannerSubtitle.trim() || 'Keep Your Inventory Always Full',
      });
    }
    setIsBannerModalOpen(false);
    showToast('Purchase banner text updated successfully!', 'success');
  };

  // Cycle through saved purchases
  const handleNavigatePurchase = (direction: 'first' | 'prev' | 'next' | 'last') => {
    if (purchases.length === 0) {
      showToast('No saved purchases found', 'info');
      return;
    }
    let targetIdx = 0;
    if (direction === 'first') targetIdx = 0;
    else if (direction === 'last') targetIdx = purchases.length - 1;
    else if (direction === 'prev') targetIdx = Math.max(0, (purchaseNavIndex === -1 ? purchases.length : purchaseNavIndex) - 1);
    else if (direction === 'next') targetIdx = Math.min(purchases.length - 1, (purchaseNavIndex === -1 ? -1 : purchaseNavIndex) + 1);

    const targetPur = purchases[targetIdx];
    if (targetPur) {
      setPurchaseNavIndex(targetIdx);
      handleLoadPurchaseToView(targetPur);
    }
  };

  return (
    <div className="flex-1 w-full min-h-full flex flex-col bg-[#eaf0f8] text-slate-800 font-sans overflow-y-auto lg:overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-bold animate-in fade-in slide-in-from-top-2 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white'
              : toastMessage.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-blue-600 text-white'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle className="w-4 h-4" />}
          {toastMessage.type === 'error' && <AlertTriangle className="w-4 h-4" />}
          {toastMessage.type === 'info' && <Info className="w-4 h-4" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. TOP HEADER (EXACT REFERENCE DARK BLUE & EMERALD GRADIENT)  */}
      {/* ============================================================== */}
      <header className="bg-gradient-to-r from-[#021639] via-[#052451] to-[#033b31] text-white px-3 sm:px-4 py-2.5 shadow-md flex items-center justify-between border-b border-emerald-500/30 shrink-0">
        {/* Left: Mobile Menu, Back Button, Logo & Branding */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Hamburger Drawer Trigger */}
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen((prev) => !prev)}
            className="lg:hidden p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Toggle Menu (مینو)"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Quick Back to Dashboard Button */}
          <button
            type="button"
            onClick={() => onNavigate('Home')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer active:scale-95"
            title="Return to Dashboard (ڈیش بورڈ واپس جائیں)"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md border border-emerald-300/40 shrink-0">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-1">
                <span>Waqas</span>
                <span className="text-emerald-400">Mart</span>
              </h1>
              <span className="hidden sm:inline px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-white/10 text-emerald-300 border border-white/10">
                Purchase App
              </span>
            </div>
            <p className="text-[10px] text-slate-300 font-medium">New Purchase Entry</p>
          </div>
        </div>

        {/* Center: Purchase Entry Title & Slogan */}
        <div className="hidden md:flex flex-col items-center text-center">
          <h2 className="text-xl font-black tracking-wide text-white">Purchase Entry</h2>
          <p className="text-[11px] text-slate-300 font-semibold tracking-wider">
            Manage Your Purchases &nbsp;|&nbsp; Better Stock &nbsp;|&nbsp; Higher Profit
          </p>
        </div>

        {/* Right: Date, Time, User Profile & Window Controls */}
        <div className="flex items-center gap-3">
          {/* Date & Time */}
          <div className="hidden lg:flex items-center gap-3 bg-white/10 px-3 py-1 rounded-xl backdrop-blur-xs border border-white/10 text-xs font-bold text-slate-200">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{new Date().toLocaleDateString('en-GB')}</span>
            </div>
            <span className="text-white/30">•</span>
            <div className="flex items-center gap-1.5">
              <span>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
            </div>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-xl border border-white/10">
            <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-black text-xs border border-cyan-400/30">
              <User className="w-4 h-4" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-black leading-tight text-white">
                {currentUser.displayName || 'Admin 102'}
              </p>
              <p className="text-[10px] text-slate-300 leading-tight">
                {currentUser.role || 'Administrator'}
              </p>
            </div>
          </div>

          {/* Window controls */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-white/20 text-slate-400">
            <button
              type="button"
              onClick={toggleFullscreen}
              className="px-2 py-1 rounded-lg bg-white/10 hover:bg-emerald-600/80 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
              title={isFullscreen ? "Exit Fullscreen (فل سکرین بند کریں)" : "Enter 100% Fullscreen (فل سکرین کھولیں)"}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-amber-300" />
                  <span className="hidden sm:inline text-[11px]">Normal</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="hidden sm:inline text-[11px]">Fullscreen</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('Home')}
              className="w-5 h-5 flex items-center justify-center hover:text-white transition-colors cursor-pointer"
              title="Minimize"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('Home')}
              className="w-5 h-5 flex items-center justify-center hover:text-red-400 transition-colors cursor-pointer"
              title="Close to Home"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Read-Only Mode Banner */}
      {isReadOnly && (
        <div className="bg-blue-900 text-white px-4 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-blue-400/30">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs font-black">
              Viewing Saved Purchase: Ref #{refNo} / Invoice #{purchases.find((p) => p.id === editingPurchaseId)?.purchaseInvoiceNo || `PUR-${refNo}`} (Read-Only Mode)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleStartEditing}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Invoice (تبدیل کریں)</span>
            </button>
            <button
              type="button"
              onClick={handleNewPurchase}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Bill</span>
            </button>
          </div>
        </div>
      )}

      {/* Editing Mode Banner */}
      {isEditing && (
        <div className="bg-amber-600 text-white px-4 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-amber-300">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            <span className="text-xs font-black">
              Editing Saved Purchase Ref #{refNo} — Stock and Supplier Ledger will be reconciled on save.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSavePurchaseAction}
              disabled={isSaving}
              className="px-3.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-3 py-1 bg-slate-800/80 hover:bg-slate-900 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel Edit</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. BODY LAYOUT: COLLAPSIBLE MOBILE DRAWER + DESKTOP SIDEBAR    */}
      {/* ============================================================== */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        {/* Mobile Slide-Out Drawer (Overlays page on Android mobile when opened) */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden bg-black/60 backdrop-blur-xs animate-in fade-in">
            <aside className="w-64 max-w-[80vw] bg-[#06173a] text-slate-300 flex flex-col justify-between py-4 px-3 shadow-2xl h-full overflow-y-auto">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-white">WAQAS MART</h3>
                      <p className="text-[10px] text-emerald-400">Purchase Inflow</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileSidebarOpen(false);
                      onNavigate('Home');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-white/10 hover:text-white transition-colors cursor-pointer text-left"
                  >
                    <Home className="w-4 h-4 text-emerald-400" />
                    <span>Dashboard</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileSidebarOpen(false);
                      onNavigate('New Sale POS');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-white/10 hover:text-white transition-colors cursor-pointer text-left"
                  >
                    <ShoppingCart className="w-4 h-4 text-blue-400" />
                    <span>New Sale POS</span>
                  </button>
                  <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md">
                    <ShoppingBag className="w-4 h-4 text-white" />
                    <span>New Purchase Entry</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileSidebarOpen(false);
                      onNavigate('Total Stock');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-white/10 hover:text-white transition-colors cursor-pointer text-left"
                  >
                    <Package className="w-4 h-4 text-amber-400" />
                    <span>Total Stock</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileSidebarOpen(false);
                      onNavigate('Customer Ledgers');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-white/10 hover:text-white transition-colors cursor-pointer text-left"
                  >
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span>Customer Udhar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileSidebarOpen(false);
                      onNavigate('Supplier Ledgers');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-white/10 hover:text-white transition-colors cursor-pointer text-left"
                  >
                    <Truck className="w-4 h-4 text-indigo-400" />
                    <span>Supplier Ledgers</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileSidebarOpen(false);
                      onNavigate('Daily Hisab');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-white/10 hover:text-white transition-colors cursor-pointer text-left"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-red-400" />
                    <span>Daily Hisab</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileSidebarOpen(false);
                      onNavigate('Purchase Entry');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-white/10 hover:text-white transition-colors cursor-pointer text-left text-slate-300"
                  >
                    <Layers className="w-4 h-4 text-slate-400" />
                    <span>Classic Purchase</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 text-center">
                <span className="text-[10px] text-emerald-400 font-bold block">
                  WAQAS POS SOFTWARE
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">
                  Better Shop Better Business
                </span>
              </div>
            </aside>
            <div className="flex-1" onClick={() => setIsMobileSidebarOpen(false)} />
          </div>
        )}

        {/* Desktop Permanent Left Sidebar (Hidden on small screens) */}
        <aside className="hidden lg:flex flex-col w-44 bg-[#06173a] text-slate-300 justify-between py-3 shrink-0 shadow-lg select-none border-r border-[#152e5a]">
          <div className="space-y-1 px-2">
            {/* 1. Dashboard / Home */}
            <button
              type="button"
              onClick={() => onNavigate('Home')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4 shrink-0 text-slate-400" />
              <span>Dashboard</span>
            </button>

            {/* 2. Sales (New Sale Page) */}
            <button
              type="button"
              onClick={() => onNavigate('New Sale POS')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4 shrink-0 text-slate-400" />
              <span>Sales</span>
            </button>

            {/* 3. Purchase (Active Green Pill) */}
            <div className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md">
              <ShoppingBag className="w-4 h-4 shrink-0 text-white" />
              <span>Purchase</span>
            </div>

            {/* 4. Stock */}
            <button
              type="button"
              onClick={() => onNavigate('Total Stock')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <Package className="w-4 h-4 shrink-0 text-slate-400" />
              <span>Stock</span>
            </button>

            {/* 5. Khata (Customer & Supplier Ledgers) */}
            <button
              type="button"
              onClick={() => onNavigate('Customer Ledgers')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4 shrink-0 text-slate-400" />
              <span>Khata</span>
            </button>

            {/* 6. Reports */}
            <button
              type="button"
              onClick={() => onNavigate('Daily Hisab')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0 text-slate-400" />
              <span>Reports</span>
            </button>

            {/* 7. Settings */}
            <button
              type="button"
              onClick={() => setIsBannerModalOpen(true)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4 shrink-0 text-slate-400" />
              <span>Settings</span>
            </button>
          </div>

          {/* WAQAS POS SOFTWARE Branding Card in Purchase Sidebar */}
          <div className="p-2">
            <WaqasBrandingCard variant="sidebar-dark" />
          </div>

          {/* Bottom Sidebar Switcher to Classic Purchase */}
          <div className="px-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => onNavigate('Purchase Entry')}
              className="w-full py-1.5 px-2 bg-white/5 hover:bg-white/15 rounded-xl text-[10px] font-bold text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Layers className="w-3 h-3" />
              <span>Classic Purchase</span>
            </button>
          </div>
        </aside>

        {/* Main Workstation (Uses 100% full screen width on mobile, no overflow) */}
        <main className="flex-1 min-h-0 flex flex-col p-2.5 sm:p-3 overflow-y-auto overflow-x-hidden min-w-0 w-full max-w-full gap-2.5">
          {/* ============================================================== */}
          {/* TOP 4 CARDS: SUPPLIER, PAYMENT, NAVIGATION, PROMO BANNER       */}
          {/* ============================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-2.5">
            {/* Card 1: Supplier & Invoice Information (5 columns) */}
            <div className="lg:col-span-5 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase">Ref No</label>
                  <input
                    type="text"
                    disabled
                    value={refNo}
                    onChange={(e) => setRefNo(e.target.value)}
                    className="w-full mt-0.5 px-2.5 py-1 text-xs font-black text-blue-900 bg-blue-50/70 border border-blue-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase">Supplier Invoice #</label>
                  <input
                    type="text"
                    disabled={isReadOnly && !isEditing}
                    value={supplierInvoiceNo}
                    onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                    className="w-full mt-0.5 px-2.5 py-1 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase">Date</label>
                  <input
                    type="date"
                    disabled={isReadOnly && !isEditing}
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full mt-0.5 px-2 py-1 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase">Entry Date</label>
                  <input
                    type="date"
                    disabled={isReadOnly && !isEditing}
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full mt-0.5 px-2 py-1 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Supplier selector with + New Supplier button */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase">Supplier</label>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => setIsNewSupplierModalOpen(true)}
                      className="text-[10px] font-black text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200"
                    >
                      <Plus className="w-3 h-3 stroke-[3]" />
                      <span>New Supplier</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <select
                    disabled={isReadOnly && !isEditing}
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="flex-1 px-2 py-1 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Supplier / سپلائر منتخب کریں</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.id} - {s.name} ({s.businessName || 'Wholesaler'}) - Bal: {formatRs(s.payableBalance || 0)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Phone & Address & TRN & Remarks */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase">Phone #</label>
                  <input
                    type="text"
                    disabled={isReadOnly && !isEditing}
                    value={supplierPhone}
                    onChange={(e) => setSupplierPhone(e.target.value)}
                    placeholder="Supplier phone"
                    className="w-full mt-0.5 px-2 py-1 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase">TRN #</label>
                  <input
                    type="text"
                    disabled={isReadOnly && !isEditing}
                    value={supplierTrn}
                    onChange={(e) => setSupplierTrn(e.target.value)}
                    placeholder="Tax Reg No"
                    className="w-full mt-0.5 px-2 py-1 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase">Address</label>
                  <input
                    type="text"
                    disabled={isReadOnly && !isEditing}
                    value={supplierAddress}
                    onChange={(e) => setSupplierAddress(e.target.value)}
                    placeholder="Supplier location"
                    className="w-full mt-0.5 px-2 py-1 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase">Remarks</label>
                  <input
                    type="text"
                    disabled={isReadOnly && !isEditing}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Purchase notes"
                    className="w-full mt-0.5 px-2 py-1 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Payment Method, VAT Type & Store (2.5 columns) */}
            <div className="lg:col-span-2 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
              {/* Payment Method */}
              <div>
                <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">
                  Payment Method
                </label>
                <div className="space-y-1.5 text-xs font-bold text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      disabled={isReadOnly && !isEditing}
                      name="payMethod"
                      checked={paymentMethod === 'cash'}
                      onChange={() => setPaymentMethod('cash')}
                      className="accent-emerald-600 w-3.5 h-3.5 disabled:cursor-not-allowed"
                    />
                    <span>Cash</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      disabled={isReadOnly && !isEditing}
                      name="payMethod"
                      checked={paymentMethod === 'credit'}
                      onChange={() => setPaymentMethod('credit')}
                      className="accent-emerald-600 w-3.5 h-3.5 disabled:cursor-not-allowed"
                    />
                    <span>Credit</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      disabled={isReadOnly && !isEditing}
                      name="payMethod"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                      className="accent-emerald-600 w-3.5 h-3.5 disabled:cursor-not-allowed"
                    />
                    <span>Card</span>
                  </label>
                </div>
              </div>

              {/* VAT Type */}
              <div className="pt-2 border-t border-slate-100">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">
                  Vat Type
                </label>
                <div className="space-y-1.5 text-xs font-bold text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      disabled={isReadOnly && !isEditing}
                      name="vatType"
                      checked={vatType === 'Default VAT'}
                      onChange={() => setVatType('Default VAT')}
                      className="accent-emerald-600 w-3.5 h-3.5 disabled:cursor-not-allowed"
                    />
                    <span>Default VAT</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      disabled={isReadOnly && !isEditing}
                      name="vatType"
                      checked={vatType === 'Out of Scope'}
                      onChange={() => setVatType('Out of Scope')}
                      className="accent-emerald-600 w-3.5 h-3.5 disabled:cursor-not-allowed"
                    />
                    <span>Out of Scope</span>
                  </label>
                </div>
              </div>

              {/* Select Store */}
              <div className="pt-2 border-t border-slate-100">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">
                  Select Store
                </label>
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="w-full px-2 py-1 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="Main Store">Main Store</option>
                  <option value="Warehouse A">Warehouse A</option>
                  <option value="Wholesale Branch">Wholesale Branch</option>
                </select>
              </div>
            </div>

            {/* Card 3: Record Navigation & Search (2.5 columns) */}
            <div className="lg:col-span-2 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5">
              {/* Record Navigation Buttons: |<< << >> >>| */}
              <div className="flex items-center justify-between bg-blue-50 p-1 rounded-xl border border-blue-200">
                <button
                  type="button"
                  onClick={() => handleNavigatePurchase('first')}
                  className="p-1 hover:bg-blue-200/70 rounded text-blue-900 transition-colors cursor-pointer"
                  title="First Purchase"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigatePurchase('prev')}
                  className="p-1 hover:bg-blue-200/70 rounded text-blue-900 transition-colors cursor-pointer"
                  title="Previous Purchase"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-black text-blue-950">Record</span>
                <button
                  type="button"
                  onClick={() => handleNavigatePurchase('next')}
                  className="p-1 hover:bg-blue-200/70 rounded text-blue-900 transition-colors cursor-pointer"
                  title="Next Purchase"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigatePurchase('last')}
                  className="p-1 hover:bg-blue-200/70 rounded text-blue-900 transition-colors cursor-pointer"
                  title="Last Purchase"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>

              {/* Search by ReferNo */}
              <div className="flex items-center rounded-xl bg-slate-50 border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                <input
                  type="text"
                  value={searchReferNo}
                  onChange={(e) => setSearchReferNo(e.target.value)}
                  placeholder="Search by ReferNo"
                  className="w-full px-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const match = purchases.find((p) => p.refNo === searchReferNo || p.purchaseInvoiceNo.includes(searchReferNo));
                    if (match) {
                      setRefNo(match.refNo || match.purchaseInvoiceNo.replace('PUR-', ''));
                      setPurchaseItems(match.items);
                      setSelectedSupplierId(match.supplierId);
                      showToast(`Found purchase ${match.purchaseInvoiceNo}`, 'success');
                    } else {
                      showToast(`No purchase found with Ref #${searchReferNo}`, 'error');
                    }
                  }}
                  className="p-1.5 bg-[#0c66d6] text-white hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Entry # & Sup Inv # */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500">Entry #:</span>
                  <span className="font-mono font-bold text-slate-800">{refNo}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500">Sup Inv #:</span>
                  <span className="font-mono font-bold text-slate-800">{supplierInvoiceNo}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500">User Name:</span>
                  <span className="font-bold text-blue-950">{currentUser.displayName || 'Admin 102'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500">Edit by:</span>
                  <span className="text-slate-400">---</span>
                </div>
              </div>
            </div>

            {/* Card 4: Right Top Purchase Summary & Status */}
            <div className="lg:col-span-3 bg-gradient-to-br from-[#061e47] via-[#082a5e] to-[#041a38] text-white p-3 rounded-2xl border border-blue-500/30 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    PURCHASE SUMMARY
                  </span>
                  <span className="text-[10px] text-slate-300 font-mono">
                    Ref #{refNo}
                  </span>
                </div>
                <h4 className="text-sm font-black text-white leading-tight">
                  {isReadOnly ? 'Saved Purchase (Locked)' : isEditing ? 'Editing Saved Invoice' : 'New Purchase Inflow'}
                </h4>
                <p className="text-[10px] text-blue-200 mt-0.5 truncate">
                  Supplier: {activeSupplier ? activeSupplier.name : 'Select Supplier'}
                </p>
              </div>

              <div className="pt-2 border-t border-white/10 mt-2 flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-slate-300 block uppercase font-bold">Total Bill</span>
                  <span className="text-base font-black text-amber-300">
                    {formatRs(calculations.totalAmount)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPurchaseHistoryOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  <Clock className="w-3 h-3 text-amber-300" />
                  <span>History</span>
                </button>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* ITEM SEARCH & SCANNER BAR (RESPONSIVE FOR MOBILE & DESKTOP)    */}
          {/* ============================================================== */}
          <div className="bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
            {/* Item Search Input */}
            <div className="flex-1 min-w-[200px] relative" ref={searchInputRef}>
              <div className="flex items-center rounded-xl bg-slate-50 border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                <div className="pl-3 text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  ref={itemInputRef}
                  type="text"
                  value={itemSearchQuery}
                  disabled={isReadOnly && !isEditing}
                  onChange={(e) => {
                    setItemSearchQuery(e.target.value);
                    setHighlightedIndex(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setHighlightedIndex((prev) => {
                        if (itemSuggestions.length === 0) return null;
                        if (prev === null || prev >= itemSuggestions.length - 1) return 0;
                        return prev + 1;
                      });
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setHighlightedIndex((prev) => {
                        if (itemSuggestions.length === 0) return null;
                        if (prev === null || prev <= 0) return itemSuggestions.length - 1;
                        return prev - 1;
                      });
                    } else if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();

                      if (isReadOnly && !isEditing) {
                        showToast('بل ریڈ اونلی موڈ میں ہے۔ تبدیل کرنے کے لیے Edit Invoice پر کلک کریں۔', 'error');
                        return;
                      }

                      const q = itemSearchQuery.trim();
                      if (!q && highlightedIndex === null) return;

                      // 1. Highlighted selection
                      if (highlightedIndex !== null && itemSuggestions[highlightedIndex]) {
                        handleAddItemToPurchase(itemSuggestions[highlightedIndex]);
                        return;
                      }

                      // 2. Exact Barcode Match (Prioritized)
                      const barcodeMatch = products.find(
                        (p) =>
                          (p.barcode || '').toLowerCase() === q.toLowerCase() ||
                          (p.sku || '').toLowerCase() === q.toLowerCase()
                      );
                      if (barcodeMatch) {
                        handleAddItemToPurchase(barcodeMatch);
                        return;
                      }

                      // 3. Exact Name Match
                      const nameMatch = products.find(
                        (p) => (p.name || '').toLowerCase() === q.toLowerCase()
                      );
                      if (nameMatch) {
                        handleAddItemToPurchase(nameMatch);
                        return;
                      }

                      // 4. First suggestion
                      if (itemSuggestions.length > 0) {
                        handleAddItemToPurchase(itemSuggestions[0]);
                        return;
                      }

                      // 5. Fallback barcode scan check
                      if (q) {
                        handleBarcodeDetected(q);
                      }
                    }
                  }}
                  placeholder={
                    isReadOnly && !isEditing
                      ? 'Bill is in Read-Only Mode. Click Edit Invoice to modify...'
                      : 'Item Search or Barcode (Press Enter to add)...'
                  }
                  className="w-full px-3 py-2 text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setIsCameraScannerOpen(true)}
                  disabled={isReadOnly && !isEditing}
                  className="px-2.5 py-2 text-blue-600 hover:text-blue-800 transition-colors cursor-pointer disabled:text-slate-300"
                  title="Barcode camera search"
                >
                  <BarcodeIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Autocomplete Suggestions */}
              {showItemSuggestions && itemSuggestions.length > 0 && !isReadOnly && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {itemSuggestions.map((prod, idx) => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => handleAddItemToPurchase(prod)}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors cursor-pointer ${
                        highlightedIndex === idx ? 'bg-blue-100/80 font-bold' : 'hover:bg-blue-50'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800">{prod.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Barcode: {prod.barcode} • Stock: {prod.stock} {prod.unit}
                        </p>
                      </div>
                      <span className="text-xs font-black text-emerald-600">
                        Cost: {formatRs(prod.costPrice)}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* No match indicator */}
              {itemSearchQuery.trim().length > 1 && itemSuggestions.length === 0 && showItemSuggestions && !isReadOnly && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 p-3 z-50 text-center">
                  <p className="text-xs font-bold text-slate-700">Product Not Found — Add New Item</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    کوئی پروڈکٹ نہیں ملا۔ نیا پروڈکٹ درج کریں۔
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenAddProduct();
                      setItemSearchQuery('');
                      setShowItemSuggestions(false);
                    }}
                    className="mt-2 px-3 py-1 bg-emerald-600 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-700"
                  >
                    + Add New Item
                  </button>
                </div>
              )}
            </div>

            {/* Responsive Actions & Dropdowns Row on Mobile */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
              {/* Serial / IMEI input */}
              <div className="w-full sm:w-32">
                <input
                  type="text"
                  disabled={isReadOnly && !isEditing}
                  value={serialImei}
                  onChange={(e) => setSerialImei(e.target.value)}
                  placeholder="Serial / IMEI"
                  className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Camera Barcode Scanner Button */}
              <button
                type="button"
                disabled={isReadOnly && !isEditing}
                onClick={() => setIsCameraScannerOpen(true)}
                className="w-full sm:w-auto px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed"
                title="Scan barcode with camera"
              >
                <ScanBarcode className="w-4 h-4" />
                <span>Scan Barcode</span>
              </button>

              {/* Expenses / Services dropdown */}
              <div className="w-full sm:w-36">
                <select
                  disabled={isReadOnly && !isEditing}
                  className="w-full px-2 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="Expenses/Services">Expenses/Services</option>
                  <option value="Freight">Freight / کرایہ</option>
                  <option value="Loading">Loading / مزدوری</option>
                </select>
              </div>

              {/* Non dropdown */}
              <div className="w-full sm:w-24">
                <select
                  disabled={isReadOnly && !isEditing}
                  className="w-full px-2 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="Non">Non</option>
                  <option value="VAT 5%">VAT 5%</option>
                  <option value="Zero">Zero</option>
                </select>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* CENTRAL PURCHASE TABLE & RIGHT METRICS SUMMARY                 */}
          {/* ============================================================== */}
          <div className="flex-1 flex flex-col lg:flex-row gap-2.5 min-h-[280px]">
            {/* Purchase Items Table Container with controlled horizontal scroll */}
            <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden min-w-0">
              <div className="w-full overflow-x-auto">
                <div className="min-w-[780px] flex flex-col">
                  {/* Header Bar */}
                  <div className="bg-[#0b4ea2] text-white flex items-center text-[11px] font-extrabold uppercase tracking-wider py-2 select-none shadow-xs">
                    <div className="w-8 text-center">No</div>
                    <div className="w-28 px-1">Barcode</div>
                    <div className="flex-1 px-2 text-left">Item Name</div>
                    <div className="w-14 text-center">Qty</div>
                    <div className="w-18 text-right px-1">Price</div>
                    <div className="w-20 text-right px-1">Net Amount</div>
                    <div className="w-12 text-center">VAT</div>
                    <div className="w-20 text-right px-1">WVAT</div>
                    <div className="w-18 text-right px-1">F-Price</div>
                    <div className="w-18 text-right px-1">Sale Price</div>
                    <div className="w-16 text-center">Store</div>
                    <div className="w-16 text-center">Location</div>
                    <div className="w-16 text-right px-1">W-Cost</div>
                    <div className="w-10 text-center"></div>
                  </div>

              {/* Rows Body */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 bg-white">
                {purchaseItems.length === 0 ? (
                  <div className="h-full py-12 flex flex-col items-center justify-center text-slate-300">
                    <Package className="w-10 h-10 stroke-[1.2] mb-1.5 text-slate-300" />
                    <p className="text-xs font-bold text-slate-400">No purchase items entered</p>
                    <p className="text-[11px] text-slate-400">Search products or scan barcode above</p>
                  </div>
                ) : (
                  purchaseItems.map((item, idx) => {
                    const isSelected = selectedRowIndex === idx;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedRowIndex(idx)}
                        className={`flex items-center text-xs py-1.5 transition-colors cursor-pointer border-r border-slate-100 ${
                          isSelected
                            ? 'bg-emerald-50/80 border-l-4 border-l-emerald-600 font-semibold'
                            : idx % 2 === 0
                            ? 'bg-white hover:bg-slate-50'
                            : 'bg-slate-50/50 hover:bg-slate-50'
                        }`}
                      >
                        {/* 1. No */}
                        <div className="w-8 text-center font-bold text-slate-500">{idx + 1}</div>

                        {/* 2. Barcode */}
                        <div className="w-28 px-1 font-mono text-[11px] text-slate-700 truncate">
                          {item.barcode}
                        </div>

                        {/* 3. Item Name & Thumbnail */}
                        <div className="flex-1 px-2 font-bold text-slate-800 truncate flex items-center gap-1.5 min-w-0" title={item.productName}>
                          {(() => {
                            const p = products.find((pr) => pr.id === item.productId);
                            return p?.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={item.productName}
                                className="w-5 h-5 rounded object-cover border border-slate-200 shrink-0"
                              />
                            ) : null;
                          })()}
                          <span className="truncate">{item.productName}</span>
                        </div>

                        {/* 4. Qty */}
                        <div className="w-14 text-center px-0.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="number"
                            step="any"
                            min="0.1"
                            disabled={isReadOnly && !isEditing}
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateItemField(idx, 'quantity', parseFloat(e.target.value) || 0)
                            }
                            className="w-full text-center font-black text-slate-900 bg-white border border-slate-200 rounded px-1 py-0.5 focus:border-blue-500 focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                          />
                        </div>

                        {/* 5. Price (Purchase Cost) */}
                        <div className="w-18 text-right px-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="number"
                            step="any"
                            disabled={isReadOnly && !isEditing}
                            value={item.purchaseCost}
                            onChange={(e) =>
                              handleUpdateItemField(idx, 'purchaseCost', parseFloat(e.target.value) || 0)
                            }
                            className="w-full text-right font-bold text-slate-800 bg-white border border-slate-200 rounded px-1 py-0.5 focus:border-blue-500 focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                          />
                        </div>

                        {/* 6. Net Amount */}
                        <div className="w-20 text-right px-1 font-bold text-slate-800">
                          {item.lineTotal.toFixed(2)}
                        </div>

                        {/* 7. VAT */}
                        <div className="w-12 text-center text-red-600 font-bold">
                          {item.vat ? item.vat.toFixed(2) : '00'}
                        </div>

                        {/* 8. WVAT */}
                        <div className="w-20 text-right px-1 font-bold text-slate-700">
                          {item.lineTotal.toFixed(2)}
                        </div>

                        {/* 9. F-Price */}
                        <div className="w-18 text-right px-1 text-slate-600">
                          {item.fPrice ? item.fPrice.toFixed(2) : item.salePrice || 0}
                        </div>

                        {/* 10. Sale Price */}
                        <div className="w-18 text-right px-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="number"
                            step="any"
                            disabled={isReadOnly && !isEditing}
                            value={item.salePrice || 0}
                            onChange={(e) =>
                              handleUpdateItemField(idx, 'salePrice', parseFloat(e.target.value) || 0)
                            }
                            className="w-full text-right font-black text-emerald-700 bg-white border border-slate-200 rounded px-1 py-0.5 focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                          />
                        </div>

                        {/* 11. Store */}
                        <div className="w-16 text-center text-[10px] text-slate-500 truncate">
                          {item.store || 'Main'}
                        </div>

                        {/* 12. Location */}
                        <div className="w-16 text-center text-[10px] text-slate-500">
                          {item.location || 'A-1'}
                        </div>

                        {/* 13. W-Cost */}
                        <div className="w-16 text-right px-1 font-bold text-emerald-600">
                          {item.wCost || item.purchaseCost}
                        </div>

                        {/* 14. Delete row action (Requires confirmation modal) */}
                        <div className="w-10 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            disabled={isReadOnly && !isEditing}
                            onClick={() => {
                              if (isReadOnly && !isEditing) return;
                              setItemToDeleteIndex(idx);
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Delete this purchase item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

            {/* Right Side Summary Panel (Vertical stack matching screenshot) */}
            <div className="w-full lg:w-60 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between gap-1.5 shrink-0">
              {/* Gross Total */}
              <div className="flex items-center justify-between p-2 bg-[#dcfce7]/70 border border-emerald-200 rounded-xl">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  Gross Total
                </span>
                <span className="text-xs font-black text-emerald-950">
                  {calculations.grossTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Discount */}
              <div className="flex items-center justify-between p-2 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Discount
                </span>
                <span className="text-xs font-bold text-amber-950">
                  {calculations.discount ? calculations.discount.toFixed(2) : '00'}
                </span>
              </div>

              {/* VAT */}
              <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  VAT
                </span>
                <span className="text-xs font-bold text-blue-950">
                  {calculations.vat ? calculations.vat.toFixed(2) : '00'}
                </span>
              </div>

              {/* Roundoff */}
              <div className="flex items-center justify-between p-2 bg-purple-50 border border-purple-200 rounded-xl">
                <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  Roundoff
                </span>
                <span className="text-xs font-bold text-purple-950">
                  {calculations.roundoff ? calculations.roundoff.toFixed(2) : '00'}
                </span>
              </div>

              {/* Total Amount (Royal Blue Bar) */}
              <div className="flex items-center justify-between p-2.5 bg-[#0b5cd5] text-white rounded-xl shadow-sm">
                <span className="text-xs font-black uppercase tracking-wider text-blue-100 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-yellow-300" />
                  Total Amount
                </span>
                <span className="text-base font-black text-yellow-300">
                  {calculations.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Payment */}
              <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                  Payment
                </span>
                <span className="text-xs font-black text-emerald-950">
                  {calculations.paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Outstanding */}
              <div className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded-xl">
                <span className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  Outstanding
                </span>
                <span className="text-xs font-black text-red-950">
                  {calculations.outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Total QTY */}
              <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-blue-600" />
                  Total QTY
                </span>
                <span className="text-sm font-black text-blue-950">{calculations.totalQty}</span>
              </div>

              {/* Cost Panel (Discount % and Amount) */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500">Discount %:</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    disabled={isReadOnly && !isEditing}
                    value={costDiscountPercent || ''}
                    onChange={(e) => setCostDiscountPercent(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-16 px-1.5 py-0.5 text-right font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500">Discount Amount:</span>
                  <input
                    type="number"
                    min="0"
                    disabled={isReadOnly && !isEditing}
                    value={costDiscountAmount || ''}
                    onChange={(e) => setCostDiscountAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-20 px-1.5 py-0.5 text-right font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* LOWER PANELS: STOCK INFO, PURCHASE/ORDERS, ORDERS              */}
          {/* ============================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {/* Panel 1: Stock Info */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5 text-xs">
              <div className="flex items-center gap-2 font-black text-slate-800 border-b border-slate-100 pb-1.5">
                <Package className="w-4 h-4 text-blue-600" />
                <span>Stock Info</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-bold">Stock Qty:</span>
                  <span className="font-bold text-slate-800">{selectedItem?.currentStock ?? '0'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-bold">Cost Price:</span>
                  <span className="font-bold text-slate-800">{selectedItem?.purchaseCost ?? '0.00'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-bold">Sales Price:</span>
                  <span className="font-bold text-emerald-700">{selectedItem?.salePrice ?? '0.00'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-bold">Location:</span>
                  <span className="font-mono text-slate-600">{selectedItem?.location || 'A-1'}</span>
                </div>
              </div>
            </div>

            {/* Panel 2: Purchase/Orders */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5 text-xs">
              <div className="flex items-center gap-2 font-black text-slate-800 border-b border-slate-100 pb-1.5">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <span>Purchase/Orders</span>
              </div>
              <div className="grid grid-cols-3 text-[10px] font-bold text-slate-400 uppercase py-0.5 border-b border-slate-100">
                <span>Date</span>
                <span>Ref #</span>
                <span className="text-right">Amount</span>
              </div>
              <div className="space-y-1 max-h-16 overflow-y-auto">
                {purchases.slice(0, 3).map((p) => (
                  <div key={p.id} className="grid grid-cols-3 text-[11px] text-slate-700">
                    <span>{p.purchaseDate}</span>
                    <span className="font-mono">{p.refNo || p.purchaseInvoiceNo}</span>
                    <span className="text-right font-bold text-emerald-700">{formatRs(p.grandTotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel 3: Orders */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5 text-xs">
              <div className="flex items-center gap-2 font-black text-slate-800 border-b border-slate-100 pb-1.5">
                <FileText className="w-4 h-4 text-purple-600" />
                <span>Orders</span>
              </div>
              <div className="grid grid-cols-4 text-[10px] font-bold text-slate-400 uppercase py-0.5 border-b border-slate-100">
                <span>Date</span>
                <span>Ref #</span>
                <span>Qty</span>
                <span className="text-right">Price</span>
              </div>
              <div className="text-[11px] text-slate-400 py-1 text-center">
                <span>No active supplier orders pending</span>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* BOTTOM ACTION BUTTONS (11 BUTTONS MATCHING REFERENCE)          */}
          {/* ============================================================== */}
          <div className="flex flex-wrap items-center gap-2 pt-1 pb-2 shrink-0">
            {/* 1. + New Purchase (Green) */}
            <button
              type="button"
              onClick={handleNewPurchase}
              className="flex-1 min-w-[120px] py-2 px-3 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-black shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>New Purchase</span>
            </button>

            {/* 2. Import (Sky Blue) */}
            <button
              type="button"
              onClick={() => showToast('Purchase Excel/CSV import enabled.', 'info')}
              className="py-2 px-3 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
            </button>

            {/* 3. Stock Enquiry (Purple) */}
            <button
              type="button"
              onClick={() => setIsStockEnquiryOpen(true)}
              className="py-2 px-3 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Stock Enquiry</span>
            </button>

            {/* 4. F4: Create Item (Amber/Orange) */}
            <button
              type="button"
              onClick={onOpenAddProduct}
              className="py-2 px-3 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-black shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>F4: Create Item</span>
            </button>

            {/* 5. One (Delete Selected Row with Confirmation) */}
            <button
              type="button"
              onClick={() => {
                if (selectedRowIndex !== null && purchaseItems[selectedRowIndex]) {
                  setItemToDeleteIndex(selectedRowIndex);
                } else if (purchaseItems.length > 0) {
                  setItemToDeleteIndex(purchaseItems.length - 1);
                } else {
                  showToast('No item selected to delete', 'info');
                }
              }}
              className="py-2 px-3 rounded-xl bg-[#64748b] hover:bg-[#475569] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>One</span>
            </button>

            {/* 6. All (Delete All) */}
            <button
              type="button"
              onClick={handleDeleteAllItems}
              className="py-2 px-3 rounded-xl bg-[#0891b2] hover:bg-[#0e7490] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>All</span>
            </button>

            {/* 7. Save / Save Changes / Edit Action */}
            {isEditing ? (
              <button
                type="button"
                onClick={handleSavePurchaseAction}
                disabled={isSaving || purchaseItems.length === 0}
                className="flex-1 min-w-[110px] py-2 px-3 rounded-xl bg-[#15803d] hover:bg-[#166534] text-white text-xs font-black shadow-sm flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer disabled:bg-slate-400"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            ) : isReadOnly ? (
              <button
                type="button"
                onClick={handleStartEditing}
                className="flex-1 min-w-[110px] py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-sm flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Invoice</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSavePurchaseAction}
                disabled={isSaving || purchaseItems.length === 0}
                className="flex-1 min-w-[110px] py-2 px-3 rounded-xl bg-[#15803d] hover:bg-[#166534] text-white text-xs font-black shadow-sm flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer disabled:bg-slate-400"
              >
                <Save className="w-3.5 h-3.5" />
                <span>F2: Save</span>
              </button>
            )}

            {/* 8. F10: Print (Blue) */}
            <button
              type="button"
              onClick={() => {
                const currentPurch = purchases.find((p) => p.id === editingPurchaseId) || ({
                  id: `pur-${refNo}`,
                  purchaseInvoiceNo: `PUR-${refNo}`,
                  purchaseDate,
                  supplierId: selectedSupplierId,
                  supplierName: activeSupplier?.name || 'Supplier',
                  supplierInvoiceNo,
                  items: purchaseItems,
                  subtotal: calculations.grossTotal,
                  totalDiscount: calculations.discount,
                  totalTax: calculations.vat,
                  grandTotal: calculations.totalAmount,
                  amountPaid: calculations.paid,
                  remainingBalance: calculations.outstanding,
                  paymentMethod,
                  createdAt: new Date().toISOString(),
                  status: 'saved',
                } as PurchaseTransaction);
                setCurrentPrintPurchase(currentPurch);
              }}
              className="py-2 px-3 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>F10: Print</span>
            </button>

            {/* 9. Edit / Cancel Edit / + New Bill */}
            {isEditing ? (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="py-2 px-3 rounded-xl bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel Edit</span>
              </button>
            ) : isReadOnly ? (
              <button
                type="button"
                onClick={handleNewPurchase}
                className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ New Bill</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartEditing}
                className="py-2 px-3 rounded-xl bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Invoice</span>
              </button>
            )}

            {/* 10. Purchase List / History (Teal) */}
            <button
              type="button"
              onClick={() => setIsPurchaseHistoryOpen(true)}
              className="py-2 px-3 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Purchase List ({purchases.length})</span>
            </button>

            {/* 11. F12: Exit (Red) */}
            <button
              type="button"
              onClick={() => onNavigate('Home')}
              className="py-2 px-3 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-black shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>F12: Exit</span>
            </button>
          </div>
        </main>
      </div>

      {/* ============================================================== */}
      {/* 3. FOOTER STATUS BAR (MATCHING REFERENCE)                     */}
      {/* ============================================================== */}
      <footer className="bg-[#021535] text-slate-300 px-4 py-2 text-xs flex items-center justify-between border-t border-[#132d59] select-none">
        <div className="flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-extrabold text-white">Waqas Mart Sale App</span>
          <span className="text-slate-500">|</span>
          <span className="font-semibold text-slate-300">Purchase Entry</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-bold">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Online</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <Printer className="w-3.5 h-3.5" />
            <span>Ready</span>
          </div>
        </div>
      </footer>

      {/* ============================================================== */}
      {/* MODAL: Delete Item Confirmation (Requirement 5)              */}
      {/* ============================================================== */}
      {itemToDeleteIndex !== null && purchaseItems[itemToDeleteIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-red-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-white" />
                <h3 className="font-bold text-base">Confirm Item Deletion</h3>
              </div>
              <button
                type="button"
                onClick={() => setItemToDeleteIndex(null)}
                className="p-1 text-red-200 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-2 text-xs text-slate-700">
              <p className="font-bold text-sm text-slate-900">
                Are you sure you want to remove this item from the current purchase?
              </p>
              <p className="p-2 bg-slate-50 rounded-lg border border-slate-200 font-bold text-slate-800">
                {purchaseItems[itemToDeleteIndex].productName} (Qty: {purchaseItems[itemToDeleteIndex].quantity})
              </p>
              <p className="text-slate-500 text-[11px]">
                Note: This only removes the item from this purchase invoice. It does NOT delete the product from your inventory database.
              </p>
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setItemToDeleteIndex(null)}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteItem}
                className="px-4 py-1.5 text-xs font-black text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: + New Supplier Creation (Requirement 6)               */}
      {/* ============================================================== */}
      {isNewSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Add New Supplier / نیا سپلائر</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewSupplierModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700">Supplier Name *</label>
                  <input
                    type="text"
                    required
                    value={newSupName}
                    onChange={(e) => setNewSupName(e.target.value)}
                    placeholder="e.g. Javed ali traders"
                    className="w-full mt-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Business / Company Name</label>
                  <input
                    type="text"
                    value={newSupBusiness}
                    onChange={(e) => setNewSupBusiness(e.target.value)}
                    placeholder="e.g. Traders & Distributors"
                    className="w-full mt-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700">Phone Number</label>
                  <input
                    type="text"
                    value={newSupPhone}
                    onChange={(e) => setNewSupPhone(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full mt-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">TRN # (Tax Reg)</label>
                  <input
                    type="text"
                    value={newSupTrn}
                    onChange={(e) => setNewSupTrn(e.target.value)}
                    placeholder="e.g. 100293847500003"
                    className="w-full mt-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700">Address / City</label>
                  <input
                    type="text"
                    value={newSupAddress}
                    onChange={(e) => setNewSupAddress(e.target.value)}
                    placeholder="Shop #12, Wholesale Market"
                    className="w-full mt-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Opening Payable Balance (Rs.)</label>
                  <input
                    type="number"
                    value={newSupBalance || ''}
                    onChange={(e) => setNewSupBalance(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full mt-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none font-bold text-red-600"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="font-bold text-slate-700">Remarks / Notes</label>
                <input
                  type="text"
                  value={newSupRemarks}
                  onChange={(e) => setNewSupRemarks(e.target.value)}
                  placeholder="Payment terms, delivery days..."
                  className="w-full mt-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewSupplierModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm cursor-pointer"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: Customize Banner Text (User requirement at end of prompt)*/}
      {/* ============================================================== */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm">Customize Purchase Banner Text / بینر تبدیل کریں</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBannerModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="p-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">
                  Banner Title (بینر کا عنوان)
                </label>
                <input
                  type="text"
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  placeholder="Purchase Entry"
                  className="w-full mt-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">
                  Banner Subtitle (عنوان کے نیچے والا ٹیکسٹ)
                </label>
                <input
                  type="text"
                  value={bannerSubtitle}
                  onChange={(e) => setBannerSubtitle(e.target.value)}
                  placeholder="Keep Your Inventory Always Full"
                  className="w-full mt-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900">
                <p className="font-bold">Live Preview:</p>
                <div className="mt-1 p-2 bg-gradient-to-r from-blue-700 to-teal-700 text-white rounded-lg">
                  <p className="font-black text-sm">{bannerTitle || 'Purchase Entry'}</p>
                  <p className="text-[11px] text-emerald-200">{bannerSubtitle || 'Keep Your Inventory Always Full'}</p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  Save Text
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: Stock Enquiry                                           */}
      {/* ============================================================== */}
      {isStockEnquiryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Stock Enquiry / فوری اسٹاک معلومات</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsStockEnquiryOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 border-b border-slate-200">
              <input
                type="text"
                placeholder="Filter stock by name or barcode..."
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-3 divide-y divide-slate-100">
              {products.map((p) => (
                <div key={p.id} className="py-2 flex items-center justify-between text-xs hover:bg-slate-50 px-2 rounded-lg">
                  <div>
                    <p className="font-bold text-slate-800">{p.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Barcode: {p.barcode}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-slate-600">Cost: {formatRs(p.costPrice)}</span>
                    <span className="font-bold text-emerald-700">Sale: {formatRs(p.price)}</span>
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-black text-xs">
                      {p.stock} {p.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsStockEnquiryOpen(false)}
                className="px-4 py-1.5 text-xs font-bold bg-slate-800 text-white rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shared Purchase History / List Modal */}
      {isPurchaseHistoryOpen && (
        <SearchPurchasesModal
          isOpen={isPurchaseHistoryOpen}
          purchases={purchases}
          onClose={() => setIsPurchaseHistoryOpen(false)}
          onSelectToView={handleLoadPurchaseToView}
          onSelectToEdit={(p) => {
            handleLoadPurchaseToView(p);
            handleStartEditing();
          }}
          onPrintPurchase={(p) => setCurrentPrintPurchase(p)}
          onDeletePurchase={onDeletePurchase}
        />
      )}

      {/* Print Purchase Modal */}
      {currentPrintPurchase && (
        <PrintPurchaseModal
          isOpen={Boolean(currentPrintPurchase)}
          purchase={currentPrintPurchase}
          onClose={() => setCurrentPrintPurchase(null)}
        />
      )}

      {/* Mobile Camera Barcode Scanner Modal */}
      {isCameraScannerOpen && (
        <BarcodeScannerModal
          isOpen={isCameraScannerOpen}
          onClose={() => setIsCameraScannerOpen(false)}
          onBarcodeDetected={handleBarcodeDetected}
          pageContext="purchase"
          totalItems={calculations.totalQty}
          totalAmount={calculations.totalAmount}
        />
      )}

      {/* In-UI Confirm Clear Purchase Modal */}
      {showConfirmClearPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h3 className="text-base font-black text-slate-900 text-center">
              Clear All Purchase Items?
            </h3>
            <p className="text-xs text-slate-600 text-center mt-1">
              Are you sure you want to delete all <span className="font-bold text-red-600">{purchaseItems.length}</span> items from this purchase invoice?
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmClearPurchase(false)}
                className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 cursor-pointer"
              >
                Cancel / منسوخ
              </button>
              <button
                type="button"
                onClick={handleConfirmClearPurchase}
                className="py-2.5 px-4 rounded-xl text-xs font-black text-white bg-red-600 hover:bg-red-700 active:scale-95 shadow cursor-pointer"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

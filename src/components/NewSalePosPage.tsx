import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  ShoppingCart,
  Layers,
  ChevronDown,
  Minimize2,
  Maximize2,
  ArrowRight,
  LogOut,
  Info,
  DollarSign,
  Barcode as BarcodeIcon,
  Home,
  Calendar,
  Sparkles,
  Check,
  ArrowLeft,
  Menu,
  Eye,
  EyeOff,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import {
  Product,
  CartItem,
  SaleTransaction,
  HeldBill,
  Customer,
  StoreBranding,
  UserProfile,
  DeviceInfo,
} from '../types/pos';
import { formatRs } from '../data/defaultProducts';
import { sounds } from '../utils/audio';
import {
  calculateLineItem,
  calculateInvoiceTotals,
  round2,
} from '../utils/newPosCalculations';

interface NewSalePosPageProps {
  products: Product[];
  customers: Customer[];
  heldBills: HeldBill[];
  transactions: SaleTransaction[];
  branding: StoreBranding;
  currentUser: UserProfile;
  currentDevice: DeviceInfo;
  scannedBarcode?: string | null;
  onClearScannedBarcode?: () => void;
  onSaveInvoice: (invoiceData: {
    items: CartItem[];
    subtotal: number;
    discount: number;
    taxAmount: number;
    grandTotal: number;
    paymentMethod: 'cash' | 'card' | 'credit';
    cashTendered?: number;
    changeDue?: number;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    invoiceNumber: string;
    note?: string;
  }) => void;
  onHoldBill: (billData: {
    items: CartItem[];
    subtotal: number;
    discount: number;
    grandTotal: number;
    customerName?: string;
    customerPhone?: string;
  }) => void;
  onResumeHeldBill: (bill: HeldBill) => void;
  onDeleteHeldBill: (billId: string) => void;
  onOpenHeldBillsModal: () => void;
  onOpenScanner: () => void;
  onOpenAddProduct: () => void;
  onQuickAddCustomer: (customer: Customer) => void;
  onNavigate: (page: string) => void;
  onViewReceipt: (tx: SaleTransaction) => void;
  onSwitchToOldSale?: () => void;
  resumedBill?: HeldBill | null;
  onClearResumedBill?: () => void;
  onBackToHome?: () => void;
}

export const NewSalePosPage: React.FC<NewSalePosPageProps> = ({
  products,
  customers,
  heldBills,
  transactions,
  branding,
  currentUser,
  currentDevice,
  scannedBarcode,
  onClearScannedBarcode,
  onSaveInvoice,
  onHoldBill,
  onResumeHeldBill,
  onDeleteHeldBill,
  onOpenHeldBillsModal,
  onOpenScanner,
  onOpenAddProduct,
  onQuickAddCustomer,
  onNavigate,
  onViewReceipt,
  onSwitchToOldSale,
  resumedBill,
  onClearResumedBill,
  onBackToHome,
}) => {
  // Input refs and scanner control
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const itemNameInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const lastScanRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  // Generate sequential invoice number (e.g. 790+)
  const [invoiceNumber, setInvoiceNumber] = useState<string>(() => {
    return (790 + (transactions.length || 0)).toString();
  });

  // Current active date & time
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = useMemo(() => {
    const d = currentDateTime.getDate().toString().padStart(2, '0');
    const m = (currentDateTime.getMonth() + 1).toString().padStart(2, '0');
    const y = currentDateTime.getFullYear();
    return `${d}/${m}/${y}`;
  }, [currentDateTime]);

  const formattedTime = useMemo(() => {
    return currentDateTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }, [currentDateTime]);

  // Main Sales Table Items
  const [saleItems, setSaleItems] = useState<CartItem[]>([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);

  // Top Item Entry Bar state
  const [topBarcode, setTopBarcode] = useState('');
  const [topItemName, setTopItemName] = useState('');
  const [topQty, setTopQty] = useState<number>(1);
  const [topPrice, setTopPrice] = useState<number>(0);
  const [topDiscountPercent, setTopDiscountPercent] = useState<number>(0);
  const [topTaxPercent, setTopTaxPercent] = useState<number>(0);

  // Autocomplete / Search dropdown for Item Name
  const [nameSuggestions, setNameSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Customer & Payment state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'credit'>('cash');

  // Bottom Totals & Overrides
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [cashReceivedInput, setCashReceivedInput] = useState<string>('');
  const [invoiceDiscountOverride, setInvoiceDiscountOverride] = useState<number>(0);
  const [invoiceTaxOverride, setInvoiceTaxOverride] = useState<number>(0);

  // Check Item Details panel state (bottom right)
  const [detailsBarcode, setDetailsBarcode] = useState('');
  const [detailsItemName, setDetailsItemName] = useState('');
  const [detailsCategory, setDetailsCategory] = useState('Select Category');
  const [detailsQty, setDetailsQty] = useState<number>(1);
  const [detailsPrice, setDetailsPrice] = useState<number>(0);
  const [showMoreDetailsModal, setShowMoreDetailsModal] = useState(false);
  const [showCashierCost, setShowCashierCost] = useState(true);

  // Modals
  const [isSearchInvoiceModalOpen, setIsSearchInvoiceModalOpen] = useState(false);
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustBalance, setNewCustBalance] = useState<number>(0);
  const [showConfirmClearCart, setShowConfirmClearCart] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileMoreMenuOpen, setMobileMoreMenuOpen] = useState(false);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
          setIsFullscreen(false);
        }
      }
    } catch {}
  };

  // Toast / Status notification
  const [statusNotice, setStatusNotice] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setStatusNotice({ message, type });
    setTimeout(() => setStatusNotice(null), 3500);
  };

  // Auto-focus barcode input on mount
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Sync external scannedBarcode from universal scanner
  useEffect(() => {
    if (scannedBarcode && scannedBarcode.trim()) {
      handleBarcodeScanAdd(scannedBarcode.trim());
      if (onClearScannedBarcode) onClearScannedBarcode();
    }
  }, [scannedBarcode]);

  // Sync resumed bill
  useEffect(() => {
    if (resumedBill && resumedBill.items) {
      setSaleItems(resumedBill.items);
      setInvoiceDiscountOverride(resumedBill.discount || 0);
      showToast(`Resumed held bill "${resumedBill.id}" (${resumedBill.items.length} items)`, 'info');
      if (onClearResumedBill) onClearResumedBill();
    }
  }, [resumedBill]);

  // Click outside listener for item name autocomplete
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter item name suggestions on typing
  useEffect(() => {
    if (!topItemName.trim()) {
      setNameSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const q = topItemName.toLowerCase().trim();
    const matches = products
      .filter((p) => p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)))
      .slice(0, 8);
    setNameSuggestions(matches);
    setShowSuggestions(matches.length > 0);
  }, [topItemName, products]);

  // Active selected customer object
  const activeCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [selectedCustomerId, customers]);

  // Active selected item for details inspector
  const activeInspectorItem = useMemo(() => {
    if (selectedItemIndex !== null && saleItems[selectedItemIndex]) {
      return saleItems[selectedItemIndex];
    }
    if (saleItems.length > 0) {
      return saleItems[saleItems.length - 1];
    }
    return null;
  }, [selectedItemIndex, saleItems]);

  // Update Item Details pane when selection changes
  useEffect(() => {
    if (activeInspectorItem) {
      setDetailsBarcode(activeInspectorItem.product.barcode || '');
      setDetailsItemName(activeInspectorItem.product.name);
      setDetailsCategory(activeInspectorItem.product.category || 'General');
      setDetailsQty(activeInspectorItem.quantity);
      setDetailsPrice(activeInspectorItem.unitPrice);
    } else {
      setDetailsBarcode('');
      setDetailsItemName('');
      setDetailsCategory('Select Category');
      setDetailsQty(1);
      setDetailsPrice(0);
    }
  }, [activeInspectorItem]);

  // Financial Calculations
  const calculations = useMemo(() => {
    const lineCalculations = saleItems.map((item) =>
      calculateLineItem(
        item.quantity,
        item.unitPrice,
        item.discountPercent || 0,
        item.taxPercent || 0
      )
    );
    const invoiceTotals = calculateInvoiceTotals(
      saleItems,
      invoiceDiscountOverride,
      invoiceTaxOverride
    );
    return {
      lines: lineCalculations,
      ...invoiceTotals,
    };
  }, [saleItems, invoiceDiscountOverride, invoiceTaxOverride]);

  // Automatic Cash Change & Remaining Due calculations (Requirement 5)
  // Change to Return = Cash Received - Final Bill Total, if positive.
  // Remaining Due = Final Bill Total - Cash Received, if positive.
  const cashChangeCalculations = useMemo(() => {
    const finalBill = calculations.grandTotal;
    const received = Number(cashReceived) || 0;
    const changeToReturn = received > finalBill ? round2(received - finalBill) : 0;
    const remainingDue = received < finalBill ? round2(finalBill - received) : 0;
    return {
      changeToReturn,
      remainingDue,
    };
  }, [calculations.grandTotal, cashReceived]);

  // Stock Validation & Out-Of-Stock Blocking (Requirement 6)
  const validateProductStock = (product: Product, requestedQuantity: number, currentCartQuantity: number = 0): { valid: boolean; reason?: string } => {
    const currentStock = typeof product.stock === 'number' ? product.stock : 999;
    
    // Automatic Out of Stock detection
    if (currentStock <= 0) {
      return {
        valid: false,
        reason: `OUT OF STOCK — "${product.name}" is currently unavailable / اسٹاک ختم ہے`,
      };
    }

    const totalNeeded = currentCartQuantity + requestedQuantity;
    if (totalNeeded > currentStock) {
      return {
        valid: false,
        reason: `INSUFFICIENT STOCK — Only ${currentStock} pieces are available for "${product.name}" (آپ نے ${totalNeeded} مانگا ہے)`,
      };
    }

    return { valid: true };
  };

  // Add Product Directly with sound and stock checking
  const handleAddProductDirectly = (product: Product, quantityToAdd: number = 1) => {
    // 1. Find existing cart item to calculate total quantity
    const existingIndex = saleItems.findIndex((it) => it.product.id === product.id);
    const existingCartQty = existingIndex > -1 ? saleItems[existingIndex].quantity : 0;

    // 2. Validate stock
    const stockCheck = validateProductStock(product, quantityToAdd, existingCartQty);
    if (!stockCheck.valid) {
      sounds.playErrorTone();
      showToast(stockCheck.reason || 'Out of stock!', 'error');
      return;
    }

    sounds.playBarcodeBeep();
    if (existingIndex > -1) {
      const updated = [...saleItems];
      const newQty = round2(updated[existingIndex].quantity + quantityToAdd);
      const lineCalc = calculateLineItem(
        newQty,
        updated[existingIndex].unitPrice,
        updated[existingIndex].discountPercent || 0,
        updated[existingIndex].taxPercent || 0
      );
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: newQty,
        discountAmount: lineCalc.discountAmount,
        taxAmount: lineCalc.taxAmount,
        lineTotal: lineCalc.grossLineTotal,
        netAmount: lineCalc.netLineAmount,
      };
      setSaleItems(updated);
      setSelectedItemIndex(existingIndex);
      showToast(`Added +${quantityToAdd} "${product.name}" (Total: ${newQty})`, 'success');
    } else {
      const lineCalc = calculateLineItem(
        quantityToAdd,
        product.price,
        topDiscountPercent || 0,
        topTaxPercent || 0
      );
      const newItem: CartItem = {
        id: `sale-item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        product: product,
        quantity: quantityToAdd,
        unitPrice: product.price,
        discountPercent: topDiscountPercent || 0,
        discountAmount: lineCalc.discountAmount,
        taxPercent: topTaxPercent || 0,
        taxAmount: lineCalc.taxAmount,
        lineTotal: lineCalc.grossLineTotal,
        netAmount: lineCalc.netLineAmount,
      };
      const updated = [...saleItems, newItem];
      setSaleItems(updated);
      setSelectedItemIndex(updated.length - 1);
      showToast(`Added "${product.name}" - ${formatRs(product.price)}`, 'success');
    }

    // Reset top inputs
    setTopBarcode('');
    setTopItemName('');
    setTopPrice(0);
    setTopQty(1);
    setTopDiscountPercent(0);
    setTopTaxPercent(0);
    setShowSuggestions(false);
    setTimeout(() => barcodeInputRef.current?.focus(), 50);
  };

  // Barcode Scanner Handler
  const handleBarcodeScanAdd = (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    // Debounce duplicate instant scans
    const now = Date.now();
    if (lastScanRef.current.code === cleanCode && now - lastScanRef.current.time < 500) {
      return;
    }
    lastScanRef.current = { code: cleanCode, time: now };

    const match = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === cleanCode.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase() === cleanCode.toLowerCase())
    );

    if (match) {
      handleAddProductDirectly(match, topQty || 1);
    } else {
      sounds.playErrorTone();
      showToast(
        `Barcode not found: "${cleanCode}". Use + New Item or search name. / بارکوڈ نہیں ملا`,
        'error'
      );
      setTopBarcode(cleanCode);
    }
  };

  // Populate Top Entry when product selected from suggestions
  const populateTopEntry = (product: Product) => {
    setTopBarcode(product.barcode || '');
    setTopItemName(product.name);
    setTopQty(1);
    setTopPrice(product.price);
    setTopDiscountPercent(0);
    setTopTaxPercent(0);
    setShowSuggestions(false);
  };

  // Add Item from Top Entry Bar to Sales Table
  const handleAddTopItemToTable = () => {
    if (!topItemName.trim() && !topBarcode.trim()) {
      showToast('Please enter barcode or select an item first!', 'error');
      return;
    }

    const productMatch = products.find(
      (p) =>
        (topBarcode.trim() &&
          ((p.barcode && p.barcode.toLowerCase() === topBarcode.trim().toLowerCase()) ||
            (p.sku && p.sku.toLowerCase() === topBarcode.trim().toLowerCase()))) ||
        (topItemName.trim() && p.name.toLowerCase() === topItemName.trim().toLowerCase())
    );

    if (productMatch) {
      handleAddProductDirectly(productMatch, topQty || 1);
    } else {
      // Create ad-hoc item if custom name given
      const customPrice = topPrice > 0 ? topPrice : 0;
      if (!customPrice) {
        showToast('Please enter a price for this custom item!', 'error');
        return;
      }
      const customProd: Product = {
        id: `custom-${Date.now()}`,
        name: topItemName.trim() || `Item ${topBarcode.trim()}`,
        barcode: topBarcode.trim() || `GEN-${Date.now().toString().slice(-4)}`,
        price: customPrice,
        costPrice: Math.round(customPrice * 0.8),
        category: 'General',
        stock: 999,
        unit: 'Pcs',
      };
      handleAddProductDirectly(customProd, topQty || 1);
    }
  };

  // Update item quantity in table
  const handleUpdateItemQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    const item = saleItems[index];
    const stockCheck = validateProductStock(item.product, newQty, 0);
    if (!stockCheck.valid) {
      sounds.playErrorTone();
      showToast(stockCheck.reason || 'Insufficient stock!', 'error');
      return;
    }
    const updated = [...saleItems];
    updated[index] = { ...updated[index], quantity: round2(newQty) };
    setSaleItems(updated);
  };

  // Update item price in table
  const handleUpdateItemPrice = (index: number, newPrice: number) => {
    const updated = [...saleItems];
    updated[index] = { ...updated[index], unitPrice: Math.max(0, newPrice) };
    setSaleItems(updated);
  };

  // Update item discount percent
  const handleUpdateItemDiscountPercent = (index: number, disc: number) => {
    const updated = [...saleItems];
    updated[index] = { ...updated[index], discountPercent: Math.max(0, Math.min(100, disc)) };
    setSaleItems(updated);
  };

  // Remove single item from table
  const handleRemoveItem = (index: number) => {
    const item = saleItems[index];
    const updated = saleItems.filter((_, i) => i !== index);
    setSaleItems(updated);
    if (selectedItemIndex === index) {
      setSelectedItemIndex(updated.length > 0 ? Math.max(0, index - 1) : null);
    } else if (selectedItemIndex !== null && selectedItemIndex > index) {
      setSelectedItemIndex(selectedItemIndex - 1);
    }
    showToast(`Removed "${item.product.name}"`, 'info');
  };

  // Delete all items (with confirmation)
  const handleDeleteAllItems = () => {
    if (saleItems.length === 0) return;
    if (window.confirm(`Delete all ${saleItems.length} items from current sale? / تمام آئٹمز ڈیلیٹ کریں؟`)) {
      setSaleItems([]);
      setSelectedItemIndex(null);
      setInvoiceDiscountOverride(0);
      setInvoiceTaxOverride(0);
      setCashReceived(0);
      setCashReceivedInput('');
      sounds.playErrorTone();
      showToast('All items cleared from sale table.', 'info');
    }
  };

  // Hold Bill handler
  const handleHoldCurrentBill = () => {
    if (saleItems.length === 0) {
      showToast('Sale is empty! Cannot park empty bill.', 'error');
      return;
    }
    onHoldBill({
      items: saleItems,
      subtotal: calculations.subtotal,
      discount: calculations.totalDiscount,
      grandTotal: calculations.grandTotal,
      customerName: activeCustomer?.name || 'Walk-in Customer',
      customerPhone: activeCustomer?.phone,
    });
    setSaleItems([]);
    setSelectedItemIndex(null);
    setInvoiceDiscountOverride(0);
    setInvoiceTaxOverride(0);
    setCashReceived(0);
    setCashReceivedInput('');
    showToast('Bill held successfully! (بل ہولڈ کر دیا گیا)', 'success');
  };

  // Save Invoice Action
  const handleSaveInvoiceAction = () => {
    if (saleItems.length === 0) {
      sounds.playErrorTone();
      showToast('Cannot save empty invoice! Add products first. / انوائس خالی ہے', 'error');
      return;
    }

    setIsSubmitting(true);
    const invoicePayload = {
      items: saleItems,
      subtotal: calculations.subtotal,
      discount: calculations.totalDiscount,
      taxAmount: calculations.totalTax,
      grandTotal: calculations.grandTotal,
      paymentMethod: paymentMethod,
      cashTendered: Number(cashReceived) || calculations.grandTotal,
      changeDue: cashChangeCalculations.changeToReturn,
      customerId: activeCustomer?.id,
      customerName: activeCustomer?.name || 'Walk-in Customer',
      customerPhone: activeCustomer?.phone,
      invoiceNumber: invoiceNumber,
      note: `Terminal Sale ${currentDevice.deviceName || 'Counter 01'}`,
    };

    onSaveInvoice(invoicePayload);
    sounds.playSuccessChime();
    showToast(`Invoice #${invoiceNumber} saved successfully! (انوائس محفوظ ہو گئی)`, 'success');

    // Reset for next sale
    setSaleItems([]);
    setSelectedItemIndex(null);
    setInvoiceDiscountOverride(0);
    setInvoiceTaxOverride(0);
    setCashReceived(0);
    setCashReceivedInput('');
    setInvoiceNumber((prev) => (parseInt(prev, 10) + 1).toString());
    setIsSubmitting(false);
  };

  // New Sale Action
  const handleNewSale = () => {
    if (saleItems.length > 0) {
      if (!window.confirm('Start a new blank sale? Unsaved items will be cleared. / نیا بل شروع کریں؟')) {
        return;
      }
    }
    setSaleItems([]);
    setSelectedItemIndex(null);
    setInvoiceDiscountOverride(0);
    setInvoiceTaxOverride(0);
    setCashReceived(0);
    setCashReceivedInput('');
    setInvoiceNumber((prev) => (parseInt(prev, 10) + 1).toString());
    showToast('Ready for new sale! / نیا بل تیار ہے', 'info');
    setTimeout(() => barcodeInputRef.current?.focus(), 50);
  };

  // Quick Customer Create Submit
  const handleCreateCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) {
      showToast('Customer name is required!', 'error');
      return;
    }
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: newCustName.trim(),
      phone: newCustPhone.trim() || undefined,
      address: newCustAddress.trim() || undefined,
      previousBalance: newCustBalance || 0,
      createdAt: new Date().toLocaleDateString('en-GB'),
    };
    onQuickAddCustomer(newCust);
    setSelectedCustomerId(newCust.id);
    setIsNewCustomerModalOpen(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
    setNewCustBalance(0);
    showToast(`Customer "${newCust.name}" added and selected!`, 'success');
  };

  // Load old invoice into editor
  const handleLoadInvoice = (tx: SaleTransaction) => {
    setInvoiceNumber(tx.invoiceNumber.replace('INV-', ''));
    setSaleItems(tx.items || []);
    setPaymentMethod((tx.paymentMethod as any) || 'cash');
    if (tx.customerId) setSelectedCustomerId(tx.customerId);
    setInvoiceDiscountOverride(tx.discount || 0);
    setCashReceived(tx.cashTendered || tx.grandTotal);
    setCashReceivedInput((tx.cashTendered || tx.grandTotal).toString());
    setIsSearchInvoiceModalOpen(false);
    showToast(`Loaded invoice ${tx.invoiceNumber} into editor.`, 'info');
  };

  // Keyboard shortcut listener (F1: New, F2: Save/Barcode, F8: Hold, F10: Print, Esc: Exit)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is actively typing in a text field (except shortcuts)
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isInput = targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select';

      if (e.key === 'F1') {
        e.preventDefault();
        handleNewSale();
      } else if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      } else if (e.key === 'F3') {
        e.preventDefault();
        onOpenAddProduct();
      } else if (e.key === 'F5') {
        e.preventDefault();
        itemNameInputRef.current?.focus();
      } else if (e.key === 'F8') {
        e.preventDefault();
        handleHoldCurrentBill();
      } else if (e.key === 'F10') {
        e.preventDefault();
        handleSaveInvoiceAction();
      } else if (e.key === 'Escape' && !isInput) {
        e.preventDefault();
        if (onBackToHome) onBackToHome();
        else onNavigate('Home');
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [saleItems, calculations, invoiceNumber, activeCustomer, paymentMethod, cashReceived]);

  return (
    <div className="flex-1 w-full min-h-screen bg-[#edf3fa] text-slate-800 font-sans flex flex-col select-none">
      {/* Toast Notice */}
      {statusNotice && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-bold animate-in fade-in slide-in-from-top-2 border ${
            statusNotice.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-400'
              : statusNotice.type === 'error'
              ? 'bg-red-600 text-white border-red-400'
              : 'bg-blue-600 text-white border-blue-400'
          }`}
        >
          {statusNotice.type === 'success' && <CheckCircle className="w-4 h-4" />}
          {statusNotice.type === 'error' && <AlertTriangle className="w-4 h-4" />}
          {statusNotice.type === 'info' && <Info className="w-4 h-4" />}
          <span>{statusNotice.message}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. TOP HEADER (EXACT REPLICA OF ATTACHED SCREENSHOT)            */}
      {/* Deep Blue Header #031738 with Green Logo, New Sale, Capsules   */}
      {/* ============================================================== */}
      <header className="bg-gradient-to-r from-[#031738] via-[#052454] to-[#031738] text-white px-3 sm:px-5 py-2.5 shadow-lg flex items-center justify-between border-b border-blue-900 shrink-0">
        {/* Left: Waqas Mart Logo & Branding */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt={branding.storeName || 'Waqas Mart'}
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl object-contain bg-white/10 p-0.5 border border-emerald-400/50 shadow-inner shrink-0"
            />
          ) : (
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-emerald-600 border border-emerald-400/60 flex items-center justify-center shadow-inner shrink-0">
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-sm sm:text-lg font-black tracking-wider text-white uppercase leading-tight flex items-center gap-1.5">
              <span>{branding.storeName || 'Waqas Mart'}</span>
            </h1>
            <p className="text-[10px] sm:text-xs font-bold text-emerald-400 leading-tight">
              Sale App
            </p>
          </div>
        </div>

        {/* Center: New Sale Title with Subtitle (Desktop only, matches screenshot) */}
        <div className="hidden md:flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-cyan-300 flex items-center justify-center border border-blue-400/30">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white tracking-wide leading-tight">
              New Sale
            </h2>
            <p className="text-[11px] text-cyan-300 font-semibold tracking-wide leading-tight">
              Fast | Easy | Smart
            </p>
          </div>
        </div>

        {/* Right: Date, Time, User Profile & Window Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Date Capsule (Desktop) */}
          <div className="hidden lg:flex items-center gap-1.5 bg-[#0a2f6c]/80 border border-blue-400/30 rounded-lg px-2.5 py-1 text-xs font-bold text-white shadow-inner">
            <Calendar className="w-3.5 h-3.5 text-cyan-300" />
            <span>{formattedDate}</span>
          </div>

          {/* Time Capsule (Desktop) */}
          <div className="hidden lg:flex items-center gap-1.5 bg-[#0a2f6c]/80 border border-blue-400/30 rounded-lg px-2.5 py-1 text-xs font-bold text-white shadow-inner">
            <Clock className="w-3.5 h-3.5 text-cyan-300" />
            <span>{formattedTime}</span>
          </div>

          {/* User Profile Capsule */}
          <div className="flex items-center gap-1.5 bg-[#0a2f6c]/80 border border-blue-400/30 rounded-lg px-2.5 py-1 text-xs font-bold text-white shadow-inner">
            <div className="w-6 h-6 rounded-full bg-slate-200 text-blue-900 flex items-center justify-center font-black text-xs shrink-0">
              <User className="w-3.5 h-3.5 text-blue-900" />
            </div>
            <div className="text-left hidden sm:block">
              <span className="block leading-tight text-white">{currentUser?.displayName || 'Admin 102'}</span>
              <span className="block text-[9px] text-cyan-200 font-normal leading-tight">Administrator</span>
            </div>
          </div>

          {/* Window Controls: Minimize, Fullscreen, Close/Back */}
          <div className="flex items-center gap-1 pl-1">
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-800 text-slate-200 border border-blue-800 cursor-pointer"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => {
                if (onBackToHome) onBackToHome();
                else onNavigate('Home');
              }}
              className="px-2 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-xs"
              title="Exit Sale to Dashboard / واپس ہوم پیج"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. DESKTOP WORKSPACE (100% REPLICA OF ATTACHED SCREENSHOT)      */}
      {/* Shown on Laptop/Desktop (hidden on mobile, separate mobile UI)  */}
      {/* ============================================================== */}
      <div className="hidden lg:flex flex-1 flex-col p-2.5 gap-2 overflow-hidden bg-[#edf3fa]">
        {/* TOP INPUT & ACTION PANEL (Card matching screenshot) */}
        <div className="bg-white rounded-xl border border-slate-300 shadow-xs p-2.5 space-y-2 shrink-0">
          {/* Row 1: Barcode, Item Name, Qty, Price, Total, Discount, Tax, Clear */}
          <div className="flex items-center gap-2">
            {/* 1. Barcode Field */}
            <div className="w-64 xl:w-72 flex items-center bg-[#f0f5fa] border border-blue-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
              <span className="px-2 text-blue-600">
                <BarcodeIcon className="w-4 h-4" />
              </span>
              <input
                ref={barcodeInputRef}
                type="text"
                value={topBarcode}
                onChange={(e) => setTopBarcode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (topBarcode.trim()) handleBarcodeScanAdd(topBarcode);
                  }
                }}
                placeholder="Scan or Enter Barcode..."
                className="w-full bg-transparent px-1 py-1.5 text-xs font-bold text-slate-800 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (topBarcode.trim()) handleBarcodeScanAdd(topBarcode);
                  else onOpenScanner();
                }}
                className="px-2.5 py-1.5 bg-[#0066cc] hover:bg-[#0052a3] text-white text-xs font-bold cursor-pointer transition-colors"
                title="Search / Scan Barcode"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 2. Item Name Field with Autocomplete */}
            <div className="flex-1 relative" ref={searchContainerRef}>
              <div className="flex items-center bg-[#f0f5fa] border border-blue-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                <input
                  ref={itemNameInputRef}
                  type="text"
                  value={topItemName}
                  onChange={(e) => setTopItemName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (nameSuggestions.length > 0) {
                        populateTopEntry(nameSuggestions[0]);
                      } else {
                        handleAddTopItemToTable();
                      }
                    }
                  }}
                  placeholder="Search Item Name..."
                  className="w-full bg-transparent px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddTopItemToTable}
                  className="px-2.5 py-1.5 text-slate-500 hover:text-blue-600 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Suggestions dropdown */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-2xl border border-blue-200 z-50 max-h-56 overflow-y-auto divide-y divide-slate-100">
                  {nameSuggestions.map((prod) => {
                    const isOutOfStock = (prod.stock || 0) <= 0;
                    return (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => populateTopEntry(prod)}
                        className="w-full p-2 text-left hover:bg-blue-50 flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer"
                      >
                        <div>
                          <span className="font-bold text-slate-900 block">{prod.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">Barcode: {prod.barcode || prod.sku || 'N/A'}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-blue-700 block">{formatRs(prod.price)}</span>
                          {isOutOfStock ? (
                            <span className="text-[9px] font-black text-red-600 uppercase">Out of Stock</span>
                          ) : (
                            <span className="text-[10px] text-emerald-600 font-bold">Stock: {prod.stock}</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Qty Field */}
            <div className="w-16 bg-[#f0f5fa] border border-blue-200 rounded-lg p-1 text-center">
              <label className="block text-[10px] font-bold text-slate-500 uppercase leading-none mb-0.5">Qty</label>
              <input
                type="number"
                step="any"
                min="0.1"
                value={topQty}
                onChange={(e) => setTopQty(Math.max(0.1, parseFloat(e.target.value) || 0))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTopItemToTable();
                }}
                className="w-full text-center font-black text-xs text-slate-900 bg-transparent focus:outline-none"
              />
            </div>

            {/* 4. Price Field */}
            <div className="w-20 bg-[#f0f5fa] border border-blue-200 rounded-lg p-1 text-center">
              <label className="block text-[10px] font-bold text-slate-500 uppercase leading-none mb-0.5">Price</label>
              <input
                type="number"
                step="any"
                min="0"
                value={topPrice || ''}
                onChange={(e) => setTopPrice(parseFloat(e.target.value) || 0)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTopItemToTable();
                }}
                placeholder="0.00"
                className="w-full text-center font-black text-xs text-slate-900 bg-transparent focus:outline-none"
              />
            </div>

            {/* 5. Total (Light Mint Green Box) */}
            <div className="w-24 bg-[#dcfce7] border border-emerald-300 rounded-lg p-1 text-center">
              <label className="block text-[10px] font-bold text-emerald-800 uppercase leading-none mb-0.5">Total</label>
              <span className="block font-black text-xs text-emerald-700">
                {(topQty * topPrice).toFixed(2)}
              </span>
            </div>

            {/* 6. Discount Field */}
            <div className="w-16 bg-[#f0f5fa] border border-blue-200 rounded-lg p-1 text-center">
              <label className="block text-[10px] font-bold text-slate-500 uppercase leading-none mb-0.5">Discount</label>
              <div className="flex items-center justify-center">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={topDiscountPercent || ''}
                  onChange={(e) => setTopDiscountPercent(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-8 text-center font-bold text-xs text-slate-900 bg-transparent focus:outline-none"
                />
                <span className="text-[10px] text-slate-500">%</span>
              </div>
            </div>

            {/* 7. Tax Field */}
            <div className="w-16 bg-[#f0f5fa] border border-blue-200 rounded-lg p-1 text-center">
              <label className="block text-[10px] font-bold text-slate-500 uppercase leading-none mb-0.5">Tax</label>
              <div className="flex items-center justify-center">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={topTaxPercent || ''}
                  onChange={(e) => setTopTaxPercent(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-8 text-center font-bold text-xs text-slate-900 bg-transparent focus:outline-none"
                />
                <span className="text-[10px] text-slate-500">%</span>
              </div>
            </div>

            {/* 8. Clear Button (Solid Red with Trash Icon matching screenshot) */}
            <button
              type="button"
              onClick={handleDeleteAllItems}
              className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer shrink-0"
              title="Clear current sale items"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>

          {/* Row 2: Hold Bill (F8), Held Bills (2), Customer Selector, Payment Method */}
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100">
            {/* Left: Hold Bill (F8) & Held Bills (count) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleHoldCurrentBill}
                className="px-3 py-1.5 rounded-lg bg-[#0066cc] hover:bg-[#0052a3] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Hold Bill (F8)</span>
              </button>
              <button
                type="button"
                onClick={onOpenHeldBillsModal}
                className="px-3 py-1.5 rounded-lg bg-[#0066cc] hover:bg-[#0052a3] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Held Bills ({heldBills.length})</span>
              </button>
            </div>

            {/* Center: Customer Selector & + New Customer Button */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[#f0f5fa] border border-blue-300 rounded-lg px-2 py-1">
                <User className="w-3.5 h-3.5 text-blue-600 mr-1.5 shrink-0" />
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer min-w-[150px] xl:min-w-[190px]"
                >
                  <option value="">Select Customer (Walk-in)...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => setIsNewCustomerModalOpen(true)}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ New</span>
              </button>
            </div>

            {/* Right: Payment Method Radios (Cash, Credit, Card) */}
            <div className="flex items-center gap-4 bg-[#f0f5fa] border border-blue-200 rounded-lg px-3 py-1 text-xs font-bold text-slate-800">
              <span className="text-slate-500 text-[11px]">Payment Method:</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="desktopPaymentMethod"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={() => setPaymentMethod('cash')}
                  className="w-3.5 h-3.5 accent-emerald-600"
                />
                <span className={paymentMethod === 'cash' ? 'text-emerald-700 font-black' : ''}>Cash</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="desktopPaymentMethod"
                  value="credit"
                  checked={paymentMethod === 'credit'}
                  onChange={() => setPaymentMethod('credit')}
                  className="w-3.5 h-3.5 accent-blue-600"
                />
                <span className={paymentMethod === 'credit' ? 'text-blue-700 font-black' : ''}>Credit</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="desktopPaymentMethod"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                  className="w-3.5 h-3.5 accent-purple-600"
                />
                <span className={paymentMethod === 'card' ? 'text-purple-700 font-black' : ''}>Card</span>
              </label>
            </div>
          </div>
        </div>

        {/* MAIN BODY: SALE TABLE (Left) + 6 VERTICAL BUTTONS (Right) */}
        <div className="flex-1 flex gap-2 min-h-0 overflow-hidden">
          {/* Main Sale Items Table */}
          <div className="flex-1 bg-white rounded-xl border border-slate-300 shadow-xs flex flex-col overflow-hidden">
            {/* Table Header: Solid Royal Blue #0047ab */}
            <div className="bg-[#0047ab] text-white flex items-center text-xs font-bold py-2 px-1 border-b border-blue-900 select-none shrink-0">
              <div className="w-10 text-center">No</div>
              <div className="flex-1 px-3 text-left">Item Name</div>
              <div className="w-16 text-center">Qty</div>
              <div className="w-20 text-right px-2">Price</div>
              <div className="w-24 text-right px-2">Total</div>
              <div className="w-16 text-center">Disc %</div>
              <div className="w-20 text-right px-2">D.Amount</div>
              <div className="w-24 text-right px-3">Net Amount</div>
              <div className="w-10 text-center">Del</div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 bg-white">
              {saleItems.length === 0 ? (
                /* Empty placeholder grid lines matching screenshot */
                <div className="divide-y divide-slate-100">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="flex items-center text-xs py-2.5 px-1 opacity-40 select-none">
                      <div className="w-10 text-center font-mono text-slate-300">{i + 1}</div>
                      <div className="flex-1 px-3 text-slate-200"></div>
                      <div className="w-16 text-center text-slate-200"></div>
                      <div className="w-20 text-right px-2 text-slate-200"></div>
                      <div className="w-24 text-right px-2 text-slate-200"></div>
                      <div className="w-16 text-center text-slate-200"></div>
                      <div className="w-20 text-right px-2 text-slate-200"></div>
                      <div className="w-24 text-right px-3 text-slate-200"></div>
                      <div className="w-10 text-center text-slate-200"></div>
                    </div>
                  ))}
                </div>
              ) : (
                saleItems.map((item, index) => {
                  const isSelected = selectedItemIndex === index;
                  const lineCalc = calculateLineItem(
                    item.quantity,
                    item.unitPrice,
                    item.discountPercent || 0,
                    item.taxPercent || 0
                  );
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItemIndex(index)}
                      className={`flex items-center text-xs py-2 px-1 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#dbeafe] text-blue-950 font-semibold'
                          : index % 2 === 0
                          ? 'bg-white hover:bg-slate-50'
                          : 'bg-[#f8fafc] hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-10 text-center font-bold text-slate-600">{index + 1}</div>
                      <div className="flex-1 px-3 text-left font-bold text-slate-900 truncate">
                        {item.product.name}
                      </div>
                      <div className="w-16 text-center px-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          step="any"
                          min="0.1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItemQuantity(index, parseFloat(e.target.value) || 0.1)}
                          className="w-full text-center font-black text-slate-900 bg-white border border-slate-300 rounded py-0.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="w-20 text-right px-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          step="any"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateItemPrice(index, parseFloat(e.target.value) || 0)}
                          className="w-full text-right font-bold text-slate-900 bg-white border border-slate-300 rounded py-0.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="w-24 text-right px-2 font-black text-slate-800">
                        {lineCalc.grossLineTotal.toFixed(2)}
                      </div>
                      <div className="w-16 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discountPercent || 0}
                          onChange={(e) => handleUpdateItemDiscountPercent(index, parseFloat(e.target.value) || 0)}
                          className="w-12 text-center text-xs font-semibold bg-white border border-slate-200 rounded py-0.5"
                        />
                      </div>
                      <div className="w-20 text-right px-2 font-medium text-slate-600">
                        {lineCalc.discountAmount.toFixed(2)}
                      </div>
                      <div className="w-24 text-right px-3 font-black text-emerald-700">
                        {lineCalc.netLineAmount.toFixed(2)}
                      </div>
                      <div className="w-10 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                          title="Remove item"
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

          {/* Right Vertical Column: 6 Distinctive Action Buttons matching screenshot */}
          <div className="w-40 xl:w-44 flex flex-col gap-2 shrink-0 select-none">
            {/* 1. F2 Barcode (Blue) */}
            <button
              type="button"
              onClick={() => {
                barcodeInputRef.current?.focus();
                onOpenScanner();
              }}
              className="flex-1 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0369a1] text-white p-2 flex items-center gap-2.5 shadow hover:brightness-105 active:scale-95 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <BarcodeIcon className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block text-xs font-black leading-tight">F2 Barcode</span>
                <span className="block text-[10px] text-sky-100 font-medium leading-tight">Scan Item</span>
              </div>
            </button>

            {/* 2. F3 New Item (Green) */}
            <button
              type="button"
              onClick={onOpenAddProduct}
              className="flex-1 rounded-xl bg-gradient-to-r from-[#10b981] to-[#059669] text-white p-2 flex items-center gap-2.5 shadow hover:brightness-105 active:scale-95 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <Plus className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block text-xs font-black leading-tight">F3 New Item</span>
                <span className="block text-[10px] text-emerald-100 font-medium leading-tight">Add New Product</span>
              </div>
            </button>

            {/* 3. F4 Edit Item (Orange) */}
            <button
              type="button"
              onClick={() => {
                if (activeInspectorItem) {
                  onOpenAddProduct();
                } else {
                  showToast('Select an item from the table first to edit.', 'info');
                }
              }}
              className="flex-1 rounded-xl bg-gradient-to-r from-[#f97316] to-[#ea580c] text-white p-2 flex items-center gap-2.5 shadow hover:brightness-105 active:scale-95 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <Edit className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block text-xs font-black leading-tight">F4 Edit Item</span>
                <span className="block text-[10px] text-orange-100 font-medium leading-tight">Edit Product</span>
              </div>
            </button>

            {/* 4. F5 Search (Purple) */}
            <button
              type="button"
              onClick={() => itemNameInputRef.current?.focus()}
              className="flex-1 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white p-2 flex items-center gap-2.5 shadow hover:brightness-105 active:scale-95 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <Search className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block text-xs font-black leading-tight">F5 Search</span>
                <span className="block text-[10px] text-purple-100 font-medium leading-tight">Find Item</span>
              </div>
            </button>

            {/* 5. Del Del All (Red) */}
            <button
              type="button"
              onClick={handleDeleteAllItems}
              className="flex-1 rounded-xl bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white p-2 flex items-center gap-2.5 shadow hover:brightness-105 active:scale-95 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block text-xs font-black leading-tight">Del Del All</span>
                <span className="block text-[10px] text-red-100 font-medium leading-tight">Delete All Items</span>
              </div>
            </button>

            {/* 6. Esc Exit (Cyan/Teal) */}
            <button
              type="button"
              onClick={() => {
                if (onBackToHome) onBackToHome();
                else onNavigate('Home');
              }}
              className="flex-1 rounded-xl bg-gradient-to-r from-[#06b6d4] to-[#0891b2] text-white p-2 flex items-center gap-2.5 shadow hover:brightness-105 active:scale-95 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <LogOut className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block text-xs font-black leading-tight">Esc Exit</span>
                <span className="block text-[10px] text-cyan-100 font-medium leading-tight">Close Sale</span>
              </div>
            </button>
          </div>
        </div>

        {/* BOTTOM SECTION: 10 BUTTONS (Left), TOTAL AMOUNT (Center), ITEM DETAILS (Right) */}
        <div className="flex gap-2.5 items-stretch shrink-0 bg-transparent select-none">
          {/* Column 1: 10 Colorful Action Buttons in 2 Rows of 5 matching screenshot */}
          <div className="flex-1 grid grid-cols-5 gap-1.5 xl:gap-2">
            {/* Row 1 */}
            {/* 1. New Sale (Pink/Magenta) */}
            <button
              type="button"
              onClick={handleNewSale}
              className="h-14 rounded-xl bg-gradient-to-b from-[#e11d48] to-[#be123c] text-white p-1 shadow hover:brightness-105 active:scale-95 transition-all flex flex-col items-center justify-center cursor-pointer"
            >
              <FileText className="w-4 h-4 mb-0.5" />
              <span className="text-[11px] font-black leading-tight">New Sale</span>
              <span className="text-[9px] text-pink-200 leading-tight">Save & New</span>
            </button>

            {/* 2. Save (Green) */}
            <button
              type="button"
              onClick={handleSaveInvoiceAction}
              disabled={isSubmitting}
              className="h-14 rounded-xl bg-gradient-to-b from-[#16a34a] to-[#15803d] text-white p-1 shadow hover:brightness-105 active:scale-95 transition-all flex flex-col items-center justify-center cursor-pointer"
            >
              <Save className="w-4 h-4 mb-0.5" />
              <span className="text-[11px] font-black leading-tight">Save</span>
              <span className="text-[9px] text-emerald-200 leading-tight">Save Invoice</span>
            </button>

            {/* 3. Edit Inv (Blue) */}
            <button
              type="button"
              onClick={() => setIsSearchInvoiceModalOpen(true)}
              className="h-14 rounded-xl bg-gradient-to-b from-[#0284c7] to-[#0369a1] text-white p-1 shadow hover:brightness-105 active:scale-95 transition-all flex flex-col items-center justify-center cursor-pointer"
            >
              <Edit className="w-4 h-4 mb-0.5" />
              <span className="text-[11px] font-black leading-tight">Edit Inv</span>
              <span className="text-[9px] text-sky-200 leading-tight">Edit Invoice</span>
            </button>

            {/* 4. Search Inv (Sky Blue) */}
            <button
              type="button"
              onClick={() => setIsSearchInvoiceModalOpen(true)}
              className="h-14 rounded-xl bg-gradient-to-b from-[#0ea5e9] to-[#0284c7] text-white p-1 shadow hover:brightness-105 active:scale-95 transition-all flex flex-col items-center justify-center cursor-pointer"
            >
              <Search className="w-4 h-4 mb-0.5" />
              <span className="text-[11px] font-black leading-tight">Search Inv</span>
              <span className="text-[9px] text-sky-200 leading-tight">Search Invoice</span>
            </button>

            {/* 5. New Item (Amber/Yellow) */}
            <button
              type="button"
              onClick={onOpenAddProduct}
              className="h-14 rounded-xl bg-gradient-to-b from-[#f59e0b] to-[#d97706] text-white p-1 shadow hover:brightness-105 active:scale-95 transition-all flex flex-col items-center justify-center cursor-pointer"
            >
              <Plus className="w-4 h-4 mb-0.5" />
              <span className="text-[11px] font-black leading-tight">New Item</span>
              <span className="text-[9px] text-amber-200 leading-tight">Add Item</span>
            </button>

            {/* Row 2 */}
            {/* 6. Del All (Slate Gray) */}
            <button
              type="button"
              onClick={handleDeleteAllItems}
              className="h-14 rounded-xl bg-gradient-to-b from-[#475569] to-[#334155] text-white p-1 shadow hover:brightness-105 active:scale-95 transition-all flex flex-col items-center justify-center cursor-pointer"
            >
              <Trash2 className="w-4 h-4 mb-0.5" />
              <span className="text-[11px] font-black leading-tight">Del All</span>
              <span className="text-[9px] text-slate-300 leading-tight">Delete All</span>
            </button>

            {/* 7. Del One (Orange) */}
            <button
              type="button"
              onClick={() => {
                if (selectedItemIndex !== null) handleRemoveItem(selectedItemIndex);
                else if (saleItems.length > 0) handleRemoveItem(saleItems.length - 1);
              }}
              className="h-14 rounded-xl bg-gradient-to-b from-[#f97316] to-[#ea580c] text-white p-1 shadow hover:brightness-105 active:scale-95 transition-all flex flex-col items-center justify-center cursor-pointer"
            >
              <Trash2 className="w-4 h-4 mb-0.5" />
              <span className="text-[11px] font-black leading-tight">Del One</span>
              <span className="text-[9px] text-orange-200 leading-tight">Delete One</span>
            </button>

            {/* 8. F10-Print (Crimson Red) */}
            <button
              type="button"
              onClick={handleSaveInvoiceAction}
              className="h-14 rounded-xl bg-gradient-to-b from-[#ef4444] to-[#dc2626] text-white p-1 shadow hover:brightness-105 active:scale-95 transition-all flex flex-col items-center justify-center cursor-pointer"
            >
              <Printer className="w-4 h-4 mb-0.5" />
              <span className="text-[11px] font-black leading-tight">F10-Print</span>
              <span className="text-[9px] text-red-200 leading-tight">Print Invoice</span>
            </button>

            {/* 9. Quick Search (Purple) */}
            <button
              type="button"
              onClick={() => itemNameInputRef.current?.focus()}
              className="h-14 rounded-xl bg-gradient-to-b from-[#8b5cf6] to-[#7c3aed] text-white p-1 shadow hover:brightness-105 active:scale-95 transition-all flex flex-col items-center justify-center cursor-pointer"
            >
              <Search className="w-4 h-4 mb-0.5" />
              <span className="text-[11px] font-black leading-tight">Quick Search</span>
              <span className="text-[9px] text-purple-200 leading-tight">Quick Search</span>
            </button>

            {/* 10. Exit (Green) */}
            <button
              type="button"
              onClick={() => {
                if (onBackToHome) onBackToHome();
                else onNavigate('Home');
              }}
              className="h-14 rounded-xl bg-gradient-to-b from-[#22c55e] to-[#16a34a] text-white p-1 shadow hover:brightness-105 active:scale-95 transition-all flex flex-col items-center justify-center cursor-pointer"
            >
              <LogOut className="w-4 h-4 mb-0.5" />
              <span className="text-[11px] font-black leading-tight">Exit</span>
              <span className="text-[9px] text-emerald-200 leading-tight">Exit System</span>
            </button>
          </div>

          {/* Column 2: Financial Totals & Royal Blue Display Box matching screenshot */}
          <div className="w-72 xl:w-80 bg-white rounded-xl border border-slate-300 shadow-xs p-2.5 flex flex-col justify-between gap-1.5 shrink-0">
            {/* Discount row */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Discount</span>
              <input
                type="number"
                min="0"
                value={invoiceDiscountOverride || ''}
                onChange={(e) => setInvoiceDiscountOverride(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-24 text-right font-mono font-bold text-slate-800 bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 text-xs focus:outline-none"
              />
            </div>

            {/* VAT(Tax) row */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">VAT(Tax)</span>
              <input
                type="number"
                min="0"
                value={invoiceTaxOverride || ''}
                onChange={(e) => setInvoiceTaxOverride(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-24 text-right font-mono font-bold text-slate-800 bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 text-xs focus:outline-none"
              />
            </div>

            {/* ROYAL BLUE TOTAL AMOUNT DISPLAY BOX WITH FLUORESCENT NUMBERS */}
            <div className="bg-[#0047ab] rounded-xl p-2 text-white shadow-inner flex flex-col justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-blue-200">
                Total Amount
              </span>
              <div className="text-right">
                <span className="font-mono text-3xl xl:text-4xl font-black text-[#facc15] tracking-tight drop-shadow-md">
                  {calculations.grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Cash Received row */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Cash Received</span>
              <input
                type="number"
                min="0"
                step="any"
                value={cashReceivedInput}
                onChange={(e) => {
                  setCashReceivedInput(e.target.value);
                  setCashReceived(parseFloat(e.target.value) || 0);
                }}
                placeholder="0.00"
                className="w-24 text-right font-mono font-black text-slate-900 bg-amber-50 border border-amber-300 rounded px-1.5 py-0.5 text-xs focus:outline-none"
              />
            </div>

            {/* Auto Cash Change & Remaining Due (Requirement 5) */}
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200">
              {cashChangeCalculations.changeToReturn > 0 ? (
                <div className="flex items-center gap-1 text-emerald-700 font-black">
                  <span>Change:</span>
                  <span className="font-mono text-xs">{formatRs(cashChangeCalculations.changeToReturn)}</span>
                </div>
              ) : cashChangeCalculations.remainingDue > 0 ? (
                <div className="flex items-center gap-1 text-amber-700 font-black">
                  <span>Due (Udhaar):</span>
                  <span className="font-mono text-xs">{formatRs(cashChangeCalculations.remainingDue)}</span>
                </div>
              ) : (
                <span className="text-[10px] text-slate-400 font-medium">Exact Cash Balanced</span>
              )}

              {/* Quick Cash Match button */}
              <button
                type="button"
                onClick={() => {
                  setCashReceived(calculations.grandTotal);
                  setCashReceivedInput(calculations.grandTotal.toString());
                }}
                className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-300 cursor-pointer"
              >
                Exact Cash
              </button>
            </div>
          </div>

          {/* Column 3: Item Details... Card matching screenshot */}
          <div className="w-72 xl:w-80 bg-white rounded-xl border border-slate-300 shadow-xs p-2.5 flex flex-col justify-between gap-1 text-xs shrink-0">
            <div className="font-black text-slate-900 border-b border-slate-200 pb-1 text-[11px] flex items-center justify-between">
              <span>Item Details...</span>
              {/* Cashier purchase cost toggle (Requirement 4) */}
              <button
                type="button"
                onClick={() => setShowCashierCost(!showCashierCost)}
                className="text-[9px] text-slate-400 hover:text-slate-700 flex items-center gap-0.5 cursor-pointer"
                title="Cashier Purchase Cost"
              >
                {showCashierCost ? <Eye className="w-2.5 h-2.5 text-blue-600" /> : <EyeOff className="w-2.5 h-2.5" />}
                <span>Cost</span>
              </button>
            </div>

            {/* Barcode */}
            <div className="flex items-center gap-1.5">
              <span className="w-16 font-bold text-slate-600 text-[11px]">Barcode</span>
              <div className="flex-1 flex items-center bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5">
                <input
                  type="text"
                  readOnly
                  value={detailsBarcode}
                  placeholder="Barcode..."
                  className="w-full bg-transparent text-[11px] font-mono text-slate-800 focus:outline-none"
                />
                <Search className="w-3 h-3 text-slate-400" />
              </div>
            </div>

            {/* Item Name */}
            <div className="flex items-center gap-1.5">
              <span className="w-16 font-bold text-slate-600 text-[11px]">Item Name</span>
              <input
                type="text"
                readOnly
                value={detailsItemName}
                placeholder="Item Name"
                className="flex-1 bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 text-[11px] text-slate-800 focus:outline-none"
              />
            </div>

            {/* Category */}
            <div className="flex items-center gap-1.5">
              <span className="w-16 font-bold text-slate-600 text-[11px]">Category</span>
              <input
                type="text"
                readOnly
                value={detailsCategory}
                className="flex-1 bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 text-[11px] text-slate-800 focus:outline-none"
              />
            </div>

            {/* Quantity & Sale Price */}
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-1">
                <span className="w-14 font-bold text-slate-600 text-[11px]">Quantity</span>
                <input
                  type="number"
                  readOnly
                  value={detailsQty}
                  className="w-14 bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 text-center text-[11px] font-bold text-slate-800 focus:outline-none"
                />
              </div>
              <div className="flex-1 flex items-center gap-1 justify-end">
                <span className="font-bold text-slate-600 text-[11px]">Sale Price</span>
                <span className="bg-slate-100 border border-slate-300 rounded px-2 py-0.5 text-[11px] font-black text-slate-900 font-mono">
                  {detailsPrice.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Cashier-Only Purchase Cost Field (Requirement 4) */}
            {showCashierCost && activeInspectorItem && (
              <div className="bg-amber-50/90 border border-amber-200 rounded px-2 py-0.5 flex items-center justify-between text-[10px]">
                <span className="font-bold text-amber-800 flex items-center gap-1">
                  <span>🔒 Cashier Cost:</span>
                </span>
                <span className="font-mono font-black text-amber-950">
                  {formatRs(activeInspectorItem.product.costPrice || 0)}
                </span>
              </div>
            )}

            {/* Barcode Yellow Box with More... Button */}
            <div className="flex items-center gap-1.5 pt-0.5">
              <div className="flex-1 bg-[#fef08a] border border-amber-400 rounded px-2 py-0.5 font-mono text-[11px] font-black text-slate-900 text-center tracking-wider truncate">
                *{detailsBarcode || '20101'}*
              </div>
              <button
                type="button"
                onClick={() => onOpenAddProduct()}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-[10px] font-bold rounded cursor-pointer shrink-0"
              >
                More...
              </button>
            </div>
          </div>
        </div>

        {/* FOOTER RIBBON: Better Shop | Better Business | Waqas Mart */}
        <footer className="bg-gradient-to-r from-[#003820] via-[#005c30] to-[#003820] text-emerald-200 py-1 px-4 text-center text-xs font-semibold tracking-wide border-t border-emerald-600/40 rounded-lg shadow-sm shrink-0 flex items-center justify-center gap-3">
          <span>Better Shop</span>
          <span>|</span>
          <span>Better Business</span>
          <span>|</span>
          <span className="font-black text-white">{branding.storeName || 'Waqas Mart'}</span>
        </footer>
      </div>

      {/* ============================================================== */}
      {/* 3. MOBILE-FIRST PORTRAIT LAYOUT (FOR ANDROID & IPHONE)          */}
      {/* Real dedicated portrait layout - NOT a shrunk desktop view!    */}
      {/* ============================================================== */}
      <div className="lg:hidden flex-1 flex flex-col p-2 space-y-2 bg-[#edf3fa] overflow-y-auto pb-6">
        {/* Mobile Header Bar */}
        <div className="bg-gradient-to-r from-[#031738] to-[#0a2f6c] text-white p-2.5 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            {branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt="Logo"
                className="w-8 h-8 rounded-lg object-contain bg-white/10 p-0.5 border border-emerald-400/50 shadow-inner shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-xs shrink-0">
                <ShoppingCart className="w-4 h-4 text-white" />
              </div>
            )}
            <div>
              <span className="text-xs font-black uppercase text-white block leading-tight">
                {branding.storeName || 'Waqas Mart'}
              </span>
              <span className="text-[10px] text-cyan-300 font-bold block leading-tight">
                New Sale • #{invoiceNumber}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 bg-blue-900/60 hover:bg-blue-800 text-cyan-200 border border-blue-700 rounded-lg flex items-center justify-center"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={onOpenHeldBillsModal}
              className="px-2 py-1 bg-blue-700 hover:bg-blue-600 text-white text-[10px] font-black rounded-lg flex items-center gap-1"
            >
              <Clock className="w-3 h-3" />
              <span>Held ({heldBills.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (onBackToHome) onBackToHome();
                else onNavigate('Home');
              }}
              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black rounded-lg flex items-center gap-0.5"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Exit</span>
            </button>
          </div>
        </div>

        {/* Mobile Search Card: Barcode + Item Name Search */}
        <div className="bg-white rounded-xl border border-slate-300 p-2.5 shadow-xs space-y-2">
          {/* Full-width Barcode search with scan button */}
          <div className="flex items-center bg-[#f0f5fa] border border-blue-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
            <span className="px-2 text-blue-600">
              <BarcodeIcon className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={topBarcode}
              onChange={(e) => setTopBarcode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && topBarcode.trim()) {
                  handleBarcodeScanAdd(topBarcode);
                }
              }}
              placeholder="Scan or enter barcode..."
              className="w-full bg-transparent px-1 py-2 text-xs font-bold text-slate-800 focus:outline-none"
            />
            <button
              type="button"
              onClick={onOpenScanner}
              className="px-3 py-2 bg-[#0066cc] text-white text-xs font-bold flex items-center gap-1 shrink-0"
              title="Camera Scan"
            >
              <ScanBarcode className="w-3.5 h-3.5" />
              <span>Scan</span>
            </button>
          </div>

          {/* Full-width Item Name search with autocomplete */}
          <div className="relative">
            <div className="flex items-center bg-[#f0f5fa] border border-blue-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
              <input
                type="text"
                value={topItemName}
                onChange={(e) => setTopItemName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (nameSuggestions.length > 0) {
                      populateTopEntry(nameSuggestions[0]);
                    } else {
                      handleAddTopItemToTable();
                    }
                  }
                }}
                placeholder="Search item name..."
                className="w-full bg-transparent px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddTopItemToTable}
                className="px-2.5 py-2 text-blue-600 font-bold text-xs"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile suggestions dropdown */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-2xl border border-blue-200 z-50 max-h-56 overflow-y-auto divide-y divide-slate-100">
                {nameSuggestions.map((prod) => {
                  const isOutOfStock = (prod.stock || 0) <= 0;
                  return (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => populateTopEntry(prod)}
                      className="w-full p-2.5 text-left hover:bg-blue-50 flex items-center justify-between gap-2 text-xs transition-colors"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">{prod.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">Barcode: {prod.barcode || 'N/A'}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-blue-700 block">{formatRs(prod.price)}</span>
                        {isOutOfStock ? (
                          <span className="text-[9px] font-black text-red-600 uppercase">Out of Stock</span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-bold">Stock: {prod.stock}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Qty & Price input row for manual add */}
          <div className="grid grid-cols-3 gap-2 items-center">
            <div className="bg-[#f0f5fa] border border-blue-200 rounded-lg p-1 text-center">
              <span className="block text-[10px] font-bold text-slate-500 uppercase">Qty</span>
              <input
                type="number"
                step="any"
                min="0.1"
                value={topQty}
                onChange={(e) => setTopQty(Math.max(0.1, parseFloat(e.target.value) || 0))}
                className="w-full text-center font-black text-xs text-slate-900 bg-transparent focus:outline-none"
              />
            </div>
            <div className="bg-[#f0f5fa] border border-blue-200 rounded-lg p-1 text-center">
              <span className="block text-[10px] font-bold text-slate-500 uppercase">Price</span>
              <input
                type="number"
                step="any"
                min="0"
                value={topPrice || ''}
                onChange={(e) => setTopPrice(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full text-center font-black text-xs text-slate-900 bg-transparent focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleAddTopItemToTable}
              className="h-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-lg py-2 flex items-center justify-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Customer & Payment Method Pill Row */}
        <div className="bg-white rounded-xl border border-slate-300 p-2.5 shadow-xs space-y-2">
          {/* Customer select */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center bg-[#f0f5fa] border border-blue-300 rounded-lg px-2 py-1.5">
              <User className="w-3.5 h-3.5 text-blue-600 mr-1.5 shrink-0" />
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="">Walk-in Customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setIsNewCustomerModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs shrink-0"
            >
              + New
            </button>
          </div>

          {/* Payment Method Pills */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className={`py-1.5 rounded-lg text-xs font-black transition-all ${
                paymentMethod === 'cash'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              Cash
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('credit')}
              className={`py-1.5 rounded-lg text-xs font-black transition-all ${
                paymentMethod === 'credit'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              Credit
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`py-1.5 rounded-lg text-xs font-black transition-all ${
                paymentMethod === 'card'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              Card
            </button>
          </div>
        </div>

        {/* Mobile Sale Items List: Touch-Friendly Product Cards */}
        <div className="bg-white rounded-xl border border-slate-300 shadow-xs p-2.5 space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200 text-xs font-bold">
            <span className="text-slate-800">Sale Items ({saleItems.length})</span>
            {saleItems.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteAllItems}
                className="text-[11px] text-red-600 hover:text-red-700 font-bold"
              >
                Clear All
              </button>
            )}
          </div>

          {saleItems.length === 0 ? (
            <div className="py-6 text-center text-slate-400 space-y-1">
              <ShoppingCart className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-semibold">No items in sale yet</p>
              <p className="text-[10px]">Scan barcode or search product name above</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {saleItems.map((item, index) => {
                const lineCalc = calculateLineItem(
                  item.quantity,
                  item.unitPrice,
                  item.discountPercent || 0,
                  item.taxPercent || 0
                );
                return (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-black text-slate-900 block">{item.product.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {formatRs(item.unitPrice)} each • Stock: {item.product.stock}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-1 rounded-lg text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/80">
                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-1 py-0.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQuantity(index, item.quantity - 1)}
                          className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="w-10 text-center font-black text-xs text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQuantity(index, item.quantity + 1)}
                          className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>

                      {/* Line Net Total */}
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block">Total</span>
                        <span className="font-mono font-black text-sm text-emerald-700">
                          {formatRs(lineCalc.netLineAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobile Payment Summary & Financial Totals */}
        <div className="bg-white rounded-xl border border-slate-300 p-3 shadow-xs space-y-2.5">
          {/* Royal Blue Total Box */}
          <div className="bg-[#0047ab] rounded-xl p-3 text-white flex items-center justify-between shadow-inner">
            <div>
              <span className="text-[10px] font-bold text-blue-200 block uppercase tracking-wider">
                Total Amount
              </span>
              <span className="font-mono text-2xl sm:text-3xl font-black text-[#facc15]">
                {formatRs(calculations.grandTotal)}
              </span>
            </div>
            <div className="text-right text-[11px] text-blue-100 space-y-0.5">
              <div>Items: <span className="font-bold">{saleItems.length}</span></div>
              <div>Subtotal: <span className="font-mono font-bold">{calculations.subtotal.toFixed(2)}</span></div>
            </div>
          </div>

          {/* Discount & VAT row */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5">
              <span className="block text-[10px] font-bold text-slate-500">Discount (Rs)</span>
              <input
                type="number"
                min="0"
                value={invoiceDiscountOverride || ''}
                onChange={(e) => setInvoiceDiscountOverride(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full font-mono font-bold text-xs text-slate-800 bg-transparent focus:outline-none"
              />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5">
              <span className="block text-[10px] font-bold text-slate-500">Cash Received</span>
              <input
                type="number"
                min="0"
                value={cashReceivedInput}
                onChange={(e) => {
                  setCashReceivedInput(e.target.value);
                  setCashReceived(parseFloat(e.target.value) || 0);
                }}
                placeholder="0.00"
                className="w-full font-mono font-black text-xs text-slate-900 bg-transparent focus:outline-none"
              />
            </div>
          </div>

          {/* Quick Denominations */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {[100, 500, 1000, 5000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  setCashReceived(val);
                  setCashReceivedInput(val.toString());
                }}
                className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200 shrink-0"
              >
                +{val}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setCashReceived(calculations.grandTotal);
                setCashReceivedInput(calculations.grandTotal.toString());
              }}
              className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200 shrink-0"
            >
              Exact
            </button>
          </div>

          {/* Auto Change & Due calculation */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
            {cashChangeCalculations.changeToReturn > 0 ? (
              <div className="text-emerald-700 font-black flex items-center gap-1">
                <span>Change to Return:</span>
                <span className="font-mono text-sm">{formatRs(cashChangeCalculations.changeToReturn)}</span>
              </div>
            ) : cashChangeCalculations.remainingDue > 0 ? (
              <div className="text-amber-700 font-black flex items-center gap-1">
                <span>Remaining Due:</span>
                <span className="font-mono text-sm">{formatRs(cashChangeCalculations.remainingDue)}</span>
              </div>
            ) : (
              <span className="text-slate-400 font-medium text-[11px]">Exact payment</span>
            )}
          </div>
        </div>

        {/* Mobile Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Green F2 Save */}
          <button
            type="button"
            onClick={handleSaveInvoiceAction}
            disabled={isSubmitting}
            className="py-3 rounded-xl bg-gradient-to-r from-[#16a34a] to-[#15803d] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>F2 Save & Close</span>
          </button>

          {/* Crimson F10 Print */}
          <button
            type="button"
            onClick={handleSaveInvoiceAction}
            className="py-3 rounded-xl bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice</span>
          </button>

          {/* Hold Bill */}
          <button
            type="button"
            onClick={handleHoldCurrentBill}
            className="py-2.5 rounded-xl bg-[#0066cc] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Hold Bill</span>
          </button>

          {/* New Sale */}
          <button
            type="button"
            onClick={handleNewSale}
            className="py-2.5 rounded-xl bg-gradient-to-r from-[#e11d48] to-[#be123c] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Sale</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. MODALS: QUICK CUSTOMER ADD MODAL                            */}
      {/* ============================================================== */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900">Add New Customer</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewCustomerModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomerSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Muhammad Ali"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="0300-1234567"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Address / Notes</label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="Street / Area"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Opening Udhar Balance (Rs)</label>
                <input
                  type="number"
                  min="0"
                  value={newCustBalance || ''}
                  onChange={(e) => setNewCustBalance(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. MODALS: SEARCH INVOICE MODAL                                */}
      {/* ============================================================== */}
      {isSearchInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-black text-slate-900">Search Invoices (تلاش کریں)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSearchInvoiceModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={invoiceSearchQuery}
                onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                placeholder="Search invoice number, customer name..."
                className="w-full pl-9 pr-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
              {transactions
                .filter((tx) => {
                  const q = invoiceSearchQuery.toLowerCase().trim();
                  if (!q) return true;
                  return (
                    tx.invoiceNumber.toLowerCase().includes(q) ||
                    (tx.customerName && tx.customerName.toLowerCase().includes(q))
                  );
                })
                .slice(0, 10)
                .map((tx) => (
                  <button
                    key={tx.invoiceNumber}
                    type="button"
                    onClick={() => handleLoadInvoice(tx)}
                    className="w-full p-2.5 text-left hover:bg-blue-50 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div>
                      <span className="font-black text-slate-900 block">{tx.invoiceNumber}</span>
                      <span className="text-[10px] text-slate-500">
                        {tx.customerName || 'Walk-in'} • {new Date(tx.dateTime).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-blue-700 block">{formatRs(tx.grandTotal)}</span>
                      <span className="text-[10px] text-emerald-600 font-bold uppercase">{tx.paymentMethod}</span>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

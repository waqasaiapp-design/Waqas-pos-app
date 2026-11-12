import { ReceiptDesignerModal } from './components/ReceiptDesignerModal';
import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutGrid,
  Users,
  ShoppingCart,
  ShoppingBag,
  Package,
  Settings,
  ScanBarcode,
  Search,
  PlusCircle,
  Clock,
  RotateCcw,
  AlertCircle,
  Database,
  History,
  X,
  PauseCircle,
  Home,
  FileText,
  Layers,
  Truck,
  FileSpreadsheet,
  Wallet,
  CreditCard,
  Undo,
  TrendingUp,
  Shield,
  ShieldCheck,
  Smartphone,
  QrCode,
  Download,
  Laptop,
  Camera,
  UserCheck,
  Crown,
  Store,
  KeyRound,
  LogOut,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Product,
  CartItem,
  POSMode,
  SaleTransaction,
  SaleReturn,
  HeldBill,
  CategoryInfo,
  Supplier,
  PurchaseTransaction,
  Customer,
  CustomerLedgerEntry,
  UserProfile,
  DeviceInfo,
  StoreBranding,
  ReceiptSettings,
  DEFAULT_RECEIPT_SETTINGS,
  SupplierLedgerEntry,
  ExpenseEntry,
  PurchaseReturn,
  StaffMember,
  CctvCamera,
  DvrNvrConfig,
  SecurityConfig,
} from './types/pos';
import {
  SCREENSHOT_CATEGORIES,
  INITIAL_SUPPLIERS,
  SEED_CATALOG_PRODUCTS,
  formatRs,
} from './data/defaultProducts';
import { sounds } from './utils/audio';
import { syncService } from './utils/syncService';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { AddNewProductModal } from './components/AddNewProductModal';
import { PurchaseEntryPage } from './components/PurchaseEntryPage';
import { NewPurchaseEntryPage } from './components/NewPurchaseEntryPage';
import { SaleSummaryPage } from './components/SaleSummaryPage';
import { DailyHisabExcelPage } from './components/DailyHisabExcelPage';
import { CustomerLedgersPage } from './components/CustomerLedgersPage';
import { TotalStockPage } from './components/TotalStockPage';
import { SaleReturnCenter } from './components/SaleReturnCenter';
import { HomePage } from './components/HomePage';
import { ReceiptModal } from './components/ReceiptModal';
import { HeldBillsModal } from './components/HeldBillsModal';
import { CheckoutModal } from './components/CheckoutModal';
import { CartDrawerModal } from './components/CartDrawerModal';
import { TransactionHistoryModal } from './components/TransactionHistoryModal';
import { DeviceManagementPage } from './components/DeviceManagementPage';
import { ConnectDeviceQrModal } from './components/ConnectDeviceQrModal';
import { PairDeviceModal } from './components/PairDeviceModal';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { RevokedDeviceModal } from './components/RevokedDeviceModal';
import { SalePosPage } from './components/SalePosPage';
import { NewSalePosPage } from './components/NewSalePosPage';
import { BrandingSettingsModal } from './components/BrandingSettingsModal';
import { WaqasBrandingCard } from './components/WaqasBrandingCard';
import { ResetSystemModal } from './components/ResetSystemModal';
import { SupplierLedgersPage } from './components/SupplierLedgersPage';
import { ExpensesPage } from './components/ExpensesPage';
import { PurchaseReturnsPage } from './components/PurchaseReturnsPage';
import { SecuritySettingsPage } from './components/SecuritySettingsPage';
import { CctvPage } from './components/CctvPage';
import { AllStaffPage } from './components/AllStaffPage';
import { LoginGateway } from './components/Auth/LoginGateway';
import { GenerateMartPasswordModal } from './components/GenerateMartPasswordModal';
import {
  getAuthSession,
  clearAuthSession,
  MartAuthSession,
} from './utils/martAuthSecurity';
import { AuthUser, ShopAccount, UserRole } from './types/pos';
import { safeFetchJson } from './utils/apiClient';

const STORAGE_KEYS = {
  INVENTORY: 'waqas_mart_inventory_v6',
  HELD_BILLS: 'waqas_mart_held_bills_v6',
  TRANSACTIONS: 'waqas_mart_transactions_v6',
  SUPPLIERS: 'waqas_mart_suppliers_v6',
  PURCHASES: 'waqas_mart_purchases_v6',
  CATEGORIES: 'waqas_mart_categories_v6',
  CUSTOMERS: 'waqas_mart_customers_v6',
  CUSTOMER_LEDGERS: 'waqas_mart_customer_ledgers_v6',
  RETURNS: 'waqas_mart_sale_returns_v6',
  USER_PROFILE: 'waqas_mart_user_profile_v6',
  DEVICE_ID: 'waqas_mart_device_id_v6',
  PIN_HASH: 'waqas_mart_app_pin_hash_v6',
  BRANDING: 'waqas_mart_branding_v6',
  RECEIPT_SETTINGS: 'waqas_mart_receipt_settings_v6',
  SUPPLIER_LEDGERS: 'waqas_mart_supplier_ledgers_v6',
  EXPENSES: 'waqas_mart_expenses_v6',
  PURCHASE_RETURNS: 'waqas_mart_purchase_returns_v6',
  STAFF: 'waqas_mart_staff_v6',
  CCTV_CAMERAS: 'waqas_mart_cctv_cameras_v6',
  DVR_CONFIG: 'waqas_mart_dvr_config_v6',
  SECURITY_CONFIG: 'waqas_mart_security_config_v6',
};

// Purge legacy obsolete cached keys that contained Pepsi 1.5L and old demo data
try {
  [
    'waqas_mart_inventory_v2',
    'waqas_mart_inventory_v3',
    'waqas_mart_inventory_v4',
    'waqas_mart_inventory_v5',
    'waqas_mart_transactions_v2',
    'waqas_mart_purchases_v2',
    'waqas_mart_customers_v2',
    'waqas_mart_daily_hisab_v2',
  ].forEach((k) => localStorage.removeItem(k));
} catch {}

export default function App() {
  // Software Owner & Mart User Authentication Session (100% Offline & Session Persistent)
  const [authSession, setAuthSessionState] = useState<MartAuthSession | null>(() => getAuthSession());
  const [isGenerateMartPasswordOpen, setIsGenerateMartPasswordOpen] = useState(false);

  const isOwner = authSession?.role === 'SOFTWARE_OWNER';

  // Navigation: 'Home' | 'Sale POS' | 'Purchase Entry' | 'Total Stock' | etc.
  const [activeNav, setActiveNav] = useState<string>('Home');

  // Verify active session on startup with backend if online (keeps offline session if disconnected)
  useEffect(() => {
    const checkSession = async () => {
      const saved = getAuthSession();
      if (!saved || !saved.token) return;
      try {
        const res = await safeFetchJson('/api/auth/verify-session', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${saved.token}`,
          },
        });
        const data = res.data;
        if (data && data.success && data.valid) {
          // Valid server session
        }
      } catch {
        // Disconnected or offline: keep local authenticated session
      }
    };
    checkSession();
  }, []);

  const handleLoginSuccess = (session: MartAuthSession) => {
    setAuthSessionState(session);
    syncService.setSessionToken(session.token);
    setActiveNav('Home');
  };

  const handleLogout = async () => {
    if (authSession?.token) {
      try {
        await safeFetchJson('/api/auth/logout', {
          method: 'POST',
        });
      } catch {}
    }
    clearAuthSession();
    syncService.setSessionToken('');
    setAuthSessionState(null);
    setActiveNav('Home');
  };
  const [mode, setMode] = useState<POSMode>('sale');
  const [isReceiptDesignerOpen, setIsReceiptDesignerOpen] = useState(false);
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECEIPT_SETTINGS);
      if (saved) return { ...DEFAULT_RECEIPT_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_RECEIPT_SETTINGS;
  });

  const handleSaveReceiptSettings = (newSettings: ReceiptSettings) => {
    setReceiptSettings(newSettings);
    localStorage.setItem(STORAGE_KEYS.RECEIPT_SETTINGS, JSON.stringify(newSettings));
  };

  // Products - Clean Zero State initially ("our pehle say app koi stok ya etam ya hisab naho sub zero hu")
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INVENTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Ignore
    }
    return [];
  });

  // Categories
  const [categories, setCategories] = useState<CategoryInfo[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return SCREENSHOT_CATEGORIES;
  });

  // Suppliers
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return INITIAL_SUPPLIERS;
  });

  // Purchases
  const [purchases, setPurchases] = useState<PurchaseTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PURCHASES);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return [];
  });

  // POS Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [resumedHeldBillId, setResumedHeldBillId] = useState<string | null>(null);
  const [resumedNewSaleBill, setResumedNewSaleBill] = useState<HeldBill | null>(null);

  // Search & Category Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL ITEMS');

  // Held Bills
  const [heldBills, setHeldBills] = useState<HeldBill[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HELD_BILLS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return [];
  });

  // Sales Transactions History
  const [transactions, setTransactions] = useState<SaleTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return [];
  });

  // Customers (Customer Udhar Accounts)
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return [];
  });

  // Customer Ledger Entries (Credit & Debit / Recovery History)
  const [customerLedgerEntries, setCustomerLedgerEntries] = useState<CustomerLedgerEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMER_LEDGERS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return [];
  });

  const [selectedLedgerCustomerId, setSelectedLedgerCustomerId] = useState<string | null>(null);

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isHeldBillsOpen, setIsHeldBillsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<SaleTransaction | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [scannedBarcodeForNewPos, setScannedBarcodeForNewPos] = useState<string | null>(null);

  // Multi-Device & PWA states
  const [isConnectQrOpen, setIsConnectQrOpen] = useState(false);
  const [isPairModalOpen, setIsPairModalOpen] = useState(false);
  const [isPwaInstallOpen, setIsPwaInstallOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isRevoked, setIsRevoked] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(products));
    } catch (e) {
      console.warn('Failed to persist inventory', e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.warn('Failed to persist categories', e);
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
    } catch (e) {
      console.warn('Failed to persist suppliers', e);
    }
  }, [suppliers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
    } catch (e) {
      console.warn('Failed to persist purchases', e);
    }
  }, [purchases]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HELD_BILLS, JSON.stringify(heldBills));
    } catch (e) {
      console.warn('Failed to persist held bills', e);
    }
  }, [heldBills]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.warn('Failed to persist transactions', e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    } catch (e) {
      console.warn('Failed to persist customers', e);
    }
  }, [customers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOMER_LEDGERS, JSON.stringify(customerLedgerEntries));
    } catch (e) {
      console.warn('Failed to persist customer ledger entries', e);
    }
  }, [customerLedgerEntries]);

  // Sale Returns
  const [saleReturns, setSaleReturns] = useState<SaleReturn[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RETURNS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify(saleReturns));
    } catch (e) {
      console.warn('Failed to persist sale returns', e);
    }
  }, [saleReturns]);

  // 1. Supplier Ledgers State
  const [supplierLedgers, setSupplierLedgers] = useState<SupplierLedgerEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SUPPLIER_LEDGERS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SUPPLIER_LEDGERS, JSON.stringify(supplierLedgers));
    } catch (e) {
      console.warn('Failed to persist supplier ledgers', e);
    }
  }, [supplierLedgers]);

  // 2. Expenses State
  const [expenses, setExpenses] = useState<ExpenseEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    } catch (e) {
      console.warn('Failed to persist expenses', e);
    }
  }, [expenses]);

  // 3. Purchase Returns State
  const [purchaseReturns, setPurchaseReturns] = useState<PurchaseReturn[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PURCHASE_RETURNS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PURCHASE_RETURNS, JSON.stringify(purchaseReturns));
    } catch (e) {
      console.warn('Failed to persist purchase returns', e);
    }
  }, [purchaseReturns]);

  // 4. Staff Members State
  const [staffList, setStaffList] = useState<StaffMember[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STAFF);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staffList));
    } catch (e) {
      console.warn('Failed to persist staff list', e);
    }
  }, [staffList]);

  // 5. CCTV Cameras & DVR/NVR Config State
  const [cctvCameras, setCctvCameras] = useState<CctvCamera[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CCTV_CAMERAS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CCTV_CAMERAS, JSON.stringify(cctvCameras));
    } catch (e) {
      console.warn('Failed to persist cctv cameras', e);
    }
  }, [cctvCameras]);

  const [dvrConfig, setDvrConfig] = useState<DvrNvrConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DVR_CONFIG);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      dvrBrand: 'Hikvision',
      dvrIp: '192.168.1.100',
      httpPort: 80,
      rtspPort: 554,
      totalChannels: 8,
      username: 'admin',
      isConnected: false,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DVR_CONFIG, JSON.stringify(dvrConfig));
    } catch (e) {
      console.warn('Failed to persist dvr config', e);
    }
  }, [dvrConfig]);

  // 6. Security Config State (Master PIN & Biometric App Lock)
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SECURITY_CONFIG);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      appLockEnabled: false,
      biometricEnabled: false,
      autoLockTimerMinutes: 5,
      lockOnBackground: true,
      masterPin: '',
      restrictReports: false,
      restrictSettings: false,
      restrictDelete: true,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SECURITY_CONFIG, JSON.stringify(securityConfig));
    } catch (e) {
      console.warn('Failed to persist security config', e);
    }
  }, [securityConfig]);

  // User Profile
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      id: `USR-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`.toUpperCase(),
      displayName: 'Waqas Ahmad',
      email: 'waqasmart.pos@gmail.com',
      phone: '+92 300 1234567',
      role: 'Master Admin',
      createdAt: new Date().toLocaleDateString('en-GB'),
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(currentUser));
    } catch (e) {
      console.warn('Failed to persist user profile', e);
    }
  }, [currentUser]);

  // Device Info
  const [currentDevice, setCurrentDevice] = useState<DeviceInfo>(() => syncService.getDevice());

  // Real-Time Synchronization Listener and Initial Server Fetch
  useEffect(() => {
    // Initial fetch from server
    syncService.fetchServerStore().then((serverStore) => {
      if (serverStore) {
        if (serverStore.products && serverStore.products.length > 0) {
          setProducts(serverStore.products);
        }
        if (serverStore.transactions && serverStore.transactions.length > 0) {
          setTransactions(serverStore.transactions);
        }
        if (serverStore.purchases && serverStore.purchases.length > 0) {
          setPurchases(serverStore.purchases);
        }
        if (serverStore.customers && serverStore.customers.length > 0) {
          setCustomers(serverStore.customers);
        }
        if (serverStore.customerLedgers && serverStore.customerLedgers.length > 0) {
          setCustomerLedgerEntries(serverStore.customerLedgers);
        }
        if (serverStore.saleReturns && serverStore.saleReturns.length > 0) {
          setSaleReturns(serverStore.saleReturns);
        }
        if (serverStore.suppliers && serverStore.suppliers.length > 0) {
          setSuppliers(serverStore.suppliers);
        }
        if (serverStore.heldBills && serverStore.heldBills.length > 0) {
          setHeldBills(serverStore.heldBills);
        }
        if (serverStore.branding) {
          setBranding(serverStore.branding);
        }
      }
    });

    // Real-time synchronization stream listener
    const unsubscribe = syncService.subscribe((event) => {
      const myDeviceId = syncService.getDevice().deviceId;

      if (event.type === 'sale:completed') {
        const { transaction, updatedProducts, customerLedgers } = event.payload || {};
        if (transaction && event.sourceDeviceId !== myDeviceId) {
          setTransactions((prev) => {
            if (prev.some((t) => t.invoiceNumber === transaction.invoiceNumber)) return prev;
            return [transaction, ...prev];
          });
          if (Array.isArray(updatedProducts)) {
            setProducts(updatedProducts);
          }
          if (Array.isArray(customerLedgers)) {
            setCustomerLedgerEntries(customerLedgers);
          }
          showToast(`⚡ Real-Time Sync: New sale #${transaction.invoiceNumber} recorded on another counter!`, 'info');
        }
      } else if (event.type === 'purchase:added') {
        const { purchase, updatedProducts } = event.payload || {};
        if (purchase && event.sourceDeviceId !== myDeviceId) {
          setPurchases((prev) => {
            if (prev.some((p) => p.purchaseInvoiceNo === purchase.purchaseInvoiceNo)) return prev;
            return [purchase, ...prev];
          });
          if (Array.isArray(updatedProducts)) {
            setProducts(updatedProducts);
          }
          showToast(`⚡ Real-Time Sync: Purchase #${purchase.purchaseInvoiceNo} received on another terminal.`, 'info');
        }
      } else if (event.type === 'return:processed') {
        const { saleReturn, updatedProducts, customerLedgers } = event.payload || {};
        if (saleReturn && event.sourceDeviceId !== myDeviceId) {
          setSaleReturns((prev) => {
            if (prev.some((r) => r.returnNumber === saleReturn.returnNumber)) return prev;
            return [saleReturn, ...prev];
          });
          if (Array.isArray(updatedProducts)) setProducts(updatedProducts);
          if (Array.isArray(customerLedgers)) setCustomerLedgerEntries(customerLedgers);
          showToast(`⚡ Real-Time Sync: Return #${saleReturn.returnNumber} restocked.`, 'info');
        }
      } else if (event.type === 'stock:updated') {
        if (Array.isArray(event.payload) && event.sourceDeviceId !== myDeviceId) {
          setProducts(event.payload);
        }
      } else if (event.type === 'customer:ledger_updated') {
        if (event.payload?.customers) setCustomers(event.payload.customers);
        if (event.payload?.customerLedgers) setCustomerLedgerEntries(event.payload.customerLedgers);
      } else if (event.type === 'store:sync') {
        const store = event.payload;
        if (store) {
          if (Array.isArray(store.products)) setProducts(store.products);
          if (Array.isArray(store.transactions)) setTransactions(store.transactions);
          if (Array.isArray(store.purchases)) setPurchases(store.purchases);
          if (Array.isArray(store.customers)) setCustomers(store.customers);
          if (Array.isArray(store.customerLedgers)) setCustomerLedgerEntries(store.customerLedgers);
          if (Array.isArray(store.heldBills)) setHeldBills(store.heldBills);
          if (store.branding) setBranding(store.branding);
        }
      } else if (event.type === 'device:revoked') {
        if (event.payload?.deviceId === myDeviceId) {
          setIsRevoked(true);
        }
      } else if (event.type === 'device:pairing_request') {
        showToast(`Pairing request received from ${event.payload?.candidateDevice?.deviceName || 'new device'}. Check Device Management.`, 'info');
      }
    });

    return () => unsubscribe();
  }, []);

  // App PIN Lock & Security
  const [pinHash, setPinHash] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.PIN_HASH);
    } catch {}
    return null;
  });

  useEffect(() => {
    try {
      if (pinHash) {
        localStorage.setItem(STORAGE_KEYS.PIN_HASH, pinHash);
      } else {
        localStorage.removeItem(STORAGE_KEYS.PIN_HASH);
      }
    } catch (e) {
      console.warn('Failed to persist pin hash', e);
    }
  }, [pinHash]);

  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isLockConfigOpen, setIsLockConfigOpen] = useState<boolean>(false);

  // Store Branding & Theme Configuration
  const [branding, setBranding] = useState<StoreBranding>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BRANDING);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          storeName: parsed.storeName || 'WAQAS MART',
          primaryName: parsed.primaryName || 'WAQAS',
          accentName: parsed.accentName || 'MART',
          subtitle: parsed.subtitle || 'Quality Products • Better Life',
          logoUrl: parsed.logoUrl,
          bannerUrl: parsed.bannerUrl,
          sidebarPromoTitle: parsed.sidebarPromoTitle || 'Small Steps Big Dreams',
          sidebarPromoBadge: parsed.sidebarPromoBadge || 'WAQAS MART',
          bottomBannerTitle: parsed.bottomBannerTitle || 'Fresh Products Everyday',
          bottomBannerSubtitle: parsed.bottomBannerSubtitle || 'Best Quality • Lowest Prices',
          terminalDeviceId: parsed.terminalDeviceId || 'WM-001',
          primaryColor: parsed.primaryColor || '#00a859',
        };
      }
    } catch {}
    return {
      storeName: 'WAQAS MART',
      primaryName: 'WAQAS',
      accentName: 'MART',
      subtitle: 'Quality Products • Better Life',
      sidebarPromoTitle: 'Small Steps Big Dreams',
      sidebarPromoBadge: 'WAQAS MART',
      bottomBannerTitle: 'Fresh Products Everyday',
      bottomBannerSubtitle: 'Best Quality • Lowest Prices',
      terminalDeviceId: 'WM-001',
      primaryColor: '#00a859',
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BRANDING, JSON.stringify(branding));
    } catch (e) {
      console.warn('Failed to persist store branding', e);
    }
  }, [branding]);

  // Toast notification
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage(null);
    }, 3500);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setIsScannerOpen(true);
      } else if (e.key === 'F4') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0) {
          setIsCheckoutOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart]);

  // Cart Calculations
  const totalQty = cart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cart.reduce((acc, item) => acc + item.lineTotal, 0);
  const discount = Math.min(subtotal, Math.max(0, discountAmount));
  const grandTotal = Math.max(0, subtotal - discount);

  // Seed Catalog (Exact 15 Picture Items)
  const handleLoadSeedCatalog = async () => {
    setProducts(SEED_CATALOG_PRODUCTS);
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(SEED_CATALOG_PRODUCTS));
    showToast('تصویر والے ۱۵ اصلی آئٹمز کامیابی سے لوڈ ہو گئے! (Loaded 15 Picture Items)', 'success');
    try {
      await syncService.postMutation('load_seed_catalog', {});
    } catch {}
  };

  // Reset All Records to Zero (User Request: "pehle say app koi stok ya etam ya hisab naho sub zero hu")
  const handleResetAllZero = async () => {
    if (window.confirm('کیا آپ تمام اسٹاک، پروڈکٹس اور حساب زیرو (Zero) کرنا چاہتے ہیں؟ (Reset all store records to 0)')) {
      setProducts([]);
      setCart([]);
      setTransactions([]);
      setPurchases([]);
      setHeldBills([]);
      setCustomers([]);
      setCustomerLedgerEntries([]);
      setSaleReturns([]);
      setSupplierLedgers([]);
      setExpenses([]);
      setPurchaseReturns([]);
      setStaffList([]);
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.HELD_BILLS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.CUSTOMER_LEDGERS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.SUPPLIER_LEDGERS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.PURCHASE_RETURNS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify([]));
      showToast('تمام اسٹاک، سیلز اور حساب زیرو کر دیا گیا ہے۔ (Store reset to 0)', 'info');
      try {
        await syncService.postMutation('reset_all_zero', {});
      } catch {}
    }
  };

  // Handlers for 6 New Pages:
  const handleSaveSupplier = (supplier: Supplier) => {
    setSuppliers((prev) => {
      const idx = prev.findIndex((s) => s.id === supplier.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = supplier;
        return next;
      }
      return [supplier, ...prev];
    });
  };

  const handleDeleteSupplier = (supplierId: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
  };

  const handleSaveSupplierLedgerEntry = (entry: SupplierLedgerEntry) => {
    setSupplierLedgers((prev) => {
      const idx = prev.findIndex((e) => e.id === entry.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = entry;
        return next;
      }
      return [entry, ...prev];
    });
  };

  const handleDeleteSupplierLedgerEntry = (entryId: string) => {
    setSupplierLedgers((prev) => prev.filter((e) => e.id !== entryId));
  };

  const handleDeleteAllSupplierLedgers = (supplierId?: string) => {
    if (supplierId) {
      setSupplierLedgers((prev) => prev.filter((e) => e.supplierId !== supplierId));
    } else {
      setSupplierLedgers([]);
    }
  };

  const handleSaveExpense = (expense: ExpenseEntry) => {
    setExpenses((prev) => {
      const idx = prev.findIndex((e) => e.id === expense.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = expense;
        return next;
      }
      return [expense, ...prev];
    });
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
  };

  const handleDeleteAllExpenses = () => {
    setExpenses([]);
  };

  const handleSavePurchaseReturn = (ret: PurchaseReturn) => {
    // 1. Save return record
    setPurchaseReturns((prev) => [ret, ...prev]);

    // 2. Adjust product stock (subtract returned quantity)
    setProducts((prev) => {
      const next = [...prev];
      ret.items.forEach((item) => {
        const idx = next.findIndex((p) => p.id === item.productId || (item.barcode && p.barcode === item.barcode));
        if (idx > -1) {
          next[idx] = {
            ...next[idx],
            stock: Math.max(0, next[idx].stock - item.quantity),
          };
        }
      });
      return next;
    });

    // 3. Record in Supplier Ledgers as debit (reduces our payable balance to supplier)
    const ledgerEntry: SupplierLedgerEntry = {
      id: `supp-ledger-${Date.now()}`,
      supplierId: ret.supplierId,
      date: ret.date,
      description: `Purchase Return #${ret.returnNumber} for Invoice #${ret.originalInvoiceNumber}`,
      invoiceNumber: ret.originalInvoiceNumber,
      debit: ret.totalRefund,
      credit: 0,
      runningBalance: 0,
      paymentMethod: 'Purchase Return Adjustment',
      createdAt: new Date().toISOString(),
    };
    handleSaveSupplierLedgerEntry(ledgerEntry);
    showToast(`Purchase return of Rs. ${ret.totalRefund.toFixed(0)} saved and inventory adjusted.`, 'success');
  };

  const handleDeletePurchaseReturn = (returnId: string) => {
    setPurchaseReturns((prev) => prev.filter((r) => r.id !== returnId));
  };

  const handleDeleteAllPurchaseReturns = () => {
    setPurchaseReturns([]);
  };

  const handleSaveStaff = (staff: StaffMember) => {
    setStaffList((prev) => {
      const idx = prev.findIndex((s) => s.id === staff.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = staff;
        return next;
      }
      return [staff, ...prev];
    });
  };

  const handleDeleteStaff = (staffId: string) => {
    setStaffList((prev) => prev.filter((s) => s.id !== staffId));
  };

  const handleDeleteAllStaff = () => {
    setStaffList([]);
  };

  const handleSaveCctvCamera = (camera: CctvCamera) => {
    setCctvCameras((prev) => {
      const idx = prev.findIndex((c) => c.id === camera.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = camera;
        return next;
      }
      return [...prev, camera];
    });
  };

  const handleDeleteCctvCamera = (cameraId: string) => {
    setCctvCameras((prev) => prev.filter((c) => c.id !== cameraId));
  };

  const handleSaveDvrConfig = (config: DvrNvrConfig) => {
    setDvrConfig(config);
    showToast('DVR / NVR configuration saved successfully', 'success');
  };

  const handleSaveSecurityConfig = (config: SecurityConfig) => {
    setSecurityConfig(config);
    showToast('Security settings updated successfully', 'success');
  };

  // Add Product to Cart with Negative Stock Allowed (Negative Stock Management System)
  const addToCart = (product: Product, qtyToAdd = 1) => {
    // Note: Allow selling even when available stock is zero or negative.
    // Do not block sale because of insufficient stock.
    sounds.playBarcodeBeep();

    setCart((prevCart) => {
      const index = prevCart.findIndex((i) => i.product.id === product.id);
      if (index > -1) {
        const next = [...prevCart];
        const newQty = next[index].quantity + qtyToAdd;
        next[index] = {
          ...next[index],
          quantity: newQty,
          lineTotal: newQty * next[index].unitPrice,
        };
        return next;
      } else {
        const newItem: CartItem = {
          id: `item-${Date.now()}-${product.id}`,
          product,
          quantity: qtyToAdd,
          unitPrice: product.price,
          discountAmount: 0,
          lineTotal: product.price * qtyToAdd,
        };
        return [...prevCart, newItem];
      }
    });
  };

  const updateCartQty = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeCartItem(itemId);
      return;
    }
    // Allow any quantity entry directly (e.g. 50, 100, 500) even when exceeding stock
    setCart((prev) =>
      prev.map((i) => {
        if (i.id === itemId) {
          return {
            ...i,
            quantity: newQty,
            lineTotal: newQty * i.unitPrice,
          };
        }
        return i;
      })
    );
  };

  const removeCartItem = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
  };

  const handleClearCart = () => {
    setCart([]);
    setDiscountAmount(0);
    setResumedHeldBillId(null);
  };

  const handleBarcodeDetected = (code: string) => {
    if (activeNav === 'New Sale POS') {
      setScannedBarcodeForNewPos(code);
      setIsScannerOpen(false);
      return;
    }
    const clean = (code || '').trim().toLowerCase();
    if (!clean) return;

    const matched = products.find((p) => {
      const b = (p?.barcode || '').trim().toLowerCase();
      const s = (p?.sku || '').trim().toLowerCase();
      const n = (p?.name || '').trim().toLowerCase();
      return b === clean || s === clean || n === clean;
    });

    if (matched) {
      addToCart(matched, 1);
      sounds.playBarcodeBeep();
      showToast(`Added: ${matched.name}`, 'success');
      setIsScannerOpen(false);
    } else {
      sounds.playErrorTone();
      showToast(`Barcode "${code}" not found in product database.`, 'error');
      setIsAddProductOpen(true);
    }
  };

  // Real Purchase Processing
  const handleSavePurchase = (purchase: PurchaseTransaction, isEdit: boolean = false) => {
    if (isEdit) {
      const oldPurchase = purchases.find((p) => p.id === purchase.id);
      if (oldPurchase) {
        setProducts((prev) =>
          prev.map((prod) => {
            const oldItem = oldPurchase.items.find((i) => i.productId === prod.id);
            const newItem = purchase.items.find((i) => i.productId === prod.id);
            const oldQty = oldItem ? oldItem.quantity : 0;
            const newQty = newItem ? newItem.quantity : 0;
            const netDelta = newQty - oldQty;
            const newCost = newItem ? newItem.purchaseCost : prod.costPrice;
            return {
              ...prod,
              stock: Math.max(0, prod.stock + netDelta),
              costPrice: newCost,
            };
          })
        );
      }
    } else {
      setProducts((prev) =>
        prev.map((prod) => {
          const match = purchase.items.find((i) => i.productId === prod.id);
          if (match) {
            return {
              ...prod,
              stock: prod.stock + match.quantity,
              costPrice: match.purchaseCost,
              price: match.salePrice && match.salePrice > 0 ? match.salePrice : prod.price,
            };
          }
          return prod;
        })
      );
    }

    setSuppliers((prev) =>
      prev.map((sup) => {
        if (sup.id === purchase.supplierId) {
          if (isEdit) {
            const old = purchases.find((p) => p.id === purchase.id);
            const oldRemaining = old ? old.remainingBalance : 0;
            const diff = purchase.remainingBalance - oldRemaining;
            return { ...sup, payableBalance: Math.max(0, sup.payableBalance + diff) };
          } else {
            return { ...sup, payableBalance: sup.payableBalance + purchase.remainingBalance };
          }
        }
        return sup;
      })
    );

    setPurchases((prev) => {
      if (isEdit) {
        return prev.map((p) => (p.id === purchase.id ? purchase : p));
      } else {
        return [purchase, ...prev];
      }
    });

    syncService.syncPurchase(purchase);
    sounds.playSuccessChime();
  };

  const handleDeletePurchase = (purchaseId: string) => {
    const toDelete = purchases.find((p) => p.id === purchaseId);
    if (!toDelete) return;

    // 1. Reverse stock
    setProducts((prev) =>
      prev.map((prod) => {
        const item = toDelete.items?.find((i) => i.productId === prod.id);
        if (item) {
          return {
            ...prod,
            stock: Math.max(0, prod.stock - item.quantity),
          };
        }
        return prod;
      })
    );

    // 2. Reverse supplier payable balance
    setSuppliers((prev) =>
      prev.map((sup) => {
        if (sup.id === toDelete.supplierId) {
          return {
            ...sup,
            payableBalance: Math.max(0, sup.payableBalance - toDelete.remainingBalance),
          };
        }
        return sup;
      })
    );

    // 3. Remove from purchases list
    setPurchases((prev) => prev.filter((p) => p.id !== purchaseId));
    sounds.playSuccessChime();
    showToast(`Purchase #${toDelete.purchaseInvoiceNo} cancelled & reversed.`, 'info');
  };

  const handleAddSupplier = (supplier: Supplier) => {
    setSuppliers((prev) => [supplier, ...prev]);
    showToast(`Supplier "${supplier.name}" added to ledgers.`, 'success');
  };

  const handleSaveNewProduct = (newProd: Product) => {
    setProducts((prev) => [newProd, ...prev]);
    syncService.syncStock([newProd, ...products]);
    sounds.playSuccessChime();
    showToast(`Product "${newProd.name}" saved to inventory!`, 'success');
  };

  const handleSaveProduct = (prod: Product) => {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === prod.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = prod;
        syncService.syncStock(next);
        return next;
      }
      syncService.syncStock([prod, ...prev]);
      return [prod, ...prev];
    });
    sounds.playSuccessChime();
    showToast(`Product "${prod.name}" updated in inventory!`, 'success');
  };

  const handleDeleteProduct = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    setProducts((prev) => {
      const remaining = prev.filter((p) => p.id !== productId);
      syncService.syncStock(remaining);
      return remaining;
    });
    showToast(`Product "${prod?.name || 'Item'}" removed from inventory.`, 'info');
  };

  // Real Sale Return with Automatic Restocking & Refund Settlement
  const handleConfirmReturn = (returnRecord: SaleReturn) => {
    // 1. Restock accepted resaleable items back to product inventory
    let restockedUnits = 0;
    setProducts((prev) =>
      prev.map((prod) => {
        const returnItem = returnRecord.items.find(
          (i) => i.productId === prod.id && i.condition === 'resaleable'
        );
        if (returnItem) {
          restockedUnits += returnItem.quantity;
          return {
            ...prod,
            stock: prod.stock + returnItem.quantity,
          };
        }
        return prod;
      })
    );

    // 2. If refund method is Credit Adjustment, reduce customer's Udhar balance in customer ledger
    if (returnRecord.refundMethod === 'credit' && returnRecord.customerName) {
      const cust = customers.find(
        (c) => c.name.toLowerCase() === returnRecord.customerName?.toLowerCase()
      );
      if (cust) {
        const ledgerEntry: CustomerLedgerEntry = {
          id: `entry-${Date.now()}`,
          customerId: cust.id,
          date: returnRecord.date,
          details: `Return Adjustment #${returnRecord.returnNumber} (Orig #${returnRecord.originalInvoiceNumber})`,
          credit: 0,
          debit: returnRecord.totalRefund, // Debit reduces outstanding Udhar
          runningBalance: 0,
          invoiceNumber: returnRecord.returnNumber,
          paymentMethod: 'Credit Adjustment',
          createdAt: new Date().toISOString(),
        };
        setCustomerLedgerEntries((prev) => [...prev, ledgerEntry]);
      }
    }

    // 3. Save Return Record
    setSaleReturns((prev) => [returnRecord, ...prev]);
    syncService.syncReturn(returnRecord);

    sounds.playSuccessChime();
    showToast(
      `Return #${returnRecord.returnNumber} completed! ${restockedUnits} units restocked to inventory. Refund of ${formatRs(
        returnRecord.totalRefund
      )} settled.`,
      'success'
    );
  };

  // Hold Bill
  const handleHoldBill = () => {
    if (cart.length === 0) {
      sounds.playErrorTone();
      showToast('Cannot hold an empty cart!', 'error');
      return;
    }

    const holdNumber = `HOLD-${Math.floor(100 + Math.random() * 900)}`;
    const newHeldBill: HeldBill = {
      id: `hold-${Date.now()}`,
      holdNumber,
      createdAt: new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true }),
      mode,
      items: [...cart],
      subtotal,
      discount,
      grandTotal,
      totalQty,
      sourcePage: 'Old Sale',
    };

    let updatedHeld = [...heldBills];
    if (resumedHeldBillId) {
      updatedHeld = updatedHeld.filter((b) => b.id !== resumedHeldBillId);
    }
    updatedHeld.push(newHeldBill);

    setHeldBills(updatedHeld);
    syncService.syncHeldBills(updatedHeld);
    setCart([]);
    setDiscountAmount(0);
    setResumedHeldBillId(null);
    setIsCartDrawerOpen(false);

    sounds.playSuccessChime();
    showToast(`Bill parked as ${holdNumber} in Old Sale. Ready for next customer!`, 'success');
  };

  const handleResumeHeldBill = (bill: HeldBill) => {
    if (!bill || !bill.items || bill.items.length === 0) {
      sounds.playErrorTone();
      showToast('Held bill contains no items to resume.', 'error');
      return;
    }

    try {
      // Remove the held entry from active Hold Bills list ONLY after successful restoration
      setHeldBills((prev) => {
        const nextHeld = prev.filter((b) => b.id !== bill.id);
        localStorage.setItem(STORAGE_KEYS.HELD_BILLS, JSON.stringify(nextHeld));
        return nextHeld;
      });

      setResumedHeldBillId(null);
      setIsHeldBillsOpen(false);

      if (bill.sourcePage === 'New Sale') {
        // ALWAYS reopen inside New Sale Page
        setResumedNewSaleBill(bill);
        setActiveNav('New Sale POS');
        sounds.playBarcodeBeep();
        showToast(`Resumed ${bill.holdNumber} into New Sale (${bill.totalQty} items).`, 'success');
      } else {
        // ALWAYS reopen inside Old Sale Page
        if (cart.length > 0) {
          // Automatically preserve active cart to prevent data loss
          const activeHoldNumber = `HOLD-${Math.floor(100 + Math.random() * 900)}`;
          const heldActive: HeldBill = {
            id: `hold-${Date.now()}`,
            holdNumber: activeHoldNumber,
            createdAt: new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true }),
            mode,
            items: [...cart],
            subtotal,
            discount,
            grandTotal,
            totalQty,
            sourcePage: 'Old Sale',
          };
          const updatedHeld = [...heldBills, heldActive];
          setHeldBills(updatedHeld);
          syncService.syncHeldBills(updatedHeld);
          showToast(`Previous cart preserved safely as ${activeHoldNumber}`, 'info');
        }

        // Restore all products, quantities, prices, discounts into Old Sale cart
        setMode(bill.mode || 'sale');
        setCart(bill.items);
        setDiscountAmount(bill.discount || 0);
        setActiveNav('Sale POS');

        sounds.playBarcodeBeep();
        showToast(`Resumed ${bill.holdNumber} into Old Sale (${bill.totalQty} items). Ready for checkout!`, 'success');
      }
    } catch (err) {
      console.error('Failed to restore held bill', err);
      sounds.playErrorTone();
      showToast('Failed to resume held bill. The bill remains safely parked.', 'error');
    }
  };

  // Manual Delete of Held Bill
  const handleDeleteHeldBill = (billId: string) => {
    setHeldBills((prev) => {
      const nextHeld = prev.filter((b) => b.id !== billId);
      localStorage.setItem(STORAGE_KEYS.HELD_BILLS, JSON.stringify(nextHeld));
      syncService.deleteHeldBill(billId);
      return nextHeld;
    });

    if (resumedHeldBillId === billId) {
      setResumedHeldBillId(null);
    }

    sounds.playBarcodeBeep();
    showToast('Held bill permanently deleted from active list and database.', 'info');
  };

  const handleCancelHeldBill = (billId: string) => {
    handleDeleteHeldBill(billId);
  };

  const handleDeleteAllHeldBills = () => {
    setHeldBills([]);
    localStorage.setItem(STORAGE_KEYS.HELD_BILLS, JSON.stringify([]));
    sounds.playSuccessChime();
    showToast('All held bills permanently deleted.', 'info');
  };

  const handleDeleteAllProducts = () => {
    setProducts([]);
    syncService.syncStock([]);
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify([]));
    sounds.playSuccessChime();
    showToast('All products deleted from inventory.', 'info');
  };

  const handleDeleteAllPurchases = () => {
    if (purchases.length === 0) return;
    purchases.forEach((p) => {
      setProducts((prev) =>
        prev.map((prod) => {
          const item = p.items?.find((i) => i.productId === prod.id);
          if (item) {
            return {
              ...prod,
              stock: Math.max(0, prod.stock - item.quantity),
            };
          }
          return prod;
        })
      );
      setSuppliers((prev) =>
        prev.map((sup) => {
          if (sup.id === p.supplierId) {
            return {
              ...sup,
              payableBalance: Math.max(0, sup.payableBalance - p.remainingBalance),
            };
          }
          return sup;
        })
      );
    });

    setPurchases([]);
    sounds.playSuccessChime();
    showToast(`All ${purchases.length} purchase records deleted and stock reversed.`, 'info');
  };

  const handleDeleteAllCustomers = () => {
    setCustomers([]);
    setCustomerLedgerEntries([]);
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CUSTOMER_LEDGERS, JSON.stringify([]));
    sounds.playSuccessChime();
    showToast('All customers and customer ledgers permanently deleted.', 'info');
  };

  const [isResetSystemOpen, setIsResetSystemOpen] = useState(false);

  const handlePerformCompleteReset = () => {
    // 1. Create full complete JSON backup file before any wipe
    const backupData = {
      exportedAt: new Date().toISOString(),
      martName: branding.storeName || 'WAQAS MART',
      appletId: 'waqas-mart-pos',
      transactions,
      purchases,
      products,
      customers,
      customerLedgerEntries,
      suppliers,
      heldBills,
      saleReturns,
      branding,
    };

    const fileName = `waqas_mart_full_backup_${new Date().toISOString().slice(0, 10)}_${Date.now().toString().slice(-4)}.json`;
    const jsonBlob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(jsonBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);

    const stats = {
      transactionsCount: transactions.length,
      purchasesCount: purchases.length,
      customersCount: customers.length,
      productsCount: products.length,
      heldBillsCount: heldBills.length,
    };

    // 2. Clear all business transactions and ledgers
    setTransactions([]);
    setPurchases([]);
    setHeldBills([]);
    setCustomerLedgerEntries([]);
    setSaleReturns([]);
    setCart([]);
    setDiscountAmount(0);

    // 3. Zero balances for customers and suppliers
    setCustomers((prev) => prev.map((c) => ({ ...c, previousBalance: 0, currentBalance: 0 })));
    setSuppliers((prev) => prev.map((s) => ({ ...s, payableBalance: 0 })));

    // 4. Zero stock quantities for products
    setProducts((prev) => prev.map((p) => ({ ...p, stock: 0 })));

    // 5. Update local storage safely (preserving branding, accounts, and credentials)
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.HELD_BILLS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify([]));
    localStorage.removeItem('wm_expenses');
    localStorage.removeItem('wm_cash_register');

    sounds.playSuccessChime();
    showToast('System Reset Complete! Automatic JSON backup downloaded.', 'success');

    return {
      backupFileName: fileName,
      stats,
    };
  };

  // Checkout Confirmation
  const handleConfirmCheckout = (details: {
    method: 'cash' | 'card' | 'credit';
    cashTendered?: number;
    changeDue?: number;
    cardBank?: string;
    cardRef?: string;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    note?: string;
  }) => {
    if (cart.length === 0 || grandTotal < 0) return;

    // Deduct stock for sold items (Negative Stock Management System: e.g. 0 - 5 = -5, 3 - 8 = -5)
    if (mode === 'sale') {
      setProducts((prev) =>
        prev.map((p) => {
          const cartMatch = cart.find((i) => i.product.id === p.id);
          if (cartMatch) {
            return { ...p, stock: p.stock - cartMatch.quantity };
          }
          return p;
        })
      );
    }

    const invoiceNumber = `WM-${Date.now().toString().slice(-6)}`;
    const transaction: SaleTransaction = {
      invoiceNumber,
      dateTime: new Date().toLocaleString('en-PK', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      mode,
      items: [...cart],
      subtotal,
      discount,
      taxAmount: 0,
      grandTotal,
      paymentMethod: details.method,
      cashTendered: details.cashTendered,
      changeDue: details.changeDue,
      cardReference: details.cardRef,
      cardBank: details.cardBank,
      customerName: details.customerName,
      customerPhone: details.customerPhone,
      cashierName: 'Counter 01 / کاؤنٹر ۱',
      status: 'completed',
    };

    setTransactions((prev) => [transaction, ...prev]);
    syncService.syncSale(transaction);

    // If Credit / Pay Later or partial credit sale: record into Customer Ledger exactly once!
    if (details.method === 'credit' && details.customerName) {
      let cust = customers.find((c) =>
        (details.customerId && c.id === details.customerId) ||
        c.name.toLowerCase() === details.customerName?.toLowerCase()
      );

      if (!cust) {
        cust = {
          id: details.customerId || `cust-${Date.now()}`,
          name: details.customerName,
          phone: details.customerPhone,
          previousBalance: 0,
          createdAt: new Date().toLocaleDateString('en-GB'),
        };
        setCustomers((prev) => [cust!, ...prev]);
      }

      const advancePaid = details.cashTendered || 0;
      const unpaidCredit = Math.max(0, grandTotal - advancePaid);

      if (unpaidCredit > 0) {
        const todayFormatted = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY
        const ledgerEntry: CustomerLedgerEntry = {
          id: `entry-${Date.now()}`,
          customerId: cust.id,
          date: todayFormatted,
          details: `POS Sale Invoice #${invoiceNumber}`,
          credit: unpaidCredit,
          debit: 0,
          runningBalance: 0,
          invoiceNumber,
          paymentMethod: 'Credit / Pay Later',
          createdAt: new Date().toISOString(),
        };

        setCustomerLedgerEntries((prev) => [...prev, ledgerEntry]);
        showToast(`Udhar of ${formatRs(unpaidCredit)} recorded in ${cust.name}'s ledger!`, 'info');
      }
    }

    if (resumedHeldBillId) {
      setHeldBills((prev) => prev.filter((b) => b.id !== resumedHeldBillId));
      setResumedHeldBillId(null);
    }

    sounds.playSuccessChime();
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#16a34a', '#10b981', '#34d399', '#ffffff'],
    });

    setCart([]);
    setDiscountAmount(0);
    setIsCheckoutOpen(false);

    setCurrentTransaction(transaction);
    setIsReceiptOpen(true);
  };

  // Customer Management Handlers
    const handleSaveNewPosInvoice = (invoiceData: {
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
  }) => {
    // 1. Deduct stock from shared products inventory (Negative Stock Management System: e.g. 0 - 5 = -5)
    setProducts((prev) =>
      prev.map((p) => {
        const match = invoiceData.items.find((it) => it.product.id === p.id);
        if (match) {
          return { ...p, stock: p.stock - match.quantity };
        }
        return p;
      })
    );

    // 2. Create SaleTransaction
    const transaction: SaleTransaction = {
      invoiceNumber: invoiceData.invoiceNumber,
      dateTime: new Date().toLocaleString('en-PK', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      mode: 'sale',
      items: [...invoiceData.items],
      subtotal: invoiceData.subtotal,
      discount: invoiceData.discount,
      taxAmount: invoiceData.taxAmount,
      grandTotal: invoiceData.grandTotal,
      paymentMethod: invoiceData.paymentMethod,
      cashTendered: invoiceData.cashTendered,
      changeDue: invoiceData.changeDue,
      customerId: invoiceData.customerId,
      customerName: invoiceData.customerName,
      customerPhone: invoiceData.customerPhone,
      cashierName: currentUser.displayName || 'Counter 01',
      status: 'completed',
    };

    setTransactions((prev) => [transaction, ...prev]);
    syncService.syncSale(transaction);

    // 3. Customer Khata Udhar recording
    if (invoiceData.paymentMethod === 'credit' && (invoiceData.customerId || invoiceData.customerName)) {
      let cust = customers.find(
        (c) =>
          (invoiceData.customerId && c.id === invoiceData.customerId) ||
          (invoiceData.customerName && c.name.toLowerCase() === invoiceData.customerName.toLowerCase())
      );
      if (!cust && invoiceData.customerName) {
        cust = {
          id: invoiceData.customerId || ("cust-" + Date.now()),
          name: invoiceData.customerName,
          phone: invoiceData.customerPhone,
          previousBalance: 0,
          createdAt: new Date().toLocaleDateString('en-GB'),
        };
        if (cust) { const newCust = cust; setCustomers((prev) => [newCust, ...prev]); }
      }
      if (cust) {
        const advancePaid = invoiceData.cashTendered || 0;
        const unpaidCredit = Math.max(0, invoiceData.grandTotal - advancePaid);
        if (unpaidCredit > 0) {
          const todayFormatted = new Date().toLocaleDateString('en-GB');
          const ledgerEntry: CustomerLedgerEntry = {
            id: "entry-" + Date.now(),
            customerId: cust.id,
            date: todayFormatted,
            details: "POS Sale Invoice #" + invoiceData.invoiceNumber,
            credit: unpaidCredit,
            debit: 0,
            runningBalance: (cust.previousBalance || 0) + unpaidCredit,
            invoiceNumber: invoiceData.invoiceNumber,
            paymentMethod: 'Credit / Pay Later',
            createdAt: new Date().toISOString(),
          };
          setCustomerLedgerEntries((prev) => [...prev, ledgerEntry]);
        }
      }
    }

    setCurrentTransaction(transaction);
    setIsReceiptOpen(true);
  };

  const handleHoldBillFromNewPos = (billData: {
    items: CartItem[];
    subtotal: number;
    discount: number;
    grandTotal: number;
    customerName?: string;
    customerPhone?: string;
  }) => {
    const holdNumber = "HOLD-" + Date.now().toString().slice(-4);
    const newHeldBill: HeldBill = {
      id: "held-" + Date.now(),
      holdNumber,
      createdAt: new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true }),
      mode: 'sale',
      items: billData.items,
      subtotal: billData.subtotal,
      discount: billData.discount,
      grandTotal: billData.grandTotal,
      totalQty: billData.items.reduce((sum, it) => sum + it.quantity, 0),
      customerName: billData.customerName,
      customerPhone: billData.customerPhone,
    };
    const nextList = [newHeldBill, ...heldBills];
    setHeldBills(nextList);
    syncService.syncHeldBills(nextList);
    showToast("Bill parked as " + holdNumber, 'info');
  };

  const handleSaveCustomer = (customer: Customer) => {
    setCustomers((prev) => {
      const idx = prev.findIndex((c) => c.id === customer.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = customer;
        return next;
      }
      return [customer, ...prev];
    });
  };

  const handleDeleteCustomer = (customerId: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
    setCustomerLedgerEntries((prev) => prev.filter((e) => e.customerId !== customerId));
  };

  const handleSaveLedgerEntry = (entry: CustomerLedgerEntry) => {
    setCustomerLedgerEntries((prev) => {
      const idx = prev.findIndex((e) => e.id === entry.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = entry;
        return next;
      }
      return [...prev, entry];
    });
  };

  const handleDeleteLedgerEntry = (entryId: string) => {
    setCustomerLedgerEntries((prev) => prev.filter((e) => e.id !== entryId));
  };

  // Filtered Products for POS
  const cleanSearchQuery = (searchQuery || '').toLowerCase().trim();
  const filteredProducts = products.filter((p) => {
    const pCat = (p?.category || '').toUpperCase();
    const targetCat = (selectedCategory || 'ALL ITEMS').toUpperCase();
    const matchesCategory =
      targetCat === 'ALL ITEMS' || pCat.includes(targetCat);

    if (!cleanSearchQuery) return matchesCategory;

    const pName = (p?.name || '').toLowerCase();
    const pBarcode = (p?.barcode || '').toLowerCase();
    const pSku = (p?.sku || '').toLowerCase();
    const pUrdu = p?.urduName ? p.urduName.toLowerCase() : '';

    const matchesName = pName.includes(cleanSearchQuery);
    const matchesBarcode = pBarcode.includes(cleanSearchQuery) || (pSku && pSku === cleanSearchQuery);
    const matchesUrdu = pUrdu.includes(cleanSearchQuery);

    return matchesCategory && (matchesName || matchesBarcode || matchesUrdu);
  });

  // Handlers for Supplier Ledgers
  const handleSaveSupplierLedger = (entry: SupplierLedgerEntry) => {
    setSupplierLedgers((prev) => {
      const idx = prev.findIndex((e) => e.id === entry.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = entry;
        return next;
      }
      return [entry, ...prev];
    });
  };

  const handleDeleteSupplierLedger = (entryId: string) => {
    setSupplierLedgers((prev) => prev.filter((e) => e.id !== entryId));
  };

  // Central Navigation Dispatcher - Guarantees accurate screen routing for all 22 pages & modules
  const handleNavigate = (page: string) => {
    if (page === 'New Sale POS' || page === 'New Sale Page' || page === 'New Sale' || page === 'New POS' || page === 'POS Terminal') {
      setActiveNav('New Sale POS');
      setMode('sale');
    } else if (page === 'Sale POS' || page === 'Classic Sale POS' || page === 'Old Sale Page' || page === 'Old Sale' || page === 'Classic Sale') {
      setActiveNav('Sale POS');
      setMode('sale');
    } else if (page === 'New Purchase Entry' || page === 'New Purchase') {
      setActiveNav('New Purchase Entry');
      setMode('purchase');
    } else if (page === 'Purchase Entry' || page === 'Classic Purchase' || page === 'Old Purchase Entry' || page === 'Old Purchase') {
      setActiveNav('Purchase Entry');
      setMode('purchase');
    } else if (page === 'Sale Returns' || page === 'Return Mode' || page === 'Sales Return') {
      setActiveNav('Sale Returns');
      setMode('return');
    } else if (page === 'Daily Hisab') {
      setActiveNav('Daily Hisab');
    } else if (page === 'Customer Ledgers' || page === 'All Customer Udhar' || page === 'Customers / Udhaar' || page === 'Customers' || page === 'Udhaar') {
      setActiveNav('Customer Ledgers');
      setSelectedLedgerCustomerId(null);
    } else if (page === 'Supplier Ledgers' || page === 'Suppliers') {
      setActiveNav('Supplier Ledgers');
    } else if (page === 'Expenses') {
      setActiveNav('Expenses');
    } else if (page === 'Purchase Returns') {
      setActiveNav('Purchase Returns');
    } else if (page === 'All Staff' || page === 'Staff' || page === 'Staff Management') {
      setActiveNav('All Staff');
    } else if (page === 'CCTV' || page === 'Cameras') {
      setActiveNav('CCTV');
    } else if (page === 'Security Settings' || page === 'Security & App Lock' || page === 'Security' || page === 'Generate Mart Password') {
      if (isOwner) {
        setIsGenerateMartPasswordOpen(true);
      } else {
        showToast('Only Software Owner can generate Mart Passwords.', 'info');
      }
      setActiveNav('Security Settings');
    } else if (page === 'Reports' || page === 'Sale Summary') {
      setActiveNav('Sale Summary');
    } else if (page === 'Total Stock' || page === 'Products' || page === 'Stock') {
      setActiveNav('Total Stock');
    } else if (page === 'Connect New Device') {
      setIsConnectQrOpen(true);
    } else if (page === 'Settings' || page === 'Owner Profiles') {
      setIsSettingsOpen(true);
    } else if (page === 'Device Management') {
      setActiveNav('Device Management');
    } else {
      setActiveNav(page);
    }
  };

  // Desktop Left Sidebar Navigation Items matching Screenshot 1
  const sidebarNavItems = [
    { id: 'Home', label: 'Home', icon: Home },
    { id: 'New Sale POS', label: 'New Sale Page', icon: ShoppingBag },
    { id: 'Sale POS', label: 'Classic Sale POS', icon: ShoppingCart },
    { id: 'New Purchase Entry', label: 'New Purchase Entry', icon: Truck },
    { id: 'Purchase Entry', label: 'Classic Purchase', icon: FileText },
    { id: 'Products', label: 'Products', icon: Package },
    { id: 'Total Stock', label: 'Total Stock', icon: Layers },
    { id: 'Customer Ledgers', label: 'Customer Ledgers', icon: Users },
    { id: 'Supplier Ledgers', label: 'Supplier Ledgers', icon: Truck },
    { id: 'Daily Hisab', label: 'Daily Hisab', icon: FileSpreadsheet },
    { id: 'Expenses', label: 'Expenses', icon: Wallet },
    { id: 'Cash Book / Wallets', label: 'Cash Book / Wallets', icon: CreditCard },
    { id: 'Sale Returns', label: 'Sale Returns', icon: RotateCcw },
    { id: 'Purchase Returns', label: 'Purchase Returns', icon: Undo },
    { id: 'All Staff', label: 'All Staff', icon: UserCheck },
    { id: 'CCTV', label: 'CCTV Cameras', icon: Camera },
    ...(isOwner ? [{ id: 'Security Settings', label: 'Security & Mart Password', icon: Shield }] : []),
    { id: 'Reports', label: 'Reports', icon: TrendingUp },
    { id: 'Device Management', label: 'Device Management', icon: Smartphone },
    { id: 'Settings', label: 'Settings', icon: Settings },
  ];

  // 1. Unauthenticated Login Gateway (Software Owner & Mart User options only)
  if (!authSession) {
    return <LoginGateway onLoginSuccess={handleLoginSuccess} />;
  }

  const isHomePage = activeNav === 'Home';
  const isNewSalePage = activeNav === 'New Sale POS' || activeNav === 'New Sale' || activeNav === 'New Sale Page' || activeNav === 'POS Terminal' || activeNav === 'New POS';

  return (
    <div className="h-[100dvh] w-full max-w-full bg-[#f8fafc] text-slate-900 flex flex-col font-sans overflow-hidden">
      {/* MAIN CONTENT WORKSPACE (Allows complete vertical scrolling for every page) */}
      <main className={`flex-1 flex flex-col min-w-0 min-h-0 w-full overflow-y-auto overflow-x-hidden ${isNewSalePage ? 'pb-0' : 'pb-16 lg:pb-0'} overscroll-y-contain`}>
        {/* CONDITIONAL PAGE RENDER (ALL 22 EXISTING PAGES & MODULES) */}
        {activeNav === 'Device Management' || activeNav === 'Connect New Device' ? (
          /* PAGE 19: MULTI-DEVICE MANAGEMENT & QR TERMINAL CONNECTIONS */
          <DeviceManagementPage
            currentDevice={currentDevice}
            branding={branding}
            onNavigateHome={() => setActiveNav('Home')}
            onOpenConnectNewQr={() => setIsConnectQrOpen(true)}
            onOpenPairThisDevice={() => setIsPairModalOpen(true)}
            onOpenPwaInstall={() => setIsPwaInstallOpen(true)}
            isPwaInstallable={true}
          />
        ) : activeNav === 'Daily Hisab' ? (
          /* PAGE 12: DAILY HISAB EXCEL SPREADSHEET (MATCHING USER'S EXCEL PHOTO) */
          <DailyHisabExcelPage
            transactions={transactions}
            purchases={purchases}
            customerLedgerEntries={customerLedgerEntries}
            onNavigateToSummary={() => setActiveNav('Sale Summary')}
            onNavigateToLedgers={() => {
              setActiveNav('Customer Ledgers');
              setSelectedLedgerCustomerId(null);
            }}
            onBackToHome={() => setActiveNav('Home')}
          />
        ) : activeNav === 'Customer Ledgers' || activeNav === 'All Customer Udhar' || activeNav === 'Customers / Udhaar' || activeNav === 'Customers' || activeNav === 'Udhaar' ? (
          /* PAGE 8 & 10: CUSTOMER UDHAR LEDGERS & GRAND LEDGER */
          <CustomerLedgersPage
            customers={customers}
            ledgerEntries={customerLedgerEntries}
            onSaveCustomer={handleSaveCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onSaveLedgerEntry={handleSaveLedgerEntry}
            onDeleteLedgerEntry={handleDeleteLedgerEntry}
            onDeleteAllCustomers={handleDeleteAllCustomers}
            initialSelectedCustomerId={selectedLedgerCustomerId}
            onBackToPos={() => setActiveNav('Sale POS')}
            onNavigateToDailyHisab={() => setActiveNav('Daily Hisab')}
            onBackToHome={() => setActiveNav('Home')}
          />
        ) : activeNav === 'Supplier Ledgers' || activeNav === 'Suppliers' ? (
          /* PAGE 9 & 11: SUPPLIER LEDGERS & DIRECTORY */
          <SupplierLedgersPage
            suppliers={suppliers}
            purchases={purchases}
            ledgerEntries={supplierLedgers}
            onSaveLedgerEntry={handleSaveSupplierLedgerEntry}
            onDeleteLedgerEntry={handleDeleteSupplierLedgerEntry}
            onSaveSupplier={handleSaveSupplier}
            onDeleteSupplier={handleDeleteSupplier}
            onNavigateToPurchases={() => setActiveNav('New Purchase Entry')}
            onBackToHome={() => setActiveNav('Home')}
          />
        ) : activeNav === 'Total Stock' || activeNav === 'Products' || activeNav === 'Stock' ? (
          /* PAGE 6 & 7: TOTAL STOCK & PRODUCT MANAGEMENT */
          <TotalStockPage
            products={products}
            categories={categories}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
            onDeleteAllProducts={handleDeleteAllProducts}
            onOpenAddProduct={() => setIsAddProductOpen(true)}
            onOpenScanner={() => setIsScannerOpen(true)}
            onNavigateToPos={() => {
              setActiveNav('New Sale POS');
              setMode('sale');
            }}
            onBackToHome={() => setActiveNav('Home')}
          />
        ) : activeNav === 'Sale Summary' || activeNav === 'Reports' ? (
          /* PAGE 15: SALE SUMMARY & ANALYTICS REPORTS */
          <SaleSummaryPage
            transactions={transactions}
            saleReturns={saleReturns}
            products={products}
            purchases={purchases}
            onSelectInvoiceToPrint={(tx) => {
              setCurrentTransaction(tx);
              setIsReceiptOpen(true);
            }}
            onNavigate={(p) => handleNavigate(p)}
            activeNav={activeNav}
            onBackToHome={() => setActiveNav('Home')}
          />
        ) : activeNav === 'New Sale POS' || activeNav === 'New Sale' || activeNav === 'New Sale Page' || activeNav === 'POS Terminal' || activeNav === 'New POS' ? (
          /* PAGE 2 & 16: NEW SALE POS WORKSTATION / POS TERMINAL */
          <NewSalePosPage
            products={products}
            customers={customers}
            heldBills={heldBills}
            transactions={transactions}
            branding={branding}
            currentUser={currentUser}
            currentDevice={currentDevice}
            scannedBarcode={scannedBarcodeForNewPos}
            onClearScannedBarcode={() => setScannedBarcodeForNewPos(null)}
            onSaveInvoice={handleSaveNewPosInvoice}
            onHoldBill={handleHoldBillFromNewPos}
            onResumeHeldBill={handleResumeHeldBill}
            onDeleteHeldBill={handleDeleteHeldBill}
            onOpenHeldBillsModal={() => setIsHeldBillsOpen(true)}
            onOpenScanner={() => setIsScannerOpen(true)}
            onOpenAddProduct={() => setIsAddProductOpen(true)}
            onQuickAddCustomer={handleSaveCustomer}
            onNavigate={handleNavigate}
            onViewReceipt={(tx) => {
              setCurrentTransaction(tx);
              setIsReceiptOpen(true);
            }}
            resumedBill={resumedNewSaleBill}
            onClearResumedBill={() => setResumedNewSaleBill(null)}
            onSwitchToOldSale={() => setActiveNav('Sale POS')}
            onBackToHome={() => setActiveNav('Home')}
          />
        ) : activeNav === 'Sale POS' || activeNav === 'Old Sale' || activeNav === 'Classic Sale POS' || activeNav === 'Classic Sale' || activeNav === 'Old Sale Page' ? (
          /* PAGE 3: OLD SALE (CLASSIC SALE POS WORKSTATION) */
          <SalePosPage
            products={products}
            categories={categories}
            cart={cart}
            mode={mode}
            totalQty={totalQty}
            subtotal={subtotal}
            discount={discount}
            grandTotal={grandTotal}
            heldBillsCount={heldBills.length}
            branding={branding}
            currentUser={currentUser}
            currentDevice={currentDevice}
            transactions={transactions}
            onAddToCart={addToCart}
            onUpdateCartQty={updateCartQty}
            onRemoveCartItem={removeCartItem}
            onClearCart={handleClearCart}
            onSwitchMode={(newMode) => {
              setMode(newMode);
              if (newMode === 'purchase') handleNavigate('New Purchase Entry');
              if (newMode === 'return') handleNavigate('Sale Returns');
            }}
            onOpenCheckout={() => {
              setIsCheckoutOpen(true);
            }}
            onHoldBill={handleHoldBill}
            onOpenHeldBills={() => setIsHeldBillsOpen(true)}
            heldBills={heldBills}
            onResumeHeldBill={handleResumeHeldBill}
            onDeleteHeldBill={handleDeleteHeldBill}
            onOpenScanner={() => setIsScannerOpen(true)}
            onOpenAddProduct={() => setIsAddProductOpen(true)}
            onOpenHistory={() => setIsHistoryOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onLockApp={() => {
              if (pinHash) {
                setIsLocked(true);
              } else {
                setIsLockConfigOpen(true);
              }
            }}
            onNavigate={handleNavigate}
            onViewReceipt={(tx) => {
              setCurrentTransaction(tx);
              setIsReceiptOpen(true);
            }}
            onSwitchToNewSale={() => setActiveNav('New Sale POS')}
            onLoadSeedProducts={handleLoadSeedCatalog}
            onResetAllZero={handleResetAllZero}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            statusMessage={statusMessage}
            customers={customers}
            onQuickAddCustomer={handleSaveCustomer}
            onConfirmCheckout={handleConfirmCheckout}
            onDeleteTransaction={(invNum) => {
              if (window.confirm(`Delete Invoice #${invNum}? This will remove it from sales records. (کیا آپ انوائس نمبر #${invNum} ڈیلیٹ کرنا چاہتے ہیں؟)`)) {
                setTransactions((prev) => prev.filter((t) => t.invoiceNumber !== invNum));
                showToast(`Invoice #${invNum} deleted successfully (انوائس ڈیلیٹ ہو گئی)`, 'info');
              }
            }}
            onEditTransaction={(tx) => {
              setCart(tx.items);
              showToast(`Invoice #${tx.invoiceNumber} loaded into cart for editing.`, 'info');
            }}
          />
        ) : activeNav === 'New Purchase Entry' || activeNav === 'New Purchase' ? (
          /* PAGE 4: NEW PURCHASE ENTRY (EXACT REFERENCE SCREENSHOT WORKSTATION) */
          <NewPurchaseEntryPage
            products={products}
            suppliers={suppliers}
            purchases={purchases}
            branding={branding}
            currentUser={currentUser}
            currentDevice={currentDevice}
            onSavePurchase={handleSavePurchase}
            onDeletePurchase={handleDeletePurchase}
            onAddSupplier={handleAddSupplier}
            onOpenAddProduct={() => setIsAddProductOpen(true)}
            onOpenScanner={() => setIsScannerOpen(true)}
            onNavigate={handleNavigate}
            onUpdateBranding={(b) => {
              setBranding(b);
              localStorage.setItem(STORAGE_KEYS.BRANDING, JSON.stringify(b));
            }}
          />
        ) : activeNav === 'Purchase Entry' || activeNav === 'Old Purchase' || activeNav === 'Classic Purchase' || activeNav === 'Old Purchase Entry' ? (
          /* PAGE 5: OLD PURCHASE (CLASSIC PURCHASE ENTRY) */
          <div className="flex-1 flex flex-col w-full h-full min-h-0 overflow-hidden">
            <PurchaseEntryPage
              products={products}
              suppliers={suppliers}
              purchases={purchases}
              onSavePurchase={handleSavePurchase}
              onDeletePurchase={handleDeletePurchase}
              onDeleteAllPurchases={handleDeleteAllPurchases}
              onAddSupplier={handleAddSupplier}
              onOpenAddProduct={() => setIsAddProductOpen(true)}
              onOpenScanner={() => setIsScannerOpen(true)}
              onNavigate={handleNavigate}
              onBackToHome={() => setActiveNav('Home')}
            />
          </div>
        ) : activeNav === 'Sale Returns' || activeNav === 'Return Mode' || activeNav === 'Sales Return' ? (
          /* PAGE: SALE RETURN MODE (REAL RETURN, INVOICE LOOKUP & AUTOMATIC RESTOCKING) */
          <SaleReturnCenter
            products={products}
            transactions={transactions}
            saleReturns={saleReturns}
            customers={customers}
            onConfirmReturn={handleConfirmReturn}
            onOpenScanner={() => setIsScannerOpen(true)}
            onSwitchMode={(newMode) => {
              if (newMode === 'purchase') {
                handleNavigate('New Purchase Entry');
              } else {
                handleNavigate('New Sale POS');
              }
            }}
            onBackToHome={() => setActiveNav('Home')}
          />
        ) : activeNav === 'Expenses' ? (
          /* PAGE 13: EXPENSES TRACKER */
          <ExpensesPage
            expenses={expenses}
            onSaveExpense={handleSaveExpense}
            onDeleteExpense={handleDeleteExpense}
            onDeleteAllExpenses={handleDeleteAllExpenses}
            onBackToHome={() => setActiveNav('Home')}
          />
        ) : activeNav === 'Purchase Returns' ? (
          /* PAGE 14: PURCHASE RETURNS */
          <PurchaseReturnsPage
            purchases={purchases}
            purchaseReturns={purchaseReturns}
            suppliers={suppliers}
            products={products}
            onSavePurchaseReturn={handleSavePurchaseReturn}
            onDeletePurchaseReturn={handleDeletePurchaseReturn}
            onDeleteAllReturns={handleDeleteAllPurchaseReturns}
            onBackToHome={() => setActiveNav('Home')}
          />
        ) : activeNav === 'All Staff' || activeNav === 'Staff' || activeNav === 'Staff Management' ? (
          /* PAGE 18: ALL STAFF MANAGEMENT */
          <AllStaffPage
            staffList={staffList}
            onSaveStaff={handleSaveStaff}
            onDeleteStaff={handleDeleteStaff}
            onDeleteAllStaff={handleDeleteAllStaff}
            onBackToHome={() => setActiveNav('Home')}
          />
        ) : activeNav === 'CCTV' || activeNav === 'Cameras' ? (
          /* PAGE 17: CCTV & SECURITY CAMERAS */
          <CctvPage
            cameras={cctvCameras}
            dvrConfig={dvrConfig}
            onSaveCamera={handleSaveCctvCamera}
            onDeleteCamera={handleDeleteCctvCamera}
            onSaveDvrConfig={handleSaveDvrConfig}
            onBackToHome={() => setActiveNav('Home')}
          />
        ) : activeNav === 'Security Settings' || activeNav === 'Security' || activeNav === 'Generate Mart Password' ? (
          /* PAGE 20: SECURITY SETTINGS & MART PASSWORD GENERATION (OWNER ONLY) */
          <SecuritySettingsPage
            isOwner={isOwner}
            onBackToHome={() => setActiveNav('Home')}
          />
        ) : (
          /* PAGE 1 & DEFAULT: ULTRA-MODERN HOME DASHBOARD + 16 ACTION TILES */
          <HomePage
            products={products}
            transactions={transactions}
            purchases={purchases}
            customers={customers}
            customerLedgerEntries={customerLedgerEntries}
            suppliers={suppliers}
            saleReturns={saleReturns}
            currentUser={currentUser}
            currentDevice={currentDevice}
            branding={branding}
            onUpdateBranding={setBranding}
            onUpdateUser={setCurrentUser}
            onNavigate={handleNavigate}
            onOpenScanner={() => setIsScannerOpen(true)}
            onOpenAddProduct={() => setIsAddProductOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenHistory={() => setIsHistoryOpen(true)}
            onOpenConnectNewQr={() => setIsConnectQrOpen(true)}
            onOpenPairThisDevice={() => setIsPairModalOpen(true)}
            onSelectCustomer={(id) => {
              setSelectedLedgerCustomerId(id);
              setActiveNav('Customer Ledgers');
            }}
            onSelectTransaction={(tx) => {
              setCurrentTransaction(tx);
              setIsReceiptOpen(true);
            }}
            onOpenReceiptDesigner={() => setIsReceiptDesignerOpen(true)}
            onOpenResetSystem={() => setIsResetSystemOpen(true)}
            onLogout={handleLogout}
            authRole={isOwner ? 'Software Owner' : 'Mart User'}
            authEmail={authSession?.user?.email}
            shopId={branding.terminalDeviceId || 'WM-001'}
            onLockApp={() => {
              if (isOwner) {
                setIsGenerateMartPasswordOpen(true);
              }
            }}
          />
        )}
      </main>

      {/* ============================================================== */}
      {/* 3. MOBILE BOTTOM NAVIGATION BAR (MATCHING MOBILE REFERENCE)    */}
      {/* ============================================================== */}
      {!isNewSalePage && (
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 h-16 flex items-center justify-around px-2 shadow-lg">
          {/* 1. HOME */}
          <button
            type="button"
            onClick={() => handleNavigate('Home')}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 transition-colors cursor-pointer ${
              activeNav === 'Home' ? 'text-blue-600 font-black' : 'text-slate-400 hover:text-slate-700 font-semibold'
            }`}
            title="Home Dashboard"
          >
            <Home className="w-5 h-5 stroke-[2]" />
            <span className="text-[10px] font-bold uppercase mt-0.5 tracking-wider">Home</span>
          </button>

          {/* 2. SALE */}
          <button
            type="button"
            onClick={() => handleNavigate('New Sale POS')}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 transition-colors cursor-pointer ${
              activeNav === 'New Sale POS' || activeNav === 'Sale POS'
                ? 'text-blue-600 font-black'
                : 'text-slate-400 hover:text-slate-700 font-semibold'
            }`}
            title="Sale POS Workstation"
          >
            <ShoppingCart className="w-5 h-5 stroke-[2]" />
            <span className="text-[10px] font-bold uppercase mt-0.5 tracking-wider">Sale</span>
          </button>

          {/* 3. PURCHASE */}
          <button
            type="button"
            onClick={() => handleNavigate('New Purchase Entry')}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 transition-colors cursor-pointer ${
              activeNav === 'New Purchase Entry' || activeNav === 'Purchase Entry' || activeNav === 'Purchase Returns'
                ? 'text-blue-600 font-black'
                : 'text-slate-400 hover:text-slate-700 font-semibold'
            }`}
            title="Purchase Entry"
          >
            <Truck className="w-5 h-5 stroke-[2]" />
            <span className="text-[10px] font-bold uppercase mt-0.5 tracking-wider">Purchase</span>
          </button>

          {/* 4. REPORTS */}
          <button
            type="button"
            onClick={() => handleNavigate('Sale Summary')}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 transition-colors cursor-pointer ${
              activeNav === 'Sale Summary' || activeNav === 'Reports' || activeNav === 'Daily Hisab'
                ? 'text-blue-600 font-black'
                : 'text-slate-400 hover:text-slate-700 font-semibold'
            }`}
            title="Reports & Analytics"
          >
            <TrendingUp className="w-5 h-5 stroke-[2]" />
            <span className="text-[10px] font-bold uppercase mt-0.5 tracking-wider">Reports</span>
          </button>

          {/* 5. SETTINGS */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 transition-colors cursor-pointer ${
              isSettingsOpen || activeNav === 'Settings' || activeNav === 'Security Settings'
                ? 'text-blue-600 font-black'
                : 'text-slate-400 hover:text-slate-700 font-semibold'
            }`}
            title="Settings & System Database"
          >
            <Settings className="w-5 h-5 stroke-[2]" />
            <span className="text-[10px] font-bold uppercase mt-0.5 tracking-wider">Settings</span>
          </button>
        </nav>
      )}

      {/* ============================================================== */}
      {/* 4. REUSABLE UNIVERSAL BARCODE SCANNER (SCREENSHOT 2 DESIGN)    */}
      {/* ============================================================== */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onBarcodeDetected={handleBarcodeDetected}
        totalItems={totalQty}
        totalAmount={grandTotal}
        onCheckout={() => {
          if (cart.length > 0) {
            setIsCheckoutOpen(true);
          }
        }}
        pageContext={mode === 'purchase' ? 'purchase' : 'pos'}
        lang="bi"
      />

      {/* Add New Product Modal (Screenshot 2 Design) */}
      <AddNewProductModal
        isOpen={isAddProductOpen}
        categories={categories}
        existingProducts={products}
        onClose={() => setIsAddProductOpen(false)}
        onSaveProduct={handleSaveNewProduct}
        onUpdateCategories={setCategories}
      />

      {/* Held Bills Modal */}
      <HeldBillsModal
        isOpen={isHeldBillsOpen}
        heldBills={heldBills}
        onClose={() => setIsHeldBillsOpen(false)}
        onResumeBill={handleResumeHeldBill}
        onDeleteHeldBill={handleDeleteHeldBill}
        onDeleteAllHeldBills={handleDeleteAllHeldBills}
      />

      {/* Cart Drawer */}
      <CartDrawerModal
        isOpen={isCartDrawerOpen}
        mode={mode}
        cart={cart}
        subtotal={subtotal}
        discount={discount}
        grandTotal={grandTotal}
        totalQty={totalQty}
        onClose={() => setIsCartDrawerOpen(false)}
        onUpdateQty={updateCartQty}
        onRemoveItem={removeCartItem}
        onClearCart={handleClearCart}
        onHoldBill={handleHoldBill}
        onProceedCheckout={() => {
          setIsCartDrawerOpen(false);
          setIsCheckoutOpen(true);
        }}
        onUpdateDiscount={setDiscountAmount}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        mode={mode}
        cart={cart}
        subtotal={subtotal}
        discount={discount}
        grandTotal={grandTotal}
        totalQty={totalQty}
        customers={customers}
        onQuickAddCustomer={handleSaveCustomer}
        onClose={() => setIsCheckoutOpen(false)}
        onConfirmCheckout={handleConfirmCheckout}
      />

      {/* Thermal Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        transaction={currentTransaction}
        storeBranding={branding}
        receiptSettings={receiptSettings}
        onSaveReceiptSettings={(updated) => {
          setReceiptSettings(updated);
          showToast('رسید کی ترتیبات کامیابی سے محفوظ ہو گئیں! (Receipt settings saved)', 'success');
        }}
        onClose={() => setIsReceiptOpen(false)}
        onNewSale={() => {
          setIsReceiptOpen(false);
          setCurrentTransaction(null);
        }}
      />

      {/* Sales Transactions History Modal */}
      <TransactionHistoryModal
        isOpen={isHistoryOpen}
        transactions={transactions}
        onClose={() => setIsHistoryOpen(false)}
        onViewReceipt={(tx) => {
          setCurrentTransaction(tx);
          setIsReceiptOpen(true);
        }}
      />

      {/* Settings & Branding Modal */}
      <BrandingSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        branding={branding}
        currentUser={currentUser}
        onSaveBranding={(updated) => {
          setBranding(updated);
          showToast('Store branding & Owner Profile saved successfully! (برانڈنگ اور پروفائل محفوظ ہو گئی ہے)', 'success');
        }}
        onOpenReceiptDesigner={() => {
          setIsSettingsOpen(false);
          setIsReceiptDesignerOpen(true);
        }}
        onOpenResetSystem={() => {
          setIsSettingsOpen(false);
          setIsResetSystemOpen(true);
        }}
      />

      {/* Complete Reset / Fresh Start Modal with JSON backup */}
      <ResetSystemModal
        isOpen={isResetSystemOpen}
        onClose={() => setIsResetSystemOpen(false)}
        onPerformReset={handlePerformCompleteReset}
      />

      {/* Dedicated Receipt Designer & Bill Customizer Modal */}
      <ReceiptDesignerModal
        isOpen={isReceiptDesignerOpen}
        onClose={() => setIsReceiptDesignerOpen(false)}
        settings={receiptSettings}
        onSaveSettings={(updated) => {
          setReceiptSettings(updated);
          showToast('رسید کی نئی ترتیبات اور مالک کی تصویر محفوظ ہو گئی ہے!', 'success');
        }}
        sampleTransaction={currentTransaction || (transactions.length > 0 ? transactions[0] : null)}
      />

      {/* Multi-Device QR Code Authorization Modal (For Owner) */}
      <ConnectDeviceQrModal
        isOpen={isConnectQrOpen}
        onClose={() => setIsConnectQrOpen(false)}
        onDeviceApproved={(dev) => {
          showToast(`Device "${dev.deviceName}" authorized & connected!`, 'success');
        }}
      />

      {/* Pair This Device Modal (With Camera Scanner & Manual Code) */}
      <PairDeviceModal
        isOpen={isPairModalOpen}
        onClose={() => setIsPairModalOpen(false)}
        onPairSuccess={(dev, serverStore) => {
          setIsPairModalOpen(false);
          setCurrentDevice(dev);
          if (serverStore) {
            if (serverStore.products && serverStore.products.length > 0) setProducts(serverStore.products);
            if (serverStore.transactions && serverStore.transactions.length > 0) setTransactions(serverStore.transactions);
            if (serverStore.purchases && serverStore.purchases.length > 0) setPurchases(serverStore.purchases);
            if (serverStore.customers && serverStore.customers.length > 0) setCustomers(serverStore.customers);
            if (serverStore.customerLedgers && serverStore.customerLedgers.length > 0) setCustomerLedgerEntries(serverStore.customerLedgers);
          }
          showToast(`Successfully paired this terminal to WAQAS MART!`, 'success');
        }}
      />



      {/* PWA Install Desktop & Mobile Prompt */}
      <PwaInstallPrompt
        isOpen={isPwaInstallOpen}
        onClose={() => setIsPwaInstallOpen(false)}
        deferredPrompt={deferredPrompt}
      />

      {/* Revoked Terminal Security Lockout Screen */}
      {isRevoked && (
        <RevokedDeviceModal
          device={currentDevice}
          onOpenPairQr={() => {
            setIsRevoked(false);
            setIsPairModalOpen(true);
          }}
        />
      )}

      {/* Generate Mart Password Modal (Owner Only) */}
      {isOwner && (
        <GenerateMartPasswordModal
          isOpen={isGenerateMartPasswordOpen}
          onClose={() => setIsGenerateMartPasswordOpen(false)}
          onPasswordGenerated={() => {
            showToast('New Mart Password generated and activated!', 'success');
          }}
        />
      )}
    </div>
  );
}

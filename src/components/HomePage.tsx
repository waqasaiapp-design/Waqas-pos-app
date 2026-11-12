import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingCart,
  ShoppingBag,
  FileText,
  Package,
  Layers,
  Users,
  Truck,
  FileSpreadsheet,
  Wallet,
  CreditCard,
  RotateCcw,
  TrendingUp,
  Settings,
  ScanBarcode,
  Search,
  PlusCircle,
  Clock,
  History,
  X,
  Shield,
  Lock,
  KeyRound,
  Smartphone,
  Monitor,
  User,
  Video,
  QrCode,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  Crown,
  Phone,
  MessageCircle,
  Printer,
  Sparkles,
  Zap,
  Store,
  Database,
  Sliders,
  DollarSign,
  ChevronDown,
  Menu,
  LogOut,
  Maximize2,
  Minimize2,
  UserCheck,
  Camera,
  AlertTriangle,
  Undo,
  ExternalLink,
  Check,
} from 'lucide-react';
import {
  Product,
  SaleTransaction,
  PurchaseTransaction,
  Customer,
  CustomerLedgerEntry,
  Supplier,
  SaleReturn,
  UserProfile,
  DeviceInfo,
  StoreBranding,
  MartOwnerProfile,
  SoftwareOwnerProfile,
  LOCKED_SOFTWARE_OWNER,
  DEFAULT_MART_OWNER,
} from '../types/pos';
import { safeFetchJson } from '../utils/apiClient';
import { formatRs } from '../data/defaultProducts';

export interface HomePageProps {
  products: Product[];
  transactions: SaleTransaction[];
  purchases: PurchaseTransaction[];
  customers: Customer[];
  customerLedgerEntries: CustomerLedgerEntry[];
  suppliers: Supplier[];
  saleReturns: SaleReturn[];
  currentUser: UserProfile;
  currentDevice: DeviceInfo;
  branding: StoreBranding;
  onUpdateBranding: (branding: StoreBranding) => void;
  onUpdateUser: (user: UserProfile) => void;
  onNavigate: (page: string, options?: any) => void;
  onOpenScanner: () => void;
  onOpenAddProduct: () => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onSelectCustomer?: (customerId: string) => void;
  onSelectTransaction?: (tx: SaleTransaction) => void;
  onLockApp: () => void;
  onOpenConnectNewQr?: () => void;
  onOpenPairThisDevice?: () => void;
  onOpenReceiptDesigner?: () => void;
  onOpenResetSystem?: () => void;
  onLogout?: () => void;
  authRole?: string;
  authEmail?: string;
  shopId?: string;
}

export const HomePage: React.FC<HomePageProps> = ({
  products,
  transactions,
  purchases,
  customers,
  customerLedgerEntries,
  suppliers,
  saleReturns,
  currentUser,
  currentDevice,
  branding,
  onUpdateBranding,
  onUpdateUser,
  onNavigate,
  onOpenScanner,
  onOpenAddProduct,
  onOpenSettings,
  onOpenHistory,
  onSelectCustomer,
  onSelectTransaction,
  onLockApp,
  onOpenConnectNewQr,
  onOpenPairThisDevice,
  onOpenReceiptDesigner,
  onOpenResetSystem,
  onLogout,
  authRole = 'Software Owner',
  authEmail,
  shopId = 'WM-001',
}) => {
  // Mobile sidebar state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [activeSubmenuTab, setActiveSubmenuTab] = useState<string>('A');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
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

  // Software Owner is PERMANENTLY FIXED and READ-ONLY
  const softwareOwner: SoftwareOwnerProfile = LOCKED_SOFTWARE_OWNER;

  // Mart Owner is editable via Settings and persisted in database & localStorage
  const [martOwner, setMartOwner] = useState<MartOwnerProfile>(() => {
    try {
      const saved = localStorage.getItem('waqas_mart_owner_profile_v2');
      if (saved) return { ...DEFAULT_MART_OWNER, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_MART_OWNER;
  });

  // Listen for Mart Owner profile updates from Settings
  useEffect(() => {
    const handleOwnerUpdate = () => {
      try {
        const saved = localStorage.getItem('waqas_mart_owner_profile_v2');
        if (saved) {
          setMartOwner({ ...DEFAULT_MART_OWNER, ...JSON.parse(saved) });
        }
      } catch {}
    };

    // Also fetch initial from backend if available
    safeFetchJson('/api/settings/mart-owner')
      .then((res) => {
        const data = res.data;
        if (data && data.success && data.martOwner) {
          setMartOwner((prev) => ({ ...prev, ...data.martOwner }));
        }
      })
      .catch(() => {});

    window.addEventListener('storage', handleOwnerUpdate);
    window.addEventListener('waqas_mart_owner_updated', handleOwnerUpdate);
    window.addEventListener('waqas_owner_profile_updated', handleOwnerUpdate);
    return () => {
      window.removeEventListener('storage', handleOwnerUpdate);
      window.removeEventListener('waqas_mart_owner_updated', handleOwnerUpdate);
      window.removeEventListener('waqas_owner_profile_updated', handleOwnerUpdate);
    };
  }, []);

  // Live real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Software Owner image fallback handling
  const [softwarePhotoSrc, setSoftwarePhotoSrc] = useState(
    '/5c454cea45cc8c39a24b57a83fbbc5cf_0.webp'
  );

  const handleSoftwareImgError = () => {
    setSoftwarePhotoSrc('/assets/aistudio/5c454cea45cc8c39a24b57a83fbbc5cf_0_3a4b9c5f.webp');
  };

  // Mart Owner image fallback handling
  const [martPhotoSrc, setMartPhotoSrc] = useState(
    martOwner.photoUrl || '/assets/aistudio/female_owner_portrait.svg'
  );

  useEffect(() => {
    if (martOwner.photoUrl) {
      setMartPhotoSrc(martOwner.photoUrl);
    }
  }, [martOwner.photoUrl]);

  const handleMartImgError = () => {
    setMartPhotoSrc('/assets/aistudio/female_owner_portrait.svg');
  };

  // Download System JSON Backup
  const handleDownloadBackup = () => {
    try {
      const backupData = {
        softwareName: 'WAQAS POS SOFTWARE',
        softwareOwner: 'Muhammad Waqas (03228570782)',
        martName: branding.storeName || 'WAQAS MART',
        exportDate: new Date().toISOString(),
        products,
        transactions,
        purchases,
        customers,
        customerLedgerEntries,
        suppliers,
        saleReturns,
        branding,
        martOwner,
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `WAQAS_MART_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (e) {
      console.error(e);
    }
  };

  // -----------------------------------------------------------------
  // 20 CENTRAL QUICK-ACTION CARDS (Exact match to reference picture)
  // -----------------------------------------------------------------
  const quickActionCards = [
    {
      id: 'new_sale',
      title: 'New Sale',
      icon: ShoppingCart,
      onClick: () => onNavigate('New Sale POS'),
      highlight: true,
    },
    {
      id: 'old_sale',
      title: 'Old Sale',
      icon: Clock,
      onClick: () => onNavigate('Sale POS'),
    },
    {
      id: 'new_purchase',
      title: 'New Purchase',
      icon: Truck,
      onClick: () => onNavigate('New Purchase Entry'),
    },
    {
      id: 'old_purchase',
      title: 'Old Purchase',
      icon: FileText,
      onClick: () => onNavigate('Purchase Entry'),
    },
    {
      id: 'stock',
      title: 'Stock',
      icon: Layers,
      onClick: () => onNavigate('Total Stock'),
    },
    {
      id: 'products',
      title: 'Products',
      icon: Package,
      onClick: () => onNavigate('Total Stock'),
    },
    {
      id: 'customers_udhaar',
      title: 'Customers Udhaar',
      icon: Users,
      onClick: () => onNavigate('Customer Ledgers'),
    },
    {
      id: 'suppliers',
      title: 'Suppliers',
      icon: Truck,
      onClick: () => onNavigate('Supplier Ledgers'),
    },
    {
      id: 'customer_ledgers',
      title: 'Customer Ledgers',
      icon: FileSpreadsheet,
      onClick: () => onNavigate('Customer Ledgers'),
    },
    {
      id: 'supplier_ledgers',
      title: 'Supplier Ledgers',
      icon: CreditCard,
      onClick: () => onNavigate('Supplier Ledgers'),
    },
    {
      id: 'daily_hisab',
      title: 'Daily Hisab',
      icon: FileSpreadsheet,
      onClick: () => onNavigate('Daily Hisab'),
    },
    {
      id: 'expenses',
      title: 'Expenses',
      icon: Wallet,
      onClick: () => onNavigate('Expenses'),
    },
    {
      id: 'purchase_returns',
      title: 'Purchase Returns',
      icon: RotateCcw,
      onClick: () => onNavigate('Purchase Returns'),
    },
    {
      id: 'reports',
      title: 'Reports',
      icon: TrendingUp,
      onClick: () => onNavigate('Sale Summary'),
    },
    {
      id: 'pos_terminal',
      title: 'POS Terminal',
      icon: Monitor,
      onClick: () => onNavigate('New Sale POS'),
    },
    {
      id: 'cctv',
      title: 'CCTV',
      icon: Camera,
      onClick: () => onNavigate('CCTV'),
    },
    {
      id: 'staff_management',
      title: 'Staff Management',
      icon: UserCheck,
      onClick: () => onNavigate('All Staff'),
    },
    {
      id: 'connect_new_device',
      title: 'Connect New Device',
      icon: QrCode,
      onClick: () => (onOpenConnectNewQr ? onOpenConnectNewQr() : onNavigate('Device Management')),
    },
    {
      id: 'pin_lock',
      title: 'PIN Lock',
      icon: Lock,
      onClick: onLockApp,
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: Settings,
      onClick: onOpenSettings,
    },
  ];

  // -----------------------------------------------------------------
  // LEFT SIDEBAR NAVIGATION ITEMS (Exact match to reference picture)
  // -----------------------------------------------------------------
  const sidebarNavItems = [
    { id: 'Home', label: 'Home', icon: Store, active: true },
    { id: 'New Sale', label: 'New Sale', icon: ShoppingCart, onClick: () => onNavigate('New Sale POS') },
    { id: 'Old Sale', label: 'Old Sale', icon: FileText, onClick: () => onNavigate('Sale POS') },
    { id: 'New Purchase', label: 'New Purchase', icon: Truck, onClick: () => onNavigate('New Purchase Entry') },
    { id: 'Old Purchase', label: 'Old Purchase', icon: FileText, onClick: () => onNavigate('Purchase Entry') },
    { id: 'Stock', label: 'Stock', icon: Layers, onClick: () => onNavigate('Total Stock') },
    { id: 'Products', label: 'Products', icon: Package, onClick: () => onNavigate('Total Stock') },
    { id: 'Customers / Udhaar', label: 'Customers / Udhaar', icon: Users, onClick: () => onNavigate('Customer Ledgers') },
    { id: 'Suppliers', label: 'Suppliers', icon: Truck, onClick: () => onNavigate('Supplier Ledgers') },
    { id: 'Customer Ledgers', label: 'Customer Ledgers', icon: FileSpreadsheet, onClick: () => onNavigate('Customer Ledgers') },
    { id: 'Supplier Ledgers', label: 'Supplier Ledgers', icon: CreditCard, onClick: () => onNavigate('Supplier Ledgers') },
    { id: 'Daily Hisab', label: 'Daily Hisab', icon: FileSpreadsheet, onClick: () => onNavigate('Daily Hisab') },
    { id: 'Expenses', label: 'Expenses', icon: Wallet, onClick: () => onNavigate('Expenses') },
    { id: 'Purchase Returns', label: 'Purchase Returns', icon: RotateCcw, onClick: () => onNavigate('Purchase Returns') },
    { id: 'Reports', label: 'Reports', icon: TrendingUp, onClick: () => onNavigate('Sale Summary') },
    { id: 'POS Terminal', label: 'POS Terminal', icon: Monitor, onClick: () => onNavigate('New Sale POS') },
    { id: 'CCTV', label: 'CCTV', icon: Camera, onClick: () => onNavigate('CCTV') },
    { id: 'Staff Management', label: 'Staff Management', icon: UserCheck, onClick: () => onNavigate('All Staff') },
    { id: 'Connect New Device', label: 'Connect New Device', icon: Smartphone, onClick: () => (onOpenConnectNewQr ? onOpenConnectNewQr() : onNavigate('Device Management')) },
    { id: 'Mart Password', label: 'Generate Mart Password', icon: KeyRound, onClick: onLockApp },
    { id: 'Settings', label: 'Settings', icon: Settings, onClick: onOpenSettings },
    { id: 'Owner Profiles', label: 'Owner Profiles', icon: Crown, onClick: onOpenSettings },
    { id: 'Backup & Restore', label: 'Backup & Restore', icon: Database, onClick: handleDownloadBackup },
  ];

  // -----------------------------------------------------------------
  // COMPLETE SUBMENU NAVIGATION MODULES (SECTIONS A THROUGH J)
  // -----------------------------------------------------------------
  const submenuSections = [
    {
      id: 'A',
      title: 'A. Sales Management',
      items: [
        { label: 'New Sale (Spreadsheet)', onClick: () => onNavigate('New Sale POS') },
        { label: 'Old Sale (Classic POS)', onClick: () => onNavigate('Sale POS') },
        { label: 'Sales History', onClick: onOpenHistory },
        { label: 'Search Invoice', onClick: onOpenHistory },
        { label: 'Parked / Held Bills', onClick: () => onNavigate('New Sale POS') },
      ],
    },
    {
      id: 'B',
      title: 'B. Purchase Management',
      items: [
        { label: 'New Purchase Entry', onClick: () => onNavigate('New Purchase Entry') },
        { label: 'Old Purchase Form', onClick: () => onNavigate('Purchase Entry') },
        { label: 'Purchase Invoices History', onClick: () => onNavigate('New Purchase Entry') },
        { label: 'Purchase Returns', onClick: () => onNavigate('Purchase Returns') },
      ],
    },
    {
      id: 'C',
      title: 'C. Inventory Management',
      items: [
        { label: 'Stock Catalog', onClick: () => onNavigate('Total Stock') },
        { label: 'Add New Product', onClick: onOpenAddProduct },
        { label: 'Product Categories', onClick: () => onNavigate('Total Stock') },
        { label: 'Barcode Scanner', onClick: onOpenScanner },
        { label: 'Stock Adjustments', onClick: () => onNavigate('Total Stock') },
        { label: 'Low Stock Alerts', onClick: () => onNavigate('Total Stock') },
      ],
    },
    {
      id: 'D',
      title: 'D. Customer Management',
      items: [
        { label: 'All Customers', onClick: () => onNavigate('Customer Ledgers') },
        { label: 'Add Customer', onClick: () => onNavigate('Customer Ledgers') },
        { label: 'Customer Udhaar Khata', onClick: () => onNavigate('Customer Ledgers') },
        { label: 'Customer Ledgers', onClick: () => onNavigate('Customer Ledgers') },
        { label: 'Cash Recovery Records', onClick: () => onNavigate('Customer Ledgers') },
      ],
    },
    {
      id: 'E',
      title: 'E. Supplier Management',
      items: [
        { label: 'Suppliers List', onClick: () => onNavigate('Supplier Ledgers') },
        { label: 'Add Supplier', onClick: () => onNavigate('Supplier Ledgers') },
        { label: 'Supplier Ledger Accounts', onClick: () => onNavigate('Supplier Ledgers') },
        { label: 'Vendor Dues & Balances', onClick: () => onNavigate('Supplier Ledgers') },
      ],
    },
    {
      id: 'F',
      title: 'F. Accounts & Daily Hisab',
      items: [
        { label: 'Daily Hisab Register', onClick: () => onNavigate('Daily Hisab') },
        { label: 'Opening Cash Balance', onClick: () => onNavigate('Daily Hisab') },
        { label: 'Daily Sales & Receipts', onClick: () => onNavigate('Daily Hisab') },
        { label: 'Daily Purchases', onClick: () => onNavigate('Daily Hisab') },
        { label: 'Kitchen & Daily Expenses', onClick: () => onNavigate('Daily Hisab') },
        { label: 'Closing Cash Reconciliation', onClick: () => onNavigate('Daily Hisab') },
      ],
    },
    {
      id: 'G',
      title: 'G. Expense Management',
      items: [
        { label: 'All Mart Expenses', onClick: () => onNavigate('Expenses') },
        { label: 'Add New Expense', onClick: () => onNavigate('Expenses') },
        { label: 'Utility & Rent Categories', onClick: () => onNavigate('Expenses') },
        { label: 'Expense History Vouchers', onClick: () => onNavigate('Expenses') },
      ],
    },
    {
      id: 'H',
      title: 'H. Reports & Analytics',
      items: [
        { label: 'Sales Financial Reports', onClick: () => onNavigate('Sale Summary') },
        { label: 'Gross Margin & Profit Analysis', onClick: () => onNavigate('Sale Summary') },
        { label: 'Stock Valuation Reports', onClick: () => onNavigate('Total Stock') },
        { label: 'Customer Khata Udhar Reports', onClick: () => onNavigate('Customer Ledgers') },
      ],
    },
    {
      id: 'I',
      title: 'I. Business & Device Management',
      items: [
        { label: 'Staff & Cashier Shifts', onClick: () => onNavigate('All Staff') },
        { label: 'POS Terminal Workstation', onClick: () => onNavigate('New Sale POS') },
        { label: 'CCTV IP & DVR Streams', onClick: () => onNavigate('CCTV') },
        { label: 'Connect New Device (QR)', onClick: () => (onOpenConnectNewQr ? onOpenConnectNewQr() : onNavigate('Device Management')) },
        { label: 'Generate Mart Password', onClick: onLockApp },
      ],
    },
    {
      id: 'J',
      title: 'J. Settings & System',
      items: [
        { label: 'Store Branding & Details', onClick: onOpenSettings },
        { label: 'Software Owner Info (Locked)', onClick: onOpenSettings },
        { label: 'Mart Owner Profile (Editable)', onClick: onOpenSettings },
        { label: 'Receipt Designer (80mm/58mm)', onClick: () => (onOpenReceiptDesigner ? onOpenReceiptDesigner() : onOpenSettings()) },
        { label: 'Backup System JSON', onClick: handleDownloadBackup },
        { label: 'Secure Logout', onClick: onLogout || (() => onNavigate('Login')) },
      ],
    },
  ];

  return (
    <div className="flex-1 min-h-full bg-[#022c16] text-white flex flex-col font-sans">
      {/* ============================================================== */}
      {/* 1. TOP HEADER BAR (Exact match to reference picture)           */}
      {/* ============================================================== */}
      <header className="shrink-0 bg-[#022412]/95 backdrop-blur-md border-b border-amber-500/30 px-3 sm:px-6 py-2.5 flex items-center justify-between shadow-xl">
        {/* Left: Gold Crown Logo + WAQAS POS SOFTWARE */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-amber-400 hover:text-white rounded-xl bg-emerald-950/80 border border-emerald-800"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Golden Crown + Cart emblem */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-950/50 shrink-0">
            <Crown className="w-6 h-6 stroke-[2.4]" />
          </div>

          <div>
            <h1 className="font-black text-sm sm:text-lg text-white tracking-tight leading-tight uppercase flex items-center gap-1.5">
              <span>WAQAS POS SOFTWARE</span>
            </h1>
            <p className="text-[11px] sm:text-xs text-amber-400 font-semibold italic tracking-wide">
              Better Shop Better Business
            </p>
          </div>
        </div>

        {/* Center: Mart Identity & Shop ID Badge */}
        <div className="hidden md:flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-[#03361b] border border-amber-500/30 shadow-inner">
          <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Store className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="font-extrabold text-xs text-white block uppercase tracking-wider">
              {branding.storeName || 'WAQAS MART'}
            </span>
            <span className="text-[10px] text-amber-300 font-mono font-bold block">
              Shop ID: {shopId}
            </span>
          </div>
        </div>

        {/* Right: Fullscreen Button + Software Owner / User Profile Pill & Dropdown */}
        <div className="flex items-center gap-2">
          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-2xl bg-[#03361b] hover:bg-[#044c26] text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter 100% Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4 text-emerald-400" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Normal' : 'Fullscreen'}</span>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-2xl bg-[#03361b] hover:bg-[#044c26] border border-amber-500/40 text-left transition-all cursor-pointer shadow-md"
            >
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-amber-400 shrink-0 bg-slate-900 shadow-xs">
              <img
                src={softwarePhotoSrc}
                alt="Muhammad Waqas"
                className="w-full h-full object-cover object-[center_15%]"
                onError={handleSoftwareImgError}
              />
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-black text-white leading-tight">
                {currentUser?.displayName || 'Muhammad Waqas'}
              </div>
              <div className="text-[10px] text-amber-400 font-bold leading-tight">
                {authRole}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-amber-400 shrink-0" />
          </button>

          {/* User Profile Dropdown Menu */}
          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl p-2 z-50 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-100">
              <div className="p-3 border-b border-slate-800 text-slate-300">
                <p className="font-bold text-white text-sm truncate">
                  {currentUser?.displayName || 'Muhammad Waqas'}
                </p>
                <p className="text-[11px] text-amber-400 truncate">{currentUser?.email || authEmail || 'waqaspos.admin@gmail.com'}</p>
                <span className="mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  {authRole}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setProfileDropdownOpen(false);
                  onOpenSettings();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800 font-semibold cursor-pointer"
              >
                <User className="w-4 h-4 text-emerald-400" />
                <span>Mart Owner Profile</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProfileDropdownOpen(false);
                  onOpenSettings();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800 font-semibold cursor-pointer"
              >
                <Settings className="w-4 h-4 text-blue-400" />
                <span>Store Branding Settings</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProfileDropdownOpen(false);
                  onNavigate('New Sale POS');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800 font-semibold cursor-pointer"
              >
                <Monitor className="w-4 h-4 text-amber-400" />
                <span>Launch POS Terminal</span>
              </button>

              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/60 font-bold border-t border-slate-800 mt-1 pt-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Secure Logout</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>

      {/* ============================================================== */}
      {/* 2. MAIN LAYOUT: SIDEBAR + CENTRAL CONTENT                      */}
      {/* ============================================================== */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        {/* Mobile Backdrop for Sidebar Drawer */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-xs z-35 lg:hidden"
          />
        )}

        {/* ------------------------------------------------------------ */}
        {/* LEFT SIDEBAR (Desktop Fixed, Mobile Slide Drawer)            */}
        {/* ------------------------------------------------------------ */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#022412] border-r border-amber-500/20 flex flex-col justify-between transition-transform duration-200 shrink-0 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Top of Sidebar on Mobile (close button) */}
          <div className="p-3.5 border-b border-emerald-900/60 lg:hidden flex items-center justify-between">
            <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
              Navigation Menu
            </span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-emerald-950"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items List */}
          <nav className="flex-1 overflow-y-auto p-2.5 space-y-1 text-xs">
            {sidebarNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.active;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (item.onClick) item.onClick();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 font-black shadow-lg shadow-amber-950/40 ring-1 ring-amber-300'
                      : 'text-emerald-100/90 hover:text-white hover:bg-[#03361b]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-emerald-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer Copyright */}
          <div className="p-3 border-t border-emerald-900/60 text-[10px] text-emerald-300/80 text-center bg-[#011a0c]">
            WAQAS POS SOFTWARE • v6.0
          </div>
        </aside>

        {/* ------------------------------------------------------------ */}
        {/* CENTRAL MAIN CONTENT AREA                                    */}
        {/* ------------------------------------------------------------ */}
        <main className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 lg:p-6 space-y-5 lg:space-y-6">
          {/* ========================================================== */}
          {/* HERO BANNER SECTION (Exact 3-Card Proportional Layout)     */}
          {/* Left: Software Owner | Center: Mart Banner | Right: Mart Owner */}
          {/* ========================================================== */}
          <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#023319] via-[#044c26] to-[#022813] border-2 border-amber-500/40 p-4 sm:p-5 lg:p-6 shadow-2xl">
            {/* Ambient Lighting & Curved Golden Ribbon Waves */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-5 sm:gap-6">
              {/* ------------------------------------------------------ */}
              {/* 1. LEFT: PERMANENT SOFTWARE OWNER CARD                 */}
              {/* (Completely replaces Shopping Trolley image)            */}
              {/* ------------------------------------------------------ */}
              <div className="shrink-0 w-full sm:w-64 lg:w-72 flex flex-col items-center">
                <div className="w-full bg-[#022412]/95 border-2 border-amber-400 rounded-2xl p-3 sm:p-3.5 shadow-2xl ring-4 ring-amber-500/20 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-400 via-amber-500 to-yellow-500 text-slate-950 font-black text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-bl-lg shadow-xs">
                    Software Owner
                  </div>

                  <div className="w-24 h-28 sm:w-28 sm:h-32 mx-auto rounded-xl overflow-hidden border-2 border-amber-400 shadow-xl bg-slate-900 mt-1">
                    <img
                      src="/waqas_owner_real.png"
                      alt="Muhammad Waqas - Software Owner"
                      className="w-full h-full object-cover object-[center_12%]"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/aistudio/waqas_owner_real.png';
                      }}
                    />
                  </div>

                  <div className="mt-2 space-y-1">
                    <span className="text-[10px] text-amber-300 font-extrabold tracking-wider uppercase block">
                      WAQAS POS SOFTWARE
                    </span>
                    <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                      Muhammad Waqas
                    </h3>

                    <div className="pt-1 space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 font-mono font-bold text-[10px]">
                        <span>WhatsApp:</span>
                        <span className="text-white">03228570782</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 font-mono font-bold text-[10px]">
                        <span>Mobile:</span>
                        <span className="text-white">03429634133</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------ */}
              {/* 2. CENTER: EDITABLE MAIN MART BANNER                   */}
              {/* Customizable only via authorized Settings               */}
              {/* ------------------------------------------------------ */}
              <div className="flex-1 text-center space-y-2 max-w-xl py-1">
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-b from-amber-300 via-amber-400 to-yellow-600 text-slate-950 shadow-xl shadow-amber-950/60 mb-0.5">
                  <Crown className="w-6 h-6 stroke-[2.4]" />
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-300 to-yellow-500 tracking-tight drop-shadow-[0_4px_8px_rgba(0,0,0,0.7)] uppercase font-sans">
                  {branding.storeName || 'WAQAS MART'}
                </h2>

                <p className="text-sm sm:text-base text-amber-300 font-semibold italic tracking-wide">
                  {branding.subtitle || 'Better Shop Better Business'}
                </p>

                {/* Golden Ribbon Banner */}
                <div className="pt-1.5">
                  <div className="inline-block px-4 sm:px-7 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-xl shadow-amber-950/40 border border-yellow-200">
                    {branding.bottomBannerTitle || 'Grow Your Business with Waqas POS Software'}
                  </div>
                </div>

                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="inline-flex items-center gap-1 text-[10px] text-amber-300/80 hover:text-amber-200 hover:underline cursor-pointer"
                  >
                    <span>✏️ Edit Mart Banner & Logo in Settings</span>
                  </button>
                </div>
              </div>

              {/* ------------------------------------------------------ */}
              {/* 3. RIGHT: MART OWNER CARD (SEPARATE & EDITABLE)         */}
              {/* ------------------------------------------------------ */}
              <div className="shrink-0 w-full sm:w-64 lg:w-72 flex flex-col items-center">
                <div
                  onClick={onOpenSettings}
                  className="w-full bg-[#022412]/95 border-2 border-amber-400/80 rounded-2xl p-3 sm:p-3.5 shadow-2xl ring-4 ring-amber-500/10 text-center relative overflow-hidden group cursor-pointer transition-all hover:border-amber-300"
                  title="Click to manage Mart Owner Profile in Settings"
                >
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-500 to-teal-600 text-white font-black text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-bl-lg shadow-xs">
                    Mart Owner
                  </div>

                  <div className="w-24 h-28 sm:w-28 sm:h-32 mx-auto rounded-xl overflow-hidden border-2 border-amber-400/80 shadow-xl bg-slate-900 mt-1 transition-transform duration-300 group-hover:scale-105">
                    <img
                      src={martPhotoSrc}
                      alt="Mart Owner"
                      className="w-full h-full object-cover object-[center_15%]"
                      onError={handleMartImgError}
                    />
                  </div>

                  <div className="mt-2 space-y-1">
                    <span className="text-[10px] text-emerald-300 font-extrabold tracking-wider uppercase block">
                      MART OWNER
                    </span>
                    <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                      {martOwner.ownerName || 'Fatima Bibi'}
                    </h3>
                    <p className="text-xs text-amber-300/90 font-medium">
                      {martOwner.designation || 'Proprietor & Manager'}
                    </p>
                    <div className="pt-1 text-[10px] text-slate-300">
                      <span>Mob: {martOwner.mobileNumber || '03001234567'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================== */}
          {/* CENTRAL 20 QUICK-ACTION NAVIGATION CARDS + RIGHT PROMO     */}
          {/* ========================================================== */}
          <section className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            {/* Left 9-10 Columns: Clean 20 White Rounded Cards */}
            <div className="xl:col-span-10 bg-white rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-200">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-3.5">
                {quickActionCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={card.onClick}
                      className="bg-white hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-500 rounded-2xl p-3 sm:p-4 text-center flex flex-col items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer group min-h-[105px]"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
                        <Icon className="w-5 h-5 stroke-[2.2]" />
                      </div>
                      <span className="text-xs sm:text-[13px] font-bold text-slate-800 leading-tight">
                        {card.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right 2 Columns: Golden Smart POS Solution Banner */}
            <div className="xl:col-span-2 bg-gradient-to-b from-[#023319] via-[#034424] to-[#022412] rounded-3xl p-5 border-2 border-amber-500/40 shadow-2xl flex flex-col items-center justify-between text-center relative overflow-hidden">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-400/40">
                  <Crown className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-amber-300 leading-tight">
                  Smart POS Solution for Your Business
                </h3>
              </div>

              {/* 4 Feature Bullet Points with Gold Checkmarks */}
              <div className="w-full space-y-2.5 text-left py-4 border-y border-amber-500/20 text-xs">
                <div className="flex items-center gap-2 text-emerald-100 font-semibold">
                  <Check className="w-4 h-4 text-amber-400 shrink-0 stroke-[3]" />
                  <span>Fast & Secure POS</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-100 font-semibold">
                  <Check className="w-4 h-4 text-amber-400 shrink-0 stroke-[3]" />
                  <span>Easy to Use</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-100 font-semibold">
                  <Check className="w-4 h-4 text-amber-400 shrink-0 stroke-[3]" />
                  <span>Powerful Reports</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-100 font-semibold">
                  <Check className="w-4 h-4 text-amber-400 shrink-0 stroke-[3]" />
                  <span>Multi-Store Support</span>
                </div>
              </div>

              <div className="w-full pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('New Sale POS')}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs transition-all shadow-md cursor-pointer"
                >
                  Start Billing
                </button>
              </div>
            </div>
          </section>

          {/* ========================================================== */}
          {/* COMPREHENSIVE 1-CLICK SUBMENU DIRECTORY (MODULES A TO J)   */}
          {/* Every existing application page and module reachable       */}
          {/* ========================================================== */}
          <section className="bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 text-slate-900 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-700" />
                  <span>Complete Application Directory (One-Click Access)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Select any category to instantly open its specialized page, report, ledger or utility.
                </p>
              </div>

              {/* Submenu category selector tabs */}
              <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1">
                {submenuSections.map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setActiveSubmenuTab(sec.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                      activeSubmenuTab === sec.id
                        ? 'bg-[#00a859] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {sec.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Submenu Links Grid */}
            {submenuSections
              .filter((sec) => sec.id === activeSubmenuTab)
              .map((sec) => (
                <div key={sec.id} className="space-y-2 animate-in fade-in duration-150">
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    {sec.title}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                    {sec.items.map((subItem, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={subItem.onClick}
                        className="p-3 bg-slate-50 hover:bg-emerald-50 rounded-xl border border-slate-200 hover:border-emerald-400 text-left transition-all active:scale-95 cursor-pointer group flex items-center justify-between"
                      >
                        <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-800">
                          {subItem.label}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
          </section>

          {/* ========================================================== */}
          {/* BOTTOM DUAL OWNER PROFILES CARD (Exact match to reference) */}
          {/* Software Owner Locked (Left) & Mart Owner Editable (Right) */}
          {/* ========================================================== */}
          <section className="bg-gradient-to-r from-[#032e18] via-[#043b20] to-[#022c16] rounded-3xl p-4 sm:p-6 border-2 border-amber-400/80 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 divide-y md:divide-y-0 md:divide-x divide-amber-500/20">
              {/* LEFT CARD: SOFTWARE OWNER (PERMANENTLY FIXED) */}
              <div className="flex items-center gap-4 pr-0 md:pr-4">
                {/* Software Owner Photo with Golden Ring */}
                <div className="relative shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-amber-400 shadow-xl ring-4 ring-amber-500/20 bg-slate-900">
                  <img
                    src={softwarePhotoSrc}
                    alt="Muhammad Waqas - Software Owner"
                    className="w-full h-full object-cover object-[center_15%]"
                    onError={handleSoftwareImgError}
                  />
                  <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-0.5 rounded-full shadow-xs" title="Verified Software Owner">
                    <Crown className="w-3 h-3" />
                  </div>
                </div>

                {/* Software Owner Credentials (Locked) */}
                <div className="flex-1 min-w-0 space-y-1">
                  <span className="text-[10px] text-amber-400 uppercase font-black tracking-widest block">
                    Software Owner
                  </span>
                  <h4 className="text-base sm:text-lg font-black text-white leading-tight">
                    {softwareOwner.ownerName || 'Muhammad Waqas'}
                  </h4>

                  <div className="space-y-0.5 text-xs">
                    <a
                      href="https://wa.me/923228570782"
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5 transition-colors"
                      title="Direct WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>03228570782</span>
                    </a>
                    <a
                      href="tel:03429634133"
                      className="text-slate-300 hover:text-white font-bold flex items-center gap-1.5 transition-colors"
                      title="Call Support Mobile"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>03429634133</span>
                    </a>
                  </div>

                  <div className="pt-1.5">
                    <span className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-[11px] uppercase tracking-wide shadow-md">
                      WAQAS POS SOFTWARE
                    </span>
                  </div>
                </div>
              </div>

              {/* RIGHT CARD: MART OWNER (Visual Location #2 - Editable) */}
              <div className="flex items-center gap-4 pt-4 md:pt-0 pl-0 md:pl-4">
                {/* Mart Owner Photo with Golden Ring */}
                <div className="relative shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-amber-400 shadow-xl ring-4 ring-amber-500/20 bg-slate-900">
                  <img
                    src={martPhotoSrc}
                    alt="Fatima Bibi - Mart Owner"
                    className="w-full h-full object-cover object-[center_15%]"
                    onError={handleMartImgError}
                  />
                  <div className="absolute bottom-0 right-0 bg-emerald-600 text-white p-0.5 rounded-full shadow-xs" title="Mart Owner">
                    <Store className="w-3 h-3" />
                  </div>
                </div>

                {/* Mart Owner Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <span className="text-[10px] text-amber-400 uppercase font-black tracking-widest block">
                    Mart Owner
                  </span>
                  <h4 className="text-base sm:text-lg font-black text-white leading-tight">
                    {martOwner.ownerName || 'Fatima Bibi'}
                  </h4>
                  <p className="text-xs text-emerald-300 font-bold">
                    {martOwner.designation || 'Proprietor & Manager'}
                  </p>
                  <p className="text-[11px] text-slate-300">
                    Mobile: {martOwner.mobileNumber || '03228570782'}
                  </p>

                  <div className="pt-1.5">
                    <button
                      type="button"
                      onClick={onOpenSettings}
                      className="px-4 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 active:scale-95 text-slate-950 font-black text-[11px] uppercase tracking-wide shadow-md cursor-pointer transition-all"
                      title="Click to update Mart Owner details"
                    >
                      {branding.storeName || 'WAQAS MART'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* ============================================================== */}
      {/* FOOTER BAR (Exact match to reference picture)                  */}
      {/* ============================================================== */}
      <footer className="bg-[#011a0c] text-emerald-200/90 border-t border-amber-500/30 px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-amber-400 font-black">★</span>
          <span>© 2026 WAQAS POS SOFTWARE. All Rights Reserved.</span>
        </div>

        <div className="text-amber-400 italic font-semibold tracking-wider">
          —— Better Shop Better Business ——
        </div>
      </footer>
    </div>
  );
};

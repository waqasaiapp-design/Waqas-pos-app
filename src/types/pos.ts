export interface Product {
  id: string;
  barcode: string;
  sku?: string;
  name: string;
  urduName?: string;
  category: string;
  price: number; // Retail Price in Rs.
  costPrice: number; // Last Purchase Cost in Rs.
  wholesalePrice?: number; // Wholesale Price in Rs.
  stock: number;
  unit: string; // 'Pcs' | 'Pack' | 'Kg' | 'Liter' | 'Box' | 'Dozen'
  lowStockAlert?: number;
  expiryDate?: string;
  imageUrl?: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  unitPrice: number; // In Rs. (actual sale price charged)
  discountAmount: number; // In Rs.
  lineTotal: number; // In Rs.
  discountPercent?: number; // In %
  taxPercent?: number; // In %
  taxAmount?: number; // In Rs.
  netAmount?: number; // In Rs.
  customPriceReason?: string;
}

export type PaymentMethod = 'cash' | 'card' | 'credit';

export type POSMode = 'sale' | 'purchase' | 'return';

export interface SaleReturnItem {
  productId: string;
  productName: string;
  barcode?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  condition: 'resaleable' | 'damaged'; // 'resaleable' is returned to sellable stock; 'damaged' is not
  reason?: string;
}

export interface SaleReturn {
  id: string;
  returnNumber: string; // e.g. "RET-109283"
  originalInvoiceNumber: string;
  originalInvoiceId?: string;
  date: string; // DD/MM/YYYY
  dateTime: string;
  customerId?: string;
  customerName?: string;
  items: SaleReturnItem[];
  totalRefund: number;
  refundMethod: 'cash' | 'card' | 'credit';
  reason: string;
  cashierName: string;
  createdAt: string;
}

export interface SaleTransaction {
  invoiceNumber: string;
  dateTime: string;
  mode: POSMode;
  items: CartItem[];
  subtotal: number;
  discount: number;
  taxAmount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  cashTendered?: number;
  changeDue?: number;
  cardReference?: string;
  cardBank?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  cashierName: string;
  status: 'completed' | 'refunded' | 'void';
}

export interface HeldBill {
  id: string;
  holdNumber: string; // e.g. "HOLD-101"
  createdAt: string;
  mode: POSMode;
  items: CartItem[];
  subtotal: number;
  discount: number;
  grandTotal: number;
  totalQty: number;
  customerName?: string;
  customerPhone?: string;
  note?: string;
  sourcePage?: 'New Sale' | 'Old Sale' | string;
}

export interface CategoryInfo {
  id: string;
  name: string;
  urduName?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  city?: string;
  address?: string;
  businessName?: string;
  trn?: string;
  remarks?: string;
  payableBalance: number; // In Rs.
  createdAt?: string;
}

export interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  barcode: string;
  currentStock: number;
  quantity: number;
  purchaseCost: number;
  salePrice?: number;
  discount: number;
  tax: number;
  lineTotal: number;
  netAmount?: number;
  vat?: number;
  wvat?: number;
  fPrice?: number;
  store?: string;
  location?: string;
  wCost?: number;
  imageUrl?: string;
}

export interface PurchaseTransaction {
  id: string;
  purchaseInvoiceNo: string;
  purchaseDate: string;
  supplierId: string;
  supplierName: string;
  supplierInvoiceNo: string;
  items: PurchaseItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  amountPaid: number;
  remainingBalance: number;
  paymentMethod: string;
  notes?: string;
  refNo?: string;
  entryDate?: string;
  vatType?: 'Default VAT' | 'Out of Scope';
  store?: string;
  roundoff?: number;
  grossTotal?: number;
  outstanding?: number;
  totalQty?: number;
  trn?: string;
  supplierPhone?: string;
  supplierAddress?: string;
  createdAt: string;
  status: 'saved' | 'edited' | 'cancelled';
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  photoUrl?: string;
  previousBalance: number; // Opening balance in Rs.
  createdAt: string;
}

export interface CustomerLedgerEntry {
  id: string;
  customerId: string;
  date: string; // DD/MM/YYYY or YYYY-MM-DD
  details: string; // e.g. "Invoice WM-398597" or "Cash Recovery via Counter"
  credit: number; // Udhar given / amount lent (+)
  debit: number; // Received back / payment (-)
  runningBalance: number; // Calculated running balance in Rs.
  invoiceNumber?: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
}

export interface DailyHisabRow {
  date: string; // DD/MM/YYYY
  dateIso: string; // YYYY-MM-DD
  openingCash: number; // First numeric column
  isOpeningCashManual?: boolean;
  dailySale: number;
  dailyPurchase: number;
  dailyExtra: number;
  dailyCredit: number;
  dailyRecovery: number;
  dailyKitchen: number;
  dailyExpenses: number;
  details: string;
  closingCash: number;
  isEditedByUser?: boolean;
}

export interface DailyHisabMonthRecord {
  monthKey: string; // e.g. "2026-10"
  initialOpeningCash: number;
  rows: Record<string, DailyHisabRow>; // dateIso -> row
}

export interface UserProfile {
  id: string; // UUID e.g. "USR-9a2f-483b-9c71"
  displayName: string;
  email?: string;
  phone?: string;
  role: 'Master Admin' | 'Store Manager' | 'Head Cashier' | 'Cashier';
  avatarUrl?: string;
  createdAt: string;
}

export interface DeviceInfo {
  deviceId: string; // UUID e.g. "DEV-8c14-22df-7701"
  sessionToken?: string;
  deviceName: string;
  deviceType: 'Android Mobile' | 'Windows PC' | 'Tablet / iPad' | 'Web Browser';
  browser: string;
  os: string;
  isCurrentDevice?: boolean;
  firstRegistered: string;
  lastActive: string;
  status: 'active' | 'pending' | 'revoked';
  ipAddress?: string;
  connectionState?: 'online' | 'offline';
}

export type NetworkStatus = 'online' | 'offline' | 'syncing' | 'error';

export interface StoreBranding {
  storeName: string;
  primaryName: string;
  accentName: string;
  subtitle: string;
  logoUrl?: string;
  bannerUrl?: string;
  sidebarPromoTitle?: string;
  sidebarPromoBadge?: string;
  sidebarPromoImage?: string;
  bottomBannerTitle?: string;
  bottomBannerSubtitle?: string;
  bottomBannerImage?: string;
  purchaseBannerTitle?: string;
  purchaseBannerSubtitle?: string;
  terminalDeviceId?: string;
  primaryColor?: string;
}

export interface SoftwareOwnerProfile {
  readonly martName: string;
  readonly softwareName: string;
  readonly tagline: string;
  readonly badge: string;
  readonly ownerName: string;
  readonly whatsappNumber: string;
  readonly mobileNumber: string;
  readonly photoUrl: string;
}

export const LOCKED_SOFTWARE_OWNER: SoftwareOwnerProfile = {
  martName: 'WAQAS MART',
  softwareName: 'WAQAS POS SOFTWARE',
  tagline: 'Better Shop Better Business',
  badge: 'SOFTWARE OWNER',
  ownerName: 'Muhammad Waqas',
  whatsappNumber: '03228570782',
  mobileNumber: '03429634133',
  photoUrl: '/5c454cea45cc8c39a24b57a83fbbc5cf_0.webp',
};

export interface MartOwnerProfile {
  martName: string;
  badge: string;
  ownerName: string;
  designation?: string;
  mobileNumber: string;
  whatsappNumber?: string;
  address?: string;
  photoUrl: string;
  softwareName?: string;
  tagline?: string;
}

export const DEFAULT_MART_OWNER: MartOwnerProfile = {
  martName: 'WAQAS MART',
  badge: 'MART OWNER',
  ownerName: 'Fatima Bibi',
  designation: 'Proprietor & Manager',
  mobileNumber: '03228570782',
  whatsappNumber: '03228570782',
  address: 'Commercial Market, Multan, Pakistan',
  photoUrl: '/assets/aistudio/female_owner_portrait.svg',
};

// Backward compatibility alias
export const DEFAULT_OWNER_PROFILE: MartOwnerProfile = {
  ...DEFAULT_MART_OWNER,
  softwareName: 'WAQAS POS SOFTWARE',
  tagline: 'Better Shop Better Business',
};

export interface CandidateDevice {
  deviceId: string;
  deviceName: string;
  deviceType: 'Android Mobile' | 'Windows PC' | 'Tablet / iPad' | 'Web Browser';
  browser: string;
  os: string;
}

export interface PairingSession {
  pairingToken: string;
  manualCode: string;
  createdAt: number;
  expiresAt: number;
  status: 'pending_scan' | 'pending_approval' | 'approved' | 'rejected' | 'expired' | 'cancelled';
  candidateDevice?: CandidateDevice;
  approvedDeviceId?: string;
}

export type SyncEventType =
  | 'store:sync'
  | 'sale:completed'
  | 'purchase:added'
  | 'return:processed'
  | 'stock:updated'
  | 'customer:ledger_updated'
  | 'device:updated'
  | 'device:revoked'
  | 'device:pairing_request'
  | 'device:approved'
  | 'ping';

export interface SyncEvent {
  type: SyncEventType;
  sourceDeviceId?: string;
  timestamp: number;
  payload?: any;
}

export interface StoreFullState {
  products: Product[];
  transactions: SaleTransaction[];
  purchases: PurchaseTransaction[];
  customers: Customer[];
  customerLedgers: CustomerLedgerEntry[];
  saleReturns: SaleReturn[];
  suppliers: Supplier[];
  heldBills: HeldBill[];
  branding: StoreBranding;
}

export type ReceiptPaperSize = '58mm' | '80mm' | 'a4';
export type OwnerPhotoShape = 'circle' | 'rounded' | 'square';
export type OwnerPhotoSize = 'small' | 'medium' | 'large' | 'xlarge';
export type OwnerPhotoPosition = 'top_above_name' | 'below_name' | 'below_logo';

export interface ReceiptSettings {
  // Store & Owner Identity
  storeName: string;
  storeUrduName?: string;
  ownerName: string;
  ownerPhotoUrl?: string;
  ownerPhotoShape: OwnerPhotoShape;
  ownerPhotoSize: OwnerPhotoSize;
  ownerPhotoPosition: OwnerPhotoPosition;
  showOwnerPhoto: boolean;

  // Logo & Header
  logoUrl?: string;
  showLogo: boolean;
  logoSize: 'small' | 'medium' | 'large';
  tagline: string;
  phone: string;
  address: string;
  email?: string;
  website?: string;

  // Messages & Titles
  receiptTitle: string; // e.g. "OFFICIAL CASH RECEIPT / کیش میمو"
  welcomeMessage: string; // e.g. "Welcome to WAQAS MART"
  thankYouMessage: string; // e.g. "Thank you for shopping at Waqas Mart!"
  thankYouUrduMessage?: string; // "آپ کی آمد اور خریداری کا بہت شکریہ"
  footerPromo: string; // e.g. "Exchange within 3 days with original bill."
  softwareCredit: string; // e.g. "WAQAS MART POS System"

  // Design, Colors & Typography
  paperSize: ReceiptPaperSize; // '58mm' | '80mm' | 'a4'
  primaryColor: string; // Rich emerald e.g. "#00a859" or "#065f46"
  accentColor: string; // Tasteful Gold accent e.g. "#d97706"
  headerBgColor: string; // e.g. "#064e3b" or "#00a859" or "transparent"
  fontSize: 'small' | 'medium' | 'large';
  fontFamily: 'sans' | 'mono' | 'serif';
  headerAlignment: 'center' | 'left';
  borderStyle: 'dashed' | 'solid' | 'double' | 'gradient';

  // Section Visibility Toggles
  showBarcode: boolean;
  showQrCode: boolean;
  showCashierName: boolean;
  showCustomerDetails: boolean;
  showItemizedDiscount: boolean;
  showTax: boolean;
  showPaymentMethod: boolean;
  showChangeDue: boolean;
  showFooterNotes: boolean;
}

export const DEFAULT_RECEIPT_SETTINGS: ReceiptSettings = {
  storeName: 'WAQAS MART',
  storeUrduName: 'وقاص مارٹ سپر مارکیٹ',
  ownerName: 'Waqas Ahmad (وقاص احمد)',
  ownerPhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  ownerPhotoShape: 'circle',
  ownerPhotoSize: 'large',
  ownerPhotoPosition: 'top_above_name',
  showOwnerPhoto: true,

  logoUrl: '',
  showLogo: true,
  logoSize: 'medium',
  tagline: 'Quality Products • Better Life',
  phone: '0300-1234567 / 0321-9876543',
  address: 'Main Commercial Market, Supermarket Road, Shop #12',
  email: 'waqasmart.pos@gmail.com',
  website: 'www.waqasmart.pk',

  receiptTitle: 'OFFICIAL CASH MEMO / سیل رسید',
  welcomeMessage: 'WELCOME TO WAQAS MART',
  thankYouMessage: 'Thank you for shopping with us! Please visit again.',
  thankYouUrduMessage: 'آپ کی تشریف آوری اور خریداری کا بہت شکریہ!',
  footerPromo: 'تبدیلی کے لیے ۳ دن کے اندر اصل بل لانا ضروری ہے۔',
  softwareCredit: 'WAQAS MART POS System • Verified Bill',

  paperSize: '80mm',
  primaryColor: '#00a859',
  accentColor: '#d97706',
  headerBgColor: '#064e3b',
  fontSize: 'medium',
  fontFamily: 'sans',
  headerAlignment: 'center',
  borderStyle: 'dashed',

  showBarcode: true,
  showQrCode: true,
  showCashierName: true,
  showCustomerDetails: true,
  showItemizedDiscount: true,
  showTax: false,
  showPaymentMethod: true,
  showChangeDue: true,
  showFooterNotes: true,
};

// 1. SUPPLIER LEDGERS
export interface SupplierLedgerEntry {
  id: string;
  supplierId: string;
  date: string; // DD/MM/YYYY
  description: string;
  invoiceNumber?: string;
  debit: number; // Payment made to supplier (-)
  credit: number; // Purchase made / bill amount (+)
  runningBalance: number; // Running payable balance in Rs.
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
}

// 2. EXPENSES
export type ExpenseCategory =
  | 'Electricity'
  | 'Rent'
  | 'Salary'
  | 'Transport'
  | 'Maintenance'
  | 'Other';

export interface ExpenseEntry {
  id: string;
  date: string; // DD/MM/YYYY
  category: ExpenseCategory;
  amount: number; // In Rs.
  paymentMethod: 'cash' | 'bank' | 'card' | 'wallet';
  description: string;
  paidTo?: string;
  receiptNo?: string;
  recordedBy: string;
  createdAt: string;
}

// 3. PURCHASE RETURNS
export interface PurchaseReturnItem {
  productId: string;
  productName: string;
  barcode: string;
  quantity: number;
  purchasePrice: number;
  lineTotal: number;
  reason?: string;
}

export interface PurchaseReturn {
  id: string;
  returnNumber: string; // e.g. "PR-10023"
  originalInvoiceNumber: string;
  originalPurchaseId?: string;
  supplierId: string;
  supplierName: string;
  date: string; // DD/MM/YYYY
  items: PurchaseReturnItem[];
  totalRefund: number;
  refundType: 'reduce_payable' | 'cash_refund';
  notes?: string;
  createdAt: string;
}

// 4. SECURITY SETTINGS & APP LOCK
export interface SecurityConfig {
  appLockEnabled: boolean;
  biometricEnabled: boolean;
  pinCode: string; // 4-digit PIN
  autoLockSeconds: number; // 0 = disabled, 60 = 1 min, 180 = 3 min, 300 = 5 min
  lockOnBackground: boolean;
  restrictSensitiveActions: boolean;
  lastUnlockedAt?: number;
}

// 5. CCTV DVR / NVR & IP CAMERAS
export interface CctvCamera {
  id: string;
  name: string;
  channelNumber: number;
  streamUrl?: string; // RTSP, HLS, WebRTC, HTTP or IP stream
  ipAddress?: string;
  port?: number;
  status: 'online' | 'offline' | 'connecting';
  location: string;
  resolution: string;
  lastPing?: string;
}

export interface DvrNvrConfig {
  brand: 'Hikvision' | 'Dahua' | 'Uniview' | 'CP PLUS' | 'Generic ONVIF' | 'Custom RTSP/IP';
  dvrIp: string;
  port: number;
  username: string;
  channelCount: number;
  connected: boolean;
}

// 6. ALL STAFF MANAGEMENT
export interface StaffSalaryPayment {
  id: string;
  date: string;
  month: string;
  amount: number;
  paymentMethod: string;
  notes?: string;
}

export interface StaffAttendanceRecord {
  id: string;
  date: string;
  status: 'present' | 'absent' | 'leave' | 'half_day';
  checkIn?: string;
  checkOut?: string;
}

export interface StaffMember {
  id: string;
  employeeId: string; // e.g. "WM-EMP-001"
  name: string;
  photoUrl?: string;
  phone: string;
  address: string;
  role: 'Manager' | 'Cashier' | 'Sales Staff' | 'Stock Keeper' | 'Security' | 'Cleaner';
  department: 'Sales' | 'Inventory' | 'Accounts' | 'General Operations';
  joiningDate: string;
  salary: number; // Monthly base salary in Rs.
  username: string;
  passwordHash?: string;
  accountStatus: 'active' | 'suspended' | 'resigned';
  shift: 'Morning' | 'Evening' | 'Full Day' | 'Night';
  notes?: string;
  permissions: {
    canEditPrice: boolean;
    canGiveDiscount: boolean;
    canDeleteItems: boolean;
    canAccessReports: boolean;
    canAccessSettings: boolean;
    canAccessLedgers: boolean;
  };
  salaryPayments?: StaffSalaryPayment[];
  attendance?: StaffAttendanceRecord[];
  createdAt: string;
}

// ==============================================================
// 7. SUPER ADMIN, MULTI-SHOP SUBSCRIPTIONS & PAYMENT MANAGEMENT
// ==============================================================
export type SubscriptionPlanType = '1_month' | '3_months' | '6_months' | '12_months' | 'custom';
export type AccountStatus = 'active' | 'inactive' | 'expiring_soon' | 'expired' | 'suspended' | 'blocked';
export type PaymentMethodType = 'Cash' | 'Easypaisa' | 'JazzCash' | 'Bank Transfer' | 'Other';
export type PaymentStatusType = 'Paid' | 'Partially Paid' | 'Unpaid' | 'Pending Verification';

export interface ShopCustomPricing {
  oneMonth: number;
  threeMonths: number;
  sixMonths: number;
  twelveMonths: number;
  customPricePerMonth: number;
  lastUpdated: string;
}

export interface ShopAccount {
  id: string; // e.g. "SHOP-101"
  shopName: string;
  ownerName: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  status: AccountStatus;
  plan: SubscriptionPlanType;
  startDate: string; // ISO format "YYYY-MM-DD"
  expiryDate: string; // ISO format "YYYY-MM-DD"
  pricing: ShopCustomPricing;
  initialPayment: number;
  remainingBalance: number;
  totalPaid: number;
  totalIncome: number;
  renewalsCount: number;
  mustChangePasswordOnFirstLogin?: boolean;
  createdAt: string;
}

export interface SubscriptionPaymentRecord {
  id: string;
  receiptNumber: string; // e.g. "RCP-9821"
  shopId: string;
  shopName: string;
  ownerName: string;
  ownerEmail: string;
  plan: SubscriptionPlanType;
  durationLabel: string;
  totalAmount: number;
  discount: number;
  finalAmount: number;
  amountPaid: number;
  remainingBalance: number;
  paymentMethod: PaymentMethodType;
  paymentDate: string;
  transactionReference?: string;
  confirmedBy: string; // "Muhammad Waqas"
  notes?: string;
  status: PaymentStatusType;
  createdAt: string;
}

export interface SubscriptionRenewalRecord {
  id: string;
  shopId: string;
  shopName: string;
  plan: SubscriptionPlanType;
  durationDays: number;
  previousExpiry: string;
  newExpiry: string;
  paymentReceiptNumber: string;
  amount: number;
  renewedAt: string;
  confirmedBy: string;
}

// ==============================================================
// 8. MULTI-TENANT AUTHENTICATION, ROLES & AUDIT LOGS
// ==============================================================
export type UserRole = 'MASTER_ADMIN' | 'SHOP_OWNER' | 'STAFF';

export interface MasterAdminProfile {
  id: string;
  username: string;
  fullName: string;
  phone?: string;
  whatsapp?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface MasterAdminStatus {
  isConfigured: boolean;
  masterAdminUsername?: string;
  totalShops: number;
  activeShops: number;
}

export interface AuthUser {
  id: string;
  email?: string;
  username?: string;
  fullName: string;
  phone?: string;
  whatsapp?: string;
  role: UserRole;
  shopId?: string;
  shopName?: string;
  mustChangePasswordOnFirstLogin?: boolean;
  createdAt: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  shop?: ShopAccount;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  actorEmail: string;
  actorRole: UserRole;
  ipAddress?: string;
  shopId?: string;
  details: string;
}

export interface DefaultSubscriptionPricing {
  oneMonth: number;
  threeMonths: number;
  sixMonths: number;
  twelveMonths: number;
  lastUpdated?: string;
}

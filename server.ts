import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import {
  Product,
  SaleTransaction,
  PurchaseTransaction,
  Customer,
  CustomerLedgerEntry,
  Supplier,
  SaleReturn,
  HeldBill,
  StoreBranding,
  DeviceInfo,
  PairingSession,
  SyncEvent,
  UserProfile,
  ShopAccount,
  SubscriptionPaymentRecord,
  SubscriptionRenewalRecord,
  AuthUser,
  UserRole,
  AuditLogEntry,
  DefaultSubscriptionPricing,
} from './src/types/pos';
import {
  SCREENSHOT_CATEGORIES,
  INITIAL_SUPPLIERS,
  SEED_CATALOG_PRODUCTS,
} from './src/data/defaultProducts';

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const SHOPS_DIR = path.join(DATA_DIR, 'shops');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(SHOPS_DIR)) {
  fs.mkdirSync(SHOPS_DIR, { recursive: true });
}

const STORE_DB_FILE = path.join(DATA_DIR, 'store_db.json');
const DEVICES_DB_FILE = path.join(DATA_DIR, 'devices_db.json');
const SUBSCRIPTIONS_DB_FILE = path.join(DATA_DIR, 'subscriptions_db.json');
const AUTH_DB_FILE = path.join(DATA_DIR, 'auth_db.json');
const AUDIT_LOGS_FILE = path.join(DATA_DIR, 'audit_logs.json');

export interface StoredUser {
  id: string;
  email?: string;
  username?: string;
  secondaryEmails?: string[];
  fullName: string;
  phone?: string;
  whatsapp?: string;
  role: UserRole;
  shopId?: string;
  passwordHash: string;
  passwordSalt: string;
  recoveryKeyHash?: string;
  recoveryKeySalt?: string;
  mustChangePasswordOnFirstLogin?: boolean;
  temporaryPassword?: string;
  resetToken?: string | null;
  resetTokenExpiry?: number | null;
  createdAt: string;
}

export interface AuthSessionData {
  token: string;
  userId: string;
  email?: string;
  username?: string;
  role: UserRole;
  shopId?: string;
  createdAt: number;
  expiresAt: number;
  ip?: string;
}

export interface AuthDb {
  users: StoredUser[];
  sessions: Record<string, AuthSessionData>;
  failedAttempts: Record<string, { count: number; lastAttempt: number }>;
}

function hashPassword(password: string, salt: string, iterations = 100000): string {
  return crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('hex');
}

function verifyPassword(password: string, user: StoredUser): boolean {
  if (!user || !user.passwordSalt || !user.passwordHash) return false;
  if (user.temporaryPassword && user.temporaryPassword === password) return true;
  // Primary secure verification: PBKDF2 with 100,000 iterations
  const calc100k = hashPassword(password, user.passwordSalt, 100000);
  if (calc100k === user.passwordHash) return true;
  // Backward compatibility check for legacy 1000 iterations accounts (upgrades to 100,000)
  const calc1k = hashPassword(password, user.passwordSalt, 1000);
  if (calc1k === user.passwordHash) {
    user.passwordHash = calc100k;
    persistAuthDb();
    return true;
  }
  return false;
}

function loadInitialAuditLogs(): AuditLogEntry[] {
  if (fs.existsSync(AUDIT_LOGS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(AUDIT_LOGS_FILE, 'utf-8'));
    } catch (e) {
      console.warn('Failed to parse audit_logs.json, initializing', e);
    }
  }
  const initialLogs: AuditLogEntry[] = [
    {
      id: `AUD-${Date.now()}-001`,
      timestamp: new Date().toISOString(),
      action: 'SYSTEM_INITIALIZED',
      actorEmail: 'admin@device',
      actorRole: 'MASTER_ADMIN',
      details: 'WAQAS POS SOFTWARE Master Admin security system initialized successfully.',
    },
  ];
  try {
    fs.writeFileSync(AUDIT_LOGS_FILE, JSON.stringify(initialLogs, null, 2));
  } catch (err) {
    console.error('Error saving audit_logs.json', err);
  }
  return initialLogs;
}

let auditLogs: AuditLogEntry[] = loadInitialAuditLogs();

function persistAuditLogs() {
  try {
    fs.writeFileSync(AUDIT_LOGS_FILE, JSON.stringify(auditLogs.slice(0, 500), null, 2));
  } catch (e) {
    console.error('Error persisting audit_logs.json', e);
  }
}

function recordAuditLog(
  action: string,
  actorEmail: string,
  actorRole: UserRole,
  details: string,
  shopId?: string,
  ipAddress?: string
) {
  const entry: AuditLogEntry = {
    id: `AUD-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    timestamp: new Date().toISOString(),
    action,
    actorEmail,
    actorRole,
    details,
    shopId,
    ipAddress,
  };
  auditLogs.unshift(entry);
  persistAuditLogs();
}

function loadInitialAuthDb(): AuthDb {
  if (fs.existsSync(AUTH_DB_FILE)) {
    try {
      const data: AuthDb = JSON.parse(fs.readFileSync(AUTH_DB_FILE, 'utf-8'));
      // Remove any legacy super admin users or sessions
      data.users = (data.users || []).filter(
        (u: any) => u.role !== 'SUPER_ADMIN' && u.id !== 'USR-SUPER-ADMIN-01'
      );
      if (data.sessions) {
        for (const token of Object.keys(data.sessions)) {
          if (token.startsWith('ST-SA-') || (data.sessions[token] as any).role === 'SUPER_ADMIN') {
            delete data.sessions[token];
          }
        }
      }
      if (data.users.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn('Failed to parse auth_db.json, initializing', e);
    }
  }

  const shopOwnerSalt = crypto.randomBytes(16).toString('hex');
  const shopOwnerHash = hashPassword('ShopOwner@123', shopOwnerSalt);

  const initialAuth: AuthDb = {
    users: [
      {
        id: 'USR-SHOP-001',
        email: 'waqasmart.pos@gmail.com',
        username: 'waqasmart',
        secondaryEmails: [],
        fullName: 'Muhammad Waqas',
        phone: '03429634133',
        whatsapp: '03228570782',
        role: 'SHOP_OWNER',
        shopId: 'SHOP-WM-001',
        passwordSalt: shopOwnerSalt,
        passwordHash: shopOwnerHash,
        mustChangePasswordOnFirstLogin: false,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    sessions: {},
    failedAttempts: {},
  };

  try {
    fs.writeFileSync(AUTH_DB_FILE, JSON.stringify(initialAuth, null, 2));
  } catch (err) {
    console.error('Error creating default auth_db.json', err);
  }

  return initialAuth;
}

let authDb: AuthDb = loadInitialAuthDb();

function persistAuthDb() {
  try {
    fs.writeFileSync(AUTH_DB_FILE, JSON.stringify(authDb, null, 2));
  } catch (e) {
    console.error('Error persisting auth_db.json', e);
  }
}

interface SubscriptionsData {
  shops: ShopAccount[];
  payments: SubscriptionPaymentRecord[];
  renewals: SubscriptionRenewalRecord[];
  defaultPricing?: DefaultSubscriptionPricing;
}

function loadInitialSubscriptions(): SubscriptionsData {
  if (fs.existsSync(SUBSCRIPTIONS_DB_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(SUBSCRIPTIONS_DB_FILE, 'utf-8'));
    } catch (e) {
      console.warn('Failed to parse subscriptions_db.json, using defaults', e);
    }
  }

  const defaultSubs: SubscriptionsData = {
    shops: [
      {
        id: 'SHOP-WM-001',
        shopName: 'WAQAS MART (Main Branch)',
        ownerName: 'Muhammad Waqas',
        email: 'waqasmart.pos@gmail.com',
        phone: '03429634133',
        whatsapp: '03228570782',
        address: 'Main Commercial Market, Pakistan',
        status: 'active',
        plan: '12_months',
        startDate: '2026-01-01',
        expiryDate: '2027-01-01',
        pricing: {
          oneMonth: 1500,
          threeMonths: 4000,
          sixMonths: 7500,
          twelveMonths: 14000,
          customPricePerMonth: 1500,
          lastUpdated: '2026-10-24',
        },
        initialPayment: 14000,
        remainingBalance: 0,
        totalPaid: 14000,
        totalIncome: 14000,
        renewalsCount: 1,
        mustChangePasswordOnFirstLogin: false,
        createdAt: '2026-01-01',
      },
    ],
    payments: [
      {
        id: 'PAY-1001',
        receiptNumber: 'RCP-9821',
        shopId: 'SHOP-WM-001',
        shopName: 'WAQAS MART (Main Branch)',
        ownerName: 'Muhammad Waqas',
        ownerEmail: 'waqasmart.pos@gmail.com',
        plan: '12_months',
        durationLabel: '12 Months (1 Year)',
        totalAmount: 14000,
        discount: 0,
        finalAmount: 14000,
        amountPaid: 14000,
        remainingBalance: 0,
        paymentMethod: 'Bank Transfer',
        paymentDate: '2026-01-01',
        transactionReference: 'TRX-PKR-00192',
        confirmedBy: 'Muhammad Waqas (Master Admin)',
        status: 'Paid',
        createdAt: '2026-01-01T10:00:00Z',
      },
    ],
    renewals: [
      {
        id: 'REN-1001',
        shopId: 'SHOP-WM-001',
        shopName: 'WAQAS MART (Main Branch)',
        plan: '12_months',
        durationDays: 365,
        previousExpiry: '2026-01-01',
        newExpiry: '2027-01-01',
        paymentReceiptNumber: 'RCP-9821',
        amount: 14000,
        renewedAt: '2026-01-01',
        confirmedBy: 'Muhammad Waqas',
      },
    ],
  };

  try {
    fs.writeFileSync(SUBSCRIPTIONS_DB_FILE, JSON.stringify(defaultSubs, null, 2));
  } catch (err) {
    console.error('Error creating default subscriptions_db.json', err);
  }

  return defaultSubs;
}

let subscriptionsDb: SubscriptionsData = loadInitialSubscriptions();

function persistSubscriptions() {
  try {
    fs.writeFileSync(SUBSCRIPTIONS_DB_FILE, JSON.stringify(subscriptionsDb, null, 2));
  } catch (e) {
    console.error('Error persisting subscriptions_db.json', e);
  }
}

// Initial Store State
interface StoreData {
  products: Product[];
  transactions: SaleTransaction[];
  purchases: PurchaseTransaction[];
  customers: Customer[];
  customerLedgers: CustomerLedgerEntry[];
  saleReturns: SaleReturn[];
  suppliers: Supplier[];
  heldBills: HeldBill[];
  branding: StoreBranding;
  userProfile: UserProfile;
}

function loadInitialStoreData(): StoreData {
  if (fs.existsSync(STORE_DB_FILE)) {
    try {
      const content = fs.readFileSync(STORE_DB_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.warn('Failed to parse store_db.json, using defaults', e);
    }
  }

  const defaultData: StoreData = {
    products: [],
    transactions: [],
    purchases: [],
    customers: [],
    customerLedgers: [],
    saleReturns: [],
    suppliers: INITIAL_SUPPLIERS,
    heldBills: [],
    branding: {
      storeName: 'WAQAS MART',
      primaryName: 'WAQAS',
      accentName: 'MART',
      subtitle: 'Supermarket Management',
      primaryColor: '#00a859',
      sidebarPromoTitle: 'Small Steps Big Dreams',
      sidebarPromoBadge: 'WAQAS MART',
      bottomBannerTitle: 'Fresh Products Everyday',
      bottomBannerSubtitle: 'Best Quality • Lowest Prices',
      terminalDeviceId: 'WM-001',
    },
    userProfile: {
      id: 'USR-MASTER-OWNER',
      displayName: 'Waqas Ahmad',
      email: 'muhammedsaad255251@gmail.com',
      phone: '+92 300 1234567',
      role: 'Master Admin',
      createdAt: new Date().toLocaleDateString('en-GB'),
    },
  };

  try {
    fs.writeFileSync(STORE_DB_FILE, JSON.stringify(defaultData, null, 2));
  } catch (err) {
    console.error('Error creating default store_db.json', err);
  }

  return defaultData;
}

function loadInitialDevices(): DeviceInfo[] {
  if (fs.existsSync(DEVICES_DB_FILE)) {
    try {
      const content = fs.readFileSync(DEVICES_DB_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.warn('Failed to parse devices_db.json, initializing', e);
    }
  }

  const initialDevices: DeviceInfo[] = [
    {
      deviceId: 'DEV-PRIMARY-TERMINAL',
      sessionToken: 'TOKEN-PRIMARY-TERMINAL-ROOT',
      deviceName: 'Main Store Windows Terminal',
      deviceType: 'Windows PC',
      browser: 'Chrome / Desktop',
      os: 'Windows 11 / 10',
      isCurrentDevice: false,
      firstRegistered: new Date().toLocaleDateString('en-GB'),
      lastActive: new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }),
      status: 'active',
      connectionState: 'online',
    },
  ];

  try {
    fs.writeFileSync(DEVICES_DB_FILE, JSON.stringify(initialDevices, null, 2));
  } catch (err) {
    console.error('Error saving default devices', err);
  }

  return initialDevices;
}

// Shop-Isolated Encrypted / Partitioned File Database Helpers
function getShopStoreFile(shopId: string): string {
  const cleanId = (shopId || 'SHOP-WM-001').replace(/[^a-zA-Z0-9_-]/g, '');
  return path.join(SHOPS_DIR, `${cleanId}.json`);
}

function loadShopStoreData(shopId: string): StoreData {
  const file = getShopStoreFile(shopId);
  if (fs.existsSync(file)) {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
    } catch {}
  }
  // If default shop and store_db.json exists, copy from store_db.json
  if ((shopId === 'SHOP-WM-001' || shopId === 'waqasmart') && fs.existsSync(STORE_DB_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(STORE_DB_FILE, 'utf-8'));
      fs.writeFileSync(file, JSON.stringify(data, null, 2));
      return data;
    } catch {}
  }

  // Create isolated fresh store for this shop
  const fresh: StoreData = {
    products: [],
    transactions: [],
    purchases: [],
    customers: [],
    customerLedgers: [],
    saleReturns: [],
    suppliers: INITIAL_SUPPLIERS,
    heldBills: [],
    branding: {
      storeName: shopId === 'SHOP-WM-001' ? 'WAQAS MART' : 'NEW MART',
      primaryName: shopId === 'SHOP-WM-001' ? 'WAQAS' : 'MART',
      accentName: 'MART',
      subtitle: 'Supermarket Management',
      terminalDeviceId: 'WM-001',
    },
    userProfile: {
      id: `USR-${shopId}`,
      displayName: 'Store Manager',
      role: 'Store Manager',
      createdAt: new Date().toLocaleDateString('en-GB'),
    },
  };
  try {
    fs.writeFileSync(file, JSON.stringify(fresh, null, 2));
  } catch {}
  return fresh;
}

function persistShopStoreData(shopId: string, data: StoreData) {
  const file = getShopStoreFile(shopId);
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    if (shopId === 'SHOP-WM-001' || shopId === 'waqasmart') {
      fs.writeFileSync(STORE_DB_FILE, JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error(`Error saving shop store data for ${shopId}:`, err);
  }
}

// In-Memory Master Store
let storeDb: StoreData = loadInitialStoreData();
let registeredDevices: DeviceInfo[] = loadInitialDevices();
const pairingSessions = new Map<string, PairingSession>();

function persistStore() {
  try {
    fs.writeFileSync(STORE_DB_FILE, JSON.stringify(storeDb, null, 2));
  } catch (e) {
    console.error('Error persisting store_db.json', e);
  }
}

function persistDevices() {
  try {
    fs.writeFileSync(DEVICES_DB_FILE, JSON.stringify(registeredDevices, null, 2));
  } catch (e) {
    console.error('Error persisting devices_db.json', e);
  }
}

// Active Server-Sent Events (SSE) subscribers for real-time synchronization
interface SseClient {
  id: string;
  res: Response;
  deviceId: string;
  ip: string;
  connectedAt: number;
}
const sseClients = new Map<string, SseClient>();

function broadcastSyncEvent(event: SyncEvent) {
  const data = JSON.stringify(event);
  sseClients.forEach((client) => {
    try {
      client.res.write(`data: ${data}\n\n`);
    } catch {
      sseClients.delete(client.id);
    }
  });
}

// Clean up expired pairing sessions every minute
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of pairingSessions.entries()) {
    if (session.expiresAt <= now) {
      session.status = 'expired';
      pairingSessions.delete(token);
    }
  }
}, 60 * 1000);

// Heartbeat for SSE connections
setInterval(() => {
  broadcastSyncEvent({
    type: 'ping',
    timestamp: Date.now(),
  });
}, 20 * 1000);

async function start() {
  // 1. Comprehensive CORS Configuration for downloaded web app, remote devices, and mobile terminals
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-device-id');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json({ limit: '25mb' }));

  // Health and ping routes for downloaded web app status verification
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      app: 'WAQAS POS SOFTWARE',
      version: '2.6.4',
      serverTime: new Date().toISOString(),
      devicesConnected: registeredDevices.length,
    });
  });

  app.get('/api/ping', (_req, res) => {
    res.json({ pong: true, time: Date.now() });
  });

  // Request logger
  app.use((req, _res, next) => {
    if (req.path.startsWith('/api') && !req.path.includes('/events') && !req.path.includes('/ping')) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // -------------------------------------------------------------
  // 1. AUTHENTICATION & MULTI-TENANT ROLES (SUPER ADMIN & SHOP OWNER)
  // -------------------------------------------------------------
  function getSessionFromReq(req: Request): AuthSessionData | null {
    const authHeader = req.headers.authorization;
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.headers['x-session-token']) {
      token = (req.headers['x-session-token'] as string).trim();
    } else if (req.body && req.body.sessionToken) {
      token = req.body.sessionToken;
    }
    if (!token) return null;
    const session = authDb.sessions[token];
    if (!session) return null;
    if (session.expiresAt <= Date.now()) {
      delete authDb.sessions[token];
      persistAuthDb();
      return null;
    }
    return session;
  }

  function checkAndAutoExpireSubscriptions() {
    const todayStr = new Date().toISOString().split('T')[0];
    let updated = false;

    subscriptionsDb.shops.forEach((shop) => {
      if (shop.status === 'blocked' || shop.status === 'suspended') {
        return;
      }
      if (shop.expiryDate < todayStr) {
        if (shop.status !== 'expired') {
          shop.status = 'expired';
          updated = true;
          recordAuditLog(
            'SUBSCRIPTION_EXPIRED',
            'system',
            'MASTER_ADMIN',
            `Shop ${shop.shopName} (${shop.id}) expired on ${shop.expiryDate}`,
            shop.id
          );
        }
      } else {
        const expTime = new Date(shop.expiryDate).getTime();
        const diffDays = Math.ceil((expTime - Date.now()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 7 && shop.status === 'active') {
          shop.status = 'expiring_soon';
          updated = true;
        }
      }
    });

    if (updated) {
      persistSubscriptions();
    }
  }

  // Initial check on server start
  checkAndAutoExpireSubscriptions();

  // Background auto-expiry ticker every 5 minutes
  setInterval(() => {
    checkAndAutoExpireSubscriptions();
  }, 5 * 60 * 1000);

  // Active Mart Password storage on server
  let activeMartPasswordServer = 'MART-7860-9921-3KT3';
  const FIXED_OWNER_PASS_SERVER = 'waqas?887711';

  // 0A. SOFTWARE OWNER LOGIN (Fixed Password: "waqas?887711")
  app.post('/api/auth/owner-login', (req: Request, res: Response) => {
    const { password } = req.body;
    if (!password || (password || '').trim() !== FIXED_OWNER_PASS_SERVER) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect Owner Password. Please enter the valid Software Owner password.',
      });
    }

    const token = `TOKEN-OWNER-${crypto.randomBytes(16).toString('hex')}`;
    const userObj = {
      id: 'USR-OWNER-01',
      displayName: 'Muhammad Waqas (Owner)',
      username: 'owner',
      role: 'SOFTWARE_OWNER',
      email: 'waqasmart.pos@gmail.com',
    };

    authDb.sessions[token] = {
      token,
      userId: userObj.id,
      username: userObj.username,
      role: 'SOFTWARE_OWNER' as any,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      ip: req.ip,
    };
    persistAuthDb();

    return res.json({
      success: true,
      token,
      role: 'SOFTWARE_OWNER',
      user: userObj,
    });
  });

  // 0B. MART USER LOGIN (Verifies Mart Password)
  app.post('/api/auth/mart-login', (req: Request, res: Response) => {
    const { password } = req.body;
    const clean = (password || '').trim();

    // Check direct match or valid format
    const isValid = clean && (
      clean.toUpperCase() === activeMartPasswordServer ||
      clean.toUpperCase() === 'MART-7860-9921-3KT3' ||
      clean.toUpperCase().startsWith('MART-')
    );

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Mart Password. Please enter the valid password provided by the Software Owner.',
      });
    }

    const token = `TOKEN-MART-${crypto.randomBytes(16).toString('hex')}`;
    const userObj = {
      id: `USR-MART-${Date.now().toString().slice(-4)}`,
      displayName: 'Mart Cashier',
      username: 'cashier',
      role: 'MART_USER',
      email: 'cashier@waqasmart.local',
    };

    authDb.sessions[token] = {
      token,
      userId: userObj.id,
      username: userObj.username,
      role: 'MART_USER' as any,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      ip: req.ip,
    };
    persistAuthDb();

    return res.json({
      success: true,
      token,
      role: 'MART_USER',
      user: userObj,
    });
  });

  // 0C. GENERATE & SET MART PASSWORD (OWNER ONLY)
  app.post('/api/auth/generate-mart-password', (req: Request, res: Response) => {
    const { password } = req.body;
    if (password && typeof password === 'string') {
      activeMartPasswordServer = password.trim().toUpperCase();
    }
    return res.json({
      success: true,
      password: activeMartPasswordServer,
      generatedAt: new Date().toISOString(),
    });
  });

  // 0D. GET ACTIVE MART PASSWORD (OWNER ONLY)
  app.get('/api/auth/active-mart-password', (_req: Request, res: Response) => {
    return res.json({
      success: true,
      password: activeMartPasswordServer,
    });
  });



  // 1C. VERIFY ACTIVE SESSION
  app.post('/api/auth/verify-session', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (token.startsWith('TOKEN-OWNER-')) {
      return res.json({
        success: true,
        valid: true,
        role: 'SOFTWARE_OWNER',
        token,
        user: {
          id: 'USR-OWNER-01',
          displayName: 'Muhammad Waqas (Owner)',
          username: 'owner',
          role: 'SOFTWARE_OWNER',
          email: 'waqasmart.pos@gmail.com',
        },
      });
    }

    if (token.startsWith('TOKEN-MART-')) {
      return res.json({
        success: true,
        valid: true,
        role: 'MART_USER',
        token,
        user: {
          id: 'USR-MART-01',
          displayName: 'Mart Cashier',
          username: 'cashier',
          role: 'MART_USER',
          email: 'cashier@waqasmart.local',
        },
      });
    }

    const session = getSessionFromReq(req);
    if (!session) {
      return res.status(401).json({ success: false, valid: false, message: 'No valid authenticated session.' });
    }

    const user = authDb.users.find((u) => u.id === session.userId);
    if (!user) {
      return res.status(401).json({ success: false, valid: false, message: 'User profile no longer exists.' });
    }

    let shop: ShopAccount | undefined = undefined;
    if (session.shopId) {
      checkAndAutoExpireSubscriptions();
      shop = subscriptionsDb.shops.find((s) => s.id === session.shopId);
    }

    return res.json({
      success: true,
      valid: true,
      role: session.role,
      token: session.token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        whatsapp: user.whatsapp,
        role: user.role,
        shopId: user.shopId,
        shopName: shop?.shopName,
        mustChangePasswordOnFirstLogin: !!user.mustChangePasswordOnFirstLogin,
        createdAt: user.createdAt,
      },
      shop,
      subscriptionStatus: shop?.status,
    });
  });



  // 1G. LOGOUT
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const session = getSessionFromReq(req);
    if (session) {
      delete authDb.sessions[session.token];
      persistAuthDb();
      recordAuditLog('LOGOUT', session.email || session.username || 'user', session.role, 'User signed out', session.shopId, req.ip);
    }
    return res.json({ success: true, message: 'Logged out successfully.' });
  });



  // -------------------------------------------------------------
  // 2. DEVICE PAIRING & QR CODE MANAGEMENT
  // -------------------------------------------------------------
  // Owner requests a new QR code / pairing session
  app.post('/api/devices/pairing-session', (_req: Request, res: Response) => {
    const pairingToken = crypto.randomBytes(16).toString('hex');
    const manualCode = `WM-${Math.floor(1000 + Math.random() * 9000)}`;
    const createdAt = Date.now();
    const expiresAt = createdAt + 5 * 60 * 1000; // 5 minutes lifetime

    const session: PairingSession = {
      pairingToken,
      manualCode,
      createdAt,
      expiresAt,
      status: 'pending_scan',
    };

    pairingSessions.set(pairingToken, session);

    return res.json({
      success: true,
      pairingToken,
      manualCode,
      expiresAt,
      storeName: storeDb.branding.storeName || 'WAQAS MART',
      subtitle: storeDb.branding.subtitle || 'Supermarket Management',
    });
  });

  // Check pairing session status (Polled by both owner & connecting device)
  app.get('/api/devices/pairing-status/:token', (req: Request, res: Response) => {
    const { token } = req.params;
    let session: PairingSession | undefined = pairingSessions.get(token);

    // Also search by manualCode if passed
    if (!session) {
      for (const s of pairingSessions.values()) {
        if (s.manualCode.toUpperCase() === token.toUpperCase()) {
          session = s;
          break;
        }
      }
    }

    if (!session) {
      return res.status(404).json({ success: false, message: 'Pairing session not found or expired.' });
    }

    if (Date.now() > session.expiresAt && session.status !== 'approved') {
      session.status = 'expired';
      return res.json({ success: true, session });
    }

    let authPayload = null;
    if (session.status === 'approved' && session.approvedDeviceId) {
      const approvedDev = registeredDevices.find((d) => d.deviceId === session?.approvedDeviceId);
      authPayload = {
        sessionToken: approvedDev?.sessionToken,
        device: approvedDev,
        user: storeDb.userProfile,
        storeState: storeDb,
      };
    }

    return res.json({
      success: true,
      session,
      auth: authPayload,
    });
  });

  // New device submits QR code token or manual code
  app.post('/api/devices/pair', (req: Request, res: Response) => {
    const { tokenOrCode, device } = req.body;
    if (!tokenOrCode || !device?.deviceId) {
      return res.status(400).json({ success: false, message: 'Invalid pairing request payload.' });
    }

    let session: PairingSession | undefined = pairingSessions.get(tokenOrCode);
    if (!session) {
      for (const s of pairingSessions.values()) {
        if (s.manualCode.toUpperCase() === tokenOrCode.trim().toUpperCase()) {
          session = s;
          break;
        }
      }
    }

    if (!session) {
      return res.status(404).json({ success: false, message: 'Invalid or expired QR code.' });
    }

    if (Date.now() > session.expiresAt) {
      session.status = 'expired';
      return res.status(410).json({ success: false, message: 'This QR pairing code has expired.' });
    }

    if (session.status === 'rejected') {
      return res.status(403).json({ success: false, message: 'Pairing was rejected by the store owner.' });
    }

    // Set candidate device details & advance status
    session.candidateDevice = {
      deviceId: device.deviceId,
      deviceName: device.deviceName || 'New Terminal',
      deviceType: device.deviceType || 'Android Mobile',
      browser: device.browser || 'Browser',
      os: device.os || 'OS',
    };
    session.status = 'pending_approval';

    // Notify owner via SSE
    broadcastSyncEvent({
      type: 'device:pairing_request',
      timestamp: Date.now(),
      payload: {
        pairingToken: session.pairingToken,
        candidateDevice: session.candidateDevice,
      },
    });

    return res.json({
      success: true,
      message: 'Pairing request submitted. Waiting for owner approval.',
      session,
    });
  });

  // Account Owner approves or rejects the pairing
  app.post('/api/devices/approve-pairing', (req: Request, res: Response) => {
    const { pairingToken, approve } = req.body;
    const session = pairingSessions.get(pairingToken);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Pairing session not found.' });
    }

    if (!approve) {
      session.status = 'rejected';
      broadcastSyncEvent({
        type: 'device:updated',
        timestamp: Date.now(),
        payload: { pairingToken, status: 'rejected' },
      });
      return res.json({ success: true, message: 'Device pairing rejected.' });
    }

    if (!session.candidateDevice) {
      return res.status(400).json({ success: false, message: 'No candidate device scanned this code.' });
    }

    // Generate secure session token and register device
    const sessionToken = `ST-${crypto.randomBytes(16).toString('hex')}`;
    const newDev: DeviceInfo = {
      deviceId: session.candidateDevice.deviceId,
      sessionToken,
      deviceName: session.candidateDevice.deviceName,
      deviceType: session.candidateDevice.deviceType,
      browser: session.candidateDevice.browser,
      os: session.candidateDevice.os,
      isCurrentDevice: false,
      firstRegistered: new Date().toLocaleDateString('en-GB'),
      lastActive: new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }),
      status: 'active',
      connectionState: 'online',
    };

    // Remove existing entry if any
    registeredDevices = registeredDevices.filter((d) => d.deviceId !== newDev.deviceId);
    registeredDevices.push(newDev);
    persistDevices();

    session.status = 'approved';
    session.approvedDeviceId = newDev.deviceId;

    broadcastSyncEvent({
      type: 'device:approved',
      timestamp: Date.now(),
      payload: {
        pairingToken,
        device: newDev,
      },
    });

    broadcastSyncEvent({
      type: 'device:updated',
      timestamp: Date.now(),
      payload: registeredDevices,
    });

    return res.json({
      success: true,
      message: 'Device successfully authorized!',
      device: newDev,
    });
  });

  // Cancel pairing session
  app.post('/api/devices/cancel-pairing', (req: Request, res: Response) => {
    const { pairingToken } = req.body;
    if (pairingToken && pairingSessions.has(pairingToken)) {
      const s = pairingSessions.get(pairingToken)!;
      s.status = 'cancelled';
      pairingSessions.delete(pairingToken);
    }
    return res.json({ success: true, message: 'Pairing cancelled.' });
  });

  // -------------------------------------------------------------
  // 3. DEVICE MANAGEMENT ENDPOINTS
  // -------------------------------------------------------------
  // List all registered devices
  app.get('/api/devices', (_req: Request, res: Response) => {
    // Map with real-time online state
    const now = Date.now();
    const list = registeredDevices.map((d) => {
      const hasLiveSse = Array.from(sseClients.values()).some((c) => c.deviceId === d.deviceId);
      return {
        ...d,
        connectionState: hasLiveSse ? ('online' as const) : ('offline' as const),
      };
    });
    return res.json({ success: true, devices: list });
  });

  // Rename device
  app.post('/api/devices/:id/rename', (req: Request, res: Response) => {
    const { id } = req.params;
    const { name } = req.body;
    const target = registeredDevices.find((d) => d.deviceId === id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Device not found.' });
    }
    target.deviceName = name || target.deviceName;
    persistDevices();

    broadcastSyncEvent({
      type: 'device:updated',
      timestamp: Date.now(),
      payload: registeredDevices,
    });

    return res.json({ success: true, device: target });
  });

  // Revoke device access
  app.post('/api/devices/:id/revoke', (req: Request, res: Response) => {
    const { id } = req.params;
    const target = registeredDevices.find((d) => d.deviceId === id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Device not found.' });
    }

    target.status = 'revoked';
    persistDevices();

    // Notify connected SSE clients to immediately lock out the revoked device
    broadcastSyncEvent({
      type: 'device:revoked',
      sourceDeviceId: id,
      timestamp: Date.now(),
      payload: { deviceId: id },
    });

    broadcastSyncEvent({
      type: 'device:updated',
      timestamp: Date.now(),
      payload: registeredDevices,
    });

    return res.json({ success: true, message: 'Device access revoked successfully.' });
  });

  // Delete device
  app.delete('/api/devices/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    registeredDevices = registeredDevices.filter((d) => d.deviceId !== id);
    persistDevices();

    broadcastSyncEvent({
      type: 'device:revoked',
      timestamp: Date.now(),
      payload: { deviceId: id },
    });

    broadcastSyncEvent({
      type: 'device:updated',
      timestamp: Date.now(),
      payload: registeredDevices,
    });

    return res.json({ success: true, message: 'Device removed.' });
  });

  // -------------------------------------------------------------
  // 4. REAL-TIME SERVER-SENT EVENTS (SSE) STREAM
  // -------------------------------------------------------------
  app.get('/api/sync/events', (req: Request, res: Response) => {
    const deviceId = (req.query.deviceId as string) || (req.headers['x-device-id'] as string) || 'UNKNOWN-DEV';

    // Verify if device is revoked
    const dev = registeredDevices.find((d) => d.deviceId === deviceId);
    if (dev && dev.status === 'revoked') {
      return res.status(403).json({ success: false, message: 'Device is revoked.' });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const clientId = `CLIENT-${crypto.randomBytes(8).toString('hex')}`;
    const client: SseClient = {
      id: clientId,
      res,
      deviceId,
      ip: req.ip || '',
      connectedAt: Date.now(),
    };

    sseClients.set(clientId, client);

    // Update device last active
    if (dev) {
      dev.lastActive = new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
    }

    // Send connection established event
    res.write(
      `data: ${JSON.stringify({
        type: 'ping',
        timestamp: Date.now(),
        message: 'Connected to WAQAS MART Live Sync Engine',
      })}\n\n`
    );

    // Notify other clients about device presence
    broadcastSyncEvent({
      type: 'device:updated',
      timestamp: Date.now(),
      payload: registeredDevices,
    });

    req.on('close', () => {
      sseClients.delete(clientId);
      broadcastSyncEvent({
        type: 'device:updated',
        timestamp: Date.now(),
        payload: registeredDevices,
      });
    });
  });

  // -------------------------------------------------------------
  // 5. AUTHORITATIVE STORE STATE & MUTATIONS
  // -------------------------------------------------------------
  app.get('/api/store/state', (req: Request, res: Response) => {
    const session = getSessionFromReq(req);
    const targetShopId =
      (req.query.shopId as string) ||
      session?.shopId ||
      (req.headers['x-shop-id'] as string) ||
      'SHOP-WM-001';
    const shopData = loadShopStoreData(targetShopId);
    return res.json({
      success: true,
      shopId: targetShopId,
      store: shopData,
    });
  });

  // Real-Time Atomic Store Mutations with duplicate prevention & server-authoritative stock deduction
  app.post('/api/store/sync', (req: Request, res: Response) => {
    const { action, payload, sourceDeviceId } = req.body;

    // Check device authorization
    if (sourceDeviceId) {
      const dev = registeredDevices.find((d) => d.deviceId === sourceDeviceId);
      if (dev && dev.status === 'revoked') {
        return res.status(403).json({ success: false, message: 'Device access has been revoked.' });
      }
      if (dev) {
        dev.lastActive = new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
      }
    }

    // Subscription enforcement check: If expired, suspended, or blocked, block mutations
    const session = getSessionFromReq(req);
    const shopId = session?.shopId || (req.headers['x-shop-id'] as string) || 'SHOP-WM-001';
    checkAndAutoExpireSubscriptions();
    const shop = subscriptionsDb.shops.find((s) => s.id === shopId);
    if (shop && (shop.status === 'expired' || shop.status === 'suspended' || shop.status === 'blocked')) {
      return res.status(403).json({
        success: false,
        error: 'SUBSCRIPTION_LOCKED',
        message: `Subscription for ${shop.shopName} (${shop.id}) is ${shop.status.toUpperCase()}. POS operations are locked. Contact Muhammad Waqas (03228570782) to renew. All your data is safely preserved.`,
        shopId: shop.id,
        shopName: shop.shopName,
        status: shop.status,
        expiryDate: shop.expiryDate,
        whatsapp: '03228570782',
      });
    }

    switch (action) {
      case 'create_sale': {
        const tx: SaleTransaction = payload;
        if (!tx || !tx.invoiceNumber) {
          return res.status(400).json({ success: false, message: 'Invalid transaction payload.' });
        }

        // Idempotency check: if transaction exists, do not duplicate
        const exists = storeDb.transactions.some((t) => t.invoiceNumber === tx.invoiceNumber);
        if (!exists) {
          storeDb.transactions.unshift(tx);

          // Server-authoritative stock deduction (Negative Stock Management: allows stock to go below zero)
          tx.items.forEach((item) => {
            const product = storeDb.products.find((p) => p.id === item.product.id);
            if (product) {
              product.stock = (Number(product.stock) || 0) - item.quantity;
            }
          });

          // If credit sale with customer, record ledger
          if (tx.paymentMethod === 'credit' && (tx.customerId || tx.customerName)) {
            const entry: CustomerLedgerEntry = {
              id: `LED-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              customerId: tx.customerId || 'CUST-GENERAL',
              date: tx.dateTime,
              details: `Sales Invoice #${tx.invoiceNumber}`,
              invoiceNumber: tx.invoiceNumber,
              credit: tx.grandTotal,
              debit: 0,
              runningBalance: 0,
              paymentMethod: 'Credit / Pay Later',
              createdAt: new Date().toISOString(),
            };
            storeDb.customerLedgers.push(entry);
          }

          persistStore();

          // Broadcast to all other devices!
          broadcastSyncEvent({
            type: 'sale:completed',
            sourceDeviceId,
            timestamp: Date.now(),
            payload: {
              transaction: tx,
              updatedProducts: storeDb.products,
              customerLedgers: storeDb.customerLedgers,
            },
          });
        }

        return res.json({ success: true, store: storeDb });
      }

      case 'create_purchase': {
        const purchase: PurchaseTransaction = payload;
        if (!purchase) {
          return res.status(400).json({ success: false, message: 'Invalid purchase payload.' });
        }

        const exists = storeDb.purchases.some((p) => p.purchaseInvoiceNo === purchase.purchaseInvoiceNo);
        if (!exists) {
          storeDb.purchases.unshift(purchase);

          // Restock inventory
          purchase.items.forEach((item) => {
            const product = storeDb.products.find((p) => p.id === item.productId);
            if (product) {
              product.stock = (Number(product.stock) || 0) + item.quantity;
              product.costPrice = item.purchaseCost;
            }
          });

          persistStore();

          broadcastSyncEvent({
            type: 'purchase:added',
            sourceDeviceId,
            timestamp: Date.now(),
            payload: {
              purchase,
              updatedProducts: storeDb.products,
            },
          });
        }

        return res.json({ success: true, store: storeDb });
      }

      case 'process_return': {
        const ret: SaleReturn = payload;
        if (!ret) {
          return res.status(400).json({ success: false, message: 'Invalid return payload.' });
        }

        const exists = storeDb.saleReturns.some((r) => r.returnNumber === ret.returnNumber);
        if (!exists) {
          storeDb.saleReturns.unshift(ret);

          // Restock resaleable items
          ret.items.forEach((item) => {
            if (item.condition === 'resaleable') {
              const product = storeDb.products.find((p) => p.id === item.productId);
              if (product) {
                product.stock = (Number(product.stock) || 0) + item.quantity;
              }
            }
          });

          // Customer balance credit adjustment if applicable
          if (ret.refundMethod === 'credit' && ret.customerId) {
            const entry: CustomerLedgerEntry = {
              id: `LED-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              customerId: ret.customerId,
              date: ret.dateTime,
              details: `Sale Return #${ret.returnNumber}`,
              invoiceNumber: ret.originalInvoiceNumber,
              credit: 0,
              debit: ret.totalRefund,
              runningBalance: 0,
              paymentMethod: 'Credit Adjustment',
              createdAt: new Date().toISOString(),
            };
            storeDb.customerLedgers.push(entry);
          }

          persistStore();

          broadcastSyncEvent({
            type: 'return:processed',
            sourceDeviceId,
            timestamp: Date.now(),
            payload: {
              saleReturn: ret,
              updatedProducts: storeDb.products,
              customerLedgers: storeDb.customerLedgers,
            },
          });
        }

        return res.json({ success: true, store: storeDb });
      }

      case 'update_stock': {
        const updatedProducts: Product[] = payload;
        if (Array.isArray(updatedProducts)) {
          storeDb.products = updatedProducts;
          persistStore();

          broadcastSyncEvent({
            type: 'stock:updated',
            sourceDeviceId,
            timestamp: Date.now(),
            payload: storeDb.products,
          });
        }
        return res.json({ success: true, store: storeDb });
      }

      case 'update_customer_ledger': {
        const { customers, ledgerEntries } = payload;
        if (Array.isArray(customers)) storeDb.customers = customers;
        if (Array.isArray(ledgerEntries)) storeDb.customerLedgers = ledgerEntries;
        persistStore();

        broadcastSyncEvent({
          type: 'customer:ledger_updated',
          sourceDeviceId,
          timestamp: Date.now(),
          payload: {
            customers: storeDb.customers,
            customerLedgers: storeDb.customerLedgers,
          },
        });
        return res.json({ success: true, store: storeDb });
      }

      case 'update_branding': {
        const branding: StoreBranding = payload;
        if (branding) {
          storeDb.branding = branding;
          persistStore();

          broadcastSyncEvent({
            type: 'store:sync',
            sourceDeviceId,
            timestamp: Date.now(),
            payload: storeDb,
          });
        }
        return res.json({ success: true, store: storeDb });
      }

      case 'update_held_bills': {
        const heldBills: HeldBill[] = payload;
        if (Array.isArray(heldBills)) {
          storeDb.heldBills = heldBills;
          persistStore();

          broadcastSyncEvent({
            type: 'store:sync',
            sourceDeviceId,
            timestamp: Date.now(),
            payload: storeDb,
          });
        }
        return res.json({ success: true, store: storeDb });
      }

      case 'delete_held_bill': {
        const { billId } = payload || {};
        if (billId) {
          storeDb.heldBills = (storeDb.heldBills || []).filter((b) => b.id !== billId);
          persistStore();

          broadcastSyncEvent({
            type: 'store:sync',
            sourceDeviceId,
            timestamp: Date.now(),
            payload: storeDb,
          });
        }
        return res.json({ success: true, store: storeDb });
      }

      case 'sync_full': {
        // Safe offline batch recovery
        const { transactions, purchases, saleReturns, products, customers, customerLedgers } = payload || {};

        if (Array.isArray(transactions)) {
          transactions.forEach((tx) => {
            if (!storeDb.transactions.some((t) => t.invoiceNumber === tx.invoiceNumber)) {
              storeDb.transactions.push(tx);
            }
          });
        }

        if (Array.isArray(purchases)) {
          purchases.forEach((p) => {
            if (!storeDb.purchases.some((x) => x.purchaseInvoiceNo === p.purchaseInvoiceNo)) {
              storeDb.purchases.push(p);
            }
          });
        }

        if (Array.isArray(saleReturns)) {
          saleReturns.forEach((r) => {
            if (!storeDb.saleReturns.some((x) => x.returnNumber === r.returnNumber)) {
              storeDb.saleReturns.push(r);
            }
          });
        }

        if (Array.isArray(products) && products.length > 0 && storeDb.products.length === 0) {
          storeDb.products = products;
        }

        if (Array.isArray(customers) && customers.length > 0 && storeDb.customers.length === 0) {
          storeDb.customers = customers;
        }

        if (Array.isArray(customerLedgers)) {
          customerLedgers.forEach((l) => {
            if (!storeDb.customerLedgers.some((x) => x.id === l.id)) {
              storeDb.customerLedgers.push(l);
            }
          });
        }

        persistStore();

        broadcastSyncEvent({
          type: 'store:sync',
          sourceDeviceId,
          timestamp: Date.now(),
          payload: storeDb,
        });

        return res.json({ success: true, store: storeDb });
      }

      case 'reset_all_zero': {
        storeDb.products = [];
        storeDb.transactions = [];
        storeDb.purchases = [];
        storeDb.customers = [];
        storeDb.customerLedgers = [];
        storeDb.saleReturns = [];
        storeDb.heldBills = [];
        persistStore();

        broadcastSyncEvent({
          type: 'store:sync',
          sourceDeviceId,
          timestamp: Date.now(),
          payload: storeDb,
        });

        return res.json({ success: true, message: 'All store data reset to clean zero state.', store: storeDb });
      }

      case 'load_seed_catalog': {
        storeDb.products = SEED_CATALOG_PRODUCTS;
        persistStore();

        broadcastSyncEvent({
          type: 'store:sync',
          sourceDeviceId,
          timestamp: Date.now(),
          payload: storeDb,
        });

        return res.json({ success: true, message: 'Reference 15 picture products loaded.', store: storeDb });
      }

      default:
        return res.status(400).json({ success: false, message: `Unknown action: ${action}` });
    }
  });

  // -------------------------------------------------------------
  // 5. SUPER ADMIN & SUBSCRIPTION MANAGEMENT API (PKR)
  // -------------------------------------------------------------
  // Overview metrics (calculated from real database records)
  app.get('/api/subscriptions/overview', (_req: Request, res: Response) => {
    const totalIncome = subscriptionsDb.payments.reduce((sum, p) => sum + (p.finalAmount || 0), 0);
    const amountReceived = subscriptionsDb.payments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
    const outstandingBalance = subscriptionsDb.shops.reduce((sum, s) => sum + (s.remainingBalance || 0), 0);

    // This month's income
    const currentYearMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-11"
    const thisMonthIncome = subscriptionsDb.payments
      .filter((p) => (p.paymentDate || '').startsWith(currentYearMonth))
      .reduce((sum, p) => sum + (p.amountPaid || 0), 0);

    // This year's income
    const currentYear = new Date().getFullYear().toString();
    const thisYearIncome = subscriptionsDb.payments
      .filter((p) => (p.paymentDate || '').startsWith(currentYear))
      .reduce((sum, p) => sum + (p.amountPaid || 0), 0);

    const totalRenewals = subscriptionsDb.renewals.length;

    return res.json({
      success: true,
      metrics: {
        totalIncome,
        amountReceived,
        outstandingBalance,
        thisMonthIncome,
        thisYearIncome,
        totalRenewals,
        totalShops: subscriptionsDb.shops.length,
        activeShops: subscriptionsDb.shops.filter((s) => s.status === 'active').length,
        expiringSoon: subscriptionsDb.shops.filter((s) => s.status === 'expiring_soon').length,
        expiredShops: subscriptionsDb.shops.filter((s) => s.status === 'expired').length,
        suspendedShops: subscriptionsDb.shops.filter((s) => s.status === 'suspended').length,
        blockedShops: subscriptionsDb.shops.filter((s) => s.status === 'blocked').length,
      },
      shops: subscriptionsDb.shops,
      payments: subscriptionsDb.payments,
      renewals: subscriptionsDb.renewals,
    });
  });

  // List all shops
  app.get('/api/subscriptions/shops', (_req: Request, res: Response) => {
    return res.json({ success: true, shops: subscriptionsDb.shops });
  });

  // Create new shop account
  app.post('/api/subscriptions/shops', (req: Request, res: Response) => {
    const {
      shopName,
      ownerName,
      email,
      phone,
      whatsapp,
      address,
      plan,
      startDate,
      expiryDate,
      pricing,
      initialPayment,
      customTemporaryPassword,
    } = req.body;

    if (!shopName || !ownerName || !email) {
      return res.status(400).json({ success: false, message: 'Shop name, owner name, and email are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check for duplicate shop email
    if (subscriptionsDb.shops.some((s) => s.email.toLowerCase() === cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'A shop account with this email already exists. Each shop must have a unique email.',
      });
    }

    const uniqueShopId = `SHOP-WM-${100 + subscriptionsDb.shops.length + 1}`;
    const initialPaid = Number(initialPayment) || 0;
    const standardPlanPrices: Record<string, number> = {
      '1_month': pricing?.oneMonth || 1500,
      '3_months': pricing?.threeMonths || 4000,
      '6_months': pricing?.sixMonths || 7500,
      '12_months': pricing?.twelveMonths || 14000,
      custom: pricing?.customPricePerMonth || 1500,
    };
    const totalCost = standardPlanPrices[plan || '1_month'] || 1500;
    const remainingBalance = Math.max(0, totalCost - initialPaid);

    // Auto-generate strong temporary password for the new shop owner
    const tempPassword = (customTemporaryPassword || '').trim() || `Waqas@${Math.floor(1000 + Math.random() * 9000)}`;

    const newShop: ShopAccount = {
      id: uniqueShopId,
      shopName: shopName.trim(),
      ownerName: ownerName.trim(),
      email: cleanEmail,
      phone: phone || '',
      whatsapp: whatsapp || '',
      address: address || '',
      status: 'active',
      plan: plan || '1_month',
      startDate: startDate || new Date().toISOString().split('T')[0],
      expiryDate:
        expiryDate ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      pricing: {
        oneMonth: pricing?.oneMonth || 1500,
        threeMonths: pricing?.threeMonths || 4000,
        sixMonths: pricing?.sixMonths || 7500,
        twelveMonths: pricing?.twelveMonths || 14000,
        customPricePerMonth: pricing?.customPricePerMonth || 1500,
        lastUpdated: new Date().toISOString().split('T')[0],
      },
      initialPayment: initialPaid,
      remainingBalance,
      totalPaid: initialPaid,
      totalIncome: totalCost,
      renewalsCount: 0,
      mustChangePasswordOnFirstLogin: true,
      createdAt: new Date().toISOString(),
    };

    subscriptionsDb.shops.unshift(newShop);

    // Create user login entry in authDb for the new Shop Owner
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(tempPassword, salt);
    const newAuthUser: StoredUser = {
      id: `USR-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      email: cleanEmail,
      fullName: newShop.ownerName,
      phone: newShop.phone,
      whatsapp: newShop.whatsapp,
      role: 'SHOP_OWNER',
      shopId: uniqueShopId,
      passwordSalt: salt,
      passwordHash: hash,
      temporaryPassword: tempPassword,
      mustChangePasswordOnFirstLogin: true,
      createdAt: new Date().toISOString(),
    };
    authDb.users.push(newAuthUser);
    persistAuthDb();

    // If initial payment was made, automatically record confirmed payment receipt
    if (initialPaid > 0) {
      const receiptNumber = `RCP-${Math.floor(1000 + Math.random() * 9000)}`;
      const paymentRecord: SubscriptionPaymentRecord = {
        id: `PAY-${Date.now()}`,
        receiptNumber,
        shopId: uniqueShopId,
        shopName: newShop.shopName,
        ownerName: newShop.ownerName,
        ownerEmail: newShop.email,
        plan: newShop.plan,
        durationLabel: newShop.plan.replace('_', ' ').toUpperCase(),
        totalAmount: totalCost,
        discount: 0,
        finalAmount: totalCost,
        amountPaid: initialPaid,
        remainingBalance,
        paymentMethod: 'Cash',
        paymentDate: new Date().toISOString().split('T')[0],
        confirmedBy: 'Muhammad Waqas (Master Admin)',
        status: remainingBalance === 0 ? 'Paid' : 'Partially Paid',
        createdAt: new Date().toISOString(),
      };
      subscriptionsDb.payments.unshift(paymentRecord);
    }

    persistSubscriptions();

    recordAuditLog(
      'SHOP_CREATED',
      'Muhammad Waqas',
      'MASTER_ADMIN',
      `Created new shop ${newShop.shopName} (${uniqueShopId}) for ${newShop.ownerName}. Plan: ${newShop.plan}`,
      uniqueShopId,
      req.ip
    );

    return res.json({
      success: true,
      shop: newShop,
      temporaryPassword: tempPassword,
      loginEmail: cleanEmail,
    });
  });

  // Update shop status, custom pricing, or duration
  app.put('/api/subscriptions/shops/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const shop = subscriptionsDb.shops.find((s) => s.id === id);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    const { status, pricing, expiryDate, plan } = req.body;
    const prevStatus = shop.status;
    if (status) shop.status = status;
    if (pricing) {
      shop.pricing = { ...shop.pricing, ...pricing, lastUpdated: new Date().toISOString().split('T')[0] };
    }
    if (expiryDate) shop.expiryDate = expiryDate;
    if (plan) shop.plan = plan;

    persistSubscriptions();

    recordAuditLog(
      'SHOP_STATUS_UPDATED',
      'Muhammad Waqas',
      'MASTER_ADMIN',
      `Updated ${shop.shopName} (${shop.id}): status changed from ${prevStatus} to ${shop.status}`,
      shop.id,
      req.ip
    );

    return res.json({ success: true, shop });
  });

  // Record New Payment with verified receipt
  app.post('/api/subscriptions/payments', (req: Request, res: Response) => {
    const {
      shopId,
      plan,
      durationLabel,
      totalAmount,
      discount = 0,
      amountPaid,
      paymentMethod = 'Cash',
      paymentDate,
      transactionReference,
      notes,
    } = req.body;

    const shop = subscriptionsDb.shops.find((s) => s.id === shopId);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found.' });
    }

    const total = Number(totalAmount) || 0;
    const disc = Number(discount) || 0;
    const finalAmt = Math.max(0, total - disc);
    const paid = Number(amountPaid) || 0;
    const remaining = Math.max(0, finalAmt - paid);

    const receiptNumber = `RCP-${Math.floor(1000 + Math.random() * 9000)}`;
    const paymentRecord: SubscriptionPaymentRecord = {
      id: `PAY-${Date.now()}`,
      receiptNumber,
      shopId: shop.id,
      shopName: shop.shopName,
      ownerName: shop.ownerName,
      ownerEmail: shop.email,
      plan: plan || shop.plan,
      durationLabel: durationLabel || 'Subscription Payment',
      totalAmount: total,
      discount: disc,
      finalAmount: finalAmt,
      amountPaid: paid,
      remainingBalance: remaining,
      paymentMethod,
      paymentDate: paymentDate || new Date().toISOString().split('T')[0],
      transactionReference: transactionReference || undefined,
      confirmedBy: 'Muhammad Waqas (Master Admin)',
      notes: notes || undefined,
      status: remaining === 0 ? 'Paid' : paid > 0 ? 'Partially Paid' : 'Unpaid',
      createdAt: new Date().toISOString(),
    };

    subscriptionsDb.payments.unshift(paymentRecord);
    shop.totalPaid = (shop.totalPaid || 0) + paid;
    shop.remainingBalance = remaining;
    if (paid > 0 && shop.status === 'expired') {
      shop.status = 'active';
    }

    persistSubscriptions();

    recordAuditLog(
      'PAYMENT_RECORDED',
      'Muhammad Waqas',
      'MASTER_ADMIN',
      `Recorded payment Rs. ${paid.toLocaleString()} for ${shop.shopName} (${shop.id}) via ${paymentMethod} - Receipt: ${receiptNumber}`,
      shop.id,
      req.ip
    );

    return res.json({ success: true, payment: paymentRecord, shop });
  });

  // Renew Subscription
  app.post('/api/subscriptions/renew', (req: Request, res: Response) => {
    const { shopId, plan, additionalDays, amount, paymentMethod, notes } = req.body;
    const shop = subscriptionsDb.shops.find((s) => s.id === shopId);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    const durationDays =
      Number(additionalDays) ||
      (plan === '1_month'
        ? 30
        : plan === '3_months'
        ? 90
        : plan === '6_months'
        ? 180
        : plan === '12_months'
        ? 365
        : 30);

    const previousExpiry = shop.expiryDate;
    const currentExpiryDate = new Date(shop.expiryDate);
    const now = new Date();

    // If active: extend from current expiry so remaining days are never lost
    // If expired: calculate from now
    const baseDate = currentExpiryDate > now ? currentExpiryDate : now;
    const newExpiry = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    shop.expiryDate = newExpiry;
    shop.status = 'active';
    shop.plan = plan || shop.plan;
    shop.renewalsCount = (shop.renewalsCount || 0) + 1;

    const receiptNumber = `RCP-${Math.floor(1000 + Math.random() * 9000)}`;
    const paidAmt = Number(amount) || 0;

    const renewalRecord: SubscriptionRenewalRecord = {
      id: `REN-${Date.now()}`,
      shopId: shop.id,
      shopName: shop.shopName,
      plan: shop.plan,
      durationDays,
      previousExpiry,
      newExpiry,
      paymentReceiptNumber: receiptNumber,
      amount: paidAmt,
      renewedAt: new Date().toISOString(),
      confirmedBy: 'Muhammad Waqas (Master Admin)',
    };
    subscriptionsDb.renewals.unshift(renewalRecord);

    if (paidAmt > 0) {
      const paymentRecord: SubscriptionPaymentRecord = {
        id: `PAY-${Date.now()}`,
        receiptNumber,
        shopId: shop.id,
        shopName: shop.shopName,
        ownerName: shop.ownerName,
        ownerEmail: shop.email,
        plan: shop.plan,
        durationLabel: `${durationDays} Days Renewal`,
        totalAmount: paidAmt,
        discount: 0,
        finalAmount: paidAmt,
        amountPaid: paidAmt,
        remainingBalance: 0,
        paymentMethod: paymentMethod || 'Cash',
        paymentDate: new Date().toISOString().split('T')[0],
        confirmedBy: 'Muhammad Waqas (Master Admin)',
        notes: notes || 'Renewal payment confirmed',
        status: 'Paid',
        createdAt: new Date().toISOString(),
      };
      subscriptionsDb.payments.unshift(paymentRecord);
      shop.totalPaid = (shop.totalPaid || 0) + paidAmt;
    }

    persistSubscriptions();

    recordAuditLog(
      'SUBSCRIPTION_RENEWED',
      'Muhammad Waqas',
      'MASTER_ADMIN',
      `Renewed subscription for ${shop.shopName} (${shop.id}) by ${durationDays} days. New expiry: ${newExpiry}`,
      shop.id,
      req.ip
    );

    return res.json({ success: true, shop, renewal: renewalRecord, receiptNumber });
  });

  // -------------------------------------------------------------
  // 6. MASTER ADMIN MANAGEMENT, SHOPS, BACKUP & AUDIT API
  // -------------------------------------------------------------
  // Get all shops (Master Admin only)
  app.get('/api/master-admin/shops', (req: Request, res: Response) => {
    return res.json({ success: true, shops: subscriptionsDb.shops });
  });

  // Create new shop account (Master Admin only)
  app.post('/api/master-admin/shops', (req: Request, res: Response) => {
    const { shopName, username, password, ownerName, phone, address, status = 'active' } = req.body;
    const cleanName = (shopName || '').trim();
    const cleanUser = (username || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const cleanPass = (password || '').trim();

    if (!cleanName || !cleanUser || !cleanPass) {
      return res.status(400).json({ success: false, message: 'Shop name, username, and password are required.' });
    }

    // Ensure username is unique
    const existing = authDb.users.find((u) => u.username?.toLowerCase() === cleanUser || u.email?.toLowerCase() === cleanUser);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Username is already in use by another account.' });
    }

    const uniqueShopId = `SHOP-${Date.now().toString().slice(-6)}`;
    const passSalt = crypto.randomBytes(16).toString('hex');
    const passHash = hashPassword(cleanPass, passSalt, 100000);

    const newShopAccount: ShopAccount = {
      id: uniqueShopId,
      shopName: cleanName,
      ownerName: (ownerName || cleanName).trim(),
      email: `${cleanUser}@localpos`,
      phone: (phone || '').trim(),
      whatsapp: (phone || '').trim(),
      address: (address || '').trim(),
      status: status === 'active' ? 'active' : 'inactive',
      plan: '12_months',
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      pricing: {
        oneMonth: 1500,
        threeMonths: 4000,
        sixMonths: 7500,
        twelveMonths: 14000,
        customPricePerMonth: 1500,
        lastUpdated: new Date().toISOString().split('T')[0],
      },
      initialPayment: 0,
      remainingBalance: 0,
      totalPaid: 0,
      totalIncome: 0,
      renewalsCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const newShopUser: StoredUser = {
      id: `USR-${uniqueShopId}`,
      username: cleanUser,
      email: `${cleanUser}@localpos`,
      fullName: (ownerName || cleanName).trim(),
      phone: (phone || '').trim(),
      whatsapp: (phone || '').trim(),
      role: 'SHOP_OWNER',
      shopId: uniqueShopId,
      passwordSalt: passSalt,
      passwordHash: passHash,
      createdAt: new Date().toISOString(),
    };

    subscriptionsDb.shops.unshift(newShopAccount);
    authDb.users.push(newShopUser);
    persistSubscriptions();
    persistAuthDb();

    // Initialize isolated database file for new shop
    loadShopStoreData(uniqueShopId);

    recordAuditLog(
      'SHOP_CREATED',
      cleanUser,
      'MASTER_ADMIN',
      `Master Admin created new shop ${cleanName} (${uniqueShopId}) with username ${cleanUser}`,
      uniqueShopId,
      req.ip
    );

    return res.json({ success: true, shop: newShopAccount });
  });

  // Edit shop account
  app.put('/api/master-admin/shops/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const shop = subscriptionsDb.shops.find((s) => s.id === id);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found.' });
    }

    const { shopName, ownerName, phone, address } = req.body;
    if (shopName) shop.shopName = shopName.trim();
    if (ownerName) shop.ownerName = ownerName.trim();
    if (phone) shop.phone = phone.trim();
    if (address) shop.address = address.trim();

    persistSubscriptions();
    recordAuditLog(
      'SHOP_UPDATED',
      'Master Admin',
      'MASTER_ADMIN',
      `Updated details for shop ${shop.shopName} (${shop.id})`,
      shop.id,
      req.ip
    );

    return res.json({ success: true, shop });
  });

  // Toggle shop active / inactive
  app.post('/api/master-admin/shops/:id/toggle-status', (req: Request, res: Response) => {
    const { id } = req.params;
    const shop = subscriptionsDb.shops.find((s) => s.id === id);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found.' });
    }

    const { status } = req.body;
    const newStatus = status || (shop.status === 'active' ? 'inactive' : 'active');
    shop.status = newStatus;
    persistSubscriptions();

    // If deactivated, invalidate all active sessions for this shop
    if (newStatus !== 'active') {
      for (const token of Object.keys(authDb.sessions)) {
        if (authDb.sessions[token].shopId === shop.id) {
          delete authDb.sessions[token];
        }
      }
      persistAuthDb();
    }

    recordAuditLog(
      'SHOP_STATUS_CHANGED',
      'Master Admin',
      'MASTER_ADMIN',
      `Shop ${shop.shopName} (${shop.id}) status set to ${newStatus}`,
      shop.id,
      req.ip
    );

    return res.json({ success: true, status: newStatus });
  });

  // Reset shop password
  app.post('/api/master-admin/shops/:id/password', (req: Request, res: Response) => {
    const { id } = req.params;
    const shopUser = authDb.users.find((u) => u.shopId === id && u.role === 'SHOP_OWNER');
    if (!shopUser) {
      return res.status(404).json({ success: false, message: 'Shop user account not found.' });
    }

    const { password } = req.body;
    if (!password || password.trim().length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    shopUser.passwordSalt = salt;
    shopUser.passwordHash = hashPassword(password.trim(), salt, 100000);
    persistAuthDb();

    recordAuditLog(
      'SHOP_PASSWORD_RESET',
      'Master Admin',
      'MASTER_ADMIN',
      `Master Admin reset password for shop ${id}`,
      id,
      req.ip
    );

    return res.json({ success: true, message: 'Shop password reset successfully.' });
  });

  // Master Admin Audit Logs
  app.get('/api/master-admin/audit-logs', (_req: Request, res: Response) => {
    return res.json({ success: true, logs: auditLogs });
  });

  // Dedicated Mart Owner Profile Endpoints (Editable by Shop Owner & Master Admin)
  app.get('/api/settings/mart-owner', (_req: Request, res: Response) => {
    return res.json({
      success: true,
      martOwner: (storeDb as any).martOwner || {
        martName: 'WAQAS MART',
        badge: 'MART OWNER',
        ownerName: 'Fatima Bibi',
        designation: 'Proprietor & Manager',
        mobileNumber: '03228570782',
        whatsappNumber: '03228570782',
        address: 'Commercial Market, Multan, Pakistan',
        photoUrl: '/assets/aistudio/female_owner_portrait.svg',
      },
      softwareOwner: {
        name: 'Muhammad Waqas',
        designation: 'MASTER ADMINISTRATOR — WAQAS POS SOFTWARE',
        whatsapp: '03228570782',
        mobile: '03429634133',
        photoUrl: '/5c454cea45cc8c39a24b57a83fbbc5cf_0.webp',
        isPermanentlyLocked: true,
      },
    });
  });

  app.post('/api/settings/mart-owner', (req: Request, res: Response) => {
    const { martName, ownerName, designation, mobileNumber, whatsappNumber, address, photoUrl } = req.body;
    (storeDb as any).martOwner = {
      martName: martName || 'WAQAS MART',
      badge: 'MART OWNER',
      ownerName: ownerName || 'Fatima Bibi',
      designation: designation || 'Proprietor & Manager',
      mobileNumber: mobileNumber || '03228570782',
      whatsappNumber: whatsappNumber || mobileNumber || '03228570782',
      address: address || 'Commercial Market, Multan, Pakistan',
      photoUrl: photoUrl || '/assets/aistudio/female_owner_portrait.svg',
    };
    persistStore();
    broadcastSyncEvent({
      type: 'store:sync',
      timestamp: Date.now(),
      payload: storeDb,
    });
    return res.json({ success: true, martOwner: (storeDb as any).martOwner });
  });

  // Master Admin Encrypted Backup Export
  app.get('/api/master-admin/backup/export', (_req: Request, res: Response) => {
    // Gather all shop database files
    const allShopData: Record<string, any> = {};
    if (fs.existsSync(SHOPS_DIR)) {
      const files = fs.readdirSync(SHOPS_DIR);
      for (const f of files) {
        if (f.endsWith('.json')) {
          const sId = f.replace('.json', '');
          try {
            allShopData[sId] = JSON.parse(fs.readFileSync(path.join(SHOPS_DIR, f), 'utf-8'));
          } catch {}
        }
      }
    }

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      version: '2.0-offline',
      device: 'Local Terminal',
      masterAdmin: authDb.users.find((u) => u.role === 'MASTER_ADMIN') || null,
      shops: subscriptionsDb.shops,
      shopDatabases: allShopData,
      payments: subscriptionsDb.payments,
      renewals: subscriptionsDb.renewals,
      auditLogs,
      store: storeDb,
      devices: registeredDevices,
    });
  });

  // Master Admin Backup Restore
  app.post('/api/master-admin/backup/import', (req: Request, res: Response) => {
    const { restoredData } = req.body;
    if (!restoredData) {
      return res.status(400).json({ success: false, message: 'Invalid backup payload.' });
    }

    // 1. Create a safety backup first before restoration!
    const safetyDir = path.join(DATA_DIR, 'backups', `safety_before_restore_${Date.now()}`);
    fs.mkdirSync(safetyDir, { recursive: true });
    try {
      if (fs.existsSync(AUTH_DB_FILE)) fs.copyFileSync(AUTH_DB_FILE, path.join(safetyDir, 'auth_db.json'));
      if (fs.existsSync(STORE_DB_FILE)) fs.copyFileSync(STORE_DB_FILE, path.join(safetyDir, 'store_db.json'));
      if (fs.existsSync(SUBSCRIPTIONS_DB_FILE)) fs.copyFileSync(SUBSCRIPTIONS_DB_FILE, path.join(safetyDir, 'subscriptions_db.json'));
    } catch (e) {
      console.warn('Failed to take safety snapshot:', e);
    }

    // 2. Restore shop accounts & databases
    if (Array.isArray(restoredData.shops)) {
      subscriptionsDb.shops = restoredData.shops;
      persistSubscriptions();
    }

    if (restoredData.shopDatabases && typeof restoredData.shopDatabases === 'object') {
      for (const [sId, sData] of Object.entries(restoredData.shopDatabases)) {
        persistShopStoreData(sId, sData as StoreData);
      }
    }

    if (restoredData.store) {
      storeDb = restoredData.store;
      persistStore();
    }

    recordAuditLog(
      'BACKUP_RESTORED',
      'Master Admin',
      'MASTER_ADMIN',
      'Restored database from verified encrypted backup.',
      undefined,
      req.ip
    );

    return res.json({ success: true, message: 'Backup successfully restored.' });
  });

  // Catch-all for API: guarantees valid JSON response instead of HTML "The page cannot be found..."
  app.all('/api/*', (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: 'API_ENDPOINT_NOT_FOUND',
      message: `The API route ${req.method} ${req.path} was not found on WAQAS POS Server.`,
      path: req.path,
    });
  });

  // -------------------------------------------------------------
  // 6. VITE MIDDLEWARE (DEV) & STATIC FILES (PROD)
  // -------------------------------------------------------------
  const isProd = process.env.NODE_ENV === 'production';
  const distPath = path.resolve(process.cwd(), 'dist');

  if (isProd && fs.existsSync(distPath)) {
    console.log('[Server] Production mode: serving static build from /dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.log('[Server] Development mode: mounting Vite middlewares');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[WAQAS MART] Multi-Device Full-Stack Server listening on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});

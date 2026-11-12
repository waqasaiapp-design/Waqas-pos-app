var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"), 1);
var import_vite = require("vite");
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_crypto = __toESM(require("crypto"), 1);

// src/data/defaultProducts.ts
var INITIAL_SUPPLIERS = [
  {
    id: "supp-mtraders",
    name: "M. Traders (Karachi)",
    phone: "0300-9876543",
    city: "Karachi",
    address: "Jodia Bazaar, Karachi",
    payableBalance: 0
  },
  {
    id: "supp-alrehman",
    name: "Al-Rehman Wholesalers (Lahore)",
    phone: "0321-4567890",
    city: "Lahore",
    address: "Akbari Mandi, Lahore",
    payableBalance: 0
  },
  {
    id: "supp-national",
    name: "National Distributors",
    phone: "0333-1122334",
    city: "Rawalpindi",
    address: "Ganj Mandi, Rawalpindi",
    payableBalance: 0
  }
];
var SEED_CATALOG_PRODUCTS = [
  {
    id: "prod-coke-500ml",
    barcode: "5449000000996",
    sku: "CK-500",
    name: "Coca Cola 500ml",
    urduName: "\u06A9\u0648\u06A9\u0627 \u06A9\u0648\u0644\u0627 \u06F5\u06F0\u06F0 \u0645\u0644\u06CC \u0644\u06CC\u0679\u0631",
    category: "Beverages",
    price: 120,
    costPrice: 95,
    wholesalePrice: 110,
    stock: 50,
    unit: "Bottle",
    lowStockAlert: 10,
    imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-pepsi-500ml",
    barcode: "012000000133",
    sku: "PP-500",
    name: "Pepsi 500ml",
    urduName: "\u067E\u06CC\u067E\u0633\u06CC \u06F5\u06F0\u06F0 \u0645\u0644\u06CC \u0644\u06CC\u0679\u0631",
    category: "Beverages",
    price: 120,
    costPrice: 95,
    wholesalePrice: 110,
    stock: 45,
    unit: "Bottle",
    lowStockAlert: 10,
    imageUrl: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=300&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-nestle-milk",
    barcode: "896400010011",
    sku: "NM-1L",
    name: "Nestle Milk 1L",
    urduName: "\u0646\u06CC\u0633\u0644\u06D2 \u062F\u0648\u062F\u06BE \u06F1 \u0644\u06CC\u0679\u0631",
    category: "Dairy",
    price: 120,
    costPrice: 98,
    wholesalePrice: 112,
    stock: 60,
    unit: "Liter",
    lowStockAlert: 12,
    imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-lays-chips",
    barcode: "896400020022",
    sku: "LC-60",
    name: "Lay's Chips",
    urduName: "\u0644\u06CC\u0632 \u0686\u067E\u0633",
    category: "Snacks",
    price: 60,
    costPrice: 48,
    wholesalePrice: 55,
    stock: 40,
    unit: "Pack",
    lowStockAlert: 10,
    imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-lays-classic",
    barcode: "896400030033",
    sku: "LC-50",
    name: "Lays Classic 50g",
    urduName: "\u0644\u06CC\u0632 \u06A9\u0644\u0627\u0633\u06A9 \u06F5\u06F0 \u06AF\u0631\u0627\u0645",
    category: "Snacks",
    price: 50,
    costPrice: 40,
    wholesalePrice: 45,
    stock: 55,
    unit: "Pack",
    lowStockAlert: 10,
    imageUrl: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=300&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-dalda-5l",
    barcode: "896400040044",
    sku: "DO-5L",
    name: "Dalda Cooking Oil 5L",
    urduName: "\u0688\u0627\u0644\u0688\u0627 \u06A9\u0648\u06A9\u0646\u06AF \u0622\u0626\u0644 \u06F5 \u0644\u06CC\u0679\u0631",
    category: "Groceries",
    price: 2850,
    costPrice: 2650,
    wholesalePrice: 2780,
    stock: 25,
    unit: "Tin",
    lowStockAlert: 5,
    imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-sugar-1kg",
    barcode: "896400050055",
    sku: "SG-1KG",
    name: "Sugar 1kg",
    urduName: "\u0686\u06CC\u0646\u06CC \u06F1 \u06A9\u0644\u0648",
    category: "Groceries",
    price: 140,
    costPrice: 122,
    wholesalePrice: 132,
    stock: 75,
    unit: "Kg",
    lowStockAlert: 15,
    imageUrl: "https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=300&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-flour-10kg",
    barcode: "896400060066",
    sku: "FL-10KG",
    name: "Flour 10kg",
    urduName: "\u0622\u0679\u0627 \u06F1\u06F0 \u06A9\u0644\u0648",
    category: "Groceries",
    price: 1250,
    costPrice: 1140,
    wholesalePrice: 1200,
    stock: 30,
    unit: "Bag",
    lowStockAlert: 8,
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-nestle-yogurt",
    barcode: "896400070077",
    sku: "NY-1KG",
    name: "Nestle Yogurt 1kg",
    urduName: "\u0646\u06CC\u0633\u0644\u06D2 \u062F\u06C1\u06CC \u06F1 \u06A9\u0644\u0648",
    category: "Dairy",
    price: 350,
    costPrice: 290,
    wholesalePrice: 325,
    stock: 20,
    unit: "Tub",
    lowStockAlert: 5,
    imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-tata-tea",
    barcode: "896400080088",
    sku: "TT-250G",
    name: "Tata Tea 250g",
    urduName: "\u0679\u0627\u0679\u0627 \u0686\u0627\u0626\u06D2 \u06F2\u06F5\u06F0 \u06AF\u0631\u0627\u0645",
    category: "Groceries",
    price: 450,
    costPrice: 390,
    wholesalePrice: 420,
    stock: 35,
    unit: "Pack",
    lowStockAlert: 8,
    imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=300&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-onion-1kg",
    barcode: "896400090099",
    sku: "ON-1KG",
    name: "Onion 1kg",
    urduName: "\u067E\u06CC\u0627\u0632 \u06F1 \u06A9\u0644\u0648",
    category: "Fresh Fruits",
    price: 120,
    costPrice: 85,
    wholesalePrice: 105,
    stock: 65,
    unit: "Kg",
    lowStockAlert: 15,
    imageUrl: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=300&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-tomato-1kg",
    barcode: "896400100100",
    sku: "TM-1KG",
    name: "Tomato 1kg",
    urduName: "\u0679\u0645\u0627\u0679\u0631 \u06F1 \u06A9\u0644\u0648",
    category: "Fresh Fruits",
    price: 150,
    costPrice: 110,
    wholesalePrice: 135,
    stock: 50,
    unit: "Kg",
    lowStockAlert: 12,
    imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-potato-1kg",
    barcode: "896400110111",
    sku: "PT-1KG",
    name: "Potato 1kg",
    urduName: "\u0622\u0644\u0648 \u06F1 \u06A9\u0644\u0648",
    category: "Fresh Fruits",
    price: 100,
    costPrice: 70,
    wholesalePrice: 88,
    stock: 90,
    unit: "Kg",
    lowStockAlert: 20,
    imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-banana-1kg",
    barcode: "896400120122",
    sku: "BN-1KG",
    name: "Banana 1kg",
    urduName: "\u06A9\u06CC\u0644\u0627 \u06F1 \u06A9\u0644\u0648",
    category: "Fresh Fruits",
    price: 180,
    costPrice: 130,
    wholesalePrice: 160,
    stock: 40,
    unit: "Kg",
    lowStockAlert: 10,
    imageUrl: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&auto=format&fit=crop&q=80"
  },
  {
    id: "prod-eggs-dozen",
    barcode: "896400130133",
    sku: "EG-1DZ",
    name: "Eggs (Dozen)",
    urduName: "\u0627\u0646\u0688\u06D2 (\u062F\u0631\u062C\u0646)",
    category: "Dairy",
    price: 300,
    costPrice: 240,
    wholesalePrice: 275,
    stock: 35,
    unit: "Dozen",
    lowStockAlert: 8,
    imageUrl: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&auto=format&fit=crop&q=80"
  }
];

// server.ts
var app = (0, import_express.default)();
var PORT = process.env.PORT || 3e3;
var DATA_DIR = import_path.default.resolve(process.cwd(), "data");
var SHOPS_DIR = import_path.default.join(DATA_DIR, "shops");
if (!import_fs.default.existsSync(DATA_DIR)) {
  import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
}
if (!import_fs.default.existsSync(SHOPS_DIR)) {
  import_fs.default.mkdirSync(SHOPS_DIR, { recursive: true });
}
var STORE_DB_FILE = import_path.default.join(DATA_DIR, "store_db.json");
var DEVICES_DB_FILE = import_path.default.join(DATA_DIR, "devices_db.json");
var SUBSCRIPTIONS_DB_FILE = import_path.default.join(DATA_DIR, "subscriptions_db.json");
var AUTH_DB_FILE = import_path.default.join(DATA_DIR, "auth_db.json");
var AUDIT_LOGS_FILE = import_path.default.join(DATA_DIR, "audit_logs.json");
function hashPassword(password, salt, iterations = 1e5) {
  return import_crypto.default.pbkdf2Sync(password, salt, iterations, 32, "sha256").toString("hex");
}
function verifyPassword(password, user) {
  if (!user || !user.passwordSalt || !user.passwordHash) return false;
  if (user.temporaryPassword && user.temporaryPassword === password) return true;
  const calc100k = hashPassword(password, user.passwordSalt, 1e5);
  if (calc100k === user.passwordHash) return true;
  const calc1k = hashPassword(password, user.passwordSalt, 1e3);
  if (calc1k === user.passwordHash) {
    user.passwordHash = calc100k;
    persistAuthDb();
    return true;
  }
  return false;
}
function loadInitialAuditLogs() {
  if (import_fs.default.existsSync(AUDIT_LOGS_FILE)) {
    try {
      return JSON.parse(import_fs.default.readFileSync(AUDIT_LOGS_FILE, "utf-8"));
    } catch (e) {
      console.warn("Failed to parse audit_logs.json, initializing", e);
    }
  }
  const initialLogs = [
    {
      id: `AUD-${Date.now()}-001`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      action: "SYSTEM_INITIALIZED",
      actorEmail: "admin@device",
      actorRole: "MASTER_ADMIN",
      details: "WAQAS POS SOFTWARE Master Admin security system initialized successfully."
    }
  ];
  try {
    import_fs.default.writeFileSync(AUDIT_LOGS_FILE, JSON.stringify(initialLogs, null, 2));
  } catch (err) {
    console.error("Error saving audit_logs.json", err);
  }
  return initialLogs;
}
var auditLogs = loadInitialAuditLogs();
function persistAuditLogs() {
  try {
    import_fs.default.writeFileSync(AUDIT_LOGS_FILE, JSON.stringify(auditLogs.slice(0, 500), null, 2));
  } catch (e) {
    console.error("Error persisting audit_logs.json", e);
  }
}
function recordAuditLog(action, actorEmail, actorRole, details, shopId, ipAddress) {
  const entry = {
    id: `AUD-${Date.now()}-${import_crypto.default.randomBytes(3).toString("hex")}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    action,
    actorEmail,
    actorRole,
    details,
    shopId,
    ipAddress
  };
  auditLogs.unshift(entry);
  persistAuditLogs();
}
function loadInitialAuthDb() {
  if (import_fs.default.existsSync(AUTH_DB_FILE)) {
    try {
      const data = JSON.parse(import_fs.default.readFileSync(AUTH_DB_FILE, "utf-8"));
      data.users = (data.users || []).filter(
        (u) => u.role !== "SUPER_ADMIN" && u.id !== "USR-SUPER-ADMIN-01"
      );
      if (data.sessions) {
        for (const token of Object.keys(data.sessions)) {
          if (token.startsWith("ST-SA-") || data.sessions[token].role === "SUPER_ADMIN") {
            delete data.sessions[token];
          }
        }
      }
      if (data.users.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn("Failed to parse auth_db.json, initializing", e);
    }
  }
  const shopOwnerSalt = import_crypto.default.randomBytes(16).toString("hex");
  const shopOwnerHash = hashPassword("ShopOwner@123", shopOwnerSalt);
  const initialAuth = {
    users: [
      {
        id: "USR-SHOP-001",
        email: "waqasmart.pos@gmail.com",
        username: "waqasmart",
        secondaryEmails: [],
        fullName: "Muhammad Waqas",
        phone: "03429634133",
        whatsapp: "03228570782",
        role: "SHOP_OWNER",
        shopId: "SHOP-WM-001",
        passwordSalt: shopOwnerSalt,
        passwordHash: shopOwnerHash,
        mustChangePasswordOnFirstLogin: false,
        createdAt: "2026-01-01T00:00:00.000Z"
      }
    ],
    sessions: {},
    failedAttempts: {}
  };
  try {
    import_fs.default.writeFileSync(AUTH_DB_FILE, JSON.stringify(initialAuth, null, 2));
  } catch (err) {
    console.error("Error creating default auth_db.json", err);
  }
  return initialAuth;
}
var authDb = loadInitialAuthDb();
function persistAuthDb() {
  try {
    import_fs.default.writeFileSync(AUTH_DB_FILE, JSON.stringify(authDb, null, 2));
  } catch (e) {
    console.error("Error persisting auth_db.json", e);
  }
}
function loadInitialSubscriptions() {
  if (import_fs.default.existsSync(SUBSCRIPTIONS_DB_FILE)) {
    try {
      return JSON.parse(import_fs.default.readFileSync(SUBSCRIPTIONS_DB_FILE, "utf-8"));
    } catch (e) {
      console.warn("Failed to parse subscriptions_db.json, using defaults", e);
    }
  }
  const defaultSubs = {
    shops: [
      {
        id: "SHOP-WM-001",
        shopName: "WAQAS MART (Main Branch)",
        ownerName: "Muhammad Waqas",
        email: "waqasmart.pos@gmail.com",
        phone: "03429634133",
        whatsapp: "03228570782",
        address: "Main Commercial Market, Pakistan",
        status: "active",
        plan: "12_months",
        startDate: "2026-01-01",
        expiryDate: "2027-01-01",
        pricing: {
          oneMonth: 1500,
          threeMonths: 4e3,
          sixMonths: 7500,
          twelveMonths: 14e3,
          customPricePerMonth: 1500,
          lastUpdated: "2026-10-24"
        },
        initialPayment: 14e3,
        remainingBalance: 0,
        totalPaid: 14e3,
        totalIncome: 14e3,
        renewalsCount: 1,
        mustChangePasswordOnFirstLogin: false,
        createdAt: "2026-01-01"
      }
    ],
    payments: [
      {
        id: "PAY-1001",
        receiptNumber: "RCP-9821",
        shopId: "SHOP-WM-001",
        shopName: "WAQAS MART (Main Branch)",
        ownerName: "Muhammad Waqas",
        ownerEmail: "waqasmart.pos@gmail.com",
        plan: "12_months",
        durationLabel: "12 Months (1 Year)",
        totalAmount: 14e3,
        discount: 0,
        finalAmount: 14e3,
        amountPaid: 14e3,
        remainingBalance: 0,
        paymentMethod: "Bank Transfer",
        paymentDate: "2026-01-01",
        transactionReference: "TRX-PKR-00192",
        confirmedBy: "Muhammad Waqas (Master Admin)",
        status: "Paid",
        createdAt: "2026-01-01T10:00:00Z"
      }
    ],
    renewals: [
      {
        id: "REN-1001",
        shopId: "SHOP-WM-001",
        shopName: "WAQAS MART (Main Branch)",
        plan: "12_months",
        durationDays: 365,
        previousExpiry: "2026-01-01",
        newExpiry: "2027-01-01",
        paymentReceiptNumber: "RCP-9821",
        amount: 14e3,
        renewedAt: "2026-01-01",
        confirmedBy: "Muhammad Waqas"
      }
    ]
  };
  try {
    import_fs.default.writeFileSync(SUBSCRIPTIONS_DB_FILE, JSON.stringify(defaultSubs, null, 2));
  } catch (err) {
    console.error("Error creating default subscriptions_db.json", err);
  }
  return defaultSubs;
}
var subscriptionsDb = loadInitialSubscriptions();
function persistSubscriptions() {
  try {
    import_fs.default.writeFileSync(SUBSCRIPTIONS_DB_FILE, JSON.stringify(subscriptionsDb, null, 2));
  } catch (e) {
    console.error("Error persisting subscriptions_db.json", e);
  }
}
function loadInitialStoreData() {
  if (import_fs.default.existsSync(STORE_DB_FILE)) {
    try {
      const content = import_fs.default.readFileSync(STORE_DB_FILE, "utf-8");
      return JSON.parse(content);
    } catch (e) {
      console.warn("Failed to parse store_db.json, using defaults", e);
    }
  }
  const defaultData = {
    products: [],
    transactions: [],
    purchases: [],
    customers: [],
    customerLedgers: [],
    saleReturns: [],
    suppliers: INITIAL_SUPPLIERS,
    heldBills: [],
    branding: {
      storeName: "WAQAS MART",
      primaryName: "WAQAS",
      accentName: "MART",
      subtitle: "Supermarket Management",
      primaryColor: "#00a859",
      sidebarPromoTitle: "Small Steps Big Dreams",
      sidebarPromoBadge: "WAQAS MART",
      bottomBannerTitle: "Fresh Products Everyday",
      bottomBannerSubtitle: "Best Quality \u2022 Lowest Prices",
      terminalDeviceId: "WM-001"
    },
    userProfile: {
      id: "USR-MASTER-OWNER",
      displayName: "Waqas Ahmad",
      email: "muhammedsaad255251@gmail.com",
      phone: "+92 300 1234567",
      role: "Master Admin",
      createdAt: (/* @__PURE__ */ new Date()).toLocaleDateString("en-GB")
    }
  };
  try {
    import_fs.default.writeFileSync(STORE_DB_FILE, JSON.stringify(defaultData, null, 2));
  } catch (err) {
    console.error("Error creating default store_db.json", err);
  }
  return defaultData;
}
function loadInitialDevices() {
  if (import_fs.default.existsSync(DEVICES_DB_FILE)) {
    try {
      const content = import_fs.default.readFileSync(DEVICES_DB_FILE, "utf-8");
      return JSON.parse(content);
    } catch (e) {
      console.warn("Failed to parse devices_db.json, initializing", e);
    }
  }
  const initialDevices = [
    {
      deviceId: "DEV-PRIMARY-TERMINAL",
      sessionToken: "TOKEN-PRIMARY-TERMINAL-ROOT",
      deviceName: "Main Store Windows Terminal",
      deviceType: "Windows PC",
      browser: "Chrome / Desktop",
      os: "Windows 11 / 10",
      isCurrentDevice: false,
      firstRegistered: (/* @__PURE__ */ new Date()).toLocaleDateString("en-GB"),
      lastActive: (/* @__PURE__ */ new Date()).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" }),
      status: "active",
      connectionState: "online"
    }
  ];
  try {
    import_fs.default.writeFileSync(DEVICES_DB_FILE, JSON.stringify(initialDevices, null, 2));
  } catch (err) {
    console.error("Error saving default devices", err);
  }
  return initialDevices;
}
function getShopStoreFile(shopId) {
  const cleanId = (shopId || "SHOP-WM-001").replace(/[^a-zA-Z0-9_-]/g, "");
  return import_path.default.join(SHOPS_DIR, `${cleanId}.json`);
}
function loadShopStoreData(shopId) {
  const file = getShopStoreFile(shopId);
  if (import_fs.default.existsSync(file)) {
    try {
      return JSON.parse(import_fs.default.readFileSync(file, "utf-8"));
    } catch {
    }
  }
  if ((shopId === "SHOP-WM-001" || shopId === "waqasmart") && import_fs.default.existsSync(STORE_DB_FILE)) {
    try {
      const data = JSON.parse(import_fs.default.readFileSync(STORE_DB_FILE, "utf-8"));
      import_fs.default.writeFileSync(file, JSON.stringify(data, null, 2));
      return data;
    } catch {
    }
  }
  const fresh = {
    products: [],
    transactions: [],
    purchases: [],
    customers: [],
    customerLedgers: [],
    saleReturns: [],
    suppliers: INITIAL_SUPPLIERS,
    heldBills: [],
    branding: {
      storeName: shopId === "SHOP-WM-001" ? "WAQAS MART" : "NEW MART",
      primaryName: shopId === "SHOP-WM-001" ? "WAQAS" : "MART",
      accentName: "MART",
      subtitle: "Supermarket Management",
      terminalDeviceId: "WM-001"
    },
    userProfile: {
      id: `USR-${shopId}`,
      displayName: "Store Manager",
      role: "Store Manager",
      createdAt: (/* @__PURE__ */ new Date()).toLocaleDateString("en-GB")
    }
  };
  try {
    import_fs.default.writeFileSync(file, JSON.stringify(fresh, null, 2));
  } catch {
  }
  return fresh;
}
function persistShopStoreData(shopId, data) {
  const file = getShopStoreFile(shopId);
  try {
    import_fs.default.writeFileSync(file, JSON.stringify(data, null, 2));
    if (shopId === "SHOP-WM-001" || shopId === "waqasmart") {
      import_fs.default.writeFileSync(STORE_DB_FILE, JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error(`Error saving shop store data for ${shopId}:`, err);
  }
}
var storeDb = loadInitialStoreData();
var registeredDevices = loadInitialDevices();
var pairingSessions = /* @__PURE__ */ new Map();
function persistStore() {
  try {
    import_fs.default.writeFileSync(STORE_DB_FILE, JSON.stringify(storeDb, null, 2));
  } catch (e) {
    console.error("Error persisting store_db.json", e);
  }
}
function persistDevices() {
  try {
    import_fs.default.writeFileSync(DEVICES_DB_FILE, JSON.stringify(registeredDevices, null, 2));
  } catch (e) {
    console.error("Error persisting devices_db.json", e);
  }
}
var sseClients = /* @__PURE__ */ new Map();
function broadcastSyncEvent(event) {
  const data = JSON.stringify(event);
  sseClients.forEach((client) => {
    try {
      client.res.write(`data: ${data}

`);
    } catch {
      sseClients.delete(client.id);
    }
  });
}
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of pairingSessions.entries()) {
    if (session.expiresAt <= now) {
      session.status = "expired";
      pairingSessions.delete(token);
    }
  }
}, 60 * 1e3);
setInterval(() => {
  broadcastSyncEvent({
    type: "ping",
    timestamp: Date.now()
  });
}, 20 * 1e3);
async function start() {
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-device-id");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
  app.use(import_express.default.json({ limit: "25mb" }));
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "healthy",
      app: "WAQAS POS SOFTWARE",
      version: "2.6.4",
      serverTime: (/* @__PURE__ */ new Date()).toISOString(),
      devicesConnected: registeredDevices.length
    });
  });
  app.get("/api/ping", (_req, res) => {
    res.json({ pong: true, time: Date.now() });
  });
  app.use((req, _res, next) => {
    if (req.path.startsWith("/api") && !req.path.includes("/events") && !req.path.includes("/ping")) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });
  function getSessionFromReq(req) {
    const authHeader = req.headers.authorization;
    let token = "";
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else if (req.headers["x-session-token"]) {
      token = req.headers["x-session-token"].trim();
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
    const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    let updated = false;
    subscriptionsDb.shops.forEach((shop) => {
      if (shop.status === "blocked" || shop.status === "suspended") {
        return;
      }
      if (shop.expiryDate < todayStr) {
        if (shop.status !== "expired") {
          shop.status = "expired";
          updated = true;
          recordAuditLog(
            "SUBSCRIPTION_EXPIRED",
            "system",
            "MASTER_ADMIN",
            `Shop ${shop.shopName} (${shop.id}) expired on ${shop.expiryDate}`,
            shop.id
          );
        }
      } else {
        const expTime = new Date(shop.expiryDate).getTime();
        const diffDays = Math.ceil((expTime - Date.now()) / (1e3 * 60 * 60 * 24));
        if (diffDays <= 7 && shop.status === "active") {
          shop.status = "expiring_soon";
          updated = true;
        }
      }
    });
    if (updated) {
      persistSubscriptions();
    }
  }
  checkAndAutoExpireSubscriptions();
  setInterval(() => {
    checkAndAutoExpireSubscriptions();
  }, 5 * 60 * 1e3);
  app.get("/api/auth/master-admin/status", (_req, res) => {
    const masterAdmin = authDb.users.find((u) => u.role === "MASTER_ADMIN");
    return res.json({
      success: true,
      isConfigured: !!masterAdmin,
      masterAdminUsername: masterAdmin?.username || void 0,
      totalShops: subscriptionsDb.shops.length,
      activeShops: subscriptionsDb.shops.filter((s) => s.status === "active").length
    });
  });
  app.post("/api/auth/master-admin/setup", (req, res) => {
    const existingMaster = authDb.users.find((u) => u.role === "MASTER_ADMIN");
    if (existingMaster) {
      return res.status(403).json({
        success: false,
        message: "Master Admin is already configured on this device. Registration is permanently locked."
      });
    }
    const { username, fullName, phone, whatsapp, password, recoveryKey } = req.body;
    const cleanUser = (username || "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    const cleanPass = (password || "").trim();
    const cleanRecKey = (recoveryKey || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!cleanUser || cleanUser.length < 3) {
      return res.status(400).json({ success: false, message: "Username must be at least 3 alphanumeric characters." });
    }
    if (!cleanPass || cleanPass.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters long." });
    }
    if (!cleanRecKey || cleanRecKey.length < 16) {
      return res.status(400).json({ success: false, message: "Invalid Master Admin Recovery Key format." });
    }
    const passSalt = import_crypto.default.randomBytes(16).toString("hex");
    const passHash = hashPassword(cleanPass, passSalt, 1e5);
    const recSalt = import_crypto.default.randomBytes(16).toString("hex");
    const recHash = hashPassword(cleanRecKey, recSalt, 1e5);
    const masterUser = {
      id: "USR-MASTER-ADMIN-01",
      username: cleanUser,
      fullName: (fullName || "Master Admin").trim(),
      phone: (phone || "").trim(),
      whatsapp: (whatsapp || "").trim(),
      role: "MASTER_ADMIN",
      passwordSalt: passSalt,
      passwordHash: passHash,
      recoveryKeySalt: recSalt,
      recoveryKeyHash: recHash,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    authDb.users.push(masterUser);
    persistAuthDb();
    const sessionToken = `ST-MA-${import_crypto.default.randomBytes(24).toString("hex")}`;
    const sessionData = {
      token: sessionToken,
      userId: masterUser.id,
      username: masterUser.username,
      role: "MASTER_ADMIN",
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1e3,
      ip: req.ip
    };
    authDb.sessions[sessionToken] = sessionData;
    persistAuthDb();
    recordAuditLog(
      "MASTER_ADMIN_CONFIGURED",
      cleanUser,
      "MASTER_ADMIN",
      "One-time Master Admin account configured and registration permanently locked.",
      void 0,
      req.ip
    );
    return res.json({
      success: true,
      token: sessionToken,
      role: "MASTER_ADMIN",
      user: {
        id: masterUser.id,
        username: masterUser.username,
        fullName: masterUser.fullName,
        phone: masterUser.phone,
        whatsapp: masterUser.whatsapp,
        role: masterUser.role,
        createdAt: masterUser.createdAt
      }
    });
  });
  app.post("/api/auth/master-admin/login", (req, res) => {
    const { username, password } = req.body;
    const cleanUser = (username || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();
    if (!cleanUser || !cleanPass) {
      return res.status(400).json({ success: false, message: "Username and password are required." });
    }
    const clientIp = req.ip || "unknown";
    const attemptKey = `ma_${cleanUser}_${clientIp}`;
    const attemptRecord = authDb.failedAttempts[attemptKey] || { count: 0, lastAttempt: 0 };
    if (attemptRecord.count >= 5 && Date.now() - attemptRecord.lastAttempt < 15 * 60 * 1e3) {
      const waitMinutes = Math.ceil((15 * 60 * 1e3 - (Date.now() - attemptRecord.lastAttempt)) / 6e4);
      return res.status(429).json({
        success: false,
        message: `Account temporarily locked due to failed attempts. Please wait ${waitMinutes} minute(s).`
      });
    }
    const masterAdmin = authDb.users.find(
      (u) => u.role === "MASTER_ADMIN" && u.username?.toLowerCase() === cleanUser
    );
    if (!masterAdmin || !verifyPassword(cleanPass, masterAdmin)) {
      authDb.failedAttempts[attemptKey] = {
        count: (attemptRecord.count || 0) + 1,
        lastAttempt: Date.now()
      };
      persistAuthDb();
      recordAuditLog(
        "MASTER_ADMIN_LOGIN_FAILED",
        cleanUser,
        "MASTER_ADMIN",
        `Failed Master Admin login attempt for ${cleanUser} from IP ${clientIp}`,
        void 0,
        clientIp
      );
      const remaining = 5 - (attemptRecord.count + 1);
      return res.status(401).json({
        success: false,
        message: remaining > 0 ? `Invalid Master Admin credentials. (${remaining} attempt${remaining === 1 ? "" : "s"} remaining)` : `Account locked for 15 minutes due to 5 consecutive failed attempts.`
      });
    }
    delete authDb.failedAttempts[attemptKey];
    const sessionToken = `ST-MA-${import_crypto.default.randomBytes(24).toString("hex")}`;
    const sessionData = {
      token: sessionToken,
      userId: masterAdmin.id,
      username: masterAdmin.username,
      role: "MASTER_ADMIN",
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1e3,
      ip: clientIp
    };
    authDb.sessions[sessionToken] = sessionData;
    persistAuthDb();
    recordAuditLog(
      "MASTER_ADMIN_LOGIN_SUCCESS",
      masterAdmin.username || "admin",
      "MASTER_ADMIN",
      "Master Admin logged in successfully",
      void 0,
      clientIp
    );
    return res.json({
      success: true,
      token: sessionToken,
      role: "MASTER_ADMIN",
      user: {
        id: masterAdmin.id,
        username: masterAdmin.username,
        fullName: masterAdmin.fullName,
        phone: masterAdmin.phone,
        whatsapp: masterAdmin.whatsapp,
        role: masterAdmin.role,
        createdAt: masterAdmin.createdAt
      }
    });
  });
  app.post("/api/auth/master-admin/verify-recovery", (req, res) => {
    const { username, recoveryKey } = req.body;
    const cleanUser = (username || "").trim().toLowerCase();
    const cleanKey = (recoveryKey || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    const masterAdmin = authDb.users.find(
      (u) => u.role === "MASTER_ADMIN" && u.username?.toLowerCase() === cleanUser
    );
    if (!masterAdmin || !masterAdmin.recoveryKeySalt || !masterAdmin.recoveryKeyHash) {
      return res.status(401).json({ success: false, message: "Invalid username or Recovery Key not configured." });
    }
    const calcHash = hashPassword(cleanKey, masterAdmin.recoveryKeySalt, 1e5);
    if (calcHash !== masterAdmin.recoveryKeyHash) {
      return res.status(401).json({ success: false, message: "Invalid Recovery Key provided." });
    }
    return res.json({ success: true, message: "Recovery Key successfully verified." });
  });
  app.post("/api/auth/master-admin/recover", (req, res) => {
    const { username, recoveryKey, newPassword, newRecoveryKey } = req.body;
    const cleanUser = (username || "").trim().toLowerCase();
    const cleanKey = (recoveryKey || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    const cleanPass = (newPassword || "").trim();
    const cleanNewRecKey = (newRecoveryKey || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!cleanPass || cleanPass.length < 8) {
      return res.status(400).json({ success: false, message: "New password must be at least 8 characters long." });
    }
    const masterAdmin = authDb.users.find(
      (u) => u.role === "MASTER_ADMIN" && u.username?.toLowerCase() === cleanUser
    );
    if (!masterAdmin || !masterAdmin.recoveryKeySalt || !masterAdmin.recoveryKeyHash) {
      return res.status(401).json({ success: false, message: "Invalid Master Admin credentials." });
    }
    const calcHash = hashPassword(cleanKey, masterAdmin.recoveryKeySalt, 1e5);
    if (calcHash !== masterAdmin.recoveryKeyHash) {
      return res.status(401).json({ success: false, message: "Invalid Recovery Key provided." });
    }
    const newPassSalt = import_crypto.default.randomBytes(16).toString("hex");
    masterAdmin.passwordSalt = newPassSalt;
    masterAdmin.passwordHash = hashPassword(cleanPass, newPassSalt, 1e5);
    if (cleanNewRecKey && cleanNewRecKey.length >= 16) {
      const newRecSalt = import_crypto.default.randomBytes(16).toString("hex");
      masterAdmin.recoveryKeySalt = newRecSalt;
      masterAdmin.recoveryKeyHash = hashPassword(cleanNewRecKey, newRecSalt, 1e5);
    }
    persistAuthDb();
    recordAuditLog(
      "MASTER_ADMIN_RECOVERED",
      cleanUser,
      "MASTER_ADMIN",
      "Master Admin password was reset via Recovery Key.",
      void 0,
      req.ip
    );
    return res.json({ success: true, message: "Master Admin password reset successfully." });
  });
  app.post("/api/auth/master-admin/reset-password", (req, res) => {
    const { username, recoveryKey, newPassword, confirmPassword, newRecoveryKey } = req.body;
    const cleanUser = (username || "").trim().toLowerCase();
    const cleanKey = (recoveryKey || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    const cleanPass = (newPassword || "").trim();
    const cleanConfirm = (confirmPassword || "").trim();
    const clientIp = req.ip || "unknown";
    const attemptKey = `reset_ma_${cleanUser}_${clientIp}`;
    const attemptRecord = authDb.failedAttempts[attemptKey] || { count: 0, lastAttempt: 0 };
    if (attemptRecord.count >= 5 && Date.now() - attemptRecord.lastAttempt < 15 * 60 * 1e3) {
      const waitMinutes = Math.ceil((15 * 60 * 1e3 - (Date.now() - attemptRecord.lastAttempt)) / 6e4);
      return res.status(429).json({
        success: false,
        message: `Too many failed password reset attempts. System locked for ${waitMinutes} minute(s) to protect the device.`
      });
    }
    if (!cleanUser) {
      return res.status(400).json({ success: false, message: "Master Admin username is required." });
    }
    if (!cleanKey || cleanKey.length < 16) {
      return res.status(400).json({ success: false, message: "A valid Master Recovery Key (16-20 characters) is required." });
    }
    if (!cleanPass || cleanPass.length < 8) {
      return res.status(400).json({ success: false, message: "New password must be at least 8 characters long." });
    }
    if (cleanConfirm && cleanPass !== cleanConfirm) {
      return res.status(400).json({ success: false, message: "New password and Confirm password do not match." });
    }
    const masterAdmin = authDb.users.find(
      (u) => u.role === "MASTER_ADMIN" && u.username?.toLowerCase() === cleanUser
    );
    if (!masterAdmin || !masterAdmin.recoveryKeySalt || !masterAdmin.recoveryKeyHash) {
      authDb.failedAttempts[attemptKey] = {
        count: (attemptRecord.count || 0) + 1,
        lastAttempt: Date.now()
      };
      persistAuthDb();
      return res.status(401).json({
        success: false,
        message: "Invalid Master Admin username or Recovery Key not configured on this device."
      });
    }
    const calcHash = hashPassword(cleanKey, masterAdmin.recoveryKeySalt, 1e5);
    if (calcHash !== masterAdmin.recoveryKeyHash) {
      authDb.failedAttempts[attemptKey] = {
        count: (attemptRecord.count || 0) + 1,
        lastAttempt: Date.now()
      };
      persistAuthDb();
      recordAuditLog(
        "MASTER_ADMIN_RESET_FAILED",
        cleanUser,
        "MASTER_ADMIN",
        `Failed Master Admin password reset attempt with invalid Recovery Key from IP ${clientIp}`,
        void 0,
        clientIp
      );
      const remaining = 5 - (attemptRecord.count + 1);
      return res.status(401).json({
        success: false,
        message: remaining > 0 ? `Invalid Master Recovery Key. (${remaining} attempt${remaining === 1 ? "" : "s"} remaining)` : "Too many failed attempts. Password reset locked for 15 minutes."
      });
    }
    delete authDb.failedAttempts[attemptKey];
    const newPassSalt = import_crypto.default.randomBytes(16).toString("hex");
    masterAdmin.passwordSalt = newPassSalt;
    masterAdmin.passwordHash = hashPassword(cleanPass, newPassSalt, 1e5);
    if (newRecoveryKey) {
      const cleanNewRecKey = (newRecoveryKey || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (cleanNewRecKey.length >= 16) {
        const newRecSalt = import_crypto.default.randomBytes(16).toString("hex");
        masterAdmin.recoveryKeySalt = newRecSalt;
        masterAdmin.recoveryKeyHash = hashPassword(cleanNewRecKey, newRecSalt, 1e5);
      }
    }
    persistAuthDb();
    recordAuditLog(
      "MASTER_ADMIN_PASSWORD_RESET",
      cleanUser,
      "MASTER_ADMIN",
      "Master Admin password was reset successfully using Master Recovery Key.",
      void 0,
      clientIp
    );
    return res.json({
      success: true,
      message: "Master Password Reset Successfully",
      user: {
        id: masterAdmin.id,
        username: masterAdmin.username,
        fullName: masterAdmin.fullName,
        role: masterAdmin.role
      }
    });
  });
  app.post("/api/auth/master-admin/change-password", (req, res) => {
    const session = getSessionFromReq(req);
    if (!session || session.role !== "MASTER_ADMIN") {
      return res.status(401).json({ success: false, message: "Master Admin authentication required." });
    }
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.trim().length < 8) {
      return res.status(400).json({ success: false, message: "New password must be at least 8 characters long." });
    }
    const masterAdmin = authDb.users.find((u) => u.id === session.userId && u.role === "MASTER_ADMIN");
    if (!masterAdmin || !verifyPassword(currentPassword, masterAdmin)) {
      return res.status(401).json({ success: false, message: "Incorrect current password." });
    }
    const newSalt = import_crypto.default.randomBytes(16).toString("hex");
    masterAdmin.passwordSalt = newSalt;
    masterAdmin.passwordHash = hashPassword(newPassword.trim(), newSalt, 1e5);
    persistAuthDb();
    recordAuditLog(
      "MASTER_ADMIN_PASSWORD_CHANGED",
      masterAdmin.username || "admin",
      "MASTER_ADMIN",
      "Master Admin password changed.",
      void 0,
      req.ip
    );
    return res.json({ success: true, message: "Master Admin password successfully updated." });
  });
  app.post("/api/auth/master-admin/update-recovery-key", (req, res) => {
    const session = getSessionFromReq(req);
    if (!session || session.role !== "MASTER_ADMIN") {
      return res.status(401).json({ success: false, message: "Master Admin authentication required." });
    }
    const { currentPassword, newRecoveryKey } = req.body;
    const cleanKey = (newRecoveryKey || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!cleanKey || cleanKey.length < 16) {
      return res.status(400).json({ success: false, message: "Invalid replacement Recovery Key." });
    }
    const masterAdmin = authDb.users.find((u) => u.id === session.userId && u.role === "MASTER_ADMIN");
    if (!masterAdmin || !verifyPassword(currentPassword, masterAdmin)) {
      return res.status(401).json({ success: false, message: "Incorrect password." });
    }
    const newSalt = import_crypto.default.randomBytes(16).toString("hex");
    masterAdmin.recoveryKeySalt = newSalt;
    masterAdmin.recoveryKeyHash = hashPassword(cleanKey, newSalt, 1e5);
    persistAuthDb();
    recordAuditLog(
      "RECOVERY_KEY_REGENERATED",
      masterAdmin.username || "admin",
      "MASTER_ADMIN",
      "Master Admin Recovery Key regenerated and old key invalidated.",
      void 0,
      req.ip
    );
    return res.json({ success: true, message: "Recovery Key regenerated successfully." });
  });
  app.post("/api/auth/shop-owner/login", (req, res) => {
    const { username, email, password } = req.body;
    const cleanIdentifier = (username || email || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();
    if (!cleanIdentifier || !cleanPass) {
      return res.status(400).json({
        success: false,
        message: "Shop username and password are required."
      });
    }
    const clientIp = req.ip || "unknown";
    const shopUser = authDb.users.find(
      (u) => u.role === "SHOP_OWNER" && (u.username && u.username.toLowerCase() === cleanIdentifier || u.email && u.email.toLowerCase() === cleanIdentifier || u.secondaryEmails && u.secondaryEmails.some((se) => se.toLowerCase() === cleanIdentifier))
    );
    if (!shopUser || !verifyPassword(cleanPass, shopUser)) {
      recordAuditLog(
        "SHOP_LOGIN_FAILED",
        cleanIdentifier,
        "SHOP_OWNER",
        `Failed Shop login attempt for ${cleanIdentifier} from IP ${clientIp}`,
        shopUser?.shopId,
        clientIp
      );
      return res.status(401).json({
        success: false,
        message: "Invalid credentials. Only registered Shop accounts created by Master Admin can log in."
      });
    }
    checkAndAutoExpireSubscriptions();
    const shop = subscriptionsDb.shops.find(
      (s) => s.id === shopUser.shopId || s.email?.toLowerCase() === cleanIdentifier
    );
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop account record not found on this device."
      });
    }
    if (shop.status === "inactive" || shop.status === "suspended" || shop.status === "blocked") {
      return res.status(403).json({
        success: false,
        message: `Account inactive: This shop account (${shop.shopName}) has been deactivated by the Master Admin.`
      });
    }
    const sessionToken = `ST-SO-${import_crypto.default.randomBytes(24).toString("hex")}`;
    const sessionData = {
      token: sessionToken,
      userId: shopUser.id,
      email: shopUser.email,
      username: shopUser.username,
      role: "SHOP_OWNER",
      shopId: shop.id,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1e3,
      ip: clientIp
    };
    authDb.sessions[sessionToken] = sessionData;
    persistAuthDb();
    recordAuditLog(
      "SHOP_LOGIN_SUCCESS",
      shopUser.username || shopUser.email || cleanIdentifier,
      "SHOP_OWNER",
      `Shop Owner logged in for ${shop.shopName} (${shop.id})`,
      shop.id,
      clientIp
    );
    return res.json({
      success: true,
      token: sessionToken,
      role: "SHOP_OWNER",
      user: {
        id: shopUser.id,
        email: shopUser.email,
        username: shopUser.username,
        fullName: shopUser.fullName,
        phone: shopUser.phone,
        whatsapp: shopUser.whatsapp,
        role: shopUser.role,
        shopId: shop.id,
        shopName: shop.shopName,
        mustChangePasswordOnFirstLogin: !!shopUser.mustChangePasswordOnFirstLogin,
        createdAt: shopUser.createdAt
      },
      shop,
      subscriptionStatus: shop.status
    });
  });
  app.post("/api/auth/verify-session", (req, res) => {
    const session = getSessionFromReq(req);
    if (!session) {
      return res.status(401).json({ success: false, valid: false, message: "No valid authenticated session." });
    }
    const user = authDb.users.find((u) => u.id === session.userId);
    if (!user) {
      return res.status(401).json({ success: false, valid: false, message: "User profile no longer exists." });
    }
    let shop = void 0;
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
        createdAt: user.createdAt
      },
      shop,
      subscriptionStatus: shop?.status
    });
  });
  app.post("/api/auth/change-password", (req, res) => {
    const session = getSessionFromReq(req);
    if (!session) {
      return res.status(401).json({ success: false, message: "Authentication required to change password." });
    }
    const { oldPassword, newPassword } = req.body;
    if (!newPassword || newPassword.trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long."
      });
    }
    const user = authDb.users.find((u) => u.id === session.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User account not found." });
    }
    if (!user.mustChangePasswordOnFirstLogin) {
      if (!oldPassword || !verifyPassword(oldPassword.trim(), user)) {
        return res.status(400).json({ success: false, message: "Current password is incorrect." });
      }
    }
    const newSalt = import_crypto.default.randomBytes(16).toString("hex");
    const newHash = hashPassword(newPassword.trim(), newSalt);
    user.passwordSalt = newSalt;
    user.passwordHash = newHash;
    user.mustChangePasswordOnFirstLogin = false;
    delete user.temporaryPassword;
    persistAuthDb();
    if (user.shopId) {
      const shop = subscriptionsDb.shops.find((s) => s.id === user.shopId);
      if (shop) {
        shop.mustChangePasswordOnFirstLogin = false;
        persistSubscriptions();
      }
    }
    recordAuditLog(
      "PASSWORD_CHANGED",
      user.email || user.username || "user",
      user.role,
      `User ${user.email || user.username} changed their password successfully`,
      user.shopId,
      req.ip
    );
    return res.json({
      success: true,
      message: "Password updated successfully."
    });
  });
  app.post("/api/auth/forgot-password", (req, res) => {
    const { email, role } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail) {
      return res.status(400).json({ success: false, message: "Please provide registered email." });
    }
    const user = authDb.users.find(
      (u) => (!role || u.role === role) && (u.email && u.email.toLowerCase() === cleanEmail || u.secondaryEmails && u.secondaryEmails.some((se) => se.toLowerCase() === cleanEmail))
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No registered account found with this email."
      });
    }
    const resetCode = Math.floor(1e5 + Math.random() * 9e5).toString();
    user.resetToken = resetCode;
    user.resetTokenExpiry = Date.now() + 30 * 60 * 1e3;
    persistAuthDb();
    recordAuditLog(
      "PASSWORD_RESET_REQUESTED",
      user.email || user.username || "user",
      user.role,
      `Password reset code generated for ${user.email || user.username}`,
      user.shopId,
      req.ip
    );
    return res.json({
      success: true,
      message: `Security reset code generated successfully for ${cleanEmail}.`,
      resetCode,
      // Displayed in UI confirmation for instant self-hosted verification
      expiresMinutes: 30,
      contact: {
        owner: "Muhammad Waqas",
        whatsapp: "03228570782"
      }
    });
  });
  app.post("/api/auth/reset-password", (req, res) => {
    const { email, resetCode, newPassword } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanCode = (resetCode || "").trim();
    const cleanPass = (newPassword || "").trim();
    if (!cleanEmail || !cleanCode || !cleanPass) {
      return res.status(400).json({
        success: false,
        message: "Email, verification code, and new password are required."
      });
    }
    if (cleanPass.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters."
      });
    }
    const user = authDb.users.find(
      (u) => u.email && u.email.toLowerCase() === cleanEmail || u.secondaryEmails && u.secondaryEmails.some((se) => se.toLowerCase() === cleanEmail)
    );
    if (!user || user.resetToken !== cleanCode || !user.resetTokenExpiry || user.resetTokenExpiry < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification reset code."
      });
    }
    const newSalt = import_crypto.default.randomBytes(16).toString("hex");
    const newHash = hashPassword(cleanPass, newSalt);
    user.passwordSalt = newSalt;
    user.passwordHash = newHash;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    user.mustChangePasswordOnFirstLogin = false;
    delete user.temporaryPassword;
    persistAuthDb();
    recordAuditLog(
      "PASSWORD_RESET_SUCCESS",
      user.email || user.username || "user",
      user.role,
      `User ${user.email || user.username} reset their password using verification code`,
      user.shopId,
      req.ip
    );
    return res.json({
      success: true,
      message: "Password reset successfully! Please log in with your new password."
    });
  });
  app.post("/api/auth/logout", (req, res) => {
    const session = getSessionFromReq(req);
    if (session) {
      delete authDb.sessions[session.token];
      persistAuthDb();
      recordAuditLog("LOGOUT", session.email || session.username || "user", session.role, "User signed out", session.shopId, req.ip);
    }
    return res.json({ success: true, message: "Logged out successfully." });
  });
  app.post("/api/auth/login", (req, res) => {
    const { identifier, pin, deviceName, deviceType, browser, os } = req.body;
    const cleanId = (identifier || "").trim().toLowerCase();
    const validEmails = ["muhammedsaad255251@gmail.com", "waqasmart.pos@gmail.com"];
    const validPhones = ["+923001234567", "03001234567", "0300-1234567", "3001234567", "03228570782", "03429634133"];
    const isAuthorizedId = validEmails.includes(cleanId) || validPhones.includes(cleanId.replace(/\s+/g, "")) || cleanId === "owner" || cleanId === "admin";
    if (!isAuthorizedId) {
      return res.status(401).json({
        success: false,
        message: "Invalid account email or mobile number. Unauthorized account."
      });
    }
    const deviceId = `DEV-${import_crypto.default.randomBytes(3).toString("hex").toUpperCase()}-${import_crypto.default.randomBytes(3).toString("hex").toUpperCase()}`;
    const sessionToken = `ST-${import_crypto.default.randomBytes(16).toString("hex")}`;
    const newDevice = {
      deviceId,
      sessionToken,
      deviceName: deviceName || "Store Terminal",
      deviceType: deviceType || "Android Mobile",
      browser: browser || "Web Browser",
      os: os || "Mobile OS",
      isCurrentDevice: false,
      firstRegistered: (/* @__PURE__ */ new Date()).toLocaleDateString("en-GB"),
      lastActive: (/* @__PURE__ */ new Date()).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" }),
      status: "active",
      connectionState: "online"
    };
    registeredDevices.push(newDevice);
    persistDevices();
    broadcastSyncEvent({
      type: "device:updated",
      timestamp: Date.now(),
      payload: registeredDevices
    });
    return res.json({
      success: true,
      user: storeDb.userProfile,
      device: newDevice,
      sessionToken,
      storeState: storeDb
    });
  });
  app.post("/api/devices/pairing-session", (_req, res) => {
    const pairingToken = import_crypto.default.randomBytes(16).toString("hex");
    const manualCode = `WM-${Math.floor(1e3 + Math.random() * 9e3)}`;
    const createdAt = Date.now();
    const expiresAt = createdAt + 5 * 60 * 1e3;
    const session = {
      pairingToken,
      manualCode,
      createdAt,
      expiresAt,
      status: "pending_scan"
    };
    pairingSessions.set(pairingToken, session);
    return res.json({
      success: true,
      pairingToken,
      manualCode,
      expiresAt,
      storeName: storeDb.branding.storeName || "WAQAS MART",
      subtitle: storeDb.branding.subtitle || "Supermarket Management"
    });
  });
  app.get("/api/devices/pairing-status/:token", (req, res) => {
    const { token } = req.params;
    let session = pairingSessions.get(token);
    if (!session) {
      for (const s of pairingSessions.values()) {
        if (s.manualCode.toUpperCase() === token.toUpperCase()) {
          session = s;
          break;
        }
      }
    }
    if (!session) {
      return res.status(404).json({ success: false, message: "Pairing session not found or expired." });
    }
    if (Date.now() > session.expiresAt && session.status !== "approved") {
      session.status = "expired";
      return res.json({ success: true, session });
    }
    let authPayload = null;
    if (session.status === "approved" && session.approvedDeviceId) {
      const approvedDev = registeredDevices.find((d) => d.deviceId === session?.approvedDeviceId);
      authPayload = {
        sessionToken: approvedDev?.sessionToken,
        device: approvedDev,
        user: storeDb.userProfile,
        storeState: storeDb
      };
    }
    return res.json({
      success: true,
      session,
      auth: authPayload
    });
  });
  app.post("/api/devices/pair", (req, res) => {
    const { tokenOrCode, device } = req.body;
    if (!tokenOrCode || !device?.deviceId) {
      return res.status(400).json({ success: false, message: "Invalid pairing request payload." });
    }
    let session = pairingSessions.get(tokenOrCode);
    if (!session) {
      for (const s of pairingSessions.values()) {
        if (s.manualCode.toUpperCase() === tokenOrCode.trim().toUpperCase()) {
          session = s;
          break;
        }
      }
    }
    if (!session) {
      return res.status(404).json({ success: false, message: "Invalid or expired QR code." });
    }
    if (Date.now() > session.expiresAt) {
      session.status = "expired";
      return res.status(410).json({ success: false, message: "This QR pairing code has expired." });
    }
    if (session.status === "rejected") {
      return res.status(403).json({ success: false, message: "Pairing was rejected by the store owner." });
    }
    session.candidateDevice = {
      deviceId: device.deviceId,
      deviceName: device.deviceName || "New Terminal",
      deviceType: device.deviceType || "Android Mobile",
      browser: device.browser || "Browser",
      os: device.os || "OS"
    };
    session.status = "pending_approval";
    broadcastSyncEvent({
      type: "device:pairing_request",
      timestamp: Date.now(),
      payload: {
        pairingToken: session.pairingToken,
        candidateDevice: session.candidateDevice
      }
    });
    return res.json({
      success: true,
      message: "Pairing request submitted. Waiting for owner approval.",
      session
    });
  });
  app.post("/api/devices/approve-pairing", (req, res) => {
    const { pairingToken, approve } = req.body;
    const session = pairingSessions.get(pairingToken);
    if (!session) {
      return res.status(404).json({ success: false, message: "Pairing session not found." });
    }
    if (!approve) {
      session.status = "rejected";
      broadcastSyncEvent({
        type: "device:updated",
        timestamp: Date.now(),
        payload: { pairingToken, status: "rejected" }
      });
      return res.json({ success: true, message: "Device pairing rejected." });
    }
    if (!session.candidateDevice) {
      return res.status(400).json({ success: false, message: "No candidate device scanned this code." });
    }
    const sessionToken = `ST-${import_crypto.default.randomBytes(16).toString("hex")}`;
    const newDev = {
      deviceId: session.candidateDevice.deviceId,
      sessionToken,
      deviceName: session.candidateDevice.deviceName,
      deviceType: session.candidateDevice.deviceType,
      browser: session.candidateDevice.browser,
      os: session.candidateDevice.os,
      isCurrentDevice: false,
      firstRegistered: (/* @__PURE__ */ new Date()).toLocaleDateString("en-GB"),
      lastActive: (/* @__PURE__ */ new Date()).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" }),
      status: "active",
      connectionState: "online"
    };
    registeredDevices = registeredDevices.filter((d) => d.deviceId !== newDev.deviceId);
    registeredDevices.push(newDev);
    persistDevices();
    session.status = "approved";
    session.approvedDeviceId = newDev.deviceId;
    broadcastSyncEvent({
      type: "device:approved",
      timestamp: Date.now(),
      payload: {
        pairingToken,
        device: newDev
      }
    });
    broadcastSyncEvent({
      type: "device:updated",
      timestamp: Date.now(),
      payload: registeredDevices
    });
    return res.json({
      success: true,
      message: "Device successfully authorized!",
      device: newDev
    });
  });
  app.post("/api/devices/cancel-pairing", (req, res) => {
    const { pairingToken } = req.body;
    if (pairingToken && pairingSessions.has(pairingToken)) {
      const s = pairingSessions.get(pairingToken);
      s.status = "cancelled";
      pairingSessions.delete(pairingToken);
    }
    return res.json({ success: true, message: "Pairing cancelled." });
  });
  app.get("/api/devices", (_req, res) => {
    const now = Date.now();
    const list = registeredDevices.map((d) => {
      const hasLiveSse = Array.from(sseClients.values()).some((c) => c.deviceId === d.deviceId);
      return {
        ...d,
        connectionState: hasLiveSse ? "online" : "offline"
      };
    });
    return res.json({ success: true, devices: list });
  });
  app.post("/api/devices/:id/rename", (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const target = registeredDevices.find((d) => d.deviceId === id);
    if (!target) {
      return res.status(404).json({ success: false, message: "Device not found." });
    }
    target.deviceName = name || target.deviceName;
    persistDevices();
    broadcastSyncEvent({
      type: "device:updated",
      timestamp: Date.now(),
      payload: registeredDevices
    });
    return res.json({ success: true, device: target });
  });
  app.post("/api/devices/:id/revoke", (req, res) => {
    const { id } = req.params;
    const target = registeredDevices.find((d) => d.deviceId === id);
    if (!target) {
      return res.status(404).json({ success: false, message: "Device not found." });
    }
    target.status = "revoked";
    persistDevices();
    broadcastSyncEvent({
      type: "device:revoked",
      sourceDeviceId: id,
      timestamp: Date.now(),
      payload: { deviceId: id }
    });
    broadcastSyncEvent({
      type: "device:updated",
      timestamp: Date.now(),
      payload: registeredDevices
    });
    return res.json({ success: true, message: "Device access revoked successfully." });
  });
  app.delete("/api/devices/:id", (req, res) => {
    const { id } = req.params;
    registeredDevices = registeredDevices.filter((d) => d.deviceId !== id);
    persistDevices();
    broadcastSyncEvent({
      type: "device:revoked",
      timestamp: Date.now(),
      payload: { deviceId: id }
    });
    broadcastSyncEvent({
      type: "device:updated",
      timestamp: Date.now(),
      payload: registeredDevices
    });
    return res.json({ success: true, message: "Device removed." });
  });
  app.get("/api/sync/events", (req, res) => {
    const deviceId = req.query.deviceId || req.headers["x-device-id"] || "UNKNOWN-DEV";
    const dev = registeredDevices.find((d) => d.deviceId === deviceId);
    if (dev && dev.status === "revoked") {
      return res.status(403).json({ success: false, message: "Device is revoked." });
    }
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();
    const clientId = `CLIENT-${import_crypto.default.randomBytes(8).toString("hex")}`;
    const client = {
      id: clientId,
      res,
      deviceId,
      ip: req.ip || "",
      connectedAt: Date.now()
    };
    sseClients.set(clientId, client);
    if (dev) {
      dev.lastActive = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" });
    }
    res.write(
      `data: ${JSON.stringify({
        type: "ping",
        timestamp: Date.now(),
        message: "Connected to WAQAS MART Live Sync Engine"
      })}

`
    );
    broadcastSyncEvent({
      type: "device:updated",
      timestamp: Date.now(),
      payload: registeredDevices
    });
    req.on("close", () => {
      sseClients.delete(clientId);
      broadcastSyncEvent({
        type: "device:updated",
        timestamp: Date.now(),
        payload: registeredDevices
      });
    });
  });
  app.get("/api/store/state", (req, res) => {
    const session = getSessionFromReq(req);
    const targetShopId = req.query.shopId || session?.shopId || req.headers["x-shop-id"] || "SHOP-WM-001";
    const shopData = loadShopStoreData(targetShopId);
    return res.json({
      success: true,
      shopId: targetShopId,
      store: shopData
    });
  });
  app.post("/api/store/sync", (req, res) => {
    const { action, payload, sourceDeviceId } = req.body;
    if (sourceDeviceId) {
      const dev = registeredDevices.find((d) => d.deviceId === sourceDeviceId);
      if (dev && dev.status === "revoked") {
        return res.status(403).json({ success: false, message: "Device access has been revoked." });
      }
      if (dev) {
        dev.lastActive = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" });
      }
    }
    const session = getSessionFromReq(req);
    const shopId = session?.shopId || req.headers["x-shop-id"] || "SHOP-WM-001";
    checkAndAutoExpireSubscriptions();
    const shop = subscriptionsDb.shops.find((s) => s.id === shopId);
    if (shop && (shop.status === "expired" || shop.status === "suspended" || shop.status === "blocked")) {
      return res.status(403).json({
        success: false,
        error: "SUBSCRIPTION_LOCKED",
        message: `Subscription for ${shop.shopName} (${shop.id}) is ${shop.status.toUpperCase()}. POS operations are locked. Contact Muhammad Waqas (03228570782) to renew. All your data is safely preserved.`,
        shopId: shop.id,
        shopName: shop.shopName,
        status: shop.status,
        expiryDate: shop.expiryDate,
        whatsapp: "03228570782"
      });
    }
    switch (action) {
      case "create_sale": {
        const tx = payload;
        if (!tx || !tx.invoiceNumber) {
          return res.status(400).json({ success: false, message: "Invalid transaction payload." });
        }
        const exists = storeDb.transactions.some((t) => t.invoiceNumber === tx.invoiceNumber);
        if (!exists) {
          storeDb.transactions.unshift(tx);
          tx.items.forEach((item) => {
            const product = storeDb.products.find((p) => p.id === item.product.id);
            if (product) {
              product.stock = (Number(product.stock) || 0) - item.quantity;
            }
          });
          if (tx.paymentMethod === "credit" && (tx.customerId || tx.customerName)) {
            const entry = {
              id: `LED-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              customerId: tx.customerId || "CUST-GENERAL",
              date: tx.dateTime,
              details: `Sales Invoice #${tx.invoiceNumber}`,
              invoiceNumber: tx.invoiceNumber,
              credit: tx.grandTotal,
              debit: 0,
              runningBalance: 0,
              paymentMethod: "Credit / Pay Later",
              createdAt: (/* @__PURE__ */ new Date()).toISOString()
            };
            storeDb.customerLedgers.push(entry);
          }
          persistStore();
          broadcastSyncEvent({
            type: "sale:completed",
            sourceDeviceId,
            timestamp: Date.now(),
            payload: {
              transaction: tx,
              updatedProducts: storeDb.products,
              customerLedgers: storeDb.customerLedgers
            }
          });
        }
        return res.json({ success: true, store: storeDb });
      }
      case "create_purchase": {
        const purchase = payload;
        if (!purchase) {
          return res.status(400).json({ success: false, message: "Invalid purchase payload." });
        }
        const exists = storeDb.purchases.some((p) => p.purchaseInvoiceNo === purchase.purchaseInvoiceNo);
        if (!exists) {
          storeDb.purchases.unshift(purchase);
          purchase.items.forEach((item) => {
            const product = storeDb.products.find((p) => p.id === item.productId);
            if (product) {
              product.stock = (Number(product.stock) || 0) + item.quantity;
              product.costPrice = item.purchaseCost;
            }
          });
          persistStore();
          broadcastSyncEvent({
            type: "purchase:added",
            sourceDeviceId,
            timestamp: Date.now(),
            payload: {
              purchase,
              updatedProducts: storeDb.products
            }
          });
        }
        return res.json({ success: true, store: storeDb });
      }
      case "process_return": {
        const ret = payload;
        if (!ret) {
          return res.status(400).json({ success: false, message: "Invalid return payload." });
        }
        const exists = storeDb.saleReturns.some((r) => r.returnNumber === ret.returnNumber);
        if (!exists) {
          storeDb.saleReturns.unshift(ret);
          ret.items.forEach((item) => {
            if (item.condition === "resaleable") {
              const product = storeDb.products.find((p) => p.id === item.productId);
              if (product) {
                product.stock = (Number(product.stock) || 0) + item.quantity;
              }
            }
          });
          if (ret.refundMethod === "credit" && ret.customerId) {
            const entry = {
              id: `LED-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              customerId: ret.customerId,
              date: ret.dateTime,
              details: `Sale Return #${ret.returnNumber}`,
              invoiceNumber: ret.originalInvoiceNumber,
              credit: 0,
              debit: ret.totalRefund,
              runningBalance: 0,
              paymentMethod: "Credit Adjustment",
              createdAt: (/* @__PURE__ */ new Date()).toISOString()
            };
            storeDb.customerLedgers.push(entry);
          }
          persistStore();
          broadcastSyncEvent({
            type: "return:processed",
            sourceDeviceId,
            timestamp: Date.now(),
            payload: {
              saleReturn: ret,
              updatedProducts: storeDb.products,
              customerLedgers: storeDb.customerLedgers
            }
          });
        }
        return res.json({ success: true, store: storeDb });
      }
      case "update_stock": {
        const updatedProducts = payload;
        if (Array.isArray(updatedProducts)) {
          storeDb.products = updatedProducts;
          persistStore();
          broadcastSyncEvent({
            type: "stock:updated",
            sourceDeviceId,
            timestamp: Date.now(),
            payload: storeDb.products
          });
        }
        return res.json({ success: true, store: storeDb });
      }
      case "update_customer_ledger": {
        const { customers, ledgerEntries } = payload;
        if (Array.isArray(customers)) storeDb.customers = customers;
        if (Array.isArray(ledgerEntries)) storeDb.customerLedgers = ledgerEntries;
        persistStore();
        broadcastSyncEvent({
          type: "customer:ledger_updated",
          sourceDeviceId,
          timestamp: Date.now(),
          payload: {
            customers: storeDb.customers,
            customerLedgers: storeDb.customerLedgers
          }
        });
        return res.json({ success: true, store: storeDb });
      }
      case "update_branding": {
        const branding = payload;
        if (branding) {
          storeDb.branding = branding;
          persistStore();
          broadcastSyncEvent({
            type: "store:sync",
            sourceDeviceId,
            timestamp: Date.now(),
            payload: storeDb
          });
        }
        return res.json({ success: true, store: storeDb });
      }
      case "update_held_bills": {
        const heldBills = payload;
        if (Array.isArray(heldBills)) {
          storeDb.heldBills = heldBills;
          persistStore();
          broadcastSyncEvent({
            type: "store:sync",
            sourceDeviceId,
            timestamp: Date.now(),
            payload: storeDb
          });
        }
        return res.json({ success: true, store: storeDb });
      }
      case "delete_held_bill": {
        const { billId } = payload || {};
        if (billId) {
          storeDb.heldBills = (storeDb.heldBills || []).filter((b) => b.id !== billId);
          persistStore();
          broadcastSyncEvent({
            type: "store:sync",
            sourceDeviceId,
            timestamp: Date.now(),
            payload: storeDb
          });
        }
        return res.json({ success: true, store: storeDb });
      }
      case "sync_full": {
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
          type: "store:sync",
          sourceDeviceId,
          timestamp: Date.now(),
          payload: storeDb
        });
        return res.json({ success: true, store: storeDb });
      }
      case "reset_all_zero": {
        storeDb.products = [];
        storeDb.transactions = [];
        storeDb.purchases = [];
        storeDb.customers = [];
        storeDb.customerLedgers = [];
        storeDb.saleReturns = [];
        storeDb.heldBills = [];
        persistStore();
        broadcastSyncEvent({
          type: "store:sync",
          sourceDeviceId,
          timestamp: Date.now(),
          payload: storeDb
        });
        return res.json({ success: true, message: "All store data reset to clean zero state.", store: storeDb });
      }
      case "load_seed_catalog": {
        storeDb.products = SEED_CATALOG_PRODUCTS;
        persistStore();
        broadcastSyncEvent({
          type: "store:sync",
          sourceDeviceId,
          timestamp: Date.now(),
          payload: storeDb
        });
        return res.json({ success: true, message: "Reference 15 picture products loaded.", store: storeDb });
      }
      default:
        return res.status(400).json({ success: false, message: `Unknown action: ${action}` });
    }
  });
  app.get("/api/subscriptions/overview", (_req, res) => {
    const totalIncome = subscriptionsDb.payments.reduce((sum, p) => sum + (p.finalAmount || 0), 0);
    const amountReceived = subscriptionsDb.payments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
    const outstandingBalance = subscriptionsDb.shops.reduce((sum, s) => sum + (s.remainingBalance || 0), 0);
    const currentYearMonth = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
    const thisMonthIncome = subscriptionsDb.payments.filter((p) => (p.paymentDate || "").startsWith(currentYearMonth)).reduce((sum, p) => sum + (p.amountPaid || 0), 0);
    const currentYear = (/* @__PURE__ */ new Date()).getFullYear().toString();
    const thisYearIncome = subscriptionsDb.payments.filter((p) => (p.paymentDate || "").startsWith(currentYear)).reduce((sum, p) => sum + (p.amountPaid || 0), 0);
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
        activeShops: subscriptionsDb.shops.filter((s) => s.status === "active").length,
        expiringSoon: subscriptionsDb.shops.filter((s) => s.status === "expiring_soon").length,
        expiredShops: subscriptionsDb.shops.filter((s) => s.status === "expired").length,
        suspendedShops: subscriptionsDb.shops.filter((s) => s.status === "suspended").length,
        blockedShops: subscriptionsDb.shops.filter((s) => s.status === "blocked").length
      },
      shops: subscriptionsDb.shops,
      payments: subscriptionsDb.payments,
      renewals: subscriptionsDb.renewals
    });
  });
  app.get("/api/subscriptions/shops", (_req, res) => {
    return res.json({ success: true, shops: subscriptionsDb.shops });
  });
  app.post("/api/subscriptions/shops", (req, res) => {
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
      customTemporaryPassword
    } = req.body;
    if (!shopName || !ownerName || !email) {
      return res.status(400).json({ success: false, message: "Shop name, owner name, and email are required." });
    }
    const cleanEmail = email.trim().toLowerCase();
    if (subscriptionsDb.shops.some((s) => s.email.toLowerCase() === cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "A shop account with this email already exists. Each shop must have a unique email."
      });
    }
    const uniqueShopId = `SHOP-WM-${100 + subscriptionsDb.shops.length + 1}`;
    const initialPaid = Number(initialPayment) || 0;
    const standardPlanPrices = {
      "1_month": pricing?.oneMonth || 1500,
      "3_months": pricing?.threeMonths || 4e3,
      "6_months": pricing?.sixMonths || 7500,
      "12_months": pricing?.twelveMonths || 14e3,
      custom: pricing?.customPricePerMonth || 1500
    };
    const totalCost = standardPlanPrices[plan || "1_month"] || 1500;
    const remainingBalance = Math.max(0, totalCost - initialPaid);
    const tempPassword = (customTemporaryPassword || "").trim() || `Waqas@${Math.floor(1e3 + Math.random() * 9e3)}`;
    const newShop = {
      id: uniqueShopId,
      shopName: shopName.trim(),
      ownerName: ownerName.trim(),
      email: cleanEmail,
      phone: phone || "",
      whatsapp: whatsapp || "",
      address: address || "",
      status: "active",
      plan: plan || "1_month",
      startDate: startDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      expiryDate: expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
      pricing: {
        oneMonth: pricing?.oneMonth || 1500,
        threeMonths: pricing?.threeMonths || 4e3,
        sixMonths: pricing?.sixMonths || 7500,
        twelveMonths: pricing?.twelveMonths || 14e3,
        customPricePerMonth: pricing?.customPricePerMonth || 1500,
        lastUpdated: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      },
      initialPayment: initialPaid,
      remainingBalance,
      totalPaid: initialPaid,
      totalIncome: totalCost,
      renewalsCount: 0,
      mustChangePasswordOnFirstLogin: true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    subscriptionsDb.shops.unshift(newShop);
    const salt = import_crypto.default.randomBytes(16).toString("hex");
    const hash = hashPassword(tempPassword, salt);
    const newAuthUser = {
      id: `USR-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      email: cleanEmail,
      fullName: newShop.ownerName,
      phone: newShop.phone,
      whatsapp: newShop.whatsapp,
      role: "SHOP_OWNER",
      shopId: uniqueShopId,
      passwordSalt: salt,
      passwordHash: hash,
      temporaryPassword: tempPassword,
      mustChangePasswordOnFirstLogin: true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    authDb.users.push(newAuthUser);
    persistAuthDb();
    if (initialPaid > 0) {
      const receiptNumber = `RCP-${Math.floor(1e3 + Math.random() * 9e3)}`;
      const paymentRecord = {
        id: `PAY-${Date.now()}`,
        receiptNumber,
        shopId: uniqueShopId,
        shopName: newShop.shopName,
        ownerName: newShop.ownerName,
        ownerEmail: newShop.email,
        plan: newShop.plan,
        durationLabel: newShop.plan.replace("_", " ").toUpperCase(),
        totalAmount: totalCost,
        discount: 0,
        finalAmount: totalCost,
        amountPaid: initialPaid,
        remainingBalance,
        paymentMethod: "Cash",
        paymentDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        confirmedBy: "Muhammad Waqas (Master Admin)",
        status: remainingBalance === 0 ? "Paid" : "Partially Paid",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      subscriptionsDb.payments.unshift(paymentRecord);
    }
    persistSubscriptions();
    recordAuditLog(
      "SHOP_CREATED",
      "Muhammad Waqas",
      "MASTER_ADMIN",
      `Created new shop ${newShop.shopName} (${uniqueShopId}) for ${newShop.ownerName}. Plan: ${newShop.plan}`,
      uniqueShopId,
      req.ip
    );
    return res.json({
      success: true,
      shop: newShop,
      temporaryPassword: tempPassword,
      loginEmail: cleanEmail
    });
  });
  app.put("/api/subscriptions/shops/:id", (req, res) => {
    const { id } = req.params;
    const shop = subscriptionsDb.shops.find((s) => s.id === id);
    if (!shop) {
      return res.status(404).json({ success: false, message: "Shop not found" });
    }
    const { status, pricing, expiryDate, plan } = req.body;
    const prevStatus = shop.status;
    if (status) shop.status = status;
    if (pricing) {
      shop.pricing = { ...shop.pricing, ...pricing, lastUpdated: (/* @__PURE__ */ new Date()).toISOString().split("T")[0] };
    }
    if (expiryDate) shop.expiryDate = expiryDate;
    if (plan) shop.plan = plan;
    persistSubscriptions();
    recordAuditLog(
      "SHOP_STATUS_UPDATED",
      "Muhammad Waqas",
      "MASTER_ADMIN",
      `Updated ${shop.shopName} (${shop.id}): status changed from ${prevStatus} to ${shop.status}`,
      shop.id,
      req.ip
    );
    return res.json({ success: true, shop });
  });
  app.post("/api/subscriptions/payments", (req, res) => {
    const {
      shopId,
      plan,
      durationLabel,
      totalAmount,
      discount = 0,
      amountPaid,
      paymentMethod = "Cash",
      paymentDate,
      transactionReference,
      notes
    } = req.body;
    const shop = subscriptionsDb.shops.find((s) => s.id === shopId);
    if (!shop) {
      return res.status(404).json({ success: false, message: "Shop not found." });
    }
    const total = Number(totalAmount) || 0;
    const disc = Number(discount) || 0;
    const finalAmt = Math.max(0, total - disc);
    const paid = Number(amountPaid) || 0;
    const remaining = Math.max(0, finalAmt - paid);
    const receiptNumber = `RCP-${Math.floor(1e3 + Math.random() * 9e3)}`;
    const paymentRecord = {
      id: `PAY-${Date.now()}`,
      receiptNumber,
      shopId: shop.id,
      shopName: shop.shopName,
      ownerName: shop.ownerName,
      ownerEmail: shop.email,
      plan: plan || shop.plan,
      durationLabel: durationLabel || "Subscription Payment",
      totalAmount: total,
      discount: disc,
      finalAmount: finalAmt,
      amountPaid: paid,
      remainingBalance: remaining,
      paymentMethod,
      paymentDate: paymentDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      transactionReference: transactionReference || void 0,
      confirmedBy: "Muhammad Waqas (Master Admin)",
      notes: notes || void 0,
      status: remaining === 0 ? "Paid" : paid > 0 ? "Partially Paid" : "Unpaid",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    subscriptionsDb.payments.unshift(paymentRecord);
    shop.totalPaid = (shop.totalPaid || 0) + paid;
    shop.remainingBalance = remaining;
    if (paid > 0 && shop.status === "expired") {
      shop.status = "active";
    }
    persistSubscriptions();
    recordAuditLog(
      "PAYMENT_RECORDED",
      "Muhammad Waqas",
      "MASTER_ADMIN",
      `Recorded payment Rs. ${paid.toLocaleString()} for ${shop.shopName} (${shop.id}) via ${paymentMethod} - Receipt: ${receiptNumber}`,
      shop.id,
      req.ip
    );
    return res.json({ success: true, payment: paymentRecord, shop });
  });
  app.post("/api/subscriptions/renew", (req, res) => {
    const { shopId, plan, additionalDays, amount, paymentMethod, notes } = req.body;
    const shop = subscriptionsDb.shops.find((s) => s.id === shopId);
    if (!shop) {
      return res.status(404).json({ success: false, message: "Shop not found" });
    }
    const durationDays = Number(additionalDays) || (plan === "1_month" ? 30 : plan === "3_months" ? 90 : plan === "6_months" ? 180 : plan === "12_months" ? 365 : 30);
    const previousExpiry = shop.expiryDate;
    const currentExpiryDate = new Date(shop.expiryDate);
    const now = /* @__PURE__ */ new Date();
    const baseDate = currentExpiryDate > now ? currentExpiryDate : now;
    const newExpiry = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1e3).toISOString().split("T")[0];
    shop.expiryDate = newExpiry;
    shop.status = "active";
    shop.plan = plan || shop.plan;
    shop.renewalsCount = (shop.renewalsCount || 0) + 1;
    const receiptNumber = `RCP-${Math.floor(1e3 + Math.random() * 9e3)}`;
    const paidAmt = Number(amount) || 0;
    const renewalRecord = {
      id: `REN-${Date.now()}`,
      shopId: shop.id,
      shopName: shop.shopName,
      plan: shop.plan,
      durationDays,
      previousExpiry,
      newExpiry,
      paymentReceiptNumber: receiptNumber,
      amount: paidAmt,
      renewedAt: (/* @__PURE__ */ new Date()).toISOString(),
      confirmedBy: "Muhammad Waqas (Master Admin)"
    };
    subscriptionsDb.renewals.unshift(renewalRecord);
    if (paidAmt > 0) {
      const paymentRecord = {
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
        paymentMethod: paymentMethod || "Cash",
        paymentDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        confirmedBy: "Muhammad Waqas (Master Admin)",
        notes: notes || "Renewal payment confirmed",
        status: "Paid",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      subscriptionsDb.payments.unshift(paymentRecord);
      shop.totalPaid = (shop.totalPaid || 0) + paidAmt;
    }
    persistSubscriptions();
    recordAuditLog(
      "SUBSCRIPTION_RENEWED",
      "Muhammad Waqas",
      "MASTER_ADMIN",
      `Renewed subscription for ${shop.shopName} (${shop.id}) by ${durationDays} days. New expiry: ${newExpiry}`,
      shop.id,
      req.ip
    );
    return res.json({ success: true, shop, renewal: renewalRecord, receiptNumber });
  });
  app.get("/api/master-admin/shops", (req, res) => {
    return res.json({ success: true, shops: subscriptionsDb.shops });
  });
  app.post("/api/master-admin/shops", (req, res) => {
    const { shopName, username, password, ownerName, phone, address, status = "active" } = req.body;
    const cleanName = (shopName || "").trim();
    const cleanUser = (username || "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    const cleanPass = (password || "").trim();
    if (!cleanName || !cleanUser || !cleanPass) {
      return res.status(400).json({ success: false, message: "Shop name, username, and password are required." });
    }
    const existing = authDb.users.find((u) => u.username?.toLowerCase() === cleanUser || u.email?.toLowerCase() === cleanUser);
    if (existing) {
      return res.status(400).json({ success: false, message: "Username is already in use by another account." });
    }
    const uniqueShopId = `SHOP-${Date.now().toString().slice(-6)}`;
    const passSalt = import_crypto.default.randomBytes(16).toString("hex");
    const passHash = hashPassword(cleanPass, passSalt, 1e5);
    const newShopAccount = {
      id: uniqueShopId,
      shopName: cleanName,
      ownerName: (ownerName || cleanName).trim(),
      email: `${cleanUser}@localpos`,
      phone: (phone || "").trim(),
      whatsapp: (phone || "").trim(),
      address: (address || "").trim(),
      status: status === "active" ? "active" : "inactive",
      plan: "12_months",
      startDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
      pricing: {
        oneMonth: 1500,
        threeMonths: 4e3,
        sixMonths: 7500,
        twelveMonths: 14e3,
        customPricePerMonth: 1500,
        lastUpdated: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      },
      initialPayment: 0,
      remainingBalance: 0,
      totalPaid: 0,
      totalIncome: 0,
      renewalsCount: 0,
      createdAt: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
    };
    const newShopUser = {
      id: `USR-${uniqueShopId}`,
      username: cleanUser,
      email: `${cleanUser}@localpos`,
      fullName: (ownerName || cleanName).trim(),
      phone: (phone || "").trim(),
      whatsapp: (phone || "").trim(),
      role: "SHOP_OWNER",
      shopId: uniqueShopId,
      passwordSalt: passSalt,
      passwordHash: passHash,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    subscriptionsDb.shops.unshift(newShopAccount);
    authDb.users.push(newShopUser);
    persistSubscriptions();
    persistAuthDb();
    loadShopStoreData(uniqueShopId);
    recordAuditLog(
      "SHOP_CREATED",
      cleanUser,
      "MASTER_ADMIN",
      `Master Admin created new shop ${cleanName} (${uniqueShopId}) with username ${cleanUser}`,
      uniqueShopId,
      req.ip
    );
    return res.json({ success: true, shop: newShopAccount });
  });
  app.put("/api/master-admin/shops/:id", (req, res) => {
    const { id } = req.params;
    const shop = subscriptionsDb.shops.find((s) => s.id === id);
    if (!shop) {
      return res.status(404).json({ success: false, message: "Shop not found." });
    }
    const { shopName, ownerName, phone, address } = req.body;
    if (shopName) shop.shopName = shopName.trim();
    if (ownerName) shop.ownerName = ownerName.trim();
    if (phone) shop.phone = phone.trim();
    if (address) shop.address = address.trim();
    persistSubscriptions();
    recordAuditLog(
      "SHOP_UPDATED",
      "Master Admin",
      "MASTER_ADMIN",
      `Updated details for shop ${shop.shopName} (${shop.id})`,
      shop.id,
      req.ip
    );
    return res.json({ success: true, shop });
  });
  app.post("/api/master-admin/shops/:id/toggle-status", (req, res) => {
    const { id } = req.params;
    const shop = subscriptionsDb.shops.find((s) => s.id === id);
    if (!shop) {
      return res.status(404).json({ success: false, message: "Shop not found." });
    }
    const { status } = req.body;
    const newStatus = status || (shop.status === "active" ? "inactive" : "active");
    shop.status = newStatus;
    persistSubscriptions();
    if (newStatus !== "active") {
      for (const token of Object.keys(authDb.sessions)) {
        if (authDb.sessions[token].shopId === shop.id) {
          delete authDb.sessions[token];
        }
      }
      persistAuthDb();
    }
    recordAuditLog(
      "SHOP_STATUS_CHANGED",
      "Master Admin",
      "MASTER_ADMIN",
      `Shop ${shop.shopName} (${shop.id}) status set to ${newStatus}`,
      shop.id,
      req.ip
    );
    return res.json({ success: true, status: newStatus });
  });
  app.post("/api/master-admin/shops/:id/password", (req, res) => {
    const { id } = req.params;
    const shopUser = authDb.users.find((u) => u.shopId === id && u.role === "SHOP_OWNER");
    if (!shopUser) {
      return res.status(404).json({ success: false, message: "Shop user account not found." });
    }
    const { password } = req.body;
    if (!password || password.trim().length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
    }
    const salt = import_crypto.default.randomBytes(16).toString("hex");
    shopUser.passwordSalt = salt;
    shopUser.passwordHash = hashPassword(password.trim(), salt, 1e5);
    persistAuthDb();
    recordAuditLog(
      "SHOP_PASSWORD_RESET",
      "Master Admin",
      "MASTER_ADMIN",
      `Master Admin reset password for shop ${id}`,
      id,
      req.ip
    );
    return res.json({ success: true, message: "Shop password reset successfully." });
  });
  app.get("/api/master-admin/audit-logs", (_req, res) => {
    return res.json({ success: true, logs: auditLogs });
  });
  app.get("/api/settings/mart-owner", (_req, res) => {
    return res.json({
      success: true,
      martOwner: storeDb.martOwner || {
        martName: "WAQAS MART",
        badge: "MART OWNER",
        ownerName: "Fatima Bibi",
        designation: "Proprietor & Manager",
        mobileNumber: "03228570782",
        whatsappNumber: "03228570782",
        address: "Commercial Market, Multan, Pakistan",
        photoUrl: "/assets/aistudio/female_owner_portrait.svg"
      },
      softwareOwner: {
        name: "Muhammad Waqas",
        designation: "MASTER ADMINISTRATOR \u2014 WAQAS POS SOFTWARE",
        whatsapp: "03228570782",
        mobile: "03429634133",
        photoUrl: "/5c454cea45cc8c39a24b57a83fbbc5cf_0.webp",
        isPermanentlyLocked: true
      }
    });
  });
  app.post("/api/settings/mart-owner", (req, res) => {
    const { martName, ownerName, designation, mobileNumber, whatsappNumber, address, photoUrl } = req.body;
    storeDb.martOwner = {
      martName: martName || "WAQAS MART",
      badge: "MART OWNER",
      ownerName: ownerName || "Fatima Bibi",
      designation: designation || "Proprietor & Manager",
      mobileNumber: mobileNumber || "03228570782",
      whatsappNumber: whatsappNumber || mobileNumber || "03228570782",
      address: address || "Commercial Market, Multan, Pakistan",
      photoUrl: photoUrl || "/assets/aistudio/female_owner_portrait.svg"
    };
    persistStore();
    broadcastSyncEvent({
      type: "store:sync",
      timestamp: Date.now(),
      payload: storeDb
    });
    return res.json({ success: true, martOwner: storeDb.martOwner });
  });
  app.get("/api/master-admin/backup/export", (_req, res) => {
    const allShopData = {};
    if (import_fs.default.existsSync(SHOPS_DIR)) {
      const files = import_fs.default.readdirSync(SHOPS_DIR);
      for (const f of files) {
        if (f.endsWith(".json")) {
          const sId = f.replace(".json", "");
          try {
            allShopData[sId] = JSON.parse(import_fs.default.readFileSync(import_path.default.join(SHOPS_DIR, f), "utf-8"));
          } catch {
          }
        }
      }
    }
    return res.json({
      success: true,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      version: "2.0-offline",
      device: "Local Terminal",
      masterAdmin: authDb.users.find((u) => u.role === "MASTER_ADMIN") || null,
      shops: subscriptionsDb.shops,
      shopDatabases: allShopData,
      payments: subscriptionsDb.payments,
      renewals: subscriptionsDb.renewals,
      auditLogs,
      store: storeDb,
      devices: registeredDevices
    });
  });
  app.post("/api/master-admin/backup/import", (req, res) => {
    const { restoredData } = req.body;
    if (!restoredData) {
      return res.status(400).json({ success: false, message: "Invalid backup payload." });
    }
    const safetyDir = import_path.default.join(DATA_DIR, "backups", `safety_before_restore_${Date.now()}`);
    import_fs.default.mkdirSync(safetyDir, { recursive: true });
    try {
      if (import_fs.default.existsSync(AUTH_DB_FILE)) import_fs.default.copyFileSync(AUTH_DB_FILE, import_path.default.join(safetyDir, "auth_db.json"));
      if (import_fs.default.existsSync(STORE_DB_FILE)) import_fs.default.copyFileSync(STORE_DB_FILE, import_path.default.join(safetyDir, "store_db.json"));
      if (import_fs.default.existsSync(SUBSCRIPTIONS_DB_FILE)) import_fs.default.copyFileSync(SUBSCRIPTIONS_DB_FILE, import_path.default.join(safetyDir, "subscriptions_db.json"));
    } catch (e) {
      console.warn("Failed to take safety snapshot:", e);
    }
    if (Array.isArray(restoredData.shops)) {
      subscriptionsDb.shops = restoredData.shops;
      persistSubscriptions();
    }
    if (restoredData.shopDatabases && typeof restoredData.shopDatabases === "object") {
      for (const [sId, sData] of Object.entries(restoredData.shopDatabases)) {
        persistShopStoreData(sId, sData);
      }
    }
    if (restoredData.store) {
      storeDb = restoredData.store;
      persistStore();
    }
    recordAuditLog(
      "BACKUP_RESTORED",
      "Master Admin",
      "MASTER_ADMIN",
      "Restored database from verified encrypted backup.",
      void 0,
      req.ip
    );
    return res.json({ success: true, message: "Backup successfully restored." });
  });
  app.all("/api/*", (req, res) => {
    res.status(404).json({
      success: false,
      error: "API_ENDPOINT_NOT_FOUND",
      message: `The API route ${req.method} ${req.path} was not found on WAQAS POS Server.`,
      path: req.path
    });
  });
  const isProd = process.env.NODE_ENV === "production";
  const distPath = import_path.default.resolve(process.cwd(), "dist");
  if (isProd && import_fs.default.existsSync(distPath)) {
    console.log("[Server] Production mode: serving static build from /dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  } else {
    console.log("[Server] Development mode: mounting Vite middlewares");
    const vite = await (0, import_vite.createServer)({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== "true"
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  }
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`[WAQAS MART] Multi-Device Full-Stack Server listening on http://0.0.0.0:${PORT}`);
  });
}
start().catch((err) => {
  console.error("[Server] Fatal startup error:", err);
  process.exit(1);
});

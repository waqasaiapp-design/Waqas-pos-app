/**
 * WAQAS POS SOFTWARE - Software Owner & Offline Mart Password Security Engine
 *
 * Requirements:
 * 1. Fixed Software Owner Password: "waqas?887711"
 * 2. Self-contained offline Mart Password generation & cryptographic signature verification
 * 3. Works 100% offline on any disconnected device (Device B, C, etc.) without server or Device A's storage
 * 4. Session persistence across page refreshes and browser restarts
 * 5. Clean permission boundary: Owner has full access; Mart User cannot access Owner-only security
 */

const MART_ROOT_SECRET = 'WAQAS_MART_POS_OFFLINE_SECRET_KEY_v2026_887711';
const CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // 32 unambiguous characters (no 0/O/1/I)
export const FIXED_OWNER_PASSWORD = 'waqas?887711';
export const DEFAULT_SEED_MART_PASSWORD = 'MART-7860-9921-3KT3';

const STORAGE_KEYS = {
  AUTH_SESSION: 'waqas_mart_auth_session',
  ACTIVE_MART_PASSWORD: 'waqas_mart_active_password_v2',
  PASSWORD_HISTORY: 'waqas_mart_password_history_v2',
};

export interface MartAuthSession {
  role: 'SOFTWARE_OWNER' | 'MART_USER';
  user: {
    id: string;
    displayName: string;
    username: string;
    role: 'SOFTWARE_OWNER' | 'MART_USER';
    email?: string;
  };
  token: string;
  createdAt: number;
}

export interface MartPasswordRecord {
  password: string;
  generatedAt: string;
  generatedBy: string;
  label?: string;
}

/**
 * Fast synchronous SHA-256 for deterministic browser & Node.js offline execution
 */
function sha256Hex(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i = 0;
  let j = 0;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  let compositeHash: number[];

  for (i = 0; i < ascii.length; i++) {
    j = ascii.charCodeAt(i);
    words[i >> 2] |= j << ((3 - (i % 4)) * 8);
  }

  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (i = 0; i < words.length; i += 16) {
    const w = words.slice(i, i + 16);
    compositeHash = hash.slice(0);

    for (j = 0; j < 64; j++) {
      const w15 = w[j - 15];
      const w2 = w[j - 2];

      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);

      w[j] = j < 16 ? w[j] : (w[j - 16] + s0 + w[j - 7] + s1) | 0;

      const ch = (compositeHash[4] & compositeHash[5]) ^ (~compositeHash[4] & compositeHash[6]);
      const maj = (compositeHash[0] & compositeHash[1]) ^ (compositeHash[0] & compositeHash[2]) ^ (compositeHash[1] & compositeHash[2]);
      const temp1 = compositeHash[7] + (rightRotate(compositeHash[4], 6) ^ rightRotate(compositeHash[4], 11) ^ rightRotate(compositeHash[4], 25)) + ch + k[j] + (w[j] | 0);
      const temp2 = (rightRotate(compositeHash[0], 2) ^ rightRotate(compositeHash[0], 13) ^ rightRotate(compositeHash[0], 22)) + maj;

      compositeHash = [(temp1 + temp2) | 0].concat(compositeHash);
      compositeHash[4] = (compositeHash[4] + temp1) | 0;
      compositeHash.length = 8;
    }

    for (j = 0; j < 8; j++) {
      hash[j] = (hash[j] + compositeHash[j]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }

  return result;
}

/**
 * Compute the 4-character cryptographic signature of a core token
 */
export function computeMartChecksum(core: string): string {
  const cleanCore = core.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const h = sha256Hex(`${MART_ROOT_SECRET}:${cleanCore}`);
  let sig = '';
  for (let i = 0; i < 4; i++) {
    const byteVal = parseInt(h.substr(i * 2, 2), 16) || 0;
    sig += CHARSET[byteVal % CHARSET.length];
  }
  return sig;
}

/**
 * Generate a strong random Mart Password with self-contained cryptographic signature
 * Format: MART-XXXX-YYYY-ZZZZ (where ZZZZ is the cryptographic verification signature)
 */
export function generateStrongMartPassword(): string {
  let raw = '';
  for (let i = 0; i < 8; i++) {
    const randIndex = Math.floor(Math.random() * CHARSET.length);
    raw += CHARSET[randIndex];
  }
  const part1 = raw.slice(0, 4);
  const part2 = raw.slice(4, 8);
  const core = `${part1}-${part2}`;
  const sig = computeMartChecksum(core);

  return `MART-${part1}-${part2}-${sig}`;
}

/**
 * Normalize user input string for flexible and error-tolerant cashier entry
 */
export function normalizePasswordInput(raw: string): string {
  if (!raw) return '';
  return raw.trim();
}

/**
 * Verify Software Owner Password
 * Fixed password: "waqas?887711"
 */
export function verifyOwnerPassword(password: string): boolean {
  if (!password) return false;
  return password.trim() === FIXED_OWNER_PASSWORD;
}

/**
 * Verify Mart Password offline on ANY device without contacting Device A
 * Checks:
 * 1. Self-contained cryptographic signature (verifies on disconnected devices B, C...)
 * 2. Or matches active password in localStorage
 * 3. Or matches default seed password
 */
export function verifyMartPassword(passwordInput: string): { isValid: boolean; reason?: string } {
  if (!passwordInput) {
    return { isValid: false, reason: 'Please enter the Mart Password.' };
  }

  const clean = passwordInput.trim().toUpperCase().replace(/[\s_]/g, '');

  // 1. Check direct match with active password stored on this device
  const active = getActiveMartPassword();
  if (active) {
    const cleanActive = active.trim().toUpperCase().replace(/[\s_]/g, '');
    if (clean === cleanActive) {
      return { isValid: true };
    }
  }

  // 2. Check default seed password
  if (clean === DEFAULT_SEED_MART_PASSWORD.replace(/[\s_]/g, '')) {
    return { isValid: true };
  }

  // 3. Cryptographic Offline Self-Contained Verification
  // Handles: MART-XXXX-YYYY-ZZZZ or XXXX-YYYY-ZZZZ or MARTXXXXYYYYZZZZ
  let core = '';
  let providedSig = '';

  if (clean.startsWith('MART-')) {
    const parts = clean.split('-').filter(Boolean);
    if (parts.length === 4) {
      // MART - XXXX - YYYY - ZZZZ
      core = `${parts[1]}-${parts[2]}`;
      providedSig = parts[3];
    }
  } else if (clean.startsWith('MART')) {
    const withoutPrefix = clean.replace('MART', '').replace(/-/g, '');
    if (withoutPrefix.length === 12) {
      const p1 = withoutPrefix.slice(0, 4);
      const p2 = withoutPrefix.slice(4, 8);
      core = `${p1}-${p2}`;
      providedSig = withoutPrefix.slice(8, 12);
    }
  } else {
    // Input without MART prefix e.g. XXXX-YYYY-ZZZZ
    const stripped = clean.replace(/-/g, '');
    if (stripped.length === 12) {
      const p1 = stripped.slice(0, 4);
      const p2 = stripped.slice(4, 8);
      core = `${p1}-${p2}`;
      providedSig = stripped.slice(8, 12);
    }
  }

  if (core && providedSig) {
    const expectedSig = computeMartChecksum(core);
    if (expectedSig === providedSig) {
      return { isValid: true };
    }
  }

  return {
    isValid: false,
    reason: 'Invalid Mart Password. Please enter the valid password provided by the Software Owner.',
  };
}

/**
 * Get active Mart Password stored in localStorage
 */
export function getActiveMartPassword(): string {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_MART_PASSWORD);
      if (saved) return saved;
    }
  } catch {}
  return DEFAULT_SEED_MART_PASSWORD;
}

/**
 * Save new active Mart Password (Software Owner Only)
 */
export function saveActiveMartPassword(password: string): MartPasswordRecord {
  const record: MartPasswordRecord = {
    password,
    generatedAt: new Date().toISOString(),
    generatedBy: 'Software Owner',
  };

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_MART_PASSWORD, password);

      // Append to history
      const historyRaw = localStorage.getItem(STORAGE_KEYS.PASSWORD_HISTORY);
      let history: MartPasswordRecord[] = [];
      if (historyRaw) {
        try {
          history = JSON.parse(historyRaw);
          if (!Array.isArray(history)) history = [];
        } catch {}
      }
      history.unshift(record);
      localStorage.setItem(STORAGE_KEYS.PASSWORD_HISTORY, JSON.stringify(history.slice(0, 20)));
    }
  } catch {}

  return record;
}

/**
 * Get active session
 */
export function getAuthSession(): MartAuthSession | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.role === 'SOFTWARE_OWNER' || parsed.role === 'MART_USER')) {
        return parsed;
      }
      // Backward compatibility check for old format
      if (parsed && (parsed.user?.role === 'SHOP_OWNER' || parsed.user?.role === 'STAFF')) {
        return {
          role: 'MART_USER',
          user: {
            id: parsed.user.id || 'USR-MART-01',
            displayName: parsed.user.fullName || parsed.user.displayName || 'Mart User',
            username: parsed.user.username || 'cashier',
            role: 'MART_USER',
            email: parsed.user.email,
          },
          token: parsed.token || `TOKEN-MART-${Date.now()}`,
          createdAt: Date.now(),
        };
      }
    }
  } catch {}
  return null;
}

/**
 * Save active session to localStorage (Persists across navigation, refresh, restart)
 */
export function setAuthSession(session: MartAuthSession): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
    }
  } catch {}
}

/**
 * Clear session upon explicit logout
 */
export function clearAuthSession(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    }
  } catch {}
}

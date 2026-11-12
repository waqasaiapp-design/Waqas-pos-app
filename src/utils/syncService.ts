import {
  DeviceInfo,
  SyncEvent,
  SyncEventType,
  SaleTransaction,
  PurchaseTransaction,
  SaleReturn,
  Product,
  Customer,
  CustomerLedgerEntry,
  HeldBill,
  StoreFullState,
} from '../types/pos';

export type SyncListener = (event: SyncEvent) => void;

export {
  getApiBaseUrl,
  setCustomApiBaseUrl,
  testServerConnection,
  safeFetchJson,
  ApiConnectionError,
} from './apiClient';
import { getApiBaseUrl, safeFetchJson } from './apiClient';

class SyncService {
  private device: DeviceInfo;
  private sse: EventSource | null = null;
  private listeners: Set<SyncListener> = new Set();
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private reconnectTimeout: any = null;
  private offlineQueueKey = 'waqas_mart_offline_queue_v2';
  private lastSyncTime: string = 'Never';

  constructor() {
    this.device = this.initDevice();

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.connectSse();
        this.flushOfflineQueue();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.closeSse();
        this.notifyListeners({
          type: 'device:updated',
          timestamp: Date.now(),
          payload: { offline: true },
        });
      });

      // Start initial connection
      this.connectSse();
    }
  }

  private initDevice(): DeviceInfo {
    const STORAGE_KEY = 'waqas_mart_device_info_v2';
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: DeviceInfo = JSON.parse(saved);
        parsed.isCurrentDevice = true;
        return parsed;
      }
    } catch {}

    const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isTablet = typeof navigator !== 'undefined' && /iPad|Tablet/i.test(navigator.userAgent);
    const isWindows = typeof navigator !== 'undefined' && /Win/i.test(navigator.userAgent);

    const devId = `DEV-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newDev: DeviceInfo = {
      deviceId: devId,
      deviceName: isTablet
        ? 'Counter Tablet'
        : isMobile
        ? 'Cashier Android Phone'
        : isWindows
        ? 'Windows 11 Main POS'
        : 'Web Workstation',
      deviceType: isTablet
        ? 'Tablet / iPad'
        : isMobile
        ? 'Android Mobile'
        : isWindows
        ? 'Windows PC'
        : 'Web Browser',
      browser:
        typeof navigator !== 'undefined'
          ? navigator.userAgent.includes('Chrome')
            ? 'Chrome Desktop'
            : navigator.userAgent.includes('Edge')
            ? 'Microsoft Edge'
            : 'Web Browser'
          : 'Browser',
      os: isMobile ? 'Android 14/15' : isWindows ? 'Windows 11' : 'Desktop OS',
      isCurrentDevice: true,
      firstRegistered: new Date().toLocaleDateString('en-GB'),
      lastActive: new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }),
      status: 'active',
      connectionState: 'online',
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newDev));
    } catch {}

    return newDev;
  }

  public getDevice(): DeviceInfo {
    return this.device;
  }

  public updateDeviceName(name: string) {
    this.device.deviceName = name;
    try {
      localStorage.setItem('waqas_mart_device_info_v2', JSON.stringify(this.device));
    } catch {}
  }

  public setSessionToken(token: string) {
    this.device.sessionToken = token;
    try {
      localStorage.setItem('waqas_mart_device_info_v2', JSON.stringify(this.device));
    } catch {}
  }

  public getSessionToken(): string | undefined {
    return this.device.sessionToken;
  }

  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  public getLastSyncTime(): string {
    return this.lastSyncTime;
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(event: SyncEvent) {
    this.lastSyncTime = new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in sync listener', err);
      }
    });
  }

  public connectSse() {
    if (typeof window === 'undefined' || !this.isOnline) return;
    this.closeSse();

    try {
      const base = getApiBaseUrl();
      const url = `${base}/api/sync/events?deviceId=${encodeURIComponent(this.device.deviceId)}`;
      this.sse = new EventSource(url);

      this.sse.onmessage = (messageEvent) => {
        try {
          const syncEvent: SyncEvent = JSON.parse(messageEvent.data);

          // If this device was revoked, handle immediate lockout
          if (
            syncEvent.type === 'device:revoked' &&
            syncEvent.payload?.deviceId === this.device.deviceId
          ) {
            this.device.status = 'revoked';
            try {
              localStorage.setItem('waqas_mart_device_info_v2', JSON.stringify(this.device));
            } catch {}
          }

          this.notifyListeners(syncEvent);
        } catch (e) {
          console.warn('Failed to parse SSE payload', e);
        }
      };

      this.sse.onerror = () => {
        this.closeSse();
        // Exponential backoff reconnect
        if (!this.reconnectTimeout) {
          this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            if (this.isOnline) this.connectSse();
          }, 5000);
        }
      };
    } catch (e) {
      console.warn('Could not establish SSE connection', e);
    }
  }

  public closeSse() {
    if (this.sse) {
      this.sse.close();
      this.sse = null;
    }
  }

  // -------------------------------------------------------------
  // MUTATION SYNC METHODS (WITH OFFLINE BUFFERING)
  // -------------------------------------------------------------
  public async postMutation(action: string, payload: any): Promise<any> {
    if (!this.isOnline) {
      this.queueOfflineMutation(action, payload);
      return { success: true, offline: true };
    }

    try {
      const base = getApiBaseUrl();
      const response = await fetch(`${base}/api/store/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': this.device.deviceId,
        },
        body: JSON.stringify({
          action,
          payload,
          sourceDeviceId: this.device.deviceId,
        }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          this.device.status = 'revoked';
          throw new Error('Device access has been revoked by store administrator.');
        }
        throw new Error(`Sync request failed with status ${response.status}`);
      }

      this.lastSyncTime = new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const raw = await response.text();
      try {
        return raw ? JSON.parse(raw) : { success: true };
      } catch {
        return { success: false, raw };
      }
    } catch (err) {
      console.warn(`Sync mutation [${action}] failed, saving to offline outbox`, err);
      this.queueOfflineMutation(action, payload);
      return { success: true, offline: true };
    }
  }

  private queueOfflineMutation(action: string, payload: any) {
    try {
      const queue = this.getOfflineQueue();
      queue.push({ action, payload, timestamp: Date.now() });
      localStorage.setItem(this.offlineQueueKey, JSON.stringify(queue));
    } catch (e) {
      console.error('Error queuing offline mutation', e);
    }
  }

  private getOfflineQueue(): Array<{ action: string; payload: any; timestamp: number }> {
    try {
      const data = localStorage.getItem(this.offlineQueueKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public async flushOfflineQueue() {
    const queue = this.getOfflineQueue();
    if (queue.length === 0 || !this.isOnline) return;

    console.log(`[Sync] Draining ${queue.length} offline mutations to server...`);
    const remaining: typeof queue = [];
    const base = getApiBaseUrl();

    for (const item of queue) {
      try {
        await fetch(`${base}/api/store/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-device-id': this.device.deviceId,
          },
          body: JSON.stringify({
            action: item.action,
            payload: item.payload,
            sourceDeviceId: this.device.deviceId,
          }),
        });
      } catch {
        remaining.push(item);
      }
    }

    try {
      localStorage.setItem(this.offlineQueueKey, JSON.stringify(remaining));
    } catch {}

    if (remaining.length === 0) {
      console.log('[Sync] Offline outbox completely synced!');
    }
  }

  // Convenient wrappers for POS actions
  public syncSale(tx: SaleTransaction) {
    return this.postMutation('create_sale', tx);
  }

  public syncPurchase(purchase: PurchaseTransaction) {
    return this.postMutation('create_purchase', purchase);
  }

  public syncReturn(ret: SaleReturn) {
    return this.postMutation('process_return', ret);
  }

  public syncStock(products: Product[]) {
    return this.postMutation('update_stock', products);
  }

  public syncLedgers(customers: Customer[], ledgerEntries: CustomerLedgerEntry[]) {
    return this.postMutation('update_customer_ledger', { customers, ledgerEntries });
  }

  public syncHeldBills(heldBills: HeldBill[]) {
    return this.postMutation('update_held_bills', heldBills);
  }

  public deleteHeldBill(billId: string) {
    return this.postMutation('delete_held_bill', { billId });
  }

  public async fetchServerStore(): Promise<StoreFullState | null> {
    if (!this.isOnline) return null;
    try {
      const res = await safeFetchJson<{ store: StoreFullState }>('/api/store/state');
      if (res.ok && res.data?.store) {
        this.lastSyncTime = new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        return res.data.store;
      }
    } catch (e) {
      console.warn('Failed to fetch server store state', e);
    }
    return null;
  }
}

export const syncService = new SyncService();

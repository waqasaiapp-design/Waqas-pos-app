import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Monitor,
  Tablet,
  Laptop,
  PlusCircle,
  QrCode,
  Shield,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit2,
  Wifi,
  WifiOff,
  Clock,
  ArrowLeft,
  Download,
  AlertTriangle,
  Radio,
  ExternalLink,
  ChevronRight,
  Info,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { DeviceInfo, StoreBranding } from '../types/pos';
import { syncService } from '../utils/syncService';
import { safeFetchJson } from '../utils/apiClient';

interface DeviceManagementPageProps {
  currentDevice: DeviceInfo;
  branding: StoreBranding;
  onNavigateHome: () => void;
  onOpenConnectNewQr: () => void;
  onOpenPairThisDevice: () => void;
  onOpenPwaInstall?: () => void;
  isPwaInstallable?: boolean;
}

export const DeviceManagementPage: React.FC<DeviceManagementPageProps> = ({
  currentDevice,
  branding,
  onNavigateHome,
  onOpenConnectNewQr,
  onOpenPairThisDevice,
  onOpenPwaInstall,
  isPwaInstallable = true,
}) => {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingDevice, setEditingDevice] = useState<DeviceInfo | null>(null);
  const [newName, setNewName] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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

  const fetchDevices = async () => {
    setIsLoading(true);
    try {
      const res = await safeFetchJson('/api/devices');
      if (res.ok && res.data) {
        const data = res.data;
        if (data.success && Array.isArray(data.devices)) {
          // Mark current device
          const list = data.devices.map((d: DeviceInfo) => ({
            ...d,
            isCurrentDevice: d.deviceId === currentDevice.deviceId,
          }));
          setDevices(list);
        }
      }
    } catch (e) {
      console.warn('Failed to load devices', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();

    // Listen to real-time device updates via syncService
    const unsubscribe = syncService.subscribe((event) => {
      if (event.type === 'device:updated' || event.type === 'device:approved' || event.type === 'device:revoked') {
        fetchDevices();
      }
    });

    return () => unsubscribe();
  }, [currentDevice.deviceId]);

  const showToast = (text: string, type: 'success' | 'error') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Rename
  const handleSaveRename = async () => {
    if (!editingDevice || !newName.trim()) return;
    setIsUpdating(true);
    try {
      const res = await safeFetchJson(`/api/devices/${editingDevice.deviceId}/rename`, {
        method: 'POST',
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = res.data;
      if (data && data.success) {
        showToast('Device renamed successfully!', 'success');
        if (editingDevice.deviceId === currentDevice.deviceId) {
          syncService.updateDeviceName(newName.trim());
        }
        setEditingDevice(null);
        fetchDevices();
      } else {
        showToast(data?.message || 'Failed to rename', 'error');
      }
    } catch {
      showToast('Error updating device name', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // Revoke device access
  const handleRevoke = async (dev: DeviceInfo) => {
    if (!window.confirm(`Are you sure you want to REVOKE access for "${dev.deviceName}"? This device will be disconnected immediately.`)) {
      return;
    }
    try {
      const res = await safeFetchJson(`/api/devices/${dev.deviceId}/revoke`, { method: 'POST' });
      const data = res.data;
      if (data && data.success) {
        showToast(`Access revoked for ${dev.deviceName}`, 'success');
        fetchDevices();
      } else {
        showToast(data?.message || 'Failed to revoke', 'error');
      }
    } catch {
      showToast('Error revoking device', 'error');
    }
  };

  // Remove device
  const handleRemove = async (dev: DeviceInfo) => {
    if (!window.confirm(`Remove "${dev.deviceName}" permanently from authorized devices list?`)) {
      return;
    }
    try {
      const res = await safeFetchJson(`/api/devices/${dev.deviceId}`, { method: 'DELETE' });
      const data = res.data;
      if (data && data.success) {
        showToast(`Device removed from system`, 'success');
        fetchDevices();
      } else {
        showToast(data?.message || 'Failed to remove', 'error');
      }
    } catch {
      showToast('Error removing device', 'error');
    }
  };

  // Device icon helper
  const getDeviceIcon = (type: string) => {
    if (type.includes('Windows') || type.includes('PC')) {
      return <Monitor className="w-5 h-5 text-blue-600" />;
    }
    if (type.includes('Tablet') || type.includes('iPad')) {
      return <Tablet className="w-5 h-5 text-purple-600" />;
    }
    return <Smartphone className="w-5 h-5 text-emerald-600" />;
  };

  const totalAuthorized = devices.filter((d) => d.status === 'active').length;
  const totalOnline = devices.filter((d) => d.connectionState === 'online').length;
  const windowsCount = devices.filter((d) => d.deviceType.includes('Windows') || d.deviceType.includes('PC')).length;
  const mobileCount = devices.filter((d) => d.deviceType.includes('Mobile') || d.deviceType.includes('Tablet')).length;

  return (
    <div className="flex-1 min-h-full w-full flex flex-col bg-[#f8fafc] text-slate-900">
      {/* Top Emerald Header */}
      <div className="bg-[#057a44] text-white px-4 py-4 shadow-md shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="p-2 hover:bg-white/10 rounded-xl transition cursor-pointer text-white/90 hover:text-white"
              title="Back to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-black tracking-tight flex items-center gap-2">
                <span>Multi-Device Connection & Terminals</span>
                <span className="text-[10px] bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                  Real-Time Sync
                </span>
              </h1>
              <p className="text-xs text-emerald-100 font-medium">
                {branding.storeName} — Multi-Counter & Windows Desktop Support
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer border border-white/20 active:scale-95"
              title={isFullscreen ? "Exit Fullscreen (فل سکرین بند کریں)" : "Enter Fullscreen (فل سکرین کھولیں)"}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4 text-amber-300" />
                  <span className="hidden sm:inline">Normal</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 text-emerald-200" />
                  <span className="hidden sm:inline">Fullscreen</span>
                </>
              )}
            </button>
            <button
              onClick={onOpenConnectNewQr}
              className="px-3.5 py-2 bg-white text-[#057a44] hover:bg-emerald-50 rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">Connect New Device</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto max-w-5xl mx-auto w-full p-4 space-y-5">
        {/* Toast Feedback */}
        {feedback && (
          <div
            className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
              feedback.type === 'success'
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : 'bg-red-100 text-red-900 border border-red-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-700" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-bold">Authorized</p>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">{totalAuthorized} Devices</h3>
              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Active POS Terminals</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-bold">Currently Online</p>
              <h3 className="text-xl font-black text-emerald-700 mt-0.5">{totalOnline} Online</h3>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live SSE Connected
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Radio className="w-5 h-5 text-emerald-600 animate-pulse" />
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-bold">Windows PCs</p>
              <h3 className="text-xl font-black text-blue-900 mt-0.5">{windowsCount} Terminals</h3>
              <p className="text-[10px] text-blue-600 font-semibold mt-0.5">Chrome / Edge</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Monitor className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-bold">Phones & Tablets</p>
              <h3 className="text-xl font-black text-purple-900 mt-0.5">{mobileCount} Mobiles</h3>
              <p className="text-[10px] text-purple-600 font-semibold mt-0.5">Android Counters</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Windows & PWA Installation Banner */}
        <div className="p-4 bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-emerald-200 shrink-0">
              <Laptop className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm sm:text-base">Windows 10 / 11 Desktop POS Support</h4>
              <p className="text-xs text-emerald-100 max-w-xl mt-0.5">
                Run WAQAS MART on any computer using Chrome or Edge. Install as a standalone native-like desktop app without needing separate EXE installers.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onOpenPwaInstall && (
              <button
                type="button"
                onClick={onOpenPwaInstall}
                className="px-3.5 py-2 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Install Desktop App</span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenPairThisDevice}
              className="px-3 py-2 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Pair This Device</span>
            </button>
          </div>
        </div>

        {/* Device List Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-base text-slate-900">Authorized Connected Terminals</h3>
            </div>
            <button
              onClick={fetchDevices}
              disabled={isLoading}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              title="Refresh list"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
              <p className="text-xs font-semibold">Loading authorized devices...</p>
            </div>
          ) : devices.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-slate-500 font-semibold text-sm">No secondary devices connected yet.</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Click "Connect New Device" to generate a pairing QR code and scan it with another mobile or computer.
              </p>
              <button
                onClick={onOpenConnectNewQr}
                className="mt-2 px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition cursor-pointer"
              >
                Connect First Device
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {devices.map((dev) => {
                const isOnline = dev.connectionState === 'online';
                const isRevoked = dev.status === 'revoked';

                return (
                  <div
                    key={dev.deviceId}
                    className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                      dev.isCurrentDevice ? 'bg-emerald-50/40' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Left: Device Info */}
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                          isRevoked
                            ? 'bg-red-50 border-red-200 text-red-500'
                            : isOnline
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-slate-100 border-slate-200 text-slate-500'
                        }`}
                      >
                        {getDeviceIcon(dev.deviceType)}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-extrabold text-sm text-slate-900">{dev.deviceName}</h4>
                          {dev.isCurrentDevice && (
                            <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full">
                              This Device (کاؤنٹر)
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                              isRevoked
                                ? 'bg-red-100 text-red-700'
                                : isOnline
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isRevoked
                                  ? 'bg-red-500'
                                  : isOnline
                                  ? 'bg-emerald-500 animate-pulse'
                                  : 'bg-slate-400'
                              }`}
                            />
                            <span>{isRevoked ? 'Revoked' : isOnline ? 'Online' : 'Offline'}</span>
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span className="font-mono text-[11px] text-slate-600">{dev.deviceId}</span>
                          <span>•</span>
                          <span>{dev.deviceType}</span>
                          <span>•</span>
                          <span>{dev.browser}</span>
                          <span>•</span>
                          <span>{dev.os}</span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                          <span>First Connected: {dev.firstRegistered}</span>
                          <span>•</span>
                          <span>Last Active: {dev.lastActive || 'Recently'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDevice(dev);
                          setNewName(dev.deviceName);
                        }}
                        className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer text-xs font-semibold flex items-center gap-1"
                        title="Rename Terminal"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Rename</span>
                      </button>

                      {!isRevoked && !dev.isCurrentDevice && (
                        <button
                          type="button"
                          onClick={() => handleRevoke(dev)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition cursor-pointer text-xs font-semibold flex items-center gap-1"
                          title="Revoke Access"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Revoke Access</span>
                        </button>
                      )}

                      {!dev.isCurrentDevice && (
                        <button
                          type="button"
                          onClick={() => handleRemove(dev)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                          title="Remove from List"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Security & Multi-Device Information Card */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>WAQAS MART Multi-Device Architecture & Security Rules</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-500 pl-1">
            <li><b>Real-Time Synchronization:</b> Sales recorded on one device instantly deduct inventory stock and update reports on all other terminals.</li>
            <li><b>Zero Password Exposure:</b> QR codes encode only short-lived pairing tokens with a 5-minute countdown. Never passwords or secret API keys.</li>
            <li><b>Server-Authoritative Stock:</b> Prevents conflicting stock updates and duplicate invoice numbers even when two cashiers complete sales at the exact same second.</li>
            <li><b>Instant Revocation:</b> If a device is marked as Revoked, it is locked out immediately at the server level.</li>
          </ul>
        </div>
      </div>

      {/* Rename Modal */}
      {editingDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">Rename Device / Terminal</h3>
            <p className="text-xs text-slate-500">
              Give this device a recognizable name (e.g. "Main Cashier Counter", "Basement Storage Tablet", "Manager Laptop").
            </p>

            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              autoFocus
            />

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingDevice(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRename}
                disabled={isUpdating || !newName.trim()}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {isUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Save Name</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

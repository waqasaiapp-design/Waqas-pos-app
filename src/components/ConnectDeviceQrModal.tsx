import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  X,
  Clock,
  ShieldCheck,
  Smartphone,
  Monitor,
  Tablet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  Wifi,
  Sparkles,
  Lock,
} from 'lucide-react';
import QRCode from 'qrcode';
import { PairingSession, DeviceInfo } from '../types/pos';
import { getApiBaseUrl } from '../utils/syncService';
import confetti from 'canvas-confetti';

interface ConnectDeviceQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeviceApproved?: (device: DeviceInfo) => void;
}

export const ConnectDeviceQrModal: React.FC<ConnectDeviceQrModalProps> = ({
  isOpen,
  onClose,
  onDeviceApproved,
}) => {
  const [session, setSession] = useState<PairingSession | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(300); // 5 min
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [approvedDevice, setApprovedDevice] = useState<DeviceInfo | null>(null);

  const pollIntervalRef = useRef<any>(null);

  // Generate pairing session
  const generateNewSession = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setApprovedDevice(null);
    try {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/devices/pairing-session`, { method: 'POST' });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to generate pairing session');
      }

      const newSession: PairingSession = {
        pairingToken: data.pairingToken,
        manualCode: data.manualCode,
        createdAt: Date.now(),
        expiresAt: data.expiresAt,
        status: 'pending_scan',
      };
      setSession(newSession);
      setTimeLeftSeconds(Math.max(0, Math.floor((data.expiresAt - Date.now()) / 1000)));

      // Generate QR Code data URL containing pairing token and the server URL for seamless pairing
      const serverOrigin = typeof window !== 'undefined' ? (getApiBaseUrl() || window.location.origin) : '';
      const qrPayload = JSON.stringify({
        app: 'WAQAS_MART_POS',
        pairingToken: data.pairingToken,
        manualCode: data.manualCode,
        serverUrl: serverOrigin,
        ts: Date.now(),
      });

      const url = await QRCode.toDataURL(qrPayload, {
        width: 320,
        margin: 2,
        color: {
          dark: '#057a44', // Brand green
          light: '#ffffff',
        },
      });
      setQrDataUrl(url);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error generating QR code. Please check server connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      generateNewSession();
    } else {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      setSession(null);
      setQrDataUrl('');
      setApprovedDevice(null);
    }
  }, [isOpen]);

  // Countdown timer
  useEffect(() => {
    if (!session || approvedDevice) return;
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [session, approvedDevice]);

  // Polling for device scan / approval request
  useEffect(() => {
    if (!session || !isOpen || approvedDevice) return;

    pollIntervalRef.current = setInterval(async () => {
      try {
        const base = getApiBaseUrl();
        const res = await fetch(`${base}/api/devices/pairing-status/${session.pairingToken}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.session) {
          setSession((prev) => {
            if (!prev) return data.session;
            return {
              ...prev,
              status: data.session.status,
              candidateDevice: data.session.candidateDevice,
            };
          });

          if (data.session.status === 'approved' && data.auth?.device) {
            setApprovedDevice(data.auth.device);
            clearInterval(pollIntervalRef.current);
            confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
            if (onDeviceApproved) onDeviceApproved(data.auth.device);
          }
        }
      } catch {}
    }, 1500);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [session?.pairingToken, isOpen, approvedDevice]);

  // Handle owner approval
  const handleApprove = async () => {
    if (!session) return;
    setIsApproving(true);
    try {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/devices/approve-pairing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pairingToken: session.pairingToken,
          approve: true,
        }),
      });
      const data = await res.json();
      if (data.success && data.device) {
        setApprovedDevice(data.device);
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.55 } });
        if (onDeviceApproved) onDeviceApproved(data.device);
      } else {
        alert(data.message || 'Failed to approve device.');
      }
    } catch {
      alert('Error approving device connection.');
    } finally {
      setIsApproving(false);
    }
  };

  // Handle owner rejection
  const handleReject = async () => {
    if (!session) return;
    try {
      await fetch('/api/devices/approve-pairing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pairingToken: session.pairingToken,
          approve: false,
        }),
      });
      generateNewSession();
    } catch {
      alert('Error rejecting pairing.');
    }
  };

  const handleCopyCode = () => {
    if (!session?.manualCode) return;
    navigator.clipboard?.writeText(session.manualCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-100 animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="bg-[#057a44] px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-emerald-200">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Connect New Device</h3>
              <p className="text-xs text-emerald-100 font-medium">Scan QR to Authorize Phone or PC</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-sm font-semibold">Generating secure pairing QR code...</p>
            </div>
          ) : errorMsg ? (
            <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
              <p className="text-sm font-semibold">{errorMsg}</p>
              <button
                onClick={generateNewSession}
                className="px-4 py-2 bg-red-600 text-white font-bold text-xs rounded-xl hover:bg-red-700 transition cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : approvedDevice ? (
            /* SUCCESS STATE */
            <div className="py-6 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900">Device Successfully Connected!</h4>
                <p className="text-xs text-slate-500 mt-1">
                  <span className="font-bold text-emerald-700">{approvedDevice.deviceName}</span> is now fully synchronized with WAQAS MART.
                </p>
              </div>

              <div className="w-full p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-left text-xs space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Device Name:</span>
                  <span className="font-bold text-slate-900">{approvedDevice.deviceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Device ID:</span>
                  <span className="font-mono font-bold text-emerald-800">{approvedDevice.deviceId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Type:</span>
                  <span>{approvedDevice.deviceType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-emerald-700">Active & Syncing</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-[#057a44] text-white font-bold rounded-2xl text-sm hover:bg-[#046337] transition shadow-md cursor-pointer"
              >
                Done / بند کریں
              </button>
            </div>
          ) : session?.status === 'pending_approval' && session.candidateDevice ? (
            /* OWNER APPROVAL CONFIRMATION PROMPT */
            <div className="py-2 space-y-4 animate-in fade-in">
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-center space-y-1.5">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="font-black text-slate-900 text-base">New Device Connection Request</h4>
                <p className="text-xs text-slate-600">
                  A device has scanned your QR code and is requesting permission to access your WAQAS MART account:
                </p>
              </div>

              {/* Candidate Device Specs */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  {session.candidateDevice.deviceType === 'Windows PC' ? (
                    <Monitor className="w-5 h-5 text-blue-600" />
                  ) : session.candidateDevice.deviceType === 'Tablet / iPad' ? (
                    <Tablet className="w-5 h-5 text-purple-600" />
                  ) : (
                    <Smartphone className="w-5 h-5 text-emerald-600" />
                  )}
                  <span className="font-black text-sm text-slate-900">
                    {session.candidateDevice.deviceName}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div>
                    <span className="text-slate-400 block">Device Type:</span>
                    <span className="font-semibold">{session.candidateDevice.deviceType}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Operating System:</span>
                    <span className="font-semibold">{session.candidateDevice.os}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Browser / App:</span>
                    <span className="font-semibold">{session.candidateDevice.browser}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Device ID:</span>
                    <span className="font-mono font-semibold">{session.candidateDevice.deviceId}</span>
                  </div>
                </div>
              </div>

              {/* Approval Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleReject}
                  className="py-3 px-4 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 font-bold rounded-2xl text-xs transition border border-slate-200 hover:border-red-200 cursor-pointer"
                >
                  Reject / مسترد کریں
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="py-3 px-4 bg-[#057a44] hover:bg-[#046337] text-white font-bold rounded-2xl text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isApproving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Approve & Connect</span>
                </button>
              </div>
            </div>
          ) : (
            /* DEFAULT QR DISPLAY */
            <div className="space-y-4">
              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-2xl border border-slate-200 relative">
                {timeLeftSeconds <= 0 ? (
                  <div className="w-64 h-64 flex flex-col items-center justify-center text-center p-4 bg-white/90 backdrop-blur-xs rounded-xl space-y-2">
                    <Clock className="w-10 h-10 text-amber-600" />
                    <p className="font-bold text-sm text-slate-800">QR Code Expired</p>
                    <p className="text-xs text-slate-500">Security tokens expire after 5 minutes.</p>
                    <button
                      onClick={generateNewSession}
                      className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Generate New Code</span>
                    </button>
                  </div>
                ) : (
                  qrDataUrl && (
                    <img
                      src={qrDataUrl}
                      alt="Pairing QR Code"
                      className="w-64 h-64 rounded-xl shadow-xs border border-slate-100"
                    />
                  )
                )}

                {/* Expiry Badge */}
                {timeLeftSeconds > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                    <span>Expires in {formatTimer(timeLeftSeconds)}</span>
                  </div>
                )}
              </div>

              {/* Manual Connection Code Fallback (For Computers or Cameras that cannot scan) */}
              <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Or Use Manual 6-Digit Code
                  </span>
                  <span className="text-base font-mono font-black text-slate-900 tracking-widest">
                    {session?.manualCode}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 bg-white text-emerald-800 font-bold text-xs rounded-xl border border-emerald-300 hover:bg-emerald-50 transition flex items-center gap-1 cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Instructions */}
              <div className="text-[11px] text-slate-500 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-700 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>How to connect a new phone or computer:</span>
                </p>
                <ol className="list-decimal list-inside space-y-0.5 text-slate-600 pl-1">
                  <li>Open WAQAS MART on the other device.</li>
                  <li>Click <b>Pair Device</b> or tap the QR camera icon.</li>
                  <li>Scan this QR code or type the 6-character code above.</li>
                  <li>Confirm the connection request on this screen to authorize.</li>
                </ol>
              </div>

              {/* Cancel / Regenerate */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={generateNewSession}
                  className="text-xs text-slate-600 hover:text-emerald-700 font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Code</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-1.5 text-xs text-slate-500 hover:text-slate-800 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

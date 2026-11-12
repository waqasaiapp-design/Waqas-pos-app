import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  X,
  Camera,
  Keyboard,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Zap,
  ZapOff,
  SwitchCamera,
  Smartphone,
  Monitor,
} from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { DeviceInfo } from '../types/pos';
import { syncService, getApiBaseUrl } from '../utils/syncService';
import confetti from 'canvas-confetti';

interface PairDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPairSuccess: (device: DeviceInfo, storeState?: any) => void;
}

export const PairDeviceModal: React.FC<PairDeviceModalProps> = ({
  isOpen,
  onClose,
  onPairSuccess,
}) => {
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWaitingForApproval, setIsWaitingForApproval] = useState(false);
  const [pairingToken, setPairingToken] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const pollTimerRef = useRef<any>(null);

  // Stop camera stream
  const stopScanner = () => {
    if (readerRef.current) {
      try {
        readerRef.current.reset();
      } catch {}
      readerRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    setTorchOn(false);
  };

  // Start camera scanner
  const startScanner = async () => {
    stopScanner();
    setErrorMessage(null);

    try {
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      const devices = await reader.listVideoInputDevices();
      let selectedDeviceId: string | undefined = undefined;

      if (devices.length > 0) {
        const backCamera = devices.find(
          (d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
        );
        selectedDeviceId = backCamera ? backCamera.deviceId : devices[0].deviceId;
      }

      setIsScanning(true);

      await reader.decodeFromVideoDevice(
        selectedDeviceId || null,
        videoRef.current!,
        (result, err) => {
          if (result) {
            const text = result.getText();
            handleScannedResult(text);
          }
        }
      );

      // Check torch capability
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const track = stream.getVideoTracks()[0];
        if (track) {
          const caps = (track.getCapabilities && (track.getCapabilities() as any)) || {};
          if (caps.torch) {
            setHasTorch(true);
          }
        }
      }
    } catch (err: any) {
      console.warn('Camera scan initialization error', err);
      setErrorMessage(
        'Could not access device camera. Please allow camera permissions or enter the 6-digit code manually below.'
      );
      setMode('manual');
    }
  };

  useEffect(() => {
    if (isOpen && mode === 'camera' && !isWaitingForApproval) {
      const t = setTimeout(() => {
        startScanner();
      }, 300);
      return () => {
        clearTimeout(t);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen, mode, isWaitingForApproval]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopScanner();
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  // Toggle flashlight
  const toggleTorch = async () => {
    if (!videoRef.current || !videoRef.current.srcObject) return;
    try {
      const stream = videoRef.current.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      if (track) {
        const next = !torchOn;
        await (track as any).applyConstraints({ advanced: [{ torch: next }] });
        setTorchOn(next);
      }
    } catch (e) {
      console.warn('Torch toggle error', e);
    }
  };

  // Process scanned text or manual code
  const handleScannedResult = async (rawText: string) => {
    stopScanner();
    let tokenOrCode = rawText.trim();

    // Check if JSON payload from WAQAS MART QR
    try {
      if (rawText.startsWith('{') && rawText.includes('WAQAS_MART_POS')) {
        const parsed = JSON.parse(rawText);
        if (parsed.serverUrl && typeof parsed.serverUrl === 'string' && parsed.serverUrl.startsWith('http')) {
          localStorage.setItem('waqas_mart_server_url', parsed.serverUrl);
        }
        tokenOrCode = parsed.pairingToken || parsed.manualCode || tokenOrCode;
      }
    } catch {}

    await submitPairingRequest(tokenOrCode);
  };

  const submitPairingRequest = async (tokenOrCode: string) => {
    if (!tokenOrCode) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const currentDev = syncService.getDevice();

    try {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/devices/pair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenOrCode,
          device: {
            deviceId: currentDev.deviceId,
            deviceName: currentDev.deviceName,
            deviceType: currentDev.deviceType,
            browser: currentDev.browser,
            os: currentDev.os,
          },
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Invalid or expired QR code.');
      }

      setPairingToken(data.session?.pairingToken || tokenOrCode);
      setIsWaitingForApproval(true);
      startPollingApproval(data.session?.pairingToken || tokenOrCode);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit pairing request.');
      if (mode === 'camera') {
        setTimeout(() => startScanner(), 2000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start polling for owner approval
  const startPollingApproval = (token: string) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    pollTimerRef.current = setInterval(async () => {
      try {
        const base = getApiBaseUrl();
        const res = await fetch(`${base}/api/devices/pairing-status/${token}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.success && data.session?.status === 'approved' && data.auth) {
          clearInterval(pollTimerRef.current);
          setIsWaitingForApproval(false);

          // Save session token in syncService
          if (data.auth.sessionToken) {
            syncService.setSessionToken(data.auth.sessionToken);
          }

          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          onPairSuccess(data.auth.device, data.auth.storeState);
        } else if (data.session?.status === 'rejected') {
          clearInterval(pollTimerRef.current);
          setIsWaitingForApproval(false);
          setErrorMessage('Connection request was rejected by the store owner.');
        } else if (data.session?.status === 'expired') {
          clearInterval(pollTimerRef.current);
          setIsWaitingForApproval(false);
          setErrorMessage('Pairing request has expired. Please try again.');
        }
      } catch {}
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-100 animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="bg-[#057a44] px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-emerald-200">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Pair This Device</h3>
              <p className="text-xs text-emerald-100 font-medium">Link this phone or computer</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Mode Switcher Tabs */}
          {!isWaitingForApproval && (
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setMode('camera')}
                className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mode === 'camera'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Scan QR Code</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('manual')}
                className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mode === 'manual'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                <Keyboard className="w-4 h-4" />
                <span>Enter 6-Digit Code</span>
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isWaitingForApproval ? (
            /* WAITING FOR OWNER APPROVAL */
            <div className="py-6 flex flex-col items-center text-center space-y-4 animate-in fade-in">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-inner">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold border-2 border-white">
                  !
                </div>
              </div>

              <div>
                <h4 className="font-black text-slate-900 text-base">Request Sent to Owner</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-[260px] mx-auto">
                  Please ask the store owner to tap <b>"Approve & Connect"</b> on their screen now.
                </p>
              </div>

              <div className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Device Name:</span>
                  <span className="font-bold text-slate-800">{syncService.getDevice().deviceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Device ID:</span>
                  <span className="font-mono">{syncService.getDevice().deviceId}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (pollTimerRef.current) clearInterval(pollTimerRef.current);
                  setIsWaitingForApproval(false);
                }}
                className="text-xs text-slate-500 hover:text-red-600 font-bold transition cursor-pointer"
              >
                Cancel Request
              </button>
            </div>
          ) : mode === 'camera' ? (
            /* CAMERA SCANNER VIEW */
            <div className="space-y-3">
              <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />

                {/* Animated Targeting Reticle */}
                <div className="absolute inset-8 border-2 border-dashed border-emerald-400/80 rounded-2xl pointer-events-none flex flex-col justify-between p-2">
                  <div className="flex justify-between">
                    <div className="w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                    <div className="w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                  </div>
                  <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-bounce" />
                  <div className="flex justify-between">
                    <div className="w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                    <div className="w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                  </div>
                </div>

                {/* Camera controls */}
                {hasTorch && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition cursor-pointer"
                    title="Toggle Flash"
                  >
                    {torchOn ? <Zap className="w-4 h-4 text-amber-400" /> : <ZapOff className="w-4 h-4" />}
                  </button>
                )}
              </div>

              <p className="text-[11px] text-center text-slate-500">
                Point camera at the QR code displayed on the store owner's device.
              </p>
            </div>
          ) : (
            /* MANUAL CODE INPUT (FOR COMPUTERS & LAPTOPS) */
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitPairingRequest(manualCode.trim());
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Enter Pairing Code</label>
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  placeholder="e.g. WM-8492"
                  maxLength={10}
                  className="w-full px-4 py-3 text-center text-lg font-mono font-black tracking-widest bg-slate-50 border border-slate-300 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 uppercase"
                  autoFocus
                />
                <p className="text-[10px] text-slate-500 text-center">
                  Get this 6-digit code from the owner's Connect Device screen.
                </p>
              </div>

              <button
                type="submit"
                disabled={!manualCode.trim() || isSubmitting}
                className="w-full py-3 bg-[#057a44] text-white font-bold rounded-2xl text-xs hover:bg-[#046337] transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>Submit Pairing Code</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

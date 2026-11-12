import React, { useEffect, useRef, useState } from 'react';
import { X, Volume2, VolumeX, Zap, ZapOff, Keyboard, Check, AlertCircle } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { sounds } from '../utils/audio';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBarcodeDetected: (barcode: string) => void;
  totalItems?: number;
  totalAmount?: number;
  onCheckout?: () => void;
  pageContext?: 'pos' | 'purchase' | 'product';
  lang?: 'en' | 'ur' | 'bi';
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onBarcodeDetected,
  totalItems = 0,
  totalAmount = 0,
  onCheckout,
  pageContext = 'pos',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scannedFeedback, setScannedFeedback] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [maxZoom, setMaxZoom] = useState<number>(1);

  // Prevent repeated spam scanning of the exact same code
  const lastScanTimeRef = useRef<number>(0);
  const lastScannedCodeRef = useRef<string>('');

  useEffect(() => {
    if (!isOpen) {
      stopScanning();
      setShowManualInput(false);
      setScannedFeedback(null);
      return;
    }

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;
    setErrorMsg(null);
    setScannedFeedback(null);

    // List available video devices and prefer rear/back camera
    reader
      .listVideoInputDevices()
      .then((videoInputDevices) => {
        if (videoInputDevices.length > 0) {
          const backCamera = videoInputDevices.find(
            (dev) =>
              dev.label.toLowerCase().includes('back') ||
              dev.label.toLowerCase().includes('environment') ||
              dev.label.toLowerCase().includes('rear')
          );
          const preferredId = backCamera ? backCamera.deviceId : videoInputDevices[0].deviceId;
          startScanning(preferredId);
        } else {
          // Fallback to default getUserMedia
          startScanning(null);
        }
      })
      .catch((err) => {
        console.error('Camera enumeration error:', err);
        setErrorMsg('Camera access failed or permission denied. You can enter barcode manually.');
      });

    return () => {
      stopScanning();
    };
  }, [isOpen]);

  const startScanning = async (deviceId: string | null) => {
    if (!readerRef.current || !videoRef.current) return;

    try {
      setErrorMsg(null);
      readerRef.current.reset();

      readerRef.current.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            const code = result.getText().trim();
            const now = Date.now();
            // Debounce same code for 1.5 seconds to prevent accidental duplicate additions
            if (code === lastScannedCodeRef.current && now - lastScanTimeRef.current < 1500) {
              return;
            }
            lastScanTimeRef.current = now;
            lastScannedCodeRef.current = code;
            handleSuccessScan(code);
          }
          if (err && err.name !== 'NotFoundException') {
            // normal frame miss
          }
        }
      );

      // Check capabilities for torch & zoom
      setTimeout(() => {
        try {
          const stream = videoRef.current?.srcObject as MediaStream | null;
          const track = stream?.getVideoTracks()[0];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const capabilities = track?.getCapabilities?.() as any;
          if (capabilities) {
            setHasTorch(Boolean(capabilities.torch));
            if (capabilities.zoom) {
              setMaxZoom(capabilities.zoom.max || 3);
            }
          }
        } catch {
          setHasTorch(false);
        }
      }, 700);
    } catch (err) {
      console.error('Camera scanning start error:', err);
      setErrorMsg('Could not start camera. Please check camera permissions or enter manually.');
    }
  };

  const stopScanning = () => {
    try {
      if (readerRef.current) {
        readerRef.current.reset();
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    } catch (e) {
      console.warn('Error stopping scanner:', e);
    }
    setTorchOn(false);
  };

  const toggleTorch = async () => {
    try {
      const stream = videoRef.current?.srcObject as MediaStream | null;
      const track = stream?.getVideoTracks()[0];
      if (track) {
        const nextTorch = !torchOn;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (track as any).applyConstraints({
          advanced: [{ torch: nextTorch }],
        });
        setTorchOn(nextTorch);
      }
    } catch (err) {
      console.warn('Torch toggle not supported', err);
    }
  };

  const handleTapToFocus = async () => {
    try {
      const stream = videoRef.current?.srcObject as MediaStream | null;
      const track = stream?.getVideoTracks()[0];
      if (track) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (track as any).applyConstraints({
          advanced: [{ focusMode: 'continuous' }],
        });
      }
    } catch {
      // Ignore if not supported
    }
  };

  const handleZoomChange = async (newZoom: number) => {
    try {
      setZoomLevel(newZoom);
      const stream = videoRef.current?.srcObject as MediaStream | null;
      const track = stream?.getVideoTracks()[0];
      if (track) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (track as any).applyConstraints({
          advanced: [{ zoom: newZoom }],
        });
      }
    } catch {
      // Ignore
    }
  };

  const handleSuccessScan = (code: string) => {
    if (!isMuted) {
      sounds.playBarcodeBeep();
    }
    setScannedFeedback(code);

    // Call callback
    onBarcodeDetected(code);

    // If on Add New Product, close automatically after scan
    if (pageContext === 'product') {
      setTimeout(() => {
        onClose();
      }, 500);
    } else {
      setTimeout(() => {
        setScannedFeedback(null);
      }, 1000);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleSuccessScan(manualCode.trim());
    setManualCode('');
    setShowManualInput(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden select-none font-sans">
      {/* 1. TOP HEADER OVERLAY */}
      <div className="relative z-30 flex items-center justify-between px-5 pt-4 pb-2 text-white">
        {/* Left: Close X Button */}
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          aria-label="Close scanner"
        >
          <X className="w-7 h-7 stroke-[2.2]" />
        </button>

        {/* Right: Audio Mute / Flashlight Toggle matching Screenshot 2 */}
        <div className="flex items-center gap-2">
          {hasTorch && (
            <button
              type="button"
              onClick={toggleTorch}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                torchOn ? 'bg-amber-400 text-black' : 'text-white/90 hover:bg-white/10'
              }`}
              title="Toggle Flashlight"
            >
              {torchOn ? <Zap className="w-6 h-6 fill-current" /> : <ZapOff className="w-6 h-6" />}
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            title={isMuted ? 'Unmute scanner beep' : 'Mute scanner beep'}
          >
            {isMuted ? (
              <VolumeX className="w-6 h-6 stroke-[2.2]" />
            ) : (
              <Volume2 className="w-6 h-6 stroke-[2.2]" />
            )}
          </button>
        </div>
      </div>

      {/* 2. FULL-SCREEN VIDEO VIEWPORT & BLUE RECTANGULAR SCANNING BOX */}
      <div
        className="relative flex-1 flex flex-col items-center justify-center overflow-hidden cursor-crosshair"
        onClick={handleTapToFocus}
      >
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />

        {/* Translucent Vignette / Mask */}
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />

        {/* Centered Blue Rectangular Scanning Box matching Screenshot 2 */}
        <div className="relative z-20 w-72 h-72 sm:w-80 sm:h-80 border-2 border-[#2563eb] rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] flex items-center justify-center pointer-events-none">
          {/* Subtle animated red scanning beam */}
          <div className="absolute inset-x-2 h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse top-1/2 -translate-y-1/2 opacity-80" />

          {/* Feedback Overlay on scan */}
          {scannedFeedback && (
            <div className="absolute inset-0 bg-emerald-600/75 rounded-md flex flex-col items-center justify-center text-white backdrop-blur-xs p-3">
              <Check className="w-12 h-12 stroke-[3]" />
              <p className="font-mono text-sm font-black mt-2 text-center">{scannedFeedback}</p>
              <p className="text-xs text-emerald-100 font-bold mt-1">Scanned & Added</p>
            </div>
          )}
        </div>

        {/* Instruction Text matching Screenshot 2 */}
        <div className="relative z-20 text-center mt-6 px-4 space-y-1 pointer-events-none">
          <p className="text-sm font-semibold text-white drop-shadow-md">
            Align barcode inside the box
          </p>
          <p className="text-xs font-normal text-white/80 drop-shadow-md">
            Pinch to Zoom | Tap to Focus
          </p>
        </div>

        {/* Zoom Slider if hardware supports it */}
        {maxZoom > 1 && (
          <div className="relative z-20 mt-3 flex items-center gap-2 bg-black/50 px-4 py-1.5 rounded-full text-white text-xs backdrop-blur-md">
            <span>1x</span>
            <input
              type="range"
              min="1"
              max={maxZoom}
              step="0.1"
              value={zoomLevel}
              onChange={(e) => handleZoomChange(Number(e.target.value))}
              className="w-24 accent-blue-500 cursor-pointer"
            />
            <span>{maxZoom}x</span>
          </div>
        )}

        {/* Error Notice */}
        {errorMsg && (
          <div className="relative z-20 mx-4 mt-3 p-3 bg-red-950/80 border border-red-500 text-white text-xs rounded-xl flex items-center gap-2 backdrop-blur-md">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Manual Barcode Input Card (If user clicks Add Manually) */}
        {showManualInput && (
          <div className="relative z-30 mx-4 mt-4 w-full max-w-sm bg-white text-slate-900 rounded-2xl p-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800">Enter Barcode Manually</span>
              <button
                type="button"
                onClick={() => setShowManualInput(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                autoFocus
                placeholder="Type barcode or SKU..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Add
              </button>
            </form>
          </div>
        )}
      </div>

      {/* 3. BOTTOM WHITE ROUNDED PANEL MATCHING SCREENSHOT 2 */}
      <div className="relative z-30 bg-white rounded-t-3xl p-5 shadow-2xl space-y-4">
        {/* Top Info Row */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-slate-700">
            Total Items: <strong className="text-slate-900">{totalItems}</strong>
          </span>
          <span className="text-base font-black text-slate-900 font-sans">
            Total: Rs. {totalAmount.toFixed(2)}
          </span>
        </div>

        {/* Bottom Action Buttons: Add Manually & Checkout */}
        <div className="grid grid-cols-2 gap-3">
          {/* Add Manually Button */}
          <button
            type="button"
            onClick={() => setShowManualInput(!showManualInput)}
            className="py-3.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs active:scale-98 cursor-pointer"
          >
            <Keyboard className="w-4 h-4 text-slate-500" />
            <span>Add Manually</span>
          </button>

          {/* Checkout Button (Only active on Sale POS or when items exist) */}
          <button
            type="button"
            onClick={() => {
              if (onCheckout) {
                onCheckout();
                onClose();
              } else {
                onClose();
              }
            }}
            className="py-3.5 px-4 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer"
          >
            <span>{pageContext === 'pos' ? 'Checkout' : 'Done'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

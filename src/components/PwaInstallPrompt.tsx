import React, { useState, useEffect } from 'react';
import {
  Download,
  X,
  Monitor,
  Smartphone,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Laptop,
} from 'lucide-react';

interface PwaInstallPromptProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: any;
}

export const PwaInstallPrompt: React.FC<PwaInstallPromptProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
}) => {
  const [installed, setInstalled] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
      }
    } else {
      // Fallback instruction
      alert(
        'To install on Windows: Click the Install icon (⨁) in your Chrome/Edge browser address bar, or click Menu (⋮) -> "Install WAQAS MART".\n\nTo install on Android: Tap Chrome Menu (⋮) -> "Add to Home screen" or "Install App".'
      );
    }
  };

  const isWindows = typeof navigator !== 'undefined' && /Win/i.test(navigator.userAgent);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#057a44] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-emerald-200">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Install WAQAS MART Desktop & Mobile</h3>
              <p className="text-xs text-emerald-100 font-medium">Native App Experience without EXE installers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 font-medium">
            <Sparkles className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>Works offline, opens instantly from desktop taskbar or home screen, and takes zero disk space.</span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
              <Laptop className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-slate-900">Windows 10 / 11 (Chrome or Edge)</h4>
                <p className="text-slate-500 text-[11px]">
                  Click the <b>Install App (⨁)</b> icon on the right side of the URL address bar, or use the Install button below. It will open in a clean, borderless POS window with full barcode scanner support.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
              <Smartphone className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-slate-900">Android Phones & Tablets</h4>
                <p className="text-slate-500 text-[11px]">
                  Tap browser Menu (⋮) and tap <b>"Install App"</b> or <b>"Add to Home screen"</b>. Launches like a native Android supermarket POS terminal.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={handleInstallClick}
              className="w-full py-3 bg-[#057a44] text-white font-extrabold text-xs rounded-2xl hover:bg-[#046337] transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isWindows ? 'Install on Windows Desktop' : 'Install WAQAS MART App'}</span>
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-800 font-bold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

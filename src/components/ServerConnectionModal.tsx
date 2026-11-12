import React, { useState, useEffect } from 'react';
import {
  Server,
  Globe,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  ExternalLink,
  ShieldAlert,
  Zap,
  Info,
  Laptop,
} from 'lucide-react';
import {
  getApiBaseUrl,
  setCustomApiBaseUrl,
  testServerConnection,
} from '../utils/apiClient';

interface ServerConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (newUrl: string) => void;
}

export const ServerConnectionModal: React.FC<ServerConnectionModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    ok: boolean;
    status: number;
    message: string;
    data?: any;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const current = getApiBaseUrl();
      setUrlInput(current);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async (testUrl?: string) => {
    const target = testUrl !== undefined ? testUrl : urlInput;
    setTesting(true);
    setTestResult(null);

    const res = await testServerConnection(target);
    setTesting(false);
    setTestResult({
      tested: true,
      ok: res.ok,
      status: res.status,
      message: res.message,
      data: res.data,
    });
  };

  const handleSave = () => {
    setCustomApiBaseUrl(urlInput);
    if (onSaved) onSaved(urlInput);
    onClose();
  };

  const handlePreset = (presetUrl: string) => {
    setUrlInput(presetUrl);
    handleTest(presetUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-emerald-500/40 rounded-3xl shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xs">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                Server Connection Settings
              </h3>
              <p className="text-xs text-emerald-400/90 font-medium">
                بیک اینڈ سرور کنکشن اور API کنفیگریشن
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Diagnostic Note */}
          <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 space-y-1">
            <div className="flex items-center gap-2 font-bold text-emerald-300">
              <Info className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Production Deployment Guidance</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              If deploying on a production domain, keep empty to use reverse-proxy (<code className="text-amber-300">/api</code> on same origin), or provide your full Node.js API server URL (e.g. <code className="text-amber-300">https://api.yourdomain.com</code> or <code className="text-amber-300">http://YOUR_SERVER_IP:3000</code>).
            </p>
            <p className="text-[11px] text-emerald-300/90 font-urdu pt-1 border-t border-emerald-500/20" dir="rtl">
              اگر آپ نے ویب سائٹ پر ڈپلائے کیا ہے تو یقینی بنائیں کہ Node.js سرور چل رہا ہو۔ اگر API دوسری ڈومین پر ہے تو اس کا ایڈریس یہاں لکھیں۔
            </p>
          </div>

          {/* Server URL Input */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300 flex items-center justify-between">
              <span>Backend API Server URL</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {urlInput ? urlInput : '(Relative same-origin /api)'}
              </span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Globe className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setTestResult(null);
                }}
                placeholder="e.g. https://api.yourdomain.com or leave blank"
                className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => handleTest()}
                disabled={testing}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer text-xs"
              >
                {testing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                )}
                <span>Test</span>
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Quick Presets
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handlePreset('')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Same Domain (Reverse Proxy /api)
              </button>
              <button
                type="button"
                onClick={() => handlePreset('http://localhost:3000')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Localhost (http://localhost:3000)
              </button>
            </div>
          </div>

          {/* Test Status Banner */}
          {testResult && (
            <div
              className={`p-3.5 rounded-2xl border text-xs space-y-1 animate-in fade-in ${
                testResult.ok
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                  : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {testResult.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{testResult.ok ? 'Connection Verified' : 'Connection Failed'}</span>
                <span className="text-[10px] opacity-75 font-mono">
                  (Status: {testResult.status || '0/Network Error'})
                </span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-95">
                {testResult.message}
              </p>
              {testResult.ok && testResult.data && (
                <div className="pt-1.5 border-t border-emerald-500/20 text-[10px] text-emerald-300 font-mono flex items-center justify-between">
                  <span>Server: {testResult.data.app || 'WAQAS POS'}</span>
                  <span>Ver: {testResult.data.version || '2.6.4'}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 font-bold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-950/50 transition-all active:scale-95 cursor-pointer"
          >
            Save & Connect
          </button>
        </div>
      </div>
    </div>
  );
};

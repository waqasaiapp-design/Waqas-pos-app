import React, { useState } from 'react';
import {
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  X,
  ShieldCheck,
  AlertCircle,
  HardDrive,
  Info,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  generateStrongMartPassword,
  saveActiveMartPassword,
  getActiveMartPassword,
} from '../utils/martAuthSecurity';
import { safeFetchJson } from '../utils/apiClient';

interface GenerateMartPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPasswordGenerated?: (newPassword: string) => void;
}

export const GenerateMartPasswordModal: React.FC<GenerateMartPasswordModalProps> = ({
  isOpen,
  onClose,
  onPasswordGenerated,
}) => {
  const [currentPassword, setCurrentPassword] = useState<string>(() => getActiveMartPassword());
  const [showPassword, setShowPassword] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [showConfirmReplacement, setShowConfirmReplacement] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = () => {
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(currentPassword);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = currentPassword;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const handleGenerateNew = async () => {
    const newPass = generateStrongMartPassword();
    saveActiveMartPassword(newPass);
    setCurrentPassword(newPass);
    setShowConfirmReplacement(false);
    setSuccessMessage('New strong Mart Password successfully generated and activated!');
    setTimeout(() => setSuccessMessage(null), 4000);

    // Sync with server if online
    try {
      await safeFetchJson('/api/auth/generate-mart-password', {
        method: 'POST',
        body: JSON.stringify({ password: newPass }),
      });
    } catch {}

    if (onPasswordGenerated) {
      onPasswordGenerated(newPass);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4 backdrop-blur-xs select-none animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl shadow-2xl text-white overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border-b border-emerald-900/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0 shadow-sm">
              <KeyRound className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight leading-tight flex items-center gap-2">
                <span>Generate Mart Password</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                  Owner Only
                </span>
              </h2>
              <p className="text-xs text-emerald-300/80">
                مارٹ پاسورڈ بنائیں اور دوسرے کاؤنٹرز / ڈیوائسز پر شیئر کریں
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Success Banner */}
          {successMessage && (
            <div className="p-3 rounded-2xl bg-emerald-950 border border-emerald-500/50 text-emerald-200 flex items-center gap-2.5 animate-in fade-in">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="font-bold">{successMessage}</span>
            </div>
          )}

          {/* Active Mart Password Box */}
          <div className="bg-slate-950 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-inner space-y-3">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-bold uppercase tracking-wider text-[11px] text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Active Mart Password
              </span>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPassword ? 'Hide' : 'Reveal'}</span>
              </button>
            </div>

            {/* Display Box */}
            <div className="p-3.5 bg-slate-900 rounded-xl border border-emerald-500/30 flex items-center justify-between gap-3 font-mono">
              <span className="text-lg sm:text-xl font-black text-emerald-400 tracking-wider truncate">
                {showPassword ? currentPassword : '••••••••••••••••••••'}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer shrink-0"
                title="Copy Mart Password"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-white" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Share this password with cashier staff. They can enter it manually on any other phone, tablet, or PC to log in as Mart User.
            </p>
          </div>

          {/* Action Buttons: Generate Replacement Password */}
          {!showConfirmReplacement ? (
            <div className="pt-1 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmReplacement(true)}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 active:scale-95 transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-slate-950" />
                <span>Generate Replacement Password (نیا پاسورڈ بنائیں)</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 active:scale-95 transition cursor-pointer"
              >
                <Copy className="w-4 h-4 text-emerald-400" />
                <span>Copy Password</span>
              </button>
            </div>
          ) : (
            /* Replacement Confirmation Dialog */
            <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-500/40 space-y-3 animate-in fade-in">
              <div className="flex items-start gap-2.5 text-amber-200">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs text-white">Confirm Password Replacement</h4>
                  <p className="text-[11px] text-amber-200/90 mt-0.5 leading-relaxed">
                    Generating a replacement password will create a brand new active password for your store.
                    Staff on other devices will need to enter this new password when logging in again.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowConfirmReplacement(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGenerateNew}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md cursor-pointer"
                >
                  Yes, Generate New Password
                </button>
              </div>
            </div>
          )}

          {/* Offline Technical Explainer */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span>How Manual Password Entry Works on Other Devices</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400 leading-relaxed">
              <li>
                <strong className="text-slate-300">Copy this Mart Password</strong> and share it with your cashiers.
              </li>
              <li>
                On <strong className="text-slate-300">Device B</strong> (cashier tablet/phone/PC), open WAQAS MART.
              </li>
              <li>
                Select <strong className="text-slate-300">Mart User</strong> on the first login screen.
              </li>
              <li>
                Manually type or paste this exact password.
              </li>
              <li>
                Device B verifies the password <strong className="text-emerald-400">100% offline</strong> using its self-contained cryptographic signature without requiring internet access or connection to Device A.
              </li>
            </ol>
            <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 leading-normal flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>
                <strong>Offline Sync Limitation Note:</strong> Because completely disconnected devices operate without internet, they cannot instantly know when a password was replaced or revoked until they receive the updated credential or are logged out.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-xs shrink-0">
          <span className="text-[11px] text-slate-400">Owner Access Only</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold cursor-pointer transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  AlertCircle,
  HardDrive,
  Eye,
  EyeOff,
  Lock,
  Store,
  Crown,
  Info,
} from 'lucide-react';
import { WaqasDualProfileCards } from './WaqasDualProfileCards';
import { FullScreenPageHeader } from './FullScreenPageHeader';
import {
  generateStrongMartPassword,
  saveActiveMartPassword,
  getActiveMartPassword,
  FIXED_OWNER_PASSWORD,
} from '../utils/martAuthSecurity';
import { safeFetchJson } from '../utils/apiClient';

interface SecuritySettingsPageProps {
  onBackToHome?: () => void;
  isOwner?: boolean;
}

export const SecuritySettingsPage: React.FC<SecuritySettingsPageProps> = ({
  onBackToHome,
  isOwner = true,
}) => {
  const [activePassword, setActivePassword] = useState<string>(() => getActiveMartPassword());
  const [showPassword, setShowPassword] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [showConfirmReplacement, setShowConfirmReplacement] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleCopy = () => {
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(activePassword);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = activePassword;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      showToast('Mart Password copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const handleGenerateNewPassword = async () => {
    const newPass = generateStrongMartPassword();
    saveActiveMartPassword(newPass);
    setActivePassword(newPass);
    setShowConfirmReplacement(false);
    showToast('New strong Mart Password generated & activated successfully!');

    // Sync with server if online
    try {
      await safeFetchJson('/api/auth/generate-mart-password', {
        method: 'POST',
        body: JSON.stringify({ password: newPass }),
      });
    } catch {}
  };

  // If a Mart User attempts to access this page, block and show unauthorized message
  if (!isOwner) {
    return (
      <div className="h-full flex flex-col w-full bg-[#f8fafc] text-slate-900 font-sans select-none overflow-hidden">
        <FullScreenPageHeader
          title="Security Settings"
          urduTitle="سیکیورٹی سیٹنگز"
          icon={<ShieldCheck className="w-5 h-5 text-indigo-600" />}
          onBackToHome={onBackToHome}
        />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white p-6 rounded-3xl border border-red-200 shadow-xl text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-black text-slate-900">Access Restricted (رسائی ممنوع ہے)</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Only the <strong>Software Owner</strong> is authorized to view or generate Mart Passwords and access security settings.
            </p>
            <button
              type="button"
              onClick={onBackToHome}
              className="mt-3 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-full flex flex-col w-full bg-[#f8fafc] text-slate-900 font-sans">
      <FullScreenPageHeader
        title="Security & Mart Password Management"
        urduTitle="سیکیورٹی اور مارٹ پاسورڈ منیجمنٹ"
        subtitle="Generate strong offline-verifiable Mart Passwords for POS terminals"
        icon={<ShieldCheck className="w-5 h-5 text-indigo-600" />}
        onBackToHome={onBackToHome}
        accentColor="indigo"
      />

      {/* Main Workstation Container (Responsive & Screen-Fitting) */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 lg:p-6 w-full space-y-4">
        {/* Toast Feedback */}
        {feedbackMsg && (
          <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Dual Profile Cards */}
        <div className="space-y-2">
          <WaqasDualProfileCards variant="sidebar" />
        </div>

        {/* Section 1: Software Owner Authority Card */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-5 border border-slate-700 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
              <Crown className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base text-white">Software Owner Mode</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Full Authorized Control
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Software Owner has exclusive authority to generate and manage Mart Passwords.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-2 rounded-2xl border border-slate-700 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300">Owner Status:</span>
            <span className="font-black text-emerald-400">Authenticated</span>
          </div>
        </div>

        {/* Section 2: Generate Mart Password Card (Owner Only) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <span>Generate Mart Password</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold uppercase">
                    Feature
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Create strong random passwords for other counter devices (phones, tablets, PCs)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy Password'}</span>
            </button>
          </div>

          {/* Active Mart Password Box */}
          <div className="p-4 sm:p-5 bg-slate-950 rounded-2xl border border-slate-800 text-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Active Store Mart Password
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

            <div className="p-3.5 bg-slate-900 rounded-xl border border-emerald-500/30 flex items-center justify-between gap-3 font-mono">
              <span className="text-base sm:text-xl font-black text-emerald-400 tracking-wider truncate">
                {showPassword ? activePassword : '••••••••••••••••••••'}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer shrink-0"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Staff on other devices select <strong>Mart User</strong> on the first login screen and manually enter this password.
            </p>
          </div>

          {/* Replacement Controls */}
          {!showConfirmReplacement ? (
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmReplacement(true)}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-950/20 active:scale-95 transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-slate-950" />
                <span>Generate Replacement Password (نیا پاسورڈ جنریٹ کریں)</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 space-y-3 animate-in fade-in">
              <div className="flex items-start gap-2.5 text-amber-900">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs">Confirm Password Replacement</h4>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                    This will immediately generate a new Mart Password. Previously connected offline devices will continue running until they receive the new credential or are logged out.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowConfirmReplacement(false)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGenerateNewPassword}
                  className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-sm cursor-pointer"
                >
                  Yes, Generate Replacement Password
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Technical & Offline Architecture Notice */}
        <div className="bg-slate-50 rounded-3xl border border-slate-200 p-5 space-y-3 text-xs">
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <HardDrive className="w-4 h-4 text-emerald-600" />
            <span>Offline Password Verification Architecture</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            The Mart Password contains a <strong>self-contained cryptographic signature</strong> derived from the system secret.
            When a staff member opens the application on any other device (Device B, C, etc.) without an internet connection or server access, the application verifies the cryptographic signature offline right in the browser.
          </p>
          <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-2 text-[10px] text-slate-500">
            <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
            <span>
              <strong>Offline Sync Boundary:</strong> Because fully disconnected devices operate in offline standalone mode, they verify the mathematical validity of the password locally. They cannot instantly know that a password was replaced on another device until they receive the updated credential or are logged out.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

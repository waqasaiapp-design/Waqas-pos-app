import React, { useState } from 'react';
import {
  Crown,
  Store,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  HardDrive,
  KeyRound,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  verifyOwnerPassword,
  verifyMartPassword,
  setAuthSession,
  MartAuthSession,
  FIXED_OWNER_PASSWORD,
} from '../../utils/martAuthSecurity';
import { safeFetchJson } from '../../utils/apiClient';

interface LoginGatewayProps {
  onLoginSuccess: (session: MartAuthSession) => void;
}

export const LoginGateway: React.FC<LoginGatewayProps> = ({ onLoginSuccess }) => {
  // Option: 'OWNER' | 'MART_USER'
  const [selectedRole, setSelectedRole] = useState<'OWNER' | 'MART_USER'>('OWNER');

  // Software Owner State
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);
  const [ownerError, setOwnerError] = useState<string | null>(null);
  const [ownerLoading, setOwnerLoading] = useState(false);

  // Mart User State
  const [martPassword, setMartPassword] = useState('');
  const [showMartPassword, setShowMartPassword] = useState(false);
  const [martError, setMartError] = useState<string | null>(null);
  const [martLoading, setMartLoading] = useState(false);

  // Handle Software Owner Login
  const handleOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOwnerError(null);
    setOwnerLoading(true);

    try {
      const cleanInput = ownerPassword.trim();
      const isOwnerValid = verifyOwnerPassword(cleanInput);

      if (!isOwnerValid) {
        setOwnerError('Incorrect Owner Password. Please enter the valid Software Owner password.');
        setOwnerLoading(false);
        return;
      }

      // Try server sync if available (graceful fallback if offline)
      let serverToken = `TOKEN-OWNER-${Date.now()}`;
      try {
        const res = await safeFetchJson('/api/auth/owner-login', {
          method: 'POST',
          body: JSON.stringify({ password: cleanInput }),
        });
        if (res.data?.token) {
          serverToken = res.data.token;
        }
      } catch {
        // Disconnected / Offline mode: valid
      }

      const session: MartAuthSession = {
        role: 'SOFTWARE_OWNER',
        user: {
          id: 'USR-OWNER-01',
          displayName: 'Muhammad Waqas (Owner)',
          username: 'owner',
          role: 'SOFTWARE_OWNER',
          email: 'waqasmart.pos@gmail.com',
        },
        token: serverToken,
        createdAt: Date.now(),
      };

      setAuthSession(session);
      confetti({ particleCount: 60, spread: 55, origin: { y: 0.6 } });
      onLoginSuccess(session);
    } catch {
      setOwnerError('Login verification failed. Please try again.');
    } finally {
      setOwnerLoading(false);
    }
  };

  // Handle Mart User Login
  const handleMartUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMartError(null);
    setMartLoading(true);

    try {
      const cleanInput = martPassword.trim();
      const checkResult = verifyMartPassword(cleanInput);

      if (!checkResult.isValid) {
        setMartError(
          checkResult.reason ||
            'Invalid Mart Password. Please enter the valid password provided by the Software Owner.'
        );
        setMartLoading(false);
        return;
      }

      // Try server sync if available (graceful fallback if offline)
      let serverToken = `TOKEN-MART-${Date.now()}`;
      try {
        const res = await safeFetchJson('/api/auth/mart-login', {
          method: 'POST',
          body: JSON.stringify({ password: cleanInput }),
        });
        if (res.data?.token) {
          serverToken = res.data.token;
        }
      } catch {
        // Disconnected / Offline mode: valid
      }

      const session: MartAuthSession = {
        role: 'MART_USER',
        user: {
          id: `USR-MART-${Date.now().toString().slice(-4)}`,
          displayName: 'Mart Cashier',
          username: 'cashier',
          role: 'MART_USER',
          email: 'cashier@waqasmart.local',
        },
        token: serverToken,
        createdAt: Date.now(),
      };

      setAuthSession(session);
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
      onLoginSuccess(session);
    } catch {
      setMartError('Password verification error. Please check your entered password.');
    } finally {
      setMartLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-slate-950 flex flex-col justify-start sm:justify-center items-center p-4 py-8 relative selection:bg-emerald-500 selection:text-white overflow-y-auto">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-emerald-950/40 via-slate-950 to-slate-950 -z-10" />

      {/* Main Authentication Card */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Card Header */}
        <div className="p-6 text-center border-b border-slate-800/80 bg-slate-900/60">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-500 to-yellow-600 text-slate-950 mb-3 shadow-lg shadow-amber-950/50">
            <Crown className="w-8 h-8 stroke-[2.4]" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-white uppercase">WAQAS POS SOFTWARE</h1>
          <p className="text-xs text-amber-400 font-medium mt-1">
            Sign In to Terminal • لاگ اِن ٹرمینل
          </p>

          {/* Clean 2-Option Selector: 1. Software Owner | 2. Mart User */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 mt-5">
            <button
              type="button"
              onClick={() => {
                setSelectedRole('OWNER');
                setOwnerError(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                selectedRole === 'OWNER'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-950/40 ring-1 ring-amber-300'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Crown className={`w-4 h-4 ${selectedRole === 'OWNER' ? 'text-slate-950' : 'text-amber-400'}`} />
              <span>Software Owner</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRole('MART_USER');
                setMartError(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                selectedRole === 'MART_USER'
                  ? 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-950/40 ring-1 ring-emerald-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Store className="w-4 h-4 text-emerald-400" />
              <span>Mart User</span>
            </button>
          </div>
        </div>

        {/* Option 1: Software Owner Login */}
        {selectedRole === 'OWNER' && (
          <form onSubmit={handleOwnerSubmit} className="p-6 space-y-4 text-xs">
            {ownerError && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{ownerError}</span>
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Owner Password
              </label>
              <div className="relative">
                <input
                  type={showOwnerPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  placeholder="Enter Owner Password"
                  className="w-full px-3.5 py-3 pr-10 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-sm font-medium tracking-wide"
                />
                <button
                  type="button"
                  onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white transition cursor-pointer"
                  tabIndex={-1}
                >
                  {showOwnerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={ownerLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4 text-slate-950" />
              <span>{ownerLoading ? 'Verifying...' : 'Login as Software Owner'}</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>

            <p className="text-[11px] text-slate-400 text-center leading-relaxed pt-1">
              Software Owner has complete authorized administrative access to all settings and mart password generation.
            </p>
          </form>
        )}

        {/* Option 2: Mart User Login */}
        {selectedRole === 'MART_USER' && (
          <form onSubmit={handleMartUserSubmit} className="p-6 space-y-4 text-xs">
            {martError && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{martError}</span>
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Mart Password
              </label>
              <div className="relative">
                <input
                  type={showMartPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={martPassword}
                  onChange={(e) => setMartPassword(e.target.value)}
                  placeholder="Enter Mart Password (e.g. MART-XXXX-YYYY-ZZZZ)"
                  className="w-full px-3.5 py-3 pr-10 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm font-mono font-medium tracking-wider uppercase"
                />
                <button
                  type="button"
                  onClick={() => setShowMartPassword(!showMartPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white transition cursor-pointer"
                  tabIndex={-1}
                >
                  {showMartPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={martLoading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Store className="w-4 h-4" />
              <span>{martLoading ? 'Verifying...' : 'Login as Mart User'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-[11px] text-slate-400 text-center leading-relaxed pt-1">
              Enter the password provided by the Software Owner. Works 100% offline without requiring internet or server access.
            </p>
          </form>
        )}

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <HardDrive className="w-3 h-3 text-emerald-400" />
            100% Offline Local Device Execution
          </span>
          <span className="font-mono text-slate-400">WAQAS MART POS</span>
        </div>
      </div>
    </div>
  );
};

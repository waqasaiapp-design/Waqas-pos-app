import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Phone, MessageCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      localStorage.removeItem('waqas_mart_auth_session');
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-black text-white text-base">WAQAS POS SOFTWARE</h2>
                <p className="text-xs text-red-300 font-medium">An unexpected interface error occurred</p>
              </div>
            </div>

            <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-xl text-xs text-red-200 font-mono break-words">
              {this.state.error?.message || 'Unknown render error'}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload App</span>
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-black cursor-pointer"
              >
                <span>Reset Session</span>
              </button>
            </div>

            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Owner: Muhammad Waqas</span>
              <a
                href="https://wa.me/923228570782"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline flex items-center gap-1 font-bold"
              >
                <MessageCircle className="w-3.5 h-3.5" /> 03228570782
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

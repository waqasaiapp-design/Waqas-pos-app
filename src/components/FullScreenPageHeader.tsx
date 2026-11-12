import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Maximize2,
  Minimize2,
  Store,
  Calendar,
  Home,
  Check,
} from 'lucide-react';

interface FullScreenPageHeaderProps {
  title: string;
  urduTitle?: string;
  subtitle?: string;
  icon: React.ReactNode;
  storeName?: string;
  onBackToHome?: () => void;
  actions?: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  accentColor?: string;
}

export const FullScreenPageHeader: React.FC<FullScreenPageHeaderProps> = ({
  title,
  urduTitle,
  subtitle,
  icon,
  storeName = 'WAQAS MART',
  onBackToHome,
  actions,
  badge,
  badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  accentColor,
}) => {
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

  return (
    <header className="w-full bg-slate-900 text-white px-3 sm:px-5 py-2.5 flex items-center justify-between border-b border-slate-800 shadow-md shrink-0 select-none z-20">
      {/* Left: Small Back/Exit control + Page Title */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        <button
          type="button"
          onClick={onBackToHome}
          className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-red-950 text-slate-200 hover:text-red-200 border border-slate-700 hover:border-red-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
          title="Return to Main Dashboard / واپس مین پیج"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-amber-400 group-hover:text-red-400" />
          <span>Back</span>
          <span className="hidden md:inline text-[11px] text-slate-400 font-serif">/ واپس</span>
        </button>

        <span className="text-slate-700 hidden sm:inline">|</span>

        {/* Icon & Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-600/90 text-white flex items-center justify-center shrink-0 shadow-xs">
            {icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-white tracking-tight truncate">
                {title}
              </h1>
              {urduTitle && (
                <span className="hidden lg:inline text-xs font-bold text-amber-400 font-serif" dir="rtl">
                  ({urduTitle})
                </span>
              )}
              {badge && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${badgeColor} hidden sm:inline`}>
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-[10px] text-slate-400 font-medium truncate hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions, Store Badge, and Fullscreen toggle */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {actions && <div className="flex items-center gap-2">{actions}</div>}

        {/* Store Name Badge */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-[11px] text-slate-300">
          <Store className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-extrabold text-white">{storeName}</span>
        </div>

        {/* Browser Fullscreen Toggle Button */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
          title={isFullscreen ? 'Exit Browser Fullscreen' : 'Enter 100% Fullscreen Mode'}
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Normal View</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Fullscreen</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};

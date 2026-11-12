import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Store,
  Lock,
  Phone,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  SoftwareOwnerProfile,
  MartOwnerProfile,
  LOCKED_SOFTWARE_OWNER,
  DEFAULT_MART_OWNER,
} from '../types/pos';

export interface WaqasDualProfileCardsProps {
  className?: string;
  variant?: 'sale-area' | 'banner' | 'sidebar' | 'compact';
  customMartOwner?: MartOwnerProfile;
}

export const WaqasDualProfileCards: React.FC<WaqasDualProfileCardsProps> = ({
  className = '',
  variant = 'sale-area',
  customMartOwner,
}) => {
  // Software Owner is PERMANENTLY LOCKED & READ-ONLY
  const softwareOwner: SoftwareOwnerProfile = LOCKED_SOFTWARE_OWNER;

  // Mart Owner is editable through Settings and stored in localStorage
  const [martOwner, setMartOwner] = useState<MartOwnerProfile>(() => {
    if (customMartOwner) return customMartOwner;
    try {
      const saved = localStorage.getItem('waqas_mart_owner_profile_v2');
      if (saved) return { ...DEFAULT_MART_OWNER, ...JSON.parse(saved) };
      // Fallback check v1 key
      const savedV1 = localStorage.getItem('waqas_mart_owner_profile_v1');
      if (savedV1) {
        const p1 = JSON.parse(savedV1);
        return {
          ...DEFAULT_MART_OWNER,
          martName: p1.martName || DEFAULT_MART_OWNER.martName,
          ownerName: p1.ownerName || DEFAULT_MART_OWNER.ownerName,
          mobileNumber: p1.mobileNumber || DEFAULT_MART_OWNER.mobileNumber,
          photoUrl: p1.martOwnerPhotoUrl || DEFAULT_MART_OWNER.photoUrl,
        };
      }
    } catch {}
    return DEFAULT_MART_OWNER;
  });

  useEffect(() => {
    if (customMartOwner) {
      setMartOwner(customMartOwner);
    }
  }, [customMartOwner]);

  // Sync state reactively across all application pages & tabs
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem('waqas_mart_owner_profile_v2');
        if (saved) {
          setMartOwner({ ...DEFAULT_MART_OWNER, ...JSON.parse(saved) });
        }
      } catch {}
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('waqas_mart_owner_updated', handleSync);
    window.addEventListener('waqas_owner_profile_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('waqas_mart_owner_updated', handleSync);
      window.removeEventListener('waqas_owner_profile_updated', handleSync);
    };
  }, []);

  // Image source fallbacks for Software Owner photo
  const [softwareImgSrc, setSoftwareImgSrc] = useState(softwareOwner.photoUrl || '/5c454cea45cc8c39a24b57a83fbbc5cf_0.webp');
  const [softwareImgAttempt, setSoftwareImgAttempt] = useState(0);

  const handleSoftwareImgError = () => {
    if (softwareImgAttempt === 0) {
      setSoftwareImgSrc('/assets/aistudio/5c454cea45cc8c39a24b57a83fbbc5cf_0_3a4b9c5f.webp');
      setSoftwareImgAttempt(1);
    } else if (softwareImgAttempt === 1) {
      setSoftwareImgSrc('/5c454cea45cc8c39a24b57a83fbbc5cf_0.webp');
      setSoftwareImgAttempt(2);
    } else if (softwareImgAttempt === 2) {
      setSoftwareImgSrc('/assets/aistudio/IMG_20260726_115045_577_9c28cca0.jpg');
      setSoftwareImgAttempt(3);
    }
  };

  // Image source fallbacks for Mart Owner photo
  const [martImgSrc, setMartImgSrc] = useState(martOwner.photoUrl || DEFAULT_MART_OWNER.photoUrl);

  useEffect(() => {
    setMartImgSrc(martOwner.photoUrl || DEFAULT_MART_OWNER.photoUrl);
  }, [martOwner.photoUrl]);

  const handleMartImgError = () => {
    setMartImgSrc('/assets/aistudio/female_owner_portrait.svg');
  };

  // WhatsApp SVG Icon
  const WhatsAppIcon = ({ iconClass = 'w-3.5 h-3.5' }: { iconClass?: string }) => (
    <svg className={`${iconClass} fill-current text-emerald-400 shrink-0`} viewBox="0 0 24 24">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );

  // Background wave decoration
  const WaveBackground = () => (
    <>
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-emerald-500/15 blur-xl pointer-events-none" />
      <div className="absolute -left-6 -top-6 w-24 h-24 rounded-full bg-blue-500/20 blur-xl pointer-events-none" />
      <svg
        className="absolute bottom-0 right-0 w-28 h-16 opacity-20 pointer-events-none text-emerald-400"
        viewBox="0 0 144 80"
        fill="currentColor"
        preserveAspectRatio="none"
      >
        <path d="M0,40 C40,80 100,0 144,30 L144,80 L0,80 Z" />
      </svg>
    </>
  );

  // =========================================================================
  // 1. SALE WORKSTATION VARIANT (Placed immediately left of colorful buttons)
  // =========================================================================
  if (variant === 'sale-area') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 w-full h-full ${className}`}>
        {/* CARD 1: SOFTWARE OWNER (PERMANENTLY LOCKED) */}
        <div
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#041633] via-[#072454] to-[#032e27] border border-emerald-500/40 p-2.5 text-white shadow-md select-none flex items-center gap-2.5 min-h-[148px]"
          style={{
            boxShadow: '0 4px 18px -2px rgba(5, 27, 61, 0.45), 0 0 0 1px rgba(16, 185, 129, 0.25)',
          }}
        >
          <WaveBackground />

          {/* Software Owner Photograph */}
          <div className="relative shrink-0 w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden border-2 border-emerald-400 shadow-md ring-2 ring-emerald-500/20 bg-slate-900">
            <img
              src={softwareImgSrc}
              alt="Software Owner"
              className="w-full h-full object-cover object-[center_15%]"
              onError={handleSoftwareImgError}
            />
            <div className="absolute bottom-0.5 right-0.5 bg-blue-600 text-white p-0.5 rounded-full shadow-2xs" title="Verified Creator">
              <ShieldCheck className="w-2.5 h-2.5" />
            </div>
          </div>

          {/* Software Owner Details */}
          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 relative z-10">
            <div>
              {/* Badges */}
              <div className="flex items-center gap-1 mb-0.5 flex-wrap">
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-500/25 border border-emerald-400/40 text-[9px] font-black text-emerald-300 uppercase tracking-wider">
                  <Store className="w-2.5 h-2.5 text-emerald-400" />
                  <span>{softwareOwner.martName}</span>
                </span>
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/25 border border-amber-400/50 text-[8px] font-black text-amber-300 uppercase tracking-wider">
                  <Lock className="w-2 h-2 text-amber-300" />
                  <span>{softwareOwner.badge}</span>
                </span>
              </div>

              {/* Creator Name */}
              <div className="text-[10px] sm:text-[11px] font-black text-amber-300 leading-tight">
                {softwareOwner.ownerName || 'Muhammad Waqas'}
              </div>

              {/* Software Name: WAQAS POS SOFTWARE */}
              <h4 className="text-[11px] sm:text-xs font-black tracking-tight text-white leading-tight">
                {softwareOwner.softwareName}
              </h4>

              {/* Tagline: Better Shop Better Business */}
              <p className="text-[9px] sm:text-[10px] font-bold text-emerald-300 leading-tight mt-0.5 tracking-wide">
                {softwareOwner.tagline}
              </p>
            </div>

            {/* Mobile / WhatsApp */}
            <div className="mt-1 pt-1 border-t border-white/10 flex items-center gap-1.5 flex-wrap">
              <a
                href={`https://wa.me/92${(softwareOwner.whatsappNumber || '03228570782').replace(/^0+/, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                title={`WhatsApp: ${softwareOwner.whatsappNumber || '03228570782'}`}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-200 transition-all active:scale-95 cursor-pointer"
              >
                <WhatsAppIcon iconClass="w-3 h-3" />
                <span className="text-[9px] font-black tracking-wide text-white whitespace-nowrap">
                  WA: {softwareOwner.whatsappNumber || '03228570782'}
                </span>
              </a>
              <span className="text-[9px] font-black tracking-wide text-white whitespace-nowrap">
                Mob: {softwareOwner.mobileNumber || '03429634133'}
              </span>
            </div>
          </div>
        </div>

        {/* CARD 2: MART OWNER (EDITABLE VIA SETTINGS BY ADMIN/OWNER) */}
        <div
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#072454] via-[#041633] to-[#032e27] border border-cyan-500/40 p-2.5 text-white shadow-md select-none flex items-center gap-2.5 min-h-[148px]"
          style={{
            boxShadow: '0 4px 18px -2px rgba(7, 36, 84, 0.45), 0 0 0 1px rgba(6, 182, 212, 0.25)',
          }}
        >
          <WaveBackground />

          {/* Mart Owner Photograph */}
          <div className="relative shrink-0 w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden border-2 border-cyan-400 shadow-md ring-2 ring-cyan-500/20 bg-slate-900">
            <img
              src={martImgSrc}
              alt="Mart Owner"
              className="w-full h-full object-cover object-[center_15%]"
              onError={handleMartImgError}
            />
            <div className="absolute bottom-0.5 right-0.5 bg-emerald-600 text-white p-0.5 rounded-full shadow-2xs" title="Mart Owner">
              <Store className="w-2.5 h-2.5" />
            </div>
          </div>

          {/* Mart Owner Details */}
          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 relative z-10">
            <div>
              {/* Badges */}
              <div className="flex items-center gap-1 mb-0.5 flex-wrap">
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-cyan-500/25 border border-cyan-400/40 text-[9px] font-black text-cyan-300 uppercase tracking-wider">
                  <Store className="w-2.5 h-2.5 text-cyan-400" />
                  <span>{martOwner.martName}</span>
                </span>
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-500/25 border border-emerald-400/50 text-[8px] font-black text-emerald-300 uppercase tracking-wider">
                  <Sparkles className="w-2 h-2 text-emerald-300" />
                  <span>{martOwner.badge}</span>
                </span>
              </div>

              {/* Mart Owner Name */}
              <h4 className="text-[11px] sm:text-xs font-black tracking-tight text-white leading-tight">
                {martOwner.ownerName}
              </h4>

              {/* Mart Sub-tagline */}
              <p className="text-[9px] sm:text-[10px] font-bold text-cyan-300 leading-tight mt-0.5 tracking-wide">
                Proprietor & Manager
              </p>
            </div>

            {/* Mobile / WhatsApp */}
            <div className="mt-1 pt-1 border-t border-white/10">
              <a
                href={`https://wa.me/92${martOwner.mobileNumber.replace(/^0+/, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                title={`WhatsApp: ${martOwner.mobileNumber}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-teal-950/90 hover:bg-teal-900 border border-teal-500/40 text-teal-200 transition-all active:scale-95 cursor-pointer max-w-full"
              >
                <WhatsAppIcon iconClass="w-3 h-3" />
                <span className="text-[10px] font-black tracking-wide text-white whitespace-nowrap">
                  Mobile: {martOwner.mobileNumber}
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. DASHBOARD / BANNER VARIANT (Home, Stock, Khata, Reports, Ledgers, etc.)
  // =========================================================================
  if (variant === 'banner') {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 w-full ${className}`}>
        {/* CARD 1: SOFTWARE OWNER (PERMANENTLY LOCKED) */}
        <div
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#041633] via-[#072454] to-[#032e27] border border-emerald-500/40 p-3 sm:p-3.5 text-white shadow-md select-none flex items-center gap-3"
          style={{
            boxShadow: '0 4px 18px -2px rgba(5, 27, 61, 0.4), 0 0 0 1px rgba(16, 185, 129, 0.25)',
          }}
        >
          <WaveBackground />

          <div className="relative shrink-0 w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden border-2 border-emerald-400 shadow-md ring-2 ring-emerald-500/20 bg-slate-900">
            <img
              src={softwareImgSrc}
              alt="Software Owner"
              className="w-full h-full object-cover object-[center_15%]"
              onError={handleSoftwareImgError}
            />
            <div className="absolute bottom-0.5 right-0.5 bg-blue-600 text-white p-0.5 rounded-full shadow-2xs">
              <ShieldCheck className="w-2.5 h-2.5" />
            </div>
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 relative z-10">
            <div>
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/25 border border-emerald-400/40 text-[9px] font-black text-emerald-300 uppercase tracking-wider">
                  <Store className="w-3 h-3 text-emerald-400" />
                  <span>{softwareOwner.martName}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/25 border border-amber-400/50 text-[9px] font-black text-amber-300 uppercase tracking-wider">
                  <Lock className="w-2.5 h-2.5 text-amber-300" />
                  <span>{softwareOwner.badge}</span>
                </span>
              </div>

              <h4 className="text-xs sm:text-sm font-black tracking-tight text-white leading-tight">
                {softwareOwner.softwareName}
              </h4>
              <p className="text-[10px] sm:text-[11px] font-bold text-emerald-300 leading-tight mt-0.5 tracking-wide">
                {softwareOwner.tagline}
              </p>
            </div>

            <div className="mt-1.5 pt-1 border-t border-white/10">
              <a
                href={`https://wa.me/92${softwareOwner.mobileNumber.replace(/^0+/, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                title={`WhatsApp: ${softwareOwner.mobileNumber}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-200 transition-all active:scale-95 cursor-pointer max-w-full"
              >
                <WhatsAppIcon iconClass="w-3.5 h-3.5" />
                <span className="text-[11px] font-black tracking-wide text-white whitespace-nowrap">
                  Mobile: {softwareOwner.mobileNumber}
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* CARD 2: MART OWNER (EDITABLE VIA SETTINGS) */}
        <div
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#072454] via-[#041633] to-[#032e27] border border-cyan-500/40 p-3 sm:p-3.5 text-white shadow-md select-none flex items-center gap-3"
          style={{
            boxShadow: '0 4px 18px -2px rgba(7, 36, 84, 0.4), 0 0 0 1px rgba(6, 182, 212, 0.25)',
          }}
        >
          <WaveBackground />

          <div className="relative shrink-0 w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden border-2 border-cyan-400 shadow-md ring-2 ring-cyan-500/20 bg-slate-900">
            <img
              src={martImgSrc}
              alt="Mart Owner"
              className="w-full h-full object-cover object-[center_15%]"
              onError={handleMartImgError}
            />
            <div className="absolute bottom-0.5 right-0.5 bg-emerald-600 text-white p-0.5 rounded-full shadow-2xs">
              <Store className="w-2.5 h-2.5" />
            </div>
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 relative z-10">
            <div>
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/25 border border-cyan-400/40 text-[9px] font-black text-cyan-300 uppercase tracking-wider">
                  <Store className="w-3 h-3 text-cyan-400" />
                  <span>{martOwner.martName}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/25 border border-emerald-400/50 text-[9px] font-black text-emerald-300 uppercase tracking-wider">
                  <Sparkles className="w-2.5 h-2.5 text-emerald-300" />
                  <span>{martOwner.badge}</span>
                </span>
              </div>

              <h4 className="text-xs sm:text-sm font-black tracking-tight text-white leading-tight">
                {martOwner.ownerName}
              </h4>
              <p className="text-[10px] sm:text-[11px] font-bold text-cyan-300 leading-tight mt-0.5 tracking-wide">
                Mart Proprietor & In-charge
              </p>
            </div>

            <div className="mt-1.5 pt-1 border-t border-white/10">
              <a
                href={`https://wa.me/92${martOwner.mobileNumber.replace(/^0+/, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                title={`WhatsApp: ${martOwner.mobileNumber}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-teal-950/90 hover:bg-teal-900 border border-teal-500/40 text-teal-200 transition-all active:scale-95 cursor-pointer max-w-full"
              >
                <WhatsAppIcon iconClass="w-3.5 h-3.5" />
                <span className="text-[11px] font-black tracking-wide text-white whitespace-nowrap">
                  Mobile: {martOwner.mobileNumber}
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. SIDEBAR DUAL VARIANT (Desktop Sidebar in App.tsx & Purchase Sidebar)
  // =========================================================================
  if (variant === 'sidebar') {
    return (
      <div className={`space-y-2 w-full ${className}`}>
        {/* Software Owner Card */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#041633] to-[#072454] border border-emerald-500/40 p-2 text-white shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-11 h-13 rounded-lg overflow-hidden border border-emerald-400 shrink-0 bg-slate-900">
              <img
                src={softwareImgSrc}
                alt="Software Owner"
                className="w-full h-full object-cover object-[center_15%]"
                onError={handleSoftwareImgError}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-black text-amber-300 uppercase tracking-wider flex items-center gap-0.5">
                  <Lock className="w-2 h-2" />
                  <span>{softwareOwner.ownerName || 'Muhammad Waqas'}</span>
                </span>
              </div>
              <h5 className="text-[10px] font-black text-white leading-tight truncate">
                WAQAS POS SOFTWARE
              </h5>
              <div className="flex items-center gap-1 text-[8.5px] font-bold mt-0.5 flex-wrap">
                <a
                  href={`https://wa.me/92${(softwareOwner.whatsappNumber || '03228570782').replace(/^0+/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-300 hover:text-white flex items-center gap-0.5"
                  title="WhatsApp"
                >
                  <WhatsAppIcon iconClass="w-2.5 h-2.5" />
                  <span>WA: {softwareOwner.whatsappNumber || '03228570782'}</span>
                </a>
                <span className="text-slate-300">| Mob: {softwareOwner.mobileNumber || '03429634133'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mart Owner Card */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#072454] to-[#032e27] border border-cyan-500/40 p-2 text-white shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-11 h-13 rounded-lg overflow-hidden border border-cyan-400 shrink-0 bg-slate-900">
              <img
                src={martImgSrc}
                alt="Mart Owner"
                className="w-full h-full object-cover object-[center_15%]"
                onError={handleMartImgError}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-black text-emerald-300 uppercase tracking-wider flex items-center gap-0.5">
                  <Store className="w-2 h-2" />
                  <span>MART OWNER</span>
                </span>
              </div>
              <h5 className="text-[10px] font-black text-white leading-tight truncate">
                {martOwner.ownerName}
              </h5>
              <a
                href={`https://wa.me/92${martOwner.mobileNumber.replace(/^0+/, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] font-bold text-cyan-300 hover:text-white flex items-center gap-1 mt-0.5"
              >
                <WhatsAppIcon iconClass="w-2.5 h-2.5" />
                <span>{martOwner.mobileNumber}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 4. COMPACT / MOBILE TOP BAR VARIANT
  // =========================================================================
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-1.5 w-full ${className}`}>
      {/* Mini Software Owner */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#041633] border border-emerald-500/40 text-white">
        <div className="w-9 h-11 rounded-lg overflow-hidden border border-emerald-400 shrink-0 bg-slate-900">
          <img
            src={softwareImgSrc}
            alt="Software Owner"
            className="w-full h-full object-cover object-[center_15%]"
            onError={handleSoftwareImgError}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[8px] font-black text-amber-300 uppercase">SOFTWARE OWNER</div>
          <div className="text-[10px] font-black text-white leading-tight truncate">WAQAS POS SOFTWARE</div>
          <div className="text-[9px] font-bold text-emerald-300">03228570782</div>
        </div>
      </div>

      {/* Mini Mart Owner */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#072454] border border-cyan-500/40 text-white">
        <div className="w-9 h-11 rounded-lg overflow-hidden border border-cyan-400 shrink-0 bg-slate-900">
          <img
            src={martImgSrc}
            alt="Mart Owner"
            className="w-full h-full object-cover object-[center_15%]"
            onError={handleMartImgError}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[8px] font-black text-cyan-300 uppercase">MART OWNER</div>
          <div className="text-[10px] font-black text-white leading-tight truncate">{martOwner.ownerName}</div>
          <div className="text-[9px] font-bold text-teal-300">{martOwner.mobileNumber}</div>
        </div>
      </div>
    </div>
  );
};

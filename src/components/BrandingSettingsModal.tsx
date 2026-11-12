import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Palette,
  RotateCcw,
  Check,
  Upload,
  Store,
  Smartphone,
  Eye,
  User,
  Shield,
  ShieldAlert,
  Phone,
  Camera,
  Lock,
  ExternalLink,
} from 'lucide-react';
import {
  StoreBranding,
  MartOwnerProfile,
  DEFAULT_MART_OWNER,
  LOCKED_SOFTWARE_OWNER,
  UserProfile,
} from '../types/pos';
import { safeFetchJson } from '../utils/apiClient';
import { WaqasDualProfileCards } from './WaqasDualProfileCards';

interface BrandingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  branding: StoreBranding;
  onSaveBranding: (branding: StoreBranding) => void;
  onOpenReceiptDesigner?: () => void;
  onOpenResetSystem?: () => void;
  currentUser?: UserProfile;
}

const DEFAULT_BRANDING: StoreBranding = {
  storeName: 'WAQAS MART',
  primaryName: 'WAQAS',
  accentName: 'MART',
  subtitle: 'Quality Products • Better Life',
  sidebarPromoTitle: 'Small Steps Big Dreams',
  sidebarPromoBadge: 'WAQAS MART',
  bottomBannerTitle: 'Fresh Products Everyday',
  bottomBannerSubtitle: 'Best Quality • Lowest Prices',
  terminalDeviceId: 'WM-001',
  primaryColor: '#00a859',
};

const COLOR_PRESETS = [
  { name: 'Emerald Green (Default)', hex: '#00a859' },
  { name: 'Classic Supermarket Green', hex: '#16a34a' },
  { name: 'Teal Blue', hex: '#0d9488' },
  { name: 'Royal Blue', hex: '#2563eb' },
  { name: 'Deep Indigo', hex: '#4f46e5' },
  { name: 'Warm Amber', hex: '#d97706' },
  { name: 'Crimson Red', hex: '#dc2626' },
];

export const BrandingSettingsModal: React.FC<BrandingSettingsModalProps> = ({
  isOpen,
  onClose,
  branding,
  onSaveBranding,
  onOpenReceiptDesigner,
  onOpenResetSystem,
  currentUser,
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'owner' | 'logo' | 'banner' | 'store' | 'appearance'>('owner');
  const [bannerUrl, setBannerUrl] = useState(branding.bannerUrl || '');
  const bannerBgInputRef = useRef<HTMLInputElement>(null);

  // Role validation: Only Admin / Owner can edit profile settings
  const isAdminOrOwner =
    !currentUser ||
    !currentUser.role ||
    currentUser.role.toLowerCase().includes('admin') ||
    currentUser.role.toLowerCase().includes('owner') ||
    currentUser.role.toLowerCase().includes('super');

  // Card 2: Mart Owner state (Editable by Admin/Owner)
  const [martName, setMartName] = useState(DEFAULT_MART_OWNER.martName);
  const [ownerName, setOwnerName] = useState(DEFAULT_MART_OWNER.ownerName);
  const [ownerDesignation, setOwnerDesignation] = useState(DEFAULT_MART_OWNER.designation || 'Proprietor & Manager');
  const [ownerMobile, setOwnerMobile] = useState(DEFAULT_MART_OWNER.mobileNumber);
  const [ownerWhatsapp, setOwnerWhatsapp] = useState(DEFAULT_MART_OWNER.whatsappNumber || DEFAULT_MART_OWNER.mobileNumber);
  const [ownerAddress, setOwnerAddress] = useState(DEFAULT_MART_OWNER.address || 'Commercial Market, Multan, Pakistan');
  const [martPhotoUrl, setMartPhotoUrl] = useState(DEFAULT_MART_OWNER.photoUrl);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Store Branding state
  const [storeName, setStoreName] = useState(branding.storeName || 'WAQAS MART');
  const [primaryName, setPrimaryName] = useState(branding.primaryName || 'WAQAS');
  const [accentName, setAccentName] = useState(branding.accentName || 'MART');
  const [subtitle, setSubtitle] = useState(branding.subtitle || 'Quality Products • Better Life');
  const [logoUrl, setLogoUrl] = useState(branding.logoUrl || '');
  const [sidebarPromoTitle, setSidebarPromoTitle] = useState(
    branding.sidebarPromoTitle || 'Small Steps Big Dreams'
  );
  const [sidebarPromoBadge, setSidebarPromoBadge] = useState(
    branding.sidebarPromoBadge || 'WAQAS MART'
  );
  const [bottomBannerTitle, setBottomBannerTitle] = useState(
    branding.bottomBannerTitle || 'Fresh Products Everyday'
  );
  const [bottomBannerSubtitle, setBottomBannerSubtitle] = useState(
    branding.bottomBannerSubtitle || 'Best Quality • Lowest Prices'
  );
  const [terminalDeviceId, setTerminalDeviceId] = useState(
    branding.terminalDeviceId || 'WM-001'
  );
  const [primaryColor, setPrimaryColor] = useState(branding.primaryColor || '#00a859');
  const [purchaseBannerTitle, setPurchaseBannerTitle] = useState(
    branding.purchaseBannerTitle || 'Purchase Entry'
  );
  const [purchaseBannerSubtitle, setPurchaseBannerSubtitle] = useState(
    branding.purchaseBannerSubtitle || 'Keep Your Inventory Always Full'
  );

  const logoInputRef = useRef<HTMLInputElement>(null);
  const martPhotoInputRef = useRef<HTMLInputElement>(null);

  // Load existing saved Mart Owner profile on open
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem('waqas_mart_owner_profile_v2');
        if (saved) {
          const parsed = JSON.parse(saved);
          setMartName(parsed.martName || DEFAULT_MART_OWNER.martName);
          setOwnerName(parsed.ownerName || DEFAULT_MART_OWNER.ownerName);
          setOwnerDesignation(parsed.designation || DEFAULT_MART_OWNER.designation || 'Proprietor & Manager');
          setOwnerMobile(parsed.mobileNumber || DEFAULT_MART_OWNER.mobileNumber);
          setOwnerWhatsapp(parsed.whatsappNumber || parsed.mobileNumber || DEFAULT_MART_OWNER.whatsappNumber || '03228570782');
          setOwnerAddress(parsed.address || DEFAULT_MART_OWNER.address || 'Commercial Market, Multan, Pakistan');
          setMartPhotoUrl(parsed.photoUrl || DEFAULT_MART_OWNER.photoUrl);
        } else {
          setMartName(DEFAULT_MART_OWNER.martName);
          setOwnerName(DEFAULT_MART_OWNER.ownerName);
          setOwnerDesignation(DEFAULT_MART_OWNER.designation || 'Proprietor & Manager');
          setOwnerMobile(DEFAULT_MART_OWNER.mobileNumber);
          setOwnerWhatsapp(DEFAULT_MART_OWNER.whatsappNumber || '03228570782');
          setOwnerAddress(DEFAULT_MART_OWNER.address || 'Commercial Market, Multan, Pakistan');
          setMartPhotoUrl(DEFAULT_MART_OWNER.photoUrl);
        }
      } catch {}
      setSaveSuccessMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Mart Owner Photo Upload
  const handleMartPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setMartPhotoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Reset Mart Owner Photo to default female portrait
  const handleResetMartPhoto = () => {
    setMartPhotoUrl(DEFAULT_MART_OWNER.photoUrl);
  };

  // Handle Store Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setLogoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Save All Changes (Mart Owner Profile + Store Branding)
  const handleSave = () => {
    if (!isAdminOrOwner) {
      alert('Only Admin / Owner users are authorized to modify settings. (صرف ایڈمن یا مالک یہ تبدیلیاں کر سکتے ہیں)');
      return;
    }

    // 1. Save Mart Owner Profile
    const updatedMartOwner: MartOwnerProfile = {
      martName: martName.trim() || DEFAULT_MART_OWNER.martName,
      badge: 'MART OWNER',
      ownerName: ownerName.trim() || DEFAULT_MART_OWNER.ownerName,
      designation: ownerDesignation.trim() || 'Proprietor & Manager',
      mobileNumber: ownerMobile.trim() || DEFAULT_MART_OWNER.mobileNumber,
      whatsappNumber: ownerWhatsapp.trim() || ownerMobile.trim() || DEFAULT_MART_OWNER.mobileNumber,
      address: ownerAddress.trim() || DEFAULT_MART_OWNER.address,
      photoUrl: martPhotoUrl || DEFAULT_MART_OWNER.photoUrl,
    };

    try {
      localStorage.setItem('waqas_mart_owner_profile_v2', JSON.stringify(updatedMartOwner));
      // Notify all components across the app
      window.dispatchEvent(new Event('waqas_mart_owner_updated'));
      window.dispatchEvent(new Event('storage'));

      // Persist to backend database API
      safeFetchJson('/api/settings/mart-owner', {
        method: 'POST',
        body: JSON.stringify(updatedMartOwner),
      }).catch((e) => console.warn('Could not post mart owner to server', e));
    } catch (e) {
      console.warn('Failed to persist owner profile to localStorage', e);
    }

    // 2. Save Store Branding
    const updatedBranding: StoreBranding = {
      storeName: storeName.trim() || 'WAQAS MART',
      primaryName: primaryName.trim() || 'WAQAS',
      accentName: accentName.trim() || 'MART',
      subtitle: subtitle.trim() || 'Quality Products • Better Life',
      logoUrl: logoUrl.trim() || undefined,
      bannerUrl: bannerUrl.trim() || undefined,
      sidebarPromoTitle: sidebarPromoTitle.trim() || 'Small Steps Big Dreams',
      sidebarPromoBadge: sidebarPromoBadge.trim() || 'WAQAS MART',
      bottomBannerTitle: bottomBannerTitle.trim() || 'Fresh Products Everyday',
      bottomBannerSubtitle: bottomBannerSubtitle.trim() || 'Best Quality • Lowest Prices',
      terminalDeviceId: terminalDeviceId.trim() || 'WM-001',
      primaryColor,
      purchaseBannerTitle: purchaseBannerTitle.trim() || 'Purchase Entry',
      purchaseBannerSubtitle: purchaseBannerSubtitle.trim() || 'Keep Your Inventory Always Full',
    };

    try {
      if (logoUrl) {
        localStorage.setItem('waqas_mart_logo_data', logoUrl);
      } else {
        localStorage.removeItem('waqas_mart_logo_data');
      }
      window.dispatchEvent(new Event('waqas_mart_logo_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.warn('Failed to save logo to localStorage', e);
    }

    onSaveBranding(updatedBranding);
    setSaveSuccessMsg('Mart Logo, Owner Profile & Store Settings saved successfully! (ترتیبات کامیابی سے محفوظ ہو گئیں)');

    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleRestoreDefault = () => {
    if (window.confirm('Restore default Mart Owner Profile and store branding? (کیا آپ بنیادی ترتیبات بحال کرنا چاہتے ہیں؟)')) {
      setMartName(DEFAULT_MART_OWNER.martName);
      setOwnerName(DEFAULT_MART_OWNER.ownerName);
      setOwnerDesignation(DEFAULT_MART_OWNER.designation || 'Proprietor & Manager');
      setOwnerMobile(DEFAULT_MART_OWNER.mobileNumber);
      setOwnerWhatsapp(DEFAULT_MART_OWNER.whatsappNumber || '03228570782');
      setOwnerAddress(DEFAULT_MART_OWNER.address || 'Commercial Market, Multan, Pakistan');
      setMartPhotoUrl(DEFAULT_MART_OWNER.photoUrl);

      setStoreName(DEFAULT_BRANDING.storeName);
      setPrimaryName(DEFAULT_BRANDING.primaryName);
      setAccentName(DEFAULT_BRANDING.accentName);
      setSubtitle(DEFAULT_BRANDING.subtitle);
      setLogoUrl('');
      setSidebarPromoTitle(DEFAULT_BRANDING.sidebarPromoTitle!);
      setSidebarPromoBadge(DEFAULT_BRANDING.sidebarPromoBadge!);
      setBottomBannerTitle(DEFAULT_BRANDING.bottomBannerTitle!);
      setBottomBannerSubtitle(DEFAULT_BRANDING.bottomBannerSubtitle!);
      setTerminalDeviceId(DEFAULT_BRANDING.terminalDeviceId!);
      setPrimaryColor(DEFAULT_BRANDING.primaryColor!);
    }
  };

  // Preview profile object for live preview
  const livePreviewMartOwner: MartOwnerProfile = {
    martName: martName.trim() || DEFAULT_MART_OWNER.martName,
    badge: 'MART OWNER',
    ownerName: ownerName.trim() || DEFAULT_MART_OWNER.ownerName,
    designation: ownerDesignation.trim() || 'Proprietor & Manager',
    mobileNumber: ownerMobile.trim() || DEFAULT_MART_OWNER.mobileNumber,
    whatsappNumber: ownerWhatsapp.trim() || ownerMobile.trim() || '03228570782',
    address: ownerAddress.trim() || 'Commercial Market, Multan, Pakistan',
    photoUrl: martPhotoUrl || DEFAULT_MART_OWNER.photoUrl,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#051b3d] px-6 py-4 text-white flex items-center justify-between shrink-0 border-b border-blue-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Store className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-black text-base tracking-wide flex items-center gap-2">
                <span>WAQAS MART Settings & Owner Profiles</span>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                  Admin Panel
                </span>
              </h3>
              <p className="text-xs text-blue-200">
                Configure Mart Owner Profile, Branding Cards, Theme Colors, and Hardware Terminal Details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Access Control Notice (When not Admin/Owner) */}
        {!isAdminOrOwner && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center gap-2.5 text-xs text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Staff View (Read-Only):</strong> Only authorized Admin or Owner users can modify the Mart Owner Profile and Store Settings.
            </span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-slate-100 px-6 py-2 border-b border-slate-200 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('owner')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'owner'
                ? 'bg-white text-blue-950 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <User className="w-4 h-4 text-emerald-600" />
            <span>Mart Owner Profile Settings</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
              Dual Cards
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logo')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'logo'
                ? 'bg-white text-emerald-950 shadow-xs border border-slate-200 ring-2 ring-emerald-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Camera className="w-4 h-4 text-emerald-600" />
            <span>Mart Logo (مارٹ لوگو)</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
              New Sale
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('banner')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'banner'
                ? 'bg-white text-amber-950 shadow-xs border border-slate-200 ring-2 ring-amber-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Store className="w-4 h-4 text-amber-600" />
            <span>Home Banner (ہوم بینر)</span>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
              Editable
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('store')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'store'
                ? 'bg-white text-blue-950 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Store className="w-4 h-4 text-blue-600" />
            <span>Store & Hardware</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'appearance'
                ? 'bg-white text-blue-950 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Palette className="w-4 h-4 text-purple-600" />
            <span>Theme & Terminal</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* ================================================================= */}
          {/* TAB 1: MART OWNER PROFILE SETTINGS                                */}
          {/* ================================================================= */}
          {activeTab === 'owner' && (
            <div className="space-y-6">
              {/* Section Header */}
              <div className="border-b border-slate-200 pb-3">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>Dual Profile Cards Management (سافٹ ویئر اور مارٹ پروفائلز)</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  The <strong>Software Owner Card</strong> is permanently locked. You can edit the <strong>Mart Owner Card</strong> details and photo below.
                </p>
              </div>

              {/* Live Preview Box with Both Cards */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-emerald-600" /> Live Interactive Preview (Both Cards)
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Appears across all POS & management pages
                  </span>
                </div>
                <div className="w-full">
                  <WaqasDualProfileCards variant="sale-area" customMartOwner={livePreviewMartOwner} />
                </div>
              </div>

              {/* Locked Software Owner Card Notice */}
              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-amber-900">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>First Card (Software Owner):</strong> Permanently locked and verified. Creator: Waqas Ahmad (03228570782).
                  </span>
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded-full">
                  Locked
                </span>
              </div>

              {/* Form Fields for Card 2: Mart Owner */}
              <div className="border border-cyan-200 rounded-2xl p-4 bg-cyan-50/30 space-y-4">
                <div className="flex items-center justify-between border-b border-cyan-200 pb-2">
                  <h5 className="text-xs font-black text-cyan-950 flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-cyan-600" />
                    <span>Second Card: Mart Owner Details (مالک کی معلومات اور تصویر)</span>
                  </h5>
                  <span className="text-[10px] font-bold bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full">
                    Editable by Admin/Owner
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Field 1: Mart Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Business / Mart Name (مارٹ کا نام)
                    </label>
                    <input
                      type="text"
                      disabled={!isAdminOrOwner}
                      value={martName}
                      onChange={(e) => setMartName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/30 disabled:bg-slate-100 disabled:cursor-not-allowed bg-white"
                      placeholder="WAQAS MART"
                    />
                  </div>

                  {/* Field 2: Owner Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Owner Full Name (مارٹ مالک کا نام)
                    </label>
                    <input
                      type="text"
                      disabled={!isAdminOrOwner}
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/30 disabled:bg-slate-100 disabled:cursor-not-allowed bg-white"
                      placeholder="Fatima Bibi"
                    />
                  </div>

                  {/* Field 3: Designation */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Designation (عہدہ)
                    </label>
                    <input
                      type="text"
                      disabled={!isAdminOrOwner}
                      value={ownerDesignation}
                      onChange={(e) => setOwnerDesignation(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/30 disabled:bg-slate-100 disabled:cursor-not-allowed bg-white"
                      placeholder="Proprietor & Manager"
                    />
                  </div>

                  {/* Field 4: Mobile Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Mobile Number (موبائل نمبر)</span>
                      <span className="text-[10px] text-slate-400 font-medium">Calling</span>
                    </label>
                    <input
                      type="text"
                      disabled={!isAdminOrOwner}
                      value={ownerMobile}
                      onChange={(e) => setOwnerMobile(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/30 disabled:bg-slate-100 disabled:cursor-not-allowed bg-white"
                      placeholder="03228570782"
                    />
                  </div>

                  {/* Field 5: WhatsApp Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>WhatsApp Number (واٹس ایپ)</span>
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                        <Phone className="w-2.5 h-2.5" /> Direct Chat
                      </span>
                    </label>
                    <input
                      type="text"
                      disabled={!isAdminOrOwner}
                      value={ownerWhatsapp}
                      onChange={(e) => setOwnerWhatsapp(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/30 disabled:bg-slate-100 disabled:cursor-not-allowed bg-white"
                      placeholder="03228570782"
                    />
                  </div>

                  {/* Field 6: Shop Address */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Shop Address / City (مارٹ کا پتہ)
                    </label>
                    <input
                      type="text"
                      disabled={!isAdminOrOwner}
                      value={ownerAddress}
                      onChange={(e) => setOwnerAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/30 disabled:bg-slate-100 disabled:cursor-not-allowed bg-white"
                      placeholder="Commercial Market, Multan"
                    />
                  </div>
                </div>

                {/* Mart Owner Photo Upload */}
                <div className="p-3 rounded-xl bg-white border border-cyan-200/80 flex items-center gap-4">
                  <div className="w-16 h-20 rounded-xl overflow-hidden border-2 border-cyan-500 shadow-md ring-2 ring-cyan-500/20 bg-slate-900 shrink-0">
                    <img
                      src={martPhotoUrl || DEFAULT_MART_OWNER.photoUrl}
                      alt="Mart Owner Portrait"
                      className="w-full h-full object-cover object-[center_15%]"
                    />
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <div className="text-xs font-bold text-slate-800">
                      Mart Owner Photograph (مالک کی تصویر)
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Upload portrait photo (female owner portrait or custom photo).
                    </p>

                    <input
                      type="file"
                      ref={martPhotoInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={handleMartPhotoUpload}
                    />

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={!isAdminOrOwner}
                        onClick={() => martPhotoInputRef.current?.click()}
                        className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload / Change Photo</span>
                      </button>

                      <button
                        type="button"
                        disabled={!isAdminOrOwner}
                        onClick={handleResetMartPhoto}
                        className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                        <span>Reset to Default Portrait</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB: MART LOGO SETTINGS (CONTROL FOR NEW SALE & APP HEADERS)     */}
          {/* ================================================================= */}
          {activeTab === 'logo' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-200 pb-3">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <span>Mart Logo Control (مارٹ لوگو تبدیل کریں)</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  The WAQAS MART logo displayed in the <strong>New Sale</strong> page header and across all pages can be uploaded and changed here.
                </p>
              </div>

              {/* Security & Access Check */}
              {!isAdminOrOwner && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Only authorized Store Owner / Admin can change the Mart Logo. Cashier access is read-only.</span>
                </div>
              )}

              {/* Live Preview in New Sale Header Style */}
              <div className="rounded-2xl p-4 bg-[#031738] text-white border border-blue-900 shadow-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-emerald-400" /> Live New Sale Header Preview (لائیو پریویو)
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Matches Desktop & Mobile New Sale Header
                  </span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-[#052454]/80 rounded-xl border border-blue-800">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Mart Logo Preview"
                      className="w-12 h-12 rounded-xl object-contain bg-white/10 p-1 border border-emerald-400 shadow-inner shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-emerald-600 border border-emerald-400 flex items-center justify-center shadow-inner shrink-0">
                      <Store className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div>
                    <h5 className="font-black text-base text-white uppercase tracking-wider leading-tight">
                      {storeName || 'WAQAS MART'}
                    </h5>
                    <p className="text-xs font-bold text-emerald-400 leading-tight">
                      Sale App • New Sale POS
                    </p>
                  </div>
                </div>
              </div>

              {/* Upload Controls */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Upload or Replace Logo (موبائل یا کمپیوٹر سے نیا لوگو لگائیں)
                </h5>

                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  disabled={!isAdminOrOwner}
                  onChange={handleLogoUpload}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={!isAdminOrOwner}
                    onClick={() => logoInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload New Logo (لوگو اپلوڈ کریں)</span>
                  </button>

                  {logoUrl && (
                    <button
                      type="button"
                      disabled={!isAdminOrOwner}
                      onClick={() => setLogoUrl('')}
                      className="px-4 py-2.5 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-600 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Restore Default Shopping Cart Logo</span>
                    </button>
                  )}
                </div>

                <div className="text-[11px] text-slate-500 space-y-1 pt-2 border-t border-slate-200">
                  <p>• <strong>Offline Support:</strong> The selected logo is stored permanently in offline local storage.</p>
                  <p>• <strong>Automatic Display:</strong> The new logo will automatically appear on the New Sale header, Old Sale, and printed receipts.</p>
                  <p>• <strong>Protection:</strong> Changing this logo does not affect WAQAS POS SOFTWARE branding or your business database.</p>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB: HOME PAGE BANNER SETTINGS (EDITABLE MAIN MART BANNER)        */}
          {/* ================================================================= */}
          {activeTab === 'banner' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-slate-200 pb-3">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Store className="w-4 h-4 text-amber-600" />
                  <span>Home Page Banner Settings (ہوم پیج بینر ترتیبات)</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customize the central banner on the Home Page. The Software Owner Card on the left remains permanent, while this central banner is fully customizable by the authorized Mart Owner.
                </p>
              </div>

              {/* Live Preview Box */}
              <div className="rounded-2xl p-5 bg-gradient-to-r from-[#023319] via-[#044c26] to-[#022813] text-white border border-amber-500/40 shadow-xl space-y-2 text-center">
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">
                  Live Home Page Banner Preview
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-300 to-yellow-500 uppercase tracking-tight">
                  {storeName || 'WAQAS MART'}
                </h3>
                <p className="text-sm text-amber-300 font-semibold italic">
                  {subtitle || 'Better Shop Better Business'}
                </p>
                <div className="pt-2">
                  <span className="inline-block px-5 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs shadow-md">
                    {bottomBannerTitle || 'Grow Your Business with Waqas POS Software'}
                  </span>
                </div>
              </div>

              {/* Editable Fields for Home Page Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Mart Display Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mart Display Name (مارٹ کا نام)
                    </label>
                    <input
                      type="text"
                      disabled={!isAdminOrOwner}
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/30 bg-white"
                      placeholder="WAQAS MART"
                    />
                  </div>

                  {/* Tagline */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tagline (ٹیگ لائن)
                    </label>
                    <input
                      type="text"
                      disabled={!isAdminOrOwner}
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/30 bg-white"
                      placeholder="Better Shop Better Business"
                    />
                  </div>

                  {/* Promotional Heading */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Promotional Message / Ribbon (پروموشنل پیغام)
                    </label>
                    <input
                      type="text"
                      disabled={!isAdminOrOwner}
                      value={bottomBannerTitle}
                      onChange={(e) => setBottomBannerTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/30 bg-white"
                      placeholder="Grow Your Business with Waqas POS Software"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                  Changes made here automatically update the central banner on the Home Page and are saved permanently in offline storage.
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 2: STORE NAME & BANNERS                                      */}
          {/* ================================================================= */}
          {activeTab === 'store' && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Store className="w-4 h-4 text-blue-600" />
                  <span>Store Name & Top Banner Branding</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customize the store name and header appearance for receipts and dashboards.
                </p>
              </div>

              {/* Live Header Preview Box */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black overflow-hidden shadow-xs"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-base font-black tracking-tight" style={{ color: primaryColor }}>
                      {primaryName} <span className="text-slate-800">{accentName}</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">{subtitle}</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded-md">
                    Active POS
                  </span>
                </div>
              </div>

              {/* Logo Upload Section */}
              <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-black shrink-0 overflow-hidden shadow-xs border-2 border-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt="Store Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-7 h-7" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="text-xs font-bold text-slate-800">Custom Store Logo</div>
                  <div className="text-[11px] text-slate-500">
                    Upload your mart icon or logo (PNG / JPG / SVG)
                  </div>
                  <input
                    type="file"
                    ref={logoInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={!isAdminOrOwner}
                      onClick={() => logoInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Logo</span>
                    </button>
                    {logoUrl && (
                      <button
                        type="button"
                        disabled={!isAdminOrOwner}
                        onClick={() => setLogoUrl('')}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Primary Brand Word (e.g. WAQAS)
                  </label>
                  <input
                    type="text"
                    disabled={!isAdminOrOwner}
                    value={primaryName}
                    onChange={(e) => setPrimaryName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:bg-slate-100"
                    placeholder="WAQAS"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Accent Brand Word (e.g. MART)
                  </label>
                  <input
                    type="text"
                    disabled={!isAdminOrOwner}
                    value={accentName}
                    onChange={(e) => setAccentName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:bg-slate-100"
                    placeholder="MART"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Store Subtitle / Tagline
                  </label>
                  <input
                    type="text"
                    disabled={!isAdminOrOwner}
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:bg-slate-100"
                    placeholder="Quality Products • Better Life"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 3: THEME & TERMINAL                                          */}
          {/* ================================================================= */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-purple-600" />
                  <span>Theme Colors & POS Terminal Identity</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select primary accent colors and configure hardware terminal registration.
                </p>
              </div>

              {/* Color Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Supermarket Theme Color</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      disabled={!isAdminOrOwner}
                      onClick={() => setPrimaryColor(preset.hex)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        primaryColor.toLowerCase() === preset.hex.toLowerCase()
                          ? 'border-slate-800 bg-slate-50 ring-2 ring-emerald-500/40'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div
                        className="w-5 h-5 rounded-full shrink-0 shadow-xs border border-white"
                        style={{ backgroundColor: preset.hex }}
                      />
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        {preset.name.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Terminal Device ID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Terminal Device Identifier (ٹرمنل شناخت)</span>
                </label>
                <input
                  type="text"
                  disabled={!isAdminOrOwner}
                  value={terminalDeviceId}
                  onChange={(e) => setTerminalDeviceId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:bg-slate-100"
                  placeholder="WM-001"
                />
              </div>

              {/* Receipt Designer Shortcut */}
              {onOpenReceiptDesigner && (
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-black text-emerald-900">Dedicated Receipt Designer</h5>
                    <p className="text-[11px] text-emerald-700">
                      Customize 80mm/58mm thermal receipts with store logo, Urdu footer & QR code
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenReceiptDesigner}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <span>Open Designer</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Success message banner */}
          {saveSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              disabled={!isAdminOrOwner}
              onClick={handleRestoreDefault}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Restore Defaults</span>
            </button>

            {onOpenResetSystem && isAdminOrOwner && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenResetSystem();
                }}
                className="px-3.5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Complete Reset / Fresh Start with automatic JSON backup"
              >
                <RotateCcw className="w-3.5 h-3.5 text-red-600" />
                <span>Reset System (فریش اسٹارٹ)</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!isAdminOrOwner}
              onClick={handleSave}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-[#00a859] hover:bg-[#00924d] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

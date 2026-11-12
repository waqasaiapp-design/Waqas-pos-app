import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  Trash2,
  RotateCcw,
  Save,
  Eye,
  Sliders,
  Type,
  Palette,
  Layout,
  CheckCircle2,
  Printer,
  Sparkles,
  User,
  ShoppingBag,
  Store,
} from 'lucide-react';
import {
  ReceiptSettings,
  ReceiptPaperSize,
  OwnerPhotoShape,
  OwnerPhotoSize,
  OwnerPhotoPosition,
  DEFAULT_RECEIPT_SETTINGS,
  SaleTransaction,
} from '../types/pos';
import { formatRs } from '../data/defaultProducts';

interface ReceiptDesignerModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ReceiptSettings;
  onSaveSettings: (settings: ReceiptSettings) => void;
  sampleTransaction?: SaleTransaction | null;
}

export const ReceiptDesignerModal: React.FC<ReceiptDesignerModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  sampleTransaction,
}) => {
  const [activeTab, setActiveTab] = useState<'owner' | 'content' | 'design' | 'sections'>('owner');
  const [current, setCurrent] = useState<ReceiptSettings>({ ...settings });
  const [isSavedAlert, setIsSavedAlert] = useState(false);

  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Image Upload handler (supports Gallery / Camera / Computer)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setCurrent((prev) => ({ ...prev, ownerPhotoUrl: reader.result as string, showOwnerPhoto: true }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setCurrent((prev) => ({ ...prev, logoUrl: reader.result as string, showLogo: true }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSaveSettings(current);
    setIsSavedAlert(true);
    setTimeout(() => {
      setIsSavedAlert(false);
      onClose();
    }, 900);
  };

  const handleRestoreDefault = () => {
    if (window.confirm('کیا آپ رسید کی تمام سیٹنگز اصل حالت (ڈیفالٹ) پر واپس لانا چاہتے ہیں؟')) {
      setCurrent({ ...DEFAULT_RECEIPT_SETTINGS });
    }
  };

  // Dummy or real items for live preview
  const previewTx = sampleTransaction || {
    invoiceNumber: 'WM-398512',
    dateTime: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }),
    mode: 'sale' as const,
    items: [
      { id: '1', product: { id: 'p1', name: 'Dalda Cooking Oil 5L', barcode: '123', price: 2850, costPrice: 2600, stock: 20, category: 'Groceries', unit: 'Tin' }, quantity: 1, unitPrice: 2850, discountAmount: 0, lineTotal: 2850 },
      { id: '2', product: { id: 'p2', name: 'Coca Cola 500ml', barcode: '456', price: 120, costPrice: 95, stock: 40, category: 'Beverages', unit: 'Bottle' }, quantity: 2, unitPrice: 120, discountAmount: 0, lineTotal: 240 },
      { id: '3', product: { id: 'p3', name: 'Sugar 1kg', barcode: '789', price: 140, costPrice: 120, stock: 60, category: 'Groceries', unit: 'Kg' }, quantity: 2, unitPrice: 140, discountAmount: 0, lineTotal: 280 },
    ],
    subtotal: 3370,
    discount: 70,
    taxAmount: 0,
    grandTotal: 3300,
    paymentMethod: 'cash' as const,
    cashTendered: 3500,
    changeDue: 200,
    cashierName: 'Admin (Waqas)',
    customerName: 'Haji Aslam Khan',
    status: 'completed' as const,
  };

  // Owner Photo CSS shape and size
  const getPhotoSizeClass = (size: OwnerPhotoSize) => {
    switch (size) {
      case 'small':
        return 'w-14 h-14';
      case 'medium':
        return 'w-20 h-20';
      case 'large':
        return 'w-28 h-28';
      case 'xlarge':
        return 'w-36 h-36';
      default:
        return 'w-24 h-24';
    }
  };

  const getPhotoShapeClass = (shape: OwnerPhotoShape) => {
    switch (shape) {
      case 'circle':
        return 'rounded-full';
      case 'rounded':
        return 'rounded-2xl';
      case 'square':
        return 'rounded-md';
      default:
        return 'rounded-full';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Modal Top Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#064e3b] via-[#00a859] to-[#047857] text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">Receipt Designer & Bill Settings</h2>
                <span className="text-[10px] bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                  Premium
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-urdu mt-0.5">
                رسید کا ڈیزائن، مالک کی بڑی تصویر، اور بل کی تمام ترتیبات تبدیل کریں
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRestoreDefault}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
              title="Restore Default Settings"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ڈیفالٹ سیٹنگز</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Saved Alert Banner */}
        {isSavedAlert && (
          <div className="bg-emerald-600 text-white px-4 py-2 flex items-center justify-center gap-2 text-xs font-bold animate-pulse">
            <CheckCircle2 className="w-4 h-4" />
            <span>رسید کی تمام ترتیبات اور مالک کی تصویر کامیابی سے محفوظ ہو گئیں!</span>
          </div>
        )}

        {/* Main Content: Left Controls & Right Live Preview */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* LEFT COLUMN: SETTINGS TABS & CONTROLS */}
          <div className="lg:w-7/12 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50 overflow-hidden">
            {/* Tabs */}
            <div className="flex items-center border-b border-slate-200 bg-white px-3 pt-2 gap-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('owner')}
                className={`flex items-center gap-2 px-3 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                  activeTab === 'owner'
                    ? 'border-[#00a859] text-[#00a859] bg-emerald-50/50'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-4 h-4" />
                <span>مالک کی تصویر و برانڈ</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('content')}
                className={`flex items-center gap-2 px-3 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                  activeTab === 'content'
                    ? 'border-[#00a859] text-[#00a859] bg-emerald-50/50'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Type className="w-4 h-4" />
                <span>بل ٹیکسٹ و پیغامات</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('design')}
                className={`flex items-center gap-2 px-3 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                  activeTab === 'design'
                    ? 'border-[#00a859] text-[#00a859] bg-emerald-50/50'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Palette className="w-4 h-4" />
                <span>رنگ، فونٹ و سائز</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('sections')}
                className={`flex items-center gap-2 px-3 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                  activeTab === 'sections'
                    ? 'border-[#00a859] text-[#00a859] bg-emerald-50/50'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layout className="w-4 h-4" />
                <span>سیکشنز ظاہر / چھپائیں</span>
              </button>
            </div>

            {/* TAB CONTENTS (SCROLLABLE) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* TAB 1: OWNER PHOTO & STORE BRANDING */}
              {activeTab === 'owner' && (
                <div className="space-y-4">
                  {/* Big Owner Photo Box */}
                  <div className="p-4 bg-white rounded-2xl border-2 border-emerald-100 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                          <User className="w-4 h-4" />
                        </span>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                            Owner Picture at Top of Receipt (مالک کی بڑی تصویر)
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            رسید کے سب سے اوپر مالک کی پرکشش تصویر دکھائیں
                          </p>
                        </div>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={current.showOwnerPhoto}
                          onChange={(e) => setCurrent({ ...current, showOwnerPhoto: e.target.checked })}
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                        <span className="text-xs font-bold text-slate-700">ظاہر کریں</span>
                      </label>
                    </div>

                    {current.showOwnerPhoto && (
                      <div className="pt-2 border-t border-slate-100 space-y-3">
                        {/* Current Picture Preview & Actions */}
                        <div className="flex items-center gap-4">
                          <div
                            className={`overflow-hidden border-4 border-amber-400 shadow-md shrink-0 bg-slate-100 flex items-center justify-center ${getPhotoSizeClass(
                              current.ownerPhotoSize
                            )} ${getPhotoShapeClass(current.ownerPhotoShape)}`}
                          >
                            {current.ownerPhotoUrl ? (
                              <img
                                src={current.ownerPhotoUrl}
                                alt="Owner"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-8 h-8 text-slate-400" />
                            )}
                          </div>

                          <div className="flex-1 space-y-2">
                            <input
                              type="file"
                              ref={photoFileInputRef}
                              onChange={handlePhotoUpload}
                              accept="image/*"
                              className="hidden"
                            />

                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => photoFileInputRef.current?.click()}
                                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>گیلری یا کمپیوٹر سے تصویر منتخب کریں</span>
                              </button>

                              {current.ownerPhotoUrl && (
                                <button
                                  type="button"
                                  onClick={() => setCurrent({ ...current, ownerPhotoUrl: '' })}
                                  className="flex items-center gap-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>تصویر ہٹائیں</span>
                                </button>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500">
                              Android فون کیمرہ، گیلری یا ونڈوز کمپیوٹر سے تصویر اپلوڈ کر سکتے ہیں۔
                            </p>
                          </div>
                        </div>

                        {/* Owner Photo Controls: Shape, Size & Position */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
                          {/* Shape */}
                          <div>
                            <label className="text-[11px] font-bold text-slate-700 block mb-1">
                              تصویر کی شکل (Shape)
                            </label>
                            <div className="grid grid-cols-3 gap-1">
                              {(['circle', 'rounded', 'square'] as OwnerPhotoShape[]).map((sh) => (
                                <button
                                  key={sh}
                                  type="button"
                                  onClick={() => setCurrent({ ...current, ownerPhotoShape: sh })}
                                  className={`py-1.5 text-center text-xs font-bold rounded-lg border cursor-pointer capitalize ${
                                    current.ownerPhotoShape === sh
                                      ? 'border-[#00a859] bg-emerald-50 text-emerald-800 font-black'
                                      : 'border-slate-200 bg-white text-slate-600'
                                  }`}
                                >
                                  {sh === 'circle' ? 'گول' : sh === 'rounded' ? 'مربع گول' : 'چوکور'}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Size */}
                          <div>
                            <label className="text-[11px] font-bold text-slate-700 block mb-1">
                              سائز (Size)
                            </label>
                            <div className="grid grid-cols-4 gap-1">
                              {(['small', 'medium', 'large', 'xlarge'] as OwnerPhotoSize[]).map((sz) => (
                                <button
                                  key={sz}
                                  type="button"
                                  onClick={() => setCurrent({ ...current, ownerPhotoSize: sz })}
                                  className={`py-1.5 text-center text-[10px] font-bold rounded-lg border cursor-pointer uppercase ${
                                    current.ownerPhotoSize === sz
                                      ? 'border-[#00a859] bg-emerald-50 text-emerald-800 font-black'
                                      : 'border-slate-200 bg-white text-slate-600'
                                  }`}
                                >
                                  {sz === 'small' ? 'S' : sz === 'medium' ? 'M' : sz === 'large' ? 'L' : 'XL'}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Position */}
                          <div>
                            <label className="text-[11px] font-bold text-slate-700 block mb-1">
                              پوزیشن (Position)
                            </label>
                            <select
                              value={current.ownerPhotoPosition}
                              onChange={(e) =>
                                setCurrent({ ...current, ownerPhotoPosition: e.target.value as OwnerPhotoPosition })
                              }
                              className="w-full text-xs py-1.5 px-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-emerald-500"
                            >
                              <option value="top_above_name">مارٹ نام کے سب سے اوپر (Top)</option>
                              <option value="below_name">نام کے نیچے (Below Name)</option>
                              <option value="below_logo">لوگو کے نیچے (Below Logo)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Owner & Business Names */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Business Identity & Owner Details
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          اسٹور کا نام (Store Name)
                        </label>
                        <input
                          type="text"
                          value={current.storeName}
                          onChange={(e) => setCurrent({ ...current, storeName: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-emerald-500"
                          placeholder="WAQAS MART"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          اردو نام (Store Urdu Name)
                        </label>
                        <input
                          type="text"
                          value={current.storeUrduName || ''}
                          onChange={(e) => setCurrent({ ...current, storeUrduName: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-urdu text-right focus:bg-white focus:outline-emerald-500"
                          placeholder="وقاص مارٹ سپر مارکیٹ"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          مالک کا نام (Owner Name)
                        </label>
                        <input
                          type="text"
                          value={current.ownerName}
                          onChange={(e) => setCurrent({ ...current, ownerName: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-emerald-500"
                          placeholder="Waqas Ahmad (وقاص احمد)"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          ٹیگ لائن / سب ٹائٹل (Tagline)
                        </label>
                        <input
                          type="text"
                          value={current.tagline}
                          onChange={(e) => setCurrent({ ...current, tagline: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-emerald-500"
                          placeholder="Quality Products • Better Life"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Logo Upload Box */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-800">Store Logo (اسٹور لوگو)</span>
                      </div>
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-600">
                        <input
                          type="checkbox"
                          checked={current.showLogo}
                          onChange={(e) => setCurrent({ ...current, showLogo: e.target.checked })}
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                        <span>لوگو دکھائیں</span>
                      </label>
                    </div>

                    {current.showLogo && (
                      <div className="flex items-center gap-3 pt-1">
                        <input
                          type="file"
                          ref={logoFileInputRef}
                          onChange={handleLogoUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => logoFileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>لوگو تبدیل کریں</span>
                        </button>
                        {current.logoUrl && (
                          <span className="text-xs text-emerald-600 font-bold">✓ لوگو لوڈ ہے</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: CONTENT & MESSAGES */}
              {activeTab === 'content' && (
                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Contact & Location Information
                    </h4>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        فون نمبر (Phone Numbers)
                      </label>
                      <input
                        type="text"
                        value={current.phone}
                        onChange={(e) => setCurrent({ ...current, phone: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-emerald-500"
                        placeholder="0300-1234567 / 0321-9876543"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        پتہ / دکان کا ایڈریس (Store Address)
                      </label>
                      <input
                        type="text"
                        value={current.address}
                        onChange={(e) => setCurrent({ ...current, address: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-emerald-500"
                        placeholder="Main Commercial Market, Supermarket Road, Shop #12"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Titles & Customer Thank-You Notes
                    </h4>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        رسید کا ٹائٹل (Receipt Title)
                      </label>
                      <input
                        type="text"
                        value={current.receiptTitle}
                        onChange={(e) => setCurrent({ ...current, receiptTitle: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-emerald-500"
                        placeholder="OFFICIAL CASH MEMO / سیل رسید"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        خوش آمدید پیغام (Welcome Message)
                      </label>
                      <input
                        type="text"
                        value={current.welcomeMessage}
                        onChange={(e) => setCurrent({ ...current, welcomeMessage: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-emerald-500"
                        placeholder="WELCOME TO WAQAS MART"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        شکریہ کا انگریزی پیغام (Thank You Message)
                      </label>
                      <input
                        type="text"
                        value={current.thankYouMessage}
                        onChange={(e) => setCurrent({ ...current, thankYouMessage: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-emerald-500"
                        placeholder="Thank you for shopping at Waqas Mart!"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        شکریہ کا اردو پیغام (Thank You Urdu Note)
                      </label>
                      <input
                        type="text"
                        value={current.thankYouUrduMessage || ''}
                        onChange={(e) => setCurrent({ ...current, thankYouUrduMessage: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-urdu text-right focus:bg-white focus:outline-emerald-500"
                        placeholder="آپ کی آمد اور خریداری کا بہت شکریہ!"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        فوٹر واپسی پالیسی یا آفر (Return Policy & Footer Promo)
                      </label>
                      <textarea
                        rows={2}
                        value={current.footerPromo}
                        onChange={(e) => setCurrent({ ...current, footerPromo: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-urdu text-right focus:bg-white focus:outline-emerald-500"
                        placeholder="تبدیلی کے لیے ۳ دن کے اندر اصل بل لانا ضروری ہے۔"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: DESIGN, COLORS & PAPER SIZE */}
              {activeTab === 'design' && (
                <div className="space-y-4">
                  {/* Paper Size Selector */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                    <label className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                      پرنٹر پیپر سائز (Thermal Printer & Paper Size)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: '80mm', title: '80 mm (Standard)', desc: 'زیادہ تر سپر مارکیٹ تھرمل پرنٹرز' },
                        { id: '58mm', title: '58 mm (Small POS)', desc: 'چھوٹے پورٹیبل تھرمل پرنٹرز' },
                        { id: 'a4', title: 'A4 Full Page', desc: 'لیزر پرنٹر اور A4 پیپر' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setCurrent({ ...current, paperSize: item.id as ReceiptPaperSize })}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                            current.paperSize === item.id
                              ? 'border-[#00a859] bg-emerald-50/70 shadow-xs'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900">{item.title}</span>
                            {current.paperSize === item.id && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Colors */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Color Palette & Gold Accents
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          پرائمری رنگ (Emerald Green Header & Titles)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={current.primaryColor}
                            onChange={(e) => setCurrent({ ...current, primaryColor: e.target.value })}
                            className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 p-0.5"
                          />
                          <input
                            type="text"
                            value={current.primaryColor}
                            onChange={(e) => setCurrent({ ...current, primaryColor: e.target.value })}
                            className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          گولڈ ایکسنٹ رنگ (Tasteful Gold Accent)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={current.accentColor}
                            onChange={(e) => setCurrent({ ...current, accentColor: e.target.value })}
                            className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 p-0.5"
                          />
                          <input
                            type="text"
                            value={current.accentColor}
                            onChange={(e) => setCurrent({ ...current, accentColor: e.target.value })}
                            className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Typography & Borders */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Typography & Border Lines
                    </h4>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          فونٹ سائز (Font Size)
                        </label>
                        <select
                          value={current.fontSize}
                          onChange={(e) => setCurrent({ ...current, fontSize: e.target.value as any })}
                          className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                        >
                          <option value="small">چھوٹا (Compact 10px)</option>
                          <option value="medium">درمیانہ (Standard 11px)</option>
                          <option value="large">بڑا (Readable 12px)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          فونٹ اسٹائل (Style)
                        </label>
                        <select
                          value={current.fontFamily}
                          onChange={(e) => setCurrent({ ...current, fontFamily: e.target.value as any })}
                          className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                        >
                          <option value="sans">Sans-Serif (Modern)</option>
                          <option value="mono">Monospace (Thermal)</option>
                          <option value="serif">Serif (Classic)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          بارڈر لائن اسٹائل
                        </label>
                        <select
                          value={current.borderStyle}
                          onChange={(e) => setCurrent({ ...current, borderStyle: e.target.value as any })}
                          className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                        >
                          <option value="dashed">Dashed (- - - -)</option>
                          <option value="solid">Solid (ــــــ)</option>
                          <option value="double">Double (======)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SECTIONS VISIBILITY TOGGLES */}
              {activeTab === 'sections' && (
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">
                    Show / Hide Receipt Sections
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'showOwnerPhoto', label: 'مالک کی بڑی تصویر (Owner Photo)' },
                      { key: 'showLogo', label: 'مارٹ لوگو (Store Logo)' },
                      { key: 'showCashierName', label: 'کیشیئر کا نام (Cashier Name)' },
                      { key: 'showCustomerDetails', label: 'کسٹمر کا نام و تفصیلات (Customer Name)' },
                      { key: 'showItemizedDiscount', label: 'رعایت کی لائن (Discount Line)' },
                      { key: 'showTax', label: 'ٹیکس / جی ایس ٹی (Tax Details)' },
                      { key: 'showPaymentMethod', label: 'طریقہ ادائیگی: کیش/کارڈ/ادھار' },
                      { key: 'showChangeDue', label: 'بقایا رقم (Change Returned)' },
                      { key: 'showBarcode', label: 'بارکوڈ و تصدیقی کوڈ (Verification Barcode)' },
                      { key: 'showQrCode', label: 'کیو آر کوڈ (WhatsApp / Verification QR)' },
                      { key: 'showFooterNotes', label: 'فوٹر شکریہ و واپسی شرائط' },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 cursor-pointer transition-colors"
                      >
                        <span className="text-xs font-semibold text-slate-700">{item.label}</span>
                        <input
                          type="checkbox"
                          checked={(current as any)[item.key]}
                          onChange={(e) => setCurrent({ ...current, [item.key]: e.target.checked })}
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleRestoreDefault}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
              >
                Restore Defaults
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel (منسوخ)
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes (سیو کریں)</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: INTERACTIVE LIVE PREVIEW */}
          <div className="lg:w-5/12 bg-slate-200/80 p-4 sm:p-6 flex flex-col items-center justify-start overflow-y-auto">
            <div className="w-full flex items-center justify-between mb-3 px-1 text-slate-600 text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-700" />
                <span>Live Receipt Preview (لائیو نمونہ)</span>
              </span>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-slate-300 font-mono">
                {current.paperSize.toUpperCase()}
              </span>
            </div>

            {/* PREVIEW CONTAINER ACCORDING TO PAPER SIZE */}
            <div
              className={`bg-white shadow-2xl transition-all border border-slate-300 text-slate-900 overflow-hidden ${
                current.paperSize === '58mm'
                  ? 'w-[250px] p-3 text-[10px]'
                  : current.paperSize === 'a4'
                  ? 'w-full max-w-[420px] p-6 text-xs'
                  : 'w-[320px] p-4 text-[11px]'
              } ${
                current.fontFamily === 'mono'
                  ? 'font-mono'
                  : current.fontFamily === 'serif'
                  ? 'font-serif'
                  : 'font-sans'
              }`}
              style={{
                borderRadius: '16px',
              }}
            >
              {/* TOP OWNER PICTURE (WHEN POSITION IS TOP_ABOVE_NAME) */}
              {current.showOwnerPhoto && current.ownerPhotoPosition === 'top_above_name' && (
                <div className="flex flex-col items-center justify-center pt-2 pb-3">
                  <div
                    className={`overflow-hidden border-3 shadow-md bg-slate-50 flex items-center justify-center ${getPhotoSizeClass(
                      current.ownerPhotoSize
                    )} ${getPhotoShapeClass(current.ownerPhotoShape)}`}
                    style={{ borderColor: current.accentColor }}
                  >
                    {current.ownerPhotoUrl ? (
                      <img src={current.ownerPhotoUrl} alt="Owner" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  {current.ownerName && (
                    <span
                      className="text-[10px] font-black tracking-wide mt-1 uppercase"
                      style={{ color: current.primaryColor }}
                    >
                      {current.ownerName}
                    </span>
                  )}
                </div>
              )}

              {/* STORE HEADER & BRANDING */}
              <div
                className="pb-3 text-center"
                style={{
                  borderBottom: `2px ${current.borderStyle} ${current.primaryColor}40`,
                }}
              >
                {/* Logo if enabled */}
                {current.showLogo && (
                  <div className="w-8 h-8 mx-auto mb-1 rounded-lg flex items-center justify-center overflow-hidden">
                    {current.logoUrl ? (
                      <img src={current.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <div
                        className="w-full h-full rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: current.primaryColor }}
                      >
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                )}

                {/* OWNER PHOTO (IF POSITION IS BELOW_LOGO) */}
                {current.showOwnerPhoto && current.ownerPhotoPosition === 'below_logo' && (
                  <div className="flex flex-col items-center justify-center py-1">
                    <div
                      className={`overflow-hidden border-2 shadow-xs ${getPhotoSizeClass(
                        current.ownerPhotoSize
                      )} ${getPhotoShapeClass(current.ownerPhotoShape)}`}
                      style={{ borderColor: current.accentColor }}
                    >
                      {current.ownerPhotoUrl ? (
                        <img src={current.ownerPhotoUrl} alt="Owner" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                  </div>
                )}

                {/* Store Name with Rich Emerald & Gold Accents */}
                <h1
                  className="font-black tracking-wide uppercase text-sm sm:text-base leading-tight"
                  style={{ color: current.primaryColor }}
                >
                  {current.storeName || 'WAQAS MART'}
                </h1>

                {current.storeUrduName && (
                  <p className="font-urdu text-xs font-bold text-slate-800 mt-0.5">
                    {current.storeUrduName}
                  </p>
                )}

                {/* OWNER PHOTO (IF POSITION IS BELOW_NAME) */}
                {current.showOwnerPhoto && current.ownerPhotoPosition === 'below_name' && (
                  <div className="flex flex-col items-center justify-center py-1.5">
                    <div
                      className={`overflow-hidden border-2 shadow-xs ${getPhotoSizeClass(
                        current.ownerPhotoSize
                      )} ${getPhotoShapeClass(current.ownerPhotoShape)}`}
                      style={{ borderColor: current.accentColor }}
                    >
                      {current.ownerPhotoUrl ? (
                        <img src={current.ownerPhotoUrl} alt="Owner" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    {current.ownerName && (
                      <span className="text-[9px] font-bold text-slate-700 mt-0.5">
                        Proprietor: {current.ownerName}
                      </span>
                    )}
                  </div>
                )}

                <p className="text-[10px] text-slate-500 font-medium">{current.tagline}</p>
                <p className="text-[10px] text-slate-600 font-semibold mt-0.5">Ph: {current.phone}</p>
                <p className="text-[9px] text-slate-400 line-clamp-1">{current.address}</p>
              </div>

              {/* RECEIPT TITLE BADGE */}
              <div className="my-2.5 text-center">
                <span
                  className="inline-block px-3 py-1 rounded-full text-[10px] font-black text-white shadow-xs tracking-wider"
                  style={{ backgroundColor: current.primaryColor }}
                >
                  {current.receiptTitle}
                </span>
                {current.welcomeMessage && (
                  <p className="text-[9px] font-bold text-slate-500 tracking-wider mt-1">
                    • {current.welcomeMessage} •
                  </p>
                )}
              </div>

              {/* INVOICE & CUSTOMER INFO */}
              <div
                className="py-2 space-y-1 text-[10px]"
                style={{
                  borderBottom: `1px ${current.borderStyle} #cbd5e1`,
                }}
              >
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice No:</span>
                  <span className="font-bold text-slate-900">{previewTx.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date & Time:</span>
                  <span className="font-medium text-slate-800">{previewTx.dateTime}</span>
                </div>
                {current.showCashierName && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cashier:</span>
                    <span className="font-medium text-slate-800">{previewTx.cashierName}</span>
                  </div>
                )}
                {current.showCustomerDetails && previewTx.customerName && (
                  <div className="flex justify-between font-semibold" style={{ color: current.primaryColor }}>
                    <span>Customer:</span>
                    <span>{previewTx.customerName}</span>
                  </div>
                )}
              </div>

              {/* ITEMS TABLE */}
              <div className="py-2">
                <div
                  className="flex justify-between text-[10px] font-black uppercase pb-1"
                  style={{
                    color: current.primaryColor,
                    borderBottom: `1.5px ${current.borderStyle} ${current.primaryColor}30`,
                  }}
                >
                  <span className="w-1/2">Item Description</span>
                  <span className="w-1/4 text-center">Qty x Rate</span>
                  <span className="w-1/4 text-right">Total</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {previewTx.items.map((it) => (
                    <div key={it.id} className="py-1.5 flex justify-between items-start text-[10px]">
                      <div className="w-1/2 pr-1">
                        <p className="font-bold text-slate-900 leading-tight">{it.product.name}</p>
                      </div>
                      <div className="w-1/4 text-center text-slate-600 font-medium tabular-nums">
                        {it.quantity} x {formatRs(it.unitPrice)}
                      </div>
                      <div className="w-1/4 text-right font-bold text-slate-900 tabular-nums">
                        {formatRs(it.lineTotal)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* TOTALS & GRAND AMOUNT */}
              <div
                className="py-2 space-y-1 text-[11px]"
                style={{
                  borderTop: `1.5px ${current.borderStyle} #cbd5e1`,
                  borderBottom: `2px ${current.borderStyle} ${current.primaryColor}50`,
                }}
              >
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold tabular-nums">{formatRs(previewTx.subtotal)}</span>
                </div>

                {current.showItemizedDiscount && previewTx.discount > 0 && (
                  <div className="flex justify-between font-bold" style={{ color: current.accentColor }}>
                    <span>Discount (رعایت):</span>
                    <span className="tabular-nums">-{formatRs(previewTx.discount)}</span>
                  </div>
                )}

                {/* Grand Total Box */}
                <div
                  className="flex justify-between items-center p-2 rounded-xl mt-1 text-white shadow-sm"
                  style={{ backgroundColor: current.primaryColor }}
                >
                  <span className="font-black text-xs uppercase tracking-wider">Net Payable / کل رقم:</span>
                  <span className="font-black text-sm tracking-tight">{formatRs(previewTx.grandTotal)}</span>
                </div>
              </div>

              {/* PAYMENT BREAKDOWN */}
              {current.showPaymentMethod && (
                <div
                  className="py-2 space-y-1 text-[10px]"
                  style={{
                    borderBottom: `1px ${current.borderStyle} #cbd5e1`,
                  }}
                >
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Mode:</span>
                    <span className="font-black uppercase text-slate-800">CASH (کیش)</span>
                  </div>
                  {current.showChangeDue && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Cash Received:</span>
                        <span className="font-medium tabular-nums">{formatRs(3500)}</span>
                      </div>
                      <div className="flex justify-between font-bold" style={{ color: current.primaryColor }}>
                        <span>Change Returned (بقایا):</span>
                        <span className="tabular-nums">{formatRs(200)}</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* FOOTER & BARCODE */}
              <div className="pt-3 text-center space-y-1">
                {current.showFooterNotes && (
                  <>
                    <p className="font-bold text-slate-800 text-[10px]">{current.thankYouMessage}</p>
                    {current.thankYouUrduMessage && (
                      <p className="font-urdu text-xs font-bold" style={{ color: current.primaryColor }}>
                        {current.thankYouUrduMessage}
                      </p>
                    )}
                    <p className="text-[9px] text-slate-500 font-urdu">{current.footerPromo}</p>
                  </>
                )}

                {current.showBarcode && (
                  <div className="py-1">
                    <div className="font-mono text-center tracking-widest text-[11px] font-black text-slate-700">
                      ||| | |||| || ||||| |||| |||
                    </div>
                    <span className="text-[8px] text-slate-400 font-mono tracking-wider">
                      {previewTx.invoiceNumber}
                    </span>
                  </div>
                )}

                <p className="text-[8px] text-slate-400 font-sans tracking-wide pt-1">
                  {current.softwareCredit}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

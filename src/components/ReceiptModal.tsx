import React, { useState } from 'react';
import {
  Printer,
  Check,
  X,
  Share2,
  ShoppingBag,
  ArrowRight,
  Sliders,
  User,
  Sparkles,
  Download,
} from 'lucide-react';
import {
  SaleTransaction,
  StoreBranding,
  ReceiptSettings,
  DEFAULT_RECEIPT_SETTINGS,
  ReceiptPaperSize,
} from '../types/pos';
import { formatRs } from '../data/defaultProducts';
import { ReceiptDesignerModal } from './ReceiptDesignerModal';

interface ReceiptModalProps {
  isOpen: boolean;
  transaction: SaleTransaction | null;
  onClose: () => void;
  onNewSale: () => void;
  storeBranding?: StoreBranding;
  receiptSettings?: ReceiptSettings;
  onSaveReceiptSettings?: (settings: ReceiptSettings) => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  transaction,
  onClose,
  onNewSale,
  storeBranding,
  receiptSettings = DEFAULT_RECEIPT_SETTINGS,
  onSaveReceiptSettings,
}) => {
  const [isDesignerOpen, setIsDesignerOpen] = useState(false);
  const [activePaperSize, setActivePaperSize] = useState<ReceiptPaperSize>(
    receiptSettings.paperSize || '80mm'
  );

  if (!isOpen || !transaction) return null;

  const currentSettings: ReceiptSettings = {
    ...receiptSettings,
    storeName: receiptSettings.storeName || storeBranding?.storeName || 'WAQAS MART',
    paperSize: activePaperSize,
  };

  const handlePrint = () => {
    window.print();
  };

  const martTitle = currentSettings.storeName || 'WAQAS MART';

  const handleWhatsAppShare = () => {
    const textLines = [
      `🛒 *${martTitle} - ${currentSettings.storeUrduName || 'وقاص مارٹ'}*`,
      `📄 Invoice #: ${transaction.invoiceNumber}`,
      `📅 Date: ${transaction.dateTime}`,
      `👤 Cashier: ${transaction.cashierName}`,
      transaction.customerName ? `🤝 Customer: ${transaction.customerName}` : null,
      `--------------------------------`,
      ...transaction.items.map(
        (item) => `${item.quantity}x ${item.product.name} @ ${formatRs(item.unitPrice)} = ${formatRs(item.lineTotal)}`
      ),
      `--------------------------------`,
      `Subtotal: ${formatRs(transaction.subtotal)}`,
      transaction.discount > 0 ? `Discount (رعایت): -${formatRs(transaction.discount)}` : null,
      `*Grand Total (کل رقم): ${formatRs(transaction.grandTotal)}*`,
      `Payment Method: ${transaction.paymentMethod.toUpperCase()}`,
      transaction.changeDue !== undefined && transaction.changeDue > 0
        ? `Change Returned: ${formatRs(transaction.changeDue)}`
        : null,
      `--------------------------------`,
      `${currentSettings.thankYouMessage || 'Thank you for shopping with us!'}`,
      `${currentSettings.thankYouUrduMessage || 'آپ کی آمد کا بہت شکریہ'}`,
      currentSettings.phone ? `Ph: ${currentSettings.phone}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(textLines)}`;
    window.open(url, '_blank');
  };

  // Helper for Owner Photo classes
  const getPhotoSizeClass = (size: string) => {
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

  const getPhotoShapeClass = (shape: string) => {
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
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
        <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200 my-auto flex flex-col max-h-[95vh]">
          {/* Modal Top Bar */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#064e3b] via-[#00a859] to-[#047857] text-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center text-white">
                <Check className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <span className="font-black text-sm tracking-tight block">Sale Completed / بل مکمل ہو گیا</span>
                <span className="text-[10px] text-emerald-100 font-mono block">#{transaction.invoiceNumber}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {onSaveReceiptSettings && (
                <button
                  type="button"
                  onClick={() => setIsDesignerOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all cursor-pointer"
                  title="Customize Receipt Design & Owner Photo"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ڈیزائن بدلیں</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/15 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Paper Size Selector inside Modal */}
          <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-600 flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5 text-emerald-700" />
              <span>پرنٹر سائز:</span>
            </span>

            <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-slate-200">
              {(['80mm', '58mm', 'a4'] as ReceiptPaperSize[]).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setActivePaperSize(size)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    activePaperSize === size
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {size.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Printable Thermal Receipt Container */}
          <div className="p-3 sm:p-5 bg-slate-200/70 overflow-y-auto flex-1 flex justify-center items-start">
            <div
              id="printable-receipt"
              className={`bg-white shadow-lg border border-slate-300 text-slate-900 mx-auto transition-all ${
                activePaperSize === '58mm'
                  ? 'w-[260px] p-3 text-[10px]'
                  : activePaperSize === 'a4'
                  ? 'w-full max-w-[440px] p-6 text-xs'
                  : 'w-[320px] p-4 text-[11px]'
              } ${
                currentSettings.fontFamily === 'mono'
                  ? 'font-mono'
                  : currentSettings.fontFamily === 'serif'
                  ? 'font-serif'
                  : 'font-sans'
              }`}
              style={{
                borderRadius: '16px',
              }}
            >
              {/* ======================================================= */}
              {/* 1. LARGE OWNER PICTURE AT VERY TOP (ABOVE BUSINESS NAME)*/}
              {/* ======================================================= */}
              {currentSettings.showOwnerPhoto &&
                currentSettings.ownerPhotoPosition === 'top_above_name' && (
                  <div className="flex flex-col items-center justify-center pt-2 pb-3">
                    <div
                      className={`overflow-hidden border-3 shadow-md bg-slate-50 flex items-center justify-center ${getPhotoSizeClass(
                        currentSettings.ownerPhotoSize
                      )} ${getPhotoShapeClass(currentSettings.ownerPhotoShape)}`}
                      style={{ borderColor: currentSettings.accentColor || '#d97706' }}
                    >
                      {currentSettings.ownerPhotoUrl ? (
                        <img
                          src={currentSettings.ownerPhotoUrl}
                          alt={currentSettings.ownerName || 'Store Owner'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                    {currentSettings.ownerName && (
                      <span
                        className="text-[10px] font-black tracking-wide mt-1 uppercase"
                        style={{ color: currentSettings.primaryColor || '#00a859' }}
                      >
                        {currentSettings.ownerName}
                      </span>
                    )}
                  </div>
                )}

              {/* ======================================================= */}
              {/* 2. STORE BRANDING, LOGO & CONTACT DETAILS               */}
              {/* ======================================================= */}
              <div
                className="pb-3 text-center"
                style={{
                  borderBottom: `2px ${currentSettings.borderStyle || 'dashed'} ${
                    currentSettings.primaryColor || '#00a859'
                  }40`,
                }}
              >
                {/* Logo if enabled */}
                {currentSettings.showLogo && (
                  <div className="w-9 h-9 mx-auto mb-1.5 rounded-xl flex items-center justify-center overflow-hidden">
                    {currentSettings.logoUrl ? (
                      <img src={currentSettings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <div
                        className="w-full h-full rounded-xl flex items-center justify-center text-white shadow-xs"
                        style={{ backgroundColor: currentSettings.primaryColor || '#00a859' }}
                      >
                        <ShoppingBag className="w-4 h-4 stroke-[2.2]" />
                      </div>
                    )}
                  </div>
                )}

                {/* OWNER PHOTO (IF POSITION IS BELOW_LOGO) */}
                {currentSettings.showOwnerPhoto &&
                  currentSettings.ownerPhotoPosition === 'below_logo' && (
                    <div className="flex flex-col items-center justify-center py-1">
                      <div
                        className={`overflow-hidden border-3 shadow-xs ${getPhotoSizeClass(
                          currentSettings.ownerPhotoSize
                        )} ${getPhotoShapeClass(currentSettings.ownerPhotoShape)}`}
                        style={{ borderColor: currentSettings.accentColor || '#d97706' }}
                      >
                        {currentSettings.ownerPhotoUrl ? (
                          <img
                            src={currentSettings.ownerPhotoUrl}
                            alt="Owner"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                    </div>
                  )}

                {/* Store Name in Bold Premium Emerald & Gold */}
                <h1
                  className="font-black tracking-wide uppercase text-base sm:text-lg leading-tight"
                  style={{ color: currentSettings.primaryColor || '#00a859' }}
                >
                  {currentSettings.storeName}
                </h1>

                {currentSettings.storeUrduName && (
                  <p className="font-urdu text-sm font-bold text-slate-800 mt-0.5">
                    {currentSettings.storeUrduName}
                  </p>
                )}

                {/* OWNER PHOTO (IF POSITION IS BELOW_NAME) */}
                {currentSettings.showOwnerPhoto &&
                  currentSettings.ownerPhotoPosition === 'below_name' && (
                    <div className="flex flex-col items-center justify-center py-2">
                      <div
                        className={`overflow-hidden border-3 shadow-xs ${getPhotoSizeClass(
                          currentSettings.ownerPhotoSize
                        )} ${getPhotoShapeClass(currentSettings.ownerPhotoShape)}`}
                        style={{ borderColor: currentSettings.accentColor || '#d97706' }}
                      >
                        {currentSettings.ownerPhotoUrl ? (
                          <img
                            src={currentSettings.ownerPhotoUrl}
                            alt="Owner"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      {currentSettings.ownerName && (
                        <span className="text-[10px] font-bold text-slate-700 mt-0.5">
                          {currentSettings.ownerName}
                        </span>
                      )}
                    </div>
                  )}

                <p className="text-[10px] text-slate-500 font-medium">{currentSettings.tagline}</p>
                {currentSettings.phone && (
                  <p className="text-[10px] text-slate-700 font-semibold mt-0.5">
                    Ph: {currentSettings.phone}
                  </p>
                )}
                {currentSettings.address && (
                  <p className="text-[9px] text-slate-500 max-w-[280px] mx-auto leading-tight mt-0.5">
                    {currentSettings.address}
                  </p>
                )}
              </div>

              {/* ======================================================= */}
              {/* 3. RECEIPT TITLE BADGE & WELCOME MESSAGE                */}
              {/* ======================================================= */}
              <div className="my-2 text-center">
                <span
                  className="inline-block px-3 py-0.5 rounded-full text-[10px] font-black text-white shadow-xs tracking-wider uppercase"
                  style={{ backgroundColor: currentSettings.primaryColor || '#00a859' }}
                >
                  {currentSettings.receiptTitle || 'OFFICIAL CASH MEMO'}
                </span>
                {currentSettings.welcomeMessage && (
                  <p className="text-[9px] font-bold text-slate-500 tracking-wider mt-0.5">
                    • {currentSettings.welcomeMessage} •
                  </p>
                )}
              </div>

              {/* ======================================================= */}
              {/* 4. INVOICE META INFORMATION                             */}
              {/* ======================================================= */}
              <div
                className="py-2 space-y-0.5 text-[10px]"
                style={{
                  borderBottom: `1px ${currentSettings.borderStyle || 'dashed'} #cbd5e1`,
                }}
              >
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice No:</span>
                  <span className="font-bold text-slate-900">{transaction.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date / Time:</span>
                  <span className="font-medium text-slate-800">{transaction.dateTime}</span>
                </div>
                {currentSettings.showCashierName && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cashier:</span>
                    <span className="font-medium text-slate-800">{transaction.cashierName}</span>
                  </div>
                )}
                {currentSettings.showCustomerDetails && transaction.customerName && (
                  <div
                    className="flex justify-between font-bold"
                    style={{ color: currentSettings.primaryColor || '#00a859' }}
                  >
                    <span>Customer:</span>
                    <span>{transaction.customerName}</span>
                  </div>
                )}
              </div>

              {/* ======================================================= */}
              {/* 5. ITEM DETAILS TABLE                                   */}
              {/* ======================================================= */}
              <div className="py-2">
                <div
                  className="flex justify-between text-[10px] font-black uppercase pb-1"
                  style={{
                    color: currentSettings.primaryColor || '#00a859',
                    borderBottom: `1.5px ${currentSettings.borderStyle || 'dashed'} ${
                      currentSettings.primaryColor || '#00a859'
                    }30`,
                  }}
                >
                  <span className="w-1/2">Item Description</span>
                  <span className="w-1/4 text-center">Qty x Rate</span>
                  <span className="w-1/4 text-right">Total</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {transaction.items.map((item) => (
                    <div key={item.id} className="py-1.5 flex justify-between items-start text-[10px]">
                      <div className="w-1/2 pr-1 flex items-center gap-1.5 min-w-0">
                        {item.product.imageUrl ? (
                          <img
                            src={item.product.imageUrl}
                            alt=""
                            className="w-5 h-5 rounded object-cover border border-slate-200 shrink-0"
                          />
                        ) : null}
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 leading-tight">{item.product.name}</p>
                          {item.product.urduName && (
                            <p className="font-urdu text-[9px] text-slate-500">{item.product.urduName}</p>
                          )}
                        </div>
                      </div>
                      <div className="w-1/4 text-center text-slate-600 font-medium tabular-nums">
                        {item.quantity} x {formatRs(item.unitPrice)}
                      </div>
                      <div className="w-1/4 text-right font-bold text-slate-900 tabular-nums">
                        {formatRs(item.lineTotal)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ======================================================= */}
              {/* 6. TOTALS & CALCULATIONS                                */}
              {/* ======================================================= */}
              <div
                className="py-2 space-y-1 text-[11px]"
                style={{
                  borderTop: `1.5px ${currentSettings.borderStyle || 'dashed'} #cbd5e1`,
                  borderBottom: `2px ${currentSettings.borderStyle || 'dashed'} ${
                    currentSettings.primaryColor || '#00a859'
                  }50`,
                }}
              >
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold tabular-nums">{formatRs(transaction.subtotal)}</span>
                </div>

                {currentSettings.showItemizedDiscount && transaction.discount > 0 && (
                  <div
                    className="flex justify-between font-bold"
                    style={{ color: currentSettings.accentColor || '#d97706' }}
                  >
                    <span>Discount (رعایت):</span>
                    <span className="tabular-nums">-{formatRs(transaction.discount)}</span>
                  </div>
                )}

                {currentSettings.showTax && transaction.taxAmount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Tax:</span>
                    <span className="tabular-nums">{formatRs(transaction.taxAmount)}</span>
                  </div>
                )}

                {/* Grand Total Highlight Badge */}
                <div
                  className="flex justify-between items-center p-2 rounded-xl mt-1 text-white shadow-sm"
                  style={{ backgroundColor: currentSettings.primaryColor || '#00a859' }}
                >
                  <span className="font-black text-xs uppercase tracking-wider">
                    Total Amount (کل رقم):
                  </span>
                  <span className="font-black text-sm sm:text-base tracking-tight">
                    {formatRs(transaction.grandTotal)}
                  </span>
                </div>
              </div>

              {/* ======================================================= */}
              {/* 7. PAYMENT DETAILS (CASH / CARD / CREDIT)               */}
              {/* ======================================================= */}
              {currentSettings.showPaymentMethod && (
                <div
                  className="py-2 space-y-1 text-[10px]"
                  style={{
                    borderBottom: `1px ${currentSettings.borderStyle || 'dashed'} #cbd5e1`,
                  }}
                >
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Method:</span>
                    <span className="font-black uppercase text-slate-800">
                      {transaction.paymentMethod === 'cash'
                        ? 'CASH (نقد رقم)'
                        : transaction.paymentMethod === 'card'
                        ? 'CARD (کریڈٹ/ڈیبٹ کارڈ)'
                        : 'CREDIT / KHATA (ادھار کھاتہ)'}
                    </span>
                  </div>

                  {transaction.paymentMethod === 'cash' && currentSettings.showChangeDue && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Cash Tendered:</span>
                        <span className="font-medium tabular-nums">
                          {formatRs(transaction.cashTendered || transaction.grandTotal)}
                        </span>
                      </div>
                      <div
                        className="flex justify-between font-bold"
                        style={{ color: currentSettings.primaryColor || '#00a859' }}
                      >
                        <span>Change Returned (بقایا):</span>
                        <span className="tabular-nums">{formatRs(transaction.changeDue || 0)}</span>
                      </div>
                    </>
                  )}

                  {transaction.paymentMethod === 'card' && transaction.cardReference && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Card Slip / Ref:</span>
                      <span className="font-mono text-slate-800">{transaction.cardReference}</span>
                    </div>
                  )}

                  {transaction.paymentMethod === 'credit' && (
                    <div className="flex justify-between text-amber-800 font-bold">
                      <span>Customer Khata:</span>
                      <span>Recorded in Udhar Ledger</span>
                    </div>
                  )}
                </div>
              )}

              {/* ======================================================= */}
              {/* 8. FOOTER, BARCODE & THANK YOU MESSAGES                 */}
              {/* ======================================================= */}
              <div className="pt-3 text-center space-y-1">
                {currentSettings.showFooterNotes && (
                  <>
                    <p className="font-bold text-slate-800 text-[10px]">{currentSettings.thankYouMessage}</p>
                    {currentSettings.thankYouUrduMessage && (
                      <p
                        className="font-urdu text-xs font-bold"
                        style={{ color: currentSettings.primaryColor || '#00a859' }}
                      >
                        {currentSettings.thankYouUrduMessage}
                      </p>
                    )}
                    {currentSettings.footerPromo && (
                      <p className="text-[9px] text-slate-500 font-urdu leading-tight">
                        {currentSettings.footerPromo}
                      </p>
                    )}
                  </>
                )}

                {currentSettings.showBarcode && (
                  <div className="py-1">
                    <div className="font-mono text-center tracking-widest text-[11px] font-black text-slate-700">
                      ||| | |||| || ||||| |||| |||
                    </div>
                    <span className="text-[8px] text-slate-400 font-mono tracking-wider">
                      {transaction.invoiceNumber}
                    </span>
                  </div>
                )}

                <p className="text-[8px] text-slate-400 font-sans tracking-wide pt-0.5">
                  {currentSettings.softwareCredit}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-3.5 bg-white border-t border-slate-200 shrink-0 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-black text-xs transition-colors cursor-pointer shadow-sm active:scale-98"
              >
                <Printer className="w-4 h-4" />
                <span>Print Thermal Slip (پرنٹ کریں)</span>
              </button>
              <button
                onClick={handleWhatsAppShare}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl font-bold text-xs transition-colors cursor-pointer active:scale-98"
              >
                <Share2 className="w-4 h-4 text-emerald-700" />
                <span>Share WhatsApp</span>
              </button>
            </div>

            <button
              onClick={onNewSale}
              className="w-full py-2.5 px-4 bg-emerald-950 hover:bg-black text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs active:scale-98"
            >
              <span>Start Next Sale (اگلا نیا بل)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Receipt Designer Modal */}
      {onSaveReceiptSettings && (
        <ReceiptDesignerModal
          isOpen={isDesignerOpen}
          onClose={() => setIsDesignerOpen(false)}
          settings={currentSettings}
          onSaveSettings={onSaveReceiptSettings}
          sampleTransaction={transaction}
        />
      )}
    </>
  );
};

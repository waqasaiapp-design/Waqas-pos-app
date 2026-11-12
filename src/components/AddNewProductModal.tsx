import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Image as ImageIcon,
  ScanBarcode,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { Product, CategoryInfo } from '../types/pos';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { ManageCategoriesModal } from './ManageCategoriesModal';

interface AddNewProductModalProps {
  isOpen: boolean;
  categories: CategoryInfo[];
  existingProducts: Product[];
  onClose: () => void;
  onSaveProduct: (product: Product) => void;
  onUpdateCategories: (categories: CategoryInfo[]) => void;
}

export const AddNewProductModal: React.FC<AddNewProductModalProps> = ({
  isOpen,
  categories,
  existingProducts,
  onClose,
  onSaveProduct,
  onUpdateCategories,
}) => {
  // Form fields matching Screenshot 2
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [category, setCategory] = useState<string>(categories[0]?.name || 'All Items (General)');
  const [name, setName] = useState<string>('');
  const [barcode, setBarcode] = useState<string>('');
  const [unit, setUnit] = useState<string>('Pcs');
  const [lastPurchaseCost, setLastPurchaseCost] = useState<number | ''>(0);
  const [retailPrice, setRetailPrice] = useState<number | ''>(0);
  const [wholesalePrice, setWholesalePrice] = useState<number | ''>(0);
  const [stock, setStock] = useState<number | ''>(0);
  const [lowStockAlert, setLowStockAlert] = useState<number | ''>(0);
  const [expiryDate, setExpiryDate] = useState<string>('');

  // Sub-modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Sync category default if categories change
  useEffect(() => {
    if (categories.length > 0 && !categories.some((c) => c.name === category)) {
      setCategory(categories[0].name);
    }
  }, [categories]);

  // Clean up camera stream on close
  useEffect(() => {
    if (!isOpen || !isCameraActive) {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        setCameraStream(null);
      }
    }
  }, [isOpen, isCameraActive]);

  if (!isOpen) return null;

  // Handle Photo Gallery upload
  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Live Camera Snapshot
  const handleStartCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      setCameraStream(stream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access error', err);
      setError('Could not access camera. Please allow camera permissions or use Gallery.');
    }
  };

  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setPhotoUrl(dataUrl);
    }
    // stop camera
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  // Submit and Save Product
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Product Name is required.');
      return;
    }

    if (lastPurchaseCost === '' || Number(lastPurchaseCost) < 0) {
      setError('Last Purchase Cost is required and must be non-negative.');
      return;
    }

    if (retailPrice === '' || Number(retailPrice) <= 0) {
      setError('Retail Price is required and must be greater than 0.');
      return;
    }

    // Barcode duplicate validation
    const trimmedBarcode = barcode.trim() || `896${Date.now().toString().slice(-10)}`;
    if (barcode.trim()) {
      const isDuplicate = existingProducts.some(
        (p) => (p?.barcode || '').toLowerCase() === trimmedBarcode.toLowerCase()
      );
      if (isDuplicate) {
        setError(`Barcode "${trimmedBarcode}" already exists on another product!`);
        return;
      }
    }

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: name.trim(),
      barcode: trimmedBarcode,
      sku: `SKU-${Date.now().toString().slice(-4)}`,
      category,
      price: Number(retailPrice),
      costPrice: Number(lastPurchaseCost),
      wholesalePrice: wholesalePrice === '' ? undefined : Number(wholesalePrice),
      stock: stock === '' ? 0 : Number(stock),
      unit,
      lowStockAlert: lowStockAlert === '' ? undefined : Number(lowStockAlert),
      expiryDate: expiryDate || undefined,
      imageUrl: photoUrl || undefined,
    };

    onSaveProduct(newProduct);

    // Reset Form
    setName('');
    setBarcode('');
    setPhotoUrl('');
    setLastPurchaseCost(0);
    setRetailPrice(0);
    setWholesalePrice(0);
    setStock(0);
    setLowStockAlert(0);
    setExpiryDate('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-100 flex flex-col my-auto max-h-[94vh]">
        {/* Header matching Screenshot 2 */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
          <h2 className="text-xl font-black text-[#1e293b] tracking-tight">Add New Product</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. PRODUCT PHOTO */}
          <div>
            <label className="block text-xs font-black tracking-wider text-slate-400 uppercase mb-2">
              PRODUCT PHOTO
            </label>

            {/* Live Camera View if Active */}
            {isCameraActive ? (
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex flex-col items-center justify-center">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute bottom-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCaptureSnapshot}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg"
                  >
                    Take Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCameraActive(false)}
                    className="px-4 py-2 bg-slate-800/80 text-white rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : photoUrl ? (
              /* Photo Preview with delete */
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 aspect-video flex items-center justify-center">
                <img src={photoUrl} alt="Product preview" className="w-full h-full object-contain" />
                <button
                  type="button"
                  onClick={() => setPhotoUrl('')}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md cursor-pointer"
                  title="Remove Photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Camera & Gallery Buttons matching Screenshot 2 */
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleStartCamera}
                  className="border border-blue-200 bg-blue-50/40 hover:bg-blue-50 text-[#0284c7] font-black text-xs sm:text-sm py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
                >
                  <Camera className="w-5 h-5 stroke-[2.2]" />
                  <span>CAMERA</span>
                </button>

                <button
                  type="button"
                  onClick={handleGalleryClick}
                  className="border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 text-[#16a34a] font-black text-xs sm:text-sm py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
                >
                  <ImageIcon className="w-5 h-5 stroke-[2.2]" />
                  <span>GALLERY</span>
                </button>
              </div>
            )}

            {/* Hidden File Input for Gallery */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* 2. CATEGORY (POS LINKING) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-black tracking-wider text-slate-400 uppercase">
                CATEGORY (POS LINKING)
              </label>
              <button
                type="button"
                onClick={() => setIsManageCategoriesOpen(true)}
                className="text-xs text-[#0284c7] hover:underline font-bold tracking-wide uppercase cursor-pointer"
              >
                MANAGE CATEGORIES
              </button>
            </div>

            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-[#f8fafc] border border-slate-200 rounded-2xl font-bold text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-3.5 pointer-events-none text-slate-400">
                ▼
              </div>
            </div>
          </div>

          {/* 3. NAME* */}
          <div>
            <label className="block text-xs font-black tracking-wider text-red-500 uppercase mb-1.5">
              NAME*
            </label>
            <input
              type="text"
              required
              placeholder="Enter Product Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-[#f8fafc] border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* 4. BARCODE & UNIT (2 Columns) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black tracking-wider text-slate-400 uppercase mb-1.5">
                BARCODE
              </label>
              <div className="relative flex items-center bg-[#f8fafc] border border-slate-200 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white">
                <input
                  type="text"
                  placeholder="Barcode"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full text-sm font-mono font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent pr-7"
                />
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="text-[#16a34a] hover:text-[#15803d] absolute right-3 cursor-pointer"
                  title="Scan with Camera"
                >
                  <ScanBarcode className="w-5 h-5 stroke-[2.2]" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black tracking-wider text-slate-400 uppercase mb-1.5">
                UNIT
              </label>
              <div className="relative">
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-4 py-3 bg-[#f8fafc] border border-slate-200 rounded-2xl font-bold text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
                >
                  <option value="Pcs">Pcs</option>
                  <option value="Pack">Pack</option>
                  <option value="Kg">Kg</option>
                  <option value="Liter">Liter</option>
                  <option value="Box">Box</option>
                  <option value="Dozen">Dozen</option>
                  <option value="Bag">Bag</option>
                </select>
                <div className="absolute right-4 top-3.5 pointer-events-none text-slate-400">
                  ▼
                </div>
              </div>
            </div>
          </div>

          {/* 5. LAST PURCHASE COST* & RETAIL PRICE* (2 Columns) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black tracking-wider text-red-500 uppercase mb-1.5">
                LAST PURCHASE COST*
              </label>
              <input
                type="number"
                min="0"
                required
                placeholder="0"
                value={lastPurchaseCost}
                onChange={(e) =>
                  setLastPurchaseCost(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="w-full px-4 py-3 bg-[#f8fafc] border border-slate-200 rounded-2xl text-sm font-black tabular-nums text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-black tracking-wider text-red-500 uppercase mb-1.5">
                RETAIL PRICE*
              </label>
              <input
                type="number"
                min="1"
                required
                placeholder="0"
                value={retailPrice}
                onChange={(e) =>
                  setRetailPrice(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="w-full px-4 py-3 bg-[#f8fafc] border border-slate-200 rounded-2xl text-sm font-black tabular-nums text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* 6. WHOLESALE PRICE & STOCK (2 Columns) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black tracking-wider text-amber-600 uppercase mb-1.5">
                WHOLESALE PRICE
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={wholesalePrice}
                onChange={(e) =>
                  setWholesalePrice(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="w-full px-4 py-3 bg-[#f8fafc] border border-amber-200 rounded-2xl text-sm font-bold tabular-nums text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-black tracking-wider text-slate-400 uppercase mb-1.5">
                STOCK
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={stock}
                onChange={(e) =>
                  setStock(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="w-full px-4 py-3 bg-[#f8fafc] border border-slate-200 rounded-2xl text-sm font-bold tabular-nums text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* 7. LOW STOCK ALERT & EXPIRY DATE (2 Columns) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black tracking-wider text-blue-600 uppercase mb-1.5">
                LOW STOCK ALERT
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={lowStockAlert}
                onChange={(e) =>
                  setLowStockAlert(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="w-full px-4 py-3 bg-blue-50/40 border border-blue-200 rounded-2xl text-sm font-bold tabular-nums text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-black tracking-wider text-amber-600 uppercase mb-1.5">
                EXPIRY DATE
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-4 py-3 bg-[#fffbeb] border border-amber-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* 8. SAVE PRODUCT BUTTON matching Screenshot 2 */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 bg-[#16a34a] hover:bg-[#15803d] text-white font-black text-sm uppercase tracking-wider rounded-2xl transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>SAVE PRODUCT</span>
            </button>
          </div>
        </form>
      </div>

      {/* Barcode Camera Scanner */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onBarcodeDetected={(code) => {
          setBarcode(code);
        }}
        lang="bi"
      />

      {/* Manage Categories Modal */}
      <ManageCategoriesModal
        isOpen={isManageCategoriesOpen}
        categories={categories}
        onClose={() => setIsManageCategoriesOpen(false)}
        onAddCategory={(cat) => {
          onUpdateCategories([...categories, cat]);
        }}
        onDeleteCategory={(catId) => {
          onUpdateCategories(categories.filter((c) => c.id !== catId));
        }}
      />
    </div>
  );
};

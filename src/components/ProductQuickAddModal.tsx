import React, { useState } from 'react';
import { PlusCircle, X, Barcode, Tag, DollarSign, Layers } from 'lucide-react';
import { Product } from '../types/pos';

interface ProductQuickAddModalProps {
  isOpen: boolean;
  initialBarcode?: string;
  onClose: () => void;
  onAddProduct: (product: Product, addToCart: boolean) => void;
}

export const ProductQuickAddModal: React.FC<ProductQuickAddModalProps> = ({
  isOpen,
  initialBarcode = '',
  onClose,
  onAddProduct,
}) => {
  const [barcode, setBarcode] = useState(initialBarcode);
  const [name, setName] = useState('');
  const [urduName, setUrduName] = useState('');
  const [category, setCategory] = useState('grocery');
  const [price, setPrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>(100);
  const [unit, setUnit] = useState('pcs');
  const [addToCartNow, setAddToCartNow] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialBarcode) {
      setBarcode(initialBarcode);
    }
  }, [initialBarcode]);

  if (!isOpen) return null;

  const generateRandomBarcode = () => {
    // Generate valid looking GS1 896 Pakistani prefix barcode
    const randomSuffix = Math.floor(1000000000 + Math.random() * 9000000000);
    setBarcode(`896${randomSuffix.toString().slice(0, 10)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Product name is required / پروڈکٹ کا نام ضروری ہے');
      return;
    }
    if (!price || Number(price) <= 0) {
      setError('Please enter a valid price in Rs. / درست قیمت درج کریں');
      return;
    }

    const finalBarcode = barcode.trim() || `896${Date.now().toString().slice(-10)}`;

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      barcode: finalBarcode,
      name: name.trim(),
      urduName: urduName.trim() || undefined,
      category,
      price: Number(price),
      costPrice: Math.round(Number(price) * 0.85),
      stock: Number(stock) || 50,
      unit,
    };

    onAddProduct(newProduct, addToCartNow);
    // Reset
    setName('');
    setUrduName('');
    setPrice('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-emerald-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-emerald-700 text-white">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-emerald-200" />
            <div>
              <h3 className="font-bold text-base leading-tight">Add New Product</h3>
              <p className="text-xs text-emerald-200 font-urdu">نیا پروڈکٹ درج کریں</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          {/* Barcode */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Barcode / SKU (بارکوڈ)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Barcode className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Scan or enter barcode"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={generateRandomBarcode}
                className="px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer whitespace-nowrap"
              >
                Auto Generate
              </button>
            </div>
          </div>

          {/* English Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Product Name (پروڈکٹ کا نام) *
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="e.g. National Salt 800g"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Urdu Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Urdu Name (اردو نام - اختیاری)
            </label>
            <input
              type="text"
              dir="rtl"
              placeholder="مثلاً نیشنل نمک ۸۰۰ گرام"
              value={urduName}
              onChange={(e) => setUrduName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-urdu"
            />
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category (کیٹگری)</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                <option value="ALL ITEMS">ALL ITEMS (جنرل)</option>
                <option value="JAZZ">JAZZ (جاز)</option>
                <option value="DUBAI KUNAFA">DUBAI KUNAFA (دبئی کنافہ)</option>
                <option value="GROCERY">GROCERY (کریانہ)</option>
                <option value="OTHER">OTHER (دیگر)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit (اکائی)</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                <option value="pcs">Pcs (عدد)</option>
                <option value="pack">Pack (پیکٹ)</option>
                <option value="kg">Kg (کلو)</option>
                <option value="liter">Litre (لیٹر)</option>
                <option value="box">Box (ڈبہ)</option>
                <option value="bottle">Bottle (بوتل)</option>
              </select>
            </div>
          </div>

          {/* Price & Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sale Price (قیمت فروخت - روپے) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-emerald-700">Rs.</span>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 text-sm font-semibold tabular-nums border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Stock Qty (اسٹاک مقدار)
              </label>
              <div className="relative">
                <Layers className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 text-sm tabular-nums border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Add to current cart toggle */}
          <div className="flex items-center gap-2 p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
            <input
              type="checkbox"
              id="addToCartNow"
              checked={addToCartNow}
              onChange={(e) => setAddToCartNow(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500"
            />
            <label htmlFor="addToCartNow" className="text-xs font-medium text-emerald-900 cursor-pointer">
              Add directly to current active cart (فوری ٹوکری میں شامل کریں)
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              Save Product (محفوظ کریں)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

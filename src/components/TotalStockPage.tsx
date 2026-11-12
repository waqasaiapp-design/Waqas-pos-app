import React, { useState, useMemo, useRef } from 'react';
import {
  Package,
  Layers,
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  ScanBarcode,
  Eye,
  Printer,
  ChevronLeft,
  ChevronRight,
  X,
  Camera,
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  ArrowUpDown,
  Download,
} from 'lucide-react';
import { Product, CategoryInfo } from '../types/pos';
import { formatRs } from '../data/defaultProducts';
import { WaqasBrandingCard } from './WaqasBrandingCard';
import { FullScreenPageHeader } from './FullScreenPageHeader';

interface TotalStockPageProps {
  products: Product[];
  categories: CategoryInfo[];
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onDeleteAllProducts?: () => void;
  onOpenAddProduct: () => void;
  onOpenScanner: () => void;
  onNavigateToPos?: () => void;
  onBackToHome?: () => void;
}

export const TotalStockPage: React.FC<TotalStockPageProps> = ({
  products,
  categories,
  onSaveProduct,
  onDeleteProduct,
  onDeleteAllProducts,
  onOpenAddProduct,
  onOpenScanner,
  onNavigateToPos,
  onBackToHome,
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [showNegativeStockOnly, setShowNegativeStockOnly] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Modals
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [isPrintReportOpen, setIsPrintReportOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [showConfirmDeleteAll, setShowConfirmDeleteAll] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editBarcode, setEditBarcode] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editUnit, setEditUnit] = useState('Pcs');
  const [editCostPrice, setEditCostPrice] = useState<number>(0);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);
  const [editLowStock, setEditLowStock] = useState<number>(5);
  const [editImageUrl, setEditImageUrl] = useState<string>('');
  const [editError, setEditError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Negative Stock items list (Stock < 0)
  const negativeStockItems = useMemo(() => {
    return products.filter((p) => (Number(p.stock) || 0) < 0);
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const n = (p?.name || '').toLowerCase();
      const b = (p?.barcode || '').toLowerCase();
      const c = (p?.category || '').toLowerCase();
      const matchesSearch =
        !q || n.includes(q) || b.includes(q) || c.includes(q);

      const selCat = (selectedCategory || '').toLowerCase();
      const matchesCat =
        selCat === 'all categories' ||
        selCat === 'all items' ||
        c === selCat;

      const matchesNegative = !showNegativeStockOnly || (Number(p.stock) || 0) < 0;

      return matchesSearch && matchesCat && matchesNegative;
    });
  }, [products, searchQuery, selectedCategory, showNegativeStockOnly]);

  // Overall calculations (computed from real data)
  const totalItems = products.length;
  const totalQuantity = useMemo(() => {
    return products.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
  }, [products]);

  const totalStockValue = useMemo(() => {
    // Total Stock Value = sum(product.stock * product.costPrice)
    return products.reduce((acc, p) => acc + ((Number(p.stock) || 0) * (Number(p.costPrice) || 0)), 0);
  }, [products]);

  // Potential retail revenue
  const totalRetailValue = useMemo(() => {
    return products.reduce((acc, p) => acc + ((Number(p.stock) || 0) * (Number(p.price) || 0)), 0);
  }, [products]);

  // Low stock and out of stock items
  const lowStockItems = useMemo(() => {
    return products.filter((p) => p.stock > 0 && p.stock <= (p.lowStockAlert || 5));
  }, [products]);

  const outOfStockItems = useMemo(() => {
    return products.filter((p) => p.stock <= 0);
  }, [products]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const currentSafePage = Math.min(currentPage, totalPages);
  const startIndex = (currentSafePage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  // Category badge styling matching screenshot 4
  const getCategoryBadgeClass = (categoryName: string) => {
    const c = categoryName.toLowerCase();
    if (c.includes('beverage')) return 'bg-[#dbeafe] text-[#1d4ed8]'; // Blue
    if (c.includes('snack')) return 'bg-[#fef3c7] text-[#b45309]'; // Orange/Yellow
    if (c.includes('oil') || c.includes('ghee')) return 'bg-[#f3e8ff] text-[#7e22ce]'; // Purple
    if (c.includes('groc')) return 'bg-[#dcfce7] text-[#15803d]'; // Green
    if (c.includes('house') || c.includes('clean')) return 'bg-[#fce7f3] text-[#be185d]'; // Pink
    if (c.includes('bake') || c.includes('bread')) return 'bg-[#cffafe] text-[#0e7490]'; // Cyan
    if (c.includes('instant') || c.includes('noodle')) return 'bg-[#ffedd5] text-[#c2410c]'; // Peach/Orange
    if (c.includes('care') || c.includes('soap')) return 'bg-[#dbeafe] text-[#2563eb]'; // Personal Care Blue
    if (c.includes('dairy') || c.includes('milk')) return 'bg-[#ede9fe] text-[#6d28d9]'; // Dairy Purple
    return 'bg-[#e2e8f0] text-[#334155]';
  };

  // Open Edit Modal
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setEditName(p.name);
    setEditBarcode(p.barcode);
    setEditCategory(p.category);
    setEditUnit(p.unit || 'Pcs');
    setEditCostPrice(p.costPrice || 0);
    setEditPrice(p.price || 0);
    setEditStock(p.stock || 0);
    setEditLowStock(p.lowStockAlert || 5);
    setEditImageUrl(p.imageUrl || '');
    setEditError(null);
  };

  // Save Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!editName.trim()) {
      setEditError('Product name is required.');
      return;
    }
    if (editCostPrice < 0 || editPrice <= 0) {
      setEditError('Please enter valid purchase and sale prices.');
      return;
    }

    const updated: Product = {
      ...editingProduct,
      name: editName.trim(),
      barcode: editBarcode.trim() || editingProduct.barcode,
      category: editCategory,
      unit: editUnit,
      costPrice: Number(editCostPrice),
      price: Number(editPrice),
      stock: Number(editStock),
      lowStockAlert: Number(editLowStock),
      imageUrl: editImageUrl || undefined,
    };

    onSaveProduct(updated);
    setEditingProduct(null);
  };

  // Handle Photo Gallery upload in Edit Modal
  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setEditImageUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Print function
  const handlePrintStockReport = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col w-full min-h-full bg-[#f8fafc] font-sans">
      {/* Universal Fullscreen Header with Back/Exit & Fullscreen Toggle */}
      <FullScreenPageHeader
        title="Total Stock & Products"
        urduTitle="ٹوٹل اسٹاک اور پراڈکٹس"
        icon={<Layers className="w-5 h-5 text-white" />}
        onBackToHome={() => {
          if (onBackToHome) onBackToHome();
          else if (onNavigateToPos) onNavigateToPos();
        }}
        badge={`${totalItems} Items`}
        actions={
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onOpenAddProduct}
              className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Product</span>
            </button>
            <button
              type="button"
              onClick={onOpenScanner}
              className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <ScanBarcode className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Scanner</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPrintReportOpen(true)}
              className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        }
      />

      <div className="flex-1 flex flex-col p-3 sm:p-5 lg:p-6 w-full gap-3 overflow-y-auto">
        {/* Top 3 Summary Cards */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#10b981] flex items-center justify-center shadow-md shadow-emerald-200 shrink-0">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#1e293b] tracking-tight">
                Total Stock Inventory
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Real-time store catalog, stock quantities, valuation & negative inventory tracking
              </p>
            </div>
          </div>

        {/* Right 3 Summary Cards matching Screenshot 4 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4 shrink-0">
          {/* Card 1: Total Items (Green) */}
          <div className="bg-[#00a86b] rounded-2xl p-2.5 sm:p-3 text-white flex items-center gap-2.5 sm:gap-3.5 shadow-sm min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <div>
              <span className="text-[10px] sm:text-xs font-semibold text-emerald-100 block">Total Items</span>
              <span className="text-lg sm:text-2xl font-black tracking-tight leading-none">
                {totalItems}
              </span>
            </div>
          </div>

          {/* Card 2: Total Quantity (Blue) */}
          <div className="bg-[#0284c7] rounded-2xl p-2.5 sm:p-3 text-white flex items-center gap-2.5 sm:gap-3.5 shadow-sm min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <span className="text-[10px] sm:text-xs font-semibold text-sky-100 block">Total Quantity</span>
              <span className="text-lg sm:text-2xl font-black tracking-tight leading-none">
                {totalQuantity.toLocaleString('en-PK')}
              </span>
            </div>
          </div>

          {/* Card 3: Total Value (Purple) */}
          <div className="bg-[#8b5cf6] rounded-2xl p-2.5 sm:p-3 text-white flex items-center gap-2.5 sm:gap-3.5 shadow-sm min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <span className="font-black text-sm sm:text-base">Rs</span>
            </div>
            <div>
              <span className="text-[10px] sm:text-xs font-semibold text-purple-100 block">Total Value</span>
              <span className="text-base sm:text-xl font-black tracking-tight leading-none">
                {formatRs(totalStockValue)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* WAQAS MART Dual Profile Cards (Software Owner & Mart Owner) */}
      <div className="mb-4">
        <WaqasBrandingCard variant="banner" />
      </div>

      {/* Negative Stock Warning Banner */}
      {negativeStockItems.length > 0 && (
        <div className="mb-4 bg-red-50 border-2 border-red-300 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-red-950">
                  Negative Stock Warning ({negativeStockItems.length} Products)
                </h4>
                <span className="text-[10px] bg-red-600 text-white font-black px-2 py-0.5 rounded-full">
                  منفی اسٹاک الرٹ
                </span>
              </div>
              <p className="text-xs text-red-800 mt-0.5">
                These items were sold while stock was 0 or less. When purchases arrive, stock balances will automatically adjust into positive numbers.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowNegativeStockOnly(!showNegativeStockOnly);
              setCurrentPage(1);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5 ${
              showNegativeStockOnly
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{showNegativeStockOnly ? 'Show All Products' : 'Filter Negative Stock Only'}</span>
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. FILTER & SEARCH BAR (MATCHING REFERENCE SCREENSHOT)          */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 mb-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search product by name, barcode or category..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          {/* Category Dropdown with Filter Icon */}
          <div className="relative flex-1 sm:flex-initial min-w-[150px]">
            <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700">
              <Filter className="w-4 h-4 text-[#00a86b] shrink-0" />
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-transparent focus:outline-none cursor-pointer text-slate-800 text-xs sm:text-sm"
              >
                <option value="All Categories">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Negative stock toggle button */}
          <button
            type="button"
            onClick={() => {
              setShowNegativeStockOnly(!showNegativeStockOnly);
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 border ${
              showNegativeStockOnly
                ? 'bg-red-600 text-white border-red-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title="Filter negative stock products"
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${showNegativeStockOnly ? 'text-white' : 'text-red-500'}`} />
            <span>Neg Stock ({negativeStockItems.length})</span>
          </button>

          {/* + Add Product Button matching screenshot */}
          <button
            onClick={onOpenAddProduct}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#00a86b] hover:bg-[#00925d] active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Product</span>
          </button>

          {/* All Delete Button across all pages with count confirmation */}
          {products.length > 0 && onDeleteAllProducts && (
            showConfirmDeleteAll ? (
              <div className="flex items-center gap-1.5 bg-red-50 p-1 rounded-xl border border-red-200">
                <span className="text-[11px] font-bold text-red-700">Delete all ({products.length})?</span>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteAllProducts();
                    setShowConfirmDeleteAll(false);
                  }}
                  className="px-2.5 py-1 text-xs font-black bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer shadow-2xs"
                >
                  Yes, Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmDeleteAll(false)}
                  className="px-2 py-1 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirmDeleteAll(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
                title="Delete all products across all pagination pages"
              >
                <Trash2 className="w-4 h-4" />
                <span>All Delete ({products.length})</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. STOCK TABLE (EXACT 10 COLUMNS & GREEN HEADER)               */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs flex-1 flex flex-col min-h-[360px] overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[760px]">
            {/* Solid Green Header matching screenshot */}
            <thead>
              <tr className="bg-[#00994d] text-white font-bold text-xs">
                <th className="py-3.5 px-3 text-center w-10">#</th>
                <th className="py-3.5 px-3 text-center w-16">Image</th>
                <th className="py-3.5 px-3 min-w-[140px]">Product Name</th>
                <th className="py-3.5 px-3 min-w-[110px]">Barcode</th>
                <th className="py-3.5 px-3 text-center min-w-[110px]">Category</th>
                <th className="py-3.5 px-3 text-center w-14">Qty</th>
                <th className="py-3.5 px-3 text-right min-w-[95px]">Purchase Price</th>
                <th className="py-3.5 px-3 text-right min-w-[90px]">Sale Price</th>
                <th className="py-3.5 px-3 text-right min-w-[100px]">Total Value</th>
                <th className="py-3.5 px-3 text-center w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No products found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {searchQuery || selectedCategory !== 'All Categories'
                        ? 'Try adjusting your search query or category filter'
                        : 'Click "+ Add Product" to register your store inventory'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product, index) => {
                  const rowNumber = startIndex + index + 1;
                  const itemTotalValue = (product.stock || 0) * (product.costPrice || 0);

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* 1. # */}
                      <td className="py-3 px-3 text-center text-slate-500 font-medium">
                        {rowNumber}
                      </td>

                      {/* 2. Image */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto relative shadow-2xs">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-slate-300" />
                          )}
                        </div>
                      </td>

                      {/* 3. Product Name */}
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        <div className="leading-tight">
                          <span>{product.name}</span>
                          {product.urduName && (
                            <span className="block text-[11px] text-slate-400 font-urdu mt-0.5">
                              {product.urduName}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Barcode */}
                      <td className="py-3 px-3 font-mono text-slate-600 text-xs">
                        {product.barcode}
                      </td>

                      {/* 5. Category (Pill badge matching screenshot) */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-md text-[11px] font-bold ${getCategoryBadgeClass(
                            product.category
                          )}`}
                        >
                          {product.category}
                        </span>
                      </td>

                      {/* 6. Qty */}
                      <td className="py-3 px-3 text-center">
                        {product.stock < 0 ? (
                          <span className="inline-flex items-center gap-1 font-black text-red-700 bg-red-100 border border-red-300 px-2 py-0.5 rounded-full text-xs shadow-2xs">
                            <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
                            <span>{product.stock} (Negative)</span>
                          </span>
                        ) : (
                          <span
                            className={`font-black ${
                              product.stock === 0
                                ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md'
                                : product.stock <= (product.lowStockAlert || 5)
                                ? 'text-amber-600 font-black'
                                : 'text-slate-800'
                            }`}
                          >
                            {product.stock}
                          </span>
                        )}
                      </td>

                      {/* 7. Purchase Price */}
                      <td className="py-3 px-3 text-right font-semibold text-slate-700">
                        {product.costPrice}
                      </td>

                      {/* 8. Sale Price */}
                      <td className="py-3 px-3 text-right font-semibold text-slate-700">
                        {product.price}
                      </td>

                      {/* 9. Total Value */}
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {itemTotalValue.toLocaleString('en-PK')}
                      </td>

                      {/* 10. Action (Green Edit + Red Delete) */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Green Edit Icon Button matching screenshot */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(product)}
                            className="w-7 h-7 rounded-lg bg-[#00a86b] hover:bg-[#00925d] text-white flex items-center justify-center transition-all shadow-2xs active:scale-90 cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Red Delete Icon Button matching screenshot */}
                          <button
                            type="button"
                            onClick={() => setProductToDelete(product)}
                            className="w-7 h-7 rounded-lg bg-[#ef4444] hover:bg-[#dc2626] text-white flex items-center justify-center transition-all shadow-2xs active:scale-90 cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ============================================================== */}
        {/* 4. PAGINATION ROW (MATCHING REFERENCE SCREENSHOT)              */}
        {/* ============================================================== */}
        <div className="px-4 py-3 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-slate-500 font-medium">
            Showing{' '}
            <span className="font-bold text-slate-800">
              {filteredProducts.length === 0 ? 0 : startIndex + 1}
            </span>{' '}
            to{' '}
            <span className="font-bold text-slate-800">
              {Math.min(startIndex + itemsPerPage, filteredProducts.length)}
            </span>{' '}
            of{' '}
            <span className="font-bold text-slate-800">
              {filteredProducts.length}
            </span>{' '}
            products
          </p>

          {/* Page Pills: < [1] [2] [3] > */}
          <div className="flex items-center gap-1">
            <button
              disabled={currentSafePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-7 h-7 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-xs font-bold"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNum = i + 1;
              const isActive = pageNum === currentSafePage;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#00994d] text-white shadow-xs'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              disabled={currentSafePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="w-7 h-7 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-xs font-bold"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. BOTTOM 4 ACTION BUTTONS (MATCHING REFERENCE SCREENSHOT)     */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 mt-4">
        {/* 1. Green Button: Scan Barcode */}
        <button
          onClick={onOpenScanner}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#00a86b] hover:bg-[#00925d] active:scale-98 text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
        >
          <ScanBarcode className="w-5 h-5 stroke-[2.2]" />
          <span>Scan Barcode</span>
        </button>

        {/* 2. Blue Button: + Add Product */}
        <button
          onClick={onOpenAddProduct}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] active:scale-98 text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>Add Product</span>
        </button>

        {/* 3. Purple Button: View Details */}
        <button
          onClick={() => setIsViewDetailsOpen(true)}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] active:scale-98 text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
        >
          <Eye className="w-5 h-5 stroke-[2]" />
          <span>View Details</span>
        </button>

        {/* 4. Orange/Amber Button: Print Report */}
        <button
          onClick={() => setIsPrintReportOpen(true)}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#f59e0b] hover:bg-[#d97706] active:scale-98 text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
        >
          <Printer className="w-5 h-5 stroke-[2]" />
          <span>Print Report</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 6. EDIT PRODUCT MODAL (COMPLETE WITH PHOTO, PRICES & STOCK)     */}
      {/* ============================================================== */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden my-6">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#00994d] to-[#00a86b] px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Edit2 className="w-5 h-5" />
                <h3 className="font-bold text-base">Edit Product Stock & Pricing</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              {editError && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Photo preview & upload */}
              <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  {editImageUrl ? (
                    <img src={editImageUrl} alt="Product" className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-8 h-8 text-slate-300" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-700 mb-1.5">Product Photo</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGalleryClick}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>Upload Photo</span>
                    </button>
                    {editImageUrl && (
                      <button
                        type="button"
                        onClick={() => setEditImageUrl('')}
                        className="px-2 py-1.5 text-xs text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  required
                />
              </div>

              {/* Barcode & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Barcode
                  </label>
                  <input
                    type="text"
                    value={editBarcode}
                    onChange={(e) => setEditBarcode(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Unit, Purchase Price & Sale Price */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
                  <select
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 bg-white"
                  >
                    <option value="Pcs">Pcs</option>
                    <option value="Pack">Pack</option>
                    <option value="Bottle">Bottle</option>
                    <option value="Kg">Kg</option>
                    <option value="Liter">Liter</option>
                    <option value="Box">Box</option>
                    <option value="Dozen">Dozen</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Purchase Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editCostPrice}
                    onChange={(e) => setEditCostPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-bold text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sale Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-bold text-emerald-700"
                    required
                  />
                </div>
              </div>

              {/* Current Stock & Low Stock Alert */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                <div>
                  <label className="block text-xs font-bold text-emerald-900 mb-1">
                    Current Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editStock}
                    onChange={(e) => setEditStock(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-black text-emerald-900 bg-white"
                  />
                  <span className="text-[10px] text-emerald-700 font-medium block mt-1">
                    Direct stock inventory count
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-900 mb-1">
                    Low Stock Alert Limit
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editLowStock}
                    onChange={(e) => setEditLowStock(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-bold text-slate-800 bg-white"
                  />
                  <span className="text-[10px] text-emerald-700 font-medium block mt-1">
                    Notify cashier when stock drops below
                  </span>
                </div>
              </div>

              {/* Total Stock Value Calculation */}
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900">Calculated Stock Value:</span>
                <span className="text-sm font-black text-purple-700">
                  {formatRs(editStock * editCostPrice)}
                </span>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00994d] hover:bg-[#008040] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Update Stock Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. VIEW DETAILS MODAL (COMPREHENSIVE STOCK ANALYTICS)           */}
      {/* ============================================================== */}
      {isViewDetailsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[90vh] flex flex-col">
            <div className="bg-[#7c3aed] px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Eye className="w-5 h-5" />
                <h3 className="font-bold text-base">Waqas Mart — Detailed Stock Audit</h3>
              </div>
              <button
                onClick={() => setIsViewDetailsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-slate-800">
              {/* Financial Valuation Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <span className="text-[11px] font-bold text-emerald-800 block">Total SKUs</span>
                  <span className="text-xl font-black text-emerald-900">{totalItems}</span>
                </div>
                <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
                  <span className="text-[11px] font-bold text-blue-800 block">Total Units</span>
                  <span className="text-xl font-black text-blue-900">{totalQuantity.toLocaleString()}</span>
                </div>
                <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100">
                  <span className="text-[11px] font-bold text-purple-800 block">Purchase Cost</span>
                  <span className="text-base font-black text-purple-900">{formatRs(totalStockValue)}</span>
                </div>
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100">
                  <span className="text-[11px] font-bold text-amber-800 block">Retail Value</span>
                  <span className="text-base font-black text-amber-900">{formatRs(totalRetailValue)}</span>
                </div>
              </div>

              {/* Profit potential */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 block">Total Potential Gross Profit</span>
                  <span className="text-lg font-black text-emerald-700">
                    {formatRs(Math.max(0, totalRetailValue - totalStockValue))}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-500 block">Average Markup Margin</span>
                  <span className="text-sm font-black text-slate-800">
                    {totalStockValue > 0
                      ? `${Math.round(((totalRetailValue - totalStockValue) / totalStockValue) * 100)}%`
                      : '0%'}
                  </span>
                </div>
              </div>

              {/* Alerts summary: Low Stock & Out of Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Out of Stock */}
                <div className="p-3.5 bg-red-50/60 rounded-2xl border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-red-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span>Out of Stock Items ({outOfStockItems.length})</span>
                    </span>
                  </div>
                  {outOfStockItems.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No products are completely out of stock.</p>
                  ) : (
                    <ul className="text-xs space-y-1 max-h-36 overflow-y-auto">
                      {outOfStockItems.map((p) => (
                        <li key={p.id} className="flex justify-between font-medium text-slate-700">
                          <span>{p.name}</span>
                          <span className="font-bold text-red-600">0 {p.unit}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Low Stock Warning */}
                <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Low Stock Alerts ({lowStockItems.length})</span>
                    </span>
                  </div>
                  {lowStockItems.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No items are below low-stock limit.</p>
                  ) : (
                    <ul className="text-xs space-y-1 max-h-36 overflow-y-auto">
                      {lowStockItems.map((p) => (
                        <li key={p.id} className="flex justify-between font-medium text-slate-700">
                          <span>{p.name}</span>
                          <span className="font-bold text-amber-700">{p.stock} {p.unit}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setIsViewDetailsOpen(false)}
                className="px-5 py-2 bg-slate-800 text-white font-bold text-xs rounded-xl hover:bg-slate-900 cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. PRINT REPORT MODAL (BEAUTIFUL A4 INVENTORY AUDIT SHEET)      */}
      {/* ============================================================== */}
      {isPrintReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[92vh] flex flex-col">
            <div className="bg-[#f59e0b] px-5 py-4 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2.5">
                <Printer className="w-5 h-5" />
                <h3 className="font-bold text-base">Print Stock Valuation & Audit Report</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintStockReport}
                  className="px-4 py-1.5 bg-white text-amber-900 font-bold text-xs rounded-xl hover:bg-amber-50 shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setIsPrintReportOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Report Paper */}
            <div className="p-6 overflow-y-auto flex-1 bg-white text-slate-900 font-sans print:p-0">
              {/* Report Header */}
              <div className="border-b-2 border-slate-900 pb-4 mb-4 text-center">
                <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                  WAQAS MART — SUPERMARKET
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Official Total Stock Inventory Valuation & Audit Statement
                </p>
                <div className="flex justify-between items-center text-xs text-slate-600 mt-3 pt-2 border-t border-dashed border-slate-200">
                  <span>
                    Report Date: <strong>{new Date().toLocaleDateString('en-GB')}</strong> ({new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true })})
                  </span>
                  <span>
                    Filter: <strong>{selectedCategory}</strong>
                  </span>
                  <span>
                    Auditor / Cashier: <strong>Counter 01</strong>
                  </span>
                </div>
              </div>

              {/* Summary Metrics Box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Products</span>
                  <span className="text-lg font-black text-slate-900">{filteredProducts.length}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Physical Qty</span>
                  <span className="text-lg font-black text-blue-700">
                    {filteredProducts.reduce((acc, p) => acc + (p.stock || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Stock Valuation</span>
                  <span className="text-lg font-black text-[#00994d]">
                    {formatRs(
                      filteredProducts.reduce((acc, p) => acc + ((p.stock || 0) * (p.costPrice || 0)), 0)
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-red-500 block">Negative Stock Items</span>
                  <span className="text-lg font-black text-red-600">
                    {negativeStockItems.length}
                  </span>
                </div>
              </div>

              {/* Table of products */}
              <table className="w-full text-left text-xs border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b border-slate-200 text-slate-800">
                    <th className="p-2 border border-slate-200 text-center w-8">#</th>
                    <th className="p-2 border border-slate-200">Product Name</th>
                    <th className="p-2 border border-slate-200">Barcode</th>
                    <th className="p-2 border border-slate-200">Category</th>
                    <th className="p-2 border border-slate-200 text-center">Unit</th>
                    <th className="p-2 border border-slate-200 text-center">Current Qty</th>
                    <th className="p-2 border border-slate-200 text-center">Status</th>
                    <th className="p-2 border border-slate-200 text-right">Cost</th>
                    <th className="p-2 border border-slate-200 text-right">Retail</th>
                    <th className="p-2 border border-slate-200 text-right">Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p, idx) => (
                    <tr key={p.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="p-2 border border-slate-200 text-center text-slate-500">{idx + 1}</td>
                      <td className="p-2 border border-slate-200 font-semibold">{p.name}</td>
                      <td className="p-2 border border-slate-200 font-mono text-[11px] text-slate-600">{p.barcode}</td>
                      <td className="p-2 border border-slate-200">{p.category}</td>
                      <td className="p-2 border border-slate-200 text-center">{p.unit || 'Pcs'}</td>
                      <td className={`p-2 border border-slate-200 text-center font-bold ${p.stock < 0 ? 'text-red-600 font-black' : ''}`}>
                        {p.stock}
                      </td>
                      <td className="p-2 border border-slate-200 text-center text-[10px]">
                        {p.stock < 0 ? (
                          <span className="font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">Negative</span>
                        ) : p.stock === 0 ? (
                          <span className="font-bold text-rose-600">Out of Stock</span>
                        ) : (
                          <span className="text-emerald-700 font-medium">In Stock</span>
                        )}
                      </td>
                      <td className="p-2 border border-slate-200 text-right">{p.costPrice}</td>
                      <td className="p-2 border border-slate-200 text-right">{p.price}</td>
                      <td className="p-2 border border-slate-200 text-right font-black text-slate-900">
                        {((p.stock || 0) * (p.costPrice || 0)).toLocaleString('en-PK')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Signatures */}
              <div className="mt-8 pt-8 border-t border-dashed border-slate-300 flex justify-between text-xs text-slate-600">
                <div className="text-center w-40">
                  <div className="border-b border-slate-400 mb-1 h-8"></div>
                  <span>Store Manager Sign</span>
                </div>
                <div className="text-center w-40">
                  <div className="border-b border-slate-400 mb-1 h-8"></div>
                  <span>Stock Auditor Sign</span>
                </div>
                <div className="text-center w-40">
                  <div className="border-b border-slate-400 mb-1 h-8"></div>
                  <span>Owner Stamp</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Single Product Delete In-UI Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl border border-red-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-sm">Delete Product?</h4>
                <p className="text-[11px] text-slate-400 font-medium">یہ عمل واپس نہیں ہو سکتا</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
              Are you sure you want to permanently delete <strong>"{productToDelete.name}"</strong> (Barcode: {productToDelete.barcode}) from Total Stock?
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel (منسوخ)
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteProduct(productToDelete.id);
                  setProductToDelete(null);
                }}
                className="px-4 py-2 text-xs font-black bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm cursor-pointer"
              >
                Yes, Delete (ڈیلیٹ کریں)
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

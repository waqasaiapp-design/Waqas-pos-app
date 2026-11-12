import React, { useState } from 'react';
import { Product } from '../types/pos';

interface ProductGraphicProps {
  product: Product;
  className?: string;
}

export const ProductGraphic: React.FC<ProductGraphicProps> = ({ product, className = 'w-full h-full' }) => {
  const [imageError, setImageError] = useState(false);
  const name = product.name.toLowerCase();

  // If valid image URL and no error, render the image
  if (product.imageUrl && !imageError) {
    return (
      <img
        src={product.imageUrl}
        alt={product.name}
        className={`${className} object-contain`}
        onError={() => setImageError(true)}
        loading="lazy"
      />
    );
  }

  // Built-in crisp, realistic, colorful SVG vector illustrations matching reference screenshot!
  if (name.includes('coca cola') || name.includes('coke')) {
    return (
      <svg viewBox="0 0 100 140" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Coca Cola Bottle */}
        <rect x="42" y="6" width="16" height="12" rx="3" fill="#dc2626" />
        <path d="M43 18 L57 18 L54 34 L46 34 Z" fill="#b91c1c" opacity="0.6" />
        {/* Bottle Body */}
        <path
          d="M45 34 C36 45 32 55 34 85 C36 112 40 128 42 134 C43 136 57 136 58 134 C60 128 64 112 66 85 C68 55 64 45 55 34 Z"
          fill="#1c1917"
        />
        {/* Red Label */}
        <path d="M34 68 C34 68 40 64 50 64 C60 64 66 68 66 68 L65 92 C65 92 59 96 50 96 C41 96 35 92 35 92 Z" fill="#dc2626" />
        <text x="50" y="83" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle" fontStyle="italic" fontFamily="sans-serif">
          Coca-Cola
        </text>
        {/* Highlight sheen */}
        <path d="M38 52 C37 70 38 100 42 124" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
      </svg>
    );
  }

  if (name.includes('pepsi')) {
    return (
      <svg viewBox="0 0 100 140" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Pepsi Blue Bottle Cap */}
        <rect x="42" y="6" width="16" height="12" rx="3" fill="#0284c7" />
        {/* Bottle Body */}
        <path
          d="M45 32 C36 44 32 56 34 86 C36 112 40 128 42 134 C43 136 57 136 58 134 C60 128 64 112 66 86 C68 56 64 44 55 32 Z"
          fill="#0c192c"
        />
        {/* Pepsi Globe Logo on Label */}
        <rect x="34" y="66" width="32" height="28" rx="4" fill="#0284c7" />
        <circle cx="50" cy="80" r="10" fill="#ffffff" />
        <path d="M40 80 A10 10 0 0 1 60 80 Q55 75 50 78 Q45 81 40 80 Z" fill="#dc2626" />
        <path d="M40 80 A10 10 0 0 0 60 80 Q55 85 50 82 Q45 79 40 80 Z" fill="#0284c7" />
        {/* Sheen */}
        <path d="M38 50 C37 70 38 100 42 124" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />
      </svg>
    );
  }

  if (name.includes('nestle milk') || name.includes('milk')) {
    return (
      <svg viewBox="0 0 100 130" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Milk Carton Pack */}
        <path d="M30 36 L50 20 L70 36 L70 122 L30 122 Z" fill="#0284c7" />
        <path d="M30 36 L50 20 L50 122 L30 122 Z" fill="#0369a1" />
        <path d="M50 20 L70 36 L70 122 L50 122 Z" fill="#0284c7" />
        {/* White milk wave */}
        <path d="M30 70 Q50 85 70 70 L70 122 L30 122 Z" fill="#ffffff" />
        <text x="50" y="54" fill="#ffffff" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
          Nestle
        </text>
        <text x="50" y="64" fill="#ffffff" fontSize="9" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
          MILKPAK
        </text>
        {/* Milk Splash */}
        <circle cx="50" cy="95" r="7" fill="#0284c7" opacity="0.15" />
        <text x="50" y="104" fill="#0369a1" fontSize="8" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
          1 Litre
        </text>
      </svg>
    );
  }

  if (name.includes("lay's") || name.includes('lays')) {
    const isClassic = name.includes('classic') || name.includes('50g');
    return (
      <svg viewBox="0 0 110 130" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Lay's Yellow Chip Bag */}
        <path
          d="M24 22 C34 16 76 16 86 22 C92 48 94 88 88 116 C76 122 34 122 22 116 C16 88 18 48 24 22 Z"
          fill={isClassic ? '#eab308' : '#facc15'}
        />
        {/* Top & Bottom Crimp lines */}
        <path d="M24 22 L86 22" stroke="#ca8a04" strokeWidth="2" strokeDasharray="3 2" />
        <path d="M22 116 L88 116" stroke="#ca8a04" strokeWidth="2" strokeDasharray="3 2" />
        {/* Lay's Red & Yellow Sun Logo */}
        <circle cx="55" cy="62" r="18" fill="#dc2626" />
        <circle cx="55" cy="62" r="13" fill="#facc15" />
        <rect x="36" y="57" width="38" height="11" rx="4" fill="#dc2626" />
        <text x="55" y="65" fill="#ffffff" fontSize="8" fontWeight="900" textAnchor="middle" fontStyle="italic" fontFamily="sans-serif">
          Lay's
        </text>
        {isClassic ? (
          <text x="55" y="86" fill="#854d0e" fontSize="7" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
            Classic 50g
          </text>
        ) : (
          <text x="55" y="86" fill="#854d0e" fontSize="7" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
            Potato Chips
          </text>
        )}
      </svg>
    );
  }

  if (name.includes('dalda') || name.includes('oil')) {
    return (
      <svg viewBox="0 0 110 130" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Dalda Oil Tin Container */}
        <rect x="28" y="24" width="54" height="96" rx="10" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
        {/* Handle */}
        <path d="M42 24 C42 14 68 14 68 24" stroke="#ca8a04" strokeWidth="4" strokeLinecap="round" />
        <circle cx="70" cy="34" r="5" fill="#dc2626" />
        {/* Red Dalda Oval Badge */}
        <ellipse cx="55" cy="66" rx="20" ry="15" fill="#dc2626" />
        <text x="55" y="70" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
          Dalda
        </text>
        {/* Green plant leaf */}
        <path d="M55 46 C50 40 45 46 55 52 C65 46 60 40 55 46 Z" fill="#16a34a" />
        <text x="55" y="98" fill="#15803d" fontSize="7" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
          COOKING OIL 5L
        </text>
      </svg>
    );
  }

  if (name.includes('sugar')) {
    return (
      <svg viewBox="0 0 100 130" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Sugar Bag Pouch */}
        <path
          d="M26 30 C34 24 66 24 74 30 C80 50 82 95 76 118 C64 124 36 124 24 118 C18 95 20 50 26 30 Z"
          fill="#f8fafc"
          stroke="#cbd5e1"
          strokeWidth="2"
        />
        {/* Sugar Label */}
        <rect x="34" y="60" width="32" height="24" rx="4" fill="#0284c7" opacity="0.1" />
        <text x="50" y="72" fill="#0369a1" fontSize="9" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
          SUGAR
        </text>
        <text x="50" y="82" fill="#64748b" fontSize="7" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">
          چینی 1kg
        </text>
        {/* Sparkles */}
        <circle cx="40" cy="48" r="1.5" fill="#38bdf8" />
        <circle cx="60" cy="46" r="1.5" fill="#38bdf8" />
      </svg>
    );
  }

  if (name.includes('flour') || name.includes('atta')) {
    return (
      <svg viewBox="0 0 100 130" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* 10kg Flour Sack */}
        <path
          d="M24 26 C36 20 64 20 76 26 C82 52 84 94 78 120 C64 126 36 126 22 120 C16 94 18 52 24 26 Z"
          fill="#fef2f2"
          stroke="#fca5a5"
          strokeWidth="2"
        />
        <rect x="32" y="54" width="36" height="32" rx="4" fill="#dc2626" />
        <text x="50" y="68" fill="#ffffff" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
          FLOUR
        </text>
        <text x="50" y="78" fill="#fef2f2" fontSize="7" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
          آٹا 10kg
        </text>
      </svg>
    );
  }

  if (name.includes('yogurt') || name.includes('dahi')) {
    return (
      <svg viewBox="0 0 100 130" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Blue Nestle Yogurt Tub */}
        <ellipse cx="50" cy="38" rx="30" ry="10" fill="#0284c7" />
        <path d="M20 38 L30 114 Q50 120 70 114 L80 38 Z" fill="#0369a1" />
        <ellipse cx="50" cy="38" rx="28" ry="8" fill="#ffffff" />
        <text x="50" y="68" fill="#ffffff" fontSize="8" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
          Nestle
        </text>
        <text x="50" y="80" fill="#bae6fd" fontSize="9" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
          YOGURT
        </text>
        <text x="50" y="94" fill="#ffffff" fontSize="7" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">
          1 KG
        </text>
      </svg>
    );
  }

  if (name.includes('tea') || name.includes('chai')) {
    return (
      <svg viewBox="0 0 100 130" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Red & Gold Tata Tea Pack */}
        <rect x="25" y="24" width="50" height="92" rx="6" fill="#dc2626" stroke="#b91c1c" strokeWidth="2" />
        <rect x="30" y="44" width="40" height="48" rx="4" fill="#15803d" />
        <circle cx="50" cy="62" r="10" fill="#eab308" />
        <text x="50" y="65" fill="#1e293b" fontSize="7" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
          TEA
        </text>
        <text x="50" y="82" fill="#ffffff" fontSize="8" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
          250g
        </text>
      </svg>
    );
  }

  if (name.includes('onion')) {
    return (
      <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Red Onion */}
        <circle cx="50" cy="65" r="28" fill="#9d174d" />
        <path d="M50 37 Q52 24 50 18 Q48 24 50 37" stroke="#15803d" strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="44" cy="58" rx="14" ry="18" fill="#be185d" opacity="0.6" />
        <path d="M34 65 Q50 90 66 65" stroke="#fbcfe8" strokeWidth="2" opacity="0.4" />
      </svg>
    );
  }

  if (name.includes('tomato')) {
    return (
      <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Ripe Red Tomato */}
        <circle cx="50" cy="66" r="28" fill="#ef4444" />
        <ellipse cx="42" cy="58" rx="8" ry="12" fill="#ffffff" opacity="0.25" />
        {/* Green star stem */}
        <path d="M50 38 L45 32 M50 38 L55 32 M50 38 L42 42 M50 38 L58 42 M50 38 L50 26" stroke="#16a34a" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (name.includes('potato')) {
    return (
      <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Golden Potato */}
        <ellipse cx="50" cy="65" rx="30" ry="22" fill="#d97706" />
        <ellipse cx="48" cy="63" rx="26" ry="18" fill="#f59e0b" opacity="0.7" />
        {/* Spots */}
        <circle cx="38" cy="58" r="1.5" fill="#78350f" opacity="0.6" />
        <circle cx="58" cy="68" r="2" fill="#78350f" opacity="0.6" />
        <circle cx="48" cy="74" r="1.5" fill="#78350f" opacity="0.6" />
      </svg>
    );
  }

  if (name.includes('banana')) {
    return (
      <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Yellow Bananas Bunch */}
        <path d="M30 30 C45 35 68 55 64 92 C56 70 40 48 30 30 Z" fill="#eab308" />
        <path d="M38 28 C55 35 78 55 74 96 C66 74 48 48 38 28 Z" fill="#facc15" />
        <path d="M30 30 L38 28" stroke="#15803d" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  if (name.includes('egg')) {
    return (
      <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Clean Eggs Tray */}
        <rect x="22" y="70" width="56" height="30" rx="8" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2" />
        <ellipse cx="36" cy="62" rx="10" ry="14" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
        <ellipse cx="50" cy="60" rx="10" ry="14" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
        <ellipse cx="64" cy="62" rx="10" ry="14" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
      </svg>
    );
  }

  // Category-based high-quality graphic fallbacks
  const cat = (product.category || '').toLowerCase();
  if (cat.includes('beverage') || cat.includes('drink')) {
    return (
      <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="38" y="16" width="24" height="12" rx="4" fill="#0284c7" />
        <path d="M42 28 L58 28 L62 108 L38 108 Z" fill="#38bdf8" />
        <rect x="36" y="52" width="28" height="34" rx="4" fill="#0284c7" />
        <text x="50" y="73" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle">{product.name.slice(0, 5)}</text>
      </svg>
    );
  }

  if (cat.includes('snack') || cat.includes('biscuit') || cat.includes('chip')) {
    return (
      <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="25" y="24" width="50" height="74" rx="8" fill="#8b5cf6" />
        <path d="M25 24 L75 24" stroke="#7c3aed" strokeWidth="3" strokeDasharray="3 2" />
        <circle cx="50" cy="56" r="16" fill="#facc15" />
        <text x="50" y="60" fill="#7c3aed" fontSize="10" fontWeight="900" textAnchor="middle">{product.name.slice(0, 4)}</text>
      </svg>
    );
  }

  if (cat.includes('fruit') || cat.includes('vegetable')) {
    return (
      <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="65" r="28" fill="#ef4444" />
        <path d="M50 37 C50 28 56 25 60 25" stroke="#15803d" strokeWidth="4" strokeLinecap="round" />
        <text x="50" y="70" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle">{product.name.slice(0, 4)}</text>
      </svg>
    );
  }

  // Default vibrant grocery badge
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/60 text-emerald-800 rounded-2xl p-2 shadow-xs">
      <span className="text-2xl font-black">{product.name.charAt(0).toUpperCase()}</span>
      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mt-1 line-clamp-1">{product.category || 'Product'}</span>
    </div>
  );
};

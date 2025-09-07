
import React, { useState } from "react";
import { Link } from "react-router-dom";
import PriceDisplay from "./PriceDisplay";

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function ProductCard({ product, onAddToCart, onCardClick, disableLink, productIndex, inCartQty = 0 }) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);


  // Use product.image, or fallback to first image in images[]
  const getImageSrc = (img) => {
    if (!img) return '';
    if (typeof img === 'string') {
      const trimmed = img.trim();
      if (trimmed.startsWith('/uploads') || trimmed.startsWith('uploads')) {
        return `${API}${trimmed.startsWith('/') ? trimmed : '/' + trimmed}`;
      }
      if (!trimmed.startsWith('http') && !trimmed.startsWith('/')) {
        return `${API}/uploads/${trimmed}`;
      }
      if (trimmed.startsWith('http')) {
        return trimmed;
      }
    }
    return img;
  };

  // Pick image: prefer watermarked (-wm_) in images[], else product.image, else first valid in images[]
  let mainImage = '';
  if (Array.isArray(product.images) && product.images.length > 0) {
    // 1. Вземи първата снимка с -wm_ (воден знак)
    const wm = product.images.find(img => typeof img === 'string' && img.includes('-wm_'));
    if (wm) mainImage = wm;
    else {
      // 2. Ако няма, вземи първата непразна
      const found = product.images.find(img => typeof img === 'string' && img.trim());
      if (found) mainImage = found;
    }
  }
  // 3. Ако няма images[] или нищо не е избрано, вземи product.image
  if (!mainImage && product.image && typeof product.image === 'string' && product.image.trim()) {
    mainImage = product.image;
  }

  const handleAddToCart = async () => {
    setIsLoading(true);
    if (onAddToCart) {
      await onAddToCart(product);
    }
    setIsLoading(false);
  };

  return (
    <div
  className="bg-white dark:bg-gray-800 p-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col group border border-gray-200 dark:border-gray-700 h-[280px] min-h-[280px] max-h-[280px] cursor-pointer"
      onClick={onCardClick}
      tabIndex={0}
      role="button"
      aria-label={product.name}
    >
      {!imageError && mainImage ? (
        <img
          src={getImageSrc(mainImage)}
          alt={product.name}
          className="w-full h-28 object-cover transition-transform duration-300 group-hover:scale-105 mb-2 rounded-lg"
          onError={() => setImageError(true)}
          loading="lazy"
        />
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center rounded-lg mb-4">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <p className="text-sm">Няма снимка</p>
          </div>
        </div>
      )}
      <div className="flex items-center gap-1 mb-1">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">{product.name}</h2>
      </div>
  {/* махаме описанието под снимката */}
      <div className="flex flex-row items-center justify-between mt-2 gap-2 w-full">
        <button
          onClick={(e) => { e.stopPropagation(); onAddToCart && onAddToCart(); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-lg transition-colors text-[11px] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ minWidth: '54px' }}
          disabled={!product.stockQuantity || product.stockQuantity <= 0 || inCartQty >= product.stockQuantity}
        >
          {(!product.stockQuantity || product.stockQuantity <= 0)
            ? 'Изчерпан'
            : (inCartQty >= product.stockQuantity ? `Макс. в количката` : 'Добави')}
        </button>
  <PriceDisplay price={product.price} priceEUR={product.priceEUR} className="!mb-0 mx-2 flex-1 text-center" onEuroClick={e => e.stopPropagation()} />
  {/* Премахнат жълтият бутон/текст за евро цена */}
      </div>
    </div>
  );

}

export default React.memo(ProductCard);

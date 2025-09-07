import React, { useState } from "react";

export default function PriceDisplay({ price, priceEUR, originalPrice, originalPriceEUR, className = "" }) {
  const [showEUR, setShowEUR] = useState(false);

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('bg-BG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatPriceEUR = (amount) => {
    return new Intl.NumberFormat('en-EU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  // Ако липсва priceEUR, изчисли го динамично
  const safePriceEUR = (typeof priceEUR === 'number' && !isNaN(priceEUR))
    ? priceEUR
    : (typeof price === 'number' && !isNaN(price))
      ? Math.round((price / 1.95583) * 100) / 100
      : 0;
  const safeOriginalPriceEUR = (typeof originalPriceEUR === 'number' && !isNaN(originalPriceEUR))
    ? originalPriceEUR
    : (typeof originalPrice === 'number' && !isNaN(originalPrice))
      ? Math.round((originalPrice / 1.95583) * 100) / 100
      : 0;

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center space-x-2">
        {/* Main Price */}
        <div className="flex items-center space-x-1">
          {originalPrice && originalPrice > price && (
            <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
              {showEUR ? `€${formatPriceEUR(safeOriginalPriceEUR)}` : `${formatPrice(originalPrice)} лв.`}
            </span>
          )}
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {showEUR ? `€${formatPriceEUR(safePriceEUR)}` : `${formatPrice(price)} лв.`}
          </span>
        </div>
        {/* Currency Toggle */}
        <button
          onClick={e => { e.stopPropagation(); setShowEUR(!showEUR); }}
          className="flex items-center space-x-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-2 py-1 rounded-md transition-colors"
          title={showEUR ? "Покажи в лева" : "Покажи в евро"}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <span>{showEUR ? 'BGN' : 'EUR'}</span>
        </button>
      </div>
    </div>
  );
}

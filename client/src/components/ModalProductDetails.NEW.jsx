// (file deleted)
import React from "react";
import PriceDisplay from "../components/PriceDisplay";

// You may need to import Helmet or other dependencies if used
// import { Helmet } from "react-helmet";

const ModalProductDetails = ({
  product,
  loading,
  error,
  mainImage,
  allImages = [],
  goToPrev,
  goToNext,
  goToIdx,
  resolveSrc,
  zoomedImage,
  setZoomedImage,
  addToCart,
  setIsOpen,
  setCartError,
  cartError,
  toggleFavorite,
  favLoading,
  user,
  onClose,
  handleBackdropClick,
  modalRef
}) => {
  const handleAddToCart = () => {
    try {
      addToCart(product, 1);
      setIsOpen?.(true);
      setCartError("");
    } catch {
      setCartError("Възникна грешка при добавяне в кошницата.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={handleBackdropClick} style={{ cursor: "pointer" }}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        className="w-full mx-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 md:p-5 mt-2 relative overflow-y-auto max-h-screen"
        style={{ wordBreak: "break-word", cursor: "auto", maxWidth: "1800px", minHeight: "600px" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Product name and favorite button */}
        {product && (
          <div className="flex items-center gap-2 mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{product.name}</h1>
            <button
              onClick={toggleFavorite}
              disabled={favLoading || !user}
              title={product.isFavorite ? "Премахни от любими" : "Добави в любими"}
              className={`text-2xl transition-colors z-10 ${product.isFavorite ? "text-red-500" : "text-gray-400 hover:text-red-500"}`}
              style={{ marginLeft: 8 }}
            >
              <span role="img" aria-label="favorite">{product.isFavorite ? "❤️" : "🤍"}</span>
            </button>
          </div>
        )}
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-600 text-4xl font-extrabold z-50 focus:outline-none focus:ring-2 focus:ring-red-400"
          aria-label="Затвори"
          style={{
            lineHeight: 1,
            width: 48,
            height: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 24,
            background: "rgba(255,255,255,0.85)",
          }}
        >
          ×
        </button>
        {/* Action buttons bottom row */}
        <div className="fixed bottom-8 right-8 z-50 flex gap-4">
          <button
            onClick={onClose}
            className="bg-red-600 text-white hover:bg-red-700 px-8 py-3 rounded-xl shadow-lg text-lg font-semibold transition-colors"
          >
            Отказ
          </button>
          <button
            className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-3 rounded-xl shadow-lg text-lg font-semibold transition-colors"
            onClick={handleAddToCart}
          >
            Добави в кошницата
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center items-center min-h-[16rem]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-500">{error}</div>
        ) : !product ? (
          <div className="text-center py-16 text-gray-500">Продуктът не е намерен</div>
        ) : (
          <div className="flex flex-col md:flex-row gap-16 max-w-[1600px] w-full mx-auto min-h-[800px]">
            {/* Gallery */}
            <div className="w-full md:w-8/12 flex flex-col items-center">
              {mainImage && <>
                <div className="w-full text-center font-extrabold text-lg tracking-widest text-blue-700 dark:text-blue-200 mb-1 select-none">
                  MARK LIGHT LTD
                </div>
                <div className="relative w-full max-w-3xl h-[600px] flex items-center justify-center mb-6">
                  <button
                    onClick={goToPrev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-700/80 rounded-full p-2 shadow-lg z-10 hover:bg-blue-100 dark:hover:bg-blue-900 disabled:opacity-50"
                    style={{ fontSize: 28 }}
                    aria-label="Предишна снимка"
                    disabled={allImages.length < 2}
                  >
                    &#8592;
                  </button>
                  <img
                    src={resolveSrc(mainImage)}
                    alt={product.name}
                    style={{ borderRadius: 20, objectFit: 'contain', width: '100%', height: '100%', display: 'block', background: '#f3f4f6', cursor: 'zoom-in' }}
                    onClick={() => setZoomedImage(resolveSrc(mainImage))}
                    onError={e => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/api/placeholder/1000/600";
                    }}
                  />
                  <button
                    className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-3 rounded-xl shadow-lg text-lg font-semibold transition-colors"
                    onClick={handleAddToCart}
                    style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)' }}
                  >
                    Добави в кошницата
                  </button>
                  <button
                    onClick={goToNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-700/80 rounded-full p-2 shadow-lg z-10 hover:bg-blue-100 dark:hover:bg-blue-900 disabled:opacity-50"
                    style={{ fontSize: 28 }}
                    aria-label="Следваща снимка"
                    disabled={allImages.length < 2}
                  >
                    &#8594;
                  </button>
                </div>
                {/* Thumbnails */}
                {allImages.length > 1 && (
                  <div className="flex flex-row gap-2 justify-center items-center mb-4">
                    {allImages.map((img, idx) => (
                      <img
                        key={img + idx}
                        src={resolveSrc(img)}
                        alt={product.name + ' миниатюра'}
                        className={`w-20 h-20 object-contain rounded-lg border-2 cursor-pointer transition-all duration-150 ${mainImage === img ? 'border-blue-600 ring-2 ring-blue-300' : 'border-gray-300 opacity-80 hover:border-blue-400'}`}
                        style={{ background: '#fff', cursor: 'pointer' }}
                        onClick={() => goToIdx(idx)}
                      />
                    ))}
                  </div>
                )}
              </>}
            </div>
            {/* Right column: title/price/button */}
            <div className="w-full md:w-4/12 space-y-4">
              {product.price != null && <PriceDisplay price={product.price} />}
              {product.description && (
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {product.description}
                </p>
              )}
              {cartError && <div className="text-red-600 text-sm">{cartError}</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModalProductDetails;


import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import PriceDisplay from "../components/PriceDisplay";
import { Helmet } from "../components/Helmet";

let API = import.meta.env.VITE_API_URL || "";
if (API.endsWith("/")) API = API.slice(0, -1);

export default function ModalProductDetails({ productId, onClose }) {
  const { addToCart, cartItems, setIsOpen } = useCart();
  const { user, loading: authLoading } = useAuth();
  const [cartError, setCartError] = useState("");
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mainImage, setMainImage] = useState(null);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const modalRef = useRef(null);

  // Helper: нормализиране на URL към изображение
  const resolveSrc = useCallback((src) => {
    if (!src) return "";
    try {
      // абсолютен URL
      const u = new URL(src);
      return u.href;
    } catch {
      // относителен път
      const prefix = src.startsWith("/") ? "" : "/";
      return `${API}${prefix}${src}`;
    }
  }, []);

  // Затваряне при клик върху бекдропа
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
  };

  // Навигация със стрелки/ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "ArrowRight") goToNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Зареждане на продукта
  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    setProduct(null);
    setMainImage(null);
    setCurrentIdx(0);

    axios
      .get(`${API}/api/products/${productId}`)
      .then((res) => {
        if (cancelled) return;
        const data = res.data || {};
        setProduct(data);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Продуктът не е намерен или има грешка при зареждане.");
        setProduct(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productId]);

  // Проверка дали продуктът е в любими
  useEffect(() => {
    if (!user || !productId) {
      setIsFavorite(false);
      return;
    }
    let cancelled = false;
    axios.get(`${API}/api/auth/favorites`, { withCredentials: true })
      .then(res => {
        if (cancelled) return;
        const favs = res.data.favorites || [];
        setIsFavorite(favs.includes(productId));
      })
      .catch(() => setIsFavorite(false));
    return () => { cancelled = true; };
  }, [user, productId]);

  // Функция за добавяне/премахване от любими
  const toggleFavorite = async () => {
    if (!user || !productId) return;
    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await axios.delete(`${API}/api/auth/favorites/${productId}`, { withCredentials: true });
        setIsFavorite(false);
      } else {
        await axios.post(`${API}/api/auth/favorites/${productId}`, {}, { withCredentials: true });
        setIsFavorite(true);
      }
    } catch (e) {
      // Optionally show error
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Масив от изображения (images[] или image)
  const allImages = useMemo(() => {
    if (!product) return [];
    if (Array.isArray(product.images) && product.images.length) return product.images;
    if (product.image) return [product.image];
    return [];
  }, [product]);

  // При промяна на списъка със снимки – установи главната
  useEffect(() => {
    if (allImages.length) {
      setMainImage(allImages[0]);
      setCurrentIdx(0);
    } else {
      setMainImage(null);
      setCurrentIdx(0);
    }
  }, [allImages]);

  // Навигация в галерията
  const goToIdx = (idx) => {
    if (!allImages.length) return;
    const safe = Math.max(0, Math.min(idx, allImages.length - 1));
    setCurrentIdx(safe);
    setMainImage(allImages[safe]);
  };

  const goToPrev = () => {
    if (allImages.length < 2) return;
    const next = (currentIdx - 1 + allImages.length) % allImages.length;
    goToIdx(next);
  };

  const goToNext = () => {
    if (allImages.length < 2) return;
    const next = (currentIdx + 1) % allImages.length;
    goToIdx(next);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={handleBackdropClick}
      style={{ cursor: "pointer" }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        className="w-full mx-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 md:p-5 mt-2 relative overflow-y-auto max-h-screen"
        style={{ wordBreak: "break-word", cursor: "auto", maxWidth: "1800px", minHeight: "600px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* X за затваряне */}
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
            onClick={() => {
              try {
                addToCart(product, 1);
                setIsOpen?.(true);
                setCartError("");
              } catch {
                setCartError("Възникна грешка при добавяне в кошницата.");
              }
            }}
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
          <>
            <Helmet>
              <title>{product.name} | MARK LIGHT LTD</title>
              <meta name="description" content={product.description?.slice(0, 160) || ""} />
            </Helmet>

            <div className="flex flex-col md:flex-row gap-16 max-w-[1600px] w-full mx-auto min-h-[800px]">
              {/* Галерия */}
              <div className="w-full md:w-8/12 flex flex-col items-center">
                {mainImage && (
                  <>
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
                        width={1000}
                        height={600}
                        style={{ borderRadius: 20, objectFit: 'contain', width: '100%', height: '100%', display: 'block', background: '#f3f4f6', cursor: 'zoom-in' }}
                        onClick={() => setZoomedImage(resolveSrc(mainImage))}
                        onError={e => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/api/placeholder/1000/600";
                        }}
                      />
                      {/* Fullscreen zoom modal */}
                      {zoomedImage && (
                        <div
                          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 cursor-zoom-out"
                          style={{ animation: 'fadeIn .2s' }}
                          onClick={() => setZoomedImage(null)}
                        >
                          <img
                            src={zoomedImage}
                            alt="Увеличена снимка"
                            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 16, boxShadow: '0 8px 32px #0008' }}
                            onClick={e => e.stopPropagation()}
                          />
                        </div>
                      )}
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
                            style={{ background: '#fff' }}
                            onClick={() => goToIdx(idx)}
                          />
                        ))}
                      </div>
                    )}
                    {/* Fullscreen zoom modal */}
                    {zoomedImage && (
                      <div
                        className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 cursor-zoom-out"
                        style={{ animation: 'fadeIn .2s' }}
                        onClick={() => setZoomedImage(null)}
                      >
                        <img
                          src={zoomedImage}
                          alt="Увеличена снимка"
                          style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 16, boxShadow: '0 8px 32px #0008' }}
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                    )}
                    {product.subcategory && (
                      <div className="mb-2 text-gray-500 dark:text-gray-400 text-sm">
                        Подкатегория: {product.subcategory?.name || product.subcategory?.title || product.subcategory}
                      </div>
                    )}
                  </>
                )}
              </div>


              {/* Дясна колона – заглавие/цена/бутон (примерно, ако има  тези компоненти) */}
              <div className="w-full md:w-4/12 space-y-4">
                <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
                {product.price != null && (
                  <div className="flex items-center gap-3 mb-2">
                    <PriceDisplay price={product.price} priceEUR={product.priceEUR} />
                    <button
                      title={isFavorite ? "Премахни от любими" : "Добави в любими"}
                      className={`text-3xl transition-colors z-10 ${isFavorite ? "text-red-500" : "text-gray-400 hover:text-red-500"}`}
                      style={{ lineHeight: 1 }}
                      onClick={toggleFavorite}
                      disabled={favoriteLoading || authLoading}
                    >
                      <span role="img" aria-label="favorite">{isFavorite ? "❤️" : "🤍"}</span>
                    </button>
                  </div>
                )}
                {product.description && (
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {product.description}
                  </p>
                )}
                {/* Примерен бутон за добавяне в кошница – нагласете към вашата логика */}
                {/* ...existing code... (button moved below) */}
                {cartError && <div className="text-red-600 text-sm">{cartError}</div>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}



import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { http } from "../lib/http.js";
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
  // Състояния за ревю
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [productReviews, setProductReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editingRating, setEditingRating] = useState(0);
  const [editingComment, setEditingComment] = useState("");

  // Скриване на съобщението за успех след 3 секунди
  useEffect(() => {
    if (reviewSuccess) {
  const timer = setTimeout(() => setReviewSuccess("") , 3000);
      return () => clearTimeout(timer);
    }
  }, [reviewSuccess]);

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

    http
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
    http.get(`${API}/api/auth/favorites`, { withCredentials: true })
      .then(res => {
        if (cancelled) return;
        const favs = res.data.favorites || [];
        setIsFavorite(favs.includes(productId));
      })
      .catch(() => setIsFavorite(false));
    return () => { cancelled = true; };
  }, [user, productId]);



  // Функция за добавяне/премахване от любими

  const onEditReview = (r) => {
    setEditingReviewId(r._id);
    setEditingRating(r.rating);
    setEditingComment(r.comment || '');
  };

  const onCancelEdit = () => {
    setEditingReviewId(null);
    setEditingRating(0);
    setEditingComment('');
  };

  const onSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await http.put(`${API}/api/products/${productId}/review`, {
        reviewId: editingReviewId,
        rating: Number(editingRating),
        comment: editingComment
      }, { withCredentials: true });
      setReviewSuccess('Ревюто е обновено успешно!');
      onCancelEdit();
      const r = await http.get(`${API}/api/products/${productId}/reviews`);
      setProductReviews(r.data || []);
      setTimeout(() => setReviewSuccess(''), 2000);
    } catch (err) {
      setReviewError('Грешка при обновяване на ревюто');
      setTimeout(() => setReviewError(''), 2000);
    }
  };

  const onDeleteReview = async (reviewId) => {
    if (!window.confirm('Сигурни ли сте, че искате да изтриете това ревю?')) return;
    try {
      await http.delete(`${API}/api/products/${productId}/review/${reviewId}`, { withCredentials: true });
      const r = await http.get(`${API}/api/products/${productId}/reviews`);
      setProductReviews(r.data || []);
      setReviewSuccess('Ревюто е изтрито успешно.');
      setTimeout(() => setReviewSuccess(''), 2000);
    } catch (err) {
      setReviewError('Грешка при изтриване на ревю');
      setTimeout(() => setReviewError(''), 2000);
    }
  };

  const toggleFavorite = async () => {
    if (!user || !productId) return;
    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await http.delete(`${API}/api/auth/favorites/${productId}`, { withCredentials: true });
        setIsFavorite(false);
      } else {
        await http.post(`${API}/api/auth/favorites/${productId}`, {}, { withCredentials: true });
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
                {/* Секция за добавяне на ревю */}
                {user && (
                  <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg shadow space-y-3">
                    <h3 className="text-lg font-semibold mb-2">Добави ревю</h3>
                    <form
                      onSubmit={async e => {
                        e.preventDefault();
                        setReviewError("");
                        setReviewSuccess("");
                        try {
                          await http.post(`${API}/api/products/${productId}/review`, {
                            rating: reviewRating,
                            comment: reviewComment
                          }, { withCredentials: true });
                          setReviewSuccess("Ревюто е изпратено успешно!");
                          // Reload reviews
                          try { const r = await http.get(`${API}/api/products/${productId}/reviews`); setProductReviews(r.data || []); } catch {}
                          setReviewRating(0);
                          setReviewComment("");
                        } catch (err) {
                          setReviewError("Грешка при изпращане на ревюто");
                        }
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm">Оценка:</span>
                        {[1,2,3,4,5].map(star => (
                          <button
                            type="button"
                            key={star}
                            className={`text-2xl ${reviewRating >= star ? "text-yellow-400" : "text-gray-300"}`}
                            onClick={() => setReviewRating(star)}
                          >★</button>
                        ))}
                      </div>
                      <textarea
                        className="w-full border rounded p-2 mb-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        rows={3}
                        placeholder="Вашият коментар..."
                        value={reviewComment}
                        onChange={e => setReviewComment(e.target.value)}
                        required
                      />
                      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Изпрати ревю</button>
                      {reviewSuccess && <div className="text-green-600 mt-2">{reviewSuccess}</div>}
                      {reviewError && <div className="text-red-600 mt-2">{reviewError}</div>}
                    </form>
                  </div>
                )}

                {/* Списък с ревюта */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Ревюта</h3>
                  {reviewsLoading ? (
                    <div>Зареждане на ревюта...</div>
                  ) : productReviews.length === 0 ? (
                    <div>Все още няма ревюта.</div>
                  ) : (
                    <ul className="space-y-3">
                      {productReviews.map((r) => {
                        const isOwner = (user && (r.user?._id === user.id || r.user === user.id || r.user?._id === user._id));
                        const canManage = isOwner || (user && user.isAdmin);
                        return (
                          <li key={r._id} className="p-3 border rounded bg-white dark:bg-gray-800">
                            {editingReviewId === r._id ? (
                              <form onSubmit={onSaveEdit}>
                                <div className="flex items-center gap-2 mb-2">
                                  <label className="mr-2">Оценка:</label>
                                  <select className="border rounded px-2 py-1" value={editingRating} onChange={e => setEditingRating(e.target.value)}>
                                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                                  </select>
                                </div>
                                <textarea className="w-full border rounded p-2 mb-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                          rows={3}
                                          value={editingComment}
                                          onChange={e => setEditingComment(e.target.value)} />
                                <div className="flex gap-2">
                                  <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">Запази</button>
                                  <button type="button" onClick={onCancelEdit} className="bg-gray-400 text-white px-3 py-1 rounded">Отказ</button>
                                </div>
                              </form>
                            ) : (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                  <div className="font-semibold">{r.user?.username || r.user?.email || 'Анонимен'}</div>
                                  <div className="text-yellow-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                                </div>
                                {r.comment && <div className="text-sm">{r.comment}</div>}
                                {canManage && (
                                  <div className="mt-2 flex gap-2">
                                    <button className="bg-blue-500 text-white px-2 py-1 rounded" onClick={() => onEditReview(r)}>Редактирай</button>
                                    <button className="bg-red-500 text-white px-2 py-1 rounded" onClick={() => onDeleteReview(r._id)}>Изтрий</button>
                                  </div>
                                )}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

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



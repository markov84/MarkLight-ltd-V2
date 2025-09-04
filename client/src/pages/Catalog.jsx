import React, { useState, useEffect, useRef, useCallback, Suspense, useMemo } from 'react';
import ProductCard from '../components/ProductCard';
import VirtualizedProductGrid from '../components/VirtualizedProductGrid';
import { useCart } from '../context/CartContext';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

 
 
// import axios from 'axios';
 

// 👉 смени с реалните пътища
const ModalProductDetails = React.lazy(() => import('../components/ModalProductDetails'));

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/** Малък hook за дебоунс на стойности (за търсене и т.н.) */

// Debounce hook for smooth input and fast API
function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}


/** Странициране: показва прозорец около текущата страница (по-лека рендеринг) */
function usePageWindow(total, current, halfWindow = 2) {
  return useMemo(() => {
    if (total <= 1) return [1];
    const start = Math.max(1, current - halfWindow);
    const end = Math.min(total, current + halfWindow);
    const arr = [];
    for (let i = start; i <= end; i++) arr.push(i);
    if (!arr.includes(1)) arr.unshift(1);
    if (!arr.includes(total)) arr.push(total);
    return arr;
  }, [total, current, halfWindow]);
}


export default function Catalog() {
  // Навигационни параметри (трябва да е най-отгоре, преди useEffect)
  const [searchParams, setSearchParams] = useSearchParams();
  // Състояние
  const [products, setProducts] = useState([]);
  // ...existing code...
  // Синхронизирай selectedCategory/selectedSubcategory с URL при навигация от менюто
  useEffect(() => {
    const urlCategory = searchParams.get('category') || '';
    const urlSubcategory = searchParams.get('subcategory') || '';
    if (urlCategory !== selectedCategory) setSelectedCategory(urlCategory);
    if (urlSubcategory !== selectedSubcategory) setSelectedSubcategory(urlSubcategory);
    // eslint-disable-next-line
  }, [searchParams]);
  const { addToCart, setIsOpen, cartItems } = useCart();

  // --- Състояние ---
  // (products/setProducts вече са дефинирани по-горе)
  // Кеш за резултати от филтри
  const filterCache = useRef({});
  const [categories, setCategories] = useState([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false); // кеш флаг
  const [subcategories, setSubcategories] = useState([]);
  const [subcategoryCache, setSubcategoryCache] = useState({}); // кеш за подкатегории по категория
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


  // филтри
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounced(searchTerm, 1300);


  const [sortBy, setSortBy] = useState('name');

  // комитнати и "pending" цени (за да не тръгва заявка на всеки keypress)
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });       // влиза в заявката
  const [pendingPrice, setPendingPrice] = useState({ min: '', max: '' });   // само UI

  // категория / подкатегория (инициализирани от URL)
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedSubcategory, setSelectedSubcategory] = useState(searchParams.get('subcategory') || '');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedProductId, setSelectedProductId] = useState(null);
  // Scroll to top при смяна на страница
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  // refs за връщане на предишен филтър/скрол/страница след затваряне на модал
  const lastCategoryRef = useRef();
  const lastSubcategoryRef = useRef();
  const lastScrollRef = useRef(0);
  const lastPageRef = useRef(1);

  // --- Memo данни за пагинация (по-малко бутони) ---
  const pageNumbers = usePageWindow(totalPages, page, 2);

  // Запази category/subcategory и scroll позиция при отваряне на модал
  useEffect(() => {
    if (selectedProductId) {
      lastCategoryRef.current = selectedCategory;
      lastSubcategoryRef.current = selectedSubcategory;
      lastScrollRef.current = window.scrollY;
      lastPageRef.current = page;
    }
  }, [selectedProductId, selectedCategory, selectedSubcategory, page]);

  // Зареждане на категории (веднъж, с кеш флаг)
  useEffect(() => {
    if (categoriesLoaded) return;
    let isMounted = true;
    (async () => {
      try {
        const res = await axios.get(`${API}/api/products/categories/all`);
        if (!isMounted) return;
        setCategories(res.data || []);
        setCategoriesLoaded(true);
      } catch (e) {
        if (!isMounted) return;
        setError('Грешка при зареждане на категориите');
        setTimeout(() => setError(''), 3000);
      }
    })();
    return () => { isMounted = false; };
  }, [categoriesLoaded]);

  // Синхронизирай филтрите с URL-а (само ако реално се променят)
  useEffect(() => {
    const next = new URLSearchParams();
    if (selectedCategory) next.set('category', selectedCategory);
    if (selectedSubcategory) next.set('subcategory', selectedSubcategory);

    const sameCategory = next.get('category') === searchParams.get('category');
    const sameSubcategory = next.get('subcategory') === searchParams.get('subcategory');
    const nextKeys = Array.from(next.keys()).sort().join(',');
    const curKeys = Array.from(searchParams.keys()).sort().join(',');

    if (!(sameCategory && sameSubcategory && nextKeys === curKeys)) {
      setSearchParams(Object.fromEntries(next), { replace: true });
    }
    // умишлено НЕ добавяме searchParams/setSearchParams в deps, за да не цикли
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedSubcategory]);

  // Зареждане на подкатегории при смяна на категория с кеширане
  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!selectedCategory) {
        setSubcategories([]);
        return;
      }
      // Ако има в кеша, използвай го
      if (subcategoryCache[selectedCategory]) {
        setSubcategories(subcategoryCache[selectedCategory]);
        return;
      }
      try {
        const res = await axios.get(`${API}/api/products/subcategories/${selectedCategory}`);
        if (!isMounted) return;
        setSubcategories(res.data || []);
        setSubcategoryCache((prev) => ({ ...prev, [selectedCategory]: res.data || [] }));
      } catch (e) {
        if (!isMounted) return;
        setSubcategories([]);
      }
    })();
    return () => { isMounted = false; };
  }, [selectedCategory, subcategoryCache]);

  // Зареждане на продукти при промяна на филтри/страница


  // Автоматично зареждане на продукти при промяна на филтри/търсене
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      setError('');
      const cacheKey = JSON.stringify({
        category: selectedCategory || '',
        subcategory: selectedSubcategory || '',
        search: debouncedSearch || '',
        sortBy,
        minPrice: priceRange.min || '',
        maxPrice: priceRange.max || '',
        page,
      });
      if (filterCache.current[cacheKey]) {
        const { items, tp } = filterCache.current[cacheKey];
        setProducts(items);
        setTotalPages(tp);
        setLoading(false);
        return;
      }
      try {
        const params = {
          category: selectedCategory || undefined,
          subcategory: selectedSubcategory || undefined,
          search: debouncedSearch || undefined,
          sortBy,
          minPrice: priceRange.min || undefined,
          maxPrice: priceRange.max || undefined,
          page,
        };
        const res = await axios.get(`${API}/api/products`, { params, signal: controller.signal });
        let items = [];
        let tp = 1;
        if (Array.isArray(res.data)) {
          items = res.data;
        } else if (res.data?.items) {
          items = res.data.items;
          tp = res.data.totalPages || 1;
        } else if (res.data?.products) {
          items = res.data.products;
          tp = res.data.totalPages || 1;
        }
        filterCache.current[cacheKey] = { items, tp };
        setProducts(items);
        setTotalPages(tp);
        if (page > tp) setPage(1);
      } catch (e) {
        if (e.name === 'CanceledError' || e.name === 'AbortError') return;
        setError('Грешка при зареждане на продуктите');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [selectedCategory, selectedSubcategory, debouncedSearch, sortBy, priceRange.min, priceRange.max, page]);

  // --- Стабилни callback-и (намаляват пререндери на списъка) ---
  const [cartError, setCartError] = useState("");
  const handleAddToCart = useCallback(async (product) => {
    try {
      // Вземи актуалния продукт от сървъра
      const res = await axios.get(`${API}/api/products/${product._id}`);
      const freshProduct = res.data;
      if (!freshProduct || typeof freshProduct.stockQuantity !== 'number') {
        setCartError('Грешка при проверка на наличността.');
        setTimeout(() => setCartError(""), 2500);
        return;
      }
      // Вземи текущата бройка в количката
      const currentInCart = (JSON.parse(localStorage.getItem('cart') || '[]').find(item => item._id === product._id)?.quantity) || 0;
      if (currentInCart + 1 > freshProduct.stockQuantity) {
        setCartError(`Няма достатъчно наличност. Оставащи: ${freshProduct.stockQuantity - currentInCart}`);
        setTimeout(() => setCartError(""), 2500);
        return;
      }
  // Always pass all product fields, but with up-to-date stockQuantity
  const result = addToCart({ ...product, ...freshProduct });
      if (typeof result === "string") {
        setCartError(result);
        setTimeout(() => setCartError(""), 2500);
        return;
      }
      setIsOpen(true);
    } catch (e) {
      setCartError('Грешка при проверка на наличността.');
      setTimeout(() => setCartError(""), 2500);
    }
  }, [addToCart, setIsOpen]);

  const handleOpenProduct = useCallback((id) => {
    setSelectedProductId(id);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedProductId(null);
    if (lastCategoryRef.current !== undefined) setSelectedCategory(lastCategoryRef.current);
    if (lastSubcategoryRef.current !== undefined) setSelectedSubcategory(lastSubcategoryRef.current);
    if (lastPageRef.current !== undefined) setPage(lastPageRef.current);
    setTimeout(() => {
      window.scrollTo({ top: lastScrollRef.current, behavior: 'auto' });
    }, 0);
  }, []);

  const applyFilters = useCallback(() => {
    setPriceRange(pendingPrice);
    setPage(1);
  }, [pendingPrice]);

  // --- Loader (skeleton) ---
  const skeletonArray = useMemo(() => Array.from({ length: 8 }), []);

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Каталог | MARK LIGHT LTD</title>
        </Helmet>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Каталог на продукти
            </h1>
          </div>
          <div className="grid grid-cols-1 gap-0 mt-8">
            {skeletonArray.map((_, i) => (
              <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col gap-4">
                <div className="bg-gray-200 dark:bg-gray-700 h-40 w-full rounded" />
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-full mt-2" />
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <span className="text-red-600 dark:text-red-400 mb-4">{error}</span>
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          onClick={() => window.location.reload()}
        >
          Опитай отново
        </button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Каталог | MARK LIGHT LTD</title>
      </Helmet>

      {cartError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg animate-pulse">
          {cartError}
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Каталог на продукти
          </h1>
        </div>

        {/* Филтри */}
        <div className="flex flex-col md:flex-row md:items-end gap-4 justify-center mt-6 mb-8">
          {/* Категория */}
          <div className="flex-1 min-w-[180px]">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedSubcategory(''); // нулирай подкатегория при смяна на категория
                setPage(1);
              }}
              className="w-full px-4 py-3 h-[48px] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Всички категории</option>
              {categories.map((cat) => (
                <option key={cat.slug || cat._id} value={cat.slug || cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Подкатегория */}
          <div className="flex-1 min-w-[180px]">
            <select
              value={selectedSubcategory}
              onChange={(e) => {
                setSelectedSubcategory(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-3 h-[48px] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={!selectedCategory}
            >
              {!selectedCategory ? (
                <option value="">Изберете категория</option>
              ) : subcategories.length === 0 ? (
                <option value="">Няма подкатегории</option>
              ) : (
                <>
                  <option value="">Всички подкатегории</option>
                  {subcategories.map((sub) => (
                    <option key={sub.slug || sub._id} value={sub.slug || sub._id}>
                      {sub.name}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* Търсене */}
          <div className="flex-1 min-w-[180px]">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Търси по име..."
              autoComplete="off"
              className="w-full px-4 py-3 h-[48px] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Цена + Приложи */}
          <div className="flex-1 min-w-[220px] flex gap-2 items-center">
            <input
              type="number"
              min="0"
              value={pendingPrice.min}
              onChange={(e) => setPendingPrice((r) => ({ ...r, min: e.target.value }))}
              placeholder="Мин. цена"
              className="w-full px-4 py-3 h-[48px] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <span className="text-gray-500 dark:text-gray-300">-</span>
            <input
              type="number"
              min="0"
              value={pendingPrice.max}
              onChange={(e) => setPendingPrice((r) => ({ ...r, max: e.target.value }))}
              placeholder="Макс. цена"
              className="w-full px-4 py-3 h-[48px] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <button
              onClick={applyFilters}
              className="px-4 py-3 h-[48px] bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors ml-2"
            >
              Филтрирай
            </button>
          </div>
        </div>

        {/* Сортиране (по желание разшири опциите) */}
        <div className="flex justify-end mb-4">
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="name">Име</option>
            <option value="price_asc">Цена ↑</option>
            <option value="price_desc">Цена ↓</option>
            <option value="newest">Най-нови</option>
          </select>
        </div>

        {/* Брой намерени продукти */}
        <div className="mb-2 text-right text-gray-600 dark:text-gray-300 text-sm">
          {products.length > 0
            ? `Намерени продукти: ${products.length}`
            : null}
        </div>
        {/* Продукти (виртуализиран grid за максимална бързина) */}
        <div className="mt-6">
          {products.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-12 text-lg">
              един момент...
            </div>
          ) : (
            <VirtualizedProductGrid
              products={products.slice(0, 12)}
              onAddToCart={handleAddToCart}
              onOpenProduct={handleOpenProduct}
              cartItems={cartItems}
            />
          )}
        </div>

        {/* Пагинация */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 py-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50"
            >
              &larr;
            </button>

            {pageNumbers.map((pn, idx) => {
              const isEllipsis =
                idx > 0 && pn - pageNumbers[idx - 1] > 1;
              return (
                <React.Fragment key={pn}>
                  {isEllipsis && <span className="px-2">…</span>}
                  <button
                    onClick={() => setPage(pn)}
                    className={`px-3 py-2 rounded-lg ${
                      pn === page
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                    } hover:bg-blue-400 hover:text-white transition-colors`}
                    disabled={pn === page}
                  >
                    {pn}
                  </button>
                </React.Fragment>
              );
            })}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50"
            >
              &rarr;
            </button>
          </div>
        )}

        {/* Модал */}
        {selectedProductId && (
          <Suspense
            fallback={
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl">
                  Зареждане на продукта…
                </div>
              </div>
            }
          >
            <ModalProductDetails
              productId={selectedProductId}
              onClose={handleCloseModal}
            />
          </Suspense>
        )}
      </div>
    </>
  );
}

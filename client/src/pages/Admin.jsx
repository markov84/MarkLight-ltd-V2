import React, { useEffect, useMemo, useRef, useState } from "react";
import AdminSuggestions from "./AdminSuggestions.jsx";
import useAdminPageRestore from '../hooks/useAdminPageRestore';
import { useNavigate } from "react-router-dom";
import ModalProductDetails from "../components/ModalProductDetails";
import axios from "axios";
import { http } from '../lib/http';

/* ------------------------ Helpers ------------------------ */
// Нормализиране на низ (trim, спейс-колапс, малки букви, маха диакритики)
function normalizeString(str) {
  if (!str) return "";
  return str
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/* ======================== Component ======================= */
export default function Admin() {
  useAdminPageRestore();
  const [stats, setStats] = useState(null);
  const loadStats = () => http.get('/api/admin/stats', { withCredentials: true }).then(res => setStats(res.data)).catch(()=>{});
  useEffect(()=>{ loadStats(); const h=()=>loadStats(); window.addEventListener('admin:refresh-stats', h); return ()=>window.removeEventListener('admin:refresh-stats', h); }, []);
  const navigate = useNavigate();

  /* ------------------------ Config ------------------------ */
  let API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  if (API.endsWith("/")) API = API.slice(0, -1);

  // Унифицирана функция за показване на снимки (локални, uploads, url)
  function getImageSrc(img) {
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
  }
  const BGN_PER_EUR = 1.95583;

  /* ------------------------ State ------------------------- */
  const isMounted = useRef(false);

  // каталози
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  // списък продукти + страниране
  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(() => {
    const saved = localStorage.getItem("adminPage");
    return saved ? parseInt(saved, 10) || 1 : 1;
  });

  // филтри
  const [searchTerm, setSearchTerm] = useState("");
  const [price, setPrice] = useState("");

  // форма за продукт
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stockQuantity: 0,
    addStockQuantity: "",
    image: "",
    images: [""],
    category: "",
    subcategory: "",
    newCategory: "",
    newSubcategory: "",
    localImageFile: undefined,
    localImagePreview: "",
    supplier: "",
    productCode: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // UI помощни
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [showNewSubcategory, setShowNewSubcategory] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);

  // подсказки (autocomplete)
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  /* ------------------------ Effects ----------------------- */
  // mount/unmount guard
  useEffect(() => {
    isMounted.current = true;
    fetchCategories();
    fetchProducts(page);
    return () => {
      isMounted.current = false;
      // чистене на локален preview, ако има
      if (formData.localImagePreview) URL.revokeObjectURL(formData.localImagePreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // запазване на текущата страница
  useEffect(() => {
    localStorage.setItem("adminPage", String(page));
  }, [page]);

  // презареждане при филтри
  useEffect(() => {
    fetchProducts(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, price, page]);

  /* ---------------------- Memo values --------------------- */
  // конвертирана цена в EUR
  const euroPrice = useMemo(() => {
    if (!formData.price || formData.price.trim() === "") return "";
    const p = parseFloat(formData.price.replace(",", "."));
    if (Number.isNaN(p)) return "";
    return (p / BGN_PER_EUR).toFixed(2);
  }, [formData.price]);

  // списъци за подсказки (име/доставчик)
  const productNameList = useMemo(() => {
    const all = (products || []).map((p) => p?.name).filter(Boolean);
    return Array.from(new Set(all));
  }, [products]);

  const nameSuggestions = useMemo(() => {
    if (!formData.name) return productNameList;
    const norm = normalizeString(formData.name);
    return productNameList.filter((n) => normalizeString(n).includes(norm));
  }, [formData.name, productNameList]);

  const supplierList = useMemo(() => {
    const all = (products || []).map((p) => p?.supplier).filter(Boolean);
    return Array.from(new Set(all));
  }, [products]);

  const supplierSuggestions = useMemo(() => {
    if (!formData.supplier) return supplierList;
    const norm = normalizeString(formData.supplier);
    return supplierList.filter((s) => normalizeString(s).includes(norm));
  }, [formData.supplier, supplierList]);

  /* ----------------------- API calls ---------------------- */
  async function fetchCategories() {
    try {
      const res = await axios.get(`${API}/api/admin/categories`, { withCredentials: true });
      if (!isMounted.current) return;
      setCategories(Array.isArray(res.data) ? res.data : res.data?.categories || []);
    } catch (e) {
      console.error(e);
      if (!isMounted.current) return;
      setError("Грешка при зареждане на категориите");
      setTimeout(() => setError(""), 3000);
    }
  }

  async function fetchSubcategories(categoryId) {
    try {
      const res = await axios.get(`${API}/api/admin/subcategories`, {
        withCredentials: true,
        params: categoryId ? { category: categoryId } : undefined,
      });
      if (!isMounted.current) return;
      setSubcategories(Array.isArray(res.data) ? res.data : res.data?.subcategories || []);
    } catch (e) {
      console.error(e);
      if (!isMounted.current) return;
      setError("Грешка при зареждане на подкатегориите");
      setTimeout(() => setError(""), 3000);
    }
  }

  // fetchProducts с филтри само по име и цена
  async function fetchProducts(targetPage = 1) {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/admin/products`, {
        params: {
          page: targetPage,
          limit: 10,
          search: searchTerm || undefined,
          price: price || undefined,
        },
        withCredentials: true,
      });

      let items = [];
      let tp = 1;
      let total = 0;

      if (Array.isArray(res.data)) {
        items = res.data;
        total = items.length;
      } else if (res.data?.items) {
        items = res.data.items;
        tp = res.data.totalPages || 1;
        total = res.data.totalItems ?? res.data.total ?? items.length;
      } else if (res.data?.products) {
        items = res.data.products;
        tp = res.data.totalPages || 1;
        total = res.data.totalItems ?? res.data.total ?? items.length;
      }

      if (!isMounted.current) return;
      setProducts(items);
      setTotalPages(tp);
      setProductCount(total);

      if (targetPage > tp) setPage(1);
    } catch (e) {
      console.error(e);
      if (!isMounted.current) return;
      setError("Грешка при зареждане на продуктите");
      setTimeout(() => setError(""), 3000);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }

  /* ---------------------- Handlers (form) ----------------- */
  const handleAddImageField = () => {
    setFormData((prev) => ({ ...prev, images: [...(prev.images || []), ""] }));
  };

  const handleRemoveImageField = (idx) => {
    setFormData((prev) => {
      const newImages = [...(prev.images || [])];
      const removed = newImages[idx];
      newImages.splice(idx, 1);
      let newImage = prev.image;
      if (prev.image && removed === prev.image) newImage = "";
      return { ...prev, images: newImages, image: newImage };
    });
  };

  const handleSetMainImage = (imgUrl) => {
    setFormData((prev) => ({ ...prev, image: imgUrl || "" }));
  };

  const handleInputChange = (e) => {
    const { name, value, dataset, files } = e.target;

    if (name === "images") {
      const idx = parseInt(dataset.idx, 10);
      if (!Number.isNaN(idx)) {
        setFormData((prev) => {
          const newImages = [...prev.images];
          newImages[idx] = value;
          return { ...prev, images: newImages };
        });
      }
      return;
    }

    if (name === "localImageFile") {
      const file = files && files[0];
      const preview = file ? URL.createObjectURL(file) : "";
      if (formData.localImagePreview) URL.revokeObjectURL(formData.localImagePreview);
      setFormData((prev) => ({
        ...prev,
        localImageFile: file,
        localImagePreview: preview,
      }));
      return;
    }

    let newValue = value;
    if (name === "price") {
      // позволи запетая като десетичен разделител, максимум една точка
      newValue = value.replace(/,/g, ".").replace(/[^0-9.]/g, "");
      const parts = newValue.split(".");
      if (parts.length > 2) newValue = parts[0] + "." + parts.slice(1).join("");
    }
    if (name === "stockQuantity") {
      newValue = newValue.replace(/[^0-9]/g, "");
      if (newValue === "") newValue = 0;
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));

    if (name === "category") {
      const newCatId = newValue || "";
      setFormData((prev) => ({ ...prev, subcategory: "" }));
      if (newCatId) fetchSubcategories(newCatId);
      else setSubcategories([]);
    }
  };

  const resetForm = () => {
    if (formData.localImagePreview) URL.revokeObjectURL(formData.localImagePreview);
    setFormData({
      name: "",
      description: "",
      price: "",
      stockQuantity: 0,
      image: "",
      images: [""],
      category: "",
      subcategory: "",
      newCategory: "",
      newSubcategory: "",
      localImageFile: undefined,
      localImagePreview: "",
      supplier: "",
      productCode: "",
      addStockQuantity: "",
    });
    setEditingId(null);
    setError("");
    setSuccess("");
    setShowNewCategory(false);
    setShowNewSubcategory(false);
    setSubcategories([]);
  };

  const validateForm = () => {
    if (!formData.name.trim()) return "Моля, въведете име на продукта.";
    if (!formData.description.trim()) return "Моля, въведете описание.";
    const price = parseFloat((formData.price || "").replace(",", "."));
    if (Number.isNaN(price) || price < 0) return "Моля, въведете валидна цена (>= 0).";
    if (formData.stockQuantity < 0 || isNaN(formData.stockQuantity)) return "Моля, въведете валиден брой (>= 0).";

    const images = (formData.images || []).filter((i) => i && i.trim() !== "");
    if (
      !formData.localImageFile &&
      formData.image &&
      typeof formData.image === "string" &&
      formData.image.trim().length > 0
    ) {
      const img = formData.image.trim();
      const imgLower = img.toLowerCase();
      if (
        !imgLower.startsWith("http://") &&
        !imgLower.startsWith("https://") &&
        !imgLower.startsWith("/uploads") &&
        !imgLower.startsWith("uploads")
      ) {
        return "Основната снимка (URL) трябва да започва с http/https или да е качена от компютъра.";
      }
    }
    const isValidImgUrl = (i) =>
      /^https?:\/\//i.test(i) || i.startsWith("/uploads") || i.startsWith("uploads");
    if (images.some((i) => i && typeof i === "string" && !isValidImgUrl(i))) {
      return "Всички допълнителни снимки (URL) трябва да започват с http/https или да са качени от компютъра.";
    }
    if (
      !editingId &&
      (formData.addStockQuantity === undefined ||
        formData.addStockQuantity === "" ||
        Number(formData.addStockQuantity) <= 0)
    ) {
      return "Моля, въведете брой за добавяне към наличност (задължително поле).";
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const validationError = validateForm();
      if (validationError) {
        setError(validationError);
        setSubmitting(false);
        return;
      }

      let categoryId = formData.category;
      let subcategoryId = formData.subcategory;

      // 1) Нова категория
      if (showNewCategory && formData.newCategory.trim()) {
        const newCatRes = await axios.post(
          `${API}/api/admin/categories`,
          { name: formData.newCategory.trim() },
          { withCredentials: true }
        );
        const newCat = newCatRes.data;
        if (newCat?._id) {
          categoryId = newCat._id;
          setFormData((prev) => ({ ...prev, category: categoryId }));
          await fetchCategories();
        }
      }

      // 2) Нова подкатегория
      if (showNewSubcategory && formData.newSubcategory.trim() && categoryId) {
        const subcategoryResponse = await axios.post(
          `${API}/api/admin/subcategories`,
          { name: formData.newSubcategory.trim(), category: categoryId },
          { withCredentials: true }
        );
        subcategoryId = subcategoryResponse.data._id;
        setFormData((prev) => ({ ...prev, subcategory: subcategoryId }));
        await fetchSubcategories(categoryId);
      }

      // 3) Подготовка на данните
      const filteredImages = (formData.images || []).filter((img) => img && img.trim() !== "");
      let normalizedPrice = (formData.price || "").replace(/,/g, ".");
      if (normalizedPrice) {
        const num = Number(normalizedPrice);
        if (!Number.isNaN(num)) normalizedPrice = num.toFixed(2);
      }

      let response;
      if (formData.localImageFile) {
        // multipart/form-data
        const data = new FormData();
        data.append("name", formData.name);
        data.append("description", formData.description);
        data.append("price", String(normalizedPrice));
        if (editingId) {
          if (formData.addStockQuantity && Number(formData.addStockQuantity) > 0) {
            data.append("addStockQuantity", parseInt(formData.addStockQuantity, 10));
          }
        } else {
          data.append("stockQuantity", parseInt(formData.addStockQuantity, 10));
        }
        if (categoryId) data.append("category", categoryId);
        if (subcategoryId) data.append("subcategory", subcategoryId);
        filteredImages.forEach((img) => data.append("images", img));
        data.append("image", formData.localImageFile);
        if (formData.supplier) data.append("supplier", formData.supplier);
        if (formData.productCode) data.append("productCode", formData.productCode);

        if (editingId) {
          response = await axios.put(`${API}/api/admin/products/${editingId}`, data, {
            withCredentials: true,
            headers: { "Content-Type": "multipart/form-data" },
          });
          setFormData((prev) => ({ ...prev, addStockQuantity: "" }));
        } else {
          response = await axios.post(`${API}/api/admin/products`, data, {
            withCredentials: true,
            headers: { "Content-Type": "multipart/form-data" },
          });
          setFormData((prev) => ({ ...prev, addStockQuantity: "" }));
        }
      } else {
        // application/json
        const payload = {
          name: formData.name,
          description: formData.description,
          price: normalizedPrice,
          image: formData.image || undefined,
          images: filteredImages,
          category: categoryId || undefined,
          subcategory: subcategoryId || undefined,
          supplier: formData.supplier || undefined,
          productCode: formData.productCode || undefined,
        };
        if (editingId) {
          if (formData.addStockQuantity && Number(formData.addStockQuantity) > 0) {
            payload.addStockQuantity = parseInt(formData.addStockQuantity, 10);
          }
        } else {
          payload.stockQuantity = parseInt(formData.addStockQuantity, 10);
        }

        if (editingId) {
          response = await axios.put(`${API}/api/admin/products/${editingId}`, payload, {
            withCredentials: true,
          });
          setFormData((prev) => ({ ...prev, addStockQuantity: "" }));
          await fetchProducts(page);
          resetForm();
        } else {
          response = await axios.post(`${API}/api/admin/products`, payload, {
            withCredentials: true,
          });
          setFormData((prev) => ({ ...prev, addStockQuantity: "" }));
        }
      }

      if (response?.status >= 200 && response?.status < 300) {
        setSuccess(editingId ? "Продуктът е актуализиран успешно!" : "Продуктът е добавен успешно!");
        await fetchProducts(page);
        setTimeout(() => setSuccess(""), 3000);
        resetForm();
      } else {
        throw new Error("Непозната грешка при записа на продукта");
      }
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.msg ||
          (editingId ? "Грешка при актуализирането на продукта" : "Грешка при добавянето на продукта")
      );
      setTimeout(() => setError(""), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name || "",
      description: product.description || "",
      price: product.price?.toString() || "",
      stockQuantity: 0,
      addStockQuantity: "",
      image: product.image || "",
      images: Array.isArray(product.images) ? product.images : [product.images || ""],
      category: product.category?._id || product.category || "",
      subcategory: product.subcategory?._id || product.subcategory || "",
      newCategory: "",
      newSubcategory: "",
      localImageFile: undefined,
      localImagePreview: "",
      supplier: product.supplier || "",
      productCode: product.productCode || "",
    });
    setEditingId(product._id);
    setError("");
    setSuccess("");
    setShowNewCategory(false);
    setShowNewSubcategory(false);
    if (product.category?._id || product.category)
      fetchSubcategories(product.category?._id || product.category);
    else setSubcategories([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("Сигурни ли сте, че искате да изтриете този продукт?")) return;
    try {
      await axios.delete(`${API}/api/admin/products/${productId}`, { withCredentials: true });
      setSuccess("Продуктът е изтрит успешно!");
      if (products.length === 1 && page > 1) setPage((p) => p - 1);
      else await fetchProducts(page);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Грешка при изтриването на продукта");
      setTimeout(() => setError(""), 3000);
    }
  };

  /* ------------------------- UI --------------------------- */
  return (
    <div className="space-y-8">
      {/* Нови функционалности */}
      <div className="flex flex-wrap gap-3 justify-center md:justify-start mb-4">
  <button onClick={() => navigate('/admin/suggestions')} className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg shadow text-sm">Мнения и желания</button>
        <button onClick={() => navigate('/coupons')} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow text-sm">Купони</button>
        <button onClick={() => navigate('/chat')} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow text-sm">Чат</button>
        <button onClick={() => navigate('/analytics')} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow text-sm">Анализи</button>
        <button onClick={() => navigate('/courier')} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg shadow text-sm">Куриер</button>
        <button onClick={() => navigate('/admin/reviews')} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg shadow text-sm">Ревюта</button>
      </div>
   
   
      {/* Модал за мнения и желания */}
      {/* Header */}
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-center sm:text-left text-sm">
        <div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Админ панел</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Управление на продукти и поръчки
          </p>
        </div>
        <button
          className="mt-4 sm:mt-0 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow"
          onClick={() => navigate("/orders")}
        >
          Виж поръчки
        </button>
      </div>

      {/* Statistics Cards */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-screen-lg mx-auto px-2 md:px-4 lg:px-8">
  <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 w-full max-w-xs mx-auto">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="ml-2">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Общо продукти</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{productCount}</p>
            </div>
          </div>
        </div>

  <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 w-full max-w-xs mx-auto">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-2">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Активни поръчки</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">0</p>
            </div>
          </div>
        </div>

  <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 w-full max-w-xs mx-auto">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Общи продажби</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">0 лв.</p>
            </div>
          </div>
        </div>
      

</div>

      {/* Product Form */}
  <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 w-full max-w-full mx-auto">
        <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
          {editingId ? "Редактиране на продукт" : "Добавяне на нов продукт"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Supplier and Product Code */}
          <div className="flex flex-col md:flex-row gap-6 w-full">
              <div className="flex flex-col grow w-full min-w-0 max-w-[120px]">
                <label htmlFor="supplier" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Доставчик
              </label>
              <div className="relative">
                <input
                  id="supplier"
                  name="supplier"
                  type="text"
                  value={formData.supplier}
                  onChange={handleInputChange}
                  className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Име на доставчик"
                  autoComplete="off"
                  onFocus={() => setShowSupplierDropdown(true)}
                  onBlur={() => setTimeout(() => setShowSupplierDropdown(false), 150)}
                />
                {showSupplierDropdown && supplierSuggestions.length > 0 && (
                  <ul className="absolute z-10 left-0 right-0 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg mt-1 max-h-40 overflow-y-auto shadow-lg">
                    {supplierSuggestions.map((s, idx) => (
                      <li
                        key={`${s}-${idx}`}
                        className="px-4 py-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-800 text-gray-900 dark:text-white"
                        onMouseDown={() => {
                          setFormData((prev) => ({ ...prev, supplier: s }));
                          setShowSupplierDropdown(false);
                        }}
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex flex-col grow w-full min-w-0 max-w-[120px]">
              <label htmlFor="productCode" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Номер на продукта
              </label>
              <input
                id="productCode"
                name="productCode"
                type="text"
                value={formData.productCode}
                onChange={handleInputChange}
                className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Въведете номер на продукта (SKU, код и т.н.)"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 w-full">
            {/* Име */}
            <div className="flex flex-col grow-[2] w-full min-w-0">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Име на продукта *
              </label>
              <div className="relative">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-6 py-4 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Въведете име на продукта"
                  autoComplete="off"
                  onFocus={() => setShowNameDropdown(true)}
                  onBlur={() => setTimeout(() => setShowNameDropdown(false), 150)}
                />
                {showNameDropdown && nameSuggestions.length > 0 && (
                  <ul className="absolute z-10 left-0 right-0 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg mt-1 max-h-40 overflow-y-auto shadow-lg">
                    {nameSuggestions.map((n, idx) => (
                      <li
                        key={`${n}-${idx}`}
                        className="px-4 py-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-800 text-gray-900 dark:text-white"
                        onMouseDown={() => {
                          setFormData((prev) => ({ ...prev, name: n }));
                          setShowNameDropdown(false);
                        }}
                      >
                        {n}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Цена (лв.) */}
            <div className="flex flex-col grow w-full min-w-0 max-w-[220px]">
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Цена (лв.) *
              </label>
              <input
                id="price"
                name="price"
                type="text"
                inputMode="decimal"
                pattern="[0-9]+([\\.,][0-9]{1,2})?"
                min="0"
                required
                value={formData.price}
                onChange={handleInputChange}
                onFocus={() => {
                  setFormData((prev) => ({
                    ...prev,
                    price: prev.price === "0" || prev.price === "0.00" ? "" : prev.price,
                  }));
                }}
                onBlur={(e) => {
                  if (e.target.value.trim() === "") setFormData((prev) => ({ ...prev, price: "0" }));
                }}
                className="w-full px-6 py-4 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white h-[56px]"
                placeholder="Въведете цена (напр. 22,90)"
                autoComplete="off"
              />
            </div>

            {/* Цена (евро) */}
            <div className="flex flex-col grow w-full min-w-0 max-w-[220px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Цена (EUR)
              </label>
              <input
                type="text"
                value={euroPrice || ""}
                readOnly
                tabIndex={-1}
                className="w-full px-6 py-4 text-lg border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white h-[56px]"
                placeholder="Автоматично"
              />
            </div>

            {/* Наличност */}
            <div className="flex flex-col grow w-full min-w-0 max-w-[220px]">
              <label htmlFor="addStockQuantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Добави към наличност *
              </label>
              <input
                id="addStockQuantity"
                name="addStockQuantity"
                type="number"
                min="1"
                required={!editingId}
                value={formData.addStockQuantity}
                onChange={(e) => setFormData((prev) => ({ ...prev, addStockQuantity: e.target.value }))}
                className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Въведете брой за добавяне"
                autoComplete="off"
              />
            </div>
          </div>

          {/* Category and Subcategory */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Категория */}
            <div className="w-full md:w-1/2 min-w-0">
              <label htmlFor="category" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Категория
              </label>
              <div className="space-y-3">
                {!showNewCategory ? (
                  <div className="flex items-center">
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full text-sm px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500"
                      style={{ fontSize: "0.95rem", minHeight: "36px" }}
                    >
                      <option value="">Изберете категория</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowNewCategory(true)}
                      className="ml-2 px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200"
                      title="Създай нова категория"
                      aria-label="Създай нова категория"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="newCategory"
                      value={formData.newCategory}
                      onChange={handleInputChange}
                      placeholder="Име на новата категория"
                      className="flex-1 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewCategory(false);
                        setFormData((prev) => ({ ...prev, newCategory: "" }));
                      }}
                      className="px-2 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
                      title="Отказ"
                      aria-label="Отказ за създаване на категория"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                {!formData.category && !showNewCategory && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">Първо изберете или създайте категория</p>
                )}
              </div>
            </div>

            {/* Подкатегория */}
            <div className="w-full md:w-1/2 min-w-0">
              <label htmlFor="subcategory" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Подкатегория
              </label>
              <div className="space-y-3">
                {!showNewSubcategory ? (
                  <div className="flex items-center">
                    <select
                      id="subcategory"
                      name="subcategory"
                      value={formData.subcategory}
                      onChange={handleInputChange}
                      className="w-full text-sm px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500"
                      style={{ fontSize: "0.95rem", minHeight: "36px" }}
                      disabled={!formData.category}
                    >
                      <option value="">Изберете подкатегория</option>
                      {subcategories
                        .filter(
                          (subcategory) =>
                            subcategory.category === formData.category ||
                            (subcategory.category && subcategory.category._id === formData.category)
                        )
                        .map((subcategory) => (
                          <option key={subcategory._id} value={subcategory._id}>
                            {subcategory.name}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowNewSubcategory(true)}
                      className="ml-2 px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200"
                      title="Създай нова подкатегория"
                      aria-label="Създай нова подкатегория"
                      disabled={!formData.category}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="newSubcategory"
                      value={formData.newSubcategory}
                      onChange={handleInputChange}
                      placeholder="Име на новата подкатегория"
                      className="flex-1 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewSubcategory(false);
                        setFormData((prev) => ({ ...prev, newSubcategory: "" }));
                      }}
                      className="px-2 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
                      title="Отказ"
                      aria-label="Отказ за създаване на подкатегория"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                {!formData.subcategory && !showNewSubcategory && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">Първо изберете или създайте подкатегория</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Описание *
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              required
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs"
              placeholder="Въведете описание на продукта"
              maxLength={2000}
            />
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
              Максимум 2000 символа. Оставащи: {2000 - (formData.description?.length || 0)}
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Основна снимка */}
            <div className="flex-1 min-w-0 flex flex-col items-center">
              <input
                type="text"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="URL на основна снимка"
              />
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mt-1">Основна снимка *</label>
              {formData.image && (
                <img src={getImageSrc(formData.image)} alt="Основна снимка" className="w-20 h-20 object-cover rounded border mt-2" />
              )}
            </div>

            {/* Снимки по URL */}
            <div className="flex-1 min-w-0 flex flex-col items-center">
              {formData.images?.map((img, idx) => (
                <div key={idx} className="flex flex-col items-center mb-2 w-full">
                  <input
                    type="text"
                    name="images"
                    data-idx={idx}
                    value={img}
                    onChange={handleInputChange}
                    className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder={`URL на снимка #${idx + 1}`}
                  />
                  <div className="flex items-center gap-2 mt-1">
                    {img && (
                      <>
                        <img src={getImageSrc(img)} alt="preview" className="w-10 h-10 object-cover rounded border" />
                        <button
                          type="button"
                          onClick={() => handleSetMainImage(img)}
                          className={`px-2 py-1 rounded text-xs ${
                            formData.image === img ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {formData.image === img ? "Основна" : "Като основна"}
                        </button>
                      </>
                    )}
                    {formData.images.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveImageField(idx)}
                        className="text-red-500 font-bold text-lg"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddImageField}
                className="mt-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 px-2 rounded-lg transition-all duration-200 text-xs"
                aria-label="Добави снимка"
              >
                Добави снимка
              </button>
            </div>

            {/* Качи снимка (локален файл) */}
            <div className="flex-1 min-w-0 flex flex-col items-center">
              <input
                id="localImageFile"
                name="localImageFile"
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="hidden"
              />
              <label htmlFor="localImageFile" className="block w-full">
                <button
                  type="button"
                  onClick={() => document.getElementById("localImageFile")?.click()}
                  className="w-full mt-0 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 px-2 rounded-lg transition-all duration-200 text-xs"
                  style={{ fontSize: "0.95rem", minHeight: "36px" }}
                >
                  Избери файл
                </button>
              </label>
              <label htmlFor="localImageFile" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mt-2">
                Качи снимка
              </label>
            </div>
          </div>

          {/* Preview Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Преглед на снимка</label>
            {formData.localImageFile && formData.localImagePreview ? (
              <img src={formData.localImagePreview} alt="Преглед" className="mt-2 w-32 h-32 object-cover rounded" />
            ) : formData.image && typeof formData.image === "string" ? (
              <img
                src={getImageSrc(formData.image)}
                alt="Преглед"
                className="mt-2 w-32 h-32 object-cover rounded"
              />
            ) : null}
          </div>

          {/* Messages */}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
              aria-label={editingId ? "Актуализирай продукт" : "Добави продукт"}
            >
              {submitting ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {editingId ? "Актуализиране..." : "Добавяне..."}
                </div>
              ) : editingId ? (
                "Актуализиране на продукт"
              ) : (
                "Добавяне на продукт"
              )}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
                aria-label="Отказ на редакция"
              >
                Отказ
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Products List */}
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 w-full max-w-full mx-auto">
        <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Списък с продукти ({products.length})
          </h2>
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Търси по име..."
              className="w-full md:w-44 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <input
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Цена"
              className="w-full md:w-28 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : !loading && products.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Няма добавени продукти</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full select-none text-xs">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-2 py-2 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Снимки
                    </th>
                    <th className="px-2 py-2 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Име
                    </th>
                    <th className="px-2 py-2 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Категория
                    </th>
                    <th className="px-2 py-2 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Подкатегория
                    </th>
                    <th className="px-2 py-2 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Цена
                    </th>
                    <th className="px-2 py-2 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Наличност
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Код
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Доставчик
                    </th>
                    <th className="px-2 py-2 text-right font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-xs">
                  {products.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-2 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          {(() => {
                            // Показвай само уникални снимки (image + images[]), без празни
                            const imgs = [
                              ...(product.image ? [product.image] : []),
                              ...(Array.isArray(product.images) ? product.images : [])
                            ].filter((img, idx, arr) => img && arr.indexOf(img) === idx);
                            return imgs.map((img, idx) => (
                              <img
                                key={`${product._id}-${idx}`}
                                src={getImageSrc(img)}
                                alt={`${product.name} ${idx + 1}`}
                                className="w-12 h-12 object-cover rounded-lg mr-2"
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = "/no-image.png";
                                }}
                              />
                            ));
                          })()}
                        </div>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {product.name}
                        </div>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {product.category?.name || product.category?.title || "Няма категория"}
                        </div>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {product.subcategory?.name || product.subcategory?.title || "—"}
                        </div>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {Number.isFinite(parseFloat(product.price))
                            ? `${parseFloat(product.price).toFixed(2)} лв.`
                            : "—"}
                        </span>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white text-center">
                          {typeof product.stockQuantity === "number" ? product.stockQuantity : ""}
                        </div>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {product.productCode || "—"}
                        </span>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {product.supplier || "—"}
                        </span>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-right text-xs font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(product)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Редактирай продукт"
                            aria-label="Редактирай продукт"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedProductId(product._id)}
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                            title="Детайли за продукта"
                            aria-label="Детайли за продукта"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12H9m12 0A9 9 0 113 12a9 9 0 0118 0z"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(product._id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            title="Изтрий продукт"
                            aria-label="Изтрий продукт"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center gap-2 py-4">
              <button
                className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Назад страница"
              >
                &lt; Назад
              </button>
              {(() => {
                const pages = [];
                if (totalPages <= 7) {
                  for (let p = 1; p <= totalPages; p++) pages.push(p);
                } else if (page <= 4) {
                  pages.push(1, 2, 3, 4, 5, "...", totalPages);
                } else if (page >= totalPages - 3) {
                  pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                } else {
                  pages.push(1, "...", page - 1, page, page + 1, "...", totalPages);
                }
                return pages.map((p, idx) =>
                  p === "..." ? (
                    <span key={`ellipsis-${idx}`} className="px-2">
                      ...
                    </span>
                  ) : (
                    <button
                      key={`p-${p}`}
                      className={`px-3 py-1 rounded font-semibold mx-1 ${
                        page === p ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                      }`}
                      onClick={() => setPage(p)}
                      aria-label={`Страница ${p}`}
                    >
                      {p}
                    </button>
                  )
                );
              })()}
              <button
                className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold disabled:opacity-50"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                aria-label="Напред страница"
              >
                Напред &gt;
              </button>
            </div>
          </>
        )}
      </div>

      {selectedProductId && (
        <ModalProductDetails productId={selectedProductId} onClose={() => setSelectedProductId(null)} />
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Link } from "react-router-dom";
import { http } from "../lib/http.js";

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CategoryDropdown = forwardRef(function CategoryDropdown({ sideNavMode = false }, ref) {
  // State for sideNavMode
  const [navOpen, setNavOpen] = useState(false);
  // Shared state
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const closeTimeout = useRef();

  // Expose imperative methods for both modes
  useImperativeHandle(ref, () => ({
    closeDropdown: () => {
      setActiveCategory(null);
      setSubcategories([]);
      setIsOpen(false);
      setNavOpen(false);
    },
    toggleDropdown: () => {
      if (sideNavMode) {
        setNavOpen((prev) => {
          if (prev) {
            setActiveCategory(null);
            setSubcategories([]);
            setIsOpen(false);
            return false;
          } else {
            setIsOpen(true);
            return true;
          }
        });
      } else {
        setIsOpen((prev) => !prev);
      }
    }
  }), [sideNavMode]);


  useEffect(() => {
    fetchCategories();
    // Cleanup on unmount
    return () => clearCloseTimeout();
    // eslint-disable-next-line
  }, []);

  const fetchCategories = async () => {
    try {
      if (!API) return;
      const response = await http.get(`${API}/api/products/categories/all`);
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchSubcategories = async (categorySlugOrId) => {
    try {
      if (!API || !categorySlugOrId) {
        setSubcategories([]);
        return;
      }
      const response = await http.get(`${API}/api/products/subcategories/${categorySlugOrId}`);
      setSubcategories(response.data);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      setSubcategories([]);
    }
  };

  const handleCategoryHover = (category) => {
    setActiveCategory(category);
    if (category) {
      // Използвай slug ако има, иначе _id
      fetchSubcategories(category.slug || category._id);
    }
  };

  // Helper to clear close timeout
  const clearCloseTimeout = () => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
  };

  // Open dropdown immediately
  const handleMouseEnter = () => {
    clearCloseTimeout();
    setIsOpen(true);
  };

  // Close dropdown with delay
  const handleMouseLeave = () => {
    clearCloseTimeout();
    closeTimeout.current = setTimeout(() => {
      setIsOpen(false);
      setActiveCategory(null);
      setSubcategories([]);
    }, 200); // 200ms delay
  };

  // Sync isOpen with navOpen in sideNavMode
  useEffect(() => {
    if (sideNavMode) {
      if (!navOpen) {
        setActiveCategory(null);
        setSubcategories([]);
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    }
    // eslint-disable-next-line
  }, [navOpen, sideNavMode]);

  if (sideNavMode) {
    // Only render dropdown content if navOpen is true
    if (!navOpen) return null;
    return (
      <div>
        <Link to="/catalog" className="block py-1 px-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">Всички продукти</Link>
        {categories.map((cat) => (
          <div key={cat._id} className="ml-1">
            <button
              className={`w-full text-left py-1 px-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium ${activeCategory && activeCategory.slug === cat.slug ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
              onClick={() => {
                if (activeCategory && activeCategory.slug === cat.slug) {
                  setActiveCategory(null);
                  setSubcategories([]);
                } else {
                  setActiveCategory(cat);
                }
              }}
              onMouseEnter={() => fetchSubcategories(cat.slug || cat._id)}
            >
              {cat.name}
            </button>
            {activeCategory && activeCategory.slug === cat.slug && subcategories.length > 0 && (
              <div className="ml-3">
                <Link
                  to={`/catalog?category=${cat.slug}`}
                  className="block py-1 px-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  onClick={() => setActiveCategory(null)}
                >
                  Всички от {cat.name}
                </Link>
                {subcategories.map((subcategory) => (
                  <Link
                    key={subcategory._id}
                    to={`/catalog?category=${cat.slug || cat._id}&subcategory=${subcategory.slug || subcategory._id}`}
                    className="block py-1 px-4 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                    onClick={() => setActiveCategory(null)}
                  >
                    {subcategory.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Оригинален dropdown за top nav
  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Categories Trigger */}
      <button className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200">
        <span>Категории</span>
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 min-w-[600px]">
          <div className="flex">
            {/* Categories Column */}
            <div className="w-1/2 border-r border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">Категории</h3>
              </div>
              <div className="py-2">
                <Link
                  to="/catalog"
                  className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Всички продукти
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat._id}
                    to={`/catalog?category=${cat.slug}`}
                    className={`block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${activeCategory && activeCategory.slug === cat.slug ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                    onMouseEnter={() => handleCategoryHover(cat)}
                    onClick={() => setIsOpen(false)}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Subcategories Column */}
            <div className="w-1/2">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {activeCategory ? activeCategory.name : 'Подкатегории'}
                </h3>
              </div>
              <div className="py-2">
                {activeCategory && (
                  <Link
                    to={`/catalog?category=${activeCategory.slug}`}
                    className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Всички от {activeCategory.name}
                  </Link>
                )}
                {subcategories.map((subcategory) => (
                  <Link
                    key={subcategory._id}
                    to={`/catalog?category=${activeCategory.slug || activeCategory._id}&subcategory=${subcategory.slug || subcategory._id}`}
                    className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {subcategory.name}
                  </Link>
                ))}
                {activeCategory && subcategories.length === 0 && (
                  <div className="px-4 py-2 text-gray-500 dark:text-gray-400 italic">
                    Няма подкатегории
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
export default CategoryDropdown;

import React from "react";
import { Link } from "react-router-dom";
import CategoryDropdown from "./CategoryDropdown";
import { useRef } from "react";

export default function SideNav() {
  const catDropdownRef = useRef();
  // Handler to close dropdown from label
  const handleCatalogClick = () => {
    if (catDropdownRef.current && catDropdownRef.current.toggleDropdown) {
      catDropdownRef.current.toggleDropdown();
    }
  };
  return (
    <aside className="hidden md:block fixed top-20 left-0 h-full w-44 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-30 py-6 px-2">
      <nav className="flex flex-col space-y-4">
        <Link to="/" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200">Начало</Link>
        <div>
          <div className="mb-1 text-gray-700 dark:text-gray-200 font-medium cursor-pointer" onClick={handleCatalogClick}>Каталог</div>
          <div className="ml-1">
            <CategoryDropdown sideNavMode ref={catDropdownRef} />
          </div>
        </div>
        <Link to="/about" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200">За нас</Link>
        <Link to="/contact" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200">Контакт</Link>
        <Link to="/terms" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200">Условия</Link>
        <Link to="/privacy" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200">Поверителност</Link>
      </nav>
    </aside>
  );
}

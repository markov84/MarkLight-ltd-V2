 import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import useDarkMode from "../hooks/useDarkMode";
import Cart from "./Cart";
import CategoryDropdown from "./CategoryDropdown";
import LanguageSelector from "./LanguageSelector";
import Footer from "./Footer";
import SideNav from "./SideNav";
import usePageRestore from '../hooks/usePageRestore';


export default function Layout({ children }) {

  usePageRestore();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { getTotalItems, setIsOpen } = useCart();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [dark, setDark] = useDarkMode();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
  <div className={dark ? "dark bg-gray-900 text-gray-100 min-h-screen" : "bg-gray-50 text-gray-900 min-h-screen"}>
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="w-full flex flex-row items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          {/* Left: Logo and company */}
          <div className="flex items-center space-x-2">
            <Link to="/" className="flex items-center space-x-2">
              <img
                src="/logo.png"
                alt="Лого"
                className="w-10 h-10 object-contain rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                style={{ maxWidth: 40, maxHeight: 40 }}
              />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                MARK LIGHT LTD
              </span>
            </Link>
          </div>
          {/* Center: Navigation Links */}
          <div className="hidden md:flex flex-1 justify-center items-center space-x-6">
            <Link to="/" className="btn btn-ghost btn-sm">Начало</Link>
            <Link to="/catalog" className="btn btn-ghost btn-sm">{t('nav.catalog')}</Link>
            <CategoryDropdown />
            <Link to="/about" className="btn btn-ghost btn-sm">{t('nav.about')}</Link>
            <Link to="/contact" className="btn btn-ghost btn-sm">{t('nav.contact')}</Link>
            {user && (
              <Link to="/wish-suggestion" className="btn btn-ghost btn-sm text-green-600">Мнения и препоръки</Link>
            )}
            {user?.isAdmin && (
              <Link to="/admin" className="btn btn-ghost btn-sm">{t('nav.admin')}</Link>
            )}
          </div>
          {/* Right: Controls and logout */}
          <div className="flex items-center space-x-4">
            <button className="md:hidden p-2 rounded-lg border border-gray-200 dark:border-gray-700 mr-1" onClick={() => setMobileOpen(v => !v)} aria-label="Отвори меню">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {/* Премахнат DaisyUI Theme Selector */}
            <LanguageSelector />
            <button 
              onClick={() => setDark(!dark)} 
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
              aria-label="Toggle dark mode"
            >
              {dark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => setIsOpen(true)}
              className="btn btn-circle btn-sm relative"
              aria-label="Отвори количката"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
                <circle cx="9" cy="21" r="1.5" fill="currentColor" />
                <circle cx="19" cy="21" r="1.5" fill="currentColor" />
                <path d="M2.5 4H4.5L6.5 17H20.5C21.052 17 21.5 16.552 21.5 16C21.5 15.789 21.421 15.587 21.282 15.432L6.5 4H2.5V4Z" stroke="currentColor" strokeLinejoin="round"/>
                <path d="M7 7H17" stroke="currentColor" strokeLinecap="round"/>
              </svg>
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 badge badge-error text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                  {getTotalItems()}
                </span>
              )}
            </button>
            {/* Условен рендер за user/login/register */}
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7" fill="currentColor" fillOpacity="0.15" />
                    <path d="M4 20c0-2.5 3.5-4 8-4s8 1.5 8 4" stroke="currentColor" strokeWidth="1.7" fill="none" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {user.username || user.email}
                  </span>
                  <Link to="/profile" className="text-xs text-blue-600 dark:text-blue-400 underline ml-2 hover:text-blue-800 dark:hover:text-blue-300">Моят профил</Link>
                  {user.isAdmin && (
                    <span className="text-xs text-blue-600 dark:text-blue-400 ml-1">
                      {t('common.admin')}
                    </span>
                  )}
                </div>
                <button 
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 btn btn-error btn-sm"
                >
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  to="/login" 
                  className="btn btn-outline btn-sm"
                >
                  {t('nav.login')}
                </Link>
                <Link 
                  to="/register" 
                  className="btn btn-primary btn-sm"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      
      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur">
          <div className="px-4 py-2 flex flex-col gap-1">
            <Link to="/" className="py-3">Начало</Link>
            <Link to="/catalog" className="py-3">Каталог</Link>
            <Link to="/about" className="py-3">За нас</Link>
            <Link to="/contact" className="py-3">Контакти</Link>
            <div className="py-2"><CategoryDropdown mobile /></div>
            {user ? (
              <div className="flex items-center gap-2 py-2">
                <Link to="/profile" className="py-2 px-3 rounded-lg border">Профил</Link>
                <button onClick={handleLogout} className="py-2 px-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium">Изход</button>
              </div>
            ) : (
              <div className="flex items-center gap-2 py-2">
                <Link to="/login" className="py-2 px-3 rounded-lg border">Вход</Link>
                <Link to="/register" className="py-2 px-3 rounded-lg bg-blue-600 text-white">Регистрация</Link>
              </div>
            )}
          </div>
        </div>
      )}

      </nav>


      {/* Side navigation + Main content */}
      <div className="flex flex-row">
        <SideNav />
        <main className="flex-1 px-2 py-4 ml-0 md:ml-44 max-w-full">
          {children}
        </main>
      </div>

      {/* Footer */}
      <Footer />

      {/* Cart component */}
      <Cart />
    </div>
  );
}

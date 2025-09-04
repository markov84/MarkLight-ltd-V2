 import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-[600px] flex items-center justify-center">
      <div className="text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-9xl font-bold text-yellow-500 dark:text-yellow-400 mb-4">
            404
          </div>
          <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Упс! Тази страница се крие. Върни се на началната страница или потърси нещо друго
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
            Съжаляваме, но страницата която търсите не съществува или е преместена.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 inline-block"
          >
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Начална страница
            </div>
          </Link>

          <Link
            to="/catalog"
            className="border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-yellow-500 dark:hover:border-yellow-400 px-8 py-3 rounded-lg font-semibold transition-all duration-200 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 inline-block"
          >
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Каталог
            </div>
          </Link>
        </div>

        {/* Additional Help */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Или може да използвате навигацията отгоре
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link 
              to="/catalog" 
              className="text-yellow-600 dark:text-yellow-400 hover:underline"
            >
              Каталог продукти
            </Link>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <Link 
              to="/login" 
              className="text-yellow-600 dark:text-yellow-400 hover:underline"
            >
              Вход
            </Link>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <Link 
              to="/register" 
              className="text-yellow-600 dark:text-yellow-400 hover:underline"
            >
              Регистрация
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

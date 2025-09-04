import React, { useState } from "react";
import axios from "axios";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { Helmet } from "../components/Helmet";

const API = import.meta.env.VITE_API_URL;

export default function ResetPassword() {
  const { t } = useLanguage();
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    if (!password || password.length < 6) {
      setError("Паролата трябва да е поне 6 символа.");
      return;
    }
    if (password !== confirm) {
      setError("Паролите не съвпадат.");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/api/auth/reset-password`, { token, password });
      setSuccess("Паролата е сменена успешно!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError("Грешен или изтекъл линк.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('Смяна на парола')} | MARK LIGHT LTD</title>
        <meta name="description" content={t('reset.meta')} />
      </Helmet>
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12v2m0 4h.01M12 20h.01M8 20h.01M4 20h.01M20 20h.01M12 4v4m0 0a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Смяна на парола</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2">{t('reset.desc')}</p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('Нова парола')}
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                placeholder={t('Въведете нова парола')}
              />
            </div>
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('Потвърдете паролата')}
              </label>
              <input
                id="confirm"
                type="password"
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                placeholder={t('Потвърдете новата парола')}
              />
            </div>
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
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
            >
              {loading ? t('common.loading') : t('Смени паролата')}
            </button>
          </form>
          <div className="mt-6 text-center">
            <Link to="/login" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
              {t('Вход')}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

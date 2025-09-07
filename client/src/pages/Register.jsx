import React, { useState } from "react";
import { http } from "../lib/http.js";
import { useNavigate, Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { Helmet } from "../components/Helmet";

const API = import.meta.env.VITE_API_URL;

export default function Register() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,30}$/;
  // 4-level password strength
  // Равномерно разделен индикатор
  const getPasswordStrengthLevel = (password) => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    // Много силна само ако всички условия + 12+ символа
    if (score === 4 && password.length >= 12) return 4;
    return score;
  };

  const getPasswordStrengthLabel = (level) => {
    switch (level) {
      case 1: return 'Слаба';
      case 2: return 'Средна';
      case 3: return 'Силна';
      case 4: return 'Много силна';
      default: return '';
    }
  };

  const getPasswordStrengthColor = (level) => {
    switch (level) {
      case 1: return 'bg-red-500';
      case 2: return 'bg-orange-400';
      case 3: return 'bg-green-500';
      case 4: return 'bg-blue-600';
      default: return 'bg-gray-300';
    }
  };

  const getPasswordStrengthTextColor = (level) => {
    switch (level) {
      case 1: return 'text-red-500';
      case 2: return 'text-orange-500';
      case 3: return 'text-green-600';
      case 4: return 'text-blue-600';
      default: return 'text-gray-400';
    }
  };

  // Password strength bar
  const getPasswordStrengthBar = (password) => {
    if (!password) return { width: '0%', color: 'bg-gray-300' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score++;
    if (score <= 2) return { width: '33%', color: 'bg-red-500' };
    if (score === 3) return { width: '66%', color: 'bg-orange-500' };
    if (score === 4 && password.length >= 16) return { width: '100%', color: 'bg-blue-600' };
    if (score === 4 && password.length >= 12) return { width: '100%', color: 'bg-violet-600' };
    if (score === 4) return { width: '100%', color: 'bg-green-600' };
    return { width: '0%', color: 'bg-gray-300' };
  };

  const validateForm = () => {
    if (!formData.email || !formData.username || !formData.password) {
      setError(t('register.errors.required'));
      return false;
    }
    
    if (formData.username.length < 3 || formData.username.length > 30) {
      setError(t('register.errors.usernameLength'));
      return false;
    }
    
    if (formData.password.length < 6) {
      setError(t('register.errors.passwordLength'));
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError(t('register.errors.passwordMatch'));
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError(t('register.errors.invalidEmail'));
      return false;
    }
    
    return true;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSuccess("");
    setError("");
    
    if (!validateForm()) return;
    
    if (!strongPassword.test(formData.password)) {
      setError('Паролата трябва да е между 8 и 30 символа и да съдържа малка, голяма буква, цифра и специален символ.');
      return;
    }
    
    setLoading(true);
    try {
  await http.post(`${API}/api/auth/register`, {
        email: formData.email,
        username: formData.username,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName
      });
      setSuccess(t('register.success')); navigate('/verify', { state: { email: formData.email } });
      // navigate to verify above
    } catch (err) {
      // Show backend error message if available
      if (err.response?.data?.msg) {
        setError(err.response.data.msg);
      } else {
        setError('Възникна неочаквана грешка. Моля, опитайте отново.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
  <title>Регистрация | MARK LIGHT LTD</title>
  <meta name="description" content="Регистрирайте се в MARK LIGHT LTD и се възползвайте от нашите специални предложения." />
      </Helmet>
      <div className="min-h-[600px] flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('register.title')}</h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">{t('register.subtitle')}</p>
        </div>

        {/* Register Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('register.firstName')}
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                placeholder={t('register.firstNamePlaceholder')}
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('register.lastName')}
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                placeholder={t('register.lastNamePlaceholder')}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('register.email')} *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
              placeholder={t('register.emailPlaceholder')}
            />
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('register.username')} *
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
              placeholder={t('register.usernamePlaceholder')}
            />
          </div>

          {/* Password */}
          <div className="mb-4">
  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    Парола *
  </label>
  <div className="relative">
    <input
      id="password"
      name="password"
      type={showPassword ? "text" : "password"}
      value={formData.password}
      onChange={e => setFormData({ ...formData, password: e.target.value })}
      className="w-full border rounded-lg p-3 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
      required
    />
    <button
      type="button"
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-white"
      onClick={() => setShowPassword(v => !v)}
      tabIndex={-1}
      aria-label={showPassword ? "Скрий паролата" : "Покажи паролата"}
    >
      {showPassword ? "👁️" : "👁️‍🗨️"}
    </button>
  </div>
  {/* Segmented password strength bar */}
  <div className="flex items-center gap-2 mt-2 mb-1">
    {[1,2,3,4].map((level) => (
      <div
        key={level}
        className={`h-3 w-1/4 rounded ${getPasswordStrengthLevel(formData.password) >= level ? getPasswordStrengthColor(level) : 'bg-gray-300'} transition-all duration-300`}
      ></div>
    ))}
    {formData.password && getPasswordStrengthLevel(formData.password) > 0 && (
      <span className={`text-xs font-semibold ml-2 ${getPasswordStrengthTextColor(getPasswordStrengthLevel(formData.password))}`}>
        {getPasswordStrengthLabel(getPasswordStrengthLevel(formData.password))}
      </span>
    )}
  </div>
  <div className="text-xs mt-1 text-gray-600 dark:text-gray-300">
    Паролата трябва да е между 8 и 30 символа и да съдържа малка, голяма буква, цифра и специален символ.
  </div>
</div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('register.confirmPassword')} *
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
              placeholder={t('register.confirmPasswordPlaceholder')}
            />
          </div>

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
              {error.includes('username') && (
                <div className="text-xs text-gray-600 mt-2">
                  Не може да има двама потребители с едно и също потребителско име, дори с различни имейли. Потребителското име трябва да е уникално.
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('register.loading')}
              </div>
            ) : (
              t('register.submit')
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            {t('register.loginPrompt')}{' '}
            <Link to="/login" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
              {t('register.loginLink')}
            </Link>
          </p>
        </div>
      </div>
      </div>
    </>
  );
}

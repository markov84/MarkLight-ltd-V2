import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { http } from "../lib/http.js";
import { Helmet } from "../components/Helmet";

const API = import.meta.env.VITE_API_URL;

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr("");
    setMsg("");
    if (password.length < 6 || password.length > 30) {
      setErr("Паролата трябва да е между 6 и 30 символа.");
      setLoading(false);
      return;
    }
    if (password !== confirm) {
      setErr("Паролите не съвпадат.");
      setLoading(false);
      return;
    }
    try {
      const res = await http.post(`${API}/api/auth/reset-password`, {
        token,
        password,
      });
      setMsg(res.data?.msg || "Паролата е сменена!");
      setTimeout(() => navigate("/login"), 1500);
    } catch (e) {
      setErr(e.response?.data?.msg || "Грешка при смяна на паролата.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (msg || err) {
      const timer = setTimeout(() => {
        setMsg("");
        setErr("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [msg, err]);

  return (
    <>
      <Helmet>
        <title>Смяна на парола | Mark Light</title>
      </Helmet>
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 12v2m0 4h.01M12 20h.01M8 20h.01M4 20h.01M20 20h.01M12 4v4m0 0a4 4 0 100 8 4 4 0 000-8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Смяна на парола
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Въведете новата си парола по-долу.
            </p>
          </div>
          <form className="space-y-6" onSubmit={onSubmit}>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Нова парола
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                placeholder="Въведете нова парола"
              />
            </div>
            <div>
              <label
                htmlFor="confirm"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Потвърдете паролата
              </label>
              <input
                id="confirm"
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                placeholder="Потвърдете новата парола"
              />
            </div>
            {msg && (
              <div className="mt-3 text-green-600">{msg}</div>
            )}
            {err && (
              <div className="mt-3 text-red-600">{err}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Моля изчакайте…" : "Смени паролата"}
            </button>
          </form>
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
            >
              Вход
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

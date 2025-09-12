import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    code: "",
    discount: "",
    expiresAt: "",
    minOrderValue: "",
    usageLimit: ""
  });

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchCoupons();
  }, []);

  async function fetchCoupons() {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/coupon/active`);
      setCoupons(res.data);
    } catch (e) {
      setError("Грешка при зареждане на купоните");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const payload = {
        code: form.code,
        discountType: "percent", // може да се направи динамично, ако искаш
        discountValue: Number(form.discount),
        expiresAt: form.expiresAt,
        minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : 0,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : 1,
      };
      const res = await axios.post(`${API}/api/coupon/create`, payload, { withCredentials: true });
      setSuccess("Купонът е създаден успешно!");
      setForm({ code: "", discount: "", expiresAt: "", minOrderValue: "", usageLimit: "" });
      fetchCoupons();
    } catch (e) {
      setError("Грешка при създаване на купон");
    }
  }

  async function handleDeactivate(id) {
    setError("");
    setSuccess("");
    try {
      await axios.post(`${API}/api/coupon/deactivate/${id}`, {}, { withCredentials: true });
      setSuccess("Купонът е деактивиран!");
      fetchCoupons();
    } catch (e) {
      setError("Грешка при деактивиране на купон");
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold mb-4 text-center">Купони</h1>

      {/* Форма за създаване на купон */}
      <form onSubmit={handleCreate} className="bg-white dark:bg-gray-800 p-4 rounded shadow space-y-4">
        <h2 className="text-lg font-semibold mb-2">Създай нов купон</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label htmlFor="code" className="mb-1 text-xs font-semibold text-gray-700 dark:text-gray-200">Код на купона *</label>
            <input id="code" type="text" required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} className="px-2 py-2 border rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
          </div>
          <div className="flex flex-col">
            <label htmlFor="discount" className="mb-1 text-xs font-semibold text-gray-700 dark:text-gray-200">Отстъпка (%) *</label>
            <input id="discount" type="number" required value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} className="px-2 py-2 border rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
          </div>
          <div className="flex flex-col">
            <label htmlFor="expiresAt" className="mb-1 text-xs font-semibold text-gray-700 dark:text-gray-200">Валиден до *</label>
            <input id="expiresAt" type="date" required value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} className="px-2 py-2 border rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
          </div>
          <div className="flex flex-col">
            <label htmlFor="minOrderValue" className="mb-1 text-xs font-semibold text-gray-700 dark:text-gray-200">Мин. стойност на поръчка</label>
            <input id="minOrderValue" type="number" value={form.minOrderValue} onChange={e => setForm(f => ({ ...f, minOrderValue: e.target.value }))} className="px-2 py-2 border rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
          </div>
          <div className="flex flex-col">
            <label htmlFor="usageLimit" className="mb-1 text-xs font-semibold text-gray-700 dark:text-gray-200">Лимит на използване</label>
            <input id="usageLimit" type="number" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))} className="px-2 py-2 border rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
          </div>
        </div>
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Създай купон</button>
      </form>

      {success && <div className="bg-green-100 text-green-800 p-2 rounded">{success}</div>}
      {error && <div className="bg-red-100 text-red-800 p-2 rounded">{error}</div>}

      {/* Списък с купони */}
  <div className={`bg-white dark:bg-gray-800 p-4 rounded shadow ${window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'coupon-table-dark' : ''}`}> 
        <h2 className="text-lg font-semibold mb-2">Активни купони</h2>
        {loading ? (
          <div className="text-center p-4">Зареждане...</div>
        ) : coupons.length === 0 ? (
          <div className="text-center p-4 text-gray-500">Няма активни купони</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-2">Код</th>
                <th className="px-2 py-2">Отстъпка</th>
                <th className="px-2 py-2">Валиден до</th>
                <th className="px-2 py-2">Мин. поръчка</th>
                <th className="px-2 py-2">Лимит</th>
                <th className="px-2 py-2">Действия</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(coupon => (
                <tr key={coupon._id} className="border-b">
                  <td className="px-2 py-2 font-bold">{coupon.code}</td>
                  <td className="px-2 py-2">{coupon.discount}%</td>
                  <td className="px-2 py-2">{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : ""}</td>
                  <td className="px-2 py-2">{coupon.minOrderValue || "—"}</td>
                  <td className="px-2 py-2">{coupon.usageLimit || "—"}</td>
                  <td className="px-2 py-2">
                    <button onClick={() => handleDeactivate(coupon._id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded">Деактивирай</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

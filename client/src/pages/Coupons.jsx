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
      const res = await axios.post(`${API}/api/coupon/create`, form, { withCredentials: true });
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
          <input type="text" placeholder="Код на купона" required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} className="px-2 py-2 border rounded w-full" />
          <input type="number" placeholder="Отстъпка (%)" required value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} className="px-2 py-2 border rounded w-full" />
          <input type="date" placeholder="Валиден до" required value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} className="px-2 py-2 border rounded w-full" />
          <input type="number" placeholder="Мин. стойност на поръчка" value={form.minOrderValue} onChange={e => setForm(f => ({ ...f, minOrderValue: e.target.value }))} className="px-2 py-2 border rounded w-full" />
          <input type="number" placeholder="Лимит на използване" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))} className="px-2 py-2 border rounded w-full" />
        </div>
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Създай купон</button>
      </form>

      {success && <div className="bg-green-100 text-green-800 p-2 rounded">{success}</div>}
      {error && <div className="bg-red-100 text-red-800 p-2 rounded">{error}</div>}

      {/* Списък с купони */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
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

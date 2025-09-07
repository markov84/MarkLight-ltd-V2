import React, { useEffect, useState } from "react";
import { http } from "../lib/http.js";

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ code: "", discountType: "percent", discountValue: "", minOrderValue: "", expiresAt: "", usageLimit: "1" });
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchCoupons();
  }, []);

  async function fetchCoupons() {
    setLoading(true);
    try {
      const res = await http.get("/api/coupon/active");
      setCoupons(res.data || []);
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
      const res = await http.post("/api/coupon/create", form);
      if (res.data?._id) {
        setSuccess("Купонът е създаден успешно!");
        setForm({ code: "", discountType: "percent", discountValue: "", minOrderValue: "", expiresAt: "", usageLimit: "1" });
        fetchCoupons();
      }
    } catch (e) {
      setError(e?.response?.data?.msg || "Грешка при създаване на купон");
    }
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold mb-4">Купони</h2>
      <form onSubmit={handleCreate} className="space-y-4 max-w-md">
        <input type="text" placeholder="Код на купона" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} className="w-full px-2 py-2 border rounded" required />
        <select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))} className="w-full px-2 py-2 border rounded">
          <option value="percent">Процент</option>
          <option value="fixed">Фиксирана сума</option>
        </select>
        <input type="number" placeholder="Стойност на отстъпката" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))} className="w-full px-2 py-2 border rounded" required />
        <input type="number" placeholder="Минимална стойност на поръчката" value={form.minOrderValue} onChange={e => setForm(f => ({ ...f, minOrderValue: e.target.value }))} className="w-full px-2 py-2 border rounded" />
        <input type="date" placeholder="Валиден до" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} className="w-full px-2 py-2 border rounded" />
        <input type="number" placeholder="Лимит на използване" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))} className="w-full px-2 py-2 border rounded" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Създай купон</button>
      </form>
      {success && <div className="text-green-600">{success}</div>}
      {error && <div className="text-red-600">{error}</div>}
      <h3 className="text-lg font-semibold mt-8">Активни купони</h3>
      {loading ? <div>Зареждане...</div> : (
        <table className="w-full text-sm mt-2 border">
          <thead>
            <tr>
              <th>Код</th>
              <th>Тип</th>
              <th>Стойност</th>
              <th>Мин. поръчка</th>
              <th>Валиден до</th>
              <th>Лимит</th>
              <th>Използван</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map(c => (
              <tr key={c._id}>
                <td>{c.code}</td>
                <td>{c.discountType === "percent" ? "%" : "лв."}</td>
                <td>{c.discountValue}</td>
                <td>{c.minOrderValue || "—"}</td>
                <td>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "—"}</td>
                <td>{c.usageLimit}</td>
                <td>{c.usedCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

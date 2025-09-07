import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchStats();
    fetchTopProducts();
  }, []);

  async function fetchStats() {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/analytics/orders`, { withCredentials: true });
      setStats(res.data);
    } catch (e) {
      setError("Грешка при зареждане на статистиките");
    } finally {
      setLoading(false);
    }
  }

  async function fetchTopProducts() {
    try {
      const res = await axios.get(`${API}/api/analytics/top-products`, { withCredentials: true });
      setTopProducts(res.data);
    } catch (e) {
      setError("Грешка при зареждане на топ продуктите");
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold mb-4 text-center">Анализи и статистики</h1>
      {error && <div className="bg-red-100 text-red-800 p-2 rounded">{error}</div>}
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Статистики за поръчки</h2>
        {loading || !stats ? (
          <div className="text-center p-4">Зареждане...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-100 p-4 rounded text-center">
              <div className="text-sm text-gray-600">Общо поръчки</div>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
            </div>
            <div className="bg-green-100 p-4 rounded text-center">
              <div className="text-sm text-gray-600">Общ оборот</div>
              <div className="text-2xl font-bold">{stats.totalRevenue} лв.</div>
            </div>
            <div className="bg-yellow-100 p-4 rounded text-center">
              <div className="text-sm text-gray-600">Статуси</div>
              <ul className="text-left mt-2">
                {stats.byStatus.map(s => (
                  <li key={s._id}>{s._id}: <span className="font-bold">{s.count}</span></li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Топ продукти по продажби</h2>
        {topProducts.length === 0 ? (
          <div className="text-center p-4 text-gray-500">Няма данни</div>
        ) : (
          <ul className="list-disc ml-4">
            {topProducts.map(p => (
              <li key={p._id}>
                {p.name} – {p.price} лв. {p.image && <img src={p.image} alt={p.name} className="inline w-8 h-8 object-cover rounded ml-2" />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

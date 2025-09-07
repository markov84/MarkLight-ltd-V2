import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Courier() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newTracking, setNewTracking] = useState("");

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/admin/orders`, { withCredentials: true });
      setOrders(res.data);
    } catch (e) {
      setError("Грешка при зареждане на поръчките");
    } finally {
      setLoading(false);
    }
  }

  async function fetchTracking(orderId) {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/courier/track/${orderId}`, { withCredentials: true });
      setTracking(res.data);
      setNewTracking(res.data.tracking || "");
    } catch (e) {
      setError("Грешка при зареждане на тракинг информацията");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateTracking() {
    if (!selectedOrder) return;
    setError("");
    setSuccess("");
    try {
      await axios.post(`${API}/api/courier/update-tracking/${selectedOrder}`, { tracking: newTracking }, { withCredentials: true });
      setSuccess("Тракинг номерът е обновен!");
      fetchTracking(selectedOrder);
    } catch (e) {
      setError("Грешка при обновяване на тракинг номер");
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold mb-4 text-center">Куриерски заявки</h1>
      {success && <div className="bg-green-100 text-green-800 p-2 rounded">{success}</div>}
      {error && <div className="bg-red-100 text-red-800 p-2 rounded">{error}</div>}
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Поръчки</h2>
        {loading ? (
          <div className="text-center p-4">Зареждане...</div>
        ) : orders.length === 0 ? (
          <div className="text-center p-4 text-gray-500">Няма поръчки</div>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {orders.map(order => (
              <li key={order._id}>
                <button onClick={() => { setSelectedOrder(order._id); fetchTracking(order._id); }} className={`px-3 py-1 rounded ${selectedOrder === order._id ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
                  {order._id} – {order.user?.email || "Клиент"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {selectedOrder && tracking && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Тракинг информация</h2>
          <div className="mb-2">Куриер: <span className="font-bold">{tracking.carrier}</span></div>
          <div className="mb-2">Тракинг номер: <span className="font-bold">{tracking.tracking || "—"}</span></div>
          <div className="mb-2">Статус: <span className="font-bold">{tracking.status}</span></div>
          <div className="mb-2">Очаквана доставка: <span className="font-bold">{tracking.estimatedDelivery}</span></div>
          <div className="mt-4 flex gap-2">
            <input type="text" value={newTracking} onChange={e => setNewTracking(e.target.value)} placeholder="Нов тракинг номер..." className="flex-1 px-2 py-2 border rounded" />
            <button onClick={handleUpdateTracking} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Обнови</button>
          </div>
        </div>
      )}
    </div>
  );
}

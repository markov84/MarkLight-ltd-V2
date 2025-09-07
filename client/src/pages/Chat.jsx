import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Chat() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newMsg, setNewMsg] = useState("");

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

  async function fetchMessages(orderId) {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/chat/${orderId}`, { withCredentials: true });
      setMessages(res.data);
    } catch (e) {
      setError("Грешка при зареждане на съобщенията");
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!newMsg.trim() || !selectedOrder) return;
    setError("");
    setSuccess("");
    try {
      await axios.post(`${API}/api/chat/admin/send/${selectedOrder}`, { message: newMsg }, { withCredentials: true });
      setNewMsg("");
      setSuccess("Съобщението е изпратено!");
      fetchMessages(selectedOrder);
    } catch (e) {
      setError("Грешка при изпращане на съобщение");
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold mb-4 text-center">Чат с клиенти</h1>
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
                <button onClick={() => { setSelectedOrder(order._id); fetchMessages(order._id); }} className={`px-3 py-1 rounded ${selectedOrder === order._id ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
                  {order._id} – {order.user?.email || "Клиент"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {selectedOrder && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Съобщения</h2>
          {loading ? (
            <div className="text-center p-4">Зареждане...</div>
          ) : messages.length === 0 ? (
            <div className="text-center p-4 text-gray-500">Няма съобщения</div>
          ) : (
            <div className="space-y-2">
              {messages.map(m => (
                <div key={m._id} className={`mb-2 ${m.from === 'admin' ? 'text-right' : 'text-left'}`}>
                  <span className={`inline-block px-2 py-1 rounded ${m.from === 'admin' ? 'bg-blue-200' : 'bg-gray-200'}`}>{m.message}</span>
                  <span className="ml-2 text-xs text-gray-500">{new Date(m.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <input type="text" value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Въведете съобщение..." className="flex-1 px-2 py-2 border rounded" />
            <button onClick={handleSend} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Изпрати</button>
          </div>
        </div>
      )}
    </div>
  );
}

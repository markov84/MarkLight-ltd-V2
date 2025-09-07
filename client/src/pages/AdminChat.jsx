import React, { useEffect, useState } from "react";
import { http } from "../lib/http.js";

export default function AdminChat() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newMsg, setNewMsg] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    try {
      const res = await http.get("/api/orders/all");
      setOrders(res.data || []);
    } catch (e) {
      setError("Грешка при зареждане на поръчките");
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages(orderId) {
    setLoading(true);
    try {
      const res = await http.get(`/api/chat/${orderId}`);
      setMessages(res.data || []);
      setSelectedOrder(orderId);
    } catch (e) {
      setError("Грешка при зареждане на съобщенията");
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!newMsg.trim() || !selectedOrder) return;
    try {
      await http.post(`/api/chat/admin/send/${selectedOrder}`, { message: newMsg });
      setNewMsg("");
      fetchMessages(selectedOrder);
    } catch (e) {
      setError("Грешка при изпращане на съобщение");
    }
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold mb-4">Чат с клиенти по поръчки</h2>
      {error && <div className="text-red-600">{error}</div>}
      <div className="flex gap-8">
        <div className="w-1/3">
          <h3 className="font-semibold mb-2">Поръчки</h3>
          {loading ? <div>Зареждане...</div> : (
            <ul className="space-y-2">
              {orders.map(o => (
                <li key={o._id}>
                  <button className={`w-full text-left px-2 py-1 rounded ${selectedOrder === o._id ? 'bg-blue-100' : ''}`} onClick={() => fetchMessages(o._id)}>
                    {o.customerName || o.email || o._id}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-2">Съобщения</h3>
          {selectedOrder ? (
            <div className="space-y-2">
              <div className="border rounded p-2 h-64 overflow-y-auto bg-gray-50">
                {messages.length === 0 ? <div>Няма съобщения</div> : messages.map(m => (
                  <div key={m._id} className={`mb-2 ${m.from === 'admin' ? 'text-right' : 'text-left'}`}>
                    <span className={`inline-block px-2 py-1 rounded ${m.from === 'admin' ? 'bg-blue-200' : 'bg-gray-200'}`}>{m.message}</span>
                    <span className="text-xs text-gray-500 ml-2">{new Date(m.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <input type="text" value={newMsg} onChange={e => setNewMsg(e.target.value)} className="flex-1 px-2 py-1 border rounded" placeholder="Въведете съобщение..." />
                <button onClick={sendMessage} className="px-4 py-1 bg-blue-600 text-white rounded">Изпрати</button>
              </div>
            </div>
          ) : <div>Изберете поръчка за чат</div>}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { http } from "../lib/http.js";

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch only the current user's orders
        const res = await http.get(`${API}/api/orders/my`, { withCredentials: true });
        if (!isMounted) return;
        setOrders(res.data || []);
      } catch (e) {
        if (!isMounted) return;
        setError('Грешка при зареждане на поръчките.');
      } finally {
        setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  if (loading) return <div className="p-8 text-center">Зареждане на поръчки...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6 text-left text-gray-700">Поръчки</h2>
      {orders.length === 0 ? (
        <div className="text-gray-500 text-left">Няма поръчки.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 border rounded-lg">
            <thead>
              <tr>
                <th className="px-4 py-2 border">#</th>
                <th className="px-4 py-2 border">Име</th>
                <th className="px-4 py-2 border">Email</th>
                <th className="px-4 py-2 border">Телефон</th>
                <th className="px-4 py-2 border">Дата</th>
                <th className="px-4 py-2 border">Продукти</th>
                <th className="px-4 py-2 border">Статус</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, idx) => (
                <tr key={order._id} className="border-t">
                  <td className="px-4 py-2 border text-center">{idx + 1}</td>
                  <td className="px-4 py-2 border">{order.customerName || '-'}</td>
                  <td className="px-4 py-2 border">{order.customerEmail || '-'}</td>
                  <td className="px-4 py-2 border">{order.customerPhone || '-'}</td>
                  <td className="px-4 py-2 border">{order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}</td>
                  <td className="px-4 py-2 border">
                    <ul className="list-disc pl-4">
                      {order.items && order.items.map((item, i) => {
                        const product = item.product || {};
                        return (
                          <li key={i}>
                            {product.name || item.name} x {item.quantity}
                            {product.supplier && (
                              <span className="ml-2 text-xs text-gray-500">Доставчик: {product.supplier}</span>
                            )}
                            {product.productCode && (
                              <span className="ml-2 text-xs text-gray-500">Код: {product.productCode}</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </td>
                  <td className="px-4 py-2 border">{order.status || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

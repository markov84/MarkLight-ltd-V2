import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Wishlist() {
  const [wishlists, setWishlists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchWishlists();
  }, []);

  async function fetchWishlists() {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/admin/wishlists`, { withCredentials: true });
      setWishlists(res.data);
    } catch (e) {
      setError("Грешка при зареждане на желанията");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    setError("");
    setSuccess("");
    try {
      await axios.delete(`${API}/api/admin/wishlists/${id}`, { withCredentials: true });
      setSuccess("Желанието е изтрито!");
      fetchWishlists();
    } catch (e) {
      setError("Грешка при изтриване на желание");
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold mb-4 text-center">Wishlist (Желания)</h1>
      {success && <div className="bg-green-100 text-green-800 p-2 rounded">{success}</div>}
      {error && <div className="bg-red-100 text-red-800 p-2 rounded">{error}</div>}
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Списък с желания</h2>
        {loading ? (
          <div className="text-center p-4">Зареждане...</div>
        ) : wishlists.length === 0 ? (
          <div className="text-center p-4 text-gray-500">Няма желания</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-2">Потребител</th>
                <th className="px-2 py-2">Продукти</th>
                <th className="px-2 py-2">Действия</th>
              </tr>
            </thead>
            <tbody>
              {wishlists.map(wl => (
                <tr key={wl._id} className="border-b">
                  <td className="px-2 py-2">
                    {wl.user ? `${wl.user.email} (${wl.user.firstName || ""} ${wl.user.lastName || ""})` : "—"}
                  </td>
                  <td className="px-2 py-2">
                    <ul className="list-disc ml-4">
                      {(wl.products || []).map(p => (
                        <li key={p._id}>
                          {p.name} – {p.price} лв. {p.image && <img src={p.image} alt={p.name} className="inline w-8 h-8 object-cover rounded ml-2" />}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-2 py-2">
                    <button onClick={() => handleDelete(wl._id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded">Изтрий</button>
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

import React, { useEffect, useState } from "react";
import { http } from "../lib/http.js";

export default function AdminWishlist() {
  const [wishlists, setWishlists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWishlists();
  }, []);

  async function fetchWishlists() {
    setLoading(true);
    try {
      const res = await http.get("/api/admin/wishlists");
      setWishlists(res.data || []);
    } catch (e) {
      setError("Грешка при зареждане на wishlist-ите");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold mb-4">Wishlist на потребителите</h2>
      {error && <div className="text-red-600">{error}</div>}
      {loading ? <div>Зареждане...</div> : (
        <table className="w-full text-sm mt-2 border">
          <thead>
            <tr>
              <th>Потребител</th>
              <th>Продукти</th>
            </tr>
          </thead>
          <tbody>
            {wishlists.map(w => (
              <tr key={w._id}>
                <td>{w.user?.email || w.user?.username || w.user}</td>
                <td>{Array.isArray(w.products) ? w.products.map(p => p.name || p._id).join(", ") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

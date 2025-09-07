import React, { useEffect, useState } from "react";
import { http } from "../lib/http.js";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "../components/Helmet";
import PriceDisplay from "../components/PriceDisplay";

const API = import.meta.env.VITE_API_URL;


export default function Profile() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [favLoading, setFavLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    const fetchProfile = async () => {
      try {
        const res = await http.get(`${API}/api/auth/profile`, { withCredentials: true });
        setProfile(res.data.user);
      } catch (err) {
        setError("Грешка при зареждане на профила.");
      }
    };
    const fetchFavorites = async () => {
      try {
        setFavLoading(true);
        const res = await http.get(`${API}/api/auth/favorites`, { withCredentials: true });
        setFavorites(res.data.favorites || []);
      } catch {
        setFavorites([]);
      } finally {
        setFavLoading(false);
      }
    };
    fetchProfile();
    fetchFavorites();
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleRemoveFavorite = async (productId) => {
    try {
      setFavLoading(true);
      await http.delete(`${API}/api/auth/favorites/${productId}`, { withCredentials: true });
      setFavorites(favorites.filter(fav => fav._id !== productId));
    } finally {
      setFavLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Helmet>
        <title>Моят профил | MARK LIGHT LTD</title>
        <meta name="description" content="Вашият профил в MARK LIGHT LTD - редакция на данни, поръчки и настройки." />
      </Helmet>
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Моят профил</h2>
          {error && <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">{error}</div>}
          {profile ? (
            <div className="space-y-4">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Потребителско име:</span> {profile.username}
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Имейл:</span> {profile.email}
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Име:</span> {profile.firstName || '-'}
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Фамилия:</span> {profile.lastName || '-'}
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Дата на регистрация:</span> {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-'}
              </div>
              <div className="flex gap-4 mt-6">
                <button onClick={() => navigate("/")} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">Изход</button>
                <Link to="/orders" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">Моите поръчки</Link>
              </div>
              {/* Любими продукти */}
              <div className="mt-10">
                <h3 className="text-xl font-semibold mb-4">Любими продукти</h3>
                {favLoading ? (
                  <div>Зареждане...</div>
                ) : favorites.length === 0 ? (
                  <div className="text-gray-500">Нямате добавени любими продукти.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {favorites.map(product => (
                      <div
                        key={product._id}
                        className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 w-full min-w-0 mb-2"
                        style={{width:'100%', minWidth:0, maxWidth:'100%'}}
                      >
                        <div className="flex items-center gap-4">
                          <img src={product.image || (product.images && product.images[0]) || '/api/placeholder/100/100'} alt={product.name} className="w-20 h-20 object-contain rounded-lg bg-white" />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 dark:text-white truncate">{product.name}</div>
                            <PriceDisplay price={product.price} priceEUR={product.priceEUR} className="mt-1" />
                          </div>
                        </div>
                        <div className="flex justify-center mt-3">
                          <button
                            onClick={() => handleRemoveFavorite(product._id)}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm shadow"
                            disabled={favLoading}
                          >Премахни</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>Зареждане...</div>
          )}
        </div>
      </div>
    </>
  );
}

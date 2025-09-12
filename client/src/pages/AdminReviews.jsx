import React, { useEffect, useState } from "react";
import { http } from "../lib/http";


export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editReview, setEditReview] = useState(null);

  const fetchReviews = () => {
    setLoading(true);
    http.get("/api/admin/reviews", { withCredentials: true })
      .then(res => {
        console.log("Получени ревюта:", res.data); // DEBUG
        setReviews(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Грешка при зареждане на ревютата");
        setLoading(false);
      });
  };

  useEffect(() => {
    console.log("AdminReviews компонентът се зарежда!"); // DEBUG
    fetchReviews();
  }, []);

  const unansweredCount = reviews.filter(r => !r.reply).length;
  return (
    <div className="p-8">
      <div className="mb-4 text-lg font-semibold text-red-700 dark:text-red-400">
        Неотговорени ревюта: {unansweredCount}
      </div>
      <h1 className="text-2xl font-bold mb-4">Админ Ревюта</h1>
      {loading && <div>Зареждане...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      {!loading && !error && (
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="border px-2 py-1">Оценка</th>
              <th className="border px-2 py-1">Мнение</th>
              <th className="border px-2 py-1">Потребител</th>
              <th className="border px-2 py-1">Продукт</th>
              <th className="border px-2 py-1">Отговор</th>
              <th className="border px-2 py-1">Действия</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map(r => (
              <React.Fragment key={r._id}>
                <tr>
                  <td className="border px-2 py-1 text-yellow-500">{r.rating ? '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating) : '—'}</td>
                  <td className="border px-2 py-1">{r.comment || '—'}</td>
                  <td className="border px-2 py-1">{r.user?.name || r.user?.username || r.user?.email || '—'}</td>
                  <td className="border px-2 py-1">{r.product?.name || '—'}</td>
                  <td className="border px-2 py-1">
                    <button
                      className="bg-red-500 text-white px-2 py-1 rounded mr-2"
                      onClick={async () => {
                        if (window.confirm('Сигурни ли сте, че искате да изтриете това ревю?')) {
                          try {
                            await http.delete(`/api/admin/reviews/${r._id}`, { withCredentials: true });
                            setSuccess('Ревюто е изтрито успешно.'); window.dispatchEvent(new CustomEvent('admin:refresh-stats'));
                            setError("");
                            http.get("/api/admin/reviews", { withCredentials: true })
                              .then(res => {
                                setReviews(res.data);
                                setLoading(false);
                                setTimeout(() => setSuccess(''), 2000);
                              })
                              .catch(() => {
                                setError("Грешка при зареждане на ревютата");
                                setLoading(false);
                                setSuccess("");
                              });
                          } catch (e) {
                            if (e?.response?.status === 404) {
                              setError('Ревюто вече е изтрито или не е намерено.');
                            } else {
                              setError('Грешка при изтриване!');
                            }
                          }
                        }
                      }}
                    >Изтрий</button>
                    <button
                      className="bg-blue-500 text-white px-2 py-1 rounded mr-2"
                      onClick={() => setEditReview(r)}
                    >Редактирай</button>
                    <button
                      className="bg-green-500 text-white px-2 py-1 rounded"
                      onClick={() => setEditReview({ ...r, replyMode: true })}
                    >Отговор</button>
                  </td>
                </tr>
                {/* Форма за отговор към ревю - показва се само ако е избрано за отговор */}
                {editReview && editReview._id === r._id && editReview.replyMode && (
                  <tr>
                    <td colSpan={5} className="border px-2 py-2 bg-transparent dark:bg-gray-900">
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        const reply = e.target.reply.value;
                        try {
                          await http.patch(`/api/admin/reviews/${r._id}`, { reply }, { withCredentials: true });
                          setSuccess('Отговорът е записан успешно и изпратен на потребителя!');
                          setEditReview(null);
                          http.get("/api/admin/reviews", { withCredentials: true })
                            .then(res => setReviews(res.data));
                          setTimeout(() => setSuccess(''), 2000);
                        } catch (err) {
                          setError('Грешка при запис на отговор!');
                        }
                      }}>
                        <input name="reply" defaultValue={r.reply || ''} className="w-full border rounded p-2 text-white bg-transparent dark:bg-transparent placeholder-gray-500" style={{ borderWidth: '1px', minWidth: '350px' }} placeholder="Въведи отговор..." />
                        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Запиши отговор</button>
                        <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded ml-2" onClick={() => setEditReview(null)}>Отказ</button>
                      </form>
                    </td>
                  </tr>
                )}
                {/* Показване на отговора само ако има и не е в режим на писане */}
                {/* Премахнат редът за отговор под ревюто */}
              </React.Fragment>
            ))}

          </tbody>
        </table>
      )}

      {/* Форма за редакция на ревю */}
      {editReview && (
        <div className="mt-8 p-4 border rounded bg-gray-50 dark:bg-gray-800">
          <h2 className="text-xl font-bold mb-2">Редакция на ревю</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await http.patch(`/api/admin/reviews/${editReview._id}`, { comment: e.target.comment.value, rating: Number(e.target.rating.value) }, { withCredentials: true });
                setSuccess('Ревюто е редактирано успешно.');
                setEditReview(null);
                fetchReviews();
                setTimeout(() => setSuccess(''), 2000);
              } catch (err) {
                setError('Грешка при редакция!');
              }
            }}
          >
            <div className="mb-2">
              <label className="block mb-1">Коментар:</label>
              <textarea
                name="comment"
                defaultValue={editReview.comment}
                className="w-full p-2 border rounded bg-white text-black dark:bg-gray-900 dark:text-white"
                rows={3}
                required
              />
            </div>
            <div className="mb-2">
              <label className="block mb-1">Оценка:</label>
              <select name="rating" defaultValue={editReview.rating} className="p-2 border rounded bg-white text-black dark:bg-gray-900 dark:text-white">
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Запази</button>
              <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded" onClick={() => setEditReview(null)}>Отказ</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

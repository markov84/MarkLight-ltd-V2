import React, { useEffect, useState } from "react";
import { http } from "../lib/http";
import { useAuth } from "../context/AuthContext";

export default function AdminSuggestions() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const [respondId, setRespondId] = useState(null);
  const [respondText, setRespondText] = useState("");
  const [success, setSuccess] = useState("");

  const fetchSuggestions = () => {
    setLoading(true);
    http.get("/api/admin/suggestions", { withCredentials: true })
      .then(res => {
        setSuggestions(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Грешка при зареждане на желанията");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Сигурни ли сте, че искате да изтриете това желание?")) return;
    try {
      await http.delete(`/api/admin/suggestions/${id}`, { withCredentials: true });
      setSuccess("Желанието е изтрито успешно.");
      fetchSuggestions();
      setTimeout(() => setSuccess(""), 2000);
    } catch {
      setError("Грешка при триене!");
    }
  };

  const handleEdit = async (id) => {
    try {
      await http.patch(`/api/admin/suggestions/${id}`, { text: editText }, { withCredentials: true });
      setSuccess("Желанието е редактирано успешно.");
      setEditId(null);
      fetchSuggestions();
      setTimeout(() => setSuccess(""), 2000);
    } catch {
      setError("Грешка при редакция!");
    }
  };

  const handleRespond = async (id) => {
    try {
      await http.post(`/api/admin/suggestions/${id}/respond`, { response: respondText }, { withCredentials: true });
      setSuccess("Отговорът е записан успешно.");
      setRespondText("");
      fetchSuggestions();
      setTimeout(() => setSuccess(""), 2000);
    } catch {
      setError("Грешка при записване на отговор!");
    }
  };

  if (!user?.isAdmin) {
    return <div className="p-8 max-w-3xl mx-auto text-center text-red-600">Само администратори могат да виждат тази страница.</div>;
  }

  const unansweredCount = suggestions.filter(s => !s.response).length;
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-4 text-lg font-semibold text-red-700 dark:text-red-400">
        Неотговорени предложения/препоръки: {unansweredCount}
      </div>
      <h1 className="text-2xl font-bold mb-4">Желания и препоръки</h1>
      {/* Форма за добавяне на желание/препоръка */}
      <div className="mb-8 p-4 border rounded bg-gray-50 dark:bg-gray-800">
        <h2 className="text-lg font-bold mb-2">Добави желание или препоръка</h2>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const text = e.target.text.value;
          if (!text || text.length < 3) return setError('Въведете желание или препоръка!');
          try {
            await http.post('/api/wish-suggestion', { text }, { withCredentials: true });
            setSuccess('Желанието е изпратено успешно!');
            fetchSuggestions();
            e.target.text.value = "";
            setTimeout(() => setSuccess(''), 2000);
          } catch {
            setError('Грешка при изпращане!');
          }
        }}>
          <textarea name="text" className="w-full p-2 border rounded mb-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-500" rows={3} placeholder="Вашето желание или препоръка..." required />
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Изпрати</button>
        </form>
      </div>
      {loading && <div>Зареждане...</div>}
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      {!loading && suggestions.length === 0 && <div>Няма желания или препоръки.</div>}
      {!loading && suggestions.length > 0 && (
        <table className="min-w-full border mb-8">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="border px-2 py-1">Текст</th>
              <th className="border px-2 py-1">Потребител</th>
              <th className="border px-2 py-1">Дата</th>
              <th className="border px-2 py-1">Отговор</th>
              <th className="border px-2 py-1">Действия</th>
            </tr>
          </thead>
          <tbody>
            {suggestions.map(s => (
              <tr key={s._id}>
                <td className="border px-2 py-1">
                  {editId === s._id ? (
                    <input
                      className="w-full border rounded p-1 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-500"
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                    />
                  ) : s.text}
                </td>
                <td className="border px-2 py-1">
                  {s.user
                    ? <>
                        <div>{`${s.user.firstName || ''} ${s.user.lastName || ''}`.trim()}</div>
                        <div className="text-xs text-gray-500">{s.user.email}</div>
                      </>
                    : '-'}
                </td>
                <td className="border px-2 py-1">{new Date(s.createdAt).toLocaleString()}</td>
                <td className="border px-2 py-1">
                  {s.response ? (
                    <span className="text-green-700">{s.response}</span>
                  ) : (
                    respondId === s._id ? (
                      <form onSubmit={e => {e.preventDefault(); handleRespond(s._id);}}>
                        <input
                          className="w-full border rounded p-1 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-500"
                          value={respondText}
                          onChange={e => setRespondText(e.target.value)}
                          placeholder="Въведи отговор..."
                        />
                        <button type="submit" className="bg-green-500 text-white px-2 py-1 rounded mt-2">Запиши отговор</button>
                        <button type="button" className="bg-gray-400 text-white px-2 py-1 rounded mt-2 ml-2" onClick={() => {setRespondId(null); setRespondText("");}}>Отказ</button>
                      </form>
                    ) : null
                  )}
                </td>
                <td className="border px-2 py-1">
                  <button className="bg-red-500 text-white px-2 py-1 rounded mr-2" onClick={() => handleDelete(s._id)}>Изтрий</button>
                  {editId === s._id ? (
                    <button className="bg-blue-500 text-white px-2 py-1 rounded mr-2" onClick={() => handleEdit(s._id)}>Запази</button>
                    ) : (
                    <button className="bg-gray-400 text-white px-2 py-1 rounded mr-2" onClick={() => {setEditId(s._id); setEditText(s.text);}}>Редактирай</button>
                  )}
                  {!s.response && respondId !== s._id && (
                    <button className="bg-green-500 text-white px-2 py-1 rounded" onClick={() => {setRespondId(s._id); setRespondText("");}}>Отговори</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

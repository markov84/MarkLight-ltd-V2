import http from "../lib/http";
import { useEffect, useState } from "react";

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    http.get("/api/messages", { withCredentials: true })
      .then(res => {
        setMessages(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);
  if (loading) return <div>Зареждане...</div>;
  if (!messages.length) return <div>Нямате нови съобщения от админа.</div>;
  const unreadCount = messages.filter(m => m.read === false).length;
  return (
    <div className="p-4">
      <div className="mb-4 text-lg font-semibold text-red-700 dark:text-red-400">
        Непрочетени съобщения: {unreadCount}
      </div>
      <h2 className="text-lg font-bold mb-2">Съобщения от админа</h2>
      <ul>
        {messages.map(m => (
          <li key={m._id} className="mb-2 p-2 border rounded bg-gray-50 dark:bg-gray-800">
            <div>{m.text}</div>
            <div className="text-xs text-gray-500">Получено: {new Date(m.sentAt).toLocaleString()}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

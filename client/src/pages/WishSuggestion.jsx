import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { http } from "../lib/http";

export default function WishSuggestion() {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await http.post("/api/wish-suggestion", { text }, { withCredentials: true });
      setSuccess("Благодарим за вашето желание/препоръка!");
      setText("");
    } catch (e) {
      setError("Грешка при изпращане!");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Остави желание или препоръка</h1>
      {!user && (
        <div className="bg-yellow-100 text-yellow-800 p-4 rounded mb-4 text-center">
          Само регистрирани потребители могат да оставят мнения и препоръки.
        </div>
      )}
      {user && (
        <>
          {success && <div className="text-green-600 mb-2">{success}</div>}
          {error && <div className="text-red-600 mb-2">{error}</div>}
          <form onSubmit={handleSubmit}>
            <textarea
              className="w-full p-2 border rounded mb-4 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-500"
              rows={5}
              placeholder="Вашето желание или препоръка..."
              value={text}
              onChange={e => setText(e.target.value)}
              required
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded"
              disabled={loading}
            >Изпрати</button>
          </form>
        </>
      )}
    </div>
  );
}

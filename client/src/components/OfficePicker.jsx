import React, { useEffect, useState } from "react";
const API = import.meta.env.VITE_API_URL || "";

export default function OfficePicker({ carrier, value, onChange, city }) {
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!carrier || !city) return;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        if (carrier === "econt") {
          const res = await fetch(`${API}/api/shipping/econt/offices`, { method: "GET" });
          const data = await res.json();
          // normalize (Econt returns nested structure)
          const list = (data?.offices || data?.offices?.office || data?.officesList || [])
            .map(o => ({ id: o.id || o.code || o.officeCode, name: o.name || o.officeName }));
          setOffices(list);
        } else if (carrier === "speedy") {
          // Speedy requires session/login; for demo we just show placeholder
          setOffices([]);
        }
      } catch (e) {
        setError("Грешка при зареждане на офиси");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [carrier, city]);

  if (!carrier) return null;

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium">Офис / Автомат ({carrier})</label>
      {loading ? <div>Зареждане...</div> : (
        <select className="w-full border rounded px-3 py-2" value={value || ""} onChange={e => onChange(e.target.value)}>
          <option value="">-- Избери офис --</option>
          {offices.map(o => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      )}
      {error && <div className="text-red-600 text-sm">{error}</div>}
    </div>
  );
}

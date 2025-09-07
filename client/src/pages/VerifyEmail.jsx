import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { http } from "../lib/http.js";
import { useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "../components/Helmet";

const API = import.meta.env.VITE_API_URL;

export default function VerifyEmail() {
  
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchProfile } = useAuth();
  const emailFromState = location.state?.email || "";
  const [email, setEmail] = useState(emailFromState);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setErr(""); setMsg("");
    try {
      const res = await http.post(`${API}/api/auth/verify-email`, { email, code });
      setMsg(res.data?.msg || "Потвърдено!");
      // След успешна верификация – опресни профила и навигирай
      setTimeout(async () => {
        if (fetchProfile) await fetchProfile();
        navigate("/");
      }, 800);
    } catch (e) {
      setErr(e.response?.data?.msg || "Грешка при потвърждение");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setLoading(true); setErr(""); setMsg("");
    try {
      const res = await http.post(`${API}/api/auth/resend-code`, { email });
      setMsg(res.data?.msg || "Нов код е изпратен");
    } catch (e) {
      setErr(e.response?.data?.msg || "Грешка при изпращане");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (msg || err) {
      const timer = setTimeout(() => {
        setMsg("");
        setErr("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [msg, err]);

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow">
      <Helmet>
        <title>Потвърждение на имейл | Mark Light</title>
      </Helmet>
      <h1 className="text-2xl font-semibold mb-4">Потвърждение на имейл</h1>
      <p className="text-sm text-gray-500 mb-4">Изпратихме 5-цифрен код на вашия имейл. Въведете го, за да потвърдите регистрацията си.</p>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="text-xs text-gray-500 mb-1">Паролата трябва да е между 8 и 30 символа.</div>
        <input type="email" className="w-full border rounded-lg p-3 text-gray-900 dark:text-white bg-white dark:bg-gray-800" placeholder="Имейл" value={email} onChange={(e)=>setEmail(e.target.value)} required />
        <input inputMode="numeric" pattern="\d{5}" maxLength={5} className="w-full border rounded-lg p-3 tracking-widest text-center text-xl text-gray-900 dark:text-white bg-white dark:bg-gray-800" placeholder="Код (5 цифри)" value={code} onChange={(e)=>setCode(e.target.value.replace(/\D/g,''))} required />
        <button disabled={loading} className="w-full py-3 rounded-lg bg-blue-600 text-white">{loading ? "Моля изчакайте…" : "Потвърди"}</button>
      </form>
      <div className="flex justify-between mt-3">
        <button onClick={resend} className="text-blue-600">Изпрати нов код</button>
        <button onClick={()=>navigate('/login')} className="text-gray-500">Към вход</button>
      </div>
      {msg && <div className="mt-3 text-green-600">{msg}</div>}
      {err && <div className="mt-3 text-red-600">{err}</div>}
    </div>
  );
}

import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const baseURL = (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.replace(/\/+$/, "")) || window.location.origin;

const api = axios.create({
  baseURL,
  withCredentials: true,
});

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (signal) => {
    try {
      setLoading(true);
      const res = await api.get("/api/auth/profile", { signal });
      setUser(res.data.user ?? null);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const ctrl = new AbortController();
    fetchProfile(ctrl.signal);
    return () => ctrl.abort();
  }, []);

  const login = async (username, password) => {
    const res = await api.post("/api/auth/login", { username, password });
    await fetchProfile();
    return res.data;
  };

  const logout = async (navigate) => {
    await api.post("/api/auth/logout", {});
    setUser(null);
    if (navigate) navigate("/");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

 import React, { createContext, useContext, useState, useEffect } from "react";
import { http } from "../lib/http.js";

const API = import.meta.env.VITE_API_URL;
const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from backend using httpOnly cookie
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data } = await http.get(`${API}/api/auth/profile`, { withCredentials: true });
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line
  }, []);

  const login = async (username, password) => {
    await http.post(`${API}/api/auth/login`, { username, password }, { withCredentials: true });
    await fetchProfile();
  };

  const logout = async (navigate) => {
    await http.post(`${API}/api/auth/logout`, {}, { withCredentials: true });
    setUser(null);
    if (navigate) {
      navigate("/");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
 
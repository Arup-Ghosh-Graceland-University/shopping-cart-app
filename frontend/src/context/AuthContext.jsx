// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import api from "../api";

// Create context
const AuthContext = createContext();

// Provider: holds user state + login/logout functions
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { id, name, email } or null
  const [loading, setLoading] = useState(true); // while checking /auth/me

  // On first load, ask backend "who am I?"
  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const res = await api.get("/auth/me");
        setUser(res.data.user); // if cookie is valid, user exists
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchCurrentUser();
  }, []);

  function login(userData) {
    setUser(userData);
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout error:", err);
    }
    setUser(null);
  }

  const value = { user, loading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth
export function useAuth() {
  return useContext(AuthContext);
}

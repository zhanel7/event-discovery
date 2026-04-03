import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiFetch, clearTokens, getApiBaseUrl, setTokens } from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    const access = localStorage.getItem("access_token");
    const refresh = localStorage.getItem("refresh_token");
    if (!access) {
      setUser(null);
      setLoading(false);
      return;
    }
    const r = await apiFetch("/auth/me");
    if (r.status === 401 && refresh) {
      // Try to refresh token
      const base = getApiBaseUrl();
      const refr = await fetch(`${base}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refresh }),
      });
      if (refr.ok) {
        const data = await refr.json();
        setTokens(data.access_token, data.refresh_token);
        const r2 = await apiFetch("/auth/me");
        if (r2.ok) {
          setUser(await r2.json());
        } else {
          setUser(null);
          clearTokens();
        }
      } else {
        setUser(null);
        clearTokens();
      }
    } else if (r.ok) {
      setUser(await r.json());
    } else {
      setUser(null);
      clearTokens();
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const login = async (email, password) => {
    const base = getApiBaseUrl();
    const r = await fetch(`${base}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.detail || "Login failed");
    setTokens(data.access_token, data.refresh_token);
    await loadMe();
  };

  const register = async (email, password) => {
    const base = getApiBaseUrl();
    const r = await fetch(`${base}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role: "user" }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Registration failed");
    const lr = await fetch(`${base}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const tok = await lr.json();
    if (!lr.ok) throw new Error("Auto-login failed");
    setTokens(tok.access_token, tok.refresh_token);
    await loadMe();
  };

  const logout = async () => {
    const access = localStorage.getItem("access_token");
    if (access) {
      try {
        await fetch(`${getApiBaseUrl()}/auth/logout`, { method: "POST" });
      } catch {
        /* ignore */
      }
    }
    clearTokens();
    setUser(null);
  };

  const refreshUser = loadMe;

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
}

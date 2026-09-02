"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { api, AuthUser } from "@/lib/api";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: async () => {},
});

export function getSessionCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export function setSessionCookie(name: string, value: string, days = 7) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
  const secure = isHttps ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${secure}`;
}

export function removeSessionCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize session on mount
  useEffect(() => {
    // 🛡️ SECURITY HARDENING: Purge any legacy tokens stored in localStorage
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("agri_token");
        localStorage.removeItem("agri_user");
      } catch {
        // ignore
      }
    }

    const savedToken = getSessionCookie("agri_token");
    const savedUserJson = getSessionCookie("agri_user");

    if (savedToken) {
      setToken(savedToken);
      if (savedUserJson) {
        try {
          setUser(JSON.parse(savedUserJson));
        } catch {
          // ignore
        }
      }

      // Verify active session with backend
      api
        .getMe()
        .then((me) => {
          setUser(me);
          setSessionCookie("agri_user", JSON.stringify(me));
        })
        .catch(() => {
          // If token expired or invalid, clear session
          removeSessionCookie("agri_token");
          removeSessionCookie("agri_user");
          setToken(null);
          setUser(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
    setSessionCookie("agri_token", newToken);
    setSessionCookie("agri_user", JSON.stringify(newUser));
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    removeSessionCookie("agri_token");
    removeSessionCookie("agri_user");
    setToken(null);
    setUser(null);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import api from "../lib/axios";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "receptionist";
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadMe = async () => {
      if (window.location.pathname === "/login") {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const res = await api.get("/users/me");
        if (mounted) setUser(res.data.data.user);
      } catch (err: unknown) {
        if (isAxiosError(err) && err.response?.status === 401) {
          if (mounted) setUser(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadMe();

    return () => {
      mounted = false;
    };
  }, []);

  const logout = async () => {
    try {
      await api.post("/users/logout");
    } catch (error) {
      console.error("Logout API failed", error);
    } finally {
      setUser(null);
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
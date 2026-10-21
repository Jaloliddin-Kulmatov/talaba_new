import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, loadToken, setToken, setUnauthorizedHandler, TOKEN_KEY } from "./api";
import { kv, secure } from "./storage";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  /** true until the stored token has been checked once */
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (d: { name: string; email: string; password: string; university?: string; region?: string }) => Promise<string | null>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateProfile: (p: Partial<Pick<User, "name" | "university" | "region" | "funding_type">>) => Promise<string | null>;
  deleteAccount: () => Promise<string | null>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signOut = useCallback(async () => {
    setToken(null);
    await secure.del(TOKEN_KEY);
    setUser(null);
  }, []);

  const finish = async (token: string, u: User) => {
    setToken(token);
    await secure.set(TOKEN_KEY, token);
    setUser(u);
  };

  useEffect(() => {
    setUnauthorizedHandler(() => { signOut(); });
    (async () => {
      const t = await loadToken();
      if (t) {
        const r = await api.get<{ user: User }>("/auth/me");
        if (r.data) setUser(r.data.user);
        else if (r.status === 401 || r.status === 422) await signOut();   // offline keeps the session
      }
      setLoading(false);
    })();
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  const value = useMemo<AuthState>(() => ({
    user, loading,
    login: async (email, password) => {
      const r = await api.post<{ token: string; user: User }>("/auth/login", { email: email.trim(), password });
      if (!r.data) return r.error ?? "Kirib bo'lmadi.";
      await finish(r.data.token, r.data.user);
      return null;
    },
    register: async (d) => {
      const r = await api.post<{ token: string; user: User }>("/auth/register", { ...d, email: d.email.trim() });
      if (!r.data) return r.error ?? "Ro'yxatdan o'tib bo'lmadi.";
      await finish(r.data.token, r.data.user);
      return null;
    },
    logout: signOut,
    refresh: async () => {
      const r = await api.get<{ user: User }>("/auth/me");
      if (r.data) setUser(r.data.user);
    },
    updateProfile: async (p) => {
      const r = await api.patch<{ user: User }>("/auth/me", p);
      if (!r.data) return r.error ?? "Saqlab bo'lmadi.";
      setUser(r.data.user);
      return null;
    },
    deleteAccount: async () => {
      const r = await api.del("/auth/me", { confirm: "DELETE" });
      if (r.error) return r.error;
      await kv.del("talaba:synced:v1");
      await signOut();
      return null;
    },
  }), [user, loading, signOut]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside <AuthProvider>");
  return c;
}

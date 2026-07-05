"use client";

// Auth context. The bearer token lives in memory only (no localStorage, per the
// project standards), so it persists across in-app navigation but not a hard
// refresh. sourceRef: docs/hackathon/API_CONTRACT.md (auth endpoints).

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { apiRequest } from "@/lib/api-client";
import type { ApiError, User } from "@/lib/types";

type LoginResult = { ok: true } | { ok: false; error: ApiError };

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isReady: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (email: string, password: string, name: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    const result = await apiRequest<{ token: string; user: User }>("POST", "/api/auth/login", {
      body: { email, password },
    });
    if (!result.ok) return { ok: false, error: result.error };
    setToken(result.data.token);
    setUser(result.data.user);
    return { ok: true };
  }, []);

  const register = useCallback(
    async (email: string, password: string, name: string): Promise<LoginResult> => {
      const registered = await apiRequest<User>("POST", "/api/auth/register", {
        body: { email, password, name },
      });
      if (!registered.ok) return { ok: false, error: registered.error };
      return login(email, password);
    },
    [login],
  );

  const logout = useCallback(async () => {
    const currentToken = token;
    setToken(null);
    setUser(null);
    if (currentToken) {
      await apiRequest("POST", "/api/auth/logout", { token: currentToken });
    }
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, isReady: true, login, register, logout }),
    [user, token, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("[useAuth] must be used within an AuthProvider");
  }
  return context;
}

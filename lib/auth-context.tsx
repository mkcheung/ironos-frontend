"use client";

import React, { createContext, useCallback, useContext, useRef, useState } from "react";

export interface User {
  id: number;
  username: string;
  email: string;
  onboarding_complete?: boolean;
}

interface AuthContextValue {
  accessToken: string | null;
  user: User | null;
  setTokens: (accessToken: string, user: User) => void;
  clearTokens: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Module-level ref so api-client.ts can read the token without React context
let _accessToken: string | null = null;

export function getAccessToken(): string | null {
  return _accessToken;
}

/** Updates only the module-level ref after a silent token refresh — does not touch React state */
export function updateAccessToken(token: string): void {
  _accessToken = token;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const setTokens = useCallback((token: string, userData: User) => {
    _accessToken = token;
    setAccessToken(token);
    setUser(userData);
  }, []);

  const clearTokens = useCallback(() => {
    _accessToken = null;
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ accessToken, user, setTokens, clearTokens }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

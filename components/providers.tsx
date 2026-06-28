"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { SessionProvider } from "next-auth/react";

import { AuthProvider, useAuth } from "@/lib/auth-context";
import { registerAuthHandlers } from "@/lib/api-client";

function ApiClientBridge() {
  const { setTokens, clearTokens } = useAuth();

  useEffect(() => {
    registerAuthHandlers(setTokens, clearTokens);
  }, [setTokens, clearTokens]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <AuthProvider>
        <ApiClientBridge />
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </AuthProvider>
    </SessionProvider>
  );
}

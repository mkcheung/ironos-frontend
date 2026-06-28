import { getAccessToken as getTokenFromContext, updateAccessToken } from "@/lib/auth-context";
import { notify } from "@/lib/notify";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Will be set by AuthProvider once available in client context
let _clearTokensFn: (() => void) | null = null;
let _setTokensFn: ((access: string, user: import("@/lib/auth-context").User) => void) | null =
  null;

/** Called once by AuthProvider to wire up the logout callback */
export function registerAuthHandlers(
  setTokens: (access: string, user: import("@/lib/auth-context").User) => void,
  clearTokens: () => void
): void {
  _setTokensFn = setTokens;
  _clearTokensFn = clearTokens;
}

type FetchOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

async function refreshAccessToken(): Promise<string | null> {
  const res = await fetch("/api/auth/refresh", { method: "POST" });
  if (!res.ok) {
    notify.warning("Session expired. Please sign in again.");
    _clearTokensFn?.();
    return null;
  }
  const data = (await res.json()) as { access?: string };
  if (!data.access) {
    notify.warning("Session expired. Please sign in again.");
    _clearTokensFn?.();
    return null;
  }
  updateAccessToken(data.access);
  return data.access;
}

export async function apiClient<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const token = getTokenFromContext();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      const retryResponse = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
      });
      if (!retryResponse.ok) {
        throw new Error(`API error: ${retryResponse.status}`);
      }
      return retryResponse.json() as Promise<T>;
    }
    _clearTokensFn?.();
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

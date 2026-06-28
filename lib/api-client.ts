const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type FetchOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

async function getAccessToken(): Promise<string | null> {
  // Placeholder — auth token retrieval will be implemented in Step 8
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

async function refreshAccessToken(): Promise<string | null> {
  // Placeholder — refresh logic finalized in Step 8
  return null;
}

export async function apiClient<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const token = await getAccessToken();

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
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

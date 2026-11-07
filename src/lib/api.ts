import { serializedSavedRead } from "./saved-read";

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    let message = "Your changes could not be saved. Please try again.";
    try {
      const body: unknown = await response.json();
      if (body && typeof body === "object" && "error" in body && typeof body.error === "string") {
        message = body.error;
      }
    } catch {
      // A gateway can return an HTML error before the application handles a request.
    }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if ((init.method ?? "GET").toUpperCase() === "GET") {
    const locks = typeof navigator === "undefined" ? undefined : navigator.locks;
    return serializedSavedRead(() => request<T>(path, init), locks, init.signal);
  }
  return request<T>(path, init);
}

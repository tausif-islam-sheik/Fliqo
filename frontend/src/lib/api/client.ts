// Typed fetch wrapper: access token in memory, refresh via httpOnly cookie (PDF p.24).
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

let accessToken: string | null = null;
export function setAccessToken(t: string | null) {
  accessToken = t;
}
export function getAccessToken() {
  return accessToken;
}

async function refresh(): Promise<boolean> {
  try {
    const r = await fetch(`${API}/auth/refresh`, { method: "POST", credentials: "include" });
    if (!r.ok) return false;
    const body = (await r.json()) as { accessToken?: string };
    if (body.accessToken) {
      accessToken = body.accessToken;
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function api<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (init.headers) {
    for (const [k, v] of new Headers(init.headers).entries()) headers[k] = v;
  }
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
  const res = await fetch(`${API}${path}`, { ...init, headers, credentials: "include" });
  if (res.status === 401 && retry) {
    const ok = await refresh();
    if (ok) return api<T>(path, init, false);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

import { API_BASE } from "./config";
import { secure } from "./storage";

export const TOKEN_KEY = "talaba_token";

export interface ApiResult<T> {
  data: T | null;
  error: string | null;
  status: number;
  code?: string;
}

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;
export const setToken = (t: string | null) => { token = t; };
export const getToken = () => token;
export const setUnauthorizedHandler = (fn: (() => void) | null) => { onUnauthorized = fn; };
export const loadToken = async () => { token = await secure.get(TOKEN_KEY); return token; };

async function request<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<ApiResult<T>> {
  const headers: Record<string, string> = { Accept: "application/json", ...(init.headers as Record<string, string> | undefined) };
  let body = init.body;
  if (init.json !== undefined) { headers["Content-Type"] = "application/json"; body = JSON.stringify(init.json); }
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const res = await fetch(`${API_BASE}${path}`, { ...init, headers, body });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      // an expired token on a signed-in session: sign out cleanly instead of showing odd errors everywhere
      if ((res.status === 401 || res.status === 422) && token && !path.startsWith("/auth/")) onUnauthorized?.();
      return { data: null, error: json.error || json.msg || "Nimadir noto'g'ri ketdi.", status: res.status, code: json.code };
    }
    return { data: json as T, error: null, status: res.status };
  } catch {
    return { data: null, error: "Serverga ulanib bo'lmadi. Internetni tekshirib, qayta urinib ko'ring.", status: 0 };
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, json?: unknown) => request<T>(path, { method: "POST", json: json ?? {} }),
  put: <T>(path: string, json: unknown) => request<T>(path, { method: "PUT", json }),
  patch: <T>(path: string, json: unknown) => request<T>(path, { method: "PATCH", json }),
  del: <T>(path: string, json?: unknown) => request<T>(path, { method: "DELETE", json }),
  /** multipart upload (e.g. CV file). `file` is what expo-document-picker returns. */
  upload: <T>(path: string, file: { uri: string; name: string; mimeType?: string; webFile?: Blob }) => {
    const fd = new FormData();
    if (file.webFile) fd.append("file", file.webFile, file.name);
    else fd.append("file", { uri: file.uri, name: file.name, type: file.mimeType || "application/octet-stream" } as unknown as Blob);
    return request<T>(path, { method: "PUT", body: fd });
  },
};

export const qs = (o: Record<string, string | number | boolean | undefined | null>) =>
  new URLSearchParams(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== "" && v !== false).map(([k, v]) => [k, String(v)])).toString();

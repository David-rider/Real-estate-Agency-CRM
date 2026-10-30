// Small fetch wrapper: adds the auth token, parses JSON, and sends expired
// sessions back to the login page.
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  body: any;
  constructor(status: number, body: any) {
    super((body && body.error) || `Request failed (${status})`);
    this.status = status;
    this.body = body;
  }
}

export async function api<T = any>(path: string, options: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method || "GET",
    credentials: "include",
    headers: {
      "X-CSRF-Protection": "1",
      ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(options.auth !== false && token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { error: text }; }

  if (res.status === 401 && options.auth !== false && typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }
  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}

export interface UploadedFileResponse {
  id: string;
  storageKey: string;
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  visibility: "PUBLIC" | "PRIVATE";
}

export async function uploadFile(file: File, visibility: "PUBLIC" | "PRIVATE" = "PUBLIC"): Promise<UploadedFileResponse> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("visibility", visibility);

  const res = await fetch(`${API_URL}/api/uploads`, {
    method: "POST",
    credentials: "include",
    headers: {
      "X-CSRF-Protection": "1",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { error: text }; }

  if (res.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }
  if (!res.ok) throw new ApiError(res.status, data);
  return data as UploadedFileResponse;
}

// <input type="date"> / "datetime-local" values carry no time zone. Convert them in
// the browser so the server stores the moment the user meant, not UTC midnight.
export function dateInputToISO(value: string | null | undefined, endOfDay = false): string | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const d = m
    ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), endOfDay ? 23 : 12, endOfDay ? 59 : 0)
    : new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

const pad = (n: number) => String(n).padStart(2, "0");

export function isoToDateInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

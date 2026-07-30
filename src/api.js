// Tiny API client. The backend URL is set at build time via VITE_API_URL.
const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
let token = localStorage.getItem("ahq_token") || "";
export const setToken = (t) => { token = t; localStorage.setItem("ahq_token", t); };
export const clearToken = () => { token = ""; localStorage.removeItem("ahq_token"); };
export const hasToken = () => !!token;

// Routes where a 401 means "this specific request was rejected" (wrong
// login credentials, wrong current password) rather than "the session
// token itself is invalid" — those must not force-logout the user.
const NOT_A_SESSION_EXPIRY = ["/api/auth/login", "/api/auth/change-password"];

export async function api(path, opts = {}) {
  const res = await fetch(BASE + path, {
    method: opts.method || "GET",
    headers: { ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: "Bearer " + token } : {}) },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  if (res.status === 401 && !NOT_A_SESSION_EXPIRY.some((p) => path.startsWith(p))) { clearToken(); location.reload(); return; }
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Request failed (" + res.status + ")");
  return res.status === 204 ? null : res.json();
}

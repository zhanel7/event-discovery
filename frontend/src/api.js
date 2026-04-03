/**
 * Базовый URL API (в Docker: тот же хост, порт 8000).
 */
export function getApiBaseUrl() {
  return import.meta.env.VITE_API_URL || "http://localhost:8000";
}

const API_BASE = getApiBaseUrl();

function getTokens() {
  const access = localStorage.getItem("access_token");
  const refresh = localStorage.getItem("refresh_token");
  return { access, refresh };
}

export function setTokens(access, refresh) {
  if (access) localStorage.setItem("access_token", access);
  if (refresh) localStorage.setItem("refresh_token", refresh);
}

export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

async function tryRefresh() {
  const { refresh } = getTokens();
  if (!refresh) return null;
  const r = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refresh }),
  });
  if (!r.ok) return null;
  const data = await r.json();
  setTokens(data.access_token, data.refresh_token);
  return data.access_token;
}

export async function apiFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const { access } = getTokens();
  if (access && !headers.Authorization) {
    headers.Authorization = `Bearer ${access}`;
  }
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  let res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 401 && access) {
    const newAccess = await tryRefresh();
    if (newAccess) {
      headers.Authorization = `Bearer ${newAccess}`;
      res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    }
  }
  return res;
}

export { API_BASE };

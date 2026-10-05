import axios from "axios";

const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const API_HOST = import.meta.env.VITE_API_URL || (isLocalhost ? "http://localhost:5009" : "https://ercp-backend-production-81a5.up.railway.app");
const API_BASE = `${API_HOST}/api`;

export const getStoredToken = () => {
  try {
    return localStorage.getItem("ercp_token") || null;
  } catch {
    return null;
  }
};

export const setStoredAuth = (token, user) => {
  try {
    if (token) localStorage.setItem("ercp_token", token);
    else localStorage.removeItem("ercp_token");

    if (user) localStorage.setItem("ercp_user", JSON.stringify(user));
    else localStorage.removeItem("ercp_user");
  } catch {
    // ignore storage exceptions
  }
};

export const clearStoredAuth = () => {
  try {
    localStorage.removeItem("ercp_token");
    localStorage.removeItem("ercp_user");
  } catch {
    // ignore storage exceptions
  }
};

// Configure Axios global interceptors for all teammate services
axios.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token && !config.headers["Authorization"]) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || "";
      if (!url.includes("/auth/login") && !url.includes("/auth/register")) {
        clearStoredAuth();
        window.dispatchEvent(new CustomEvent("ercp:unauthorized"));
      }
    }
    return Promise.reject(error);
  }
);

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("ercp_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export async function request(endpoint, options = {}) {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const token = getStoredToken();
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(url, config);

  if (response.status === 401) {
    // Unauthorized: token might be expired or missing
    // Don't auto-redirect if checking auth/login endpoints
    if (!endpoint.includes("/auth/login") && !endpoint.includes("/auth/register")) {
      clearStoredAuth();
      window.dispatchEvent(new CustomEvent("ercp:unauthorized"));
    }
  }

  return response;
}

export async function apiGet(endpoint, params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      query.append(k, v);
    }
  });
  const qs = query.toString();
  const url = qs ? `${endpoint}?${qs}` : endpoint;
  const res = await request(url, { method: "GET" });
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(errorBody || `GET ${endpoint} failed with status ${res.status}`);
  }
  return res.json();
}

export async function apiPost(endpoint, body = {}) {
  const res = await request(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
    throw new Error(errorBody.message || `POST ${endpoint} failed with status ${res.status}`);
  }
  return res.json();
}

export async function apiPut(endpoint, body = {}) {
  const res = await request(endpoint, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
    throw new Error(errorBody.message || `PUT ${endpoint} failed with status ${res.status}`);
  }
  return res.status === 204 ? null : res.json().catch(() => null);
}

export async function apiDelete(endpoint) {
  const res = await request(endpoint, { method: "DELETE" });
  if (!res.ok) {
    throw new Error(`DELETE ${endpoint} failed with status ${res.status}`);
  }
  return true;
}

export { API_BASE, API_HOST };

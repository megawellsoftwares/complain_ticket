const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

function authHeaders() {
  const token = localStorage.getItem("token");
  const h = {};
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export async function api(path, options = {}) {
  const { body, headers: optHeaders, ...rest } = options;
  const headers = { ...authHeaders(), ...optHeaders };
  const isForm = body instanceof FormData;
  if (!isForm) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers,
    body: isForm ? body : body != null ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg =
      data?.message ||
      data?.error ||
      (typeof data?.error === "object" ? JSON.stringify(data.error) : null) ||
      res.statusText;
    const err = new Error(msg || "Request failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function assetUrl(relativePath) {
  if (!relativePath) return "";
  let normalized = String(relativePath).replace(/\\/g, "/");
  if (normalized.startsWith("http")) return normalized;
  const idx = normalized.toLowerCase().indexOf("uploads/");
  if (idx >= 0) normalized = normalized.slice(idx);
  return `${BASE}/${normalized.replace(/^\//, "")}`;
}

export { BASE };

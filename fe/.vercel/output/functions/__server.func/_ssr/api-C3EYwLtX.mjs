import { s as supabase } from "./supabase-CicGwi1Y.mjs";
const API_BASE = "http://localhost:8000/api";
async function apiFetch(endpoint, options = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (options.body instanceof FormData) {
    headers.delete("Content-Type");
  } else if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });
  if (!response.ok) {
    let errMessage = response.statusText;
    try {
      const errBody = await response.json();
      errMessage = errBody.detail || errBody.message || errMessage;
    } catch {
    }
    throw new Error(errMessage);
  }
  return response.json();
}
export {
  apiFetch as a
};

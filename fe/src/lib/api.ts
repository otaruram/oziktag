import { supabase } from "./supabase";

// Automatically use Render backend in Production, and localhost in Development
export const API_BASE = import.meta.env.PROD 
  ? "https://api-oziktag.my.id/api" 
  : "http://localhost:8000/api";

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  // Remove manual content-type if we are sending FormData
  if (options.body instanceof FormData) {
    headers.delete("Content-Type");
  } else if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errMessage = response.statusText;
    try {
      const errBody = await response.json();
      errMessage = errBody.detail || errBody.message || errMessage;
    } catch {}
    throw new Error(errMessage);
  }

  return response.json();
}

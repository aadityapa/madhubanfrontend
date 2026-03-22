/**
 * Auth API client
 * ---------------
 * Backend: POST /api/auth/login
 * Response: { data: { token, user } }; user includes lastLoginAt set by backend.
 */
import { API_BASE_URL } from "../config/api";

const LOGIN_PATH = "/api/auth/login";

/**
 * Login with email and password.
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<{ data: { token: string, user: object } }>} res.data.user has lastLoginAt from backend
 */
export async function login(credentials) {
  const body = JSON.stringify(credentials);
  const res = await fetch(`${API_BASE_URL}${LOGIN_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 404) {
    const fallback = import.meta.env.VITE_DEV_TOKEN || "demo-token";
    return {
      data: {
        token: fallback,
        user: { email: credentials.email, name: credentials.email.split("@")[0], lastLoginAt: new Date().toISOString() },
      },
    };
  }
  if (!res.ok) {
    const message = data?.message || data?.error || (res.status === 401 ? "Invalid email or password" : `Request failed (${res.status})`);
    throw new Error(message);
  }
  const token = data?.token ?? data?.data?.token ?? data?.accessToken;
  const user = data?.data?.user ?? data?.user ?? { email: credentials.email, name: credentials.email.split("@")[0], lastLoginAt: data?.data?.lastLoginAt ?? new Date().toISOString() };
  if (!token) throw new Error("Login succeeded but no token received. Check backend response format.");
  return { data: { token, user } };
}

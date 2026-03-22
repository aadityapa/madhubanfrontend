import type { AuthUser, LoginCredentials } from "@madhuban/types";
import { allowDemo404Fallback, getApiBaseUrl, getDevTokenFallback } from "./env";

const LOGIN_PATH = "/api/auth/login";

export interface LoginResult {
  data: { token: string; user: AuthUser };
}

export async function login(credentials: LoginCredentials): Promise<LoginResult> {
  const API_BASE_URL = getApiBaseUrl();
  const body = JSON.stringify(credentials);
  const res = await fetch(`${API_BASE_URL}${LOGIN_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (res.status === 404 && allowDemo404Fallback()) {
    const fallback = getDevTokenFallback();
    return {
      data: {
        token: fallback,
        user: {
          email: credentials.email,
          name: credentials.email.split("@")[0],
          lastLoginAt: new Date().toISOString(),
        },
      },
    };
  }
  if (!res.ok) {
    const message =
      (data.message as string) ||
      (data.error as string) ||
      (res.status === 401
        ? "Invalid email or password"
        : `Request failed (${res.status})`);
    throw new Error(message);
  }
  const token =
    (data.token as string) ??
    (data.data as { token?: string } | undefined)?.token ??
    (data.accessToken as string);
  const user =
    (data.data as { user?: AuthUser } | undefined)?.user ??
    (data.user as AuthUser) ?? {
      email: credentials.email,
      name: credentials.email.split("@")[0],
      lastLoginAt:
        (data.data as { lastLoginAt?: string } | undefined)?.lastLoginAt ??
        new Date().toISOString(),
    };
  if (!token) {
    throw new Error(
      "Login succeeded but no token received. Check backend response format.",
    );
  }
  return { data: { token, user } };
}

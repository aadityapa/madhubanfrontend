import type { AuthUser } from "@madhuban/types";
import { allowDemo404Fallback, getApiBaseUrl, getDevTokenFallback } from "./env";

const LOGIN_PATH = "/api/auth/login";
const FORGOT_PATHS = ["/api/auth/send-otp"];
const VERIFY_OTP_PATHS = [
  "/api/auth/verify-otp",
  "/api/auth/verify",
  "/api/users/verify-otp",
];
const RESET_PATHS = [
  "/api/auth/reset-password",
  "/api/auth/change-password",
  "/api/users/reset-password",
];

export function normalizeMobile(mobile: string): string {
  const digits = String(mobile || "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

export async function mobileLogin(
  mobile: string,
  password: string,
): Promise<{ token: string; user: AuthUser }> {
  const API_BASE_URL = getApiBaseUrl();
  const trimmed = String(mobile || "").trim();
  const normalized = normalizeMobile(trimmed);
  const isEmail = trimmed.includes("@");

  if (!password?.trim()) {
    throw new Error("Password is required.");
  }
  if (!isEmail && (!normalized || normalized.length < 10)) {
    throw new Error("Please enter a valid 10-digit mobile number or email.");
  }

  const payload = {
    password: password.trim(),
    email: isEmail ? trimmed : `${normalized}@mobile`,
    username: isEmail ? trimmed : normalized,
    phone: normalized || undefined,
    mobile: normalized || undefined,
  };
  const body = JSON.stringify(payload);

  let lastRes: Response | undefined;
  let lastData: Record<string, unknown> = {};
  try {
    const url = `${API_BASE_URL}${LOGIN_PATH}`.replace(/([^:]\/)\/+/g, "$1");
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    lastRes = res;
    lastData = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network")) {
      throw new Error("Network error. Please check your connection and try again.");
    }
    throw err;
  }

  if (lastRes?.status === 404 && allowDemo404Fallback()) {
    const fallback = getDevTokenFallback();
    const fallbackUser: AuthUser = {
      name: isEmail ? trimmed.split("@")[0] : "User",
      mobile: normalized,
    };
    return { token: fallback, user: fallbackUser };
  }

  if (!lastRes?.ok) {
    const msg =
      (lastData.message as string) ||
      (lastData.error as string) ||
      (lastRes?.status === 401
        ? "Invalid mobile number or password"
        : `Request failed (${lastRes?.status})`);
    throw new Error(msg);
  }

  const token =
    (lastData.token as string) ??
    (lastData.data as { token?: string } | undefined)?.token ??
    (lastData.accessToken as string);
  if (!token) {
    throw new Error("Login succeeded but no token received.");
  }

  const user =
    (lastData.data as { user?: AuthUser } | undefined)?.user ??
    (lastData.user as AuthUser) ?? { name: "User", mobile: normalized };
  return { token, user };
}

export async function requestOtp(mobile: string): Promise<unknown> {
  const API_BASE_URL = getApiBaseUrl();
  const normalized = normalizeMobile(mobile);
  if (!normalized || normalized.length < 10) {
    throw new Error("Please enter a valid 10-digit mobile number.");
  }

  const body = JSON.stringify({ mobile: normalized, phone: normalized });

  let lastRes: Response | undefined;
  let lastData: Record<string, unknown> = {};
  try {
    for (const path of FORGOT_PATHS) {
      const res = await fetch(`${API_BASE_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      lastRes = res;
      lastData = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (res.status !== 404) break;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network")) {
      throw new Error("Network error. Please check your connection and try again.");
    }
    throw err;
  }

  if (lastRes?.status === 404 && allowDemo404Fallback()) {
    return { success: true, message: "OTP sent (demo mode)" };
  }

  if (!lastRes?.ok) {
    const errMsg =
      (lastData.message as string) ||
      (lastData.error as string) ||
      `Request failed (${lastRes?.status})`;
    throw new Error(errMsg);
  }

  return lastData;
}

export async function verifyOtp(mobile: string, otp: string): Promise<unknown> {
  const API_BASE_URL = getApiBaseUrl();
  const normalized = normalizeMobile(mobile);
  if (!normalized || normalized.length < 10) {
    throw new Error("Invalid mobile number.");
  }
  const otpStr = String(otp || "").replace(/\D/g, "");
  if (otpStr.length < 4) {
    throw new Error("Please enter a valid OTP.");
  }

  const body = JSON.stringify({
    mobile: normalized,
    otp: otpStr,
    code: otpStr,
  });

  let lastRes: Response | undefined;
  let lastData: Record<string, unknown> = {};
  try {
    for (const path of VERIFY_OTP_PATHS) {
      const res = await fetch(`${API_BASE_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      lastRes = res;
      lastData = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (res.status !== 404) break;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network")) {
      throw new Error("Network error. Please check your connection and try again.");
    }
    throw err;
  }

  if (lastRes?.status === 404 && allowDemo404Fallback()) {
    return { success: true, resetToken: "demo-reset-token" };
  }

  if (!lastRes?.ok) {
    const errMsg =
      (lastData.message as string) || (lastData.error as string) || "Invalid OTP";
    throw new Error(errMsg);
  }

  return lastData;
}

export async function resetPasswordWithOtp(
  mobile: string,
  otp: string,
  newPassword: string,
  resetToken?: string,
): Promise<unknown> {
  const API_BASE_URL = getApiBaseUrl();
  const normalized = normalizeMobile(mobile);
  if (!normalized || normalized.length < 10) {
    throw new Error("Invalid mobile number.");
  }
  if (!newPassword?.trim() || newPassword.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const body = JSON.stringify({
    mobile: normalized,
    otp: String(otp || "").replace(/\D/g, ""),
    newPassword: newPassword.trim(),
    password: newPassword.trim(),
    resetToken: resetToken || undefined,
  });

  let lastRes: Response | undefined;
  let lastData: Record<string, unknown> = {};
  try {
    for (const path of RESET_PATHS) {
      const res = await fetch(`${API_BASE_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      lastRes = res;
      lastData = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (res.status !== 404) break;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network")) {
      throw new Error("Network error. Please check your connection and try again.");
    }
    throw err;
  }

  if (lastRes?.status === 404 && allowDemo404Fallback()) {
    return { success: true };
  }

  if (!lastRes?.ok) {
    const errMsg =
      (lastData.message as string) ||
      (lastData.error as string) ||
      `Request failed (${lastRes?.status})`;
    throw new Error(errMsg);
  }

  return lastData;
}

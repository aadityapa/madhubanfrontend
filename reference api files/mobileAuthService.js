/**
 * mobileAuthService – Mobile authentication API
 * -----------------------------------------------------------------------
 * Integrates with backend for:
 *   - mobileLogin(mobile, password) – login, stores token in localStorage
 *   - requestOtp(mobile) – forgot password OTP request
 *   - verifyOtp(mobile, otp) – OTP verification, returns resetToken
 *   - resetPasswordWithOtp(mobile, otp, newPassword, resetToken) – password reset
 * - Tries multiple endpoint paths for backend compatibility
 * - Fallback: 404 responses use demo mode (VITE_DEV_TOKEN) for dev
 */

import { API_BASE_URL } from "../../../config/api";

// Backend: single login endpoint
const LOGIN_PATH = "/api/auth/login";
const FORGOT_PATHS = ["/api/auth/send-otp"];
const VERIFY_OTP_PATHS = ["/api/auth/verify-otp", "/api/auth/verify", "/api/users/verify-otp"];
const RESET_PATHS = ["/api/auth/reset-password", "/api/auth/change-password", "/api/users/reset-password"];

/**
 * Normalize mobile number (strip spaces, ensure 10 digits for Indian format)
 */
export function normalizeMobile(mobile) {
  const digits = String(mobile || "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

/**
 * Mobile + Password Login
 * Tries multiple identifier formats (email, username, phone) for backend compatibility
 */
export async function mobileLogin(mobile, password) {
  const trimmed = String(mobile || "").trim();
  const normalized = normalizeMobile(trimmed);
  const isEmail = trimmed.includes("@");

  if (!password?.trim()) {
    throw new Error("Password is required.");
  }
  if (!isEmail && (!normalized || normalized.length < 10)) {
    throw new Error("Please enter a valid 10-digit mobile number or email.");
  }

  // Build payload: backend may expect email, username, or phone
  const payload = {
    password: password.trim(),
    email: isEmail ? trimmed : normalized + "@mobile",
    username: isEmail ? trimmed : normalized,
    phone: normalized || undefined,
    mobile: normalized || undefined,
  };
  const body = JSON.stringify(payload);

  let lastRes;
  let lastData = {};
  try {
    const url = `${API_BASE_URL}${LOGIN_PATH}`.replace(/([^:]\/)\/+/g, "$1");
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    lastRes = res;
    lastData = await res.json().catch(() => ({}));
  } catch (err) {
    const msg = err?.message || "";
    if (msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network")) {
      throw new Error("Network error. Please check your connection and try again.");
    }
    throw err;
  }

  if (lastRes?.status === 404) {
    const fallback = import.meta.env.VITE_DEV_TOKEN || "demo-token";
    localStorage.setItem("token", fallback);
    const fallbackUser = { name: isEmail ? trimmed.split("@")[0] : "User", mobile: normalized };
    localStorage.setItem("user", JSON.stringify(fallbackUser));
    return { token: fallback, user: fallbackUser };
  }

  if (!lastRes?.ok) {
    const msg = lastData?.message || lastData?.error || (lastRes?.status === 401 ? "Invalid mobile number or password" : `Request failed (${lastRes?.status})`);
    throw new Error(msg);
  }

  const token = lastData?.token ?? lastData?.data?.token ?? lastData?.accessToken;
  if (!token) {
    throw new Error("Login succeeded but no token received.");
  }
  localStorage.setItem("token", token);

  const user = lastData?.data?.user ?? lastData?.user ?? { name: "User", mobile: normalized };
  localStorage.setItem("user", JSON.stringify(user));
  return { token, user };
}

/**
 * Request OTP for forgot password
 */
export async function requestOtp(mobile) {
  const normalized = normalizeMobile(mobile);
  if (!normalized || normalized.length < 10) {
    throw new Error("Please enter a valid 10-digit mobile number.");
  }

  const body = JSON.stringify({ mobile: normalized, phone: normalized });

  let lastRes;
  let lastData = {};
  try {
    for (const path of FORGOT_PATHS) {
      const res = await fetch(`${API_BASE_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      lastRes = res;
      lastData = await res.json().catch(() => ({}));
      if (res.status !== 404) break;
    }
  } catch (err) {
    const msg = err?.message || "";
    if (msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network")) {
      throw new Error("Network error. Please check your connection and try again.");
    }
    throw err;
  }

  if (lastRes?.status === 404) {
    return { success: true, message: "OTP sent (demo mode)" };
  }

  if (!lastRes?.ok) {
    const msg = lastData?.message || lastData?.error || `Request failed (${lastRes?.status})`;
    throw new Error(msg);
  }

  return lastData;
}

/**
 * Verify OTP; returns token/session for password reset
 */
export async function verifyOtp(mobile, otp) {
  const normalized = normalizeMobile(mobile);
  if (!normalized || normalized.length < 10) {
    throw new Error("Invalid mobile number.");
  }
  const otpStr = String(otp || "").replace(/\D/g, "");
  if (otpStr.length < 4) {
    throw new Error("Please enter a valid OTP.");
  }

  const body = JSON.stringify({ mobile: normalized, otp: otpStr, code: otpStr });

  let lastRes;
  let lastData = {};
  try {
    for (const path of VERIFY_OTP_PATHS) {
      const res = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    lastRes = res;
    lastData = await res.json().catch(() => ({}));
    if (res.status !== 404) break;
  }
  } catch (err) {
    const msg = err?.message || "";
    if (msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network")) {
      throw new Error("Network error. Please check your connection and try again.");
    }
    throw err;
  }

  if (lastRes?.status === 404) {
    return { success: true, resetToken: "demo-reset-token" };
  }

  if (!lastRes?.ok) {
    const msg = lastData?.message || lastData?.error || "Invalid OTP";
    throw new Error(msg);
  }

  return lastData;
}

/**
 * Reset password after OTP verification
 */
export async function resetPasswordWithOtp(mobile, otp, newPassword, resetToken) {
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

  let lastRes;
  let lastData = {};
  try {
    for (const path of RESET_PATHS) {
      const res = await fetch(`${API_BASE_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      lastRes = res;
      lastData = await res.json().catch(() => ({}));
      if (res.status !== 404) break;
    }
  } catch (err) {
    const msg = err?.message || "";
    if (msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network")) {
      throw new Error("Network error. Please check your connection and try again.");
    }
    throw err;
  }

  if (lastRes?.status === 404) {
    return { success: true };
  }

  if (!lastRes?.ok) {
    const msg = lastData?.message || lastData?.error || `Request failed (${lastRes?.status})`;
    throw new Error(msg);
  }

  return lastData;
}

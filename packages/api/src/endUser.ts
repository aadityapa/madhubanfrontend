import type { AuthUser, Task } from "@madhuban/types";
import { getApiBaseUrl } from "./env";
import { getAuthHeaders, readJsonOrThrow } from "./client";
import { normalizeTask } from "./tasks";

const API = () => `${getApiBaseUrl()}/api`;
const STAFF_TASKS_URL = () => `${API()}/staff/tasks`;

export async function getCurrentUser(): Promise<AuthUser & Record<string, unknown>> {
  const res = await fetch(`${API()}/users/me`, { headers: getAuthHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 404) {
      return {
        name: "Demo User",
        email: "demo@madhuban.local",
        role: "staff",
      } as AuthUser & Record<string, unknown>;
    }
    throw new Error(
      (data as { message?: string }).message ||
        (data as { error?: string }).error ||
        "Failed to fetch user",
    );
  }
  return ((data as { data?: unknown }).data ??
    (data as { user?: unknown }).user ??
    data) as AuthUser & Record<string, unknown>;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<unknown> {
  const res = await fetch(`${API()}/users/me/change-password`, {
    method: "PUT",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (res.status === 404) {
    throw new Error("Change password not yet available. Please contact support.");
  }
  return readJsonOrThrow(res);
}

export async function updateUserProfile(payload: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${API()}/users/me`, {
    method: "PUT",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  return readJsonOrThrow(res);
}

export async function getMyTasks(filters: { status?: string } = {}): Promise<Task[]> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  const qs = params.toString();
  const url = qs ? `${STAFF_TASKS_URL()}?${qs}` : STAFF_TASKS_URL();
  const res = await fetch(url, { headers: getAuthHeaders() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(
      (json as { message?: string }).message || "Failed to fetch tasks",
    );
  }
  const data = (json as { data?: unknown }).data;
  const list = Array.isArray(data)
    ? data
    : ((data as { tasks?: unknown[] })?.tasks ?? (json as { tasks?: unknown[] }).tasks ?? []);
  return (list as Record<string, unknown>[]).map(normalizeTask);
}

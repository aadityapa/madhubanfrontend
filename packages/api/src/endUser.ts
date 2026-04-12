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

export async function getMyTaskById(id: string): Promise<Task> {
  const res = await fetch(`${STAFF_TASKS_URL()}/${id}`, { headers: getAuthHeaders() });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const msg =
      (json.message as string) ||
      (json.error as string) ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }
  const task =
    ((json.data as { task?: unknown } | undefined)?.task ??
      (json.data as unknown) ??
      json) as Record<string, unknown>;
  return normalizeTask(task);
}

export async function updateMyTaskStatus(taskId: string, status: string): Promise<unknown> {
  const res = await fetch(`${STAFF_TASKS_URL()}/${taskId}/status`, {
    method: "PATCH",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ status }),
  });
  return readJsonOrThrow(res);
}

export async function startMyTask(
  taskId: string,
  payload: { notes?: string } = {},
): Promise<unknown> {
  const res = await fetch(`${STAFF_TASKS_URL()}/${taskId}/start`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  return readJsonOrThrow(res);
}

export async function submitMyTaskCompletion(
  taskId: string,
  payload: { beforePhoto?: Blob; afterPhoto?: Blob; notes?: string },
): Promise<unknown> {
  const hasFiles = Boolean(payload.beforePhoto || payload.afterPhoto);
  if (!hasFiles) {
    const res = await fetch(`${STAFF_TASKS_URL()}/${taskId}/complete`, {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ notes: payload.notes ?? "" }),
    });
    return readJsonOrThrow(res);
  }

  const formData = new FormData();
  if (payload.beforePhoto) formData.append("before", payload.beforePhoto);
  if (payload.afterPhoto) formData.append("after", payload.afterPhoto);
  if (payload.notes) formData.append("notes", payload.notes);

  const headers = getAuthHeaders();
  // Ensure multipart boundary set by fetch
  delete headers["Content-Type"];

  const res = await fetch(`${STAFF_TASKS_URL()}/${taskId}/complete`, {
    method: "POST",
    headers,
    body: formData,
  });
  return readJsonOrThrow(res);
}

export async function checkIn(location?: string): Promise<unknown> {
  const res = await fetch(`${API()}/attendance/check-in`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ location: location || "Lobby, Building A" }),
  });
  return readJsonOrThrow(res);
}

export async function checkOut(): Promise<unknown> {
  const res = await fetch(`${API()}/attendance/check-out`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({}),
  });
  return readJsonOrThrow(res);
}

export async function getTodayAttendance(): Promise<unknown> {
  const res = await fetch(`${API()}/attendance/today`, { headers: getAuthHeaders() });
  // backend may 404 if not implemented; keep non-throwing behavior for UI
  if (!res.ok && res.status !== 404) return readJsonOrThrow(res);
  return (await res.json().catch(() => ({}))) as unknown;
}

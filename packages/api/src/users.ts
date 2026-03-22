import { getApiBaseUrl } from "./env";
import { getAuthHeaders } from "./client";

const API_BASE = () => `${getApiBaseUrl()}/api/users`;

function normalizeUser(u: Record<string, unknown>): Record<string, unknown> {
  const role = String(u.role ?? "");
  const status = String(u.status ?? "");
  return {
    ...u,
    _id: String(u.id ?? u._id ?? ""),
    role: role ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() : "",
    status: status
      ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
      : "",
    phone: u.phone ?? u.phoneNumber ?? "",
    jobTitle: u.jobTitle ?? u.job_title ?? "",
    department:
      u.department ?? u.primaryDepartment ?? u.primary_department ?? "",
  };
}

export async function getUsers(): Promise<Record<string, unknown>[]> {
  const res = await fetch(`${API_BASE()}?limit=9999&page=1`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch users");
  const json = (await res.json()) as Record<string, unknown>;
  const users =
    (json.data as { users?: unknown[] })?.users ??
    (json as { users?: unknown[] }).users ??
    (Array.isArray(json) ? json : []);
  return (users as Record<string, unknown>[]).map(normalizeUser);
}

export async function getUsersForAssignee(): Promise<Record<string, unknown>[]> {
  try {
    const res = await fetch(`${API_BASE()}/staff`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch staff users");
    const json = (await res.json()) as Record<string, unknown>;
    const users =
      (Array.isArray(json.data) && json.data) ||
      (json.data as { users?: unknown[] })?.users ||
      (json as { users?: unknown[] }).users ||
      (Array.isArray(json) ? json : []);
    return (users as Record<string, unknown>[]).map(normalizeUser);
  } catch (err) {
    console.error("getUsersForAssignee error:", err);
    return [];
  }
}

export async function getSupervisors(): Promise<unknown[]> {
  const res = await fetch(`${API_BASE()}/supervisors`, {
    headers: getAuthHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (json as { message?: string }).message ??
      (json as { error?: string }).error ??
      "Failed to fetch supervisors";
    throw new Error(msg);
  }
  const list =
    (json as { data?: unknown[] }).data ??
    (json as { supervisors?: unknown[] }).supervisors ??
    [];
  return Array.isArray(list) ? list : [];
}

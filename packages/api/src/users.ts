import { getApiBaseUrl } from "./env";
import { getAuthHeaders, readJsonOrThrow } from "./client";

const API_BASE = () => `${getApiBaseUrl()}/api/users`;
const API_ROLES = () => `${getApiBaseUrl()}/api/roles`;
const API_DEPARTMENTS = () => `${getApiBaseUrl()}/api/departments`;

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

export async function getManagers(): Promise<unknown[]> {
  const res = await fetch(`${API_BASE()}/managers`, { headers: getAuthHeaders() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (json as { message?: string }).message ??
      (json as { error?: string }).error ??
      "Failed to fetch managers";
    throw new Error(msg);
  }
  const list =
    (json as { data?: unknown[] }).data ??
    (json as { managers?: unknown[] }).managers ??
    [];
  return Array.isArray(list) ? list : [];
}

export async function getUserById(id: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${API_BASE()}/${id}`, { headers: getAuthHeaders() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (json as { message?: string }).message ??
      (json as { error?: string }).error ??
      "Failed to fetch user";
    throw new Error(msg);
  }
  const user =
    (json as { data?: { user?: Record<string, unknown> } }).data?.user ??
    ((json as { data?: Record<string, unknown> }).data ?? (json as Record<string, unknown>));
  return user ? (normalizeUser(user as Record<string, unknown>) as Record<string, unknown>) : null;
}

export async function createUser(data: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(API_BASE(), {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  return readJsonOrThrow(res);
}

export async function updateUser(id: string, data: Record<string, unknown>): Promise<unknown> {
  const payload = {
    name: data.name?.toString().trim() ?? "",
    email: data.email?.toString().trim() ?? "",
    username: (data.username as string) ?? (data.email as string) ?? "",
    role: String(data.role ?? "staff").toLowerCase(),
    status: String(data.status ?? "active").toLowerCase(),
    ...(data.phone != null && { phone: data.phone }),
    ...(data.jobTitle != null && { jobTitle: data.jobTitle }),
  };
  const res = await fetch(`${API_BASE()}/${id}`, {
    method: "PUT",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  return readJsonOrThrow(res);
}

export async function deleteUser(id: string): Promise<unknown> {
  const res = await fetch(`${API_BASE()}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return readJsonOrThrow(res);
}

export async function resetPassword(
  id: string,
  newPassword: string,
): Promise<unknown> {
  const res = await fetch(`${API_BASE()}/${id}/reset-password`, {
    method: "PUT",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ password: newPassword }),
  });
  return readJsonOrThrow(res);
}

export async function getRoles(): Promise<unknown[]> {
  const res = await fetch(API_ROLES(), { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch roles");
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  const list = (json.data as unknown[]) ?? (Array.isArray(json) ? json : []);
  return Array.isArray(list) ? list : [];
}

let departmentsCache: unknown[] | null = null;
let departmentsPromise: Promise<unknown[]> | null = null;

export async function getDepartments(): Promise<unknown[]> {
  if (departmentsCache) return departmentsCache;
  if (departmentsPromise) return departmentsPromise;
  departmentsPromise = (async () => {
    const res = await fetch(API_DEPARTMENTS(), { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch departments");
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const list = (json.data as unknown[]) ?? (Array.isArray(json) ? json : []);
    departmentsCache = Array.isArray(list) ? list : [];
    return departmentsCache;
  })();
  return departmentsPromise;
}

export async function getDepartmentById(departmentId: string): Promise<unknown> {
  const id = departmentId ?? "1";
  const res = await fetch(`${API_DEPARTMENTS()}/${id}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch department");
  const json = await res.json().catch(() => ({}));
  return (json as { data?: unknown }).data ?? json;
}

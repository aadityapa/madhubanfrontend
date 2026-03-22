/**
 * User API Service
 * ----------------
 * Backend: GET/POST/PUT/DELETE /api/users (via Vite proxy in dev)
 */

import { API_BASE_URL } from "../../config/api";
import { readJsonOrThrow, getAuthHeaders } from "../../lib/apiClient";

const API_BASE = `${API_BASE_URL}/api/users`;
const API_ROLES = `${API_BASE_URL}/api/roles`;
const API_DEPARTMENTS = `${API_BASE_URL}/api/departments`;

function normalizeUser(u) {
  return {
    ...u,
    _id: String(u.id ?? u._id ?? ""),
    role: (u.role ?? "").charAt(0).toUpperCase() + (u.role ?? "").slice(1).toLowerCase(),
    status: (u.status ?? "").charAt(0).toUpperCase() + (u.status ?? "").slice(1).toLowerCase(),
    lastLogin: u.lastLoginAt ? formatLastLogin(u.lastLoginAt) : (u.lastLogin ?? "-"),
    phone: u.phone ?? u.phoneNumber ?? "",
    jobTitle: u.jobTitle ?? u.job_title ?? "",
    department: u.department ?? u.primaryDepartment ?? u.primary_department ?? "",
  };
}

function formatLastLogin(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} mins ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
}

export async function getUsers() {
  try {
    // Fetch all users: backend defaults to limit=10, pass high limit to get all
    const res = await fetch(`${API_BASE}?limit=9999&page=1`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch users");
    const json = await res.json();
    const users = json?.data?.users ?? json?.users ?? (Array.isArray(json) ? json : []);
    return users.map(normalizeUser);
  } catch (err) {
    console.error("getUsers error:", err);
    throw err;
  }
}

/** GET {{baseUrl}}/api/users/staff - fetch staff users for assignee dropdown (Create/Edit Task) */
export async function getUsersForAssignee() {
  try {
    const res = await fetch(`${API_BASE}/staff`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch staff users");
    const json = await res.json();
    const users =
      (Array.isArray(json?.data) && json.data) ||
      json?.data?.users ||
      json?.users ||
      (Array.isArray(json) ? json : []);
    return (users || []).map(normalizeUser);
  } catch (err) {
    console.error("getUsersForAssignee error:", err);
    return [];
  }
}

export async function getUserById(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    headers: getAuthHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.message ?? json?.error ?? "Failed to fetch user";
    throw new Error(msg);
  }
  const user = json?.data?.user ?? json?.data ?? json;
  return user ? normalizeUser(user) : null;
}

export async function updateUser(id, data) {
  // Backend expects: name, email, username, role, status, phone (optional)
  const payload = {
    name: data.name?.trim() ?? "",
    email: data.email?.trim() ?? "",
    username: data.username ?? data.email ?? "",
    role: (data.role ?? "staff").toLowerCase(),
    status: (data.status ?? "active").toLowerCase(),
    ...(data.phone != null && { phone: data.phone }),
    ...(data.jobTitle != null && { jobTitle: data.jobTitle }),
  };
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.message ?? json?.error ?? `Request failed (${res.status})`;
    throw new Error(msg);
  }
  const user = json?.data ?? json?.user ?? json;
  return user ? normalizeUser(user) : json;
}

export async function deleteUser(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  return await readJsonOrThrow(res);
}

export async function resetPassword(id, newPassword) {
  const res = await fetch(`${API_BASE}/${id}/reset-password`, {
    method: "PUT",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ password: newPassword }),
  });

  return await readJsonOrThrow(res);
}

/** GET /api/roles - Fetch all roles for dropdowns */
export async function getRoles() {
  const res = await fetch(API_ROLES, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch roles");
  const json = await res.json();
  const list = json?.data ?? (Array.isArray(json) ? json : []);
  return list;
}

let departmentsCache = null;
let departmentsPromise = null;

/** GET /api/departments - Fetch all departments for dropdowns (cached, one request) */
export async function getDepartments() {
  if (departmentsCache) return departmentsCache;
  if (departmentsPromise) return departmentsPromise;
  departmentsPromise = (async () => {
    const res = await fetch(API_DEPARTMENTS, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch departments");
    const json = await res.json();
    const list = json?.data ?? (Array.isArray(json) ? json : []);
    departmentsCache = list;
    return list;
  })();
  return departmentsPromise;
}

/** GET /api/departments/:id - Fetch a single department by id (e.g. for Job Title) */
export async function getDepartmentById(departmentId) {
  const id = departmentId ?? 1;
  const res = await fetch(`${API_DEPARTMENTS}/${id}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch department");
  const json = await res.json();
  const dept = json?.data ?? json;
  return dept;
}

/** GET /api/users/supervisors - Fetch supervisors list for Staff role dropdown */
export async function getSupervisors() {
  const res = await fetch(`${API_BASE}/supervisors`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch supervisors");
  const json = await res.json();
  const list = json?.data ?? (Array.isArray(json) ? json : []);
  return list;
}

/** GET /api/users/managers - Fetch managers list for Supervisor role dropdown */
export async function getManagers() {
  const res = await fetch(`${API_BASE}/managers`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch managers");
  const json = await res.json();
  const list = json?.data ?? (Array.isArray(json) ? json : []);
  return list;
}

export async function createUser(data) {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });

  return await readJsonOrThrow(res);
}

export async function exportUsersToExcel(users = []) {
  const XLSX = await import("xlsx");
  const rows = (users || []).map((u) => ({
    ID: u._id ?? "",
    Name: u.name ?? "",
    Email: u.email ?? "",
    Phone: u.phone ?? "",
    Role: u.role ?? "",
    Status: u.status ?? "",
    "Job Title": u.jobTitle ?? "",
    "Last Login": u.lastLogin ?? "",
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Users");
  XLSX.writeFile(wb, `users-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

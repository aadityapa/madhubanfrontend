/**
 * endUserService – End user backend API
 * -----------------------------------------------------------------------
 * All calls use token from localStorage (getAuthHeaders).
 * Backend: API_BASE_URL/api (proxy in dev)
 *
 * User: getCurrentUser, updateUserProfile, changePassword
 * Tasks: getMyTasks, getTaskById, updateTaskStatus, submitTaskCompletion
 * Attendance: checkIn, getTodayAttendance
 *
 * Fallbacks for 404 (demo mode): getFallbackUser, getFallbackTasks, getFallbackTask
 */

import { API_BASE_URL } from "../../../config/api";
import { getAuthHeaders, readJsonOrThrow } from "../../../lib/apiClient";

const API = `${API_BASE_URL}/api`;
/** GET /api/staff/tasks - in dev (localhost:5173) this is http://localhost:5173/api/staff/tasks (proxied to backend) */
const STAFF_TASKS_URL = `${API}/staff/tasks`;

/* ---------- USER / PROFILE (Database: users collection) ---------- */

/** Backend: GET /api/users/me - fetch current logged-in user profile from database */
export async function getCurrentUser() {
  const res = await fetch(`${API}/users/me`, { headers: getAuthHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 404) return getFallbackUser();
    throw new Error(data?.message || data?.error || "Failed to fetch user");
  }
  return data?.data ?? data?.user ?? data;
}

/** Backend: PUT /api/users/me/change-password - change password for logged-in user; saved to database */
export async function changePassword(currentPassword, newPassword) {
  const res = await fetch(`${API}/users/me/change-password`, {
    method: "PUT",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (res.status === 404) throw new Error("Change password not yet available. Please contact support.");
  return readJsonOrThrow(res);
}

/** Backend: PUT /api/users/me - update current user profile; saved to database */
export async function updateUserProfile(payload) {
  const res = await fetch(`${API}/users/me`, {
    method: "PUT",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  return readJsonOrThrow(res);
}

/* ---------- TASKS (Database: tasks collection) ---------- */

/** Backend: GET /api/staff/tasks - fetch tasks assigned to current user. Sends user login token in header: Authorization: Bearer <token>. */
export async function getMyTasks(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  const qs = params.toString();
  const url = qs ? `${STAFF_TASKS_URL}?${qs}` : STAFF_TASKS_URL;
  const res = await fetch(url, { headers: getAuthHeaders() }); // token from localStorage (set on login)
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 404) return getFallbackTasks();
    throw new Error(json?.message || "Failed to fetch tasks");
  }
  // API shape: { success, data: { summary: { done, left }, tasks: [...] } } or { data: [...] }
  const data = json?.data;
  const list = Array.isArray(data) ? data : (data?.tasks ?? json?.tasks ?? []);
  return (list || []).map(normalizeTask);
}

/**
 * GET /api/staff/tasks - fetch assigned tasks and summary.
 * Returns { summary: { done, left }, tasks } for dashboard (data.summary + data.tasks).
 */
export async function getMyTasksWithSummary(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  const qs = params.toString();
  const url = qs ? `${STAFF_TASKS_URL}?${qs}` : STAFF_TASKS_URL;
  const res = await fetch(url, { headers: getAuthHeaders() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 404) {
      const fallback = getFallbackTasks();
      return { summary: { done: 0, left: fallback.length }, tasks: fallback };
    }
    throw new Error(json?.message || "Failed to fetch tasks");
  }
  const data = json?.data;
  const list = Array.isArray(data) ? data : (data?.tasks ?? json?.tasks ?? []);
  const tasks = (list || []).map(normalizeTask);
  const summary = data?.summary ?? {
    done: tasks.filter((t) => (t.status || "").toUpperCase() === "COMPLETED").length,
    left: tasks.filter((t) => !["COMPLETED"].includes((t.status || "").toUpperCase())).length,
  };
  return { summary: { done: Number(summary.done) || 0, left: Number(summary.left) ?? tasks.length }, tasks };
}

/** Backend: GET /api/staff/tasks - fetch assigned tasks (alias for dashboard) */
export async function getMyAssignedTasks() {
  return getMyTasks({});
}

/** Backend: GET /api/staff/tasks/:id - fetch single task by id from database */
export async function getTaskById(id) {
  const res = await fetch(`${STAFF_TASKS_URL}/${id}`, { headers: getAuthHeaders() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 404) return getFallbackTask(id);
    throw new Error(json?.message || "Failed to fetch task");
  }
  const task = json?.data?.task ?? json?.data ?? json;
  return normalizeTask(task);
}

/** Backend: PATCH /api/staff/tasks/:id/status - update task status in database */
export async function updateTaskStatus(taskId, status) {
  const res = await fetch(`${STAFF_TASKS_URL}/${taskId}/status`, {
    method: "PATCH",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ status }),
  });
  return readJsonOrThrow(res);
}

/** Backend: POST /api/staff/tasks/:id/complete - submit task completion with photos; saved to database */
export async function submitTaskCompletion(taskId, { beforePhoto, afterPhoto, notes }) {
  const formData = new FormData();
  if (beforePhoto) formData.append("before", beforePhoto);
  if (afterPhoto) formData.append("after", afterPhoto);
  if (notes) formData.append("notes", notes);

  const headers = getAuthHeaders();
  delete headers["Content-Type"];

  const res = await fetch(`${STAFF_TASKS_URL}/${taskId}/complete`, {
    method: "POST",
    headers,
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 404) return { success: true, id: `MG-${Date.now()}-B` };
    throw new Error(data?.message || data?.error || "Failed to submit");
  }
  return data?.data ?? data;
}

/* ---------- ATTENDANCE (Database: attendance collection) ---------- */

/** Backend: POST /api/attendance/check-in - record check-in; saved to database */
export async function checkIn(location) {
  const res = await fetch(`${API}/attendance/check-in`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ location: location || "Lobby, Building A" }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 404) return { success: true, checkedIn: true };
    throw new Error(data?.message || "Check-in failed");
  }
  return data?.data ?? data;
}

/** Backend: POST /api/attendance/check-out - record check-out (if backend supports it) */
export async function checkOut() {
  const res = await fetch(`${API}/attendance/check-out`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 404) return { success: true, checkedIn: false };
    throw new Error(data?.message || "Check-out failed");
  }
  return data?.data ?? data;
}

/** Backend: GET /api/attendance/today - fetch today's attendance status from database */
export async function getTodayAttendance() {
  const res = await fetch(`${API}/attendance/today`, { headers: getAuthHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok && res.status !== 404) throw new Error(data?.message || "Failed to fetch attendance");
  return data?.data ?? data ?? { checkedIn: false };
}

/* ---------- HELPERS ---------- */

/** Format duration in minutes to "X min" or "Xh Y min" for display */
export function formatTaskDuration(minutes) {
  if (minutes == null || Number.isNaN(Number(minutes))) return null;
  const m = Math.round(Number(minutes));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const mins = m % 60;
  return mins ? `${h}h ${mins} min` : `${h}h`;
}

/** Format due date/time as readable end time (e.g. "22 Feb 2026, 11:59 PM") */
export function formatTaskEndTime(due) {
  if (due == null || due === "") return null;
  const d = new Date(due);
  if (Number.isNaN(d.getTime())) return null;
  const dateStr = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const timeStr = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  const isMidnight = d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0;
  if (isMidnight) {
    return `${dateStr}, End of day`;
  }
  return `${dateStr}, ${timeStr}`;
}

function normalizeTask(t) {
  const durationMin = t.duration_minutes ?? t.durationMinutes ?? t.estimated_duration ?? t.estimatedDuration ?? t.duration ?? null;
  return {
    ...t,
    _id: t.id ?? t._id,
    title: t.taskName ?? t.title ?? t.task_name ?? "Untitled Task",
    subtitle: t.departmentName ?? t.propertyName ?? t.category ?? "",
    description: t.description ?? "",
    dueTime: t.dueDate ?? t.due_date ?? null,
    dueDate: t.dueDate ?? t.due_date ?? null,
    status: (t.status ?? "pending").toUpperCase().replace(/\s/g, "_"),
    priority: (t.priority ?? "MEDIUM").toUpperCase(),
    location: t.roomNumber ?? t.locationFloor ?? t.room_number ?? t.location_floor ?? "",
    durationMinutes: durationMin != null ? Number(durationMin) : null,
  };
}

function getFallbackUser() {
  return {
    _id: "user-1",
    userId: "SUP-2023-89",
    zone: "Zone B: Cafeteria & Lobby",
    location: "Madhuban Group",
    avatar: null,
  };
}

function getFallbackTasks() {
  return [
    { _id: "1", title: "Room 304", subtitle: "Deluxe Suite", description: "Guest checking in at 11 AM. Full deep clean required immediately.", status: "OVERDUE", dueTime: "2:00 PM", priority: "high" },
    { _id: "2", title: "Room 102", subtitle: "Deluxe Suite", description: "Daily housekeeping service. Replace towels and amenities.", status: "IN_PROGRESS", dueTime: "2:00 PM", priority: "normal" },
    { _id: "3", title: "Room 205", subtitle: "", description: "Checkout cleaning.", status: "PENDING", dueTime: "2:00 PM", priority: "normal" },
  ];
}

function getFallbackTask(id) {
  const tasks = getFallbackTasks();
  const t = tasks.find((x) => String(x._id) === String(id)) || tasks[0];
  return {
    ...t,
    instructions: [
      "Replace bed linens: Strip all bedding including pillowcases and replace with fresh set from cart B.",
      "Sanitize high-touch surfaces: Focus on remotes, door handles, light switches, and phone handset.",
      "Restock Minibar: Check water bottles and replace coffee pods if count is below 2.",
    ],
    guestRequest: "Guest has requested extra pillows. Please check closet shelf.",
    location: "3rd Floor - Deluxe Suite",
    dueBy: "10:30 AM",
  };
}

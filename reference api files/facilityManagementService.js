/**
 * Facility Management API Service
 * ---------------------------------
 * All data from backend/database. Connects to existing APIs:
 * - /api/tasks (tasks, status updates) — same as Task Manager
 * - /api/attendance, /api/attendance/register — attendance
 * - /api/facility/* — facility-specific (floors, patrol, kpi, etc.) when implemented
 * When /api/facility/* returns 404, we derive from /api/tasks and other existing endpoints.
 */

import { API_BASE_URL } from "../config/api";
import { getAuthHeaders } from "../lib/apiClient";
import { getTasks, updateTaskStatus } from "./TaskTab/taskService";

const API = `${API_BASE_URL}/api`;
const FM_BASE = `${API_BASE_URL}/api/facility`;

function apiFetch(url, options = {}) {
  const headers = { ...getAuthHeaders(), ...(options.headers || {}) };
  return fetch(url, { ...options, headers });
}

function safeJson(res) {
  if (!res.ok) return null;
  return res.text().then((t) => (t ? JSON.parse(t) : null));
}

// Map backend task status to FM status (open | prog | done | skip)
function toFmStatus(backendStatus) {
  const s = (backendStatus ?? "").toUpperCase().replace(/\s/g, "_");
  if (s === "COMPLETED") return "done";
  if (s === "IN_PROGRESS") return "prog";
  if (s === "CANCELLED" || s === "SKIP") return "skip";
  return "open";
}

function toBackendStatus(fmStatus) {
  const map = { open: "TO_DO", prog: "IN_PROGRESS", done: "COMPLETED", skip: "CANCELLED" };
  return map[fmStatus] ?? "TO_DO";
}

function formatTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function normalizeFmTask(t) {
  const rawStatus = (t.status ?? "TO_DO").toUpperCase().replace(/\s/g, "_");
  const assigneeName = t.assignee?.name ?? t.assigneeName ?? (t.assignee ? [t.assignee.firstName, t.assignee.lastName].filter(Boolean).join(" ") : null) ?? "—";
  const zone = t.zone ?? t.locationFloor ?? t.location_floor ?? t.location ?? t.roomNumber ?? t.room_number ?? t.category ?? "—";
  const category = t.fn ?? t.function ?? t.category ?? t.departmentName ?? t.department ?? "Housekeeping";
  const taskName = t.task ?? t.title ?? t.taskName ?? t.task_name ?? "";
  const start = t.start ?? formatTime(t.startTime ?? t.dueDate);
  const end = t.end ?? formatTime(t.endTime ?? t.completedAt);
  const dur = t.dur ?? t.duration ?? t.duration_minutes ?? t.durationMinutes ?? 0;
  return {
    id: t.id ?? t._id,
    assignee: assigneeName,
    zone: String(zone),
    fn: category,
    task: taskName,
    start,
    end,
    dur: Number(dur) || 0,
    photos: t.photos ?? 2,
    priority: t.priority ?? "Medium",
    checker: t.checker ?? "",
    approver: t.approver ?? "",
    status: toFmStatus(rawStatus),
  };
}

// ----- KPI (from /api/facility/kpi or derived from tasks) -----
export async function getFacilityKpi() {
  try {
    const res = await apiFetch(`${FM_BASE}/kpi`);
    if (res.ok) {
      const data = await safeJson(res);
      const kpi = data?.data ?? data;
          if (kpi && typeof kpi === "object") return kpi;
    }
  } catch (_) {}
  return null;
}

// Map UI filter status to backend status for API
function toBackendStatusFilter(uiStatus) {
  if (!uiStatus || String(uiStatus).toLowerCase() === "all") return undefined;
  const map = { "open": "TO_DO", "in progress": "IN_PROGRESS", "done": "COMPLETED", "skipped": "CANCELLED" };
  return map[String(uiStatus).toLowerCase()] || undefined;
}

// ----- Tasks from backend /api/tasks (database) -----
// params: filter (e.g. "today"), date, status (UI: Open/In Progress/Done/Skipped), priority, assigneeId
export async function getFacilityTasks(params = {}) {
  try {
    const filters = {};
    if (params.filter === "today" || params.date) {
      const d = new Date();
      filters.dueDate = d.toISOString().slice(0, 10);
    }
    const backendStatus = toBackendStatusFilter(params.status);
    if (backendStatus) filters.status = backendStatus;
    if (params.priority && String(params.priority).toLowerCase() !== "all") filters.priority = params.priority;
    if (params.assigneeId) filters.assigneeId = params.assigneeId;
    const tasks = await getTasks(filters);
    const list = Array.isArray(tasks) ? tasks : [];
    return list.map(normalizeFmTask);
  } catch (err) {
    console.error("getFacilityTasks:", err);
    return [];
  }
}

// ----- Update task status via /api/tasks/:id/status (backend/database) -----
export async function updateFacilityTaskStatus(taskId, status) {
  const backendStatus = toBackendStatus(status);
  await updateTaskStatus(taskId, backendStatus);
  return { success: true };
}

// ----- Floors: /api/facility/floors or empty -----
export async function getFloors() {
  try {
    const res = await apiFetch(`${FM_BASE}/floors`);
    if (!res.ok) return [];
    const data = await safeJson(res);
    const list = data?.data ?? data?.floors ?? (Array.isArray(data) ? data : []);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

// ----- Team completion: /api/facility/team-completion or derived from tasks -----
export async function getTeamCompletion() {
  try {
    const res = await apiFetch(`${FM_BASE}/team-completion`);
    if (res.ok) {
      const data = await safeJson(res);
      const list = data?.data ?? data?.teams ?? (Array.isArray(data) ? data : []);
      if (Array.isArray(list) && list.length) return list;
    }
  } catch (_) {}
  try {
    const tasks = await getTasks({});
    const byCat = {};
    (Array.isArray(tasks) ? tasks : []).forEach((t) => {
      const cat = t.category ?? t.departmentName ?? t.department ?? "Other";
      if (!byCat[cat]) byCat[cat] = { total: 0, done: 0, name: cat };
      byCat[cat].total++;
      if (toFmStatus(t.status) === "done") byCat[cat].done++;
    });
    return Object.values(byCat).map((o) => ({ name: o.name, done: o.done, total: o.total, proofUploaded: 0 }));
  } catch {
    return [];
  }
}

// ----- Occupancy: /api/facility/occupancy -----
export async function getOccupancy() {
  try {
    const res = await apiFetch(`${FM_BASE}/occupancy`);
    if (!res.ok) return [];
    const data = await safeJson(res);
    const list = data?.data ?? data?.hours ?? data?.series ?? (Array.isArray(data) ? data : []);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

// ----- Ticket categories: /api/facility/ticket-categories or derived from tasks -----
const CATEGORY_COLORS = { Electrical: "#D97706", Plumbing: "#2563EB", HVAC: "#0891B2", Civil: "#7C3AED", Housekeeping: "#16A34A" };
export async function getTicketCategories() {
  try {
    const res = await apiFetch(`${FM_BASE}/ticket-categories`);
    if (res.ok) {
      const data = await safeJson(res);
      const list = data?.data ?? data?.categories ?? (Array.isArray(data) ? data : []);
      if (Array.isArray(list) && list.length) return list;
    }
  } catch (_) {}
  try {
    const tasks = await getTasks({});
    const byCat = {};
    (Array.isArray(tasks) ? tasks : []).forEach((t) => {
      const cat = t.category ?? t.departmentName ?? t.department ?? "Other";
      if (!byCat[cat]) byCat[cat] = { name: cat, count: 0, color: CATEGORY_COLORS[cat] ?? "#6B7280" };
      byCat[cat].count++;
    });
    return Object.values(byCat);
  } catch {
    return [];
  }
}

// ----- Time variance: /api/facility/time-variance -----
export async function getTimeVariance() {
  try {
    const res = await apiFetch(`${FM_BASE}/time-variance`);
    if (!res.ok) return null;
    const data = await safeJson(res);
    return data?.data ?? data ?? null;
  } catch {
    return null;
  }
}

// ----- Attendance register: /api/attendance/register or /api/attendance (list) -----
export async function getAttendanceRegister(params = {}) {
  const qs = new URLSearchParams(params).toString();
  try {
    let res = await apiFetch(`${API}/attendance/register${qs ? `?${qs}` : ""}`);
    if (!res.ok) res = await apiFetch(`${API}/attendance${qs ? `?${qs}` : ""}`);
    if (!res.ok) return [];
    const data = await safeJson(res);
    const list = data?.data ?? data?.staff ?? data?.records ?? (Array.isArray(data) ? data : []);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

// ----- Tickets: /api/facility/tickets or /api/tickets or /api/tasks (maintenance) -----
export async function getFacilityTickets(params = {}) {
  try {
    let res = await apiFetch(`${FM_BASE}/tickets${params && Object.keys(params).length ? `?${new URLSearchParams(params)}` : ""}`);
    if (!res.ok) res = await apiFetch(`${API}/tickets${params && Object.keys(params).length ? `?${new URLSearchParams(params)}` : ""}`);
    if (res.ok) {
      const data = await safeJson(res);
      const list = data?.data ?? data?.tickets ?? (Array.isArray(data) ? data : []);
      if (Array.isArray(list)) return list;
    }
  } catch (_) {}
  try {
    const tasks = await getTasks({});
    return (Array.isArray(tasks) ? tasks : []).map((t) => ({
      id: t.id ?? t._id,
      ticketId: t.ticketId ?? t.id ?? t._id,
      issue: t.title ?? t.taskName ?? t.description ?? "—",
      floor: t.locationFloor ?? t.location ?? t.roomNumber ?? "—",
      priority: t.priority ?? "MEDIUM",
      status: t.status ?? "—",
      assignedTo: t.assignee?.name ?? t.assigneeName ?? "—",
      loggedBy: t.assignedBy?.name ?? t.createdBy ?? "—",
      time: t.createdAt ? formatTimeAgo(t.createdAt) : "—",
    }));
  } catch {
    return [];
  }
}

function formatTimeAgo(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Math.floor((Date.now() - d) / 60000);
  if (diff < 60) return `${diff} min ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

// ----- Patrol: /api/facility/patrol -----
export async function getPatrolGuards() {
  try {
    const res = await apiFetch(`${FM_BASE}/patrol`);
    if (!res.ok) return [];
    const data = await safeJson(res);
    const list = data?.data ?? data?.guards ?? data?.patrol ?? (Array.isArray(data) ? data : []);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function getPatrolGuardDetail(guardId) {
  if (!guardId) return null;
  try {
    const res = await apiFetch(`${FM_BASE}/patrol/${guardId}`);
    if (!res.ok) return null;
    const data = await safeJson(res);
    return data?.data ?? data ?? null;
  } catch {
    return null;
  }
}

// ----- Reports export: /api/facility/reports/export or /api/reports/export -----
export async function exportReport(format, dateFrom, dateTo) {
  let res = await apiFetch(`${FM_BASE}/reports/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ format, dateFrom, dateTo }),
  });
  if (!res.ok) {
    res = await apiFetch(`${API}/reports/export?format=${format}&dateFrom=${dateFrom || ""}&dateTo=${dateTo || ""}`, { method: "GET" });
  }
  if (!res.ok) throw new Error("Export failed");
  return res.blob();
}

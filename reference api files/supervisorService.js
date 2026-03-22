/**
 * Supervisor API Service
 * ---------------------
 * Reuses manager/task APIs for supervisor-scoped data.
 * Backend: /api/tasks, /api/users, /api/users/me, /api/supervisor/dashboard
 */

import { API_BASE_URL } from "../../../config/api";
import { getAuthHeaders } from "../../../lib/apiClient";
import {
  getManagerTasks,
  getManagerSupervisors,
  computeDashboardFromTasks,
  getManagerProfile,
} from "../manager Screen/managerService";

export { getManagerProfile as getSupervisorProfile };

/** GET /api/supervisor/dashboard – supervisor name, org, summary (completed, pending), staff online */
export async function getSupervisorDashboard() {
  const url = `${API_BASE_URL}/api/supervisor/dashboard`.replace(/([^:]\/)\/+/g, "$1");
  const res = await fetch(url, { headers: getAuthHeaders() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.message ?? json?.error ?? `Request failed (${res.status})`;
    throw new Error(msg);
  }
  if (!json?.success || json?.data == null) {
    throw new Error("Invalid dashboard response");
  }
  return json.data;
}

function toMinutes(duration) {
  if (duration == null) return null;
  if (typeof duration === "number" && Number.isFinite(duration)) return duration;
  const str = String(duration).trim();
  if (!str) return null;
  // Accept "90", "90m", "1h 30m", "01:30"
  const asNum = Number(str.replace(/[^\d.]/g, ""));
  if (Number.isFinite(asNum) && /^\d+(\.\d+)?$/.test(str.replace(/[^\d.]/g, "")) && !/[h:]/i.test(str)) {
    return Math.round(asNum);
  }
  const hm = str.match(/(\d+)\s*h(?:\s*(\d+)\s*m)?/i);
  if (hm) return (Number(hm[1]) || 0) * 60 + (Number(hm[2]) || 0);
  const colon = str.match(/^(\d{1,2}):(\d{2})$/);
  if (colon) return (Number(colon[1]) || 0) * 60 + (Number(colon[2]) || 0);
  return null;
}

function normalizeCompletedTask(t) {
  return {
    id: t?.id ?? t?._id,
    title: t?.taskName ?? t?.title ?? "Untitled Task",
    location:
      t?.locationFloor ??
      t?.roomNumber ??
      t?.propertyName ??
      t?.location ??
      "—",
    supervisor: t?.assigneeName ?? t?.supervisor ?? "—",
    priority: t?.priority ?? null,
    startedAt: t?.startTime ?? t?.createdAt ?? t?.updatedAt ?? null,
    estimatedMinutes: toMinutes(t?.timeDuration) ?? 120,
    raw: t,
  };
}

function normalizePendingTask(t) {
  return {
    id: t?.id ?? t?._id,
    title: t?.taskName ?? t?.title ?? "Untitled Task",
    propertyName: t?.propertyName ?? t?.property ?? null,
    location:
      t?.locationFloor ??
      t?.roomNumber ??
      t?.propertyName ??
      t?.location ??
      "—",
    supervisor: t?.assigneeName ?? t?.supervisor ?? "—",
    priority: t?.priority ?? null,
    dueDate: t?.dueDate ?? null,
    estimatedMinutes: toMinutes(t?.timeDuration) ?? 120,
    raw: t,
  };
}

/** GET /api/supervisor/tasks/completed – completed tasks for supervisor */
export async function getSupervisorCompletedTasks() {
  const url = `${API_BASE_URL}/api/supervisor/tasks/completed`.replace(/([^:]\/)\/+/g, "$1");
  const res = await fetch(url, { headers: getAuthHeaders() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.message ?? json?.error ?? `Request failed (${res.status})`;
    throw new Error(msg);
  }
  if (!json?.success || !Array.isArray(json?.data)) {
    throw new Error("Invalid completed tasks response");
  }
  return json.data.map(normalizeCompletedTask);
}

/** GET /api/supervisor/tasks/pending – pending tasks for supervisor */
export async function getSupervisorPendingTasks() {
  const url = `${API_BASE_URL}/api/supervisor/tasks/pending`.replace(/([^:]\/)\/+/g, "$1");
  const res = await fetch(url, { headers: getAuthHeaders() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.message ?? json?.error ?? `Request failed (${res.status})`;
    throw new Error(msg);
  }
  if (!json?.success || !Array.isArray(json?.data)) {
    throw new Error("Invalid pending tasks response");
  }
  return json.data.map(normalizePendingTask);
}

function normalizeAllTask(t) {
  const rawStatus = (t?.status || "").toUpperCase().replace(/\s/g, "_");
  return {
    id: t?.id ?? t?._id,
    title: t?.taskName ?? t?.title ?? "Untitled Task",
    propertyName: t?.propertyName ?? t?.property ?? null,
    location:
      t?.locationFloor ??
      t?.roomNumber ??
      t?.propertyName ??
      t?.location ??
      "—",
    supervisor: t?.assigneeName ?? t?.supervisor ?? "—",
    priority: t?.priority ?? null,
    status: rawStatus,
    frequency: t?.frequency ?? null,
    startTime: t?.startTime ?? null,
    endTime: t?.endTime ?? null,
    estimatedMinutes: toMinutes(t?.timeDuration) ?? 10,
    dueDate: t?.dueDate ?? null,
    raw: t,
  };
}

/** GET /api/supervisor/tasks/all – all tasks for supervisor (for Task Management screen) */
export async function getSupervisorAllTasks() {
  const url = `${API_BASE_URL}/api/supervisor/tasks/all`.replace(/([^:]\/)\/+/g, "$1");
  const res = await fetch(url, { headers: getAuthHeaders() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.message ?? json?.error ?? `Request failed (${res.status})`;
    throw new Error(msg);
  }
  if (!json?.success || !Array.isArray(json?.data)) {
    throw new Error("Invalid tasks response");
  }
  return json.data.map(normalizeAllTask);
}

/** Fetch tasks for supervisor dashboard (In Progress + Pending counts, lists) */
export async function getSupervisorTasks(filters = {}) {
  return getManagerTasks(filters);
}

/** Staff/team members for supervisor (Staff Online, Staff List) */
export async function getSupervisorStaff(prefetchedTasks = null) {
  return getManagerSupervisors(prefetchedTasks);
}

/** Dashboard stats: inProgressCount, pendingCount */
export function getSupervisorDashboardStats(tasks) {
  const stats = computeDashboardFromTasks(tasks);
  const list = Array.isArray(tasks) ? tasks : [];
  const inProgress = list.filter(
    (t) => (t.rawStatus || "").toUpperCase() === "IN_PROGRESS"
  ).length;
  const pending = list.filter((t) => {
    const s = (t.rawStatus || t.status || "").toUpperCase().replace(/\s/g, "_");
    return ["TO_DO", "PENDING"].includes(s);
  }).length;
  return {
    ...stats,
    inProgress,
    pending,
  };
}

/** Single task details for View Details modal – GET /api/supervisor/tasks/:id */
export async function getSupervisorTaskById(id) {
  const url = `${API_BASE_URL}/api/supervisor/tasks/${id}`.replace(/([^:]\/)\/+/g, "$1");
  const res = await fetch(url, { headers: getAuthHeaders() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.message ?? json?.error ?? `Request failed (${res.status})`;
    throw new Error(msg);
  }
  if (!json?.success || json?.data == null) {
    throw new Error("Invalid task details response");
  }
  return json.data;
}

/** Approve task (verification) */
export async function approveTask(taskId) {
  const url = `${API_BASE_URL}/api/tasks/${taskId}/approve`.replace(/([^:]\/)\/+/g, "$1");
  const res = await fetch(url, {
    method: "PATCH",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ approved: true }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.message ?? json?.error ?? `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return json;
}

/** Reject task (verification) */
export async function rejectTask(taskId) {
  const url = `${API_BASE_URL}/api/tasks/${taskId}/approve`.replace(/([^:]\/)\/+/g, "$1");
  const res = await fetch(url, {
    method: "PATCH",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ approved: false }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.message ?? json?.error ?? `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return json;
}

/** Mock/placeholder: attendance & leave data (replace with real API when available) */
export async function getAttendanceLeaveData(month) {
  const now = new Date();
  const year = month ? new Date(month).getFullYear() : now.getFullYear();
  const m = month ? new Date(month).getMonth() : now.getMonth();
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const days = [];
  for (let d = 1; d <= Math.min(daysInMonth, 14); d++) {
    days.push({
      date: d,
      percentage: d % 5 === 0 ? 42 : 92 + (d % 5),
      isSelected: d === now.getDate() && m === now.getMonth(),
    });
  }
  return {
    month: new Date(year, m).toLocaleString("en-IN", { month: "long", year: "numeric" }),
    year,
    monthIndex: m,
    totalStaff: 15,
    present: 2,
    onLeave: 4,
    staffOnLeave: [
      { id: "1", name: "Rahul V.", type: "Sick Leave" },
      { id: "2", name: "Sneha P.", type: "Casual" },
      { id: "3", name: "Amit K.", type: "Unplanned" },
      { id: "4", name: "Priya S.", type: "Personal" },
    ],
    leaveRequests: [
      {
        id: "lr1",
        name: "James Wilson",
        avatar: null,
        timeAgo: "2h ago",
        leaveType: "Sick Leave",
        dateRange: "Oct 24 - Oct 25",
        reason: "Not feeling well, fever since last night",
      },
      {
        id: "lr2",
        name: "Sarah Chen",
        avatar: null,
        timeAgo: "5h ago",
        leaveType: "Casual Leave",
        dateRange: "Oct 24 - Oct 25",
        reason: "Family function to attend out of town.",
      },
    ],
    days,
  };
}

/** Mock: staff list for attendance (replace with real API when available) */
export async function getStaffList(filters = {}) {
  const list = [
    { id: "1", name: "Jane Smith", role: "Sales Department", status: "ABSENT", reason: "Unplanned", duration: "1 Day" },
    { id: "2", name: "John Doe", role: "Manager - Operations", status: "PRESENT" },
    { id: "3", name: "Rahul Kapoor", role: "IT Specialist", status: "ON LEAVE", reason: "Sick Leave", duration: "3 Days (Day 2)" },
    { id: "4", name: "Anita Mishra", role: "HR Associate", status: "PRESENT" },
    { id: "5", name: "Vikram Singh", role: "Security Head", status: "ABSENT", reason: "Casual Leave", duration: "2 Days" },
  ];
  const presentCount = list.filter((s) => s.status === "PRESENT").length;
  const absentCount = list.filter((s) => s.status === "ABSENT").length;
  let filtered = list;
  if (filters.tab === "Present") filtered = list.filter((s) => s.status === "PRESENT");
  if (filters.tab === "Absent") filtered = list.filter((s) => s.status === "ABSENT" || s.status === "ON LEAVE");
  if (filters.search) {
    const q = (filters.search || "").toLowerCase();
    filtered = filtered.filter(
      (s) =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.role && s.role.toLowerCase().includes(q))
    );
  }
  return {
    list: filtered,
    total: list.length,
    present: presentCount,
    absent: absentCount,
  };
}

/**
 * Manager API Service
 * -------------------
 * Backend: /api/tasks, /api/users, /api/users/supervisors, /api/users/me, /api/reports/analytics
 * All manager screens fetch data from backend/database.
 */

import { API_BASE_URL } from "../../../config/api";
import { getAuthHeaders } from "../../../lib/apiClient";
import { getTasks, approveTask as apiApproveTask, rejectTask as apiRejectTask, updateTaskStatus } from "../../TaskTab/taskService";
import { getSupervisors } from "../../UserTab/userService";
import { getCurrentUser } from "../End user screen/endUserService";

/* ---------- TASKS (from /api/tasks - all tasks for manager) ---------- */

/** Fetch all tasks for manager overview */
export async function getManagerTasks(filters = {}) {
  const tasks = await getTasks(filters);
  return (tasks || []).map(normalizeManagerTask);
}

function normalizeManagerTask(t) {
  const rawStatus = (t.status ?? "").toUpperCase().replace(/\s/g, "_");
  const statusLabel = {
    OVERDUE: "Overdue",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    TO_DO: "Pending",
    PENDING: "Pending",
    REVIEW: "Pending Approval",
    PENDING_APPROVAL: "Pending Approval",
  }[rawStatus] || "Pending";

  const assigneeName =
    t.assignee?.name ??
    t.assigneeName ??
    (t.assignee?.firstName || t.assignee?.lastName
      ? [t.assignee?.firstName, t.assignee?.lastName].filter(Boolean).join(" ")
      : null);

  const dueDate = t.dueDate ?? t.dueTime ?? t.completedAt;
  let dueLabel = "";
  if (dueDate) {
    const d = new Date(dueDate);
    if (!Number.isNaN(d.getTime())) {
      const now = new Date();
      const isToday =
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate();
      if (rawStatus === "COMPLETED" && t.completedAt) {
        const diff = Math.floor((now - d) / 60000);
        if (diff < 60) dueLabel = `Completed ${diff}m ago`;
        else if (diff < 1440) dueLabel = `Completed ${Math.floor(diff / 60)}h ago`;
        else dueLabel = `Completed ${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
      } else if (isToday) {
        dueLabel = `Today, ${d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}`;
      } else {
        dueLabel = d.toLocaleDateString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      }
    }
  }

  return {
    id: t._id ?? t.id,
    _id: t._id ?? t.id,
    title: t.title ?? t.taskName ?? "Untitled Task",
    location: t.locationFloor ?? t.location ?? t.roomNumber ?? t.propertyName ?? "—",
    supervisor: assigneeName ?? "Unassigned",
    assigneeId: t.assigneeId ?? t.assignee?._id ?? t.assignee?.id,
    due: dueLabel || "—",
    status: statusLabel,
    rawStatus,
    category: t.category ?? t.departmentName ?? t.department ?? "—",
    completedAt: t.completedAt,
    updatedAt: t.updatedAt ?? t.updated_at,
  };
}

/* ---------- DASHBOARD STATS (derived from tasks) ---------- */

const REVIEW_STATUSES = ["REVIEW", "PENDING_APPROVAL"];

/** Compute task stats and supervisor performance from tasks */
export function computeDashboardFromTasks(tasks) {
  const list = Array.isArray(tasks) ? tasks : [];
  const total = list.length;
  const completed = list.filter((t) =>
    ["COMPLETED"].includes((t.rawStatus || t.status || "").toUpperCase().replace(/\s/g, "_"))
  ).length;
  const overdue = list.filter((t) =>
    ["OVERDUE"].includes((t.rawStatus || t.status || "").toUpperCase().replace(/\s/g, "_"))
  ).length;
  const pendingApproval = list.filter((t) =>
    REVIEW_STATUSES.includes((t.rawStatus || t.status || "").toUpperCase().replace(/\s/g, "_"))
  ).length;
  const pending = total - completed - pendingApproval;
  const completedPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const byAssignee = {};
  list.forEach((t) => {
    const aid = t.assigneeId ?? t.supervisor ?? "unassigned";
    if (!byAssignee[aid]) byAssignee[aid] = { total: 0, completed: 0 };
    byAssignee[aid].total++;
    if (["COMPLETED"].includes((t.rawStatus || t.status || "").toUpperCase().replace(/\s/g, "_"))) {
      byAssignee[aid].completed++;
    }
  });

  const stats = {
    total,
    completed,
    pending,
    overdue,
    pendingApproval,
    completedPct,
    byAssignee,
  };

  return stats;
}

/** Recent activity from tasks: completed, overdue, created (by updatedAt/completedAt) */
export function computeRecentActivity(tasks) {
  const list = (Array.isArray(tasks) ? tasks : [])
    .map((t) => ({
      ...t,
      sortAt: t.completedAt ?? t.updatedAt ?? t.updated_at ?? t.createdAt ?? 0,
    }))
    .filter((t) => t.sortAt)
    .sort((a, b) => new Date(b.sortAt) - new Date(a.sortAt))
    .slice(0, 10);

  const formatTime = (d) => {
    const now = new Date();
    const diff = Math.floor((now - new Date(d)) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  return list.map((t) => {
    const rawStatus = (t.rawStatus || t.status || "").toUpperCase().replace(/\s/g, "_");
    if (REVIEW_STATUSES.includes(rawStatus)) {
      return {
        title: `Pending Approval: ${t.title ?? "Task"}`,
        sub: `Completed by ${t.supervisor ?? "Staff"} - awaiting your approval`,
        time: formatTime(t.sortAt),
        icon: "✓",
        type: "warning",
        taskId: t.id ?? t._id,
      };
    }
    if (rawStatus === "COMPLETED") {
      return {
        title: t.title ?? "Task Completed",
        sub: `Completed by ${t.supervisor ?? "Staff"}`,
        time: formatTime(t.completedAt ?? t.sortAt),
        icon: "✓",
        type: "success",
      };
    }
    if (rawStatus === "OVERDUE") {
      return {
        title: `Overdue: ${t.title ?? "Task"}`,
        sub: `Supervisor ${t.supervisor ?? "—"} notified`,
        time: formatTime(t.sortAt),
        icon: "⚠",
        type: "warning",
      };
    }
    return {
      title: t.title ?? "Task Updated",
      sub: `${t.category ?? "Task"} - ${t.status ?? "In Progress"}`,
      time: formatTime(t.sortAt),
      icon: "✓",
      type: "info",
    };
  });
}

/* ---------- SUPERVISORS ---------- */

/** Fetch supervisors and enrich with task completion from tasks. Pass normalized tasks to avoid refetch. */
export async function getManagerSupervisors(prefetchedTasks = null) {
  const [supervisors, tasks] = prefetchedTasks != null
    ? [await getSupervisors(), prefetchedTasks]
    : await Promise.all([getSupervisors(), getTasks({})]);
  const taskList = Array.isArray(tasks) ? tasks : [];
  const forStats = taskList[0]?.rawStatus != null ? taskList : taskList.map(normalizeManagerTask);
  const byAssignee = computeDashboardFromTasks(forStats).byAssignee;

  return (supervisors || []).map((s) => {
    const id = String(s._id ?? s.id ?? s.userId ?? "");
    const perf = byAssignee[id] || { total: 0, completed: 0 };
    const pct = perf.total > 0 ? Math.round((perf.completed / perf.total) * 100) : 0;
    return {
      id: s._id ?? s.id,
      name: s.name ?? s.fullName ?? [s.firstName, s.lastName].filter(Boolean).join(" ") ?? "—",
      role: s.role ?? s.jobTitle ?? "Supervisor",
      location: s.location ?? s.zone ?? s.department ?? "—",
      shift: s.shift ?? (s.isOnShift ? "On Shift" : "Off Duty") ?? "—",
      attendance: s.attendance ?? s.attendancePercent ?? null,
      taskCompletion: pct,
    };
  });
}

/* ---------- REPORTS ---------- */

/** Fetch reports analytics from backend (no fallback; returns null on error) */
export async function getManagerReportsData(period = "weekly") {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/reports/analytics?period=${period}`,
      { headers: getAuthHeaders() }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? json;
  } catch {
    return null;
  }
}

/** Derive report metrics and chart data from tasks */
export function computeReportsFromTasks(tasks) {
  const list = Array.isArray(tasks) ? tasks : [];
  const total = list.length;
  const completed = list.filter((t) =>
    ["COMPLETED"].includes((t.rawStatus || t.status || "").toUpperCase().replace(/\s/g, "_"))
  ).length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const dayMap = { 0: "S", 1: "M", 2: "T", 3: "W", 4: "T", 5: "F", 6: "S" };
  const byDay = {};
  list.forEach((t) => {
    const d = t.completedAt ?? t.updatedAt ?? t.dueDate ?? t.createdAt;
    if (!d) return;
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return;
    const key = date.toISOString().slice(0, 10);
    if (!byDay[key]) byDay[key] = { completed: 0, pending: 0 };
    const raw = (t.rawStatus || t.status || "").toUpperCase().replace(/\s/g, "_");
    if (raw === "COMPLETED") byDay[key].completed++;
    else byDay[key].pending++;
  });

  const sortedDays = Object.keys(byDay).sort().slice(-7);
  const taskTrendData = sortedDays.length
    ? sortedDays.map((k) => {
        const d = new Date(k);
        return {
          day: dayMap[d.getDay()] ?? d.getDay(),
          completed: byDay[k].completed ?? 0,
          pending: byDay[k].pending ?? 0,
        };
      })
    : [
        { day: "M", completed: 0, pending: 0 },
        { day: "T", completed: 0, pending: 0 },
        { day: "W", completed: 0, pending: 0 },
        { day: "T", completed: 0, pending: 0 },
        { day: "F", completed: 0, pending: 0 },
        { day: "S", completed: 0, pending: 0 },
        { day: "S", completed: 0, pending: 0 },
      ];

  return {
    totalTasks: total,
    completionRate,
    taskTrendData,
    metrics: [
      { label: "Total tasks", value: String(total), icon: "📄", iconBg: "bg-blue-100", trend: "", trendUp: true },
      { label: "Avg attendance", value: "—", icon: "✓", iconBg: "bg-green-100", trend: "", trendUp: false },
      { label: "Compliance Rate", value: `${completionRate}%`, icon: "🛡", iconBg: "bg-purple-100", trend: "", trendUp: completionRate >= 80 },
    ],
  };
}

/** Manager approves task (calls backend POST /api/tasks/:id/approve) */
export async function approveTask(taskId) {
  return apiApproveTask(taskId);
}

/** Manager rejects task (POST /api/tasks/:id/reject or fallback: PATCH status to IN_PROGRESS) */
export async function rejectTask(taskId) {
  try {
    return await apiRejectTask(taskId);
  } catch {
    await updateTaskStatus(taskId, "IN_PROGRESS");
    return { success: true };
  }
}

/* ---------- PROFILE ---------- */

/** Fetch current manager user profile */
export async function getManagerProfile() {
  return getCurrentUser();
}

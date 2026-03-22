/**
 * Task API Service
 * ---------------
 * Backend: GET /api/tasks - list tasks (supports query: status, priority, assigneeId, dueDate)
 * Backend: GET /api/tasks/:id - get task by id
 * Backend: POST /api/tasks - create task
 * Backend: PUT /api/tasks/:id - update task
 * Backend: PATCH /api/tasks/:id/status - update task status
 * Backend: DELETE /api/tasks/:id - delete task
 * Data saved to backend/database; responses reflected from backend.
 */

import { API_BASE_URL } from "../../config/api";
import { readJsonOrThrow, getAuthHeaders } from "../../lib/apiClient";

const API_BASE = `${API_BASE_URL}/api/tasks`;

function normalizeTask(t) {
  const rawStatus = (t.status ?? "pending").toLowerCase();
  const statusMap = { pending: "TO_DO", in_progress: "IN_PROGRESS", review: "REVIEW", completed: "COMPLETED", pending_approval: "REVIEW" };
  const status = statusMap[rawStatus] ?? rawStatus.toUpperCase().replace(/\s/g, "_");
  
  return {
    ...t,
    _id: t.id ?? t._id,
    title: t.taskName ?? t.title ?? t.task_name ?? "Untitled",
    assignee: t.assignee ?? (t.assigneeName ? { name: t.assigneeName } : null),
    assigneeId: t.assigneeId ?? t.assignee?.id ?? t.assignee?._id ?? null,
    assignedBy: t.assignedBy ?? (t.assignedByName ? { name: t.assignedByName } : null),
    status,
    priority: (t.priority ?? "normal").toUpperCase(),
    dueDate: t.dueDate ? formatDueDate(t.dueDate) : t.dueDate,
    completedAt: t.completedAt ? formatDueDate(t.completedAt) : t.completedAt,
    instructions: Array.isArray(t.instructions) ? t.instructions : [],
    roomNumber: t.roomNumber ?? t.room_number ?? null,
    locationFloor: t.locationFloor ?? t.location_floor ?? t.location ?? null,
    category: t.category ?? t.departmentName ?? t.department ?? null,
    departmentId: t.departmentId ?? null,
    propertyId: t.propertyId ?? null,
    propertyName: t.propertyName ?? null,
    startDate: t.startDate ? formatDueDate(t.startDate) : t.startDate,
    endDate: t.endDate ? formatDueDate(t.endDate) : t.endDate,
    startTime: t.startTime ?? null,
    endTime: t.endTime ?? null,
    timeDuration: t.timeDuration ?? null,
    frequency: t.frequency ?? null,
    guestRequest: t.guestRequest ?? null,
    attachments: Array.isArray(t.attachments) ? t.attachments : [],
    createdAt: t.createdAt ?? null,
    updatedAt: t.updatedAt ?? null,
  };
}

function formatDueDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toISOString().slice(0, 10);
}

/** Backend: GET /api/tasks - fetch all tasks, optionally filtered */
export async function getTasks(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.priority) params.set("priority", filters.priority);
    if (filters.assigneeId) params.set("assigneeId", filters.assigneeId);
    if (filters.dueDate) params.set("dueDate", filters.dueDate);
    const qs = params.toString();
    const url = qs ? `${API_BASE}?${qs}` : API_BASE;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch tasks");
    const json = await res.json();
    const raw = json?.data;
    const tasks = Array.isArray(raw) ? raw : (json?.data?.tasks ?? json?.tasks ?? (Array.isArray(json) ? json : []));
    return tasks.map(normalizeTask);
  } catch (err) {
    console.error("getTasks error:", err);
    throw err;
  }
}

/** Backend: GET /api/tasks/:id - fetch single task by id */
export async function getTaskById(id) {
  try {
    const res = await fetch(`${API_BASE}/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch task");
    const json = await res.json();
    const task = json?.data?.task ?? json?.data ?? json;
    return normalizeTask(task);
  } catch (err) {
    console.error("getTaskById error:", err);
    throw err;
  }
}

/** Backend: POST /api/tasks - create task (JSON or FormData when attachments are files) */
export async function createTask(data) {
  const headers = getAuthHeaders();

  if (data instanceof FormData) {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers,
      body: data,
    });
    return await readJsonOrThrow(res);
  }

  const apiData = {
    taskName: data.title || data.taskName,
    departmentId: data.departmentId,
    description: data.description ?? "",
    assigneeId: data.assigneeId,
    priority: (data.priority ?? "NORMAL").toUpperCase(),
    propertyId: data.propertyId,
    startDate: data.startDate,
    endDate: data.endDate,
    startTime: data.startTime,
    endTime: data.endTime,
    timeDuration: data.timeDuration,
    frequency: data.frequency || undefined,
    floorId: data.floorId,
    zoneId: data.zoneId,
    instructions: Array.isArray(data.instructions) ? data.instructions : [],
    attachments: Array.isArray(data.attachments) ? data.attachments : [],
  };

  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(apiData),
  });
  return await readJsonOrThrow(res);
}

/** Backend: PUT /api/tasks/:id - update task; changes saved to backend/database */
export async function updateTask(id, data) {
  // Transform frontend data to match backend API format
  const apiData = {
    taskName: data.title || data.taskName,
    departmentId: data.departmentId,
    description: data.description,
    assigneeId: data.assigneeId,
    priority: data.priority?.toUpperCase() || "NORMAL",
    propertyId: data.propertyId,
    dueDate: data.dueDate,
    startDate: data.startDate,
    endDate: data.endDate,
    startTime: data.startTime,
    endTime: data.endTime,
    timeDuration: data.timeDuration,
    frequency: data.frequency,
    status: data.status?.toLowerCase() || "pending",
    roomNumber: data.roomNumber,
    locationFloor: data.locationFloor,
    instructions: Array.isArray(data.instructions) ? data.instructions : [],
    guestRequest: data.guestRequest,
    attachments: Array.isArray(data.attachments) ? data.attachments : [],
  };
  
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(apiData),
  });
  return await readJsonOrThrow(res);
}

/** Backend: PATCH /api/tasks/:id/status - update task status only */
export async function updateTaskStatus(id, status) {
  const res = await fetch(`${API_BASE}/${id}/status`, {
    method: "PATCH",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ status: status.toLowerCase() }),
  });
  return await readJsonOrThrow(res);
}

/** Backend: DELETE /api/tasks/:id - delete task */
export async function deleteTask(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return await readJsonOrThrow(res);
}

/** Backend: POST /api/tasks/:id/approve - manager approves completed task (sets status to COMPLETED) */
export async function approveTask(taskId) {
  const res = await fetch(`${API_BASE}/${taskId}/approve`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ approved: true }),
  });
  return await readJsonOrThrow(res);
}

/** Backend: POST /api/tasks/:id/reject - manager rejects task (sends back for rework) */
export async function rejectTask(taskId) {
  const res = await fetch(`${API_BASE}/${taskId}/reject`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ rejected: true }),
  });
  return await readJsonOrThrow(res);
}


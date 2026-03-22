import type { Task } from "@madhuban/types";
import { getApiBaseUrl } from "./env";
import { getAuthHeaders, readJsonOrThrow } from "./client";

const API_BASE = () => `${getApiBaseUrl()}/api/tasks`;

function formatDueDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toISOString().slice(0, 10);
}

function normalizeTask(t: Record<string, unknown>): Task {
  const rawStatus = String(t.status ?? "pending").toLowerCase();
  const statusMap: Record<string, string> = {
    pending: "TO_DO",
    in_progress: "IN_PROGRESS",
    review: "REVIEW",
    completed: "COMPLETED",
    pending_approval: "REVIEW",
  };
  const status =
    statusMap[rawStatus] ?? rawStatus.toUpperCase().replace(/\s/g, "_");

  const assignee = t.assignee as { name?: string } | undefined;
  const assigneeName = t.assigneeName as string | undefined;

  return {
    ...t,
    _id: (t.id as string) ?? (t._id as string),
    title:
      (t.taskName as string) ??
      (t.title as string) ??
      (t.task_name as string) ??
      "Untitled",
    assignee: assignee ?? (assigneeName ? { name: assigneeName } : null),
    assigneeId:
      (t.assigneeId as string) ??
      (assignee as { id?: string } | undefined)?.id ??
      (assignee as { _id?: string } | undefined)?._id ??
      null,
    assignedBy:
      (t.assignedBy as Task["assignee"]) ??
      ((t.assignedByName as string)
        ? { name: t.assignedByName as string }
        : null),
    status,
    priority: String(t.priority ?? "normal").toUpperCase(),
    dueDate: t.dueDate ? formatDueDate(String(t.dueDate)) : (t.dueDate as string),
    completedAt: t.completedAt
      ? formatDueDate(String(t.completedAt))
      : (t.completedAt as string),
    instructions: Array.isArray(t.instructions) ? t.instructions : [],
    roomNumber: (t.roomNumber as string) ?? (t.room_number as string) ?? null,
    locationFloor:
      (t.locationFloor as string) ??
      (t.location_floor as string) ??
      (t.location as string) ??
      null,
    category:
      (t.category as string) ??
      (t.departmentName as string) ??
      (t.department as string) ??
      null,
    departmentId: (t.departmentId as string) ?? null,
    propertyId: (t.propertyId as string) ?? null,
    propertyName: (t.propertyName as string) ?? null,
    startDate: t.startDate ? formatDueDate(String(t.startDate)) : (t.startDate as string),
    endDate: t.endDate ? formatDueDate(String(t.endDate)) : (t.endDate as string),
    startTime: (t.startTime as string) ?? null,
    endTime: (t.endTime as string) ?? null,
    timeDuration: (t.timeDuration as string) ?? null,
    frequency: (t.frequency as string) ?? null,
    guestRequest: (t.guestRequest as string) ?? null,
    attachments: Array.isArray(t.attachments) ? t.attachments : [],
    createdAt: (t.createdAt as string) ?? null,
    updatedAt: (t.updatedAt as string) ?? null,
  };
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  assigneeId?: string;
  dueDate?: string;
}

export async function getTasks(filters: TaskFilters = {}): Promise<Task[]> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.assigneeId) params.set("assigneeId", filters.assigneeId);
  if (filters.dueDate) params.set("dueDate", filters.dueDate);
  const qs = params.toString();
  const url = qs ? `${API_BASE()}?${qs}` : API_BASE();
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch tasks");
  const json = (await res.json()) as Record<string, unknown>;
  const raw = json.data;
  const tasks = Array.isArray(raw)
    ? raw
    : ((json.data as { tasks?: unknown[] })?.tasks ??
        (json as { tasks?: unknown[] }).tasks ??
        (Array.isArray(json) ? json : []));
  return (tasks as Record<string, unknown>[]).map(normalizeTask);
}

export async function getTaskById(id: string): Promise<Task> {
  const res = await fetch(`${API_BASE()}/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch task");
  const json = (await res.json()) as Record<string, unknown>;
  const task =
    (json.data as { task?: Record<string, unknown> })?.task ??
    (json.data as Record<string, unknown>) ??
    json;
  return normalizeTask(task as Record<string, unknown>);
}

export async function createTask(data: unknown): Promise<unknown> {
  const headers = getAuthHeaders();

  if (data instanceof FormData) {
    const res = await fetch(API_BASE(), {
      method: "POST",
      headers,
      body: data,
    });
    return readJsonOrThrow(res);
  }

  const d = data as Record<string, unknown>;
  const apiData = {
    taskName: d.title ?? d.taskName,
    departmentId: d.departmentId,
    description: d.description ?? "",
    assigneeId: d.assigneeId,
    priority: String(d.priority ?? "NORMAL").toUpperCase(),
    propertyId: d.propertyId,
    startDate: d.startDate,
    endDate: d.endDate,
    startTime: d.startTime,
    endTime: d.endTime,
    timeDuration: d.timeDuration,
    frequency: d.frequency || undefined,
    floorId: d.floorId,
    zoneId: d.zoneId,
    instructions: Array.isArray(d.instructions) ? d.instructions : [],
    attachments: Array.isArray(d.attachments) ? d.attachments : [],
  };

  const res = await fetch(API_BASE(), {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(apiData),
  });
  return readJsonOrThrow(res);
}

export async function updateTask(id: string, data: Record<string, unknown>): Promise<unknown> {
  const apiData = {
    taskName: data.title ?? data.taskName,
    departmentId: data.departmentId,
    description: data.description,
    assigneeId: data.assigneeId,
    priority: data.priority?.toString().toUpperCase() || "NORMAL",
    propertyId: data.propertyId,
    dueDate: data.dueDate,
    startDate: data.startDate,
    endDate: data.endDate,
    startTime: data.startTime,
    endTime: data.endTime,
    timeDuration: data.timeDuration,
    frequency: data.frequency,
    status: data.status?.toString().toLowerCase() || "pending",
    roomNumber: data.roomNumber,
    locationFloor: data.locationFloor,
    instructions: Array.isArray(data.instructions) ? data.instructions : [],
    guestRequest: data.guestRequest,
    attachments: Array.isArray(data.attachments) ? data.attachments : [],
  };

  const res = await fetch(`${API_BASE()}/${id}`, {
    method: "PUT",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(apiData),
  });
  return readJsonOrThrow(res);
}

export async function updateTaskStatus(id: string, status: string): Promise<unknown> {
  const res = await fetch(`${API_BASE()}/${id}/status`, {
    method: "PATCH",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ status: status.toLowerCase() }),
  });
  return readJsonOrThrow(res);
}

export async function deleteTask(id: string): Promise<unknown> {
  const res = await fetch(`${API_BASE()}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return readJsonOrThrow(res);
}

export async function approveTask(taskId: string): Promise<unknown> {
  const res = await fetch(`${API_BASE()}/${taskId}/approve`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ approved: true }),
  });
  return readJsonOrThrow(res);
}

export async function rejectTask(taskId: string): Promise<unknown> {
  const res = await fetch(`${API_BASE()}/${taskId}/reject`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ rejected: true }),
  });
  return readJsonOrThrow(res);
}

export { normalizeTask };

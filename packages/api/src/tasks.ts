import type { Task } from "@madhuban/types";
import { getApiBaseUrl } from "./env";
import { getAuthHeaders, readJsonOrThrow, unwrapApiData } from "./client";

const API_TASKS = () => `${getApiBaseUrl()}/api/tasks`;
const API_ASSIGNMENTS = () => `${getApiBaseUrl()}/api/staff-master-tasks`;
const API_DAILY_TASKS = () => `${getApiBaseUrl()}/api/daily-staff-tasks`;
const API_CRON = () => `${getApiBaseUrl()}/api/cron/daily-tasks`;

export interface MasterTaskRecord {
  id: number;
  title: string;
  description: string | null;
  zoneId: number | null;
  priority: string | null;
  startTime: string | null;
  endTime: string | null;
  materials: string[] | null;
  createdByAdminId: number | null;
  createdAt: string;
  updatedAt: string;
  createdByAdmin?: {
    id: number;
    name: string;
    email: string;
  } | null;
  zone?: {
    id: number;
    zone: string;
    propertyFloorId: number;
  } | null;
}

export interface StaffMasterTaskRecord {
  id: number;
  staffId: number;
  masterTaskId: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  staff?: {
    id: number;
    name: string;
    email: string;
    supervisor?: {
      id: number;
      name: string;
      email: string;
    } | null;
  } | null;
  masterTask?: {
    id: number;
    title: string;
  } | null;
}

export interface DailyStaffTaskRecord {
  id: number;
  staffMasterTaskId: number;
  staffId: number;
  taskDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  staff?: StaffMasterTaskRecord["staff"];
  staffMasterTask?: StaffMasterTaskRecord & {
    masterTask?: MasterTaskRecord | null;
  };
}

export interface TaskFilters {
  date?: string;
}

function mapMasterTask(raw: Record<string, unknown>): MasterTaskRecord {
  return {
    id: Number(raw.id ?? 0),
    title: String(raw.title ?? ""),
    description: raw.description == null ? null : String(raw.description),
    zoneId: raw.zoneId == null ? null : Number(raw.zoneId),
    priority: raw.priority == null ? null : String(raw.priority),
    startTime: raw.startTime == null ? null : String(raw.startTime),
    endTime: raw.endTime == null ? null : String(raw.endTime),
    materials: Array.isArray(raw.materials)
      ? raw.materials.map((item) => String(item))
      : null,
    createdByAdminId:
      raw.createdByAdminId == null ? null : Number(raw.createdByAdminId),
    createdAt: String(raw.createdAt ?? ""),
    updatedAt: String(raw.updatedAt ?? ""),
    createdByAdmin:
      raw.createdByAdmin && typeof raw.createdByAdmin === "object"
        ? {
            id: Number((raw.createdByAdmin as Record<string, unknown>).id ?? 0),
            name: String(
              (raw.createdByAdmin as Record<string, unknown>).name ?? "",
            ),
            email: String(
              (raw.createdByAdmin as Record<string, unknown>).email ?? "",
            ),
          }
        : null,
    zone:
      raw.zone && typeof raw.zone === "object"
        ? {
            id: Number((raw.zone as Record<string, unknown>).id ?? 0),
            zone: String((raw.zone as Record<string, unknown>).zone ?? ""),
            propertyFloorId: Number(
              (raw.zone as Record<string, unknown>).propertyFloorId ?? 0,
            ),
          }
        : null,
  };
}

function mapStaffAssignment(raw: Record<string, unknown>): StaffMasterTaskRecord {
  return {
    id: Number(raw.id ?? 0),
    staffId: Number(raw.staffId ?? 0),
    masterTaskId: Number(raw.masterTaskId ?? 0),
    startDate: String(raw.startDate ?? ""),
    endDate: String(raw.endDate ?? ""),
    isActive: Boolean(raw.isActive),
    createdAt: String(raw.createdAt ?? ""),
    updatedAt: String(raw.updatedAt ?? ""),
    staff:
      raw.staff && typeof raw.staff === "object"
        ? {
            id: Number((raw.staff as Record<string, unknown>).id ?? 0),
            name: String((raw.staff as Record<string, unknown>).name ?? ""),
            email: String((raw.staff as Record<string, unknown>).email ?? ""),
            supervisor:
              (raw.staff as Record<string, unknown>).supervisor &&
              typeof (raw.staff as Record<string, unknown>).supervisor === "object"
                ? {
                    id: Number(
                      (
                        (raw.staff as Record<string, unknown>)
                          .supervisor as Record<string, unknown>
                      ).id ?? 0,
                    ),
                    name: String(
                      (
                        (raw.staff as Record<string, unknown>)
                          .supervisor as Record<string, unknown>
                      ).name ?? "",
                    ),
                    email: String(
                      (
                        (raw.staff as Record<string, unknown>)
                          .supervisor as Record<string, unknown>
                      ).email ?? "",
                    ),
                  }
                : null,
          }
        : null,
    masterTask:
      raw.masterTask && typeof raw.masterTask === "object"
        ? {
            id: Number((raw.masterTask as Record<string, unknown>).id ?? 0),
            title: String((raw.masterTask as Record<string, unknown>).title ?? ""),
          }
        : null,
  };
}

function mapDailyStaffTask(raw: Record<string, unknown>): DailyStaffTaskRecord {
  return {
    id: Number(raw.id ?? 0),
    staffMasterTaskId: Number(raw.staffMasterTaskId ?? 0),
    staffId: Number(raw.staffId ?? 0),
    taskDate: String(raw.taskDate ?? ""),
    status: String(raw.status ?? ""),
    createdAt: String(raw.createdAt ?? ""),
    updatedAt: String(raw.updatedAt ?? ""),
    staff:
      raw.staff && typeof raw.staff === "object"
        ? mapStaffAssignment({
            staff: raw.staff,
            id: 0,
            staffId: 0,
            masterTaskId: 0,
            startDate: "",
            endDate: "",
            isActive: false,
            createdAt: "",
            updatedAt: "",
          }).staff
        : null,
    staffMasterTask:
      raw.staffMasterTask && typeof raw.staffMasterTask === "object"
        ? {
            ...mapStaffAssignment(raw.staffMasterTask as Record<string, unknown>),
            masterTask:
              (raw.staffMasterTask as Record<string, unknown>).masterTask &&
              typeof (raw.staffMasterTask as Record<string, unknown>).masterTask ===
                "object"
                ? mapMasterTask(
                    (raw.staffMasterTask as Record<string, unknown>)
                      .masterTask as Record<string, unknown>,
                  )
                : null,
          }
        : undefined,
  };
}

function toLegacyTask(task: MasterTaskRecord): Task {
  return {
    _id: String(task.id),
    id: String(task.id),
    title: task.title,
    description: task.description ?? "",
    status: "TO_DO",
    priority: task.priority ?? undefined,
    assignee: null,
    assigneeId: null,
    locationFloor: task.zone?.zone ?? null,
    propertyName: null,
    roomNumber: null,
    category: null,
    dueDate: undefined,
    startTime: task.startTime ?? undefined,
    endTime: task.endTime ?? undefined,
  };
}

export async function getTasks(): Promise<Task[]> {
  const res = await fetch(API_TASKS(), { headers: getAuthHeaders() });
  const payload = unwrapApiData<unknown[]>(await readJsonOrThrow(res));
  const tasks = Array.isArray(payload)
    ? payload.map((item) => mapMasterTask(item as Record<string, unknown>))
    : [];
  return tasks.map(toLegacyTask);
}

export async function getMasterTasks(): Promise<MasterTaskRecord[]> {
  const res = await fetch(API_TASKS(), { headers: getAuthHeaders() });
  const payload = unwrapApiData<unknown[]>(await readJsonOrThrow(res));
  return Array.isArray(payload)
    ? payload.map((item) => mapMasterTask(item as Record<string, unknown>))
    : [];
}

export async function getTaskById(id: string): Promise<Task> {
  const task = await getMasterTaskById(id);
  return toLegacyTask(task);
}

export async function getMasterTaskById(
  id: string | number,
): Promise<MasterTaskRecord> {
  const tasks = await getMasterTasks();
  const match = tasks.find((task) => String(task.id) === String(id));
  if (!match) {
    throw new Error("Task not found.");
  }
  return match;
}

export async function createTask(data: unknown): Promise<unknown> {
  const input = data as Record<string, unknown>;
  const payload = {
    title: String(input.title ?? ""),
    description:
      input.description == null ? undefined : String(input.description),
    zoneId: input.zoneId == null || input.zoneId === ""
      ? undefined
      : Number(input.zoneId),
    priority:
      input.priority == null || input.priority === ""
        ? undefined
        : String(input.priority).toUpperCase(),
    startTime:
      input.startTime == null || input.startTime === ""
        ? undefined
        : String(input.startTime),
    endTime:
      input.endTime == null || input.endTime === ""
        ? undefined
        : String(input.endTime),
    materials: Array.isArray(input.materials)
      ? input.materials.map((item) => String(item))
      : undefined,
  };
  const res = await fetch(API_TASKS(), {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  return readJsonOrThrow(res);
}

export async function updateTask(
  id: string | number,
  data: Record<string, unknown>,
): Promise<unknown> {
  const apiData: Record<string, unknown> = {
    taskName: data.title ?? data.taskName ?? "",
    description: data.description == null ? "" : String(data.description),
    assigneeId:
      data.assigneeId === "" || data.assigneeId == null
        ? undefined
        : data.assigneeId,
    priority: data.priority
      ? String(data.priority).toUpperCase()
      : "NORMAL",
    locationFloor:
      data.locationFloor == null || data.locationFloor === ""
        ? undefined
        : String(data.locationFloor),
    startTime:
      data.startTime == null || data.startTime === ""
        ? undefined
        : String(data.startTime),
    endTime:
      data.endTime == null || data.endTime === ""
        ? undefined
        : String(data.endTime),
    timeDuration:
      data.timeDuration == null || data.timeDuration === ""
        ? undefined
        : data.timeDuration,
    frequency:
      data.frequency == null || data.frequency === ""
        ? undefined
        : String(data.frequency),
  };
  if (data.status != null && data.status !== "") {
    apiData.status = String(data.status).toLowerCase();
  }
  const res = await fetch(
    `${API_TASKS()}/${encodeURIComponent(String(id))}`,
    {
      method: "PUT",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(apiData),
    },
  );
  return readJsonOrThrow(res);
}

export async function updateTaskStatus(
  id: string | number,
  status: string,
): Promise<unknown> {
  const res = await fetch(
    `${API_TASKS()}/${encodeURIComponent(String(id))}/status`,
    {
      method: "PATCH",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ status: String(status).toLowerCase() }),
    },
  );
  return readJsonOrThrow(res);
}

export async function deleteTask(): Promise<unknown> {
  throw new Error("Master task delete is not documented by the admin API.");
}

export async function approveTask(): Promise<unknown> {
  throw new Error("Task approval is not documented by the admin API.");
}

export async function rejectTask(): Promise<unknown> {
  throw new Error("Task approval is not documented by the admin API.");
}

export async function getStaffMasterTasks(): Promise<StaffMasterTaskRecord[]> {
  const res = await fetch(API_ASSIGNMENTS(), { headers: getAuthHeaders() });
  const payload = unwrapApiData<unknown[]>(await readJsonOrThrow(res));
  return Array.isArray(payload)
    ? payload.map((item) => mapStaffAssignment(item as Record<string, unknown>))
    : [];
}

export async function assignStaffMasterTask(data: {
  staffId: number;
  masterTaskId: number;
  startDate: string;
  endDate: string;
}): Promise<{ message?: string; data: StaffMasterTaskRecord }> {
  const res = await fetch(API_ASSIGNMENTS(), {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  const payload = (await readJsonOrThrow(res)) as {
    message?: string;
    data: Record<string, unknown>;
  };
  return {
    message: payload.message,
    data: mapStaffAssignment(payload.data),
  };
}

export async function runDailyTasksCron(): Promise<{
  message?: string;
  created: number;
  skipped: number;
}> {
  const res = await fetch(API_CRON(), {
    method: "POST",
    headers: getAuthHeaders(),
  });
  const payload = (await readJsonOrThrow(res)) as Record<string, unknown>;
  return {
    message: payload.message == null ? undefined : String(payload.message),
    created: Number(payload.created ?? 0),
    skipped: Number(payload.skipped ?? 0),
  };
}

export async function getDailyStaffTasks(
  filters: TaskFilters = {},
): Promise<DailyStaffTaskRecord[]> {
  const search = new URLSearchParams();
  if (filters.date) search.set("date", filters.date);
  const res = await fetch(
    `${API_DAILY_TASKS()}${search.toString() ? `?${search.toString()}` : ""}`,
    { headers: getAuthHeaders() },
  );
  const payload = unwrapApiData<unknown[]>(await readJsonOrThrow(res));
  return Array.isArray(payload)
    ? payload.map((item) => mapDailyStaffTask(item as Record<string, unknown>))
    : [];
}

export function normalizeTask(t: Record<string, unknown>): Task {
  return toLegacyTask(mapMasterTask(t));
}

import { getApiBaseUrl } from "./env";
import { getAuthHeaders, readJsonOrThrow, unwrapApiData } from "./client";

const API_BASE = () => `${getApiBaseUrl()}/api/users`;
const API_ROLES = () => `${getApiBaseUrl()}/api/roles`;
const API_DEPARTMENTS = () => `${getApiBaseUrl()}/api/departments`;

export interface UserRelation {
  id: number;
  name: string;
  email: string;
}

export interface AdminUserRecord {
  id: number;
  name: string;
  email: string;
  role: string;
  manager?: UserRelation | null;
  supervisor?: UserRelation | null;
  createdAt?: string;
  [key: string]: unknown;
}

export interface UserListResponse {
  data: AdminUserRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ManagerRecord extends UserRelation {
  supervisorCount: number;
}

export interface SupervisorRecord extends UserRelation {
  manager?: UserRelation | null;
  staffCount: number;
}

export interface StaffRecord extends UserRelation {
  supervisor?: UserRelation | null;
}

export interface RoleRecord {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

function mapRelation(raw: unknown): UserRelation | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  return {
    id: Number(value.id ?? 0),
    name: String(value.name ?? ""),
    email: String(value.email ?? ""),
  };
}

function mapUser(raw: Record<string, unknown>): AdminUserRecord {
  return {
    ...raw,
    id: Number(raw.id ?? 0),
    name: String(raw.name ?? ""),
    email: String(raw.email ?? ""),
    role: String(raw.role ?? ""),
    manager: mapRelation(raw.manager),
    supervisor: mapRelation(raw.supervisor),
    createdAt: raw.createdAt == null ? undefined : String(raw.createdAt),
  };
}

export async function getUsers(params?: {
  page?: number;
  limit?: number;
}): Promise<UserListResponse> {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));

  const res = await fetch(
    `${API_BASE()}${search.toString() ? `?${search.toString()}` : ""}`,
    { headers: getAuthHeaders() },
  );
  const payload = (await readJsonOrThrow(res)) as {
    data?: unknown[];
    pagination?: Record<string, unknown>;
  };

  return {
    data: Array.isArray(payload.data)
      ? payload.data.map((item) => mapUser(item as Record<string, unknown>))
      : [],
    pagination: {
      page: Number(payload.pagination?.page ?? params?.page ?? 1),
      limit: Number(payload.pagination?.limit ?? params?.limit ?? 10),
      total: Number(payload.pagination?.total ?? 0),
      totalPages: Number(payload.pagination?.totalPages ?? 1),
    },
  };
}

export async function getManagers(): Promise<ManagerRecord[]> {
  const res = await fetch(`${API_BASE()}/managers`, {
    headers: getAuthHeaders(),
  });
  const payload = unwrapApiData<unknown[]>(await readJsonOrThrow(res));
  return Array.isArray(payload)
    ? payload.map((item) => {
        const raw = item as Record<string, unknown>;
        return {
          id: Number(raw.id ?? 0),
          name: String(raw.name ?? ""),
          email: String(raw.email ?? ""),
          supervisorCount: Number(raw.supervisorCount ?? 0),
        };
      })
    : [];
}

export async function getSupervisors(): Promise<SupervisorRecord[]> {
  const res = await fetch(`${API_BASE()}/supervisors`, {
    headers: getAuthHeaders(),
  });
  const payload = unwrapApiData<unknown[]>(await readJsonOrThrow(res));
  return Array.isArray(payload)
    ? payload.map((item) => {
        const raw = item as Record<string, unknown>;
        return {
          id: Number(raw.id ?? 0),
          name: String(raw.name ?? ""),
          email: String(raw.email ?? ""),
          manager: mapRelation(raw.manager),
          staffCount: Number(raw.staffCount ?? 0),
        };
      })
    : [];
}

export async function getStaffUsers(): Promise<StaffRecord[]> {
  const res = await fetch(`${API_BASE()}/staff`, {
    headers: getAuthHeaders(),
  });
  const payload = unwrapApiData<unknown[]>(await readJsonOrThrow(res));
  return Array.isArray(payload)
    ? payload.map((item) => {
        const raw = item as Record<string, unknown>;
        return {
          id: Number(raw.id ?? 0),
          name: String(raw.name ?? ""),
          email: String(raw.email ?? ""),
          supervisor: mapRelation(raw.supervisor),
        };
      })
    : [];
}

export async function getUsersForAssignee(): Promise<Record<string, unknown>[]> {
  const staff = await getStaffUsers();
  return staff.map((item) => ({
    id: String(item.id),
    _id: String(item.id),
    name: item.name,
    email: item.email,
    supervisor: item.supervisor,
    role: "staff",
  }));
}

export async function getUserById(id: string): Promise<Record<string, unknown> | null> {
  const response = await getUsers({ page: 1, limit: 100 });
  const match = response.data.find((user) => String(user.id) === id);
  return match ?? null;
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
  const res = await fetch(`${API_BASE()}/${id}`, {
    method: "PUT",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
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

export async function getRoles(): Promise<RoleRecord[]> {
  const res = await fetch(API_ROLES(), { headers: getAuthHeaders() });
  const payload = unwrapApiData<unknown[]>(await readJsonOrThrow(res));
  return Array.isArray(payload)
    ? payload.map((item) => {
        const raw = item as Record<string, unknown>;
        return {
          id: Number(raw.id ?? 0),
          name: String(raw.name ?? ""),
          createdAt: String(raw.createdAt ?? ""),
          updatedAt: String(raw.updatedAt ?? ""),
        };
      })
    : [];
}

let departmentsCache: unknown[] | null = null;
let departmentsPromise: Promise<unknown[]> | null = null;

export async function getDepartments(): Promise<unknown[]> {
  if (departmentsCache) return departmentsCache;
  if (departmentsPromise) return departmentsPromise;
  departmentsPromise = (async () => {
    const res = await fetch(API_DEPARTMENTS(), { headers: getAuthHeaders() });
    const json = (await readJsonOrThrow(res)) as { data?: unknown[] };
    departmentsCache = Array.isArray(json.data) ? json.data : [];
    return departmentsCache;
  })();
  return departmentsPromise;
}

export async function getDepartmentById(departmentId: string): Promise<unknown> {
  const res = await fetch(`${API_DEPARTMENTS()}/${departmentId}`, {
    headers: getAuthHeaders(),
  });
  const json = await readJsonOrThrow(res);
  return unwrapApiData(json);
}

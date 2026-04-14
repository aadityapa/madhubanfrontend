import { getApiBaseUrl } from "./env";
import { getAuthHeaders, readJsonOrThrow, unwrapApiData } from "./client";

const API_PROPERTIES = () => `${getApiBaseUrl()}/api/properties`;
const API_ASSETS = () => `${getApiBaseUrl()}/api/assets`;
const API_REPORTS = () => `${getApiBaseUrl()}/api/reports`;

export interface PropertyZone {
  id: number;
  propertyFloorId: number;
  zone: string;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyFloor {
  id: number;
  propertyId: number;
  floorNo: number;
  createdAt: string;
  updatedAt: string;
  floorZones?: PropertyZone[];
}

export interface PropertyDepartment {
  id?: number;
  name?: string;
  [key: string]: unknown;
}

export interface PropertyRecord {
  id: number;
  name: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  departments: PropertyDepartment[];
  floors: PropertyFloor[];
}

export interface PropertySummaryRecord {
  id: number;
  name: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  departmentCount: number;
  floorCount: number;
  zoneCount: number;
}

export interface CreatePropertyFloorInput {
  floorNumber: number;
  zones?: Array<{ name: string }>;
}

export interface CreatePropertyInput {
  propertyName?: string;
  name?: string;
  floors?: CreatePropertyFloorInput[];
}

function mapZone(raw: Record<string, unknown>): PropertyZone {
  return {
    id: Number(raw.id ?? 0),
    propertyFloorId: Number(raw.propertyFloorId ?? 0),
    zone: String(raw.zone ?? ""),
    createdAt: String(raw.createdAt ?? ""),
    updatedAt: String(raw.updatedAt ?? ""),
  };
}

function mapFloor(raw: Record<string, unknown>): PropertyFloor {
  return {
    id: Number(raw.id ?? 0),
    propertyId: Number(raw.propertyId ?? 0),
    floorNo: Number(raw.floorNo ?? 0),
    createdAt: String(raw.createdAt ?? ""),
    updatedAt: String(raw.updatedAt ?? ""),
    floorZones: Array.isArray(raw.floorZones)
      ? raw.floorZones.map((zone) => mapZone(zone as Record<string, unknown>))
      : undefined,
  };
}

function mapProperty(raw: Record<string, unknown>): PropertyRecord {
  return {
    id: Number(raw.id ?? 0),
    name: String(raw.name ?? ""),
    imageUrl: raw.imageUrl == null ? null : String(raw.imageUrl),
    createdAt: String(raw.createdAt ?? ""),
    updatedAt: String(raw.updatedAt ?? ""),
    departments: Array.isArray(raw.departments)
      ? (raw.departments as PropertyDepartment[])
      : [],
    floors: Array.isArray(raw.floors)
      ? raw.floors.map((floor) => mapFloor(floor as Record<string, unknown>))
      : [],
  };
}

function mapPropertySummary(raw: Record<string, unknown>): PropertySummaryRecord {
  return {
    id: Number(raw.id ?? 0),
    name: String(raw.name ?? ""),
    imageUrl: raw.imageUrl == null ? null : String(raw.imageUrl),
    createdAt: String(raw.createdAt ?? ""),
    updatedAt: String(raw.updatedAt ?? ""),
    departmentCount: Number(raw.departmentCount ?? 0),
    floorCount: Number(raw.floorCount ?? 0),
    zoneCount: Number(raw.zoneCount ?? 0),
  };
}

export async function getPropertySummary(): Promise<PropertySummaryRecord[]> {
  const res = await fetch(`${API_PROPERTIES()}/summary`, {
    headers: getAuthHeaders(),
  });
  const payload = unwrapApiData<unknown[]>(await readJsonOrThrow(res));
  return Array.isArray(payload)
    ? payload.map((item) => mapPropertySummary(item as Record<string, unknown>))
    : [];
}

export async function getProperties(): Promise<PropertyRecord[]> {
  const res = await fetch(API_PROPERTIES(), { headers: getAuthHeaders() });
  const payload = unwrapApiData<unknown[]>(await readJsonOrThrow(res));
  return Array.isArray(payload)
    ? payload.map((item) => mapProperty(item as Record<string, unknown>))
    : [];
}

export async function getPropertyById(id: string | number): Promise<PropertyRecord> {
  const res = await fetch(`${API_PROPERTIES()}/${id}`, {
    headers: getAuthHeaders(),
  });
  return mapProperty(
    unwrapApiData<Record<string, unknown>>(await readJsonOrThrow(res)),
  );
}

export async function getPropertyWithFloors(id: string | number): Promise<PropertyRecord> {
  return getPropertyById(id);
}

export async function getPropertyFloors(id: string | number): Promise<PropertyFloor[]> {
  const res = await fetch(`${API_PROPERTIES()}/${id}/floors`, {
    headers: getAuthHeaders(),
  });
  const payload = unwrapApiData<unknown[]>(await readJsonOrThrow(res));
  return Array.isArray(payload)
    ? payload.map((item) => mapFloor(item as Record<string, unknown>))
    : [];
}

export async function getPropertyFloorZones(
  propertyId: string | number,
  floorId: string | number,
): Promise<PropertyZone[]> {
  const res = await fetch(
    `${API_PROPERTIES()}/${propertyId}/floors/${floorId}/zones`,
    { headers: getAuthHeaders() },
  );
  const payload = unwrapApiData<unknown[]>(await readJsonOrThrow(res));
  return Array.isArray(payload)
    ? payload.map((item) => mapZone(item as Record<string, unknown>))
    : [];
}

export async function createProperty(
  data: CreatePropertyInput | FormData,
): Promise<{ message?: string; data: PropertyRecord }> {
  const isFormData = data instanceof FormData;
  const res = await fetch(API_PROPERTIES(), {
    method: "POST",
    headers: isFormData
      ? getAuthHeaders()
      : getAuthHeaders({ "Content-Type": "application/json" }),
    body: isFormData ? data : JSON.stringify(data),
  });
  const payload = (await readJsonOrThrow(res)) as {
    message?: string;
    data: Record<string, unknown>;
  };
  return {
    message: payload.message,
    data: mapProperty(payload.data),
  };
}

export async function updateProperty(
  id: string | number,
  data: { name: string } | FormData,
): Promise<{ message?: string; data: PropertyRecord }> {
  const isFormData = data instanceof FormData;
  const res = await fetch(`${API_PROPERTIES()}/${id}`, {
    method: "PATCH",
    headers: isFormData
      ? getAuthHeaders()
      : getAuthHeaders({ "Content-Type": "application/json" }),
    body: isFormData ? data : JSON.stringify(data),
  });
  const payload = (await readJsonOrThrow(res)) as {
    message?: string;
    data: Record<string, unknown>;
  };
  return {
    message: payload.message,
    data: mapProperty(payload.data),
  };
}

export async function deleteProperty(
  id: string | number,
): Promise<{ message?: string }> {
  const res = await fetch(`${API_PROPERTIES()}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return (await readJsonOrThrow(res)) as { message?: string };
}

export async function getAssets(params: Record<string, string> = {}): Promise<unknown> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API_ASSETS()}${qs ? `?${qs}` : ""}`, {
    headers: getAuthHeaders(),
  });
  return readJsonOrThrow(res);
}

export async function getAssetSummary(): Promise<unknown> {
  const res = await fetch(`${API_ASSETS()}/summary`, {
    headers: getAuthHeaders(),
  });
  return readJsonOrThrow(res);
}

export async function getReports(params: Record<string, string> = {}): Promise<unknown> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API_REPORTS()}${qs ? `?${qs}` : ""}`, {
    headers: getAuthHeaders(),
  });
  return readJsonOrThrow(res);
}

export async function getReportsAnalytics(
  params: Record<string, string> = {},
): Promise<unknown> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API_REPORTS()}/analytics${qs ? `?${qs}` : ""}`, {
    headers: getAuthHeaders(),
  });
  return readJsonOrThrow(res);
}

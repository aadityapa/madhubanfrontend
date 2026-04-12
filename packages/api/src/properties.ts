import { getApiBaseUrl } from "./env";
import { getAuthHeaders, readJsonOrThrow } from "./client";

const API_PROPERTIES = () => `${getApiBaseUrl()}/api/properties`;
const API_ASSETS = () => `${getApiBaseUrl()}/api/assets`;
const API_REPORTS = () => `${getApiBaseUrl()}/api/reports`;

export async function getProperties(params: Record<string, string> = {}): Promise<unknown[]> {
  try {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${API_PROPERTIES()}${qs ? `?${qs}` : ""}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to fetch properties (${res.status})`);
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const list =
      (Array.isArray(json.data) && (json.data as unknown[])) ||
      ((json.data as { properties?: unknown[] } | undefined)?.properties) ||
      ((json as { properties?: unknown[] }).properties) ||
      (Array.isArray(json) ? json : []);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.warn("[api] getProperties failed", e);
    return [];
  }
}

export async function getPropertyById(id: string): Promise<unknown> {
  const res = await fetch(`${API_PROPERTIES()}/${id}`, { headers: getAuthHeaders() });
  return readJsonOrThrow(res);
}

export async function getPropertyWithFloors(id: string): Promise<unknown> {
  const res = await fetch(`${API_PROPERTIES()}/${id}?include=floors`, {
    headers: getAuthHeaders(),
  });
  return readJsonOrThrow(res);
}

export async function createProperty(data: unknown): Promise<unknown> {
  const headers = getAuthHeaders();
  if (data instanceof FormData) {
    const res = await fetch(API_PROPERTIES(), { method: "POST", headers, body: data });
    return readJsonOrThrow(res);
  }
  const res = await fetch(API_PROPERTIES(), {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  return readJsonOrThrow(res);
}

export async function updateProperty(id: string, data: unknown): Promise<unknown> {
  if (data instanceof FormData) {
    const res = await fetch(`${API_PROPERTIES()}/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: data,
    });
    return readJsonOrThrow(res);
  }
  const res = await fetch(`${API_PROPERTIES()}/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  return readJsonOrThrow(res);
}

export async function deleteProperty(id: string): Promise<unknown> {
  const res = await fetch(`${API_PROPERTIES()}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return readJsonOrThrow(res);
}

export async function getPropertySummary(): Promise<unknown> {
  const res = await fetch(`${API_PROPERTIES()}/summary`, { headers: getAuthHeaders() });
  return readJsonOrThrow(res);
}

export async function getAssets(params: Record<string, string> = {}): Promise<unknown> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API_ASSETS()}${qs ? `?${qs}` : ""}`, { headers: getAuthHeaders() });
  return readJsonOrThrow(res);
}

export async function getAssetSummary(): Promise<unknown> {
  const res = await fetch(`${API_ASSETS()}/summary`, { headers: getAuthHeaders() });
  return readJsonOrThrow(res);
}

export async function getReports(params: Record<string, string> = {}): Promise<unknown> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API_REPORTS()}${qs ? `?${qs}` : ""}`, { headers: getAuthHeaders() });
  return readJsonOrThrow(res);
}

export async function getReportsAnalytics(params: Record<string, string> = {}): Promise<unknown> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API_REPORTS()}/analytics${qs ? `?${qs}` : ""}`, {
    headers: getAuthHeaders(),
  });
  return readJsonOrThrow(res);
}


import { getApiBaseUrl } from "./env";
import { getAuthHeaders } from "./client";

export async function getSupervisorDashboard(): Promise<unknown> {
  const url = `${getApiBaseUrl()}/api/supervisor/dashboard`.replace(
    /([^:]\/)\/+/g,
    "$1",
  );
  const res = await fetch(url, { headers: getAuthHeaders() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (json as { message?: string }).message ??
      (json as { error?: string }).error ??
      `Request failed (${res.status})`;
    throw new Error(msg);
  }
  if (!(json as { success?: boolean }).success || (json as { data?: unknown }).data == null) {
    throw new Error("Invalid dashboard response");
  }
  return (json as { data: unknown }).data;
}

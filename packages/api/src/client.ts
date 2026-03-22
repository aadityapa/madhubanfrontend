let getToken: () => string | null = () => null;

export function configureAuthTokenGetter(fn: () => string | null): void {
  getToken = fn;
}

export function getAuthHeaders(
  extra?: Record<string, string>,
): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  const t = getToken();
  if (t) headers.Authorization = `Bearer ${t}`;
  return headers;
}

export async function readJsonOrThrow(res: Response): Promise<unknown> {
  const text = await res.text();
  let data: unknown = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }
  if (!res.ok) {
    const msg =
      (data as { message?: string; error?: string })?.message ??
      (data as { error?: string })?.error ??
      `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

/** Backend base URL — same contract as legacy `reference api files/api.js` */

const LIVE_BACKEND = "https://madhuban360-backend.onrender.com";

let configuredBase: string | null = null;

/** Optional override (e.g. app reads `import.meta.env` and passes at startup). */
export function configureApiBaseUrl(baseUrl: string | null): void {
  configuredBase = baseUrl === null ? null : baseUrl.replace(/\/+$/, "");
}

function readEnv(): Record<string, string | undefined> {
  const proc =
    typeof globalThis !== "undefined" && "process" in globalThis
      ? (globalThis as { process?: { env?: Record<string, string | undefined> } })
          .process
      : undefined;
  if (proc?.env) return proc.env;
  return {};
}

/**
 * - If `EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_API_BASE_URL` / `VITE_API_URL` / `VITE_API_BASE_URL`
 *   is set (including `""`), that wins (Node/Expo; web apps should also call `configureApiBaseUrl` from Vite `import.meta.env`).
 * - Else if `configureApiBaseUrl` was called, use it.
 * - Else production → live backend; development → `""` for same-origin / proxy (Vite).
 */
export function getApiBaseUrl(): string {
  const env = readEnv();
  const fromEnv =
    env.EXPO_PUBLIC_API_URL ??
    env.EXPO_PUBLIC_API_BASE_URL ??
    env.VITE_API_URL ??
    env.VITE_API_BASE_URL;
  if (fromEnv !== undefined) return fromEnv.replace(/\/+$/, "");
  if (configuredBase !== null) return configuredBase;
  const isDev = env.NODE_ENV !== "production";
  return isDev ? "" : LIVE_BACKEND;
}

export function getDevTokenFallback(): string {
  const env = readEnv();
  return env.VITE_DEV_TOKEN ?? env.EXPO_PUBLIC_DEV_TOKEN ?? "demo-token";
}

export function allowDemo404Fallback(): boolean {
  const env = readEnv();
  if (env.VITE_ALLOW_DEMO_404 === "1" || env.EXPO_PUBLIC_ALLOW_DEMO_404 === "1")
    return true;
  return env.NODE_ENV !== "production";
}

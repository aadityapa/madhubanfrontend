let configuredBase: string | null = null;

export function configureApiBaseUrl(baseUrl: string | null): void {
  configuredBase = baseUrl === null ? null : baseUrl.replace(/\/+$/, "");
}

function readEnv(): Record<string, string | undefined> {
  const proc =
    typeof globalThis !== "undefined" && "process" in globalThis
      ? (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
      : undefined;
  if (proc?.env) return proc.env;
  return {};
}

export function getApiBaseUrl(): string {
  const env = readEnv();
  const fromEnv =
    env.EXPO_PUBLIC_API_BASE_URL ??
    env.EXPO_PUBLIC_API_URL ??
    env.VITE_API_BASE_URL ??
    env.VITE_API_URL;
  if (fromEnv !== undefined) return fromEnv.replace(/\/+$/, "");
  if (configuredBase !== null) return configuredBase;
  return "";
}

export function getDevTokenFallback(): string {
  const env = readEnv();
  return env.VITE_DEV_TOKEN ?? env.EXPO_PUBLIC_DEV_TOKEN ?? "demo-token";
}

export function allowDemo404Fallback(): boolean {
  const env = readEnv();
  if (env.VITE_ALLOW_DEMO_404 === "1" || env.EXPO_PUBLIC_ALLOW_DEMO_404 === "1") {
    return true;
  }
  return env.NODE_ENV !== "production";
}

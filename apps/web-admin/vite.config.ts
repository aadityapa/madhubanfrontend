import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode, command }) => {
  const rootDir = path.resolve(__dirname, "../..");
  const env = loadEnv(mode, rootDir, "");
  const target =
    env.VITE_WEB_ADMIN_API_URL ||
    env.VITE_PROXY_TARGET ||
    env.VITE_API_URL ||
    env.VITE_API_BASE_URL;

  if (command === "serve" && !target) {
    throw new Error(
      "Missing API base URL. Set VITE_API_BASE_URL (or VITE_WEB_ADMIN_API_URL) in the root .env.",
    );
  }

  return {
    envDir: rootDir,
    plugins: [react()],
    server: {
      proxy: target
        ? {
            "/api": {
              target: target.replace(/\/+$/, ""),
              changeOrigin: true,
            },
          }
        : undefined,
    },
  };
});

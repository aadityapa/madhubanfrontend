import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

/** FRONTEND_API_INTEGRATION.md: proxy `/api` → local backend (default `http://localhost:3000`). */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target =
    env.VITE_PROXY_TARGET ||
    env.VITE_API_URL ||
    env.VITE_API_BASE_URL ||
    "http://localhost:3000";

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: target.replace(/\/+$/, ""),
          changeOrigin: true,
        },
      },
    },
  };
});

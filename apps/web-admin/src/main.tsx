import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { configureApiBaseUrl, configureAuthTokenGetter } from "@madhuban/api";
import "@madhuban/theme/tokens.css";
import App from "./App.tsx";
import "./index.css";

/** Prefer a web-admin-specific API root, then fall back to shared Vite vars. */
const viteApiRoot = [
  import.meta.env.VITE_WEB_ADMIN_API_URL,
  import.meta.env.VITE_API_URL,
  import.meta.env.VITE_API_BASE_URL,
]
  .map((v) => (typeof v === "string" ? v.trim().replace(/\/+$/, "") : ""))
  .find((v) => v.length > 0);

if (viteApiRoot) {
  configureApiBaseUrl(viteApiRoot);
} else if (import.meta.env.DEV) {
  configureApiBaseUrl("");
} else {
  configureApiBaseUrl(null);
}
configureAuthTokenGetter(() => localStorage.getItem("token"));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { configureApiBaseUrl, configureAuthTokenGetter } from "@madhuban/api";
import "@madhuban/theme/tokens.css";
import App from "./App.tsx";
import "./index.css";

configureApiBaseUrl(import.meta.env.DEV ? "" : null);
configureAuthTokenGetter(() => localStorage.getItem("token"));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

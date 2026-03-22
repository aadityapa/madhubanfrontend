/**
 * API Configuration
 * -----------------
 * All API requests use this base URL. Backend: https://madhuban360-backend.onrender.com
 *
 * - Dev: When unset, use "" so requests are relative → Vite proxy (vite.config.js)
 *   forwards /api to the live backend. Set VITE_API_BASE_URL only to override.
 * - Production: When unset, use the live backend URL so deployed app works without env.
 */
const LIVE_BACKEND = "https://madhuban360-backend.onrender.com";
const envUrl = import.meta.env.VITE_API_BASE_URL;
const defaultUrl = import.meta.env.DEV ? "" : LIVE_BACKEND;
export const API_BASE_URL = (envUrl != null && envUrl !== "") ? envUrl.replace(/\/+$/, "") : defaultUrl;

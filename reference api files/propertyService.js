/**
 * Property Tab API Service
 * ------------------------
 * Backend: GET/POST /api/properties, GET /api/assets, GET /api/reports
 * Base URL: https://madhuban360-backend.onrender.com (see .env)
 */

import { API_BASE_URL } from "../../config/api";
import { readJsonOrThrow, getAuthHeaders } from "../../lib/apiClient";

const API_PROPERTIES = `${API_BASE_URL}/api/properties`;
const API_ASSETS = `${API_BASE_URL}/api/assets`;
const API_REPORTS = `${API_BASE_URL}/api/reports`;

// -----------------------------------------------------------------------------
// PROPERTIES (CRUD - saves to database via backend)
// -----------------------------------------------------------------------------

/** Normalize property object from backend to frontend format */
function normalizeProperty(p) {
  return {
    ...p,
    name: p.propertyName || p.name,
    category: p.propertyType || p.category || "COMMERCIAL",
    image: p.imageUrl || p.image || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab",
    location: p.location || [p.city, p.stateProvince].filter(Boolean).join(", ") || "—",
    amcStatus: p.amcStatus || "ACTIVE",
    amcColor: p.amcStatus === "EXPIRED" ? "text-red-600" : p.amcStatus === "EXPIRING SOON" ? "text-amber-600" : "text-green-600",
    isExpired: p.amcStatus === "EXPIRED",
  };
}

/** GET /api/properties - Fetch all properties from database */
export async function getProperties(params = {}) {
  try {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${API_PROPERTIES}${qs ? `?${qs}` : ""}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch properties (${res.status})`);
    const json = await res.json();
    const list = Array.isArray(json?.data) ? json.data : (json?.data?.properties ?? json?.properties ?? json?.list ?? (Array.isArray(json) ? json : []));
    return list.map(normalizeProperty);
  } catch (e) {
    console.warn("[propertyService] getProperties fallback", e);
    return FALLBACK_PROPERTIES;
  }
}

/** GET /api/properties/:id - Fetch single property */
export async function getPropertyById(id) {
  try {
    const res = await fetch(`${API_PROPERTIES}/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Property not found");
    const json = await res.json();
    return json?.data?.property ?? json?.data ?? json;
  } catch (e) {
    console.warn("[propertyService] getPropertyById fallback", e);
    return FALLBACK_PROPERTIES.find((p) => String(p.id) === String(id)) || null;
  }
}

/** GET /api/properties/:id?include=floors - Fetch property with nested floors & zones */
export async function getPropertyWithFloors(id) {
  try {
    const res = await fetch(`${API_PROPERTIES}/${id}?include=floors`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Property not found");
    const json = await res.json();
    return json?.data ?? json;
  } catch (e) {
    console.warn("[propertyService] getPropertyWithFloors error", e);
    return null;
  }
}

/** POST /api/properties - Create new property (multipart/form-data: propertyName, floors, image) */
export async function createProperty(formData) {
  const headers = getAuthHeaders();
  if (!(formData instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    const res = await fetch(API_PROPERTIES, {
      method: "POST",
      headers,
      body: JSON.stringify(formData),
    });
    return readJsonOrThrow(res);
  }
  const res = await fetch(API_PROPERTIES, {
    method: "POST",
    headers,
    body: formData,
  });
  return readJsonOrThrow(res);
}

/** PATCH /api/properties/:id - Update property (supports JSON or FormData) */
export async function updateProperty(id, data) {
  const url = `${API_PROPERTIES}/${id}`;

  // If FormData (e.g. propertyName, floors, image)
  if (data instanceof FormData) {
    const res = await fetch(url, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: data,
    });
    return readJsonOrThrow(res);
  }

  // Fallback JSON body
  const res = await fetch(url, {
    method: "PATCH",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  return readJsonOrThrow(res);
}

/** DELETE /api/properties/:id - Delete property */
export async function deleteProperty(id) {
  const res = await fetch(`${API_PROPERTIES}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return readJsonOrThrow(res);
}

// -----------------------------------------------------------------------------
// PROPERTY SUMMARY METRICS (from backend / database aggregate)
// -----------------------------------------------------------------------------

/** GET /api/properties/summary - Dashboard-style metrics for property tab */
export async function getPropertySummary() {
  try {
    const res = await fetch(`${API_PROPERTIES}/summary`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch summary (${res.status})`);
    const json = await res.json();
    const data = json?.data ?? json;
    return {
      total: data.total ?? 0,
      activeAmc: data.activeAmcCount ?? data.activeAmc ?? 0,
      expiringAmc: data.expiringAmcCount ?? data.expiringAmc ?? 0,
      occupancyPercent: data.occupancy ?? data.occupancyPercent ?? 0,
    };
  } catch (e) {
    console.warn("[propertyService] getPropertySummary fallback", e);
    return { total: 42, activeAmc: 38, expiringAmc: 4, occupancyPercent: 92 };
  }
}

// -----------------------------------------------------------------------------
// ASSETS (for Asset Tracking tab - from backend / database)
// -----------------------------------------------------------------------------

/** GET /api/assets - Fetch all assets for tracking */
export async function getAssets(params = {}) {
  try {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${API_ASSETS}${qs ? `?${qs}` : ""}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch assets (${res.status})`);
    const json = await res.json();
    return json?.data ?? json;
  } catch (e) {
    console.warn("[propertyService] getAssets fallback", e);
    return { list: FALLBACK_ASSETS, total: 150 };
  }
}

/** GET /api/assets/summary - Asset metrics (Total, Needs Attention, etc.) */
export async function getAssetSummary() {
  try {
    const res = await fetch(`${API_ASSETS}/summary`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch asset summary (${res.status})`);
    const json = await res.json();
    return json?.data ?? json;
  } catch (e) {
    console.warn("[propertyService] getAssetSummary fallback", e);
    return { total: 1284, needsAttention: 12, upcomingService: 48, uptimeRate: 99.8 };
  }
}

// -----------------------------------------------------------------------------
// REPORTS (for Reports tab - from backend / database)
// -----------------------------------------------------------------------------

/** GET /api/reports - Fetch reports list */
export async function getReports(params = {}) {
  try {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${API_REPORTS}${qs ? `?${qs}` : ""}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch reports (${res.status})`);
    const json = await res.json();
    return json?.data ?? json;
  } catch (e) {
    console.warn("[propertyService] getReports fallback", e);
    return { list: FALLBACK_REPORTS };
  }
}

/** GET /api/reports/analytics - KPI + chart data for analytics */
export async function getReportsAnalytics(params = {}) {
  try {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${API_REPORTS}/analytics${qs ? `?${qs}` : ""}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch analytics (${res.status})`);
    const json = await res.json();
    return json?.data ?? json;
  } catch (e) {
    console.warn("[propertyService] getReportsAnalytics fallback", e);
    return FALLBACK_ANALYTICS;
  }
}

// -----------------------------------------------------------------------------
// FALLBACK DATA (used when backend is unavailable)
// -----------------------------------------------------------------------------

const FALLBACK_PROPERTIES = [
  { id: 1, name: "Grand Plaza Office Tower", location: "Downtown Financial District, NY", category: "COMMERCIAL", image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab", amcStatus: "ACTIVE", amcColor: "text-green-600" },
  { id: 2, name: "Blue Water Residences", location: "Bayfront Avenue, Miami", category: "RESIDENTIAL", image: "https://images.unsplash.com/photo-1560185127-6ed189bf02f4", amcStatus: "ACTIVE", amcColor: "text-green-600" },
  { id: 3, name: "Metro Logistics Hub", location: "Industrial Park, Chicago", category: "INDUSTRIAL", image: "https://images.unsplash.com/photo-1567401898914-159092af3f38", amcStatus: "EXPIRED", amcColor: "text-red-600", isExpired: true },
  { id: 4, name: "Riverside Retail Complex", location: "Riverside Drive, LA", category: "COMMERCIAL", image: "https://images.unsplash.com/photo-1497366216548-37526070297c", amcStatus: "EXPIRING SOON", amcColor: "text-amber-600" },
  { id: 5, name: "Park View Apartments", location: "Central Park West, NY", category: "RESIDENTIAL", image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00", amcStatus: "ACTIVE", amcColor: "text-green-600" },
];

const FALLBACK_ASSETS = [
  { id: "FAC-HVAC-004", name: "Chiller Unit #4", location: "Roof West - Section A", condition: "Excellent", conditionClass: "bg-emerald-100 text-emerald-800", lastMaint: "Oct 12, 2023", nextService: "Jan 15, 2024", nextServiceUrgent: false },
  { id: "FAC-ELV-012", name: "Elevator B", location: "Main Lobby - South Bank", condition: "Good", conditionClass: "bg-blue-100 text-blue-800", lastMaint: "Nov 05, 2023", nextService: "Feb 05, 2024", nextServiceUrgent: false },
  { id: "FAC-PWR-001", name: "Generator 01", location: "Basement Mech Room", condition: "Fair", conditionClass: "bg-amber-100 text-amber-800", lastMaint: "Sep 20, 2023", nextService: "Dec 20, 2023", nextServiceUrgent: true },
  { id: "FAC-VENT-012", name: "Exhaust Fan #12", location: "North Wing - Attic", condition: "Poor", conditionClass: "bg-red-100 text-red-800", lastMaint: "Aug 15, 2023", nextService: "ASAP", nextServiceUrgent: true },
];

const FALLBACK_REPORTS = [
  { id: "1", name: "Q3 Financial Audit 2023", category: "Financial", generatedDate: "Oct 24, 2023" },
  { id: "2", name: "Monthly Energy Log - Portfolio", category: "Sustainability", generatedDate: "Oct 20, 2023" },
  { id: "3", name: "HVAC Maintenance Performance", category: "Operational", generatedDate: "Oct 18, 2023" },
  { id: "4", name: "Security Incident Annual Review", category: "Operational", generatedDate: "Oct 15, 2023" },
];

const FALLBACK_ANALYTICS = {
  kpis: [
    { label: "TOTAL SPEND", value: "$42,500", trend: "-5.2% vs last month", trendDown: true },
    { label: "TASK COMPLETION", value: "94.2%", trend: "+2.8% vs last month", trendDown: false },
    { label: "ENERGY USAGE", value: "4.2k kWh", trend: "-2.1% efficiency drop", trendDown: true },
  ],
  chartData: { costsVsBudget: [], taskTrends: [], energyByProperty: [] },
};

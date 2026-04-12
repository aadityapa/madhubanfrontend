import { getApiBaseUrl } from "./env";
import { getAuthHeaders, readJsonOrThrow, unwrapApiData } from "./client";

const API_BASE = () => `${getApiBaseUrl()}/api/dashboard`;

async function getJson(path: string): Promise<unknown> {
  const res = await fetch(`${API_BASE()}${path}`, { headers: getAuthHeaders() });
  return unwrapApiData(await readJsonOrThrow(res));
}

export async function getDashboardMetrics(): Promise<Record<string, unknown>> {
  try {
    return (await getJson("/metrics")) as Record<string, unknown>;
  } catch (e) {
    console.warn("getDashboardMetrics failed, using fallback", e);
    return {
      totalProperties: 124,
      activeProperties: 110,
      inactiveProperties: 14,
      propertiesTrend: 4.2,
      totalUsers: 45,
      admins: 5,
      staff: 40,
      usersTrend: "stable",
      openTasks: 18,
      dueToday: 8,
      attendancePercent: 92,
      attendanceTrend: 2,
    };
  }
}

export async function getSalesPipeline(period = "6m"): Promise<unknown> {
  try {
    return await getJson(`/sales-pipeline?period=${period}`);
  } catch (e) {
    console.warn("getSalesPipeline failed, using fallback", e);
    return {
      data: [
        { name: "Leads", value: 28, fill: "#93c5fd" },
        { name: "Proposals", value: 18, fill: "#93c5fd" },
        { name: "Negot.", value: 12, fill: "#93c5fd" },
        { name: "Closed", value: 8, fill: "#93c5fd" },
      ],
      summary: { value: 42000, trend: 12.5, label: "from last month" },
    };
  }
}

export async function getRevenue(period = "6m"): Promise<unknown> {
  try {
    return await getJson(`/revenue?period=${period}`);
  } catch (e) {
    console.warn("getRevenue failed, using fallback", e);
    return {
      data: [
        { name: "JAN", revenue: 80, uv: 80 },
        { name: "FEB", revenue: 95, uv: 95 },
        { name: "MAR", revenue: 100, uv: 100 },
        { name: "APR", revenue: 105, uv: 105 },
        { name: "MAY", revenue: 115, uv: 115 },
        { name: "JUN", revenue: 128, uv: 128 },
      ],
      summary: { value: 128500, trend: 8.2, label: "Year-to-date" },
    };
  }
}

export async function getAlerts(): Promise<unknown> {
  try {
    return await getJson("/alerts");
  } catch (e) {
    console.warn("getAlerts failed, using fallback", e);
    return [
      {
        id: "1",
        title: "Elevator Failure - Block A North",
        reportedBy: "Security (Main Desk)",
        timeAgo: "12 mins ago",
        urgency: "URGENT",
        icon: "building",
      },
      {
        id: "2",
        title: "Light Outage - Hallway Level 4",
        reportedBy: "Staff (Maintenance)",
        timeAgo: "1 hour ago",
        urgency: "MEDIUM",
        icon: "light",
      },
      {
        id: "3",
        title: "Water Leakage - Basement Parking",
        reportedBy: "Automated Sensor B12",
        timeAgo: "3 hours ago",
        urgency: "URGENT",
        icon: "water",
      },
    ];
  }
}

export async function getActivity(): Promise<unknown> {
  try {
    return await getJson("/activity");
  } catch (e) {
    console.warn("getActivity failed, using fallback", e);
    return [
      {
        id: "1",
        text: "Monthly AMC report generated",
        source: "System",
        timeAgo: "5 mins ago",
      },
      {
        id: "2",
        text: "John Doe created task #TK-9021",
        source: "Personnel",
        timeAgo: "45 mins ago",
      },
    ];
  }
}

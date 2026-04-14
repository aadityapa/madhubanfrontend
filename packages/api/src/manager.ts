import { getAuthHeaders, readJsonOrThrow, unwrapApiData } from "./client";
import { getApiBaseUrl } from "./env";

const API = () => `${getApiBaseUrl()}/api`;

function withOptionalDate(path: string, date?: string): string {
  if (!date) return path;
  const params = new URLSearchParams({ date });
  return `${path}?${params.toString()}`;
}

function withQuery(
  path: string,
  params: Record<string, string | number | undefined | null>,
): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    query.set(key, String(value));
  }
  const text = query.toString();
  return text ? `${path}?${text}` : path;
}

export interface ManagerDashboardResponse {
  profile: {
    name: string;
    initials: string;
    role: string;
  };
  context: {
    label: string;
    shift: string;
    shiftLabel: string;
  };
  stats: {
    needsReview: number;
    approved: number;
    rejected: number;
  };
  completion: {
    percent: number;
    done: number;
    pending: number;
    total: number;
  };
  urgentTasks: Array<{
    dailyTaskId: number;
    taskTitle: string;
    assigneeName: string;
    assigneeInitials: string;
    urgencyKind: string;
    label: string;
    deadlineAt: string;
  }>;
  zones: Array<{
    zoneId: number;
    zoneName: string;
    propertyName: string;
    floorNo: number;
    assigned: number;
    done: number;
    percent: number;
    healthBand: string;
  }>;
  recentActivity: Array<{
    id: number;
    action: string;
    decidedAt: string;
    timeDisplay: string;
    taskTitle: string;
    staffName: string;
    note: string | null;
  }>;
  badges: {
    tasksPending: number;
    notificationsUnread: number;
  };
  date: string;
  shiftInProgress: boolean;
}

export interface ManagerProfileResponse {
  profile: {
    manager_id: number;
    full_name: string;
    email: string;
    initials: string;
    role: string;
  };
  badges: {
    shift: string;
    status: string;
  };
  account: {
    propertyLabel: string;
    reportingTo: string | null;
    appVersion: string;
  };
}

export interface ManagerTasksResponse {
  date: string;
  supervisorId: number | null;
  filter: string;
  counts: {
    all: number;
    critical: number;
    high: number;
    done: number;
  };
  progress: {
    done: number;
    total: number;
    percent: number;
  };
  tasks: unknown[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ManagerTaskFilters {
  supervisorId?: number | string;
  date?: string;
  filter?: string;
  page?: number;
  limit?: number;
}

export interface ManagerShiftReportResponse {
  date: string;
  overview: {
    completion: {
      percent: number;
      done: number;
      pending: number;
      total: number;
    };
    approvals: {
      approved: number;
      pending: number;
      rejected: number;
    };
  };
  zones: Array<{
    zoneId: number;
    zoneName: string;
    propertyName: string;
    floorNo: number;
    assigned: number;
    done: number;
    percent: number;
  }>;
  functions: Array<{
    functionKey: string;
    functionLabel: string;
    assigned: number;
    approved: number;
    percent: number;
  }>;
  employees: Array<{
    staffId: number;
    name: string;
    initials: string;
    scorePercent: number;
    tasks: number;
    onTimePercent: number;
  }>;
  escalations: Array<{
    kind: string;
    staffId?: number;
    staffName?: string;
    dailyTaskId?: number;
    title?: string;
    zoneName?: string;
    label: string;
    time?: string | null;
    deadlineAt?: string;
  }>;
}

export interface ManagerEmployeeShiftReportResponse {
  staffId: number;
  staffName: string;
  staffInitials: string;
  summary: {
    staffId: number;
    name: string;
    initials: string;
    scorePercent: number;
    tasks: number;
    onTimePercent: number;
  } | null;
  logs: Array<{
    dailyTaskId: number;
    title: string;
    zoneName: string;
    propertyName: string;
    floorNo: number;
    status: string;
    time: string | null;
    rating: number | null;
  }>;
}

export async function getManagerDashboard(date?: string): Promise<ManagerDashboardResponse> {
  const res = await fetch(withOptionalDate(`${API()}/manager/dashboard`, date), {
    headers: getAuthHeaders(),
  });
  return unwrapApiData<ManagerDashboardResponse>(await readJsonOrThrow(res));
}

export async function getManagerProfile(): Promise<ManagerProfileResponse> {
  const res = await fetch(`${API()}/manager/profile`, {
    headers: getAuthHeaders(),
  });
  return unwrapApiData<ManagerProfileResponse>(await readJsonOrThrow(res));
}

export async function getManagerTasks(
  filters: ManagerTaskFilters = {},
): Promise<ManagerTasksResponse> {
  const res = await fetch(
    withQuery(`${API()}/manager/tasks`, {
      supervisorId: filters.supervisorId,
      date: filters.date,
      filter: filters.filter,
      page: filters.page,
      limit: filters.limit,
    }),
    { headers: getAuthHeaders() },
  );
  return unwrapApiData<ManagerTasksResponse>(await readJsonOrThrow(res));
}

export async function getManagerShiftReport(
  date?: string,
): Promise<ManagerShiftReportResponse> {
  const res = await fetch(withOptionalDate(`${API()}/manager/reports/shift`, date), {
    headers: getAuthHeaders(),
  });
  return unwrapApiData<ManagerShiftReportResponse>(await readJsonOrThrow(res));
}

export async function getManagerEmployeeShiftReport(
  staffId: number | string,
  date?: string,
): Promise<ManagerEmployeeShiftReportResponse> {
  const res = await fetch(
    withOptionalDate(`${API()}/manager/reports/shift/employees/${staffId}`, date),
    { headers: getAuthHeaders() },
  );
  return unwrapApiData<ManagerEmployeeShiftReportResponse>(await readJsonOrThrow(res));
}

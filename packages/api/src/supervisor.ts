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

export type SupervisorAttendancePhase = "NOT_CHECKED_IN" | "ACTIVE" | "COMPLETED";

export interface SupervisorDashboardResponse {
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

export interface SupervisorAttendanceResponse {
  workDate: string;
  status: string | null;
  phase: SupervisorAttendancePhase;
  checkInAt: string | null;
  checkOutAt: string | null;
  selfieUrl: string | null;
  checkInLatitude: number | null;
  checkInLongitude: number | null;
  checkOutLatitude: number | null;
  checkOutLongitude: number | null;
  shift: string;
}

export interface SupervisorShiftReportResponse {
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

export interface SupervisorEmployeeShiftReportResponse {
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

export interface SupervisorReviewsResponse {
  date: string;
  status: string;
  counts: {
    needsReview: number;
    sentBack: number;
    approved: number;
  };
  items: Array<{
    approvalId: number;
    dailyTaskId: number;
    approvalStatus: string;
    submittedAt: string | null;
    overdueLabel: string | null;
    task: {
      title: string;
      priority: string;
      startTime: string | null;
      endTime: string | null;
    };
    maker: {
      staffId: number;
      name: string;
      initials: string;
    };
    zone: {
      zoneId: number;
      zoneName: string;
      floorNo: number | null;
      propertyName: string;
    };
    photos: {
      beforePhotoUrl: string | null;
      afterPhotoUrl: string | null;
    };
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SupervisorReviewDetailResponse {
  dailyTaskId: number;
  taskDate: string;
  task: {
    id: number;
    title: string;
    description: string | null;
    priority: string;
    startTime: string | null;
    endTime: string | null;
  };
  zone: {
    zoneId: number;
    zoneName: string;
    floorNo: number | null;
    propertyName: string;
  };
  maker: {
    staffId: number;
    name: string;
    email: string;
    initials: string;
  };
  photos: {
    beforePhotoUrl: string | null;
    afterPhotoUrl: string | null;
  };
  dailyTask: {
    status: string;
    startedAt: string | null;
    completedAt: string | null;
  };
  approval: {
    id: number;
    status: string;
    submittedAt: string | null;
    decidedAt: string | null;
    decisionNote: string | null;
    rating: number | null;
  };
}

export interface SupervisorReviewDecisionResponse {
  approval: {
    id: number;
    dailyTaskId: number;
    status: string;
    submittedAt: string | null;
    decidedAt: string | null;
    decisionNote: string | null;
    rating: number | null;
    supervisorId: number;
  };
}

export interface SupervisorReviewFilters {
  date?: string;
  status?: "needs_review" | "sent_back" | "approved" | "all";
  q?: string;
  priority?: "CRITICAL" | "HIGH";
  page?: number;
  limit?: number;
}

export type UploadableFile =
  | Blob
  | File
  | {
      uri: string;
      type: string;
      name: string;
    };

export interface SupervisorAttendanceSubmitPayload {
  action: "check_in" | "check_out";
  latitude: string | number;
  longitude: string | number;
  selfie?: UploadableFile;
}

export interface SupervisorReviewDecisionPayload {
  action: "approve" | "send_back";
  comment?: string;
  rating?: number;
}

export async function getSupervisorDashboard(date?: string): Promise<SupervisorDashboardResponse> {
  const res = await fetch(withOptionalDate(`${API()}/supervisor/dashboard`, date), {
    headers: getAuthHeaders(),
  });
  return unwrapApiData<SupervisorDashboardResponse>(await readJsonOrThrow(res));
}

export async function getSupervisorAttendance(
  date?: string,
): Promise<SupervisorAttendanceResponse> {
  const res = await fetch(withOptionalDate(`${API()}/supervisor/attendance`, date), {
    headers: getAuthHeaders(),
  });
  return unwrapApiData<SupervisorAttendanceResponse>(await readJsonOrThrow(res));
}

export async function submitSupervisorAttendance(
  payload: SupervisorAttendanceSubmitPayload,
): Promise<SupervisorAttendanceResponse> {
  const formData = new FormData();
  formData.append("action", payload.action);
  formData.append("latitude", String(payload.latitude));
  formData.append("longitude", String(payload.longitude));
  if (payload.selfie) {
    (formData as unknown as {
      append(name: string, value: UploadableFile): void;
    }).append("selfie", payload.selfie);
  }

  const headers = getAuthHeaders();
  delete headers["Content-Type"];

  const res = await fetch(`${API()}/supervisor/attendance`, {
    method: "POST",
    headers,
    body: formData,
  });
  return unwrapApiData<SupervisorAttendanceResponse>(await readJsonOrThrow(res));
}

export async function getSupervisorShiftReport(
  date?: string,
): Promise<SupervisorShiftReportResponse> {
  const res = await fetch(withOptionalDate(`${API()}/supervisor/reports/shift`, date), {
    headers: getAuthHeaders(),
  });
  return unwrapApiData<SupervisorShiftReportResponse>(await readJsonOrThrow(res));
}

export async function getSupervisorEmployeeShiftReport(
  staffId: number | string,
  date?: string,
): Promise<SupervisorEmployeeShiftReportResponse> {
  const res = await fetch(
    withOptionalDate(`${API()}/supervisor/reports/shift/employees/${staffId}`, date),
    { headers: getAuthHeaders() },
  );
  return unwrapApiData<SupervisorEmployeeShiftReportResponse>(await readJsonOrThrow(res));
}

export async function getSupervisorReviews(
  filters: SupervisorReviewFilters = {},
): Promise<SupervisorReviewsResponse> {
  const res = await fetch(
    withQuery(`${API()}/supervisor/reviews`, {
      date: filters.date,
      status: filters.status,
      q: filters.q,
      priority: filters.priority,
      page: filters.page,
      limit: filters.limit,
    }),
    { headers: getAuthHeaders() },
  );
  return unwrapApiData<SupervisorReviewsResponse>(await readJsonOrThrow(res));
}

export async function getSupervisorReviewDetail(
  dailyTaskId: number | string,
): Promise<SupervisorReviewDetailResponse> {
  const res = await fetch(`${API()}/supervisor/reviews/${dailyTaskId}`, {
    headers: getAuthHeaders(),
  });
  return unwrapApiData<SupervisorReviewDetailResponse>(await readJsonOrThrow(res));
}

export async function submitSupervisorReviewDecision(
  dailyTaskId: number | string,
  payload: SupervisorReviewDecisionPayload,
): Promise<SupervisorReviewDecisionResponse> {
  const res = await fetch(`${API()}/supervisor/reviews/${dailyTaskId}/decision`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  return unwrapApiData<SupervisorReviewDecisionResponse>(await readJsonOrThrow(res));
}

export async function getSupervisorDailyStaffTasks(date?: string): Promise<unknown[]> {
  const res = await fetch(withOptionalDate(`${API()}/daily-staff-tasks`, date));
  return unwrapApiData<unknown[]>(await readJsonOrThrow(res));
}

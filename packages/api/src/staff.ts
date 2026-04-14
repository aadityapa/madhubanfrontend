import { getAuthHeaders, readJsonOrThrow, unwrapApiData } from "./client";
import { getApiBaseUrl } from "./env";
import type { UploadableFile } from "./supervisor";

const API = () => `${getApiBaseUrl()}/api`;

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

export interface StaffProfileResponse {
  staff_id: number;
  full_name: string;
  email: string;
  initials: string;
  role: string;
  is_active: boolean;
  status: string;
  profile_picture_url: string | null;
  stats: {
    functions: number;
    zones: number;
    locations: number;
  };
  assignment_details: {
    assigned_checker_id: number | null;
    assigned_checker_name: string | null;
    default_tasks_per_day: number;
    is_eligible_for_attendance_incentive: boolean;
  };
  assigned_functions: Array<{
    function_name: string;
    is_primary: boolean;
    status: string;
    zones: Array<{
      name: string;
      floor: string;
      priority: string;
    }>;
  }>;
  current_assignments: {
    shift: string;
    shift_code: string;
    tasks: Array<{
      area: string;
      floor: string;
      description: string;
    }>;
  } | null;
  skills_and_certifications: string[];
}

export interface StaffDashboardResponse {
  date: string;
  shift: string;
  counts: {
    assigned: number;
    completed: number;
    remaining: number;
  };
  actionNeeded: {
    criticalPending: number;
  };
}

export interface StaffAttendanceResponse {
  workDate: string;
  status: string | null;
  phase: "NOT_CHECKED_IN" | "ACTIVE" | "COMPLETED";
  checkInAt: string | null;
  checkOutAt: string | null;
  selfieUrl: string | null;
  checkInLatitude: number | null;
  checkInLongitude: number | null;
  checkOutLatitude: number | null;
  checkOutLongitude: number | null;
  shift: string;
}

export interface StaffTaskFilters {
  date?: string;
  filter?: "all" | "critical" | "high" | "done";
  page?: number;
  limit?: number;
}

export interface StaffTasksResponse {
  date: string;
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
  tasks: Array<{
    id: number;
    status: string;
    taskDate: string;
    approval: {
      status: string;
      decisionNote: string | null;
    } | null;
    masterTask: {
      id: number;
      title: string;
      description: string | null;
      priority: string | null;
      startTime: string | null;
      endTime: string | null;
      zoneId: number | null;
      zone: string | null;
    };
    location: {
      propertyId: number | null;
      propertyName: string | null;
      floorNo: number | null;
    };
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface StaffReportResponse {
  period: {
    year: number;
    month: number;
    label: string;
  };
  byPriority: Array<{
    priority: string;
    count: number;
  }>;
  byPriorityCounts: Record<string, number>;
  byZone: Array<{
    zoneId: number;
    zoneName: string;
    propertyName: string;
    floorNo: number | null;
    assigned: number;
    done: number;
    percent: number;
  }>;
  attendance: {
    currentStreakDays: number;
    bestStreakDays: number;
    days: Array<{
      date: string;
      status: string;
    }>;
  };
  feedback: Array<{
    id: number;
    taskTitle: string;
    comment: string | null;
    rating: number | null;
    checkerInitials: string;
    decidedAt: string;
    relativeLabel: string;
  }>;
}

export interface StaffAttendanceSubmitPayload {
  action: "check_in" | "check_out";
  latitude: string | number;
  longitude: string | number;
  selfie?: UploadableFile;
}

async function appendUploadableFile(
  formData: FormData,
  fieldName: string,
  file: UploadableFile,
): Promise<void> {
  if (
    file &&
    typeof file === "object" &&
    "uri" in file &&
    typeof file.uri === "string"
  ) {
    const response = await fetch(file.uri);
    const blob = await response.blob();
    formData.append(fieldName, blob, file.name);
    return;
  }

  (formData as unknown as { append(name: string, value: UploadableFile): void }).append(
    fieldName,
    file,
  );
}

export async function getStaffProfile(): Promise<StaffProfileResponse> {
  const res = await fetch(`${API()}/staff/profile`, { headers: getAuthHeaders() });
  return unwrapApiData<StaffProfileResponse>(await readJsonOrThrow(res));
}

export async function getStaffDashboard(date?: string): Promise<StaffDashboardResponse> {
  const res = await fetch(withQuery(`${API()}/staff/dashboard`, { date }), {
    headers: getAuthHeaders(),
  });
  return unwrapApiData<StaffDashboardResponse>(await readJsonOrThrow(res));
}

export async function getStaffAttendance(date?: string): Promise<StaffAttendanceResponse> {
  const res = await fetch(withQuery(`${API()}/staff/attendance`, { date }), {
    headers: getAuthHeaders(),
  });
  return unwrapApiData<StaffAttendanceResponse>(await readJsonOrThrow(res));
}

export async function submitStaffAttendance(
  payload: StaffAttendanceSubmitPayload,
): Promise<StaffAttendanceResponse> {
  const formData = new FormData();
  formData.append("action", payload.action);
  formData.append("latitude", String(payload.latitude));
  formData.append("longitude", String(payload.longitude));
  if (payload.selfie) {
    await appendUploadableFile(formData, "selfie", payload.selfie);
  }
  const headers = getAuthHeaders();
  delete headers["Content-Type"];
  const res = await fetch(`${API()}/staff/attendance`, {
    method: "POST",
    headers,
    body: formData,
  });
  return unwrapApiData<StaffAttendanceResponse>(await readJsonOrThrow(res));
}

export async function getStaffTasks(filters: StaffTaskFilters = {}): Promise<StaffTasksResponse> {
  const res = await fetch(
    withQuery(`${API()}/staff/tasks`, {
      date: filters.date,
      filter: filters.filter,
      page: filters.page,
      limit: filters.limit,
    }),
    { headers: getAuthHeaders() },
  );
  return unwrapApiData<StaffTasksResponse>(await readJsonOrThrow(res));
}

async function uploadPhoto(
  url: string,
  photo: UploadableFile,
): Promise<{ beforePhotoUrl?: string; afterPhotoUrl?: string; approval?: unknown }> {
  const formData = new FormData();
  await appendUploadableFile(formData, "photo", photo);
  const headers = getAuthHeaders();
  delete headers["Content-Type"];
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
  });
  return unwrapApiData<{ beforePhotoUrl?: string; afterPhotoUrl?: string; approval?: unknown }>(
    await readJsonOrThrow(res),
  );
}

export async function uploadStaffTaskBeforePhoto(
  dailyTaskId: number | string,
  photo: UploadableFile,
): Promise<{ beforePhotoUrl?: string }> {
  return uploadPhoto(`${API()}/staff/tasks/${dailyTaskId}/before-photo`, photo);
}

export async function uploadStaffTaskAfterPhoto(
  dailyTaskId: number | string,
  photo: UploadableFile,
): Promise<{ afterPhotoUrl?: string; approval?: unknown }> {
  return uploadPhoto(`${API()}/staff/tasks/${dailyTaskId}/after-photo`, photo);
}

export async function getStaffReport(year: number, month: number): Promise<StaffReportResponse> {
  const res = await fetch(withQuery(`${API()}/staff/report`, { year, month }), {
    headers: getAuthHeaders(),
  });
  return unwrapApiData<StaffReportResponse>(await readJsonOrThrow(res));
}

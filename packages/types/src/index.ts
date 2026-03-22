/** Shared domain types for Madhuban 360 clients */

export type UserRole = "admin" | "staff" | "guard" | "supervisor" | "manager";
export type AuthMethod = "mobile" | "email";

export interface AuthUser {
  id?: string;
  email?: string;
  name?: string;
  mobile?: string;
  role?: UserRole | string;
  lastLoginAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface MobileLoginPayload {
  password: string;
  email?: string;
  username?: string;
  phone?: string;
  mobile?: string;
}

export type TaskStatus =
  | "TO_DO"
  | "IN_PROGRESS"
  | "REVIEW"
  | "COMPLETED"
  | "PENDING_APPROVAL"
  | string;

export interface Task {
  _id?: string;
  id?: string;
  title: string;
  status: TaskStatus;
  priority?: string;
  dueDate?: string;
  assignee?: { name?: string } | null;
  assigneeId?: string | null;
  propertyName?: string | null;
  roomNumber?: string | null;
  locationFloor?: string | null;
  category?: string | null;
  instructions?: unknown[];
  attachments?: unknown[];
  [key: string]: unknown;
}

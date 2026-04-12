export type UserRole = "Admin" | "Manager" | "Supervisor" | "Staff";
export type UserStatus = "Active" | "Suspended" | "Inactive";

export interface User {
  id: number;
  apiId: string;
  name: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  role: UserRole;
  status: UserStatus;
  lastLogin: string;
  initials: string;
  avatarColor: string;
  department?: string;
  employeeId?: string;
  reportsTo?: string;
  workAddress?: string;
  facilities?: string[];
}

export const ROLES: UserRole[] = ["Admin", "Manager", "Supervisor", "Staff"];
export const STATUSES: UserStatus[] = ["Active", "Suspended", "Inactive"];

export function roleBadgeStyle(role: UserRole): React.CSSProperties {
  const map: Record<UserRole, { bg: string; color: string; border: string }> = {
    Admin:      { bg: "#eff6ff", color: "#1d4ed8", border: "#dbeafe" },
    Manager:    { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
    Supervisor: { bg: "#fefce8", color: "#a16207", border: "#fef08a" },
    Staff:      { bg: "#f8fafc", color: "#475569", border: "#e2e8f0" },
  };
  const s = map[role];
  return { background: s.bg, color: s.color, border: `1px solid ${s.border}` };
}

export function statusDotColor(status: UserStatus) {
  return status === "Active" ? "#16a34a" : status === "Suspended" ? "#d97706" : "#94a3b8";
}

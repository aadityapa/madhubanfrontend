import type { UserRole } from "@madhuban/types";

export type TabName = "home" | "tasks" | "reports" | "profile" | "qr";

export interface TabDefinition {
  name: TabName;
  title: string;
}

function normalizeRole(role: UserRole | string | undefined): string {
  return String(role ?? "staff").toLowerCase();
}

/** Shared role navigation uses the same four primary tabs for all dashboard roles. */
export function getTabsForRole(
  role: UserRole | string | undefined,
): TabDefinition[] {
  const normalized = normalizeRole(role);

  if (normalized === "staff" || normalized === "guard" || normalized === "admin") {
    return [
      { name: "home", title: "Home" },
      { name: "tasks", title: "Tasks" },
      { name: "reports", title: "Reports" },
      { name: "profile", title: "Profile" },
    ];
  }

  return [
    { name: "home", title: "Home" },
    { name: "tasks", title: "Tasks" },
    { name: "reports", title: "Reports" },
    { name: "profile", title: "Profile" },
  ];
}

export function showQrTab(_role: UserRole | string | undefined): boolean {
  return false;
}

import type { UserRole } from "@madhuban/types";

export type TabName = "home" | "tasks" | "reports" | "profile" | "qr";

export interface TabDefinition {
  name: TabName;
  title: string;
}

function normalizeRole(role: UserRole | string | undefined): string {
  return String(role ?? "staff").toLowerCase();
}

/** Bottom tabs: shared across field roles; QR for staff/guard only (per plan). */
export function getTabsForRole(
  role: UserRole | string | undefined,
): TabDefinition[] {
  const r = normalizeRole(role);
  const base: TabDefinition[] = [
    { name: "home", title: "Home" },
    { name: "tasks", title: "Tasks" },
    { name: "reports", title: "Reports" },
    { name: "profile", title: "Profile" },
  ];
  if (r === "staff" || r === "guard") {
    return [
      base[0],
      base[1],
      { name: "qr", title: "Scan" },
      base[2],
      base[3],
    ];
  }
  return base;
}

export function showQrTab(role: UserRole | string | undefined): boolean {
  const r = normalizeRole(role);
  return r === "staff" || r === "guard";
}

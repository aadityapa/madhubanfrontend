import { getDashboardMetrics } from "@madhuban/api";
import { useEffect, useState } from "react";

export function AdminDashboardPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const m = await getDashboardMetrics();
        if (!cancelled) setData(m);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load metrics");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div>
        <h1>Dashboard</h1>
        <p style={{ color: "var(--color-danger)" }}>{error}</p>
        <p style={{ color: "var(--color-text-muted)", marginTop: 8 }}>
          Public dashboard routes may be unauthenticated; wire admin auth before
          production.
        </p>
      </div>
    );
  }

  if (!data) return <p>Loading…</p>;

  return (
    <div>
      <h1>Dashboard</h1>
      <p style={{ color: "var(--color-text-muted)", marginBottom: 16 }}>
        Admin overview (GET /api/dashboard/metrics with fallbacks in the API
        client).
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
        }}
      >
        {(
          [
            ["Open tasks", data.openTasks],
            ["Due today", data.dueToday],
            ["Total users", data.totalUsers],
            ["Attendance %", data.attendancePercent],
          ] as const
        ).map(([label, value]) => (
          <div
            key={String(label)}
            style={{
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: 16,
              background: "var(--color-surface-elevated)",
            }}
          >
            <div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
              {label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>
              {String(value ?? "—")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import {
  AlertTriangle,
  ClipboardList,
  Plus,
  TrendingUp,
  UserPlus,
  Users,
  Warehouse,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useShellHeader } from "../context/ShellHeaderContext";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Metrics {
  totalProperties?: number;
  activeProperties?: number;
  inactiveProperties?: number;
  totalUsers?: number;
  adminCount?: number;
  staffCount?: number;
  openTasks?: number;
  dueToday?: number;
  attendancePercent?: number;
}

interface DashboardAlert {
  id: string | number;
  title: string;
  reporter?: string;
  time?: string;
  level?: "URGENT" | "MEDIUM";
  reportedBy?: string;
  timeAgo?: string;
  urgency: "URGENT" | "MEDIUM";
}

interface DashboardActivityItem {
  id: string | number;
  text: string;
  source?: string;
  timeAgo?: string;
  dot?: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_METRICS: Metrics = {
  totalProperties: 124,
  activeProperties: 110,
  inactiveProperties: 14,
  totalUsers: 45,
  adminCount: 5,
  staffCount: 40,
  openTasks: 18,
  dueToday: 8,
  attendancePercent: 92,
};

const PIPELINE_DATA = [22, 35, 28, 42, 38, 55, 48, 62, 58, 74, 68, 85];
const REVENUE_DATA = [40, 38, 52, 48, 58, 55, 68, 62, 72, 78, 74, 88];

const ALERTS = [
  { id: 1, title: "Elevator Failure - Block A North", reporter: "Security (Main Desk)", time: "12 mins ago", level: "URGENT" as const },
  { id: 2, title: "Light Outage - Hallway Level 4", reporter: "Staff (Maintenance)", time: "1 hour ago", level: "MEDIUM" as const },
  { id: 3, title: "Water Leakage - Basement Parking", reporter: "Automated Sensor B12", time: "3 hours ago", level: "URGENT" as const },
];

const ACTIVITY = [
  { id: 1, text: "Monthly AMC report generated", meta: "System · 5 mins ago", dot: "#64748b" },
  { id: 2, text: "John Doe created task #TK-9021", meta: "Personnel · 45 mins ago", dot: "#94a3b8" },
];

// ─── Area chart ───────────────────────────────────────────────────────────────
function AreaChart({ data, color = "#3b82f6", gradientId }: { data: number[]; color?: string; gradientId: string }) {
  const W = 400;
  const H = 100;
  const pad = 4;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (W - pad * 2),
    y: H - pad - ((v - min) / range) * (H - pad * 2),
  }));

  function smooth(points: { x: number; y: number }[]) {
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cx = (prev.x + curr.x) / 2;
      d += ` C ${cx},${prev.y} ${cx},${curr.y} ${curr.x},${curr.y}`;
    }
    return d;
  }

  const linePath = smooth(pts);
  const areaPath = `${linePath} L ${pts[pts.length - 1].x},${H} L ${pts[0].x},${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: 100 }}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Metric card ──────────────────────────────────────────────────────────────
function MetricCard({
  icon: Icon,
  iconBg,
  label,
  value,
  sub,
  badge,
  badgeColor,
  extra,
}: {
  icon: React.ElementType;
  iconBg: string;
  label: string;
  value: string | number;
  sub?: string;
  badge?: string;
  badgeColor?: string;
  extra?: React.ReactNode;
}) {
  return (
    <div style={cs.metricCard}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ ...cs.metricIcon, background: iconBg }}>
          <Icon size={18} color="#fff" />
        </div>
        {badge && (
          <span style={{ ...cs.badge, background: badgeColor === "green" ? "#dcfce7" : badgeColor === "blue" ? "#eff6ff" : "#fefce8", color: badgeColor === "green" ? "#16a34a" : badgeColor === "blue" ? "#2563eb" : "#ca8a04", borderColor: badgeColor === "green" ? "#bbf7d0" : badgeColor === "blue" ? "#dbeafe" : "#fef08a" }}>
            {badge}
          </span>
        )}
      </div>
      <div style={cs.metricLabel}>{label}</div>
      <div style={cs.metricValue}>{value}</div>
      {sub && <div style={cs.metricSub}>{sub}</div>}
      {extra}
    </div>
  );
}

// ─── Alert level badge ────────────────────────────────────────────────────────
function AlertBadge({ level }: { level: "URGENT" | "MEDIUM" }) {
  const urgent = level === "URGENT";
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
      background: urgent ? "#fef2f2" : "#fefce8",
      color: urgent ? "#dc2626" : "#ca8a04",
      border: `1px solid ${urgent ? "#fecaca" : "#fef08a"}`,
    }}>
      {level}
    </span>
  );
}

// ─── Page header actions ──────────────────────────────────────────────────────
function DashboardActions() {
  const navigate = useNavigate();

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button style={cs.actionBtn} onClick={() => navigate("/tasks")}>
        <Plus size={14} /><span>Add Task</span>
      </button>
      <button style={cs.actionBtn} onClick={() => navigate("/users")}>
        <UserPlus size={14} /><span>Add User</span>
      </button>
      <button style={cs.actionBtn} onClick={() => navigate("/properties")}>
        <Warehouse size={14} /><span>Add Property</span>
      </button>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div>
      <SkeletonTheme />
      <div style={cs.pageHeader}>
        <div>
          <SkeletonBlock width={220} height={28} />
          <SkeletonBlock width={280} height={12} style={{ marginTop: 10 }} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <SkeletonBlock width={104} height={36} radius={10} />
          <SkeletonBlock width={104} height={36} radius={10} />
          <SkeletonBlock width={120} height={36} radius={10} />
        </div>
      </div>

      <div style={cs.metricsGrid}>
        {Array.from({ length: 4 }, (_, index) => (
          <SkeletonMetricCard key={index} />
        ))}
      </div>

      <div style={cs.chartsRow}>
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} style={cs.card}>
            <div style={cs.cardHeader}>
              <SkeletonBlock width={160} height={16} />
              <SkeletonBlock width={88} height={12} />
            </div>
            <SkeletonBlock width="100%" height={100} radius={12} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
              {Array.from({ length: 4 }, (__unused, labelIndex) => (
                <SkeletonBlock key={labelIndex} width={48} height={10} />
              ))}
            </div>
            <SkeletonBlock width="34%" height={24} style={{ marginTop: 18 }} />
            <SkeletonBlock width="52%" height={12} style={{ marginTop: 10 }} />
          </div>
        ))}
      </div>

      <div style={cs.bottomGrid}>
        <div style={cs.card}>
          <div style={cs.cardHeader}>
            <SkeletonBlock width={120} height={16} />
            <SkeletonBlock width={64} height={12} />
          </div>
          <SkeletonCardList count={3} />
        </div>
        <div style={cs.card}>
          <div style={cs.cardHeader}>
            <SkeletonBlock width={128} height={16} />
            <SkeletonBlock width={72} height={12} />
          </div>
          <SkeletonCardList count={4} lines={2} />
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<Metrics>(MOCK_METRICS);
  const [pipelineData, setPipelineData] = useState<number[]>(PIPELINE_DATA);
  const [pipelineSummary, setPipelineSummary] = useState({
    value: 42000,
    trend: 12.5,
    label: "from last month",
  });
  const [revenueData, setRevenueData] = useState<number[]>(REVENUE_DATA);
  const [revenueSummary, setRevenueSummary] = useState({
    value: 128500,
    trend: 8.2,
    label: "Year-to-date",
  });
  const [alerts, setAlerts] = useState<DashboardAlert[]>(
    ALERTS.map((alert) => ({
      id: alert.id,
      title: alert.title,
      reporter: alert.reporter,
      time: alert.time,
      level: alert.level,
      reportedBy: alert.reporter,
      timeAgo: alert.time,
      urgency: alert.level,
    })),
  );
  const [activity, setActivity] = useState<DashboardActivityItem[]>(
    ACTIVITY.map((item) => {
      const [source, timeAgo] = item.meta.split(" · ");
      return {
        id: item.id,
        text: item.text,
        source,
        timeAgo,
        dot: item.dot,
      };
    }),
  );
  useShellHeader({ showSearch: true });

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div>
      {/* Page header */}
      <div style={cs.pageHeader}>
        <div>
          <h1 style={cs.pageTitle}>Dashboard Overview</h1>
          <p style={cs.pageSubtitle}>System metrics for today, {today}</p>
        </div>
        <DashboardActions />
      </div>

      {/* Metric cards */}
      <div style={cs.metricsGrid}>
        <MetricCard
          icon={Warehouse}
          iconBg="#6366f1"
          label="Total Properties"
          value={metrics.totalProperties ?? "—"}
          sub={`${metrics.activeProperties ?? "—"} Active / ${metrics.inactiveProperties ?? "—"} Inactive`}
          badge="+4.2%"
          badgeColor="green"
        />
        <MetricCard
          icon={Users}
          iconBg="#0ea5e9"
          label="Total Users"
          value={metrics.totalUsers ?? "—"}
          sub={`${metrics.adminCount ?? "—"} Admins / ${metrics.staffCount ?? "—"} Staff`}
          badge="Stable"
          badgeColor="blue"
        />
        <MetricCard
          icon={ClipboardList}
          iconBg="#f59e0b"
          label="Open Tasks"
          value={metrics.openTasks ?? "—"}
          badge={`${metrics.dueToday ?? 0} Due Today`}
          badgeColor="yellow"
        />
        <MetricCard
          icon={TrendingUp}
          iconBg="#10b981"
          label="Today's Attendance"
          value={`${metrics.attendancePercent ?? "—"}%`}
          badge="+2%"
          badgeColor="green"
          extra={
            <div style={{ marginTop: 10 }}>
              <div style={{ height: 6, borderRadius: 99, background: "var(--c-input-border)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${metrics.attendancePercent ?? 0}%`, background: "#10b981", borderRadius: 99 }} />
              </div>
            </div>
          }
        />
      </div>

      {/* Charts row */}
      <div style={cs.chartsRow}>
        <div style={cs.card}>
          <div style={cs.cardHeader}>
            <span style={cs.cardTitle}>Sales Pipeline Snapshot</span>
            <span style={cs.cardMeta}>Last 6 Months</span>
          </div>
          <div style={{ margin: "4px 0 12px" }}>
            <AreaChart data={pipelineData} gradientId="pipeline-grad" />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            {["Leads", "Proposals", "Negot.", "Closed"].map((l) => (
              <span key={l} style={cs.chartAxisLabel}>{l}</span>
            ))}
          </div>
          <div style={{ marginTop: 16, borderTop: "1px solid var(--c-divider)", paddingTop: 14, display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: "var(--c-text)" }}>
              ${pipelineSummary.value.toLocaleString()}
            </span>
            <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>
              {pipelineSummary.trend >= 0 ? "+" : ""}
              {pipelineSummary.trend}% {pipelineSummary.label}
            </span>
          </div>
        </div>

        <div style={cs.card}>
          <div style={cs.cardHeader}>
            <span style={cs.cardTitle}>Revenue Overview</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6" }} />
              <span style={cs.cardMeta}>Revenue</span>
            </div>
          </div>
          <div style={{ margin: "4px 0 12px" }}>
            <AreaChart data={revenueData} gradientId="revenue-grad" />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            {["JAN", "FEB", "MAR", "APR", "MAY", "JUN"].map((m) => (
              <span key={m} style={cs.chartAxisLabel}>{m}</span>
            ))}
          </div>
          <div style={{ marginTop: 16, borderTop: "1px solid var(--c-divider)", paddingTop: 14, display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: "var(--c-text)" }}>
              ${revenueSummary.value.toLocaleString()}
            </span>
            <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>
              {revenueSummary.trend >= 0 ? "+" : ""}
              {revenueSummary.trend}% {revenueSummary.label}
            </span>
          </div>
        </div>
      </div>

      {/* Alerts + Activity row */}
      <div style={cs.bottomRow}>
        {/* Facility Alerts */}
        <div style={{ ...cs.card, flex: 1.4 }}>
          <div style={cs.cardHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={cs.cardTitle}>Facility Issue Alerts</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                {alerts.filter((a) => a.urgency === "URGENT").length} URGENT
              </span>
            </div>
            <button style={cs.linkBtn}>View All Tickets</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
            {alerts.map((alert) => (
              <div key={alert.id} style={cs.alertRow}>
                <div style={{ ...cs.alertDot, background: alert.urgency === "URGENT" ? "#fef2f2" : "#fefce8", border: `1px solid ${alert.urgency === "URGENT" ? "#fecaca" : "#fef08a"}` }}>
                  <AlertTriangle size={14} color={alert.urgency === "URGENT" ? "#dc2626" : "#ca8a04"} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--c-text)" }}>{alert.title}</div>
                  <div style={{ fontSize: 12, color: "var(--c-text-muted)", marginTop: 2 }}>
                    Reported by: {alert.reporter} · {alert.time}
                  </div>
                </div>
                <AlertBadge level={alert.urgency} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ ...cs.card, flex: 0.8 }}>
          <div style={cs.cardHeader}>
            <span style={cs.cardTitle}>Recent Activity</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
            {activity.map((item) => (
              <div key={item.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.dot, marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--c-text)", lineHeight: 1.4 }}>{item.text}</div>
                  <div style={{ fontSize: 11.5, color: "var(--c-text-faint)", marginTop: 3 }}>
                    {item.source} Â· {item.timeAgo}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const cs: Record<string, React.CSSProperties> = {
  pageHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 16,
    flexWrap: "wrap",
  },
  pageTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 800,
    color: "var(--c-text)",
    letterSpacing: "-0.3px",
  },
  pageSubtitle: {
    margin: "4px 0 0",
    fontSize: 13,
    color: "var(--c-text-muted)",
  },
  actionBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 600,
    border: "1px solid var(--c-input-border)",
    borderRadius: 8,
    background: "var(--c-card)",
    color: "var(--c-text-2)",
    cursor: "pointer",
    transition: "background 0.15s",
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16,
    marginBottom: 20,
  },
  metricCard: {
    background: "var(--c-card)",
    border: "1px solid var(--c-card-border)",
    borderRadius: 14,
    padding: 18,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  metricLabel: {
    fontSize: 12.5,
    color: "var(--c-text-muted)",
    fontWeight: 500,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 800,
    color: "var(--c-text)",
    letterSpacing: "-0.5px",
    lineHeight: 1.1,
  },
  metricSub: {
    fontSize: 12,
    color: "var(--c-text-faint)",
    marginTop: 4,
  },
  badge: {
    fontSize: 11,
    fontWeight: 700,
    padding: "3px 8px",
    borderRadius: 20,
    border: "1px solid",
  },
  chartsRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    marginBottom: 20,
  },
  bottomRow: {
    display: "flex",
    gap: 16,
    alignItems: "flex-start",
  },
  card: {
    background: "var(--c-card)",
    border: "1px solid var(--c-card-border)",
    borderRadius: 14,
    padding: 20,
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: 700,
    color: "var(--c-text)",
  },
  cardMeta: {
    fontSize: 12,
    color: "var(--c-text-faint)",
    fontWeight: 500,
  },
  chartAxisLabel: {
    fontSize: 11,
    color: "var(--c-text-faint)",
    fontWeight: 500,
  },
  linkBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 12.5,
    color: "#2563eb",
    fontWeight: 600,
    padding: 0,
  },
  alertRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  alertDot: {
    width: 32,
    height: 32,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
};

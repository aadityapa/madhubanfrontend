import {
  Building2,
  CheckCircle2,
  ClipboardList,
  Key,
  KeyRound,
  LogIn,
  MapPin,
  Shield,
  TrendingDown,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { roleBadgeStyle, statusDotColor, type User as UserType } from "./types";

type Tab = "overview" | "facilities" | "tasks" | "permissions";

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  trend,
  trendUp,
}: {
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  progress?: number;
}) {
  return (
    <div style={vs.statCard}>
      {trend && (
        <span style={{ ...vs.trend, color: trendUp ? "#16a34a" : "#dc2626" }}>
          {trendUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {trend}
        </span>
      )}
      <div style={vs.statValue}>{value}</div>
      <div style={vs.statLabel}>{label}</div>
    </div>
  );
}

// ─── Info row ─────────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text-faint)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 13.5, color: "var(--c-text)", fontWeight: 500 }}>{value ?? "—"}</div>
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────
export function ViewUserModal({
  user,
  onClose,
  onEdit,
}: {
  user: UserType;
  onClose: () => void;
  onEdit: () => void;
}) {
  const [tab, setTab] = useState<Tab>("overview");

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "facilities", label: "Assigned Facilities", count: user.facilities?.length ?? 0 },
    { id: "tasks", label: "Task History" },
    { id: "permissions", label: "Permissions" },
  ];

  return (
    <div style={vs.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={vs.panel}>
        {/* Header */}
        <div style={vs.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1, minWidth: 0 }}>
            <div style={{ ...vs.avatar, background: user.avatarColor }}>{user.initials}</div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2 style={vs.name}>{user.name}</h2>
                <span style={{ ...vs.statusBadge, background: "#dcfce7", color: "#15803d", borderColor: "#bbf7d0" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusDotColor(user.status), display: "inline-block", marginRight: 4 }} />
                  {user.status}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "var(--c-text-muted)", marginTop: 2 }}>
                {user.jobTitle ?? user.role} {user.department ? `· ${user.department}` : ""}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4, fontSize: 12, color: "var(--c-text-faint)" }}>
                <span>✉ {user.email}</span>
                {user.phone && <span>📞 {user.phone}</span>}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", align: "center", gap: 8, flexShrink: 0 }}>
            <button style={vs.editBtn} onClick={onEdit}>
              <User size={14} /> Edit
            </button>
            <button style={vs.resetBtn}>
              <KeyRound size={14} /> Reset Password
            </button>
            <button style={vs.closeBtn} onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={vs.statsRow}>
          <StatCard label="Total Tasks" value="1,284" trend="+10.5%" trendUp />
          <StatCard label="Completion Rate" value="98.2%" trend="+3.1%" trendUp />
          <StatCard label="Attendance Score" value="96.5%" trend="-0.4%" trendUp={false} />
          <StatCard label="Pending Requests" value={5} />
        </div>

        {/* Tabs */}
        <div style={vs.tabBar}>
          {TABS.map((t) => (
            <button
              key={t.id}
              style={{ ...vs.tab, ...(tab === t.id ? vs.tabActive : {}) }}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {t.count !== undefined && (
                <span style={vs.tabCount}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={vs.content}>
          {tab === "overview" && (
            <div style={vs.overviewGrid}>
              {/* Account Information */}
              <div style={vs.infoCard}>
                <div style={vs.cardTitle}>Account Information</div>
                <InfoRow label="Full Name" value={user.name} />
                <InfoRow label="Employee ID" value={user.employeeId ?? `FMS-${1000 + user.id}-JD`} />
                <InfoRow label="Department" value={user.department ?? "Operations & Maintenance"} />
                <InfoRow label="Reports To" value={user.reportsTo ?? "Sarah Jenkins"} />
                <InfoRow label="Work Address" value={user.workAddress ?? "102 Main Street, Central Plaza, North Wing, Suite 405"} />
              </div>

              {/* Security & Access */}
              <div>
                <div style={vs.infoCard}>
                  <div style={vs.cardTitle}>Security &amp; Access</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={vs.secRow}>
                      <div style={vs.secIcon}><Shield size={15} color="#2563eb" /></div>
                      <div style={{ flex: 1 }}>
                        <div style={vs.secLabel}>Role Tier</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                          <span style={{ ...vs.rolePill, ...roleBadgeStyle(user.role) }}>{user.role}</span>
                          <button style={vs.changeBtn}>Change</button>
                        </div>
                      </div>
                    </div>
                    <div style={vs.secRow}>
                      <div style={vs.secIcon}><LogIn size={15} color="#64748b" /></div>
                      <div>
                        <div style={vs.secLabel}>Last Login</div>
                        <div style={{ fontSize: 13, color: "var(--c-text-muted)", marginTop: 2 }}>{user.lastLogin}</div>
                      </div>
                    </div>
                    <div style={vs.secRow}>
                      <div style={vs.secIcon}><Key size={15} color="#64748b" /></div>
                      <div>
                        <div style={vs.secLabel}>2FA Status</div>
                        <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                          <CheckCircle2 size={13} /> Enabled
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Insights */}
                <div style={{ ...vs.infoCard, marginTop: 14 }}>
                  <div style={vs.cardTitle}>Quick Insights</div>
                  <p style={{ fontSize: 12.5, color: "var(--c-text-muted)", lineHeight: 1.6, margin: 0 }}>
                    {user.name.split(" ")[0]} is in the <strong style={{ color: "var(--c-text)" }}>Top 5%</strong> of performers this quarter. Their completion rate on high-priority work orders is unmatched.
                  </p>
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--c-text-faint)", textTransform: "uppercase", letterSpacing: "0.5px" }}>QUARTERLY GOAL</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#2563eb" }}>84%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 99, background: "var(--c-input-border)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: "84%", background: "#2563eb", borderRadius: 99 }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "facilities" && (
            <div>
              {(user.facilities?.length ?? 0) === 0 ? (
                <p style={{ color: "var(--c-text-muted)", fontSize: 13 }}>No facilities assigned yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {user.facilities?.map((f) => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "var(--c-input-bg)", borderRadius: 10, border: "1px solid var(--c-card-border)" }}>
                      <Building2 size={15} color="#2563eb" />
                      <span style={{ fontSize: 13.5, color: "var(--c-text)", fontWeight: 500 }}>{f}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(tab === "tasks" || tab === "permissions") && (
            <div style={{ padding: "32px 0", textAlign: "center", color: "var(--c-text-muted)", fontSize: 13 }}>
              <ClipboardList size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
              <p style={{ margin: 0 }}>This section is coming soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const vs: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(15,23,42,0.45)",
    zIndex: 200,
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 24,
  },
  panel: {
    width: "100%", maxWidth: 860,
    maxHeight: "92vh",
    background: "var(--c-card)",
    borderRadius: 16,
    display: "flex", flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
  },
  header: {
    display: "flex", alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    padding: "22px 24px 16px",
    borderBottom: "1px solid var(--c-divider)",
    flexWrap: "wrap",
  },
  avatar: {
    width: 56, height: 56, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontSize: 18, fontWeight: 700, flexShrink: 0,
  },
  name: { margin: 0, fontSize: 18, fontWeight: 800, color: "var(--c-text)" },
  statusBadge: {
    fontSize: 11.5, fontWeight: 600, padding: "3px 10px",
    borderRadius: 20, border: "1px solid", display: "inline-flex", alignItems: "center",
  },
  editBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "7px 14px", fontSize: 13, fontWeight: 600,
    border: "1px solid var(--c-input-border)", borderRadius: 8,
    background: "var(--c-card)", color: "var(--c-text-2)", cursor: "pointer",
  },
  resetBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "7px 14px", fontSize: 13, fontWeight: 600,
    border: "none", borderRadius: 8,
    background: "#1e3a5f", color: "#93c5fd", cursor: "pointer",
  },
  closeBtn: {
    width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
    border: "1px solid var(--c-input-border)", borderRadius: 8,
    background: "var(--c-card)", color: "var(--c-text-muted)", cursor: "pointer",
  },
  statsRow: {
    display: "grid", gridTemplateColumns: "repeat(4,1fr)",
    gap: 0,
    borderBottom: "1px solid var(--c-divider)",
  },
  statCard: {
    padding: "14px 20px",
    borderRight: "1px solid var(--c-divider)",
    position: "relative" as const,
  },
  trend: {
    fontSize: 11, fontWeight: 700,
    display: "flex", alignItems: "center", gap: 3,
    marginBottom: 4,
  },
  statValue: { fontSize: 20, fontWeight: 800, color: "var(--c-text)", lineHeight: 1 },
  statLabel: { fontSize: 11.5, color: "var(--c-text-muted)", marginTop: 4 },
  tabBar: {
    display: "flex", gap: 0,
    borderBottom: "1px solid var(--c-divider)",
    padding: "0 24px",
  },
  tab: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "11px 14px", fontSize: 13, fontWeight: 500,
    border: "none", background: "none", cursor: "pointer",
    color: "var(--c-text-muted)",
    borderBottom: "2px solid transparent",
    marginBottom: -1,
    transition: "color 0.15s",
  },
  tabActive: {
    color: "#2563eb",
    borderBottomColor: "#2563eb",
    fontWeight: 600,
  },
  tabCount: {
    fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 20,
    background: "#eff6ff", color: "#2563eb",
  },
  content: { flex: 1, overflowY: "auto" as const, padding: "20px 24px 24px" },
  overviewGrid: { display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 16 },
  infoCard: {
    background: "var(--c-input-bg)",
    border: "1px solid var(--c-card-border)",
    borderRadius: 12, padding: "16px 18px",
  },
  cardTitle: {
    fontSize: 13, fontWeight: 700, color: "var(--c-text)",
    marginBottom: 14, paddingBottom: 10,
    borderBottom: "1px solid var(--c-divider)",
  },
  secRow: { display: "flex", gap: 10, alignItems: "flex-start" },
  secIcon: {
    width: 30, height: 30, borderRadius: 8,
    background: "var(--c-card)", border: "1px solid var(--c-card-border)",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  secLabel: { fontSize: 11.5, fontWeight: 600, color: "var(--c-text-faint)", textTransform: "uppercase" as const, letterSpacing: "0.5px" },
  rolePill: {
    fontSize: 12, fontWeight: 600, padding: "2px 10px",
    borderRadius: 20, border: "1px solid",
    display: "inline-block",
  },
  changeBtn: {
    fontSize: 12, color: "#2563eb", fontWeight: 600,
    border: "none", background: "none", cursor: "pointer", padding: 0,
  },
};

import { Feather, Ionicons } from "@expo/vector-icons";
import { getStaffAttendance, getStaffDashboard } from "@madhuban/api";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AttendanceActionCard } from "../../components/AttendanceActionCard";
import { RefreshableScrollView } from "../../components/RefreshableScrollView";
import { SkeletonBlock } from "../../components/SkeletonBlock";
import { useAuth } from "../../context/AuthContext";
import { RolePageLayout, formatRoleLabel } from "../../layouts/RolePageLayout";

function MetricCard({
  label,
  value,
  tint,
}: {
  label: string;
  value: string;
  tint: string;
}) {
  return (
    <View style={styles.metricCard}>
      <Text style={[styles.metricValue, { color: tint }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function formatCheckIn(value: string | null | undefined) {
  if (!value) return "Not checked in";
  return `Active since ${new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })}`;
}

function formatDateLabel(value: string | null | undefined) {
  if (!value) return "26 Mar 2026";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function StaffHomeScreen() {
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<{
    assigned: number;
    completed: number;
    remaining: number;
    criticalPending: number;
    shift: string;
  } | null>(null);
  const [attendance, setAttendance] = useState<{
    phase: string;
    checkInAt: string | null;
    workDate: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dashboardData, attendanceData] = await Promise.all([
        getStaffDashboard(),
        getStaffAttendance().catch(() => null),
      ]);
      setDashboard({
        assigned: dashboardData.counts.assigned,
        completed: dashboardData.counts.completed,
        remaining: dashboardData.counts.remaining,
        criticalPending: dashboardData.actionNeeded.criticalPending,
        shift: dashboardData.shift,
      });
      if (attendanceData) {
        setAttendance({
          phase: attendanceData.phase,
          checkInAt: attendanceData.checkInAt,
          workDate: attendanceData.workDate,
        });
      } else {
        setAttendance(null);
      }
    } catch {
      setDashboard(null);
      setAttendance(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const roleLabel = formatRoleLabel(String(role ?? user?.role));
  const firstName = user?.name?.split(" ")[0] ?? "Rahul";
  const assigned = dashboard?.assigned ?? 24;
  const completed = dashboard?.completed ?? 18;
  const remaining = dashboard?.remaining ?? Math.max(0, assigned - completed);
  const criticalPending = dashboard?.criticalPending ?? 3;
  const shiftLabel = dashboard?.shift ? `Shift · ${dashboard.shift}` : "Shift · Morning";

  return (
    <RolePageLayout
      eyebrow={shiftLabel}
      title={`Hi, ${firstName}!`}
      subtitle="Madhuban Groups"
      meta={roleLabel}
      compact
      headerCard={
        <View style={styles.headerCard}>
          <View>
            <Text style={styles.headerLabel}>Check-in Status</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.headerValue}>{formatCheckIn(attendance?.checkInAt)}</Text>
            </View>
          </View>
          <View style={styles.headerDivider} />
          <View>
            <Text style={styles.headerLabel}>Date</Text>
            <Text style={styles.headerValue}>{formatDateLabel(attendance?.workDate)}</Text>
          </View>
        </View>
      }
    >
      <RefreshableScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onRefresh={load}
      >
        <AttendanceActionCard role={role as string | undefined} />

        <View style={styles.panel}>
          <View style={styles.panelTitleRow}>
            <Feather name="activity" size={15} color="#5E7393" />
            <Text style={styles.panelTitle}>Today's Shift Progress</Text>
          </View>
          {loading ? (
            <View style={styles.metricGrid}>
              {[0, 1, 2].map((item) => (
                <View key={item} style={styles.metricCard}>
                  <SkeletonBlock style={{ height: 26, width: 34, borderRadius: 8 }} />
                  <SkeletonBlock style={{ height: 12, width: 60, borderRadius: 6 }} />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.metricGrid}>
              <MetricCard label="Assigned" value={String(assigned)} tint="#2563EB" />
              <MetricCard label="Completed" value={String(completed)} tint="#16A34A" />
              <MetricCard label="Remaining" value={String(remaining)} tint="#DC2626" />
            </View>
          )}
        </View>

        <View style={[styles.banner, styles.bannerDanger]}>
          <View style={styles.bannerIcon}>
            <Ionicons name="alert-circle-outline" size={20} color="#FF4D5E" />
          </View>
          <View style={styles.bannerBody}>
            <Text style={styles.bannerEyebrow}>Action Needed</Text>
            <Text style={styles.bannerTitle}>{criticalPending} critical tasks pending</Text>
            <Text style={styles.bannerText}>Requires immediate attention on this shift.</Text>
          </View>
        </View>

        <View style={[styles.banner, styles.bannerInfo]}>
          <View style={styles.bannerIcon}>
            <Ionicons name="reload-outline" size={20} color="#7C3AED" />
          </View>
          <View style={styles.bannerBody}>
            <Text style={styles.bannerEyebrow}>Task Update</Text>
            <Text style={styles.bannerTitle}>Current shift loaded</Text>
            <Text style={styles.bannerText}>{remaining} tasks remain in today's workload.</Text>
          </View>
        </View>

        <View style={styles.panel}>
          <View style={styles.panelTitleRow}>
            <Feather name="check-square" size={15} color="#5E7393" />
            <Text style={styles.panelTitle}>Approval Status</Text>
          </View>
          {loading ? (
            <View style={styles.metricGrid}>
              {[0, 1, 2].map((item) => (
                <View key={item} style={styles.metricCard}>
                  <SkeletonBlock style={{ height: 26, width: 34, borderRadius: 8 }} />
                  <SkeletonBlock style={{ height: 12, width: 60, borderRadius: 6 }} />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.metricGrid}>
              <MetricCard label="Submitted" value={String(completed)} tint="#2563EB" />
              <MetricCard label="Sent Back" value="0" tint="#D97706" />
              <MetricCard label="Sup. Reject" value="0" tint="#E11D48" />
            </View>
          )}
        </View>
      </RefreshableScrollView>
    </RolePageLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 32,
    gap: 16,
  },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  headerLabel: {
    color: "rgba(232, 240, 255, 0.8)",
    fontSize: 12,
    fontWeight: "600",
  },
  headerValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#30D19B",
  },
  headerDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  panel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5EAF3",
    gap: 14,
  },
  panelTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  panelTitle: {
    color: "#162236",
    fontSize: 15,
    fontWeight: "700",
  },
  metricGrid: {
    flexDirection: "row",
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#F8FAFD",
    borderRadius: 18,
    padding: 14,
    gap: 6,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "800",
  },
  metricLabel: {
    color: "#6B7890",
    fontSize: 12,
    fontWeight: "600",
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
  },
  bannerDanger: {
    backgroundColor: "#FFF4F5",
    borderColor: "#FFD5D8",
  },
  bannerInfo: {
    backgroundColor: "#F7F4FF",
    borderColor: "#E5DAFF",
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  bannerBody: {
    flex: 1,
    gap: 2,
  },
  bannerEyebrow: {
    color: "#6B7890",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  bannerTitle: {
    color: "#162236",
    fontSize: 15,
    fontWeight: "700",
  },
  bannerText: {
    color: "#6B7890",
    fontSize: 12,
    lineHeight: 18,
  },
});

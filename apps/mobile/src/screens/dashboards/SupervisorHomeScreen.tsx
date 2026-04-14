import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import {
  getManagerDashboard,
  getSupervisorDashboard,
  type ManagerDashboardResponse,
  type SupervisorDashboardResponse,
} from "@madhuban/api";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AttendanceActionCard } from "../../components/AttendanceActionCard";
import { RefreshableScrollView } from "../../components/RefreshableScrollView";
import { SkeletonBlock } from "../../components/SkeletonBlock";
import { useAuth } from "../../context/AuthContext";
import { styles } from "../../styles/screens/tabs/home.styles";

const FALLBACK_SUMMARY_STATS = [
  { icon: "alert-circle-outline", value: "12", label: "Needs Review", tint: "#FDB321" },
  { icon: "shield-checkmark-outline", value: "45", label: "Approved", tint: "#2CD88A" },
  { icon: "close-circle-outline", value: "3", label: "Rejected", tint: "#FF5964" },
] as const;

const FALLBACK_ATTENTION_ITEMS = [
  {
    status: "10M OVERDUE",
    title: "VIP Lounge Deep Clean",
    initials: "RA",
    assignee: "Rahul D.",
    variant: "danger" as const,
  },
  {
    status: "DUE IN 5M",
    title: "CEO Cabin Prep",
    initials: "AM",
    assignee: "Amit K.",
    variant: "warning" as const,
  },
] as const;

const FALLBACK_ZONE_HEALTH = [
  { title: "Washrooms", value: 92, dot: "#20C97A" },
  { title: "Cafeteria", value: 65, dot: "#F59F0B" },
  { title: "Lobby", value: 100, dot: "#20C97A" },
  { title: "Parking", value: 45, dot: "#FF5561" },
] as const;

const FALLBACK_ACTIVITY_ITEMS = [
  {
    status: "Approved",
    time: "10:45 AM",
    detail: "Main Entrance Mopping",
    assignee: "Rahul D.",
    tone: "success" as const,
  },
  {
    status: "Sent Back",
    time: "10:30 AM",
    detail: "Washroom #2 Cleaning",
    assignee: "Amit K.",
    tone: "muted" as const,
    note: "Note: Missing soap refill",
  },
  {
    status: "Approved",
    time: "10:15 AM",
    detail: "Conference Room Prep",
    assignee: "Rahul D.",
    tone: "success" as const,
  },
] as const;

function HeroGradient() {
  return (
    <View pointerEvents="none" style={styles.heroGradient}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="supervisorHero" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#263954" />
            <Stop offset="55%" stopColor="#1D2E48" />
            <Stop offset="100%" stopColor="#172231" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#supervisorHero)" />
      </Svg>
      <View style={styles.heroGlowTop} />
      <View style={styles.heroGlowBottom} />
    </View>
  );
}

function SummaryStat({
  icon,
  value,
  label,
  tint,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  tint: string;
}) {
  return (
    <View style={styles.summaryStat}>
      <View style={styles.summaryStatShine} />
      <Ionicons name={icon} size={14} color="#D8E1F2" />
      <Text style={[styles.summaryValue, { color: tint }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function AttentionCard({
  status,
  title,
  initials,
  assignee,
  variant,
}: {
  status: string;
  title: string;
  initials: string;
  assignee: string;
  variant: "danger" | "warning";
}) {
  const statusStyle =
    variant === "danger" ? styles.attentionStatusDanger : styles.attentionStatusWarning;

  return (
    <View style={styles.attentionCard}>
      <Text style={[styles.attentionStatus, statusStyle]}>{status}</Text>
      <Text style={styles.attentionTitle}>{title}</Text>
      <View style={styles.assigneeRow}>
        <View style={styles.assigneeBadge}>
          <Text style={styles.assigneeBadgeText}>{initials}</Text>
        </View>
        <Text style={styles.assigneeName}>{assignee}</Text>
      </View>
    </View>
  );
}

function ZoneTile({
  title,
  value,
  dot,
}: {
  title: string;
  value: number;
  dot: string;
}) {
  return (
    <View style={styles.zoneTile}>
      <Text style={styles.zoneTitle}>{title}</Text>
      <View style={styles.zoneMetric}>
        <Text style={styles.zoneValue}>{value}%</Text>
        <View style={[styles.zoneDot, { backgroundColor: dot }]} />
      </View>
    </View>
  );
}

function ActivityItem({
  status,
  time,
  detail,
  assignee,
  note,
  tone,
  isLast,
}: {
  status: string;
  time: string;
  detail: string;
  assignee: string;
  note?: string;
  tone: "success" | "muted";
  isLast: boolean;
}) {
  const iconWrapStyle = tone === "success" ? styles.activityIconSuccess : styles.activityIconMuted;
  const iconName = tone === "success" ? "check" : "corner-up-left";
  const iconColor = tone === "success" ? "#1AB85B" : "#7B8AA2";

  return (
    <View style={styles.activityRow}>
      <View style={styles.activityRail}>
        <View style={[styles.activityIconWrap, iconWrapStyle]}>
          <Feather name={iconName} size={13} color={iconColor} />
        </View>
        {!isLast ? <View style={styles.activityLine} /> : null}
      </View>

      <View style={styles.activityBody}>
        <View style={styles.activityHeadline}>
          <Text style={styles.activityStatus}>{status}</Text>
          <Text style={styles.activityTime}>{time}</Text>
        </View>

        <Text style={styles.activityDetail}>
          {detail}
          <Text style={styles.activityAssignee}> - {assignee}</Text>
        </Text>

        {note ? (
          <View style={styles.activityNotePill}>
            <Text style={styles.activityNoteText}>{note}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "RT";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
}

function healthColor(healthBand: string, percent: number): string {
  const normalized = healthBand.trim().toUpperCase();
  if (normalized === "LOW") return "#FF5561";
  if (normalized === "MEDIUM") return "#F59F0B";
  if (normalized === "HIGH") return "#20C97A";
  if (percent >= 85) return "#20C97A";
  if (percent >= 60) return "#F59F0B";
  return "#FF5561";
}

function formatUpperText(value: string | null | undefined): string {
  return String(value ?? "").trim().toUpperCase();
}

function mapDashboardUi(
  dashboard: SupervisorDashboardResponse | ManagerDashboardResponse | null,
) {
  if (!dashboard) {
    return {
      summaryStats: FALLBACK_SUMMARY_STATS,
      attentionItems: FALLBACK_ATTENTION_ITEMS,
      zoneHealth: FALLBACK_ZONE_HEALTH,
      activityItems: FALLBACK_ACTIVITY_ITEMS,
      progressPercent: 62,
      progressDone: 45,
      progressPending: 15,
      siteLabel: "AMTP - BANER - DAY",
      shiftStatus: "Shift in progress",
      roleLabel: "SUPERVISOR",
    };
  }

  const stats = dashboard.stats ?? {
    needsReview: 0,
    approved: 0,
    rejected: 0,
  };
  const completion = dashboard.completion ?? {
    percent: 0,
    done: 0,
    pending: 0,
    total: 0,
  };
  const urgentTasks = Array.isArray(dashboard.urgentTasks) ? dashboard.urgentTasks : [];
  const zones = Array.isArray(dashboard.zones) ? dashboard.zones : [];
  const recentActivity = Array.isArray(dashboard.recentActivity) ? dashboard.recentActivity : [];
  const context = dashboard.context ?? {
    label: "",
    shift: "",
    shiftLabel: "",
  };
  const profile = dashboard.profile ?? {
    name: "",
    initials: "",
    role: "SUPERVISOR",
  };

  return {
    summaryStats: [
      {
        icon: "alert-circle-outline" as const,
        value: String(stats.needsReview ?? 0),
        label: "Needs Review",
        tint: "#FDB321",
      },
      {
        icon: "shield-checkmark-outline" as const,
        value: String(stats.approved ?? 0),
        label: "Approved",
        tint: "#2CD88A",
      },
      {
        icon: "close-circle-outline" as const,
        value: String(stats.rejected ?? 0),
        label: "Rejected",
        tint: "#FF5964",
      },
    ],
    attentionItems:
      urgentTasks.length > 0
        ? urgentTasks.slice(0, 4).map((item) => ({
            status: formatUpperText(item.label),
            title: item.taskTitle,
            initials: item.assigneeInitials || getInitials(item.assigneeName),
            assignee: item.assigneeName,
            variant: item.urgencyKind === "OVERDUE" ? ("danger" as const) : ("warning" as const),
          }))
        : FALLBACK_ATTENTION_ITEMS.slice(0, 1),
    zoneHealth:
      zones.length > 0
        ? zones.slice(0, 4).map((zone) => ({
            title: zone.zoneName,
            value: zone.percent,
            dot: healthColor(zone.healthBand, zone.percent),
          }))
        : FALLBACK_ZONE_HEALTH,
    activityItems:
      recentActivity.length > 0
        ? recentActivity.slice(0, 4).map((item) => ({
            status:
              item.action === "APPROVED"
                ? "Approved"
                : item.action === "REJECTED"
                  ? "Sent Back"
                  : item.action,
            time: item.timeDisplay || "--",
            detail: item.taskTitle,
            assignee: item.staffName,
            tone: item.action === "APPROVED" ? ("success" as const) : ("muted" as const),
            note: item.note ? `Note: ${item.note}` : undefined,
          }))
        : FALLBACK_ACTIVITY_ITEMS,
    progressPercent: completion.percent ?? 0,
    progressDone: completion.done ?? 0,
    progressPending: completion.pending ?? 0,
    siteLabel: formatUpperText(
      [context.label, context.shiftLabel].filter(Boolean).join(" - "),
    ),
    shiftStatus: dashboard.shiftInProgress ? "Shift in progress" : "Shift not started",
    roleLabel: formatUpperText(profile.role || "SUPERVISOR"),
  };
}

function SummarySkeleton() {
  return (
    <View style={styles.summaryRow}>
      {[0, 1, 2].map((item) => (
        <View key={item} style={styles.summaryStat}>
          <SkeletonBlock style={{ width: 18, height: 18, borderRadius: 9 }} />
          <SkeletonBlock style={{ width: 42, height: 20, borderRadius: 8, marginTop: 8 }} />
          <SkeletonBlock style={{ width: 78, height: 12, borderRadius: 6, marginTop: 8 }} />
        </View>
      ))}
    </View>
  );
}

function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <View style={styles.card}>
      <View style={styles.sectionRow}>
        <SkeletonBlock style={{ width: 128, height: 14, borderRadius: 7 }} />
        <SkeletonBlock style={{ width: 44, height: 14, borderRadius: 7 }} />
      </View>
      <View style={{ gap: 10 }}>
        {Array.from({ length: rows }, (_, index) => (
          <SkeletonBlock
            key={index}
            style={{ height: 44, borderRadius: 14 }}
          />
        ))}
      </View>
    </View>
  );
}

export function SupervisorHomeScreen() {
  const { user, role } = useAuth();
  const insets = useSafeAreaInsets();
  const normalizedRole = String(role ?? user?.role ?? "").trim().toLowerCase();
  const isSupervisor = normalizedRole === "supervisor";
  const isManager = normalizedRole === "manager";
  const supportsDashboard = isSupervisor || isManager;
  const [dashboard, setDashboard] = useState<
    SupervisorDashboardResponse | ManagerDashboardResponse | null
  >(null);
  const [loading, setLoading] = useState(supportsDashboard);

  const loadDashboard = useCallback(async () => {
    if (!supportsDashboard) return;
    const data = isManager ? await getManagerDashboard() : await getSupervisorDashboard();
    setDashboard(data);
  }, [isManager, supportsDashboard]);

  useEffect(() => {
    let active = true;
    if (!supportsDashboard) {
      setLoading(false);
      return;
    }

    setLoading(true);
    loadDashboard()
      .catch(() => {
        if (active) setDashboard(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loadDashboard, supportsDashboard]);

  const ui = useMemo(() => mapDashboardUi(dashboard), [dashboard]);
  const displayName = dashboard?.profile?.name?.trim() || user?.name?.trim() || "Rahul Type";
  const initials = dashboard?.profile?.initials || getInitials(displayName);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={[styles.heroCard, { paddingTop: insets.top + 10 }]}>
        <HeroGradient />

        <View style={styles.heroTopRow}>
          <View style={styles.sitePill}>
            <MaterialCommunityIcons name="briefcase-outline" size={12} color="#C8D3E8" />
            <Text style={styles.sitePillText}>{ui.siteLabel}</Text>
          </View>

          <View style={styles.heroActions}>
            <View style={styles.avatarCard}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>

            <View style={styles.notificationCard}>
              <Ionicons name="notifications-outline" size={18} color="#EFF4FF" />
              <View style={styles.notificationDot} />
            </View>
          </View>
        </View>

        <Text style={styles.heroTitle}>{displayName}</Text>

        <View style={styles.heroStatusRow}>
          <View style={styles.heroStatusDot} />
          <Text style={styles.heroStatusText}>{ui.shiftStatus}</Text>
          <View style={styles.roleChip}>
            <Text style={styles.roleChipText}>{ui.roleLabel}</Text>
          </View>
        </View>

        {loading ? (
          <SummarySkeleton />
        ) : (
          <View style={styles.summaryRow}>
            {ui.summaryStats.map((stat) => (
              <SummaryStat
                key={stat.label}
                icon={stat.icon}
                value={stat.value}
                label={stat.label}
                tint={stat.tint}
              />
            ))}
          </View>
        )}
      </View>

      <RefreshableScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, styles.contentWithTopSpacing]}
        showsVerticalScrollIndicator={false}
        onRefresh={loadDashboard}
      >
        <View style={styles.body}>
          <AttendanceActionCard role={role as string | undefined} />

          {loading ? (
            <CardSkeleton rows={2} />
          ) : (
            <View style={styles.card}>
              <View style={styles.sectionRow}>
                <View style={styles.sectionTitleWrap}>
                  <Feather name="activity" size={14} color="#4F88FF" />
                  <Text style={styles.sectionTitlePrimary}>Shift Completion</Text>
                </View>
                <Text style={styles.progressPercent}>{ui.progressPercent}%</Text>
              </View>

              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, ui.progressPercent))}%` }]} />
              </View>

              <View style={styles.progressLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: "#25CB7A" }]} />
                  <Text style={styles.legendText}>{ui.progressDone} Done</Text>
                </View>

                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: "#F59F0B" }]} />
                  <Text style={styles.legendText}>{ui.progressPending} Pending</Text>
                </View>
              </View>
            </View>
          )}

          {loading ? (
            <CardSkeleton rows={2} />
          ) : (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionRow}>
                <View style={styles.sectionTitleWrap}>
                  <Ionicons name="flash-outline" size={13} color="#FF9E1A" />
                  <Text style={styles.sectionTitleSecondary}>Needs Attention Now</Text>
                </View>
                <Text style={styles.sectionAction}>{"See All ->"}</Text>
              </View>

              <View style={styles.attentionGrid}>
                {ui.attentionItems.map((item) => (
                  <AttentionCard key={`${item.title}-${item.assignee}`} {...item} />
                ))}
              </View>
            </View>
          )}

          {loading ? (
            <CardSkeleton rows={2} />
          ) : (
            <View style={styles.card}>
              <View style={styles.sectionRow}>
                <View style={styles.sectionTitleWrap}>
                  <Ionicons name="location-outline" size={13} color="#6A8EFF" />
                  <Text style={styles.sectionTitleSecondary}>Zone Health</Text>
                </View>
                <Text style={styles.sectionAction}>By Zone</Text>
              </View>

              <View style={styles.zoneGrid}>
                {ui.zoneHealth.map((zone) => (
                  <ZoneTile key={zone.title} {...zone} />
                ))}
              </View>
            </View>
          )}

          {loading ? (
            <CardSkeleton rows={3} />
          ) : (
            <View style={styles.card}>
              <View style={styles.sectionTitleWrap}>
                <Feather name="activity" size={13} color="#7C8AA4" />
                <Text style={styles.sectionTitleSecondary}>Recent Activity</Text>
              </View>

              <View style={styles.activityList}>
                {ui.activityItems.map((item, index) => (
                  <ActivityItem
                    key={`${item.status}-${item.time}-${index}`}
                    {...item}
                    isLast={index === ui.activityItems.length - 1}
                  />
                ))}
              </View>
            </View>
          )}
        </View>
      </RefreshableScrollView>
    </View>
  );
}

import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { getStaffReport, type StaffReportResponse } from "@madhuban/api";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { RefreshableScrollView } from "../../components/RefreshableScrollView";
import { SkeletonBlock } from "../../components/SkeletonBlock";
import { useAuth } from "../../context/AuthContext";
import { RolePageLayout } from "../../layouts/RolePageLayout";
import { styles } from "../../styles/screens/tabs/reports.styles";

type HubTab = "performance" | "leave";

const LEAVE_STATS = [
  {
    label: "Available",
    value: 4,
    icon: <Feather name="calendar" size={16} color="#2962FF" />,
  },
  {
    label: "Pending",
    value: 1,
    icon: <Feather name="clock" size={16} color="#F59E0B" />,
  },
  {
    label: "Taken",
    value: 2,
    icon: <Feather name="check-square" size={16} color="#94A3B8" />,
  },
] as const;

const LEAVE_APPLICATIONS = [
  {
    title: "Sick Leave",
    meta: "18 Mar 2026 (1 Day)",
    status: "Pending",
    tone: "warning",
  },
  {
    title: "Casual Leave",
    meta: "05 Feb 2026 (2 Days)",
    status: "Approved",
    tone: "success",
  },
  {
    title: "Half Day",
    meta: "12 Jan 2026",
    status: "Rejected",
    tone: "danger",
  },
] as const;

function getStatusStyle(tone: "warning" | "success" | "danger") {
  if (tone === "success") {
    return {
      badge: styles.statusSuccess,
      text: styles.statusSuccessText,
      icon: "#17C484",
      name: "check-circle" as const,
    };
  }

  if (tone === "danger") {
    return {
      badge: styles.statusDanger,
      text: styles.statusDangerText,
      icon: "#FF4D6D",
      name: "x-circle" as const,
    };
  }

  return {
    badge: styles.statusWarning,
    text: styles.statusWarningText,
    icon: "#F59E0B",
    name: "clock" as const,
  };
}

function getMonthLabel(date: Date) {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function buildAttendancePattern(report: StaffReportResponse | null): ReadonlyArray<ReadonlyArray<number>> {
  if (!report) {
    return [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 0, 1, 1, 1],
      [1, 1, 1, 1, 0, 0, 0],
    ] as const;
  }

  const values = report.attendance.days.map((item) => (item.status === "PRESENT" ? 1 : 0));
  const grid: number[][] = [];
  for (let index = 0; index < values.length; index += 7) {
    grid.push(values.slice(index, index + 7));
  }
  return grid;
}

export function ReportsScreen() {
  const { user } = useAuth();
  const [tab, setTab] = useState<HubTab>("performance");
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<StaffReportResponse | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const data = await getStaffReport(now.getFullYear(), now.getMonth() + 1);
      setReport(data);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const subtitle = useMemo(() => {
    const name = user?.name ?? "Rahul Dhumal";
    return `${name} · ${report?.period.label ?? getMonthLabel(new Date())}`;
  }, [report?.period.label, user?.name]);

  const priorityData =
    report?.byPriority.map((item) => ({
      label: item.priority === "UNKNOWN" ? "Unknown" : item.priority[0] + item.priority.slice(1).toLowerCase(),
      value: item.count,
      color:
        item.priority === "CRITICAL"
          ? "#F04438"
          : item.priority === "HIGH"
            ? "#FF7A00"
            : item.priority === "MEDIUM"
              ? "#2962FF"
              : "#17C484",
    })) ?? [
      { label: "Critical", value: 45, color: "#F04438" },
      { label: "High", value: 60, color: "#FF7A00" },
      { label: "Medium", value: 51, color: "#2962FF" },
      { label: "Low", value: 30, color: "#17C484" },
    ];

  const zoneData =
    report?.byZone.map((item) => ({
      zone: item.zoneName,
      score: item.percent,
      color: item.percent >= 90 ? "#17C484" : item.percent >= 75 ? "#2962FF" : "#FF6B00",
    })) ?? [
      { zone: "Washrooms (M/F)", score: 92, color: "#2962FF" },
      { zone: "CEO Cabin", score: 100, color: "#17C484" },
    ];

  const feedbackItems =
    report?.feedback.map((item) => ({
      initials: item.checkerInitials,
      task: item.taskTitle,
      note: item.comment ?? "No comment added.",
      when: item.relativeLabel,
      rating: item.rating ?? 0,
    })) ?? [];

  const attendancePattern = buildAttendancePattern(report);

  return (
    <RolePageLayout
      eyebrow="Staff · Hub"
      title="Hub"
      subtitle={subtitle}
      headerCard={
        <View style={styles.segmentedControl}>
          <Pressable
            onPress={() => setTab("performance")}
            style={[styles.segmentButton, tab === "performance" && styles.segmentButtonActive]}
          >
            <Text
              style={[
                styles.segmentButtonText,
                tab === "performance" && styles.segmentButtonTextActive,
              ]}
            >
              Performance
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTab("leave")}
            style={[styles.segmentButton, tab === "leave" && styles.segmentButtonActive]}
          >
            <Text
              style={[styles.segmentButtonText, tab === "leave" && styles.segmentButtonTextActive]}
            >
              Apply Leave
            </Text>
          </Pressable>
        </View>
      }
    >
      <RefreshableScrollView
        contentContainerStyle={styles.root}
        showsVerticalScrollIndicator={false}
        onRefresh={load}
      >
        {tab === "performance" ? (
          <>
            <View style={styles.duoGrid}>
              <View style={[styles.card, styles.halfCard]}>
                <Text style={styles.sectionTitle}>By Priority</Text>
                <View style={styles.priorityList}>
                  {loading
                    ? [0, 1, 2, 3].map((item) => (
                        <View key={item} style={styles.priorityRow}>
                          <SkeletonBlock style={{ width: 86, height: 14, borderRadius: 7 }} />
                          <SkeletonBlock style={{ flex: 1, height: 5, borderRadius: 4 }} />
                          <SkeletonBlock style={{ width: 20, height: 14, borderRadius: 7 }} />
                        </View>
                      ))
                    : priorityData.map((item) => (
                        <View key={item.label} style={styles.priorityRow}>
                          <View style={styles.priorityLabelWrap}>
                            <View style={[styles.priorityDot, { backgroundColor: item.color }]} />
                            <Text style={styles.priorityLabel}>{item.label}</Text>
                          </View>
                          <View style={styles.priorityBarTrack}>
                            <View
                              style={[
                                styles.priorityBarFill,
                                {
                                  width: `${Math.max(item.value, 14)}%`,
                                  backgroundColor: item.color,
                                },
                              ]}
                            />
                          </View>
                          <Text style={styles.priorityValue}>{item.value}</Text>
                        </View>
                      ))}
                </View>
              </View>

              <View style={[styles.card, styles.halfCard]}>
                <View style={styles.sectionHeaderInline}>
                  <View style={styles.sectionHeaderInlineTitle}>
                    <Feather name="clock" size={12} color="#FF7A00" />
                    <Text style={styles.sectionTitle}>Attendance Streak</Text>
                  </View>
                </View>
                {loading ? (
                  <>
                    <SkeletonBlock style={{ height: 54, borderRadius: 16 }} />
                    <SkeletonBlock style={{ height: 68, borderRadius: 16 }} />
                  </>
                ) : (
                  <>
                    <View style={styles.streakSummaryRow}>
                      <View style={styles.streakIcon}>
                        <MaterialCommunityIcons name="fire" size={18} color="#FF7A00" />
                      </View>
                      <View>
                        <Text style={styles.streakValue}>{report?.attendance.currentStreakDays ?? 0}</Text>
                        <Text style={styles.streakLabel}>Day Streak</Text>
                        <Text style={styles.streakMeta}>
                          Personal best: {report?.attendance.bestStreakDays ?? 0} days
                        </Text>
                      </View>
                    </View>
                    <View style={styles.weekLabelRow}>
                      {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                        <Text key={`${day}-${index}`} style={styles.weekLabel}>
                          {day}
                        </Text>
                      ))}
                    </View>
                    <View style={styles.heatmap}>
                      {attendancePattern.flatMap((row, rowIndex) =>
                        row.map((value, colIndex) => (
                          <View
                            key={`${rowIndex}-${colIndex}`}
                            style={[
                              styles.heatCell,
                              value ? styles.heatCellPresent : styles.heatCellAbsent,
                            ]}
                          />
                        )),
                      )}
                    </View>
                    <View style={styles.legendRow}>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, styles.heatCellPresent]} />
                        <Text style={styles.legendText}>Present</Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, styles.heatCellAbsent]} />
                        <Text style={styles.legendText}>Absent</Text>
                      </View>
                    </View>
                  </>
                )}
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.sectionHeaderInlineTitle}>
                <Feather name="map-pin" size={12} color="#FF5B6E" />
                <Text style={styles.sectionTitle}>Performance By Zone</Text>
              </View>
              <View style={styles.zoneList}>
                {loading
                  ? [0, 1, 2].map((item) => (
                      <View key={item} style={styles.zoneRow}>
                        <SkeletonBlock style={{ height: 14, width: "60%", borderRadius: 7 }} />
                        <SkeletonBlock style={{ height: 6, borderRadius: 4 }} />
                      </View>
                    ))
                  : zoneData.map((item, index) => (
                      <View key={`${item.zone}-${index}`} style={styles.zoneRow}>
                        <View style={styles.zoneRowHeader}>
                          <Text style={styles.zoneName}>{item.zone}</Text>
                          <Text style={styles.zoneScore}>{item.score}%</Text>
                        </View>
                        <View style={styles.zoneTrack}>
                          <View
                            style={[
                              styles.zoneFill,
                              { width: `${item.score}%`, backgroundColor: item.color },
                            ]}
                          />
                        </View>
                      </View>
                    ))}
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.sectionHeaderInlineTitle}>
                <Feather name="check" size={12} color="#7C8AA2" />
                <Text style={styles.sectionTitle}>Checker Feedback - Last 5 Tasks</Text>
              </View>
              <View style={styles.feedbackList}>
                {loading
                  ? [0, 1, 2].map((item) => (
                      <View key={item} style={styles.feedbackRow}>
                        <SkeletonBlock style={{ width: 38, height: 38, borderRadius: 13 }} />
                        <View style={styles.feedbackBody}>
                          <SkeletonBlock style={{ height: 16, width: "70%", borderRadius: 8 }} />
                          <SkeletonBlock style={{ height: 14, width: "90%", borderRadius: 7 }} />
                        </View>
                      </View>
                    ))
                  : feedbackItems.map((item, index) => (
                      <View key={`${item.task}-${item.when}-${index}`} style={styles.feedbackRow}>
                        <View style={styles.feedbackAvatar}>
                          <Text style={styles.feedbackAvatarText}>{item.initials}</Text>
                        </View>
                        <View style={styles.feedbackBody}>
                          <View style={styles.feedbackTopRow}>
                            <Text style={styles.feedbackTask}>{item.task}</Text>
                            <Text style={styles.feedbackWhen}>{item.when}</Text>
                          </View>
                          <Text style={styles.feedbackNote}>{item.note}</Text>
                          <View style={styles.ratingRow}>
                            {Array.from({ length: 5 }).map((_, index) => (
                              <Ionicons
                                key={`${item.task}-${index}`}
                                name={index < item.rating ? "star" : "star-outline"}
                                size={12}
                                color={index < item.rating ? "#17C484" : "#D2DAE7"}
                              />
                            ))}
                          </View>
                        </View>
                      </View>
                    ))}
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.leaveHeading}>Leave Management</Text>
              <Pressable style={styles.applyLeaveButton}>
                <Ionicons name="add" size={14} color="#FFFFFF" />
                <Text style={styles.applyLeaveButtonText}>Apply Leave</Text>
              </Pressable>
            </View>

            <View style={styles.leaveStatsRow}>
              {LEAVE_STATS.map((item) => (
                <View key={item.label} style={styles.leaveStatCard}>
                  <View style={styles.leaveStatIcon}>{item.icon}</View>
                  <Text style={styles.leaveStatValue}>{item.value}</Text>
                  <Text style={styles.leaveStatLabel}>{item.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Recent Applications</Text>
              <View style={styles.applicationList}>
                {LEAVE_APPLICATIONS.map((item, index) => {
                  const status = getStatusStyle(item.tone);
                  return (
                    <View key={`${item.title}-${index}`} style={styles.applicationRow}>
                      <View>
                        <Text style={styles.applicationTitle}>{item.title}</Text>
                        <Text style={styles.applicationMeta}>{item.meta}</Text>
                      </View>
                      <View style={[styles.statusBadge, status.badge]}>
                        <Feather name={status.name} size={11} color={status.icon} />
                        <Text style={[styles.statusText, status.text]}>{item.status}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </RefreshableScrollView>
    </RolePageLayout>
  );
}

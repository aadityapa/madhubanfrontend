import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { RefreshableScrollView } from "../../components/RefreshableScrollView";
import { useAuth } from "../../context/AuthContext";
import { RolePageLayout } from "../../layouts/RolePageLayout";
import { styles } from "../../styles/screens/tabs/reports.styles";

type HubTab = "performance" | "leave";

const PRIORITY_DATA = [
  { label: "Critical", value: 45, color: "#F04438" },
  { label: "High", value: 60, color: "#FF7A00" },
  { label: "Medium", value: 51, color: "#2962FF" },
  { label: "Low", value: 30, color: "#17C484" },
] as const;

const PERFORMANCE_ZONES = [
  { zone: "Washrooms (M/F)", score: 92, color: "#2962FF" },
  { zone: "CEO Cabin", score: 100, color: "#17C484" },
  { zone: "VIP Room", score: 88, color: "#FF6B00" },
  { zone: "Reception", score: 95, color: "#2962FF" },
  { zone: "Conference Room", score: 85, color: "#FF6B00" },
  { zone: "Employee Desks", score: 90, color: "#2962FF" },
] as const;

const FEEDBACK_ITEMS = [
  {
    initials: "RT",
    task: "Toilet Cleaning",
    note: "Well done, all areas clean",
    when: "Today",
    rating: 5,
  },
  {
    initials: "RT",
    task: "CEO Cabin Floor",
    note: "Missed corner near window",
    when: "Yesterday",
    rating: 3,
  },
  {
    initials: "RT",
    task: "VIP Room Prep",
    note: "Perfect setup, good work",
    when: "Yesterday",
    rating: 5,
  },
  {
    initials: "RT",
    task: "Reception Desk",
    note: "Dust on monitor stands",
    when: "2d ago",
    rating: 4,
  },
] as const;

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

const ATTENDANCE_PATTERN = [
  [1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 0, 1, 1, 1],
  [1, 1, 1, 1, 0, 0, 0],
] as const;

function getMonthLabel(date: Date) {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

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

export function ReportsScreen() {
  const { user } = useAuth();
  const [tab, setTab] = useState<HubTab>("performance");

  const subtitle = useMemo(() => {
    const name = user?.name ?? "Rahul Dhumal";
    return `${name} · ${getMonthLabel(new Date())}`;
  }, [user?.name]);

  const attendanceCount = ATTENDANCE_PATTERN.flat().filter(Boolean).length;

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
        onRefresh={async () => {}}
      >
        {tab === "performance" ? (
          <>
            <View style={styles.duoGrid}>
              <View style={[styles.card, styles.halfCard]}>
                <Text style={styles.sectionTitle}>By Priority</Text>
                <View style={styles.priorityList}>
                  {PRIORITY_DATA.map((item) => (
                    <View key={item.label} style={styles.priorityRow}>
                      <View style={styles.priorityLabelWrap}>
                        <View style={[styles.priorityDot, { backgroundColor: item.color }]} />
                        <Text style={styles.priorityLabel}>{item.label}</Text>
                      </View>
                      <View style={styles.priorityBarTrack}>
                        <View
                          style={[
                            styles.priorityBarFill,
                            { width: `${Math.max(item.value, 14)}%`, backgroundColor: item.color },
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
                <View style={styles.streakSummaryRow}>
                  <View style={styles.streakIcon}>
                    <MaterialCommunityIcons name="fire" size={18} color="#FF7A00" />
                  </View>
                  <View>
                    <Text style={styles.streakValue}>12</Text>
                    <Text style={styles.streakLabel}>Day Streak</Text>
                    <Text style={styles.streakMeta}>Personal best: 18 days</Text>
                  </View>
                </View>
                <View style={styles.weekLabelRow}>
                  {["M", "T", "W", "T", "F", "S", "S"].map((day) => (
                    <Text key={day} style={styles.weekLabel}>
                      {day}
                    </Text>
                  ))}
                </View>
                <View style={styles.heatmap}>
                  {ATTENDANCE_PATTERN.flatMap((row, rowIndex) =>
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
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.sectionHeaderInlineTitle}>
                <Feather name="map-pin" size={12} color="#FF5B6E" />
                <Text style={styles.sectionTitle}>Performance By Zone</Text>
              </View>
              <View style={styles.zoneList}>
                {PERFORMANCE_ZONES.map((item) => (
                  <View key={item.zone} style={styles.zoneRow}>
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
                {FEEDBACK_ITEMS.map((item) => (
                  <View key={`${item.task}-${item.when}`} style={styles.feedbackRow}>
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
                {LEAVE_APPLICATIONS.map((item) => {
                  const status = getStatusStyle(item.tone);
                  return (
                    <View key={item.title} style={styles.applicationRow}>
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

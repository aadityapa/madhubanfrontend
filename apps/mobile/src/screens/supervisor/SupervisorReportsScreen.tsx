import { Feather, Ionicons } from "@expo/vector-icons";
import {
  getManagerEmployeeShiftReport,
  getManagerShiftReport,
  getSupervisorEmployeeShiftReport,
  getSupervisorShiftReport,
  type ManagerEmployeeShiftReportResponse,
  type ManagerShiftReportResponse,
  type SupervisorEmployeeShiftReportResponse,
  type SupervisorShiftReportResponse,
} from "@madhuban/api";
import { font, radii } from "@madhuban/theme";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RefreshableScrollView } from "../../components/RefreshableScrollView";
import { SkeletonBlock } from "../../components/SkeletonBlock";
import { useAuth } from "../../context/AuthContext";

const REPORT_TABS = ["OVERVIEW", "ZONE", "FUNCTION", "EMPLOYEE"] as const;

type ReportTab = (typeof REPORT_TABS)[number];
type Tone = "green" | "blue" | "orange" | "red";

type ZoneTask = {
  name: string;
  assignee: string;
  status: "Approved" | "Pending";
  time: string;
};

type ZoneItem = {
  key: string;
  name: string;
  value: number;
  checked: string;
  tone: Tone;
  tasks: ZoneTask[];
};

type FunctionItem = {
  key: string;
  icon: keyof typeof Feather.glyphMap;
  name: string;
  value: number;
  tone: Exclude<Tone, "red">;
  totalTasks?: number;
  approved?: number;
  topPerformer?: string;
  quality?: string;
};

type EmployeeItem = {
  key: string;
  initials: string;
  name: string;
  team: string;
  score: number;
  tasks: number;
  onTime: number;
  recentLogs: {
    title: string;
    time: string;
    rating: string;
    status: "DONE" | "IN PROG";
  }[];
};

const SUMMARY = {
  completion: 82,
  approved: 145,
  pending: 32,
  rejected: 5,
};

const ZONES: ZoneItem[] = [
  {
    key: "washrooms",
    name: "Washrooms",
    value: 92,
    checked: "45 of 49 tasks completed",
    tone: "green",
    tasks: [
      { name: "Deep Cleaning", assignee: "Assigned to Ravi S.", status: "Approved", time: "10:45 AM" },
      { name: "Restock Supplies", assignee: "Assigned to Amit K.", status: "Pending", time: "11:15 AM" },
      { name: "Trash Removal", assignee: "Assigned to Sunil", status: "Approved", time: "09:30 AM" },
    ],
  },
  {
    key: "vip",
    name: "VIP Area",
    value: 100,
    checked: "12 of 12 tasks completed",
    tone: "blue",
    tasks: [
      { name: "Cabin Touch Up", assignee: "Assigned to Ravi S.", status: "Approved", time: "10:05 AM" },
      { name: "Amenity Refill", assignee: "Assigned to Sunil", status: "Approved", time: "09:25 AM" },
    ],
  },
  {
    key: "cafeteria",
    name: "Cafeteria",
    value: 65,
    checked: "20 of 31 tasks completed",
    tone: "orange",
    tasks: [
      { name: "Pantry Surface Check", assignee: "Assigned to Amit K.", status: "Pending", time: "11:40 AM" },
      { name: "Counter Cleanup", assignee: "Assigned to Sunil", status: "Approved", time: "10:10 AM" },
    ],
  },
  {
    key: "parking",
    name: "Parking",
    value: 45,
    checked: "9 of 20 tasks completed",
    tone: "red",
    tasks: [
      { name: "No Show Follow-up", assignee: "Assigned to Prakash", status: "Pending", time: "10:45 AM" },
      { name: "Entry Lane Sweep", assignee: "Assigned to Ravi S.", status: "Approved", time: "09:55 AM" },
      { name: "Spot Check", assignee: "Assigned to Sunil", status: "Pending", time: "11:10 AM" },
    ],
  },
];

const FUNCTIONS: FunctionItem[] = [
  {
    key: "cleaning",
    icon: "droplet",
    name: "Cleaning",
    value: 94,
    tone: "green",
    totalTasks: 124,
    approved: 118,
    topPerformer: "Sunil K.",
    quality: "98% Quality",
  },
  {
    key: "pantry",
    icon: "coffee",
    name: "Pantry",
    value: 88,
    tone: "blue",
  },
  {
    key: "security",
    icon: "shield",
    name: "Security Assist",
    value: 100,
    tone: "green",
  },
  {
    key: "maintenance",
    icon: "tool",
    name: "Maintenance",
    value: 72,
    tone: "orange",
  },
];

const EMPLOYEES: EmployeeItem[] = [
  {
    key: "sunil",
    initials: "SU",
    name: "Sunil K.",
    team: "Housekeeping",
    score: 98,
    tasks: 24,
    onTime: 100,
    recentLogs: [
      {
        title: "VIP Lounge Deep Clean",
        time: "10:15 AM",
        rating: "5/5",
        status: "DONE",
      },
      {
        title: "Washroom #2 Maintenance",
        time: "11:00 AM",
        rating: "--",
        status: "IN PROG",
      },
    ],
  },
  {
    key: "ravi",
    initials: "RA",
    name: "Ravi S.",
    team: "Housekeeping",
    score: 95,
    tasks: 22,
    onTime: 92,
    recentLogs: [
      {
        title: "Main Lobby Sweep",
        time: "09:40 AM",
        rating: "4/5",
        status: "DONE",
      },
    ],
  },
  {
    key: "amit",
    initials: "AM",
    name: "Amit K.",
    team: "Pantry",
    score: 88,
    tasks: 18,
    onTime: 85,
    recentLogs: [
      {
        title: "Pantry Counter Reset",
        time: "10:30 AM",
        rating: "4/5",
        status: "DONE",
      },
    ],
  },
];

const ESCALATIONS = [
  {
    title: "No Show",
    detail: "Maker Prakash did not report to Parking area",
    time: "10:45 AM",
  },
  {
    title: "Supply Issue",
    detail: "Out of liquid soap in Washroom #3",
    time: "09:15 AM",
  },
] as const;

function CompletionRing({ value }: { value: number }) {
  const segments = Array.from({ length: 6 }, (_, index) => index);

  return (
    <View style={styles.ringWrap}>
      {segments.map((segment) => {
        const active = segment !== 1 && segment !== 4;
        return (
          <View
            key={segment}
            style={[
              styles.ringSegment,
              { transform: [{ rotate: `${segment * 60}deg` }] },
            ]}
          >
            <View style={[styles.ringArc, active ? styles.ringArcActive : styles.ringArcMuted]} />
          </View>
        );
      })}
      <View style={styles.ringCenter}>
        <Text style={styles.ringValue}>{value}%</Text>
        <Text style={styles.ringLabel}>COMPLETION</Text>
      </View>
    </View>
  );
}

function toneValueStyle(tone: Tone) {
  return tone === "green"
    ? styles.valueGreen
    : tone === "blue"
      ? styles.valueBlue
      : tone === "orange"
        ? styles.valueOrange
        : styles.valueRed;
}

function toneFillStyle(tone: Tone) {
  return tone === "green"
    ? styles.fillGreen
    : tone === "blue"
      ? styles.fillBlue
      : tone === "orange"
        ? styles.fillOrange
        : styles.fillRed;
}

function statusStyle(status: ZoneTask["status"]) {
  return status === "Approved" ? styles.statusApproved : styles.statusPending;
}

function statusIcon(status: ZoneTask["status"]) {
  return status === "Approved" ? "check-circle" : "clock";
}

function formatTime(value: string | null | undefined): string {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function labelCase(value: string): string {
  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function mapReportTone(percent: number): Tone {
  if (percent >= 90) return "green";
  if (percent >= 75) return "blue";
  if (percent >= 55) return "orange";
  return "red";
}

function mapFunctionIcon(key: string): keyof typeof Feather.glyphMap {
  switch (key) {
    case "cleaning":
      return "droplet";
    case "pantry":
      return "coffee";
    case "security_assist":
      return "shield";
    case "maintenance":
      return "tool";
    default:
      return "grid";
  }
}

function mapReportData(
  report: SupervisorShiftReportResponse | ManagerShiftReportResponse | null,
  detailCache: Record<
    string,
    SupervisorEmployeeShiftReportResponse | ManagerEmployeeShiftReportResponse
  >,
) {
  if (!report) {
    return {
      summary: SUMMARY,
      zones: ZONES,
      functions: FUNCTIONS,
      employees: EMPLOYEES,
      escalations: ESCALATIONS,
    };
  }

  return {
    summary: {
      completion: report.overview.completion.percent,
      approved: report.overview.approvals.approved,
      pending: report.overview.approvals.pending,
      rejected: report.overview.approvals.rejected,
    },
    zones:
      report.zones.length > 0
        ? report.zones.map((zone) => ({
            key: String(zone.zoneId),
            name: zone.zoneName,
            value: zone.percent,
            checked: `${zone.done} of ${zone.assigned} tasks completed`,
            tone: mapReportTone(zone.percent),
            tasks: [] as ZoneTask[],
          }))
        : ZONES,
    functions:
      report.functions.length > 0
        ? report.functions.map((item) => ({
            key: item.functionKey,
            icon: mapFunctionIcon(item.functionKey),
            name: item.functionLabel,
            value: item.percent,
            tone: (mapReportTone(item.percent) === "red" ? "orange" : mapReportTone(item.percent)) as Exclude<Tone, "red">,
            totalTasks: item.assigned,
            approved: item.approved,
            topPerformer:
              report.employees.slice().sort((a, b) => b.scorePercent - a.scorePercent)[0]?.name ?? "--",
            quality: `${item.percent}% Quality`,
          }))
        : FUNCTIONS,
    employees:
      report.employees.length > 0
        ? report.employees.map((employee) => {
            const detail = detailCache[String(employee.staffId)];
            return {
              key: String(employee.staffId),
              initials: employee.initials,
              name: employee.name,
              team: "Today's Shift",
              score: employee.scorePercent,
              tasks: employee.tasks,
              onTime: employee.onTimePercent,
              recentLogs:
                detail?.logs.map((log) => ({
                  title: log.title,
                  time: formatTime(log.time),
                  rating: log.rating ? `${log.rating}/5` : "--",
                  status: log.status === "DONE" || log.status === "COMPLETED" ? ("DONE" as const) : ("IN PROG" as const),
                })) ?? [],
            };
          })
        : EMPLOYEES,
    escalations:
      report.escalations.length > 0
        ? report.escalations.map((item) => ({
            title: labelCase(item.kind),
            detail:
              item.title && item.zoneName
                ? `${item.title} - ${item.zoneName}`
                : item.staffName
                  ? `${item.staffName} - ${item.label}`
                  : item.label,
            time: formatTime(item.deadlineAt ?? item.time),
          }))
        : ESCALATIONS,
  };
}

function ReportsSkeleton({ tab }: { tab: ReportTab }) {
  if (tab === "EMPLOYEE") {
    return (
      <View style={styles.stack}>
        {[0, 1, 2].map((item) => (
          <View key={item} style={styles.card}>
            <View style={{ padding: 16, gap: 12 }}>
              <SkeletonBlock style={{ height: 18, width: "52%", borderRadius: 8 }} />
              <SkeletonBlock style={{ height: 56, borderRadius: 16 }} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.stack}>
      {[0, 1, 2].map((item) => (
        <View key={item} style={styles.card}>
          <View style={{ padding: 18, gap: 12 }}>
            <SkeletonBlock style={{ height: 16, width: "44%", borderRadius: 8 }} />
            <SkeletonBlock style={{ height: 72, borderRadius: 18 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function SupervisorReportsScreen() {
  const { role } = useAuth();
  const insets = useSafeAreaInsets();
  const normalizedRole = String(role ?? "").trim().toLowerCase();
  const isSupervisor = normalizedRole === "supervisor";
  const isManager = normalizedRole === "manager";
  const supportsReports = isSupervisor || isManager;
  const [selectedTab, setSelectedTab] = useState<ReportTab>("OVERVIEW");
  const [expandedZone, setExpandedZone] = useState<string>("parking");
  const [expandedFunction, setExpandedFunction] = useState<string>("cleaning");
  const [expandedEmployee, setExpandedEmployee] = useState<string>("sunil");
  const [report, setReport] = useState<
    SupervisorShiftReportResponse | ManagerShiftReportResponse | null
  >(null);
  const [detailCache, setDetailCache] = useState<
    Record<string, SupervisorEmployeeShiftReportResponse | ManagerEmployeeShiftReportResponse>
  >({});
  const [loading, setLoading] = useState(supportsReports);
  const [loadingEmployeeId, setLoadingEmployeeId] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    if (!supportsReports) return;
    const data = isManager ? await getManagerShiftReport() : await getSupervisorShiftReport();
    setReport(data);
    if (data.zones[0]) setExpandedZone(String(data.zones[0].zoneId));
    if (data.functions[0]) setExpandedFunction(data.functions[0].functionKey);
    if (data.employees[0]) setExpandedEmployee(String(data.employees[0].staffId));
  }, [isManager, supportsReports]);

  useEffect(() => {
    let active = true;
    if (!supportsReports) {
      setLoading(false);
      return;
    }

    setLoading(true);
    loadReport()
      .catch(() => {
        if (active) setReport(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loadReport, supportsReports]);

  const ui = useMemo(() => mapReportData(report, detailCache), [detailCache, report]);

  const activeFunction = useMemo(
    () => ui.functions.find((item) => item.key === expandedFunction) ?? ui.functions[0],
    [expandedFunction, ui.functions]
  );

  const loadEmployeeDetail = useCallback(
    async (employeeKey: string) => {
      if (!supportsReports || detailCache[employeeKey]) return;
      setLoadingEmployeeId(employeeKey);
      try {
        const detail = isManager
          ? await getManagerEmployeeShiftReport(employeeKey)
          : await getSupervisorEmployeeShiftReport(employeeKey);
        setDetailCache((current) => ({ ...current, [employeeKey]: detail }));
      } finally {
        setLoadingEmployeeId(null);
      }
    },
    [detailCache, isManager, supportsReports],
  );

  function renderOverview() {
    return (
      <View style={styles.stack}>
        <View style={styles.card}>
          <View style={styles.summaryCard}>
            <CompletionRing value={ui.summary.completion} />

            <View style={styles.summaryLegend}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryLabelWrap}>
                  <View style={[styles.summaryDot, styles.summaryDotApproved]} />
                  <Text style={styles.summaryLabel}>Approved</Text>
                </View>
                <Text style={styles.summaryValue}>{ui.summary.approved}</Text>
              </View>

              <View style={styles.summaryRow}>
                <View style={styles.summaryLabelWrap}>
                  <View style={[styles.summaryDot, styles.summaryDotPending]} />
                  <Text style={styles.summaryLabel}>Pending</Text>
                </View>
                <Text style={styles.summaryValue}>{ui.summary.pending}</Text>
              </View>

              <View style={styles.summaryRow}>
                <View style={styles.summaryLabelWrap}>
                  <View style={[styles.summaryDot, styles.summaryDotRejected]} />
                  <Text style={styles.summaryLabel}>Rejected</Text>
                </View>
                <Text style={styles.summaryValue}>{ui.summary.rejected}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="location-outline" size={14} color="#4F7CFF" />
              <Text style={styles.sectionTitle}>Zone Completion</Text>
            </View>
            <Text style={styles.sectionMeta}>{ui.zones.length} Zones Active</Text>
          </View>

          <View style={styles.zoneList}>
            {ui.zones.map((zone) => (
              <View key={zone.key} style={styles.zoneBlock}>
                <View style={styles.zoneHeadline}>
                  <Text style={styles.zoneName}>{zone.name}</Text>
                  <Text style={[styles.zoneValue, toneValueStyle(zone.tone)]}>{zone.value}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[styles.progressFill, { width: `${zone.value}%` }, toneFillStyle(zone.tone)]}
                  />
                </View>
                <Text style={styles.zoneHint}>{zone.checked.replace("of", "/").replace("completed", "checked")}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Feather name="settings" size={14} color="#7B8AA4" />
              <Text style={styles.sectionTitle}>Function Health</Text>
            </View>
          </View>

          <View style={styles.healthGrid}>
            {ui.functions.map((item, index) => (
              <View
                key={item.key}
                style={[
                  styles.healthCard,
                  index % 2 === 0 ? styles.healthCardLeft : styles.healthCardRight,
                  index < FUNCTIONS.length - 2 && styles.healthCardBottom,
                ]}
              >
                <View style={styles.healthTitleRow}>
                  <Feather name={item.icon} size={15} color="#8A96AA" />
                  <Text style={styles.healthTitle}>{item.name}</Text>
                </View>
                <Text style={styles.healthValue}>{item.value}%</Text>
                <View style={styles.progressTrack}>
                  <View
                    style={[styles.progressFill, { width: `${item.value}%` }, toneFillStyle(item.tone)]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="people-outline" size={14} color="#4F7CFF" />
              <Text style={styles.sectionTitle}>Maker Performance</Text>
            </View>
            <Text style={styles.sectionMeta}>Today's Shift</Text>
          </View>

          <View style={styles.makerList}>
            {ui.employees.map((maker, index) => (
              <View
                key={maker.key}
                style={[styles.makerRow, index !== ui.employees.length - 1 && styles.makerBorder]}
              >
                <Text style={styles.rankText}>#{index + 1}</Text>
                <View style={styles.makerAvatar}>
                  <Text style={styles.makerAvatarText}>{maker.initials}</Text>
                </View>
                <View style={styles.makerBody}>
                  <Text style={styles.makerName}>{maker.name}</Text>
                  <Text style={styles.makerTeam}>{maker.team}</Text>
                </View>
                <View style={styles.makerScoreWrap}>
                  <Text style={styles.makerScore}>{maker.score}%</Text>
                  <Text style={styles.makerTasks}>{maker.tasks} TASKS</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.card, styles.escalationCard]}>
          <View style={[styles.sectionHeader, styles.escalationHeader]}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="warning-outline" size={15} color="#FF3B30" />
              <Text style={styles.escalationTitle}>Escalation Log</Text>
            </View>
          </View>

          <View style={styles.escalationList}>
            {ui.escalations.map((item, index) => (
              <View
                key={item.title}
                style={[
                  styles.escalationRow,
                  index !== ui.escalations.length - 1 && styles.escalationBorder,
                ]}
              >
                <View style={styles.escalationIconWrap}>
                  <Ionicons name="warning-outline" size={16} color="#FF5252" />
                </View>
                <View style={styles.escalationBody}>
                  <Text style={styles.escalationItemTitle}>{item.title}</Text>
                  <Text style={styles.escalationItemDetail}>{item.detail}</Text>
                  <Text style={styles.escalationTime}>{item.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  function renderZoneTab() {
    return (
      <View style={styles.stack}>
        {ui.zones.map((zone) => {
          const expanded = expandedZone === zone.key;

          return (
            <View key={zone.key} style={styles.card}>
              <Pressable
                style={styles.listCardHeader}
                onPress={() => setExpandedZone(expanded ? "" : zone.key)}
              >
                <View style={[styles.listIconWrap, styles[`icon${zone.tone[0].toUpperCase()}${zone.tone.slice(1)}` as keyof typeof styles]]}>
                  <Ionicons name="location-outline" size={14} color="#FFFFFF" />
                </View>

                <View style={styles.listBody}>
                  <Text style={styles.listTitle}>{zone.name}</Text>
                  <Text style={styles.listHint}>{zone.checked}</Text>
                </View>

                <View style={styles.listMeta}>
                  <Text style={styles.listValue}>{zone.value}%</Text>
                  <Feather
                    name={expanded ? "chevron-down" : "chevron-right"}
                    size={16}
                    color="#C3CCDA"
                  />
                </View>
              </Pressable>

              {expanded && zone.tasks.length > 0 ? (
                <View style={styles.taskList}>
                  {zone.tasks.map((task, index) => (
                    <View
                      key={`${zone.key}-${task.name}`}
                      style={[styles.taskRow, index !== zone.tasks.length - 1 && styles.taskBorder]}
                    >
                      <View style={styles.taskBody}>
                        <Text style={styles.taskTitle}>{task.name}</Text>
                        <Text style={styles.taskHint}>{task.assignee}</Text>
                      </View>

                      <View style={styles.taskMeta}>
                        <View style={styles.taskStatusRow}>
                          <Feather
                            name={statusIcon(task.status)}
                            size={11}
                            color={task.status === "Approved" ? "#18C48F" : "#FF9800"}
                          />
                          <Text style={[styles.taskStatus, statusStyle(task.status)]}>{task.status}</Text>
                        </View>
                        <Text style={styles.taskTime}>{task.time}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : expanded ? (
                <View style={styles.taskList}>
                  <View style={styles.taskRow}>
                    <Text style={styles.taskHint}>Detailed zone tasks are not exposed by this report endpoint.</Text>
                  </View>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    );
  }

  function renderFunctionTab() {
    return (
      <View style={styles.stack}>
        {ui.functions.map((item) => {
          const expanded = expandedFunction === item.key;

          return (
            <View key={item.key} style={styles.card}>
              <Pressable
                style={styles.functionHeader}
                onPress={() => setExpandedFunction(expanded ? "" : item.key)}
              >
                <View style={styles.functionTitleWrap}>
                  <Feather name={item.icon} size={16} color="#8A96AA" />
                  <Text style={styles.functionName}>{item.name}</Text>
                </View>

                <View style={styles.functionRight}>
                  <View style={[styles.badge, styles[`badge${item.tone[0].toUpperCase()}${item.tone.slice(1)}` as keyof typeof styles]]}>
                    <Text style={styles.badgeText}>{item.value}%</Text>
                  </View>
                  <Feather
                    name={expanded ? "chevron-down" : "chevron-right"}
                    size={16}
                    color="#C3CCDA"
                  />
                </View>
              </Pressable>

              <View style={styles.functionProgressPad}>
                <View style={styles.progressTrack}>
                  <View
                    style={[styles.progressFill, { width: `${item.value}%` }, toneFillStyle(item.tone)]}
                  />
                </View>
              </View>

              {expanded && item.totalTasks && item.approved && item.topPerformer && item.quality ? (
                <View style={styles.functionExpanded}>
                  <View style={styles.metricGrid}>
                    <View style={styles.metricCard}>
                      <Text style={styles.metricValue}>{item.totalTasks}</Text>
                      <Text style={styles.metricLabel}>TOTAL TASKS</Text>
                    </View>
                    <View style={styles.metricCard}>
                      <Text style={[styles.metricValue, styles.metricApproved]}>{item.approved}</Text>
                      <Text style={styles.metricLabel}>APPROVED</Text>
                    </View>
                  </View>

                  <Text style={styles.performerLabel}>TOP PERFORMERS</Text>
                  <View style={styles.performerRow}>
                    <View style={styles.performerAvatar}>
                      <Text style={styles.performerAvatarText}>
                        {activeFunction?.topPerformer
                          ?.split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.performerName}>{item.topPerformer}</Text>
                    <Text style={styles.performerQuality}>{item.quality}</Text>
                  </View>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    );
  }

  function renderEmployeeTab() {
    return (
      <View style={styles.stack}>
        {ui.employees.map((employee) => {
          const expanded = expandedEmployee === employee.key;

          return (
            <View key={employee.key} style={styles.card}>
              <Pressable
                style={styles.employeeHeader}
                onPress={() => {
                  const next = expanded ? "" : employee.key;
                  setExpandedEmployee(next);
                  if (next) {
                    void loadEmployeeDetail(next);
                  }
                }}
              >
                <View style={styles.employeeIdentity}>
                  <View style={styles.employeeAvatar}>
                    <Text style={styles.employeeAvatarText}>{employee.initials}</Text>
                  </View>
                  <View>
                    <Text style={styles.employeeName}>{employee.name}</Text>
                    <Text style={styles.employeeTeam}>{employee.team}</Text>
                  </View>
                </View>
                <Feather
                  name={expanded ? "chevron-down" : "chevron-right"}
                  size={16}
                  color="#C3CCDA"
                />
              </Pressable>

              <View style={[styles.employeeStats, expanded && styles.employeeStatsExpanded]}>
                <View style={styles.employeeStat}>
                  <Text style={styles.employeeStatValue}>{employee.score}%</Text>
                  <Text style={styles.employeeStatLabel}>SCORE</Text>
                </View>
                <View style={styles.employeeStat}>
                  <Text style={styles.employeeStatValue}>{employee.tasks}</Text>
                  <Text style={styles.employeeStatLabel}>TASKS</Text>
                </View>
                <View style={styles.employeeStat}>
                  <Text style={styles.employeeStatValue}>{employee.onTime}%</Text>
                  <Text style={styles.employeeStatLabel}>ON TIME</Text>
                </View>
              </View>

              {expanded ? (
                <View style={styles.employeeExpanded}>
                  <Text style={styles.employeeSectionTitle}>RECENT SHIFT LOGS</Text>

                  <View style={styles.shiftLogList}>
                    {loadingEmployeeId === employee.key && employee.recentLogs.length === 0 ? (
                      <SkeletonBlock style={{ height: 72, borderRadius: 16 }} />
                    ) : employee.recentLogs.length > 0 ? (
                      employee.recentLogs.map((log) => (
                      <View key={`${employee.key}-${log.title}`} style={styles.shiftLogCard}>
                        <View style={styles.shiftLogHeader}>
                          <Text style={styles.shiftLogTitle}>{log.title}</Text>
                          <View
                            style={[
                              styles.shiftStatusBadge,
                              log.status === "DONE"
                                ? styles.shiftStatusDone
                                : styles.shiftStatusInProgress,
                            ]}
                          >
                            <Text
                              style={[
                                styles.shiftStatusText,
                                log.status === "DONE"
                                  ? styles.shiftStatusTextDone
                                  : styles.shiftStatusTextInProgress,
                              ]}
                            >
                              {log.status}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.shiftLogMeta}>
                          Time: {log.time}   Rating: {log.rating}
                        </Text>
                      </View>
                    ))
                    ) : (
                      <View style={styles.shiftLogCard}>
                        <Text style={styles.shiftLogMeta}>No shift logs available for this employee.</Text>
                      </View>
                    )}
                  </View>

                  <Pressable style={styles.historyButton}>
                    <Text style={styles.historyButtonText}>View Full History</Text>
                    <Feather name="chevron-right" size={14} color="#2F6BFF" />
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    );
  }

  function renderContent() {
    if (loading) {
      return <ReportsSkeleton tab={selectedTab} />;
    }

    switch (selectedTab) {
      case "ZONE":
        return renderZoneTab();
      case "FUNCTION":
        return renderFunctionTab();
      case "EMPLOYEE":
        return renderEmployeeTab();
      default:
        return renderOverview();
    }
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={[styles.hero, { paddingTop: insets.top + 10 }]}>
        <View style={styles.heroTopRow}>
          <View>
            <Text style={styles.heroTitle}>Reports</Text>
            <Text style={styles.heroSubtitle}>Shift analytics</Text>
          </View>
          <Pressable style={styles.notifyButton}>
            <Ionicons name="notifications-outline" size={18} color="#EFF4FF" />
          </Pressable>
        </View>

        <View style={styles.tabsRow}>
          {REPORT_TABS.map((tab) => {
            const active = tab === selectedTab;
            return (
              <Pressable
                key={tab}
                onPress={() => setSelectedTab(tab)}
                style={[styles.heroTab, active && styles.heroTabActive]}
              >
                <Text style={[styles.heroTabText, active && styles.heroTabTextActive]}>{tab}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <RefreshableScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onRefresh={loadReport}
      >
        {renderContent()}
      </RefreshableScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#EEF1F5",
  },
  hero: {
    backgroundColor: "#1E2B42",
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: "rgba(15, 23, 40, 0.34)",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 1,
    shadowRadius: 26,
    elevation: 12,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontFamily: font.family.black,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -1,
  },
  heroSubtitle: {
    marginTop: 4,
    color: "#9EAECB",
    fontFamily: font.family.bold,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  notifyButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  tabsRow: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heroTab: {
    flex: 1,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    alignItems: "center",
  },
  heroTabActive: {
    backgroundColor: "#26354B",
    borderBottomColor: "#F9A11A",
  },
  heroTabText: {
    color: "#919DB2",
    fontFamily: font.family.bold,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  heroTabTextActive: {
    color: "#F9A11A",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  stack: {
    gap: 14,
  },
  card: {
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7ECF4",
    overflow: "hidden",
    shadowColor: "rgba(39, 51, 72, 0.08)",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 4,
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    gap: 14,
  },
  ringWrap: {
    width: 122,
    height: 122,
    alignItems: "center",
    justifyContent: "center",
  },
  ringSegment: {
    position: "absolute",
    width: 122,
    height: 122,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  ringArc: {
    width: 20,
    height: 40,
    borderRadius: 10,
    marginTop: 6,
  },
  ringArcActive: {
    backgroundColor: "#FFA113",
  },
  ringArcMuted: {
    backgroundColor: "#E9EEF6",
  },
  ringCenter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EFF3F8",
    gap: 2,
  },
  ringValue: {
    color: "#1F2A3D",
    fontFamily: font.family.black,
    fontSize: 18,
  },
  ringLabel: {
    color: "#A2AEC1",
    fontFamily: font.family.bold,
    fontSize: 9,
    letterSpacing: 1,
  },
  summaryLegend: {
    flex: 1,
    gap: 14,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  summaryDot: {
    width: 10,
    height: 10,
    borderRadius: radii.full,
  },
  summaryDotApproved: {
    backgroundColor: "#18C48F",
  },
  summaryDotPending: {
    backgroundColor: "#FF9800",
  },
  summaryDotRejected: {
    backgroundColor: "#FF3B4E",
  },
  summaryLabel: {
    color: "#4D5C75",
    fontFamily: font.family.bold,
    fontSize: 14,
  },
  summaryValue: {
    color: "#1F2A3D",
    fontFamily: font.family.black,
    fontSize: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    color: "#1F2A3D",
    fontFamily: font.family.black,
    fontSize: 16,
  },
  sectionMeta: {
    color: "#A0ABC0",
    fontFamily: font.family.bold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  zoneList: {
    padding: 18,
    gap: 18,
  },
  zoneBlock: {
    gap: 6,
  },
  zoneHeadline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  zoneName: {
    color: "#1F2A3D",
    fontFamily: font.family.black,
    fontSize: 15,
  },
  zoneValue: {
    fontFamily: font.family.bold,
    fontSize: 13,
  },
  zoneHint: {
    color: "#9CA7BB",
    fontFamily: font.family.medium,
    fontSize: 11,
  },
  progressTrack: {
    height: 5,
    borderRadius: radii.full,
    backgroundColor: "#EEF2F7",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: radii.full,
  },
  fillGreen: {
    backgroundColor: "#19C48F",
  },
  fillBlue: {
    backgroundColor: "#4682FF",
  },
  fillOrange: {
    backgroundColor: "#FF9800",
  },
  fillRed: {
    backgroundColor: "#FF3B4E",
  },
  valueGreen: {
    color: "#19C48F",
  },
  valueBlue: {
    color: "#4682FF",
  },
  valueOrange: {
    color: "#FF9800",
  },
  valueRed: {
    color: "#FF3B4E",
  },
  healthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  healthCard: {
    width: "50%",
    padding: 18,
    gap: 12,
  },
  healthCardLeft: {
    borderRightWidth: 1,
    borderRightColor: "#EEF2F7",
  },
  healthCardRight: {},
  healthCardBottom: {
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
  },
  healthTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  healthTitle: {
    color: "#1F2A3D",
    fontFamily: font.family.bold,
    fontSize: 14,
  },
  healthValue: {
    color: "#1F2A3D",
    fontFamily: font.family.black,
    fontSize: 18,
  },
  makerList: {
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  makerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },
  makerBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
  },
  rankText: {
    width: 26,
    color: "#A6B1C4",
    fontFamily: font.family.bold,
    fontSize: 12,
  },
  makerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F6FB",
  },
  makerAvatarText: {
    color: "#51637D",
    fontFamily: font.family.black,
    fontSize: 14,
  },
  makerBody: {
    flex: 1,
    gap: 2,
  },
  makerName: {
    color: "#1F2A3D",
    fontFamily: font.family.black,
    fontSize: 15,
  },
  makerTeam: {
    color: "#8F9BB0",
    fontFamily: font.family.medium,
    fontSize: 12,
  },
  makerScoreWrap: {
    alignItems: "flex-end",
    gap: 2,
  },
  makerScore: {
    color: "#3A7BFF",
    fontFamily: font.family.black,
    fontSize: 16,
  },
  makerTasks: {
    color: "#97A4B8",
    fontFamily: font.family.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
  escalationCard: {
    backgroundColor: "#FFF9F9",
    borderColor: "#F8E2E2",
  },
  escalationHeader: {
    backgroundColor: "#FFF4F4",
    borderBottomColor: "#F3E0E0",
  },
  escalationTitle: {
    color: "#FF3030",
    fontFamily: font.family.black,
    fontSize: 16,
  },
  escalationList: {
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  escalationRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 16,
  },
  escalationBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1E4E4",
  },
  escalationIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF0F0",
  },
  escalationBody: {
    flex: 1,
    gap: 4,
  },
  escalationItemTitle: {
    color: "#1F2A3D",
    fontFamily: font.family.black,
    fontSize: 15,
  },
  escalationItemDetail: {
    color: "#8D99AF",
    fontFamily: font.family.medium,
    fontSize: 12,
    lineHeight: 17,
  },
  escalationTime: {
    marginTop: 6,
    color: "#A5B0C4",
    fontFamily: font.family.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
  listCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  listIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  iconGreen: {
    backgroundColor: "#19C48F",
  },
  iconBlue: {
    backgroundColor: "#4682FF",
  },
  iconOrange: {
    backgroundColor: "#FF9800",
  },
  iconRed: {
    backgroundColor: "#FF3B4E",
  },
  listBody: {
    flex: 1,
    gap: 2,
  },
  listTitle: {
    color: "#1F2A3D",
    fontFamily: font.family.black,
    fontSize: 15,
  },
  listHint: {
    color: "#9CA7BB",
    fontFamily: font.family.medium,
    fontSize: 10,
  },
  listMeta: {
    alignItems: "flex-end",
    gap: 4,
  },
  listValue: {
    color: "#1F2A3D",
    fontFamily: font.family.black,
    fontSize: 16,
  },
  taskList: {
    borderTopWidth: 1,
    borderTopColor: "#EEF2F7",
    paddingLeft: 16,
  },
  taskRow: {
    flexDirection: "row",
    gap: 12,
    paddingRight: 16,
    paddingVertical: 14,
  },
  taskBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
  },
  taskBody: {
    flex: 1,
    gap: 4,
  },
  taskTitle: {
    color: "#1F2A3D",
    fontFamily: font.family.black,
    fontSize: 14,
  },
  taskHint: {
    color: "#A1ACC0",
    fontFamily: font.family.medium,
    fontSize: 11,
  },
  taskMeta: {
    alignItems: "flex-end",
    gap: 4,
  },
  taskStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  taskStatus: {
    fontFamily: font.family.bold,
    fontSize: 11,
  },
  statusApproved: {
    color: "#18C48F",
  },
  statusPending: {
    color: "#FF9800",
  },
  taskTime: {
    color: "#B3BCD0",
    fontFamily: font.family.medium,
    fontSize: 10,
  },
  functionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  functionTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  functionName: {
    color: "#1F2A3D",
    fontFamily: font.family.black,
    fontSize: 15,
  },
  functionRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    minWidth: 44,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeGreen: {
    backgroundColor: "#19C48F",
  },
  badgeBlue: {
    backgroundColor: "#4682FF",
  },
  badgeOrange: {
    backgroundColor: "#FF9800",
  },
  badgeText: {
    color: "#FFFFFF",
    fontFamily: font.family.black,
    fontSize: 12,
  },
  functionProgressPad: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  functionExpanded: {
    borderTopWidth: 1,
    borderTopColor: "#EEF2F7",
    padding: 16,
    gap: 14,
  },
  metricGrid: {
    flexDirection: "row",
    gap: 12,
  },
  metricCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#EAF0F7",
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    alignItems: "center",
    gap: 6,
  },
  metricValue: {
    color: "#25324A",
    fontFamily: font.family.black,
    fontSize: 30,
  },
  metricApproved: {
    color: "#19C48F",
  },
  metricLabel: {
    color: "#AFB9CB",
    fontFamily: font.family.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
  performerLabel: {
    color: "#A5B0C4",
    fontFamily: font.family.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
  performerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEF2F7",
    paddingTop: 12,
  },
  performerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E9F0FF",
  },
  performerAvatarText: {
    color: "#4F7CFF",
    fontFamily: font.family.black,
    fontSize: 10,
  },
  performerName: {
    flex: 1,
    color: "#25324A",
    fontFamily: font.family.bold,
    fontSize: 13,
  },
  performerQuality: {
    color: "#19C48F",
    fontFamily: font.family.bold,
    fontSize: 11,
  },
  employeeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  employeeIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  employeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F1FF",
    borderWidth: 1,
    borderColor: "#D3E2FF",
  },
  employeeAvatarText: {
    color: "#3974FF",
    fontFamily: font.family.black,
    fontSize: 15,
  },
  employeeName: {
    color: "#1F2A3D",
    fontFamily: font.family.black,
    fontSize: 16,
  },
  employeeTeam: {
    marginTop: 2,
    color: "#9CA7BB",
    fontFamily: font.family.medium,
    fontSize: 11,
  },
  employeeStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#EEF2F7",
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  employeeStatsExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
  },
  employeeStat: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  employeeStatValue: {
    color: "#25324A",
    fontFamily: font.family.black,
    fontSize: 18,
  },
  employeeStatLabel: {
    color: "#A7B1C4",
    fontFamily: font.family.bold,
    fontSize: 9,
    letterSpacing: 1,
  },
  employeeExpanded: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 16,
  },
  employeeSectionTitle: {
    color: "#A5B0C4",
    fontFamily: font.family.bold,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  shiftLogList: {
    marginTop: 10,
    gap: 10,
  },
  shiftLogCard: {
    borderRadius: 16,
    backgroundColor: "#F7F9FC",
    borderWidth: 1,
    borderColor: "#EEF2F7",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  shiftLogHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  shiftLogTitle: {
    flex: 1,
    color: "#25324A",
    fontFamily: font.family.black,
    fontSize: 14,
  },
  shiftLogMeta: {
    color: "#8F9BB0",
    fontFamily: font.family.medium,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  shiftStatusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  shiftStatusDone: {
    backgroundColor: "#DDF8EA",
  },
  shiftStatusInProgress: {
    backgroundColor: "#FFF0CC",
  },
  shiftStatusText: {
    fontFamily: font.family.black,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  shiftStatusTextDone: {
    color: "#18A765",
  },
  shiftStatusTextInProgress: {
    color: "#E48A00",
  },
  historyButton: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  historyButtonText: {
    color: "#2F6BFF",
    fontFamily: font.family.bold,
    fontSize: 13,
  },
});

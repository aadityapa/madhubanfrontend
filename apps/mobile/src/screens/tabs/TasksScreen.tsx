import { Feather, Ionicons } from "@expo/vector-icons";
import { getMyTasks, startMyTask, submitMyTaskCompletion, updateMyTaskStatus } from "@madhuban/api";
import { colors, font, radii } from "@madhuban/theme";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RefreshableScrollView } from "../../components/RefreshableScrollView";
import { useAuth } from "../../context/AuthContext";
import { RolePageLayout, formatRoleLabel } from "../../layouts/RolePageLayout";

// ─── Types ────────────────────────────────────────────────────────────────────
type TaskPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "COMPLETED" | "REASSIGNED";
type FilterKey = "all" | "critical" | "high" | "done";
type ModalView = "detail" | "before-image" | "ongoing-confirm" | "after-image";

interface TaskItem {
  id: string;
  title: string;
  location: string;
  zone: string;
  timeStart: string;
  timeEnd?: string;
  estMinutes?: number;
  priority: TaskPriority;
  frequency?: string;
  materials?: string[];
  equipment?: string[];
  checkerName?: string;
  checkerRole?: string;
  checkerInitials?: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_TASKS: TaskItem[] = [
  {
    id: "1",
    title: "Toilet Cleaning",
    location: "Washrooms (M/F)",
    zone: "WASHROOMS (M/F)",
    timeStart: "8:10",
    timeEnd: "8:30",
    estMinutes: 20,
    priority: "CRITICAL",
    frequency: "Daily · Every Shift",
    materials: ["Toilet brush", "Harpic", "Gloves", "Mop"],
    equipment: ["Mop bucket", "Spray bottle"],
    checkerName: "Rahul Tupe",
    checkerRole: "Admin · Quality Checker",
    checkerInitials: "RT",
  },
  {
    id: "2",
    title: "Floor Mopping",
    location: "Washrooms (M/F)",
    zone: "WASHROOMS (M/F)",
    timeStart: "8:30",
    timeEnd: "8:40",
    estMinutes: 10,
    priority: "HIGH",
    frequency: "Daily · Every Shift",
    materials: ["Mop", "Bucket", "Floor cleaner"],
    equipment: ["Mop bucket"],
    checkerName: "Rahul Tupe",
    checkerRole: "Admin · Quality Checker",
    checkerInitials: "RT",
  },
  {
    id: "3",
    title: "Restock CEO Cabin Pantry",
    location: "CEO Cabin · Floor 3",
    zone: "CEO CABIN",
    timeStart: "9:00 AM",
    estMinutes: 15,
    priority: "HIGH",
    frequency: "Daily",
    materials: ["Water bottles", "Tissues"],
    equipment: [],
    checkerName: "Rahul Tupe",
    checkerRole: "Admin · Quality Checker",
    checkerInitials: "RT",
  },
  {
    id: "4",
    title: "Sanitize Main Entrance",
    location: "Main Entrance · GF",
    zone: "MAIN ENTRANCE",
    timeStart: "8:00 AM",
    priority: "COMPLETED",
    frequency: "Daily",
    materials: ["Sanitizer", "Wipes"],
    equipment: [],
    checkerName: "Rahul Tupe",
    checkerRole: "Admin · Quality Checker",
    checkerInitials: "RT",
  },
  {
    id: "5",
    title: "Wipe down desking area",
    location: "IT Dept · Floor 2",
    zone: "IT DEPARTMENT",
    timeStart: "11:00 AM",
    estMinutes: 30,
    priority: "MEDIUM",
    frequency: "Weekly",
    materials: ["Cleaning cloth", "Spray"],
    equipment: [],
    checkerName: "Rahul Tupe",
    checkerRole: "Admin · Quality Checker",
    checkerInitials: "RT",
  },
  {
    id: "6",
    title: "Clear Trash Bins",
    location: "Cafeteria · GF",
    zone: "CAFETERIA",
    timeStart: "10:30 AM",
    estMinutes: 15,
    priority: "REASSIGNED",
    frequency: "Daily",
    materials: ["Trash bags"],
    equipment: [],
    checkerName: "Rahul Tupe",
    checkerRole: "Admin · Quality Checker",
    checkerInitials: "RT",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getPriorityConfig(priority: string) {
  switch (priority.toUpperCase()) {
    case "CRITICAL":
      return { bg: "#FFF0F0", text: "#E53935", border: "#FFCDD2", stripe: "#E53935" };
    case "HIGH":
      return { bg: "#FFF8E6", text: "#D97706", border: "#FDE68A", stripe: "#D97706" };
    case "MEDIUM":
      return { bg: "#F3EEFF", text: "#7C3AED", border: "#E9D5FF", stripe: "#7C3AED" };
    case "COMPLETED":
      return { bg: "#E8F8F0", text: "#10B981", border: "#A7F3D0", stripe: "#10B981" };
    case "REASSIGNED":
      return { bg: "#FFF0F8", text: "#DB2777", border: "#FBCFE8", stripe: "#DB2777" };
    default:
      return { bg: "#F1F5F9", text: "#64748B", border: "#E2E8F0", stripe: "#94A3B8" };
  }
}

// ─── Photo placeholder ────────────────────────────────────────────────────────
function CameraCapture({
  label,
  taken,
  onCapture,
}: {
  label: string;
  taken: boolean;
  onCapture: () => void;
}) {
  return (
    <Pressable
      style={[ms.cameraBox, taken && ms.cameraBoxDone]}
      onPress={onCapture}
    >
      {taken ? (
        <>
          <View style={ms.cameraPreviewFace}>
            <Ionicons name="checkmark-circle" size={44} color="#10B981" />
          </View>
          <Text style={ms.cameraPreviewLabel}>Photo captured</Text>
          <Text style={ms.cameraRetakeHint}>Tap to retake</Text>
        </>
      ) : (
        <>
          <View style={ms.cameraIconCircle}>
            <Ionicons name="camera-outline" size={28} color="#94A3B8" />
          </View>
          <Text style={ms.cameraPlaceholderTitle}>{label}</Text>
          <Text style={ms.cameraPlaceholderHint}>Tap to capture photo</Text>
        </>
      )}
    </Pressable>
  );
}

// ─── TaskDetailModal ──────────────────────────────────────────────────────────
function TaskDetailModal({
  task,
  isOngoing,
  onClose,
  onTaskStart,
  onTaskComplete,
}: {
  task: TaskItem | null;
  isOngoing: boolean;
  onClose: () => void;
  onTaskStart: (taskId: string) => void;
  onTaskComplete: (taskId: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<ModalView>("detail");
  const [beforeTaken, setBeforeTaken] = useState(false);
  const [afterTaken, setAfterTaken] = useState(false);

  // Reset local state when task changes
  const resetState = useCallback(() => {
    setBeforeTaken(false);
    setAfterTaken(false);
    setView(isOngoing ? "ongoing-confirm" : "detail");
  }, [isOngoing]);

  useEffect(() => {
    if (task) resetState();
  }, [task, resetState]);

  if (!task) return null;
  const cfg = getPriorityConfig(task.priority);

  function handleSubmitBefore() {
    if (!beforeTaken) return;
    onTaskStart(task!.id);
    onClose();
  }

  function handleSubmitAfter() {
    if (!afterTaken) return;
    onTaskComplete(task!.id);
    onClose();
  }

  // ── Header (shared across all views) ──
  const header = (
    <View style={ms.zoneBar}>
      <View style={ms.zoneBarLeft}>
        <View style={ms.zoneIconWrap}>
          <Ionicons name="grid-outline" size={15} color="#64B5F6" />
        </View>
        <View>
          <Text style={ms.zoneName}>{task.zone}</Text>
          <Text style={ms.zoneMeta}>
            {task.timeStart}
            {task.timeEnd ? ` - ${task.timeEnd}` : ""}
          </Text>
        </View>
      </View>
      <View style={ms.zoneBarRight}>
        <View style={[ms.badgeSmall, { backgroundColor: cfg.bg }]}>
          <Text style={[ms.badgeSmallText, { color: cfg.text }]}>{task.priority}</Text>
        </View>
        <Pressable onPress={onClose} style={ms.closeBtn} hitSlop={10}>
          <Ionicons name="close" size={18} color="#94A3B8" />
        </Pressable>
      </View>
    </View>
  );

  // ── Detail view ──
  if (view === "detail") {
    return (
      <Modal visible animationType="slide" transparent onRequestClose={onClose}>
        <View style={ms.overlay}>
          <Pressable style={ms.backdrop} onPress={onClose} />
          <View style={[ms.sheet, { paddingBottom: insets.bottom + 12 }]}>
            {header}

            <ScrollView
              style={ms.scroll}
              contentContainerStyle={ms.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Task header row */}
              <View style={ms.taskHeaderRow}>
                <View style={ms.taskCheckCircle} />
                <View style={ms.taskHeaderBody}>
                  <Text style={ms.taskHeaderTitle}>{task.title}</Text>
                  <View style={ms.taskHeaderMeta}>
                    <View style={ms.dotGreen} />
                    <Text style={ms.taskHeaderMetaText}>{task.location}</Text>
                  </View>
                  {task.frequency ? (
                    <View style={ms.freqTag}>
                      <Text style={ms.freqTagText}>{task.frequency}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={ms.taskTimeCol}>
                  <Text style={ms.taskTimeVal}>{task.timeStart}</Text>
                  {task.timeEnd ? <Text style={ms.taskTimeVal}>{task.timeEnd}</Text> : null}
                  {task.estMinutes ? (
                    <Text style={ms.taskTimeMuted}>{task.estMinutes}m</Text>
                  ) : null}
                </View>
              </View>

              <View style={ms.divider} />

              {/* Priority */}
              <View style={ms.section}>
                <View style={ms.sectionLabelRow}>
                  <View style={ms.sectionDot} />
                  <Text style={ms.sectionLabel}>PRIORITY</Text>
                </View>
                <View style={[ms.priorityChip, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                  <Text style={[ms.priorityChipText, { color: cfg.text }]}>
                    {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
                  </Text>
                </View>
              </View>

              {/* Frequency */}
              <View style={ms.section}>
                <View style={ms.sectionLabelRow}>
                  <Ionicons name="calendar-outline" size={12} color="#7C8AA2" />
                  <Text style={ms.sectionLabel}>FREQUENCY</Text>
                </View>
                <Text style={ms.sectionValue}>{task.frequency ?? "—"}</Text>
              </View>

              {/* Materials */}
              {(task.materials ?? []).length > 0 ? (
                <View style={ms.section}>
                  <View style={ms.sectionLabelRow}>
                    <Ionicons name="color-fill-outline" size={12} color="#7C8AA2" />
                    <Text style={ms.sectionLabel}>MATERIALS</Text>
                  </View>
                  <View style={ms.chipRow}>
                    {task.materials!.map((m) => (
                      <View key={m} style={ms.chip}>
                        <Text style={ms.chipText}>{m}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {/* Equipment */}
              {(task.equipment ?? []).length > 0 ? (
                <View style={ms.section}>
                  <View style={ms.sectionLabelRow}>
                    <Feather name="tool" size={12} color="#7C8AA2" />
                    <Text style={ms.sectionLabel}>EQUIPMENT</Text>
                  </View>
                  <View style={ms.chipRow}>
                    {task.equipment!.map((e) => (
                      <View key={e} style={ms.chip}>
                        <Feather name="tool" size={11} color="#475569" />
                        <Text style={ms.chipText}>{e}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {/* Checker */}
              {task.checkerName ? (
                <View style={ms.section}>
                  <View style={ms.sectionLabelRow}>
                    <Ionicons name="checkmark-outline" size={12} color="#7C8AA2" />
                    <Text style={ms.sectionLabel}>CHECKER</Text>
                  </View>
                  <View style={ms.checkerRow}>
                    <View style={ms.checkerAvatar}>
                      <Text style={ms.checkerAvatarText}>{task.checkerInitials}</Text>
                    </View>
                    <View>
                      <Text style={ms.checkerName}>{task.checkerName}</Text>
                      <Text style={ms.checkerRole}>{task.checkerRole}</Text>
                    </View>
                  </View>
                </View>
              ) : null}
            </ScrollView>

            <Pressable style={ms.bottomBtn} onPress={() => setView("before-image")}>
              <Ionicons name="play-circle-outline" size={18} color="#FFFFFF" />
              <Text style={ms.bottomBtnText}>Start Task</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  // ── Before image view ──
  if (view === "before-image") {
    return (
      <Modal visible animationType="slide" transparent onRequestClose={onClose}>
        <View style={ms.overlay}>
          <Pressable style={ms.backdrop} onPress={onClose} />
          <View style={[ms.sheet, { paddingBottom: insets.bottom + 12 }]}>
            {header}

            <View style={ms.captureViewWrap}>
              <Pressable style={ms.captureBackRow} onPress={() => setView("detail")}>
                <Feather name="arrow-left" size={14} color="#64748B" />
                <Text style={ms.captureBackText}>Back to details</Text>
              </Pressable>

              <Text style={ms.captureHeading}>Before Photo</Text>
              <Text style={ms.captureSubheading}>
                Capture the area <Text style={{ fontFamily: font.family.bold }}>before</Text> starting the task
              </Text>

              <CameraCapture
                label="Tap to Take Before Photo"
                taken={beforeTaken}
                onCapture={() => setBeforeTaken((v) => !v)}
              />

              <View style={ms.captureHintRow}>
                <Ionicons name="information-circle-outline" size={14} color="#94A3B8" />
                <Text style={ms.captureHint}>
                  Make sure the area is clearly visible in the photo
                </Text>
              </View>
            </View>

            <Pressable
              style={[ms.bottomBtn, !beforeTaken && ms.bottomBtnDisabled]}
              onPress={handleSubmitBefore}
              disabled={!beforeTaken}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
              <Text style={ms.bottomBtnText}>Submit & Start Task</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  // ── Ongoing confirm view ──
  if (view === "ongoing-confirm") {
    return (
      <Modal visible animationType="slide" transparent onRequestClose={onClose}>
        <View style={ms.overlay}>
          <Pressable style={ms.backdrop} onPress={onClose} />
          <View style={[ms.sheet, { paddingBottom: insets.bottom + 12 }]}>
            {header}

            <View style={ms.captureViewWrap}>
              <View style={ms.ongoingBanner}>
                <View style={ms.ongoingBannerIcon}>
                  <Ionicons name="time-outline" size={22} color="#D97706" />
                </View>
                <View style={ms.ongoingBannerBody}>
                  <Text style={ms.ongoingBannerTitle}>Task In Progress</Text>
                  <Text style={ms.ongoingBannerSub}>
                    {task.title} · {task.location}
                  </Text>
                </View>
              </View>

              <View style={ms.ongoingTimeRow}>
                <Ionicons name="play-circle-outline" size={14} color="#10B981" />
                <Text style={ms.ongoingTimeText}>Before photo submitted · task started</Text>
              </View>

              <View style={ms.divider} />

              <Text style={ms.ongoingQuestion}>Are you done with this task?</Text>
              <Text style={ms.ongoingSubQuestion}>
                If yes, you'll be asked to take an after photo to confirm completion.
              </Text>
            </View>

            <View style={ms.ongoingActions}>
              <Pressable
                style={ms.bottomBtn}
                onPress={() => setView("after-image")}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                <Text style={ms.bottomBtnText}>Yes, Take After Photo</Text>
              </Pressable>
              <Pressable style={ms.ghostBtn} onPress={onClose}>
                <Text style={ms.ghostBtnText}>Still Working</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // ── After image view ──
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={ms.overlay}>
        <Pressable style={ms.backdrop} onPress={onClose} />
        <View style={[ms.sheet, { paddingBottom: insets.bottom + 12 }]}>
          {header}

          <View style={ms.captureViewWrap}>
            <Pressable
              style={ms.captureBackRow}
              onPress={() => setView("ongoing-confirm")}
            >
              <Feather name="arrow-left" size={14} color="#64748B" />
              <Text style={ms.captureBackText}>Back</Text>
            </Pressable>

            <Text style={ms.captureHeading}>After Photo</Text>
            <Text style={ms.captureSubheading}>
              Capture the area <Text style={{ fontFamily: font.family.bold }}>after</Text> completing the task
            </Text>

            <CameraCapture
              label="Tap to Take After Photo"
              taken={afterTaken}
              onCapture={() => setAfterTaken((v) => !v)}
            />

            <View style={ms.captureHintRow}>
              <Ionicons name="information-circle-outline" size={14} color="#94A3B8" />
              <Text style={ms.captureHint}>
                Ensure the completed work is clearly visible
              </Text>
            </View>
          </View>

          <Pressable
            style={[ms.bottomBtn, ms.bottomBtnSuccess, !afterTaken && ms.bottomBtnDisabled]}
            onPress={handleSubmitAfter}
            disabled={!afterTaken}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
            <Text style={ms.bottomBtnText}>Submit & Complete Task</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─── TaskCard ─────────────────────────────────────────────────────────────────
function TaskCard({
  task,
  isOngoing,
  isCompleted,
  onAction,
}: {
  task: TaskItem;
  isOngoing: boolean;
  isCompleted: boolean;
  onAction: (task: TaskItem, openAs: ModalView) => void;
}) {
  const effectivePriority = isCompleted ? "COMPLETED" : task.priority;
  const cfg = getPriorityConfig(effectivePriority);

  if (isOngoing) {
    return (
      <Pressable
        style={s.ongoingCard}
        onPress={() => onAction(task, "ongoing-confirm")}
      >
        <View style={s.ongoingCardHeader}>
          <View style={s.ongoingBadge}>
            <Ionicons name="time-outline" size={11} color="#D97706" style={{ marginRight: 3 }} />
            <Text style={s.ongoingBadgeText}>ONGOING</Text>
          </View>
          <Text style={s.ongoingTimeText}>
            {task.timeStart}
            {task.timeEnd ? ` - ${task.timeEnd}` : ""}
          </Text>
        </View>
        <Text style={s.ongoingTitle}>{task.title}</Text>
        <View style={s.locationRow}>
          <Ionicons name="location-outline" size={12} color="#D97706" />
          <Text style={[s.locationText, { color: "#D97706" }]}>{task.location}</Text>
        </View>
        <View style={s.ongoingFooter}>
          <Text style={s.ongoingFooterHint}>Tap to check progress or mark done</Text>
          <View style={s.ongoingArrow}>
            <Ionicons name="chevron-forward" size={14} color="#D97706" />
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={[s.taskCard, { borderLeftColor: cfg.stripe }]}>
      <View style={s.taskCardTop}>
        <View style={[s.priorityBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
          {isCompleted ? (
            <Ionicons name="checkmark-circle" size={11} color={cfg.text} style={{ marginRight: 3 }} />
          ) : null}
          <Text style={[s.priorityBadgeText, { color: cfg.text }]}>{effectivePriority}</Text>
        </View>
        {(task.timeStart || task.timeEnd) ? (
          <View style={s.timeRow}>
            <View style={s.timeDot} />
            <Text style={s.timeText}>
              {task.timeStart}
              {task.timeEnd ? ` - ${task.timeEnd}` : ""}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={s.taskCardMiddle}>
        <Text style={[s.taskTitle, isCompleted && s.taskTitleDone]}>{task.title}</Text>
        <Pressable style={s.actionBtn} onPress={() => onAction(task, "detail")}>
          <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={s.locationRow}>
        <Ionicons name="location-outline" size={12} color="#7C8AA2" />
        <Text style={s.locationText}>{task.location}</Text>
      </View>

      {task.estMinutes ? <Text style={s.estText}>EST: {task.estMinutes}M</Text> : null}
    </View>
  );
}

// ─── ShiftProgressCard ────────────────────────────────────────────────────────
function ShiftProgressCard({
  tasks,
  completedIds,
}: {
  tasks: TaskItem[];
  completedIds: Set<string>;
}) {
  const done =
    tasks.filter((t) => t.priority === "COMPLETED" || completedIds.has(t.id)).length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <View style={s.progressCard}>
      <View style={s.progressTopRow}>
        <Text style={s.progressLabel}>SHIFT PROGRESS</Text>
        <Text style={s.progressPct}>{pct}%</Text>
      </View>
      <Text style={s.progressFraction}>
        <Text style={s.progressFractionBig}>{done}</Text>
        <Text style={s.progressFractionTotal}>/{total}</Text>
      </Text>
      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: `${pct}%` as `${number}%` }]} />
      </View>
    </View>
  );
}

// ─── Filters ──────────────────────────────────────────────────────────────────
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "critical", label: "Critical" },
  { key: "high", label: "High" },
  { key: "done", label: "Done" },
];

// ─── Main screen ──────────────────────────────────────────────────────────────
export function TasksScreen() {
  const { role } = useAuth();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskItem[]>(MOCK_TASKS);
  const [ongoingTaskIds, setOngoingTaskIds] = useState<Set<string>>(new Set());
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [modalInitialView, setModalInitialView] = useState<ModalView>("detail");

  function toTaskItem(raw: any): TaskItem {
    const status = String(raw?.status ?? "").toUpperCase().replace(/\\s/g, "_");
    const priorityRaw = String(raw?.priority ?? "MEDIUM").toUpperCase();
    const priority: TaskPriority =
      status === "COMPLETED"
        ? "COMPLETED"
        : (["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(priorityRaw)
            ? (priorityRaw as TaskPriority)
            : "MEDIUM");
    return {
      id: String(raw?._id ?? raw?.id ?? ""),
      title: String(raw?.title ?? raw?.taskName ?? "Untitled Task"),
      location: String(raw?.locationFloor ?? raw?.roomNumber ?? raw?.propertyName ?? raw?.location ?? "—"),
      zone: String(raw?.category ?? raw?.departmentName ?? raw?.department ?? "—"),
      timeStart: String(raw?.startTime ?? ""),
      timeEnd: raw?.endTime ? String(raw.endTime) : undefined,
      estMinutes: raw?.timeDuration != null ? Number(raw.timeDuration) : undefined,
      priority,
      frequency: raw?.frequency ? String(raw.frequency) : undefined,
      materials: Array.isArray(raw?.materials) ? raw.materials : undefined,
      equipment: Array.isArray(raw?.equipment) ? raw.equipment : undefined,
      checkerName: raw?.checker ? String(raw.checker) : undefined,
      approver: raw?.approver ? String(raw.approver) : undefined,
    } as TaskItem;
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyTasks();
      if (Array.isArray(res) && res.length) {
        setTasks(res.map(toTaskItem));
      }
    } catch {
      // fall through to mock data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function handleTaskAction(task: TaskItem, openAs: ModalView) {
    setModalInitialView(openAs);
    setSelectedTask(task);
  }

  function handleTaskStart(taskId: string) {
    void startMyTask(taskId).catch(() => {
      void updateMyTaskStatus(taskId, "IN_PROGRESS").catch(() => {});
    });
    setOngoingTaskIds((prev) => new Set([...prev, taskId]));
  }

  function handleTaskComplete(taskId: string) {
    void submitMyTaskCompletion(taskId, { notes: "Completed from mobile task board." }).catch(
      () => {
        void updateMyTaskStatus(taskId, "COMPLETED").catch(() => {});
      },
    );
    setOngoingTaskIds((prev) => {
      const next = new Set(prev);
      next.delete(taskId);
      return next;
    });
    setCompletedTaskIds((prev) => new Set([...prev, taskId]));
  }

  function countFor(key: FilterKey) {
    if (key === "all") return tasks.length;
    if (key === "critical") return tasks.filter((t) => t.priority === "CRITICAL").length;
    if (key === "high") return tasks.filter((t) => t.priority === "HIGH").length;
    if (key === "done")
      return tasks.filter((t) => t.priority === "COMPLETED" || completedTaskIds.has(t.id)).length;
    return 0;
  }

  const filtered = tasks.filter((t) => {
    const isCompleted = t.priority === "COMPLETED" || completedTaskIds.has(t.id);
    if (filter === "critical") return t.priority === "CRITICAL" && !ongoingTaskIds.has(t.id) && !completedTaskIds.has(t.id);
    if (filter === "high") return t.priority === "HIGH" && !ongoingTaskIds.has(t.id) && !completedTaskIds.has(t.id);
    if (filter === "done") return isCompleted;
    return true;
  });

  const ongoingInView =
    filter === "all"
      ? tasks.filter((t) => ongoingTaskIds.has(t.id))
      : [];

  return (
    <>
      <RolePageLayout
        eyebrow={`${formatRoleLabel(String(role))} · Workboard`}
        title="Tasks"
        subtitle="Track action items and shift workload."
        headerCard={<ShiftProgressCard tasks={tasks} completedIds={completedTaskIds} />}
      >
        <View style={s.root}>
          {/* Filter tabs */}
          <View style={s.filterRow}>
            {FILTERS.map((f) => {
              const active = filter === f.key;
              const count = countFor(f.key);
              return (
                <Pressable
                  key={f.key}
                  onPress={() => setFilter(f.key)}
                  style={[s.filterTab, active && s.filterTabActive]}
                >
                  <Text style={[s.filterTabText, active && s.filterTabTextActive]}>
                    {f.label}
                  </Text>
                  <View style={[s.filterBadge, active && s.filterBadgeActive]}>
                    <Text style={[s.filterBadgeText, active && s.filterBadgeTextActive]}>
                      {count}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* List */}
          {loading ? (
            <View style={s.centered}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <RefreshableScrollView
              style={s.list}
              contentContainerStyle={s.listContent}
              showsVerticalScrollIndicator={false}
              onRefresh={load}
            >
              {/* Ongoing tasks pinned at top (All tab only) */}
              {ongoingInView.map((task) => (
                <TaskCard
                  key={`ongoing-${task.id}`}
                  task={task}
                  isOngoing
                  isCompleted={false}
                  onAction={handleTaskAction}
                />
              ))}

              {filtered.length === 0 && ongoingInView.length === 0 ? (
                <View style={s.emptyCard}>
                  <Text style={s.emptyTitle}>No tasks here</Text>
                  <Text style={s.emptyText}>Nothing in this category right now.</Text>
                </View>
              ) : (
                filtered
                  .filter((t) => !ongoingTaskIds.has(t.id))
                  .map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isOngoing={false}
                      isCompleted={completedTaskIds.has(task.id)}
                      onAction={handleTaskAction}
                    />
                  ))
              )}
            </RefreshableScrollView>
          )}
        </View>
      </RolePageLayout>

      <TaskDetailModal
        task={selectedTask}
        isOngoing={selectedTask ? ongoingTaskIds.has(selectedTask.id) : false}
        onClose={() => setSelectedTask(null)}
        onTaskStart={handleTaskStart}
        onTaskComplete={handleTaskComplete}
      />
    </>
  );
}

// ─── Screen styles ────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    gap: 14,
  },

  // Progress card
  progressCard: { gap: 8 },
  progressTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressLabel: {
    color: "rgba(226,233,246,0.65)",
    fontFamily: font.family.bold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  progressPct: {
    color: "#529BFF",
    fontFamily: font.family.black,
    fontSize: 18,
    lineHeight: 20,
  },
  progressFraction: { color: "#FFFFFF" },
  progressFractionBig: {
    fontFamily: font.family.black,
    fontSize: 28,
    lineHeight: 32,
    color: "#FFFFFF",
  },
  progressFractionTotal: {
    fontFamily: font.family.bold,
    fontSize: 16,
    color: "rgba(226,233,246,0.55)",
  },
  progressTrack: {
    height: 5,
    borderRadius: radii.full,
    backgroundColor: "rgba(255,255,255,0.14)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: radii.full,
    backgroundColor: "#529BFF",
  },

  // Filter tabs
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: "#EBF0F7",
  },
  filterTabActive: { backgroundColor: colors.primary },
  filterTabText: {
    color: "#5F718F",
    fontFamily: font.family.bold,
    fontSize: 12,
    lineHeight: 16,
  },
  filterTabTextActive: { color: "#FFFFFF" },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#D8E2F0",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  filterBadgeActive: { backgroundColor: "rgba(255,255,255,0.28)" },
  filterBadgeText: {
    color: "#5F718F",
    fontFamily: font.family.bold,
    fontSize: 10,
    lineHeight: 14,
  },
  filterBadgeTextActive: { color: "#FFFFFF" },

  // Ongoing card
  ongoingCard: {
    backgroundColor: "#FFFBF0",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#FDE68A",
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
    padding: 16,
    gap: 8,
  },
  ongoingCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ongoingBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  ongoingBadgeText: {
    color: "#D97706",
    fontFamily: font.family.bold,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  ongoingTimeText: {
    color: "#D97706",
    fontFamily: font.family.bold,
    fontSize: 11,
  },
  ongoingTitle: {
    color: "#162236",
    fontFamily: font.family.bold,
    fontSize: 17,
    lineHeight: 22,
  },
  ongoingFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  ongoingFooterHint: {
    color: "#D97706",
    fontFamily: font.family.medium,
    fontSize: 11,
  },
  ongoingArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },

  // Normal task card
  taskCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E7ECF4",
    borderLeftWidth: 4,
    padding: 16,
    gap: 8,
  },
  taskCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  priorityBadgeText: {
    fontFamily: font.family.bold,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  timeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4F88FF",
  },
  timeText: {
    color: "#7C8AA2",
    fontFamily: font.family.bold,
    fontSize: 11,
  },
  taskCardMiddle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  taskTitle: {
    flex: 1,
    color: "#162236",
    fontFamily: font.family.bold,
    fontSize: 17,
    lineHeight: 22,
  },
  taskTitleDone: {
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  actionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  locationText: {
    color: "#7C8AA2",
    fontFamily: font.family.medium,
    fontSize: 12,
  },
  estText: {
    color: "#94A3B8",
    fontFamily: font.family.bold,
    fontSize: 11,
    letterSpacing: 0.4,
  },

  // List
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  list: { flex: 1 },
  listContent: {
    gap: 12,
    paddingBottom: 24,
  },
  emptyCard: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7ECF4",
    padding: 20,
    gap: 8,
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: font.family.bold,
    fontSize: 17,
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: font.family.medium,
    fontSize: 13,
    lineHeight: 18,
  },
});

// ─── Modal styles ─────────────────────────────────────────────────────────────
const ms = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(10,18,32,0.52)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "90%",
    overflow: "hidden",
  },

  // Zone header bar
  zoneBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#2A3547",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  zoneBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  zoneIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  zoneName: {
    color: "#FFFFFF",
    fontFamily: font.family.bold,
    fontSize: 13,
    letterSpacing: 0.6,
  },
  zoneMeta: {
    marginTop: 2,
    color: "rgba(220,228,245,0.60)",
    fontFamily: font.family.medium,
    fontSize: 11,
  },
  zoneBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  badgeSmallText: {
    fontFamily: font.family.bold,
    fontSize: 10,
    letterSpacing: 0.4,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Scroll
  scroll: { flexShrink: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },

  // Task header row inside modal
  taskHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 16,
  },
  taskCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    marginTop: 2,
  },
  taskHeaderBody: { flex: 1, gap: 4 },
  taskHeaderTitle: {
    color: "#162236",
    fontFamily: font.family.bold,
    fontSize: 17,
    lineHeight: 22,
  },
  taskHeaderMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  taskHeaderMetaText: {
    color: "#64748B",
    fontFamily: font.family.medium,
    fontSize: 12,
  },
  freqTag: {
    alignSelf: "flex-start",
    borderRadius: radii.full,
    backgroundColor: "#EEF2F8",
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 2,
  },
  freqTagText: {
    color: "#5F718F",
    fontFamily: font.family.bold,
    fontSize: 11,
  },
  taskTimeCol: { alignItems: "flex-end", gap: 1 },
  taskTimeVal: {
    color: "#162236",
    fontFamily: font.family.bold,
    fontSize: 12,
  },
  taskTimeMuted: {
    color: "#94A3B8",
    fontFamily: font.family.medium,
    fontSize: 11,
  },

  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginBottom: 16,
  },

  // Sections
  section: { gap: 10, marginBottom: 18 },
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#94A3B8",
  },
  sectionLabel: {
    color: "#94A3B8",
    fontFamily: font.family.bold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  sectionValue: {
    color: "#334155",
    fontFamily: font.family.bold,
    fontSize: 13,
  },
  priorityChip: {
    alignSelf: "flex-start",
    borderRadius: radii.full,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  priorityChipText: {
    fontFamily: font.family.bold,
    fontSize: 13,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFD",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: {
    color: "#334155",
    fontFamily: font.family.medium,
    fontSize: 12,
  },
  checkerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#2A3547",
    alignItems: "center",
    justifyContent: "center",
  },
  checkerAvatarText: {
    color: "#FFFFFF",
    fontFamily: font.family.bold,
    fontSize: 14,
  },
  checkerName: {
    color: "#162236",
    fontFamily: font.family.bold,
    fontSize: 14,
  },
  checkerRole: {
    marginTop: 2,
    color: "#7C8AA2",
    fontFamily: font.family.medium,
    fontSize: 12,
  },

  // Capture view (before / after image)
  captureViewWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
    flexShrink: 1,
  },
  captureBackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  captureBackText: {
    color: "#64748B",
    fontFamily: font.family.medium,
    fontSize: 13,
  },
  captureHeading: {
    color: "#162236",
    fontFamily: font.family.black,
    fontSize: 20,
    lineHeight: 24,
    marginTop: 4,
  },
  captureSubheading: {
    color: "#64748B",
    fontFamily: font.family.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  cameraBox: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFD",
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 20,
  },
  cameraBoxDone: {
    borderStyle: "solid",
    borderColor: "#A7F3D0",
    backgroundColor: "#F0FDF9",
  },
  cameraIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraPlaceholderTitle: {
    color: "#475569",
    fontFamily: font.family.bold,
    fontSize: 15,
  },
  cameraPlaceholderHint: {
    color: "#94A3B8",
    fontFamily: font.family.medium,
    fontSize: 12,
  },
  cameraPreviewFace: {
    alignItems: "center",
    justifyContent: "center",
  },
  cameraPreviewLabel: {
    color: "#10B981",
    fontFamily: font.family.bold,
    fontSize: 15,
  },
  cameraRetakeHint: {
    color: "#94A3B8",
    fontFamily: font.family.medium,
    fontSize: 11,
  },
  captureHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  captureHint: {
    flex: 1,
    color: "#94A3B8",
    fontFamily: font.family.medium,
    fontSize: 11,
    lineHeight: 16,
  },

  // Ongoing confirm view
  ongoingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    backgroundColor: "#FFFBF0",
    borderWidth: 1,
    borderColor: "#FDE68A",
    padding: 14,
  },
  ongoingBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  ongoingBannerBody: { flex: 1 },
  ongoingBannerTitle: {
    color: "#D97706",
    fontFamily: font.family.bold,
    fontSize: 14,
  },
  ongoingBannerSub: {
    marginTop: 2,
    color: "#92400E",
    fontFamily: font.family.medium,
    fontSize: 12,
  },
  ongoingTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ongoingTimeText: {
    color: "#10B981",
    fontFamily: font.family.medium,
    fontSize: 12,
  },
  ongoingQuestion: {
    color: "#162236",
    fontFamily: font.family.black,
    fontSize: 20,
    lineHeight: 26,
    marginTop: 4,
  },
  ongoingSubQuestion: {
    color: "#64748B",
    fontFamily: font.family.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  ongoingActions: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
  },

  // Bottom buttons
  bottomBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 18,
    backgroundColor: colors.primary,
    paddingVertical: 16,
  },
  bottomBtnSuccess: {
    backgroundColor: "#10B981",
  },
  bottomBtnDisabled: {
    opacity: 0.45,
  },
  bottomBtnText: {
    color: "#FFFFFF",
    fontFamily: font.family.bold,
    fontSize: 15,
  },
  ghostBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingVertical: 14,
  },
  ghostBtnText: {
    color: "#64748B",
    fontFamily: font.family.bold,
    fontSize: 14,
  },
});

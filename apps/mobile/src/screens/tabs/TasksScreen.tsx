import { Feather, Ionicons } from "@expo/vector-icons";
import {
  getStaffTasks,
  uploadStaffTaskAfterPhoto,
  uploadStaffTaskBeforePhoto,
  type StaffTasksResponse,
} from "@madhuban/api";
import { colors, font, radii } from "@madhuban/theme";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RefreshableScrollView } from "../../components/RefreshableScrollView";
import { SkeletonBlock } from "../../components/SkeletonBlock";
import { useAuth } from "../../context/AuthContext";
import { RolePageLayout, formatRoleLabel } from "../../layouts/RolePageLayout";

type FilterKey = "all" | "critical" | "high" | "done";
type ModalStep = "detail" | "before" | "after";
type CaptureTarget = "before" | "after" | null;

type TaskPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "COMPLETED" | "REASSIGNED";

interface TaskItem {
  id: string;
  title: string;
  location: string;
  zone: string;
  timeStart: string;
  timeEnd?: string;
  priority: TaskPriority;
  status: string;
  approvalStatus?: string | null;
  decisionNote?: string | null;
  beforePhotoUrl?: string | null;
  afterPhotoUrl?: string | null;
  isCompleted: boolean;
}

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "critical", label: "Critical" },
  { key: "high", label: "High" },
  { key: "done", label: "Done" },
];

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

function normalizePriority(task: StaffTasksResponse["tasks"][number]): TaskPriority {
  if (task.status === "COMPLETED") return "COMPLETED";
  const priority = String(task.masterTask.priority ?? "LOW").toUpperCase();
  if (priority === "CRITICAL" || priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    return priority;
  }
  return "LOW";
}

function formatTime(value: string | null | undefined) {
  if (!value) return "";
  const [hour, minute] = value.split(":");
  if (!hour || !minute) return value;
  const date = new Date();
  date.setHours(Number(hour), Number(minute), 0, 0);
  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function mapTask(item: StaffTasksResponse["tasks"][number]): TaskItem {
  const raw = item as StaffTasksResponse["tasks"][number] & {
    beforePhotoUrl?: string | null;
    afterPhotoUrl?: string | null;
    photos?: {
      beforePhotoUrl?: string | null;
      afterPhotoUrl?: string | null;
    } | null;
  };
  const locationParts = [item.location.propertyName, item.location.floorNo ? `Floor ${item.location.floorNo}` : null].filter(Boolean);
  return {
    id: String(item.id),
    title: item.masterTask.title,
    location: locationParts.join(" · ") || "Unassigned Location",
    zone: item.masterTask.zone ?? "UNASSIGNED ZONE",
    timeStart: formatTime(item.masterTask.startTime) || "--",
    timeEnd: formatTime(item.masterTask.endTime) || undefined,
    priority: normalizePriority(item),
    status: item.status,
    approvalStatus: item.approval?.status ?? null,
    decisionNote: item.approval?.decisionNote ?? null,
    beforePhotoUrl: raw.beforePhotoUrl ?? raw.photos?.beforePhotoUrl ?? null,
    afterPhotoUrl: raw.afterPhotoUrl ?? raw.photos?.afterPhotoUrl ?? null,
    isCompleted: item.status === "COMPLETED",
  };
}

function ShiftProgressCard({
  counts,
  progress,
}: {
  counts: StaffTasksResponse["counts"] | null;
  progress: StaffTasksResponse["progress"] | null;
}) {
  const done = progress?.done ?? 0;
  const total = progress?.total ?? 0;
  const percent = progress?.percent ?? 0;

  return (
    <View style={s.progressCard}>
      <View style={s.progressTopRow}>
        <Text style={s.progressLabel}>Shift Progress</Text>
        <Text style={s.progressPct}>{percent}%</Text>
      </View>
      <Text style={s.progressFraction}>
        <Text style={s.progressFractionBig}>{done}</Text>
        <Text style={s.progressFractionTotal}> / {total}</Text>
      </Text>
      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: `${percent}%` }]} />
      </View>
      <Text style={s.progressSummary}>
        {counts?.critical ?? 0} critical · {counts?.high ?? 0} high · {counts?.done ?? 0} done
      </Text>
    </View>
  );
}

function TaskCard({
  task,
  onAction,
}: {
  task: TaskItem;
  onAction: (task: TaskItem) => void;
}) {
  const cfg = getPriorityConfig(task.priority);

  return (
    <View style={[s.taskCard, { borderLeftColor: cfg.stripe }]}>
      <View style={s.taskCardTop}>
        <View style={[s.priorityBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
          <Text style={[s.priorityBadgeText, { color: cfg.text }]}>{task.priority}</Text>
        </View>
        <View style={s.timeRow}>
          <View style={s.timeDot} />
          <Text style={s.timeText}>
            {task.timeStart}
            {task.timeEnd ? ` - ${task.timeEnd}` : ""}
          </Text>
        </View>
      </View>

      <View style={s.taskCardMiddle}>
        <Text style={[s.taskTitle, task.isCompleted && s.taskTitleDone]}>{task.title}</Text>
        <Pressable style={s.actionBtn} onPress={() => onAction(task)}>
          <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={s.locationRow}>
        <Ionicons name="location-outline" size={14} color="#7C8AA2" />
        <Text style={s.locationText}>{task.location}</Text>
      </View>

      {task.decisionNote ? (
        <View style={s.notePill}>
          <Text style={s.notePillText}>{task.decisionNote}</Text>
        </View>
      ) : null}
    </View>
  );
}

function CameraCapture({
  label,
  imageUri,
  onCapturePress,
}: {
  label: string;
  imageUri: string | null;
  onCapturePress: () => void;
}) {
  return (
    <Pressable style={[ms.cameraBox, imageUri && ms.cameraBoxDone]} onPress={onCapturePress}>
      {imageUri ? (
        <>
          <Image source={{ uri: imageUri }} style={ms.cameraPreviewImage} />
          <View style={ms.cameraPreviewShade} />
          <Ionicons name="checkmark-circle" size={44} color="#10B981" />
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

function TaskDetailModal({
  task,
  visible,
  step,
  beforeUri,
  afterUri,
  submitting,
  onStartTask,
  onOpenCamera,
  onAdvanceAfterBefore,
  onSubmitAfter,
  onClose,
}: {
  task: TaskItem | null;
  visible: boolean;
  step: ModalStep;
  beforeUri: string | null;
  afterUri: string | null;
  submitting: boolean;
  onStartTask: () => void;
  onOpenCamera: (target: CaptureTarget) => void;
  onAdvanceAfterBefore: () => void;
  onSubmitAfter: () => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();

  if (!task) return null;
  const cfg = getPriorityConfig(task.priority);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={ms.overlay}>
        <Pressable style={ms.backdrop} onPress={onClose} />
        <View style={[ms.sheet, { paddingBottom: insets.bottom + 12 }]}>
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

          <ScrollView style={ms.scroll} contentContainerStyle={ms.scrollContent}>
            {step === "detail" ? (
              <>
                <View style={ms.taskHeaderRow}>
                  <View style={ms.taskCheckCircle} />
                  <View style={ms.taskHeaderBody}>
                    <Text style={ms.taskHeaderTitle}>{task.title}</Text>
                    <View style={ms.taskHeaderMeta}>
                      <View style={ms.dotGreen} />
                      <Text style={ms.taskHeaderMetaText}>{task.location}</Text>
                    </View>
                  </View>
                </View>
                <View style={ms.divider} />
                <View style={ms.section}>
                  <View style={ms.sectionLabelRow}>
                    <View style={ms.sectionDot} />
                    <Text style={ms.sectionLabel}>STATUS</Text>
                  </View>
                  <Text style={ms.sectionValue}>{task.isCompleted ? "Completed" : "Pending"}</Text>
                </View>
                {task.decisionNote ? (
                  <View style={ms.section}>
                    <View style={ms.sectionLabelRow}>
                      <Ionicons name="alert-circle-outline" size={12} color="#7C8AA2" />
                      <Text style={ms.sectionLabel}>CHECKER NOTE</Text>
                    </View>
                    <Text style={ms.sectionValue}>{task.decisionNote}</Text>
                  </View>
                ) : null}
              </>
            ) : null}

            {step === "before" ? (
              <View style={ms.captureViewWrap}>
                <Text style={ms.captureHeading}>Before Photo</Text>
                <Text style={ms.captureSubheading}>
                  Capture the area before starting the task.
                </Text>
                <CameraCapture
                  label="Tap to Take Before Photo"
                  imageUri={beforeUri}
                  onCapturePress={() => onOpenCamera("before")}
                />
              </View>
            ) : null}

            {step === "after" ? (
              <View style={ms.captureViewWrap}>
                <Text style={ms.captureHeading}>After Photo</Text>
                <Text style={ms.captureSubheading}>
                  Capture the area after completing the task.
                </Text>
                <CameraCapture
                  label="Tap to Take After Photo"
                  imageUri={afterUri}
                  onCapturePress={() => onOpenCamera("after")}
                />
              </View>
            ) : null}
          </ScrollView>

          {step === "detail" ? (
            <Pressable style={ms.bottomBtn} onPress={onStartTask}>
              <Ionicons name="play-circle-outline" size={18} color="#FFFFFF" />
              <Text style={ms.bottomBtnText}>Start Task</Text>
            </Pressable>
          ) : null}

          {step === "before" ? (
            <Pressable
              style={[ms.bottomBtn, (!beforeUri || submitting) && ms.bottomBtnDisabled]}
              onPress={onAdvanceAfterBefore}
              disabled={!beforeUri || submitting}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
              <Text style={ms.bottomBtnText}>{submitting ? "Uploading..." : "Submit Before Photo"}</Text>
            </Pressable>
          ) : null}

          {step === "after" ? (
            <Pressable
              style={[ms.bottomBtn, (!afterUri || submitting) && ms.bottomBtnDisabled]}
              onPress={onSubmitAfter}
              disabled={!afterUri || submitting}
            >
              <Ionicons name="checkmark-done-outline" size={18} color="#FFFFFF" />
              <Text style={ms.bottomBtnText}>{submitting ? "Uploading..." : "Submit After Photo"}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

export function TasksScreen() {
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState<StaffTasksResponse | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [step, setStep] = useState<ModalStep>("detail");
  const [beforeUri, setBeforeUri] = useState<string | null>(null);
  const [afterUri, setAfterUri] = useState<string | null>(null);
  const [captureTarget, setCaptureTarget] = useState<CaptureTarget>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const insets = useSafeAreaInsets();

  const load = useCallback(async (nextFilter: FilterKey = filter) => {
    setLoading(true);
    try {
      const data = await getStaffTasks({ filter: nextFilter, limit: 50 });
      setResponse(data);
      setTasks(data.tasks.map(mapTask));
    } catch {
      setResponse(null);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load(filter);
  }, [filter, load]);

  useEffect(() => {
    setStep(
      selectedTask?.afterPhotoUrl
        ? "after"
        : selectedTask?.beforePhotoUrl
          ? "after"
          : "detail",
    );
    setBeforeUri(selectedTask?.beforePhotoUrl ?? null);
    setAfterUri(selectedTask?.afterPhotoUrl ?? null);
    setCaptureTarget(null);
    setCameraOpen(false);
    setSubmitting(false);
  }, [selectedTask?.id]);

  async function handleBeforeUpload(task: TaskItem, photoUri: string) {
    const result = await uploadStaffTaskBeforePhoto(task.id, {
      uri: photoUri,
      type: "image/jpeg",
      name: `before-${task.id}-${Date.now()}.jpg`,
    });
    const beforePhotoUrl = result.beforePhotoUrl ?? photoUri;
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id
          ? {
              ...item,
              beforePhotoUrl,
            }
          : item,
      ),
    );
    setSelectedTask((current) =>
      current && current.id === task.id
        ? {
            ...current,
            beforePhotoUrl,
          }
        : current,
    );
    setBeforeUri(beforePhotoUrl);
  }

  async function handleAfterUpload(task: TaskItem, photoUri: string) {
    const result = await uploadStaffTaskAfterPhoto(task.id, {
      uri: photoUri,
      type: "image/jpeg",
      name: `after-${task.id}-${Date.now()}.jpg`,
    });
    const afterPhotoUrl = result.afterPhotoUrl ?? photoUri;
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id
          ? {
              ...item,
              afterPhotoUrl,
            }
          : item,
      ),
    );
    setSelectedTask((current) =>
      current && current.id === task.id
        ? {
            ...current,
            afterPhotoUrl,
          }
        : current,
    );
    setAfterUri(afterPhotoUrl);
    await load(filter);
  }

  async function openCamera(target: CaptureTarget) {
    const permission = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();
    if (!permission?.granted) return;
    setCaptureTarget(target);
    setCameraOpen(true);
  }

  async function capturePhoto() {
    if (!cameraRef.current || !captureTarget) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
    if (captureTarget === "before") setBeforeUri(photo.uri);
    if (captureTarget === "after") setAfterUri(photo.uri);
    setCameraOpen(false);
    setCaptureTarget(null);
  }

  async function submitBefore() {
    if (!selectedTask || !beforeUri) return;
    setSubmitting(true);
    try {
      await handleBeforeUpload(selectedTask, beforeUri);
      setStep("after");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitAfter() {
    if (!selectedTask || !afterUri) return;
    setSubmitting(true);
    try {
      await handleAfterUpload(selectedTask, afterUri);
      setSelectedTask(null);
    } finally {
      setSubmitting(false);
    }
  }

  function countFor(key: FilterKey) {
    if (!response) return 0;
    if (key === "all") return response.counts.all;
    if (key === "critical") return response.counts.critical;
    if (key === "high") return response.counts.high;
    return response.counts.done;
  }

  return (
    <>
      <RolePageLayout
        eyebrow={`${formatRoleLabel(String(role))} · Workboard`}
        title="Tasks"
        subtitle="Track action items and shift workload."
        headerCard={<ShiftProgressCard counts={response?.counts ?? null} progress={response?.progress ?? null} />}
      >
        <View style={s.root}>
          <View style={s.filterRow}>
            {FILTERS.map((item) => {
              const active = filter === item.key;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => setFilter(item.key)}
                  style={[s.filterTab, active && s.filterTabActive]}
                >
                  <Text style={[s.filterTabText, active && s.filterTabTextActive]}>{item.label}</Text>
                  <View style={[s.filterBadge, active && s.filterBadgeActive]}>
                    <Text style={[s.filterBadgeText, active && s.filterBadgeTextActive]}>
                      {countFor(item.key)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {loading ? (
            <View style={s.listContent}>
              {[0, 1, 2].map((item) => (
                <View key={item} style={s.taskCard}>
                  <SkeletonBlock style={{ height: 18, width: 86, borderRadius: 9 }} />
                  <SkeletonBlock style={{ height: 18, width: "70%", borderRadius: 9 }} />
                  <SkeletonBlock style={{ height: 14, width: "60%", borderRadius: 7 }} />
                </View>
              ))}
            </View>
          ) : (
            <RefreshableScrollView
              style={s.list}
              contentContainerStyle={s.listContent}
              showsVerticalScrollIndicator={false}
              onRefresh={() => load(filter)}
            >
              {tasks.length === 0 ? (
                <View style={s.emptyCard}>
                  <Text style={s.emptyTitle}>No tasks here</Text>
                  <Text style={s.emptyText}>Nothing in this category right now.</Text>
                </View>
              ) : (
                tasks.map((task, index) => (
                  <TaskCard key={`${task.id}-${index}`} task={task} onAction={setSelectedTask} />
                ))
              )}
            </RefreshableScrollView>
          )}
        </View>
      </RolePageLayout>

      <Modal visible={cameraOpen} animationType="slide" onRequestClose={() => setCameraOpen(false)}>
        <View style={ms.cameraScreen}>
          <CameraView ref={cameraRef} facing="back" style={ms.cameraView} />
          <View style={[ms.cameraHeader, { paddingTop: insets.top + 12 }]}>
            <Pressable style={ms.cameraBackButton} onPress={() => setCameraOpen(false)}>
              <Feather name="x" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
          <View style={[ms.cameraFooter, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <Pressable style={ms.captureButtonOuter} onPress={() => void capturePhoto()}>
              <View style={ms.captureButtonInner} />
            </Pressable>
          </View>
        </View>
      </Modal>

      <TaskDetailModal
        task={selectedTask}
        visible={!!selectedTask && !cameraOpen}
        step={step}
        beforeUri={beforeUri}
        afterUri={afterUri}
        submitting={submitting}
        onStartTask={() => setStep("before")}
        onOpenCamera={(target) => void openCamera(target)}
        onAdvanceAfterBefore={() => void submitBefore()}
        onSubmitAfter={() => void submitAfter()}
        onClose={() => setSelectedTask(null)}
      />
    </>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    gap: 14,
  },
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
  progressSummary: {
    color: "rgba(226,233,246,0.7)",
    fontFamily: font.family.medium,
    fontSize: 12,
  },
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
  list: { flex: 1 },
  listContent: {
    gap: 12,
    paddingBottom: 24,
  },
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
  notePill: {
    alignSelf: "flex-start",
    backgroundColor: "#FFF8E6",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  notePillText: {
    color: "#D97706",
    fontFamily: font.family.medium,
    fontSize: 12,
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
  scroll: { flexShrink: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
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
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginBottom: 16,
  },
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
  captureViewWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
    flexShrink: 1,
  },
  captureHeading: {
    color: "#162236",
    fontFamily: font.family.black,
    fontSize: 20,
    lineHeight: 24,
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
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 20,
    overflow: "hidden",
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
  cameraPreviewImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  cameraPreviewShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.22)",
  },
  cameraPreviewLabel: {
    color: "#10B981",
    fontFamily: font.family.bold,
    fontSize: 15,
  },
  cameraRetakeHint: {
    color: "#FFFFFF",
    fontFamily: font.family.medium,
    fontSize: 11,
  },
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
  bottomBtnDisabled: {
    opacity: 0.45,
  },
  bottomBtnText: {
    color: "#FFFFFF",
    fontFamily: font.family.bold,
    fontSize: 15,
  },
  cameraScreen: {
    flex: 1,
    backgroundColor: "#000000",
  },
  cameraView: {
    flex: 1,
  },
  cameraHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    alignItems: "flex-end",
  },
  cameraBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.42)",
  },
  cameraFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
  },
  captureButtonOuter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 5,
    borderColor: "rgba(255,255,255,0.78)",
    alignItems: "center",
    justifyContent: "center",
  },
  captureButtonInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#FFFFFF",
  },
});

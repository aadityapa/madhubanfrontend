import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  getManagerTasks,
  getSupervisorReviewDetail,
  getSupervisorReviews,
  submitSupervisorReviewDecision,
  type ManagerTasksResponse,
  type SupervisorReviewDetailResponse,
  type SupervisorReviewsResponse,
} from "@madhuban/api";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { font, radii } from "@madhuban/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RefreshableScrollView } from "../../components/RefreshableScrollView";
import { SkeletonBlock } from "../../components/SkeletonBlock";
import { useAuth } from "../../context/AuthContext";

const TOP_FILTERS = ["ALL", "BY ZONE", "BY FUNCTION", "BY MAKER"] as const;
const STATUS_FILTERS = ["All", "Needs Review", "Sent Back", "Approved"] as const;
const SEND_BACK_REASONS = [
  "Dust on surface",
  "Floor not mopped",
  "Stains visible",
  "Missing supplies",
  "Trash not cleared",
] as const;

type TaskTone = "red" | "orange" | "green" | "gray";

interface ReviewTask {
  id: string;
  dailyTaskId?: number;
  priority: string;
  floor: string;
  title: string;
  assigneeInitials: string;
  assigneeName: string;
  time: string;
  status: "Needs Review" | "Sent Back" | "Approved" | "Pending";
  statusNote: string;
  tone: TaskTone;
  label: string;
  area: string;
  location: string;
  slot: string;
  beforeTime: string | null;
  afterTime: string | null;
  issueTime: string;
  beforePhotoUrl?: string | null;
  afterPhotoUrl?: string | null;
}

const REVIEW_TASKS: ReviewTask[] = [
  {
    id: "vip-lounge",
    priority: "CRITICAL",
    floor: "Floor 3",
    title: "VIP Lounge Deep Clean",
    assigneeInitials: "RA",
    assigneeName: "Rahul D.",
    time: "10:45 AM",
    status: "Needs Review",
    statusNote: "10m overdue",
    tone: "red" as const,
    label: "5 tasks",
    area: "Floor 3",
    location: "AMTP, Baner, Pune",
    slot: "8:10 - 8:30",
    beforeTime: "10:15 AM",
    afterTime: "10:35 AM",
    issueTime: "03:52 PM",
  },
  {
    id: "lobby-glass",
    priority: "HIGH",
    floor: "Ground Floor",
    title: "Lobby Glass Cleaning",
    assigneeInitials: "RA",
    assigneeName: "Rahul D.",
    time: "11:30 AM",
    status: "Needs Review",
    statusNote: "Due in 5m",
    tone: "orange" as const,
    label: "3 tasks",
    area: "Ground Floor",
    location: "AMTP, Baner, Pune",
    slot: "11:00 - 11:30",
    beforeTime: "11:05 AM",
    afterTime: "11:28 AM",
    issueTime: "04:05 PM",
  },
  {
    id: "washroom-two",
    priority: "HIGH",
    floor: "Floor 1",
    title: "Washroom #2 Cleaning",
    assigneeInitials: "AM",
    assigneeName: "Amit K.",
    time: "10:30 AM",
    status: "Sent Back",
    statusNote: "Waiting on maker",
    tone: "orange" as const,
    label: "5 tasks",
    area: "Floor 1",
    location: "AMTP, Baner, Pune",
    slot: "10:00 - 10:30",
    beforeTime: "10:02 AM",
    afterTime: null,
    issueTime: "03:20 PM",
  },
  {
    id: "ceo-cabin",
    priority: "CRITICAL",
    floor: "Floor 3",
    title: "CEO Cabin Prep",
    assigneeInitials: "RA",
    assigneeName: "Ravi S.",
    time: "09:00 AM",
    status: "Approved",
    statusNote: "Checked",
    tone: "green" as const,
    label: "2 tasks",
    area: "Floor 3",
    location: "AMTP, Baner, Pune",
    slot: "8:30 - 9:00",
    beforeTime: "08:35 AM",
    afterTime: "08:58 AM",
    issueTime: "02:42 PM",
  },
  {
    id: "parking",
    priority: "MEDIUM",
    floor: "Basement",
    title: "Parking Sweeping",
    assigneeInitials: "PR",
    assigneeName: "Prakash",
    time: "12:00 PM",
    status: "Pending",
    statusNote: "Not Started",
    tone: "gray" as const,
    label: "4 tasks",
    area: "Basement",
    location: "AMTP, Baner, Pune",
    slot: "11:30 - 12:00",
    beforeTime: "11:32 AM",
    afterTime: null,
    issueTime: "04:20 PM",
  },
  {
    id: "conference",
    priority: "MEDIUM",
    floor: "Floor 2",
    title: "Conference Room Setup",
    assigneeInitials: "RA",
    assigneeName: "Rahul D.",
    time: "11:15 AM",
    status: "Needs Review",
    statusNote: "Just Finished",
    tone: "orange" as const,
    label: "4 tasks",
    area: "Floor 2",
    location: "AMTP, Baner, Pune",
    slot: "10:45 - 11:15",
    beforeTime: "10:46 AM",
    afterTime: "11:12 AM",
    issueTime: "03:40 PM",
  },
] as const;
type ReviewDecision = "approve" | "send-back" | null;

function formatTime(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function toUiStatus(value: string): ReviewTask["status"] {
  switch (value) {
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Sent Back";
    case "PENDING":
      return "Needs Review";
    default:
      return "Pending";
  }
}

function toTone(status: ReviewTask["status"], overdueLabel?: string | null): TaskTone {
  if (status === "Approved") return "green";
  if (status === "Sent Back") return "orange";
  if (status === "Needs Review" && overdueLabel?.toLowerCase().includes("overdue")) return "red";
  if (status === "Needs Review") return "orange";
  return "gray";
}

function mapReviewsData(data: SupervisorReviewsResponse | null): ReviewTask[] {
  if (!data) return [...REVIEW_TASKS];
  return data.items.map((item) => {
    const status = toUiStatus(item.approvalStatus);
    const floor = item.zone.floorNo ? `Floor ${item.zone.floorNo}` : item.zone.propertyName;
    return {
      id: String(item.dailyTaskId),
      dailyTaskId: item.dailyTaskId,
      priority: item.task.priority,
      floor,
      title: item.task.title,
      assigneeInitials: item.maker.initials,
      assigneeName: item.maker.name,
      time: formatTime(item.submittedAt) ?? "--",
      status,
      statusNote: item.overdueLabel ?? (status === "Approved" ? "Checked" : status === "Sent Back" ? "Waiting on maker" : "Needs attention"),
      tone: toTone(status, item.overdueLabel),
      label: `${item.zone.zoneName}`,
      area: item.zone.zoneName,
      location: `${item.zone.propertyName}${item.zone.floorNo ? `, Floor ${item.zone.floorNo}` : ""}`,
      slot: `${item.task.startTime ?? "--"} - ${item.task.endTime ?? "--"}`,
      beforeTime: formatTime(item.submittedAt),
      afterTime: formatTime(item.submittedAt),
      issueTime: formatTime(item.submittedAt) ?? "--",
      beforePhotoUrl: item.photos.beforePhotoUrl,
      afterPhotoUrl: item.photos.afterPhotoUrl,
    };
  });
}

function getUpdatedTask(task: ReviewTask, decision: Exclude<ReviewDecision, null>): ReviewTask {
  if (decision === "approve") {
    return {
      ...task,
      status: "Approved",
      statusNote: "Checked just now",
      tone: "green",
      afterTime: task.afterTime ?? "Just now",
    };
  }

  return {
    ...task,
    status: "Sent Back",
    statusNote: "Waiting on maker",
    tone: "orange",
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function readNested(
  record: Record<string, unknown> | null,
  path: string[],
): unknown {
  let current: unknown = record;
  for (const key of path) {
    current = asRecord(current)?.[key];
  }
  return current;
}

function readString(record: Record<string, unknown> | null, paths: string[][], fallback = ""): string {
  for (const path of paths) {
    const value = readNested(record, path);
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }
  return fallback;
}

function readNumber(record: Record<string, unknown> | null, paths: string[][]): number | null {
  for (const path of paths) {
    const value = readNested(record, path);
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

function mapManagerStatus(value: string): ReviewTask["status"] {
  const normalized = value.trim().toUpperCase();
  if (normalized === "COMPLETED" || normalized === "APPROVED") return "Approved";
  if (normalized === "REJECTED" || normalized === "SENT_BACK") return "Sent Back";
  if (normalized === "IN_PROGRESS" || normalized === "PENDING_REVIEW") return "Needs Review";
  return "Pending";
}

function mapManagerTasksData(data: ManagerTasksResponse | null): ReviewTask[] {
  if (!data) return [...REVIEW_TASKS];
  return data.tasks.map((item, index) => {
    const record = asRecord(item);
    const priority = readString(
      record,
      [["priority"], ["task", "priority"], ["masterTask", "priority"], ["approval", "priority"]],
      "MEDIUM",
    );
    const title = readString(
      record,
      [["title"], ["taskTitle"], ["task", "title"], ["masterTask", "title"]],
      `Task ${index + 1}`,
    );
    const zoneName = readString(
      record,
      [["zoneName"], ["zone", "zoneName"], ["location", "zoneName"], ["masterTask", "zone"]],
      "Unassigned Zone",
    );
    const propertyName = readString(
      record,
      [["propertyName"], ["zone", "propertyName"], ["location", "propertyName"]],
      "",
    );
    const floorNo = readString(
      record,
      [["floorNo"], ["zone", "floorNo"], ["location", "floorNo"]],
      "",
    );
    const assigneeName = readString(
      record,
      [["staffName"], ["assigneeName"], ["staff", "name"], ["maker", "name"], ["supervisor", "name"]],
      "Unassigned",
    );
    const assigneeInitials = readString(
      record,
      [["staffInitials"], ["assigneeInitials"], ["staff", "initials"], ["maker", "initials"]],
      assigneeName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "NA",
    );
    const rawStatus = readString(
      record,
      [["approvalStatus"], ["status"], ["dailyTask", "status"], ["approval", "status"]],
      "PENDING",
    );
    const status = mapManagerStatus(rawStatus);
    const issueAt = readString(
      record,
      [["submittedAt"], ["completedAt"], ["updatedAt"], ["createdAt"]],
      "",
    );
    const startTime = readString(
      record,
      [["startTime"], ["task", "startTime"], ["masterTask", "startTime"]],
      "--",
    );
    const endTime = readString(
      record,
      [["endTime"], ["task", "endTime"], ["masterTask", "endTime"]],
      "--",
    );
    const beforePhotoUrl = readString(
      record,
      [["beforePhotoUrl"], ["photos", "beforePhotoUrl"], ["approval", "beforePhotoUrl"]],
      "",
    );
    const afterPhotoUrl = readString(
      record,
      [["afterPhotoUrl"], ["photos", "afterPhotoUrl"], ["approval", "afterPhotoUrl"]],
      "",
    );
    const decisionNote = readString(
      record,
      [["decisionNote"], ["approval", "decisionNote"], ["note"]],
      "",
    );
    const id = readString(record, [["id"], ["dailyTaskId"], ["taskId"]], String(index + 1));
    const dailyTaskId = readNumber(record, [["dailyTaskId"], ["id"], ["taskId"]]) ?? undefined;

    return {
      id,
      dailyTaskId,
      priority,
      floor: floorNo ? `Floor ${floorNo}` : propertyName || zoneName,
      title,
      assigneeInitials,
      assigneeName,
      time: formatTime(issueAt) ?? "--",
      status,
      statusNote:
        decisionNote ||
        (status === "Approved"
          ? "Checked"
          : status === "Sent Back"
            ? "Returned"
            : status === "Needs Review"
              ? "Needs attention"
              : "Pending"),
      tone: toTone(status),
      label: zoneName,
      area: zoneName,
      location: [propertyName, floorNo ? `Floor ${floorNo}` : null].filter(Boolean).join(", ") || zoneName,
      slot: `${startTime} - ${endTime}`,
      beforeTime: formatTime(readString(record, [["startedAt"], ["dailyTask", "startedAt"], ["submittedAt"]], "")),
      afterTime: formatTime(readString(record, [["completedAt"], ["dailyTask", "completedAt"], ["submittedAt"]], "")),
      issueTime: formatTime(issueAt) ?? "--",
      beforePhotoUrl: beforePhotoUrl || null,
      afterPhotoUrl: afterPhotoUrl || null,
    };
  });
}

function EvidenceCard({
  label,
  time,
  variant,
  missing = false,
  imageUrl,
}: {
  label: string;
  time: string | null;
  variant: "before" | "after";
  missing?: boolean;
  imageUrl?: string | null;
}) {
  const isBefore = variant === "before";
  const content = (
    <>
      <View
        style={[
          styles.evidenceGlow,
          isBefore ? styles.evidenceGlowBefore : styles.evidenceGlowAfter,
          missing && styles.evidenceGlowMissing,
        ]}
      />
      <MaterialCommunityIcons
        name={missing ? "alert-circle-outline" : isBefore ? "camera-outline" : "check"}
        size={22}
        color={missing ? "#FF5C5C" : isBefore ? "#2D67FF" : "#11C98A"}
      />
      <Text
        style={[
          styles.evidenceLabel,
          missing
            ? styles.evidenceLabelMissing
            : isBefore
              ? styles.evidenceLabelBefore
              : styles.evidenceLabelAfter,
        ]}
      >
        {missing ? "MISSING" : label}
      </Text>
      <Text style={styles.evidenceTime}>{time ?? "--"}</Text>
    </>
  );

  return (
    <View style={styles.evidenceCard}>
      {imageUrl && !missing ? (
        <ImageBackground
          source={{ uri: imageUrl }}
          imageStyle={styles.evidenceImage}
          style={[styles.evidencePreview, styles.evidencePreviewFilled]}
        >
          <View style={styles.evidenceOverlay}>{content}</View>
        </ImageBackground>
      ) : (
        <View
          style={[
            styles.evidencePreview,
            missing ? styles.evidencePreviewMissing : styles.evidencePreviewFilled,
          ]}
        >
          {content}
        </View>
      )}
    </View>
  );
}

function ReviewTaskModal({
  task,
  loading,
  actionsEnabled,
  decision,
  comment,
  selectedReasons,
  onDecisionChange,
  onCommentChange,
  onToggleReason,
  onConfirm,
  onClose,
}: {
  task: ReviewTask | null;
  loading: boolean;
  actionsEnabled: boolean;
  decision: ReviewDecision;
  comment: string;
  selectedReasons: string[];
  onDecisionChange: (value: Exclude<ReviewDecision, null>) => void;
  onCommentChange: (value: string) => void;
  onToggleReason: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();

  if (!task) return null;

  const sendBack = decision === "send-back";
  const approve = decision === "approve";
  const confirmDisabled = !actionsEnabled || (sendBack ? selectedReasons.length === 0 : !approve);

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
          <View style={styles.modalHeaderRow}>
            <View>
              <Text style={styles.modalTitle}>Review Task</Text>
              <Text style={styles.modalSubtitle}>{task.title}</Text>
            </View>
            <Pressable style={styles.modalCloseButton} onPress={onClose}>
              <Ionicons name="close" size={18} color="#8897AE" />
            </Pressable>
          </View>

          <View style={styles.reviewTaskCard}>
            <View style={styles.reviewTaskTop}>
              <View style={styles.reviewTaskIcon}>
                <Ionicons name="business-outline" size={18} color="#7D90B0" />
              </View>
              <View style={styles.reviewTaskInfo}>
                <Text style={styles.reviewTaskName}>{task.title.toUpperCase()}</Text>
                <Text style={styles.reviewTaskMeta}>
                  {task.slot} • {task.floor} • {task.status}
                </Text>
              </View>
              <View style={styles.reviewTaskBadges}>
                <View style={styles.reviewPriorityBadge}>
                  <Text style={styles.reviewPriorityText}>{task.priority}</Text>
                </View>
                <View style={styles.reviewCountBadge}>
                  <Text style={styles.reviewCountText}>{task.label}</Text>
                </View>
              </View>
            </View>

            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>Photo Evidence</Text>
              <View style={styles.evidenceRow}>
                <EvidenceCard
                  label="BEFORE"
                  time={task.beforeTime}
                  variant="before"
                  imageUrl={task.beforePhotoUrl}
                />
                <EvidenceCard
                  label="AFTER"
                  time={task.afterTime}
                  variant="after"
                  missing={!task.afterTime}
                  imageUrl={task.afterPhotoUrl}
                />
              </View>
            </View>

            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color="#FF4A8D" />
              <Text style={styles.locationText}>
                {task.location} • {task.issueTime}
              </Text>
            </View>
          </View>

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>Checker Action</Text>
            <View style={styles.decisionRow}>
              <Pressable
                style={[
                  styles.decisionButton,
                  styles.approveButton,
                  approve && styles.decisionButtonApproveActive,
                ]}
                onPress={() => actionsEnabled && onDecisionChange("approve")}
                disabled={!actionsEnabled}
              >
                <Ionicons
                  name="checkmark"
                  size={18}
                  color={approve ? "#FFFFFF" : "#73839C"}
                />
                <Text
                  style={[
                    styles.decisionButtonText,
                    approve && styles.decisionButtonTextActive,
                  ]}
                >
                  Approve
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.decisionButton,
                  styles.sendBackButton,
                  sendBack && styles.decisionButtonSendBackActive,
                ]}
                onPress={() => actionsEnabled && onDecisionChange("send-back")}
                disabled={!actionsEnabled}
              >
                <Ionicons
                  name="return-up-back-outline"
                  size={17}
                  color={sendBack ? "#FFFFFF" : "#73839C"}
                />
                <Text
                  style={[
                    styles.decisionButtonText,
                    sendBack && styles.decisionButtonTextActive,
                  ]}
                >
                  Send Back
                </Text>
              </Pressable>
            </View>
          </View>

          {sendBack && actionsEnabled ? (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>Select Reason</Text>
              <View style={styles.reasonWrap}>
                {SEND_BACK_REASONS.map((reason) => {
                  const active = selectedReasons.includes(reason);
                  return (
                    <Pressable
                      key={reason}
                      style={[styles.reasonChip, active && styles.reasonChipActive]}
                      onPress={() => onToggleReason(reason)}
                    >
                      <Text style={[styles.reasonChipText, active && styles.reasonChipTextActive]}>
                        {reason}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>Checker Comment</Text>
            {loading ? (
              <SkeletonBlock style={{ minHeight: 108, borderRadius: 16 }} />
            ) : (
              <TextInput
                value={comment}
                onChangeText={onCommentChange}
                multiline
                placeholder="Add your observation or instructions for the maker..."
                placeholderTextColor="#9AA8BC"
                style={styles.commentInput}
                textAlignVertical="top"
                editable={actionsEnabled}
              />
            )}
          </View>

          <Pressable
            style={[
              styles.confirmButton,
              sendBack ? styles.confirmButtonSendBack : styles.confirmButtonApprove,
              confirmDisabled && styles.confirmButtonDisabled,
            ]}
            disabled={confirmDisabled}
            onPress={onConfirm}
          >
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
            <Text style={styles.confirmButtonText}>
              {sendBack ? "Confirm Send Back To Maker" : "Confirm Approval"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export function SupervisorTasksScreen() {
  const { role } = useAuth();
  const insets = useSafeAreaInsets();
  const normalizedRole = String(role ?? "").trim().toLowerCase();
  const isSupervisor = normalizedRole === "supervisor";
  const isManager = normalizedRole === "manager";
  const supportsTaskFeed = isSupervisor || isManager;
  const [selectedTopFilter, setSelectedTopFilter] =
    useState<(typeof TOP_FILTERS)[number]>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<(typeof STATUS_FILTERS)[number]>("All");
  const [search, setSearch] = useState("");
  const [reviewData, setReviewData] = useState<SupervisorReviewsResponse | null>(null);
  const [managerTaskData, setManagerTaskData] = useState<ManagerTasksResponse | null>(null);
  const [tasksState, setTasksState] = useState<ReviewTask[]>([...REVIEW_TASKS]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<SupervisorReviewDetailResponse | null>(null);
  const [decision, setDecision] = useState<ReviewDecision>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(supportsTaskFeed);
  const [modalLoading, setModalLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = useCallback(async () => {
    if (!supportsTaskFeed) return;
    if (isSupervisor) {
      const status =
        selectedStatusFilter === "All"
          ? "all"
          : selectedStatusFilter === "Needs Review"
            ? "needs_review"
            : selectedStatusFilter === "Sent Back"
              ? "sent_back"
              : "approved";
      const data = await getSupervisorReviews({
        status,
        q: search.trim() || undefined,
        limit: 20,
      });
      setReviewData(data);
      setManagerTaskData(null);
      setTasksState(mapReviewsData(data));
      return;
    }

    const filter =
      selectedStatusFilter === "Needs Review"
        ? "critical"
        : selectedStatusFilter === "Sent Back"
          ? "high"
          : selectedStatusFilter === "Approved"
            ? "done"
            : "all";
    const data = await getManagerTasks({
      filter,
      limit: 20,
    });
    setManagerTaskData(data);
    setReviewData(null);
    setTasksState(mapManagerTasksData(data));
  }, [isSupervisor, search, selectedStatusFilter, supportsTaskFeed]);

  useEffect(() => {
    let active = true;
    if (!supportsTaskFeed) {
      setLoading(false);
      return;
    }
    setLoading(true);
    loadReviews()
      .catch(() => {
        if (active) {
          setReviewData(null);
          setManagerTaskData(null);
          setTasksState([...REVIEW_TASKS]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadReviews, supportsTaskFeed]);

  const tasks = useMemo(
    () =>
      isSupervisor
        ? tasksState
        : tasksState.filter((task) =>
            selectedStatusFilter === "All" ? true : task.status === selectedStatusFilter,
          ),
    [isSupervisor, selectedStatusFilter, tasksState],
  );

  const selectedTask = useMemo(() => {
    const base = tasksState.find((task) => task.id === selectedTaskId) ?? null;
    if (!base || !selectedTaskDetail) return base;
    return {
      ...base,
      priority: selectedTaskDetail.task.priority,
      floor: selectedTaskDetail.zone.floorNo
        ? `Floor ${selectedTaskDetail.zone.floorNo}`
        : selectedTaskDetail.zone.propertyName,
      title: selectedTaskDetail.task.title,
      assigneeInitials: selectedTaskDetail.maker.initials,
      assigneeName: selectedTaskDetail.maker.name,
      slot: `${selectedTaskDetail.task.startTime ?? "--"} - ${selectedTaskDetail.task.endTime ?? "--"}`,
      location: `${selectedTaskDetail.zone.propertyName}${selectedTaskDetail.zone.floorNo ? `, Floor ${selectedTaskDetail.zone.floorNo}` : ""}`,
      beforeTime: formatTime(selectedTaskDetail.dailyTask.startedAt),
      afterTime: formatTime(selectedTaskDetail.dailyTask.completedAt),
      beforePhotoUrl: selectedTaskDetail.photos.beforePhotoUrl,
      afterPhotoUrl: selectedTaskDetail.photos.afterPhotoUrl,
      issueTime: formatTime(selectedTaskDetail.approval.submittedAt) ?? base.issueTime,
    };
  }, [selectedTaskDetail, selectedTaskId, tasksState]);

  async function openTask(task: ReviewTask) {
    setSelectedTaskId(task.id);
    setComment("");
    setSelectedReasons([]);
    setDecision(task.status === "Sent Back" ? "send-back" : task.status === "Approved" ? "approve" : null);
    setSelectedTaskDetail(null);
    if (isSupervisor && task.dailyTaskId) {
      setModalLoading(true);
      try {
        const detail = await getSupervisorReviewDetail(task.dailyTaskId);
        setSelectedTaskDetail(detail);
      } finally {
        setModalLoading(false);
      }
    }
  }

  function closeTaskModal() {
    setSelectedTaskId(null);
    setSelectedTaskDetail(null);
    setDecision(null);
    setSelectedReasons([]);
    setComment("");
  }

  function toggleReason(reason: string) {
    setSelectedReasons((current) =>
      current.includes(reason) ? current.filter((value) => value !== reason) : [...current, reason],
    );
  }

  async function confirmReview() {
    if (!selectedTask || !decision || !isSupervisor) return;

    setSubmitting(true);
    try {
      if (selectedTask.dailyTaskId) {
        await submitSupervisorReviewDecision(selectedTask.dailyTaskId, {
          action: decision === "approve" ? "approve" : "send_back",
          comment: comment.trim() || undefined,
        });
      }

    const updatedTask = getUpdatedTask(selectedTask, decision);
    setTasksState((current) =>
      current.map((task) => (task.id === selectedTask.id ? updatedTask : task)),
    );
      setToastMessage(decision === "approve" ? "Task Approved!" : "Task Sent Back!");
      closeTaskModal();
      await loadReviews().catch(() => {});
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={[styles.hero, { paddingTop: insets.top + 10 }]}>
        <View style={styles.heroTopRow}>
          <View>
            <Text style={styles.heroTitle}>Reviews</Text>
            <Text style={styles.heroSubtitle}>
              {isSupervisor
                ? reviewData
                  ? `${reviewData.counts.needsReview} pending checks`
                  : "12 pending checks"
                : managerTaskData
                  ? `${managerTaskData.pagination.total} listed tasks`
                  : "Task feed"}
            </Text>
          </View>
          <Pressable style={styles.heroIconButton}>
            <Ionicons name="notifications-outline" size={18} color="#EFF4FF" />
            <View style={styles.heroNotificationDot} />
          </Pressable>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchField}>
            <Feather name="search" size={16} color="#8C9AB3" />
            <TextInput
              placeholder="Search task, zone, maker..."
              placeholderTextColor="#7D8BA5"
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <Pressable style={styles.filterButton}>
            <Ionicons name="filter-outline" size={18} color="#E6ECF8" />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.topFiltersRow}>
            {TOP_FILTERS.map((filter) => {
              const active = filter === selectedTopFilter;
              return (
                <Pressable
                  key={filter}
                  onPress={() => setSelectedTopFilter(filter)}
                  style={[styles.topFilterChip, active && styles.topFilterChipActive]}
                >
                  <Text style={[styles.topFilterText, active && styles.topFilterTextActive]}>
                    {filter}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <View style={styles.body}>
        <RefreshableScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          onRefresh={loadReviews}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.statusFilterRow}>
              {STATUS_FILTERS.map((filter) => {
                const active = filter === selectedStatusFilter;
                return (
                  <Pressable
                    key={filter}
                    onPress={() => setSelectedStatusFilter(filter)}
                  style={[
                    styles.statusChip,
                    filter === "All"
                      ? styles.statusAll
                      : filter === "Needs Review"
                        ? styles.statusNeedsReview
                        : filter === "Sent Back"
                          ? styles.statusSentBack
                          : styles.statusApproved,
                    active && styles.statusChipActive,
                  ]}
                  >
                    <Text style={[styles.statusChipText, active && styles.statusChipTextActive]}>
                      {filter}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {loading ? (
            Array.from({ length: 4 }, (_, index) => (
              <View key={index} style={styles.cardWrap}>
                <View style={[styles.cardAccent, styles.cardAccentGray]} />
                <View style={styles.card}>
                  <View style={styles.cardMain}>
                    <SkeletonBlock style={{ width: 82, height: 20, borderRadius: 8 }} />
                    <SkeletonBlock style={{ width: "84%", height: 18, borderRadius: 8 }} />
                    <SkeletonBlock style={{ width: 120, height: 14, borderRadius: 7 }} />
                  </View>
                  <View style={styles.cardAside}>
                    <SkeletonBlock style={{ width: 54, height: 12, borderRadius: 6 }} />
                    <SkeletonBlock style={{ width: 68, height: 14, borderRadius: 7 }} />
                    <SkeletonBlock style={{ width: 34, height: 34, borderRadius: 17 }} />
                  </View>
                </View>
              </View>
            ))
          ) : tasks.map((task) => (
            <Pressable key={task.id} style={styles.cardWrap} onPress={() => openTask(task)}>
              <View
                style={[
                  styles.cardAccent,
                  task.tone === "red"
                    ? styles.cardAccentRed
                    : task.tone === "orange"
                      ? styles.cardAccentOrange
                      : task.tone === "green"
                        ? styles.cardAccentGreen
                        : styles.cardAccentGray,
                ]}
              />
              <View style={styles.card}>
                <View style={styles.cardMain}>
                  <View style={styles.cardMetaRow}>
                    <View style={styles.priorityPill}>
                      <Text style={styles.priorityPillText}>{task.priority}</Text>
                    </View>
                    <View style={styles.floorRow}>
                      <Ionicons name="location-outline" size={11} color="#9AA7BD" />
                      <Text style={styles.floorText}>{task.floor}</Text>
                    </View>
                  </View>

                  <Text style={styles.cardTitle}>{task.title}</Text>

                  <View style={styles.assigneeRow}>
                    <View style={styles.assigneeBadge}>
                      <Text style={styles.assigneeBadgeText}>{task.assigneeInitials}</Text>
                    </View>
                    <Text style={styles.assigneeName}>{task.assigneeName}</Text>
                  </View>
                </View>

                <View style={styles.cardAside}>
                  <Text style={styles.cardTime}>{task.time}</Text>
                  <Text
                    style={[
                      styles.cardStatus,
                      task.tone === "red"
                        ? styles.cardStatusRed
                        : task.tone === "orange"
                          ? styles.cardStatusOrange
                          : task.tone === "green"
                            ? styles.cardStatusGreen
                            : styles.cardStatusGray,
                    ]}
                  >
                    {task.status}
                  </Text>
                  <Text
                    style={[
                      styles.cardStatusNote,
                      task.tone === "red"
                        ? styles.cardStatusRed
                        : task.tone === "orange"
                          ? styles.cardStatusOrange
                          : task.tone === "green"
                            ? styles.cardStatusGreen
                            : styles.cardStatusGray,
                    ]}
                  >
                    {task.statusNote}
                  </Text>

                  <Pressable style={styles.expandButton} onPress={() => void openTask(task)}>
                    <Ionicons name="chevron-down" size={18} color="#7D90B0" />
                  </Pressable>
                </View>
              </View>
            </Pressable>
          ))}
        </RefreshableScrollView>
      </View>

      <ReviewTaskModal
        task={selectedTask}
        loading={modalLoading || submitting}
        actionsEnabled={isSupervisor}
        decision={decision}
        comment={comment}
        selectedReasons={selectedReasons}
        onDecisionChange={setDecision}
        onCommentChange={setComment}
        onToggleReason={toggleReason}
        onConfirm={confirmReview}
        onClose={closeTaskModal}
      />

      {toastMessage ? (
        <View style={[styles.toastWrap, { bottom: insets.bottom + 88 }]}>
          <View style={styles.toastCard}>
            <Ionicons
              name={toastMessage.includes("Approved") ? "checkmark-circle-outline" : "return-up-back-outline"}
              size={18}
              color={toastMessage.includes("Approved") ? "#10B981" : "#FF7A00"}
            />
            <Text style={styles.toastText}>{toastMessage}</Text>
            <Pressable onPress={() => setToastMessage(null)}>
              <Ionicons name="close" size={16} color="#8A98AF" />
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#EDF0F5",
  },
  hero: {
    backgroundColor: "#1E2C43",
    paddingHorizontal: 18,
    paddingBottom: 18,
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
    marginTop: 2,
    color: "#8FB8FF",
    fontFamily: font.family.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  heroIconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  heroNotificationDot: {
    position: "absolute",
    top: 9,
    right: 10,
    width: 6,
    height: 6,
    borderRadius: radii.full,
    backgroundColor: "#FF5B6D",
  },
  searchRow: {
    marginTop: 18,
    flexDirection: "row",
    gap: 10,
  },
  searchField: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#31415B",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  searchInput: {
    flex: 1,
    color: "#F3F6FC",
    fontFamily: font.family.medium,
    fontSize: 14,
    paddingVertical: 0,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#31415B",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  topFiltersRow: {
    marginTop: 14,
    flexDirection: "row",
    gap: 8,
  },
  topFilterChip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#36455F",
  },
  topFilterChipActive: {
    backgroundColor: "#FFA61B",
  },
  topFilterText: {
    color: "#DCE5F2",
    fontFamily: font.family.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
  topFilterTextActive: {
    color: "#FFFFFF",
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 26,
    gap: 12,
    flexGrow: 1,
  },
  statusFilterRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 6,
  },
  statusChip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  statusChipActive: {
    shadowColor: "rgba(31, 41, 55, 0.12)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 4,
  },
  statusAll: {
    backgroundColor: "#1F2C42",
    borderColor: "#1F2C42",
  },
  statusNeedsReview: {
    backgroundColor: "#FFF7E8",
    borderColor: "#FFD690",
  },
  statusSentBack: {
    backgroundColor: "#FFF0EB",
    borderColor: "#FFC5AF",
  },
  statusApproved: {
    backgroundColor: "#EAFBF2",
    borderColor: "#A6E7C2",
  },
  statusChipText: {
    fontFamily: font.family.bold,
    fontSize: 12,
  },
  statusChipTextActive: {
    color: "#FFFFFF",
  },
  cardWrap: {
    borderRadius: 24,
    overflow: "hidden",
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8EDF5",
  },
  cardAccent: {
    width: 5,
  },
  cardAccentRed: {
    backgroundColor: "#FF4A58",
  },
  cardAccentOrange: {
    backgroundColor: "#FF9F1A",
  },
  cardAccentGreen: {
    backgroundColor: "#1FCF86",
  },
  cardAccentGray: {
    backgroundColor: "#D9E1EE",
  },
  card: {
    flex: 1,
    minHeight: 118,
    flexDirection: "row",
  },
  cardMain: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  cardAside: {
    width: 108,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderLeftWidth: 1,
    borderLeftColor: "#EDF1F6",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  cardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  priorityPill: {
    height: 20,
    paddingHorizontal: 8,
    borderRadius: 8,
    justifyContent: "center",
    backgroundColor: "#F4F7FB",
    borderWidth: 1,
    borderColor: "#E0E7F2",
  },
  priorityPillText: {
    color: "#73839C",
    fontFamily: font.family.bold,
    fontSize: 8,
    letterSpacing: 1.2,
  },
  floorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  floorText: {
    color: "#95A3B9",
    fontFamily: font.family.medium,
    fontSize: 11,
  },
  cardTitle: {
    color: "#1E293B",
    fontFamily: font.family.black,
    fontSize: 29 / 2,
    lineHeight: 20,
  },
  assigneeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  assigneeBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF3FF",
  },
  assigneeBadgeText: {
    color: "#2D67FF",
    fontFamily: font.family.bold,
    fontSize: 10,
  },
  assigneeName: {
    color: "#58667D",
    fontFamily: font.family.bold,
    fontSize: 12,
  },
  cardTime: {
    color: "#A6B2C6",
    fontFamily: font.family.medium,
    fontSize: 10,
  },
  cardStatus: {
    textAlign: "right",
    fontFamily: font.family.bold,
    fontSize: 13,
    lineHeight: 16,
  },
  cardStatusNote: {
    textAlign: "right",
    fontFamily: font.family.bold,
    fontSize: 11,
    lineHeight: 14,
  },
  cardStatusRed: {
    color: "#FF4A58",
  },
  cardStatusOrange: {
    color: "#FF8E12",
  },
  cardStatusGreen: {
    color: "#18B56F",
  },
  cardStatusGray: {
    color: "#8E9BB0",
  },
  expandButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5EAF3",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.42)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    maxHeight: "92%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  modalTitle: {
    color: "#111827",
    fontFamily: font.family.black,
    fontSize: 30,
    lineHeight: 34,
  },
  modalSubtitle: {
    marginTop: 4,
    color: "#2D67FF",
    fontFamily: font.family.bold,
    fontSize: 13,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F5FA",
  },
  reviewTaskCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E7EDF5",
    backgroundColor: "#FFFDFC",
    padding: 12,
    gap: 14,
  },
  reviewTaskTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewTaskIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5FB",
  },
  reviewTaskInfo: {
    flex: 1,
    marginLeft: 10,
  },
  reviewTaskName: {
    color: "#EF1C24",
    fontFamily: font.family.black,
    fontSize: 17,
  },
  reviewTaskMeta: {
    marginTop: 3,
    color: "#66768F",
    fontFamily: font.family.bold,
    fontSize: 11,
  },
  reviewTaskBadges: {
    alignItems: "flex-end",
    gap: 6,
  },
  reviewPriorityBadge: {
    paddingHorizontal: 10,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#EF1C24",
    justifyContent: "center",
  },
  reviewPriorityText: {
    color: "#FFFFFF",
    fontFamily: font.family.bold,
    fontSize: 10,
  },
  reviewCountBadge: {
    paddingHorizontal: 10,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFF1F1",
    justifyContent: "center",
  },
  reviewCountText: {
    color: "#EF4444",
    fontFamily: font.family.bold,
    fontSize: 11,
  },
  sectionBlock: {
    marginTop: 14,
  },
  sectionLabel: {
    marginBottom: 10,
    color: "#65758F",
    fontFamily: font.family.bold,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  evidenceRow: {
    flexDirection: "row",
    gap: 10,
  },
  evidenceCard: {
    flex: 1,
  },
  evidencePreview: {
    height: 106,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  evidenceImage: {
    borderRadius: 18,
  },
  evidenceOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  evidencePreviewFilled: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E5EBF3",
  },
  evidencePreviewMissing: {
    backgroundColor: "#FFFDFD",
    borderColor: "#F1D7D7",
  },
  evidenceGlow: {
    position: "absolute",
    width: 88,
    height: 88,
    borderRadius: 44,
    opacity: 0.18,
  },
  evidenceGlowBefore: {
    backgroundColor: "#2D67FF",
  },
  evidenceGlowAfter: {
    backgroundColor: "#11C98A",
  },
  evidenceGlowMissing: {
    backgroundColor: "#FF8A8A",
    opacity: 0.12,
  },
  evidenceLabel: {
    marginTop: 8,
    fontFamily: font.family.bold,
    fontSize: 11,
  },
  evidenceLabelBefore: {
    color: "#2D67FF",
  },
  evidenceLabelAfter: {
    color: "#11C98A",
  },
  evidenceLabelMissing: {
    color: "#FF5C5C",
  },
  evidenceTime: {
    marginTop: 2,
    color: "#93A0B6",
    fontFamily: font.family.medium,
    fontSize: 10,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  locationText: {
    color: "#16A34A",
    fontFamily: font.family.bold,
    fontSize: 11,
  },
  decisionRow: {
    flexDirection: "row",
    gap: 10,
  },
  decisionButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
  },
  approveButton: {
    backgroundColor: "#F3F4F6",
    borderColor: "#ECEFF4",
  },
  sendBackButton: {
    backgroundColor: "#F3F4F6",
    borderColor: "#ECEFF4",
  },
  decisionButtonApproveActive: {
    backgroundColor: "#13C57B",
    borderColor: "#13C57B",
  },
  decisionButtonSendBackActive: {
    backgroundColor: "#FF7A00",
    borderColor: "#FF7A00",
  },
  decisionButtonText: {
    color: "#6C7B93",
    fontFamily: font.family.bold,
    fontSize: 14,
  },
  decisionButtonTextActive: {
    color: "#FFFFFF",
  },
  reasonWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  reasonChip: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#D7E0EC",
    backgroundColor: "#FBFCFE",
    alignItems: "center",
    justifyContent: "center",
  },
  reasonChipActive: {
    borderColor: "#FFB15E",
    backgroundColor: "#FFF2E3",
  },
  reasonChipText: {
    color: "#5E6F88",
    fontFamily: font.family.bold,
    fontSize: 12,
  },
  reasonChipTextActive: {
    color: "#E46B00",
  },
  commentInput: {
    minHeight: 108,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DEE6F1",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: "#25324A",
    fontFamily: font.family.medium,
    fontSize: 14,
  },
  confirmButton: {
    height: 50,
    borderRadius: 14,
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  confirmButtonApprove: {
    backgroundColor: "#13C57B",
  },
  confirmButtonSendBack: {
    backgroundColor: "#FF7A00",
  },
  confirmButtonDisabled: {
    opacity: 0.45,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontFamily: font.family.bold,
    fontSize: 14,
  },
  toastWrap: {
    position: "absolute",
    left: 16,
    right: 16,
  },
  toastCard: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: "#ECFFF3",
    borderWidth: 1,
    borderColor: "#C5F1D6",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "rgba(15, 23, 42, 0.12)",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 4,
  },
  toastText: {
    flex: 1,
    color: "#276749",
    fontFamily: font.family.bold,
    fontSize: 13,
  },
});

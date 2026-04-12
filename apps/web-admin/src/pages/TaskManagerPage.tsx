import {
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileText,
  MapPin,
  MoreVertical,
  Paperclip,
  Plus,
  RefreshCw,
  Share2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Task as ApiTask } from "@madhuban/types";
import { useShellHeader } from "../context/ShellHeaderContext";
import { useToast } from "../context/ToastContext";
import {
  createTask,
  getTasks,
  getUsersForAssignee,
  updateTask,
  updateTaskStatus,
} from "@madhuban/api";

// ─── Types ────────────────────────────────────────────────────────────────────
type TaskStatus = "todo" | "inprogress" | "review" | "completed";
type TaskPriority = "HIGH PRIORITY" | "MEDIUM" | "LOW" | "URGENT" | "NORMAL";
type MetaType = "required" | "date" | "progress" | "proof" | "finished";

interface TaskAssignee {
  id?: string;
  name: string;
  initials: string;
  color: string;
  role?: string;
}

interface ActivityEntry {
  label: string;
  detail: string;
  time: string;
  active?: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo: TaskAssignee;
  assignedBy?: TaskAssignee;
  meta?: string;
  metaType?: MetaType;
  location?: string;
  extension?: string;
  startTime?: string;
  endTime?: string;
  duration?: string;
  priorityRationale?: string;
  fullDescription?: string;
  activity?: ActivityEntry[];
}

type AssigneeOption = { id: string; name: string };

// ─── Mock data ────────────────────────────────────────────────────────────────
const INITIAL_TASKS: Task[] = [
  {
    id: "TK-8829",
    title: "HVAC Compressor Repair",
    description: "Unit B-12 reporting abnormal noise and performance drop.",
    priority: "HIGH PRIORITY",
    status: "todo",
    assignedTo: { name: "M. Chen", initials: "MC", color: "#2563eb" },
    assignedBy: { name: "Alex Rivera", initials: "AR", color: "#6366f1", role: "Facility Director" },
    meta: "Required", metaType: "required",
    location: "Outside Main Door", extension: "Preventive Maintenance",
    startTime: "Oct 24, 08:00 AM", endTime: "Oct 25, 05:00 PM", duration: "15 Mins",
    priorityRationale: "Risk of equipment failure and potential downtime for server cooling in the North Tower. Immediate inspection required to prevent critical thermal shutdown.",
    fullDescription: "Perform semi-annual maintenance check on the main HVAC unit (Unit-Ha) located in the North Tower, Floor 4 Server Room. The unit has been reporting minor pressure fluctuations in the last 24 hours.\n\n• Check refrigerant levels and pressure.\n• Clean condenser coils and replace air filters.\n• Inspect all electrical connections for wear or corrosion.\n• Verify the thermostat calibration against secondary sensor.",
    activity: [
      { label: "In Progress", detail: "Status has been updated", time: "Today, 22:10", active: true },
      { label: "Assigned",    detail: "Assigned to Mike Ross",  time: "Today, 19:05" },
      { label: "Created",     detail: "Task created by Alex Rivera", time: "Today, 10:23 AM" },
    ],
  },
  {
    id: "TK-8830",
    title: "Fire Alarm System Test",
    description: "Monthly routine inspection for building safety compliance.",
    priority: "MEDIUM",
    status: "todo",
    assignedTo: { name: "S. Blake", initials: "SB", color: "#d97706" },
    meta: "Oct 25", metaType: "date",
    location: "Block A, Floor 3",
  },
  {
    id: "TK-8831",
    title: "Floor 2 Janitorial Deep Clean",
    description: "Post-event cleanup required for conference rooms A–D.",
    priority: "URGENT",
    status: "inprogress",
    assignedTo: { name: "J. Thompson", initials: "JT", color: "#7c3aed" },
    meta: "60%", metaType: "progress",
    location: "Conference Floor 2",
  },
  {
    id: "TK-8832",
    title: "Roof Inspection – Phase 1",
    description: "Completed visual check for leaks after heavy rain. Photos uploaded.",
    priority: "LOW",
    status: "review",
    assignedTo: { name: "D. Vance", initials: "DV", color: "#0ea5e9" },
    meta: "Proof Ready", metaType: "proof",
    location: "Rooftop Zone B",
  },
  {
    id: "TK-8833",
    title: "Parking Lot Lighting Audit",
    description: "Replaced 4 flickering LED units in Section C.",
    priority: "NORMAL",
    status: "completed",
    assignedTo: { name: "K. Miller", initials: "KM", color: "#64748b" },
    meta: "Finished 2h ago", metaType: "finished",
    location: "Parking Lot C",
  },
];

const STATUS_COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: "todo",       label: "TO-DO",       color: "#64748b" },
  { id: "inprogress", label: "IN PROGRESS", color: "#2563eb" },
  { id: "review",     label: "REVIEW",      color: "#d97706" },
  { id: "completed",  label: "COMPLETED",   color: "#16a34a" },
];

// ─── Priority helpers ─────────────────────────────────────────────────────────
const PRIORITY_STYLE: Record<TaskPriority, { bg: string; color: string }> = {
  "HIGH PRIORITY": { bg: "#fef2f2", color: "#dc2626" },
  MEDIUM:          { bg: "#fffbeb", color: "#d97706" },
  LOW:             { bg: "#f0fdf4", color: "#16a34a" },
  URGENT:          { bg: "#fef2f2", color: "#b91c1c" },
  NORMAL:          { bg: "#f8fafc", color: "#64748b" },
};

// ─── Meta badge renderer ──────────────────────────────────────────────────────
function MetaBadge({ meta, type }: { meta: string; type?: MetaType }) {
  if (!meta) return null;
  if (type === "required")  return <span style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", display: "inline-flex", alignItems: "center", gap: 5 }}><ClipboardCheck size={12} /> Required</span>;
  if (type === "date")      return <span style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}><Calendar size={12}/>{meta}</span>;
  if (type === "proof")     return <span style={{ fontSize: 12, fontWeight: 600, color: "#16a34a", display: "flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={12}/> {meta}</span>;
  if (type === "finished")  return <span style={{ fontSize: 12, color: "#94a3b8" }}>{meta}</span>;
  if (type === "progress") {
    const pct = parseInt(meta, 10) || 0;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ flex: 1, height: 5, borderRadius: 99, background: "var(--c-input-border)", overflow: "hidden", maxWidth: 80 }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "#2563eb", borderRadius: 99 }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#2563eb" }}>{meta}</span>
      </div>
    );
  }
  return <span style={{ fontSize: 12, color: "#94a3b8" }}>{meta}</span>;
}

// ─── Task card ────────────────────────────────────────────────────────────────
function TaskCard({ task, onView }: { task: Task; onView: (t: Task) => void }) {
  const ps = PRIORITY_STYLE[task.priority];
  return (
    <div style={tc.card}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ ...tc.priorityBadge, background: ps.bg, color: ps.color }}>{task.priority}</span>
        <div style={{ display: "flex", gap: 4 }}>
          <button title="View task" onClick={() => onView(task)} style={tc.iconBtn}>
            <Eye size={13} />
          </button>
          <button style={tc.iconBtn}><MoreVertical size={13} /></button>
        </div>
      </div>
      <div style={tc.title}>{task.title}</div>
      <div style={tc.desc}>{task.description}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ ...tc.avatar, background: task.assignedTo.color }}>{task.assignedTo.initials}</div>
          <span style={{ fontSize: 12.5, color: "var(--c-text-muted)" }}>{task.assignedTo.name}</span>
        </div>
        {task.meta && <MetaBadge meta={task.meta} type={task.metaType} />}
      </div>
    </div>
  );
}

// ─── Task Detail Modal ────────────────────────────────────────────────────────
function TaskDetailModal({
  task,
  onClose,
  onEdit,
  onComplete,
}: {
  task: Task;
  onClose: () => void;
  onEdit: () => void;
  onComplete: () => void;
}) {
  const ps = PRIORITY_STYLE[task.priority];
  return (
    <div style={md.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={md.panel}>
        {/* Header */}
        <div style={md.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <FileText size={16} color="#2563eb" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#2563eb" }}>
                  {task.title} – <span style={{ color: "#2563eb" }}>#{task.id}</span>
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 600, padding: "2px 9px", borderRadius: 20, background: "#eff6ff", color: "#2563eb" }}>
                  In Progress
                </span>
              </div>
              <div style={{ fontSize: 12, color: "var(--c-text-faint)", marginTop: 2 }}>Updated 26 mins ago</div>
            </div>
          </div>
          <button style={md.closeBtn} onClick={onClose}><X size={16} /></button>
        </div>

        {/* Body */}
        <div style={md.body}>
          {/* Left column */}
          <div style={{ flex: 1.3, minWidth: 0 }}>
            {/* Assigned by / to */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
              {[
                { label: "ASSIGNED BY", person: task.assignedBy ?? { name: "Alex Rivera", initials: "AR", color: "#6366f1", role: "Facility Director" } },
                { label: "ASSIGNED TO", person: { ...task.assignedTo, role: task.assignedTo.role ?? "Senior Technician" } },
              ].map(({ label, person }) => (
                <div key={label} style={md.infoBox}>
                  <div style={md.infoLabel}>{label}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 8 }}>
                    <div style={{ ...tc.avatar, width: 34, height: 34, fontSize: 12, background: person.color }}>{person.initials}</div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--c-text)" }}>{person.name}</div>
                      <div style={{ fontSize: 12, color: "var(--c-text-faint)" }}>{person.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Priority rationale */}
            {task.priorityRationale && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ ...tc.priorityBadge, background: ps.bg, color: ps.color }}>{task.priority}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "#7f1d1d", lineHeight: 1.65 }}>
                  <strong>Rationale:</strong> {task.priorityRationale}
                </p>
              </div>
            )}

            {/* Task description */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 700, color: "var(--c-text)", marginBottom: 10 }}>
                <FileText size={14} /> Task Description
              </div>
              <p style={{ margin: 0, fontSize: 13.5, color: "var(--c-text-2)", lineHeight: 1.7, whiteSpace: "pre-line" }}>
                {task.fullDescription ?? task.description}
              </p>
            </div>

            {/* Location + Extension */}
            <div style={{ display: "flex", gap: 24, borderTop: "1px solid var(--c-divider)", paddingTop: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <MapPin size={13} color="var(--c-text-faint)" />
                <div>
                  <div style={md.infoLabel}>Location</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--c-text)" }}>{task.location ?? "—"}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Paperclip size={13} color="var(--c-text-faint)" />
                <div>
                  <div style={md.infoLabel}>Extension</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--c-text)" }}>{task.extension ?? "—"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={{ width: 220, flexShrink: 0 }}>
            {/* Timeline */}
            <div style={md.sideCard}>
              <div style={md.sideTitle}>Timeline &amp; Schedule</div>
              {[
                { label: "START TIME",  value: task.startTime ?? "—" },
                { label: "END TIME",    value: task.endTime   ?? "—" },
                { label: "DURATION",    value: task.duration  ?? "—" },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--c-divider)" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--c-text-faint)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--c-text)", fontWeight: 500 }}>
                    <Calendar size={11} color="var(--c-text-faint)" />{value}
                  </div>
                </div>
              ))}
            </div>

            {/* Activity log */}
            <div style={{ ...md.sideCard, marginTop: 14 }}>
              <div style={md.sideTitle}>Activity Log</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
                {(task.activity ?? []).map((a, i) => (
                  <div key={i} style={{ display: "flex", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", marginTop: 4, flexShrink: 0, background: a.active ? "#2563eb" : "#cbd5e1" }} />
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--c-text)" }}>{a.label}</div>
                      <div style={{ fontSize: 11.5, color: "var(--c-text-muted)", marginTop: 1 }}>{a.detail}</div>
                      <div style={{ fontSize: 11, color: "var(--c-text-faint)", marginTop: 1 }}>{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={md.footer}>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={md.footerBtn} onClick={onEdit}><FileText size={14} /> Edit Task</button>
            <button style={md.footerBtn}><Share2 size={14} /> Share</button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={md.footerBtn}>Put on Hold</button>
            <button style={md.completeBtn} onClick={onComplete}>
              <CheckCircle2 size={14} /> Complete Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Create / Edit Task Modal ─────────────────────────────────────────────────
interface TaskForm {
  title: string; category: string; description: string;
  assigneeId: string; assigneeName: string; priority: "HIGH" | "MEDIUM" | "LOW";
  area: string; frequency: string;
  startTime: string; endTime: string; duration: string;
}

const EMPTY_FORM: TaskForm = {
  title: "", category: "Maintenance", description: "",
  assigneeId: "", assigneeName: "", priority: "MEDIUM",
  area: "Outside Main Door", frequency: "Daily, Weekly, Weekends",
  startTime: "", endTime: "", duration: "",
};

function CreateTaskModal({
  initial,
  assignees,
  onClose,
  onSave,
}: {
  initial?: TaskForm;
  assignees: AssigneeOption[];
  onClose: () => void;
  onSave: (f: TaskForm) => void;
}) {
  const [form, setForm] = useState<TaskForm>(initial ?? EMPTY_FORM);
  function set<K extends keyof TaskForm>(k: K, v: TaskForm[K]) { setForm(f => ({ ...f, [k]: v })); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
    onClose();
  }

  const pBtns: { label: TaskForm["priority"]; color: string; bg: string }[] = [
    { label: "HIGH",   color: "#dc2626", bg: "#fef2f2" },
    { label: "MEDIUM", color: "#d97706", bg: "#fffbeb" },
    { label: "LOW",    color: "#16a34a", bg: "#f0fdf4" },
  ];

  return (
    <div style={cf.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={cf.panel}>
        <div style={cf.header}>
          <h2 style={cf.title}>Create New Task</h2>
          <button style={cf.closeBtn} onClick={onClose}><X size={17} /></button>
        </div>
        <form onSubmit={handleSubmit} style={cf.form}>
          {/* Basic Info */}
          <SectionHdr label="BASIC INFO" />
          <CFField label="Task Name">
            <input style={cf.input} placeholder="e.g. Door Cleaning" value={form.title} onChange={e => set("title", e.target.value)} required />
          </CFField>
          <CFField label="Category">
            <select style={cf.input} value={form.category} onChange={e => set("category", e.target.value)}>
              {["Maintenance", "Cleaning", "Inspection", "Security", "Other"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </CFField>
          <CFField label="Description">
            <textarea style={{ ...cf.input, height: 72, resize: "vertical" as const }} placeholder="Describe the work to be performed..." value={form.description} onChange={e => set("description", e.target.value)} />
          </CFField>

          {/* Assignment & Priority */}
          <SectionHdr label="ASSIGNMENT & PRIORITY" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <CFField label="Assignee">
              <select
                style={cf.input}
                value={form.assigneeId}
                onChange={(e) => {
                  const id = e.target.value;
                  const found = assignees.find((a) => a.id === id);
                  set("assigneeId", id);
                  set("assigneeName", found?.name ?? "");
                }}
                required
              >
                <option value="">Select staff member</option>
                {assignees.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </CFField>
            <CFField label="Priority">
              <div style={{ display: "flex", gap: 6 }}>
                {pBtns.map(p => (
                  <button key={p.label} type="button" onClick={() => set("priority", p.label)}
                    style={{ flex: 1, padding: "7px 0", fontSize: 12, fontWeight: 700, border: `1.5px solid ${form.priority === p.label ? p.color : "var(--c-input-border)"}`, borderRadius: 7, background: form.priority === p.label ? p.bg : "var(--c-card)", color: form.priority === p.label ? p.color : "var(--c-text-faint)", cursor: "pointer" }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </CFField>
          </div>

          {/* Location & Schedule */}
          <SectionHdr label="LOCATION & SCHEDULE" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 10 }}>
            <CFField label="Area">
              <select style={cf.input} value={form.area} onChange={e => set("area", e.target.value)}>
                {["Outside Main Door", "Floor 1", "Floor 2", "Rooftop", "Basement", "Conference Hall"].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </CFField>
            <CFField label="Frequency">
              <select style={cf.input} value={form.frequency} onChange={e => set("frequency", e.target.value)}>
                {["Daily", "Weekly", "Daily, Weekly, Weekends", "Monthly", "Once"].map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </CFField>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <CFField label="Start Time"><input style={cf.input} type="time" value={form.startTime} onChange={e => set("startTime", e.target.value)} /></CFField>
            <CFField label="End Time"><input style={cf.input} type="time" value={form.endTime} onChange={e => set("endTime", e.target.value)} /></CFField>
            <CFField label="Duration"><input style={cf.input} placeholder="e.g. 30 min" value={form.duration} onChange={e => set("duration", e.target.value)} /></CFField>
          </div>

          {/* Attachments */}
          <SectionHdr label="ATTACHMENTS" />
          <div style={cf.dropzone}>
            <Upload size={22} color="var(--c-text-faint)" style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--c-text-2)" }}>Click to upload or drag and drop</div>
            <div style={{ fontSize: 12, color: "var(--c-text-faint)", marginTop: 4 }}>PNG, JPG, PDF up to 10MB</div>
          </div>

          {/* Footer */}
          <div style={cf.footer}>
            <button type="button" style={cf.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" style={cf.saveBtn}><Plus size={15} /> Create Task</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SectionHdr({ label }: { label: string }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 800, color: "var(--c-text)", letterSpacing: "0.8px", borderLeft: "3px solid #2563eb", paddingLeft: 8, margin: "14px 0 10px" }}>
      {label}
    </div>
  );
}
function CFField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 10 }}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--c-text-muted)" }}>{label}</label>
      {children}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
type ModalState =
  | { type: "none" }
  | { type: "create" }
  | { type: "edit"; task: Task }
  | { type: "view"; task: Task };

export function TaskManagerPage() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [assignees, setAssignees] = useState<AssigneeOption[]>([]);

  useShellHeader({ showSearch: true });

  function statusFromApi(s: string | undefined): TaskStatus {
    const raw = String(s ?? "").toUpperCase().replace(/\s/g, "_");
    if (raw === "IN_PROGRESS") return "inprogress";
    if (raw === "REVIEW" || raw === "PENDING_APPROVAL") return "review";
    if (raw === "COMPLETED") return "completed";
    return "todo";
  }

  function uiStatusToApi(s: TaskStatus): string {
    if (s === "inprogress") return "IN_PROGRESS";
    if (s === "review") return "REVIEW";
    if (s === "completed") return "COMPLETED";
    return "TO_DO";
  }

  function toUiTask(t: ApiTask, idx: number): Task {
    const assigneeName = t.assignee?.name ?? "Unassigned";
    const initials = assigneeName
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
    const colors = ["#2563eb", "#6366f1", "#0ea5e9", "#7c3aed", "#d97706", "#16a34a", "#64748b"];
    const id = String(t._id ?? t.id ?? "");
    return {
      id,
      title: String(t.title ?? t.taskName ?? "Untitled Task"),
      description: String(t.description ?? ""),
      priority: (String(t.priority ?? "NORMAL").toUpperCase() as TaskPriority) ?? "NORMAL",
      status: statusFromApi(String(t.status ?? "")),
      assignedTo: {
        id: t.assigneeId ?? undefined,
        name: assigneeName,
        initials: initials || "U",
        color: colors[idx % colors.length],
      },
      location: t.locationFloor ?? t.roomNumber ?? t.propertyName ?? undefined,
      startTime: t.startTime != null ? String(t.startTime) : undefined,
      endTime: t.endTime != null ? String(t.endTime) : undefined,
      duration: t.timeDuration != null ? String(t.timeDuration) : undefined,
      meta: t.dueDate ? String(t.dueDate) : undefined,
      metaType: t.dueDate ? "date" : undefined,
    };
  }

  async function refreshTasks() {
    try {
      setLoading(true);
      const list = await getTasks({});
      setTasks((Array.isArray(list) ? list : []).map((t, idx) => toUiTask(t as ApiTask, idx)));
    } catch (e) {
      console.error(e);
      showToast("error", "Failed to load tasks", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshAssignees() {
    try {
      const list = (await getUsersForAssignee()) as Record<string, unknown>[];
      const opts = (Array.isArray(list) ? list : [])
        .map((u) => ({
          id: String((u as { _id?: unknown; id?: unknown })._id ?? (u as { id?: unknown }).id ?? ""),
          name: String((u as { name?: unknown }).name ?? (u as { fullName?: unknown }).fullName ?? (u as { email?: unknown }).email ?? "—"),
        }))
        .filter((o) => o.id && o.name);
      setAssignees(opts);
    } catch (e) {
      console.error(e);
      setAssignees([]);
    }
  }

  useEffect(() => {
    void refreshAssignees();
    void refreshTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(form: TaskForm) {
    try {
      await createTask({
        title: form.title,
        description: form.description,
        assigneeId: form.assigneeId,
        priority: form.priority,
        locationFloor: form.area,
        frequency: form.frequency,
        startTime: form.startTime,
        endTime: form.endTime,
        timeDuration: form.duration,
      });
      await refreshTasks();
      showToast("success", "Task Created!", `"${form.title}" has been added to the board.`);
    } catch (e) {
      showToast("error", "Failed to create task", e instanceof Error ? e.message : "Please try again.");
    }
  }

  async function handleEdit(form: TaskForm) {
    if (modal.type !== "edit") return;
    try {
      await updateTask(modal.task.id, {
        title: form.title,
        description: form.description,
        assigneeId: form.assigneeId,
        priority: form.priority,
        locationFloor: form.area,
        frequency: form.frequency,
        startTime: form.startTime,
        endTime: form.endTime,
        timeDuration: form.duration,
        status: uiStatusToApi(modal.task.status),
      });
      await refreshTasks();
      showToast("success", "Task Updated!", "Changes saved successfully.");
    } catch (e) {
      showToast("error", "Failed to update task", e instanceof Error ? e.message : "Please try again.");
    }
  }

  async function handleComplete(task: Task) {
    try {
      await updateTaskStatus(task.id, "COMPLETED");
      await refreshTasks();
      setModal({ type: "none" });
      showToast("success", "Task Completed!", `"${task.title}" marked as complete.`);
    } catch (e) {
      showToast("error", "Failed to complete task", e instanceof Error ? e.message : "Please try again.");
    }
  }

  const grouped = useMemo(
    () =>
      STATUS_COLUMNS.map((col) => ({
        ...col,
        tasks: tasks.filter((t) => t.status === col.id),
      })),
    [tasks],
  );

  return (
    <div>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "var(--c-text)", letterSpacing: "-0.3px" }}>Task Manager</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--c-text-muted)" }}>Manage and track daily tasks across users.</p>
        </div>
        <button style={pg.createBtn} onClick={() => setModal({ type: "create" })}>
          <Plus size={15} /> Create Task
        </button>
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {[["Priority:", "All"], ["Staff:", "All Assigned"], ["Due Date:", "This Week"]].map(([label, val]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text-muted)" }}>{label}</span>
            <button style={pg.filterPill}>{val} ▾</button>
          </div>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--c-text-faint)" }}>
          <RefreshCw size={13} /> {loading ? "Refreshing…" : "Synced"}
        </div>
      </div>

      {/* Grouped task sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {grouped.map(col => (
          <div key={col.id}>
            {/* Section header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "var(--c-text)", letterSpacing: "0.5px" }}>{col.label}</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, padding: "1px 8px", borderRadius: 20, background: "var(--c-input-bg)", color: col.color, border: "1px solid var(--c-card-border)" }}>
                {col.tasks.length}
              </span>
            </div>

            {col.tasks.length === 0 ? (
              <div style={{ padding: "16px 18px", background: "var(--c-card)", border: "1px dashed var(--c-input-border)", borderRadius: 10, fontSize: 13, color: "var(--c-text-faint)", textAlign: "center" }}>
                No tasks in this column
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {col.tasks.map(task => (
                  <TaskCard key={task.id} task={task} onView={t => setModal({ type: "view", task: t })} />
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Add column */}
        <button style={pg.addColBtn}><Plus size={15} /> Add Column</button>
      </div>

      {/* Modals */}
      {modal.type === "create" && (
        <CreateTaskModal
          assignees={assignees}
          onClose={() => setModal({ type: "none" })}
          onSave={(f) => void handleCreate(f)}
        />
      )}
      {modal.type === "edit" && (
        <CreateTaskModal
          assignees={assignees}
          initial={{
            title: modal.task.title,
            category: "Maintenance",
            description: modal.task.description,
            assigneeId: modal.task.assignedTo.id ?? "",
            assigneeName: modal.task.assignedTo.name,
            priority: "MEDIUM",
            area: modal.task.location ?? "Outside Main Door",
            frequency: "Daily, Weekly, Weekends",
            startTime: "",
            endTime: "",
            duration: modal.task.duration ?? "",
          }}
          onClose={() => setModal({ type: "none" })}
          onSave={(f) => void handleEdit(f)}
        />
      )}
      {modal.type === "view" && (
        <TaskDetailModal
          task={modal.task}
          onClose={() => setModal({ type: "none" })}
          onEdit={() => setModal({ type: "edit", task: modal.task })}
          onComplete={() => void handleComplete(modal.task)}
        />
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const pg: Record<string, React.CSSProperties> = {
  createBtn: { display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 18px", fontSize: 13.5, fontWeight: 600, border: "none", borderRadius: 9, background: "#2563eb", color: "#fff", cursor: "pointer" },
  filterPill: { padding: "5px 12px", fontSize: 13, fontWeight: 500, border: "1px solid var(--c-input-border)", borderRadius: 20, background: "var(--c-card)", color: "var(--c-text-2)", cursor: "pointer" },
  addColBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "12px", fontSize: 13.5, fontWeight: 600, border: "1.5px dashed var(--c-input-border)", borderRadius: 10, background: "none", color: "var(--c-text-faint)", cursor: "pointer", width: "100%", marginTop: 4 },
};
const tc: Record<string, React.CSSProperties> = {
  card: { background: "var(--c-card)", border: "1px solid var(--c-card-border)", borderRadius: 12, padding: "14px 16px" },
  priorityBadge: { fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20 },
  title: { fontSize: 14.5, fontWeight: 700, color: "var(--c-text)", margin: "6px 0 4px" },
  desc: { fontSize: 13, color: "var(--c-text-muted)", lineHeight: 1.5 },
  avatar: { width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700, flexShrink: 0 },
  iconBtn: { width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--c-input-border)", borderRadius: 6, background: "var(--c-card)", cursor: "pointer", color: "var(--c-text-faint)" },
};
const md: Record<string, React.CSSProperties> = {
  overlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.48)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 },
  panel: { width: "100%", maxWidth: 820, maxHeight: "92vh", background: "var(--c-card)", border: "1px solid var(--c-card-border)", borderRadius: 16, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.3)" },
  header: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "18px 22px 14px", borderBottom: "1px solid var(--c-divider)", gap: 12 },
  closeBtn: { width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--c-input-border)", borderRadius: 7, background: "var(--c-card)", color: "var(--c-text-muted)", cursor: "pointer", flexShrink: 0 },
  body: { flex: 1, overflowY: "auto" as const, padding: "20px 22px", display: "flex", gap: 20 },
  infoBox: { background: "var(--c-input-bg)", border: "1px solid var(--c-card-border)", borderRadius: 10, padding: "12px 14px" },
  infoLabel: { fontSize: 10.5, fontWeight: 700, color: "var(--c-text-faint)", textTransform: "uppercase" as const, letterSpacing: "0.6px" },
  sideCard: { background: "var(--c-input-bg)", border: "1px solid var(--c-card-border)", borderRadius: 10, padding: "12px 14px" },
  sideTitle: { fontSize: 12.5, fontWeight: 700, color: "var(--c-text)", marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid var(--c-divider)" },
  footer: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 22px", borderTop: "1px solid var(--c-divider)", gap: 8, flexWrap: "wrap" },
  footerBtn: { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", fontSize: 13, fontWeight: 600, border: "1px solid var(--c-input-border)", borderRadius: 8, background: "var(--c-card)", color: "var(--c-text-2)", cursor: "pointer" },
  completeBtn: { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", fontSize: 13, fontWeight: 600, border: "none", borderRadius: 8, background: "#2563eb", color: "#fff", cursor: "pointer" },
};
const cf: Record<string, React.CSSProperties> = {
  overlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.48)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 },
  panel: { width: "100%", maxWidth: 520, maxHeight: "92vh", background: "var(--c-card)", border: "1px solid var(--c-card-border)", borderRadius: 16, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.3)" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px 12px", borderBottom: "1px solid var(--c-divider)" },
  title: { margin: 0, fontSize: 17, fontWeight: 800, color: "var(--c-text)" },
  closeBtn: { width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--c-input-border)", borderRadius: 7, background: "var(--c-card)", color: "var(--c-text-muted)", cursor: "pointer" },
  form: { flex: 1, overflowY: "auto" as const, padding: "14px 22px 22px" },
  input: { padding: "8px 11px", fontSize: 13.5, border: "1px solid var(--c-input-border)", borderRadius: 8, outline: "none", color: "var(--c-text)", background: "var(--c-input-bg)", width: "100%", boxSizing: "border-box" as const },
  dropzone: { border: "1.5px dashed var(--c-input-border)", borderRadius: 10, padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "var(--c-input-bg)", marginBottom: 10 },
  footer: { display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 12, marginTop: 4, borderTop: "1px solid var(--c-divider)" },
  cancelBtn: { padding: "9px 20px", fontSize: 13.5, fontWeight: 600, border: "1px solid var(--c-input-border)", borderRadius: 8, background: "var(--c-card)", color: "var(--c-text-2)", cursor: "pointer" },
  saveBtn: { display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 20px", fontSize: 13.5, fontWeight: 600, border: "none", borderRadius: 8, background: "#2563eb", color: "#fff", cursor: "pointer" },
};

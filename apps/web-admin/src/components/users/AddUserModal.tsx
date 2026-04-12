import { X } from "lucide-react";
import { useState } from "react";
import { ROLES, STATUSES, type User, type UserRole, type UserStatus } from "./types";

interface AddUserForm {
  fullName: string;
  email: string;
  phone: string;
  role: UserRole | "";
  status: UserStatus;
  department: string;
  localities: string;
}

const EMPTY: AddUserForm = {
  fullName: "", email: "", phone: "",
  role: "", status: "Active",
  department: "", localities: "",
};

const AVATAR_COLORS = ["#6366f1","#0ea5e9","#10b981","#f59e0b","#8b5cf6","#ec4899"];

export function AddUserModal({
  totalCount,
  onClose,
  onSave,
}: {
  totalCount: number;
  onClose: () => void;
  onSave: (u: User) => void;
}) {
  const [form, setForm] = useState<AddUserForm>(EMPTY);

  function update(k: keyof AddUserForm, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.role) return;
    const initials = form.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
    onSave({
      id: Date.now(),
      apiId: "",
      name: form.fullName,
      email: form.email,
      phone: form.phone,
      role: form.role as UserRole,
      status: form.status,
      department: form.department,
      lastLogin: "Just now",
      initials,
      avatarColor: AVATAR_COLORS[totalCount % AVATAR_COLORS.length],
      facilities: form.localities ? [form.localities] : [],
    });
    onClose();
  }

  return (
    <div style={as.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={as.card}>
        {/* Header */}
        <div style={as.header}>
          <div>
            <h2 style={as.title}>Add New User</h2>
            <p style={as.subtitle}>Create a new system account and define access.</p>
          </div>
          <button style={as.closeBtn} onClick={onClose}><X size={17} /></button>
        </div>

        <form onSubmit={handleSave} style={as.form}>
          {/* Personal */}
          <Section icon="👤" label="Personal Information">
            <Field label="Full Name *">
              <input style={as.input} placeholder="e.g. Robert Fox" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} required />
            </Field>
            <div style={as.row2}>
              <Field label="Email Address *">
                <input style={as.input} type="email" placeholder="robert.f@company.com" value={form.email} onChange={(e) => update("email", e.target.value)} required />
              </Field>
              <Field label="Phone Number">
                <input style={as.input} placeholder="+1 (555) 000-0000" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
              </Field>
            </div>
          </Section>

          {/* Account */}
          <Section icon="⚙️" label="Account Configuration">
            <div style={as.row2}>
              <Field label="System Role *">
                <select style={as.input} value={form.role} onChange={(e) => update("role", e.target.value)} required>
                  <option value="">Select a role</option>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Initial Status">
                <select style={as.input} value={form.status} onChange={(e) => update("status", e.target.value as UserStatus)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>
            <p style={as.hint}>☑ User will receive an email invitation to set their initial password.</p>
          </Section>

          {/* Facility */}
          <Section icon="🏢" label="Facility Assignment">
            <Field label="Primary Department">
              <input style={as.input} placeholder="e.g. Maintenance, Operations" value={form.department} onChange={(e) => update("department", e.target.value)} />
            </Field>
            <Field label="Assigned Localities / Facilities">
              <input style={as.input} placeholder="e.g. Pune, Sambhaji Nagar / Vikram Monarch, AMTC, etc." value={form.localities} onChange={(e) => update("localities", e.target.value)} />
            </Field>
          </Section>

          <div style={as.actions}>
            <button type="button" style={as.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" style={as.saveBtn}>Save User</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 700, color: "var(--c-text)", paddingBottom: 8, marginBottom: 12, borderBottom: "1px solid var(--c-divider)" }}>
        <span>{icon}</span>{label}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--c-text-muted)" }}>{label}</label>
      {children}
    </div>
  );
}

const as: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(15,23,42,0.45)",
    zIndex: 200,
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%", maxWidth: 540,
    maxHeight: "92vh",
    background: "var(--c-card)",
    border: "1px solid var(--c-card-border)",
    borderRadius: 16,
    display: "flex", flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
  },
  header: {
    display: "flex", alignItems: "flex-start", justifyContent: "space-between",
    padding: "22px 24px 14px",
    borderBottom: "1px solid var(--c-divider)",
    gap: 12,
  },
  title: { margin: 0, fontSize: 18, fontWeight: 800, color: "var(--c-text)" },
  subtitle: { margin: "4px 0 0", fontSize: 12.5, color: "var(--c-text-muted)" },
  closeBtn: {
    width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
    border: "1px solid var(--c-input-border)", borderRadius: 8,
    background: "var(--c-card)", color: "var(--c-text-muted)", cursor: "pointer", flexShrink: 0,
  },
  form: { flex: 1, overflowY: "auto" as const, padding: "20px 24px 24px" },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  input: {
    padding: "9px 12px", fontSize: 13.5,
    border: "1px solid var(--c-input-border)", borderRadius: 8,
    outline: "none", color: "var(--c-text)", background: "var(--c-input-bg)",
    width: "100%", boxSizing: "border-box" as const,
  },
  hint: { margin: 0, fontSize: 12, color: "var(--c-text-faint)" },
  actions: {
    display: "flex", justifyContent: "flex-end", gap: 10,
    paddingTop: 8, borderTop: "1px solid var(--c-divider)", marginTop: 4,
  },
  cancelBtn: {
    padding: "9px 20px", fontSize: 13.5, fontWeight: 600,
    border: "1px solid var(--c-input-border)", borderRadius: 8,
    background: "var(--c-card)", color: "var(--c-text-2)", cursor: "pointer",
  },
  saveBtn: {
    padding: "9px 22px", fontSize: 13.5, fontWeight: 600,
    border: "none", borderRadius: 8,
    background: "#2563eb", color: "#ffffff", cursor: "pointer",
  },
};

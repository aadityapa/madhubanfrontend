import { AlertTriangle, Check, Clock } from "lucide-react";
import { useState } from "react";
import { ROLES, roleBadgeStyle, statusDotColor, type User } from "./types";
import {
  getEmailError,
  getIndianMobileError,
  getRequiredError,
  validationStyles,
} from "../../utils/validation";

const FACILITIES = [
  { id: "nwp", label: "North Wing Plaza", sub: "Building A, 4205 Industrial Way", primary: true },
  { id: "dth", label: "Downtown Tech Hub", sub: "Suite 500, 12 Innovation St" },
  { id: "elc", label: "East Logistics Center", sub: "Warehouse 3, 85 West Blvd" },
  { id: "ssf", label: "Southern Solar Farm", sub: "Zone B4, 14 Valley Rd" },
];

export function EditUserModal({
  user,
  managers,
  supervisors,
  onClose,
  onSave,
}: {
  user: User;
  managers: Array<{ id: string; name: string }>;
  supervisors: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSave: (u: User) => void;
}) {
  const [form, setForm] = useState({
    fullName: user.name,
    email: user.email,
    phone: user.phone ?? "",
    jobTitle: user.jobTitle ?? user.role,
    role: user.role,
    status: user.status,
    managerId: user.managerId ?? "",
    supervisorId: user.supervisorId ?? "",
    twoFactor: true,
    selectedFacilities: user.facilities ?? ["North Wing Plaza"],
  });
  const [errors, setErrors] = useState<
    Partial<Record<"fullName" | "email" | "phone" | "jobTitle" | "managerId" | "supervisorId", string>>
  >({});

  function update<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: val }));
    if (
      key === "fullName" ||
      key === "email" ||
      key === "phone" ||
      key === "jobTitle" ||
      key === "managerId" ||
      key === "supervisorId"
    ) {
      setErrors((current) => ({ ...current, [key]: undefined }));
    }
  }

  function toggleFacility(label: string) {
    setForm((f) => ({
      ...f,
      selectedFacilities: f.selectedFacilities.includes(label)
        ? f.selectedFacilities.filter((x) => x !== label)
        : [...f.selectedFacilities, label],
    }));
  }

  function validate() {
    const nextErrors: Partial<Record<"fullName" | "email" | "phone" | "jobTitle" | "managerId" | "supervisorId", string>> = {
      fullName: getRequiredError(form.fullName, "Please enter the user's full name.") ?? undefined,
      email: getEmailError(form.email) ?? undefined,
      jobTitle: getRequiredError(form.jobTitle, "Please enter the user's job title.") ?? undefined,
    };
    if (form.role === "Supervisor") {
      nextErrors.managerId = getRequiredError(
        form.managerId,
        "Please select a manager for this supervisor.",
      ) ?? undefined;
    }
    if (form.role === "Staff") {
      nextErrors.supervisorId = getRequiredError(
        form.supervisorId,
        "Please select a supervisor for this staff member.",
      ) ?? undefined;
    }
    if (String(form.phone || "").trim()) {
      nextErrors.phone = getIndianMobileError(form.phone) ?? undefined;
    }
    setErrors(nextErrors);
    return Object.values(nextErrors).every((value) => !value);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      ...user,
      name: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      jobTitle: form.jobTitle.trim(),
      role: form.role,
      status: form.status,
      managerId: form.managerId || undefined,
      managerName: managers.find((item) => item.id === form.managerId)?.name,
      supervisorId: form.supervisorId || undefined,
      supervisorName: supervisors.find((item) => item.id === form.supervisorId)?.name,
      facilities: form.selectedFacilities,
    });
    onClose();
  }

  return (
    <div style={es.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={es.panel}>
        <div style={es.header}>
          <div>
            <div style={es.breadcrumb}>Users &rsaquo; Edit User</div>
            <h2 style={es.title}>Edit User: {user.name}</h2>
            <p style={es.subtitle}>Update profile details, permissions, and location access.</p>
          </div>
          <span
            style={{
              ...es.statusBadge,
              background: "#dcfce7",
              color: "#15803d",
              borderColor: "#bbf7d0",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: statusDotColor(user.status),
                display: "inline-block",
                marginRight: 4,
              }}
            />
            {user.status}
          </span>
        </div>

        <div style={es.profileCard}>
          <div style={{ ...es.avatar, background: user.avatarColor }}>{user.initials}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--c-text)" }}>{user.name}</div>
            <div style={{ fontSize: 12.5, color: "var(--c-text-muted)", marginTop: 2 }}>
              {form.jobTitle} · {form.selectedFacilities[0] ?? "No facility"}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                color: "var(--c-text-faint)",
                marginTop: 4,
              }}
            >
              <Clock size={12} /> Last login: {user.lastLogin}
            </div>
          </div>
          <span
            style={{
              ...roleBadgeStyle(form.role),
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {form.role}
          </span>
        </div>

        <form onSubmit={handleSave} style={es.form}>
          <div style={es.section}>
            <div style={es.sectionTitle}>Personal Information</div>
            <div style={es.row2}>
              <Field label="Full Name" error={errors.fullName}>
                <input
                  style={{ ...es.input, ...(errors.fullName ? validationStyles.inputErrorBorder : null) }}
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                />
              </Field>
              <Field label="Email Address" error={errors.email}>
                <input
                  style={{ ...es.input, ...(errors.email ? validationStyles.inputErrorBorder : null) }}
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </Field>
            </div>
            <div style={es.row2}>
              <Field label="Phone Number" error={errors.phone}>
                <input
                  style={{ ...es.input, ...(errors.phone ? validationStyles.inputErrorBorder : null) }}
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                />
              </Field>
              <Field label="Job Title" error={errors.jobTitle}>
                <input
                  style={{ ...es.input, ...(errors.jobTitle ? validationStyles.inputErrorBorder : null) }}
                  value={form.jobTitle}
                  onChange={(e) => update("jobTitle", e.target.value)}
                />
              </Field>
            </div>
          </div>

          <div style={es.section}>
            <div style={es.sectionTitle}>Account Configuration</div>
            <div style={es.row2}>
              <Field label="User Role">
                <select
                  style={es.input}
                  value={form.role}
                  onChange={(e) => update("role", e.target.value as typeof form.role)}
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Preferred Language">
                <select style={es.input} value="en" disabled>
                  <option value="en">English (US)</option>
                  <option value="hi">Hindi</option>
                </select>
              </Field>
            </div>
            {form.role === "Supervisor" ? (
              <Field label="Assigned Manager" error={errors.managerId}>
                <select
                  style={{ ...es.input, ...(errors.managerId ? validationStyles.inputErrorBorder : null) }}
                  value={form.managerId}
                  onChange={(e) => update("managerId", e.target.value)}
                >
                  <option value="">Select a manager</option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
            {form.role === "Staff" ? (
              <Field label="Assigned Supervisor" error={errors.supervisorId}>
                <select
                  style={{ ...es.input, ...(errors.supervisorId ? validationStyles.inputErrorBorder : null) }}
                  value={form.supervisorId}
                  onChange={(e) => update("supervisorId", e.target.value)}
                >
                  <option value="">Select a supervisor</option>
                  {supervisors.map((supervisor) => (
                    <option key={supervisor.id} value={supervisor.id}>
                      {supervisor.name}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
            <div style={es.toggleRow}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--c-text)" }}>
                  Two-Factor Authentication
                </div>
                <div style={{ fontSize: 12, color: "var(--c-text-muted)", marginTop: 2 }}>
                  Require a code for logins from new devices
                </div>
              </div>
              <button
                type="button"
                style={{ ...es.toggle, background: form.twoFactor ? "#2563eb" : "var(--c-input-border)" }}
                onClick={() => update("twoFactor", !form.twoFactor)}
              >
                <span
                  style={{
                    ...es.toggleThumb,
                    transform: form.twoFactor ? "translateX(18px)" : "translateX(0)",
                  }}
                />
              </button>
            </div>
          </div>

          <div style={es.section}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={es.sectionTitle}>Facility Assignment</div>
              <button
                type="button"
                style={es.selectAllBtn}
                onClick={() => update("selectedFacilities", FACILITIES.map((facility) => facility.label))}
              >
                Select All
              </button>
            </div>
            <input style={es.searchInput} placeholder="Search facilities..." />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {FACILITIES.map((facility) => {
                const checked = form.selectedFacilities.includes(facility.label);
                return (
                  <div
                    key={facility.id}
                    style={{
                      ...es.facilityRow,
                      background: checked ? "#eff6ff" : "var(--c-input-bg)",
                      borderColor: checked ? "#bfdbfe" : "var(--c-card-border)",
                    }}
                    onClick={() => toggleFacility(facility.label)}
                  >
                    <div
                      style={{
                        ...es.checkbox,
                        background: checked ? "#2563eb" : "var(--c-card)",
                        borderColor: checked ? "#2563eb" : "var(--c-input-border)",
                      }}
                    >
                      {checked && <Check size={11} color="#fff" strokeWidth={3} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--c-text)" }}>
                        {facility.label}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--c-text-muted)" }}>{facility.sub}</div>
                    </div>
                    {facility.primary ? <span style={es.primaryBadge}>Primary</span> : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={es.footer}>
            <button type="button" style={es.deactivateBtn}>
              <AlertTriangle size={14} /> Deactivate User
            </button>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" style={es.cancelBtn} onClick={onClose}>
                Cancel
              </button>
              <button type="submit" style={es.saveBtn}>
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--c-text-muted)" }}>{label}</label>
      {children}
      {error ? <div style={validationStyles.errorText}>{error}</div> : null}
    </div>
  );
}

const es: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.45)",
    zIndex: 200,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  panel: {
    width: "100%",
    maxWidth: 680,
    maxHeight: "92vh",
    background: "var(--c-card)",
    border: "1px solid var(--c-card-border)",
    borderRadius: 16,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: "22px 24px 14px",
    borderBottom: "1px solid var(--c-divider)",
    gap: 12,
  },
  breadcrumb: { fontSize: 12, color: "var(--c-text-muted)", marginBottom: 4 },
  title: { margin: 0, fontSize: 18, fontWeight: 800, color: "var(--c-text)" },
  subtitle: { margin: "4px 0 0", fontSize: 12.5, color: "var(--c-text-muted)" },
  statusBadge: {
    fontSize: 11.5,
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: 20,
    border: "1px solid",
    display: "inline-flex",
    alignItems: "center",
    flexShrink: 0,
  },
  profileCard: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 24px",
    background: "var(--c-input-bg)",
    borderBottom: "1px solid var(--c-divider)",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    flexShrink: 0,
  },
  form: { flex: 1, overflowY: "auto" as const, padding: "20px 24px" },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "var(--c-text)",
    paddingBottom: 10,
    marginBottom: 14,
    borderBottom: "1px solid var(--c-divider)",
  },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 },
  input: {
    padding: "9px 12px",
    fontSize: 13.5,
    border: "1px solid var(--c-input-border)",
    borderRadius: 8,
    outline: "none",
    color: "var(--c-text)",
    background: "var(--c-input-bg)",
    width: "100%",
    boxSizing: "border-box" as const,
  },
  toggleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 14px",
    background: "var(--c-input-bg)",
    border: "1px solid var(--c-card-border)",
    borderRadius: 10,
  },
  toggle: {
    width: 40,
    height: 22,
    borderRadius: 99,
    border: "none",
    cursor: "pointer",
    padding: 2,
    display: "flex",
    alignItems: "center",
    transition: "background 0.2s",
    flexShrink: 0,
  },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: "#ffffff",
    display: "block",
    transition: "transform 0.2s",
    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
  },
  selectAllBtn: {
    fontSize: 12.5,
    fontWeight: 600,
    color: "#2563eb",
    border: "none",
    background: "none",
    cursor: "pointer",
    padding: 0,
  },
  searchInput: {
    width: "100%",
    padding: "8px 12px",
    fontSize: 13.5,
    border: "1px solid var(--c-input-border)",
    borderRadius: 8,
    outline: "none",
    color: "var(--c-text)",
    background: "var(--c-input-bg)",
    boxSizing: "border-box" as const,
    marginBottom: 10,
  },
  facilityRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "11px 14px",
    borderRadius: 10,
    border: "1px solid",
    cursor: "pointer",
    transition: "background 0.15s, border-color 0.15s",
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    border: "2px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "background 0.15s, border-color 0.15s",
  },
  primaryBadge: {
    fontSize: 11,
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: 20,
    background: "#dbeafe",
    color: "#1d4ed8",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    marginTop: 4,
    borderTop: "1px solid var(--c-divider)",
  },
  deactivateBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 600,
    border: "1px solid #fca5a5",
    borderRadius: 8,
    background: "#fff1f2",
    color: "#dc2626",
    cursor: "pointer",
  },
  cancelBtn: {
    padding: "9px 20px",
    fontSize: 13.5,
    fontWeight: 600,
    border: "1px solid var(--c-input-border)",
    borderRadius: 8,
    background: "var(--c-card)",
    color: "var(--c-text-2)",
    cursor: "pointer",
  },
  saveBtn: {
    padding: "9px 22px",
    fontSize: 13.5,
    fontWeight: 600,
    border: "none",
    borderRadius: 8,
    background: "#2563eb",
    color: "#ffffff",
    cursor: "pointer",
  },
};

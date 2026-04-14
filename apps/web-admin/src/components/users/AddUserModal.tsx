import { Eye, EyeOff, X } from "lucide-react";
import { useState } from "react";
import { ROLES, STATUSES, type User, type UserRole, type UserStatus } from "./types";
import {
  getAlphabeticError,
  getConfirmPasswordError,
  getEmailError,
  getIndianMobileError,
  getPasswordError,
  getRequiredError,
  sanitizeAlphabetic,
  sanitizeDigits,
  validationStyles,
} from "../../utils/validation";

interface AddUserForm {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  role: UserRole | "";
  status: UserStatus;
  department: string;
  managerId: string;
  supervisorId: string;
  localities: string;
}

const EMPTY: AddUserForm = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  role: "",
  status: "Active",
  department: "",
  managerId: "",
  supervisorId: "",
  localities: "",
};

const AVATAR_COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

export function AddUserModal({
  totalCount,
  managers,
  supervisors,
  onClose,
  onSave,
}: {
  totalCount: number;
  managers: Array<{ id: string; name: string }>;
  supervisors: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSave: (u: User) => void;
}) {
  const [form, setForm] = useState<AddUserForm>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof AddUserForm, string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function update(k: keyof AddUserForm, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((current) => ({ ...current, [k]: undefined }));
  }

  function validate(next: AddUserForm) {
    const nextErrors: Partial<Record<keyof AddUserForm, string>> = {
      fullName: getAlphabeticError(next.fullName, "Please enter the user's full name.") ?? undefined,
      email: getEmailError(next.email) ?? undefined,
      password: getPasswordError(next.password, "Please enter a password.") ?? undefined,
      confirmPassword: getConfirmPasswordError(next.password, next.confirmPassword) ?? undefined,
      role: getRequiredError(next.role, "Please select a system role.") ?? undefined,
    };
    if (String(next.department || "").trim()) {
      nextErrors.department = getAlphabeticError(
        next.department,
        "Please enter the department name.",
      ) ?? undefined;
    }
    if (next.role === "Supervisor") {
      nextErrors.managerId = getRequiredError(
        next.managerId,
        "Please select a manager for this supervisor.",
      ) ?? undefined;
    }
    if (next.role === "Staff") {
      nextErrors.supervisorId = getRequiredError(
        next.supervisorId,
        "Please select a supervisor for this staff member.",
      ) ?? undefined;
    }

    if (String(next.phone || "").trim()) {
      nextErrors.phone = getIndianMobileError(next.phone) ?? undefined;
    }

    setErrors(nextErrors);
    return Object.values(nextErrors).every((value) => !value);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!validate(form)) return;
    const initials = form.fullName
      .split(" ")
      .map((word) => word[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
    onSave({
      id: Date.now(),
      apiId: "",
      name: form.fullName.trim(),
      email: form.email.trim(),
      password: form.password,
      confirmPassword: form.confirmPassword,
      phone: form.phone.trim(),
      role: form.role as UserRole,
      status: form.status,
      department: form.department.trim(),
      managerId: form.managerId || undefined,
      managerName: managers.find((item) => item.id === form.managerId)?.name,
      supervisorId: form.supervisorId || undefined,
      supervisorName: supervisors.find((item) => item.id === form.supervisorId)?.name,
      lastLogin: "Just now",
      initials,
      avatarColor: AVATAR_COLORS[totalCount % AVATAR_COLORS.length],
      facilities: form.localities ? [form.localities.trim()] : [],
    });
    onClose();
  }

  return (
    <div style={as.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={as.card}>
        <div style={as.header}>
          <div>
            <h2 style={as.title}>Add New User</h2>
            <p style={as.subtitle}>Create a new system account and define access.</p>
          </div>
          <button style={as.closeBtn} onClick={onClose}>
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSave} style={as.form}>
          <Section icon="Profile" label="Personal Information">
            <Field label="Full Name *" error={errors.fullName}>
              <input
                style={{ ...as.input, ...(errors.fullName ? validationStyles.inputErrorBorder : null) }}
                placeholder="e.g. Robert Fox"
                value={form.fullName}
                maxLength={50}
                onChange={(e) => update("fullName", sanitizeAlphabetic(e.target.value))}
              />
            </Field>
            <div style={as.row2}>
              <Field label="Email Address *" error={errors.email}>
                <input
                  style={{ ...as.input, ...(errors.email ? validationStyles.inputErrorBorder : null) }}
                  type="email"
                  placeholder="robert.f@company.com"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </Field>
              <Field label="Password *" error={errors.password}>
                <div style={as.passwordWrap}>
                  <input
                    style={{ ...as.input, ...as.passwordInput, ...(errors.password ? validationStyles.inputErrorBorder : null) }}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter a password"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                  />
                  <button
                    type="button"
                    style={as.passwordToggle}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
            </div>
            <div style={as.row2}>
              <Field label="Confirm Password *" error={errors.confirmPassword}>
                <div style={as.passwordWrap}>
                  <input
                    style={{ ...as.input, ...as.passwordInput, ...(errors.confirmPassword ? validationStyles.inputErrorBorder : null) }}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    value={form.confirmPassword}
                    onChange={(e) => update("confirmPassword", e.target.value)}
                  />
                  <button
                    type="button"
                    style={as.passwordToggle}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    onClick={() => setShowConfirmPassword((current) => !current)}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
              <Field label="Phone Number" error={errors.phone}>
                <input
                  style={{ ...as.input, ...(errors.phone ? validationStyles.inputErrorBorder : null) }}
                  placeholder="9876543210"
                  value={form.phone}
                  inputMode="numeric"
                  maxLength={10}
                  onChange={(e) => update("phone", sanitizeDigits(e.target.value).slice(0, 10))}
                />
              </Field>
            </div>
          </Section>

          <Section icon="Access" label="Account Configuration">
            <div style={as.row2}>
              <Field label="System Role *" error={errors.role}>
                <select
                  style={{ ...as.input, ...(errors.role ? validationStyles.inputErrorBorder : null) }}
                  value={form.role}
                  onChange={(e) => update("role", e.target.value)}
                >
                  <option value="">Select a role</option>
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Initial Status">
                <select
                  style={as.input}
                  value={form.status}
                  onChange={(e) => update("status", e.target.value as UserStatus)}
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            {form.role === "Supervisor" ? (
              <Field label="Assigned Manager *" error={errors.managerId}>
                <select
                  style={{ ...as.input, ...(errors.managerId ? validationStyles.inputErrorBorder : null) }}
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
              <Field label="Assigned Supervisor *" error={errors.supervisorId}>
                <select
                  style={{ ...as.input, ...(errors.supervisorId ? validationStyles.inputErrorBorder : null) }}
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
            <p style={as.hint}>User will receive an email invitation to set their initial password.</p>
          </Section>

          <Section icon="Facility" label="Facility Assignment">
            <Field label="Primary Department">
              <input
                style={{ ...as.input, ...(errors.department ? validationStyles.inputErrorBorder : null) }}
                placeholder="e.g. Maintenance, Operations"
                value={form.department}
                maxLength={40}
                onChange={(e) => update("department", sanitizeAlphabetic(e.target.value))}
              />
            </Field>
            <Field label="Assigned Localities / Facilities">
              <input
                style={as.input}
                placeholder="e.g. Pune, Sambhaji Nagar / Vikram Monarch, AMTC, etc."
                value={form.localities}
                onChange={(e) => update("localities", e.target.value)}
              />
            </Field>
          </Section>

          <div style={as.actions}>
            <button type="button" style={as.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" style={as.saveBtn}>
              Save User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          fontSize: 13,
          fontWeight: 700,
          color: "var(--c-text)",
          paddingBottom: 8,
          marginBottom: 12,
          borderBottom: "1px solid var(--c-divider)",
        }}
      >
        <span>{icon}</span>
        {label}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
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

const as: Record<string, React.CSSProperties> = {
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
  card: {
    width: "100%",
    maxWidth: 540,
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
  title: { margin: 0, fontSize: 18, fontWeight: 800, color: "var(--c-text)" },
  subtitle: { margin: "4px 0 0", fontSize: 12.5, color: "var(--c-text-muted)" },
  closeBtn: {
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid var(--c-input-border)",
    borderRadius: 8,
    background: "var(--c-card)",
    color: "var(--c-text-muted)",
    cursor: "pointer",
    flexShrink: 0,
  },
  form: { flex: 1, overflowY: "auto" as const, padding: "20px 24px 24px" },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
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
  passwordWrap: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 40,
  },
  passwordToggle: {
    position: "absolute",
    top: "50%",
    right: 10,
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    color: "var(--c-text-muted)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
  },
  hint: { margin: 0, fontSize: 12, color: "var(--c-text-faint)" },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    paddingTop: 8,
    borderTop: "1px solid var(--c-divider)",
    marginTop: 4,
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

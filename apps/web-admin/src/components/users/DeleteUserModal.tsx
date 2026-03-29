import { AlertTriangle, X } from "lucide-react";
import type { User } from "./types";

export function DeleteUserModal({
  user,
  onClose,
  onConfirm,
}: {
  user: User;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div style={ds.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={ds.card}>
        {/* Close */}
        <button style={ds.closeBtn} onClick={onClose}>
          <X size={16} />
        </button>

        {/* Icon + heading */}
        <div style={ds.iconWrap}>
          <AlertTriangle size={22} color="#dc2626" />
        </div>
        <h2 style={ds.title}>Delete User</h2>
        <p style={ds.body}>
          Are you sure you want to delete{" "}
          <strong style={{ color: "#0f172a" }}>{user.name}</strong>? This action
          cannot be undone. All associated data, activity logs, and permissions
          will be permanently removed from the database.
        </p>

        {/* User preview */}
        <div style={ds.userPreview}>
          <div style={{ ...ds.avatar, background: user.avatarColor }}>{user.initials}</div>
          <div>
            <div style={ds.previewName}>{user.name}</div>
            <div style={ds.previewMeta}>
              {user.email} · ID: USR-{String(9000 + user.id)}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={ds.actions}>
          <button style={ds.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={ds.deleteBtn} onClick={() => { onConfirm(); onClose(); }}>
            Delete User
          </button>
        </div>
      </div>
    </div>
  );
}

const ds: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(15,23,42,0.5)",
    zIndex: 300,
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%", maxWidth: 440,
    background: "#ffffff",
    borderRadius: 16,
    padding: "28px 28px 24px",
    position: "relative" as const,
    boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
  },
  closeBtn: {
    position: "absolute" as const, top: 16, right: 16,
    width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
    border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff",
    cursor: "pointer", color: "#64748b",
  },
  iconWrap: {
    width: 48, height: 48, borderRadius: 12,
    background: "#fef2f2", border: "1px solid #fecaca",
    display: "flex", alignItems: "center", justifyContent: "center",
    marginBottom: 16,
  },
  title: { margin: "0 0 10px", fontSize: 18, fontWeight: 800, color: "#0f172a" },
  body: { margin: "0 0 20px", fontSize: 13.5, color: "#475569", lineHeight: 1.65 },
  userPreview: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "12px 14px",
    background: "#f8fafc",
    border: "1px solid #e9eef5",
    borderRadius: 10,
    marginBottom: 22,
  },
  avatar: {
    width: 38, height: 38, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0,
  },
  previewName: { fontSize: 13.5, fontWeight: 700, color: "#0f172a" },
  previewMeta: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  actions: { display: "flex", gap: 10, justifyContent: "flex-end" },
  cancelBtn: {
    padding: "9px 22px", fontSize: 13.5, fontWeight: 600,
    border: "1px solid #e2e8f0", borderRadius: 8,
    background: "#fff", color: "#475569", cursor: "pointer",
  },
  deleteBtn: {
    padding: "9px 22px", fontSize: 13.5, fontWeight: 600,
    border: "none", borderRadius: 8,
    background: "#dc2626", color: "#ffffff", cursor: "pointer",
  },
};

import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Pencil,
  RefreshCw,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { AddUserModal } from "../components/users/AddUserModal";
import { DeleteUserModal } from "../components/users/DeleteUserModal";
import { EditUserModal } from "../components/users/EditUserModal";
import { ViewUserModal } from "../components/users/ViewUserModal";
import {
  ROLES,
  STATUSES,
  roleBadgeStyle,
  statusDotColor,
  type User,
  type UserRole,
  type UserStatus,
} from "../components/users/types";
import { useShellHeader } from "../context/ShellHeaderContext";

// ─── Mock data ────────────────────────────────────────────────────────────────
const INITIAL_USERS: User[] = [
  {
    id: 1, name: "Johnathan Doe", email: "j.doe@facilitymanagement.com",
    phone: "+1 (555) 902-3481", jobTitle: "Senior Facility Manager",
    role: "Admin", status: "Active", lastLogin: "2 hours ago",
    initials: "JD", avatarColor: "#6366f1",
    department: "Operations & Maintenance", employeeId: "FMS-8829-JD",
    reportsTo: "Sarah Jenkins",
    workAddress: "102 Main Street, Central Plaza, North Wing, Suite 405",
    facilities: ["North Wing Plaza", "Central Tower"],
  },
  {
    id: 2, name: "Sarah Chen", email: "s.chen@facilitymanagement.com",
    phone: "+1 (555) 234-5678", jobTitle: "Facility Manager",
    role: "Manager", status: "Active", lastLogin: "5 mins ago",
    initials: "SC", avatarColor: "#0ea5e9",
    department: "Facilities", facilities: ["North Wing Plaza", "Downtown Tech Hub"],
  },
  {
    id: 3, name: "Mike Ross", email: "m.ross@facilitymanagement.com",
    phone: "+1 (555) 345-6789", jobTitle: "Operations Supervisor",
    role: "Supervisor", status: "Suspended", lastLogin: "1 day ago",
    initials: "MR", avatarColor: "#f59e0b",
    department: "Operations", facilities: ["East Logistics Center"],
  },
  {
    id: 4, name: "Emily Watson", email: "e.watson@facilitymanagement.com",
    phone: "+1 (555) 456-7890", jobTitle: "Maintenance Staff",
    role: "Staff", status: "Active", lastLogin: "3 days ago",
    initials: "EW", avatarColor: "#10b981",
    department: "Maintenance", facilities: ["Southern Solar Farm"],
  },
  {
    id: 5, name: "Rajiv Malhotra", email: "r.malhotra@facilitymanagement.com",
    role: "Supervisor", status: "Active", lastLogin: "Just now",
    initials: "RM", avatarColor: "#8b5cf6", department: "Security",
    facilities: [],
  },
  {
    id: 6, name: "Priya Nair", email: "p.nair@facilitymanagement.com",
    role: "Staff", status: "Active", lastLogin: "10 mins ago",
    initials: "PN", avatarColor: "#ec4899", department: "Housekeeping",
    facilities: [],
  },
];

type ModalState =
  | { type: "none" }
  | { type: "add" }
  | { type: "view"; user: User }
  | { type: "edit"; user: User }
  | { type: "delete"; user: User };

const PAGE_SIZE = 5;

export function UserManagementPage() {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalState>({ type: "none" });

  useShellHeader({
    title: "User Management",
    badge: `${users.length} USERS TOTAL`,
    showSearch: false,
    actions: (
      <button style={ts.addBtn} onClick={() => setModal({ type: "add" })}>
        <UserPlus size={15} /> Add New User
      </button>
    ),
  });

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
      (!roleFilter || u.role === roleFilter) &&
      (!statusFilter || u.status === statusFilter)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleAdd(u: User) {
    setUsers((prev) => [...prev, u]);
  }

  function handleSaveEdit(updated: User) {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  }

  function handleDelete(id: number) {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  return (
    <div>
      <div style={ts.card}>
        {/* Toolbar */}
        <div style={ts.toolbar}>
          <input
            style={ts.searchInput}
            placeholder="Search by name, email or ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <div style={ts.toolbarRight}>
            <select style={ts.select} value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value as UserRole | ""); setPage(1); }}>
              <option value="">All Roles</option>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <select style={ts.select} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as UserStatus | ""); setPage(1); }}>
              <option value="">All Status</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button style={ts.iconBtn}>
              <Filter size={14} /> Advanced Filters
            </button>
            <button style={{ ...ts.iconBtn, minWidth: "auto", padding: "7px 10px" }} onClick={() => { setUsers(INITIAL_USERS); setSearch(""); setRoleFilter(""); setStatusFilter(""); setPage(1); }}>
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Table */}
        <table style={ts.table}>
          <thead>
            <tr>
              {["USER PROFILE", "ROLE", "STATUS", "LAST LOGIN", "ACTIONS"].map((h) => (
                <th key={h} style={ts.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((user) => (
              <tr key={user.id} style={ts.tr}>
                {/* Profile */}
                <td style={ts.td}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ ...ts.avatar, background: user.avatarColor }}>{user.initials}</div>
                    <div>
                      <div style={ts.userName}>{user.name}</div>
                      <div style={ts.userEmail}>{user.email}</div>
                    </div>
                  </div>
                </td>
                {/* Role */}
                <td style={ts.td}>
                  <span style={{ ...ts.badge, ...roleBadgeStyle(user.role) }}>{user.role}</span>
                </td>
                {/* Status */}
                <td style={ts.td}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: statusDotColor(user.status), flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "var(--c-text-2)", fontWeight: 500 }}>{user.status}</span>
                  </div>
                </td>
                {/* Last login */}
                <td style={{ ...ts.td, color: "var(--c-text-muted)", fontSize: 13 }}>{user.lastLogin}</td>
                {/* Actions */}
                <td style={ts.td}>
                  <div style={{ display: "flex", gap: 4 }}>
                    <ActionBtn title="View" onClick={() => setModal({ type: "view", user })}>
                      <Eye size={14} />
                    </ActionBtn>
                    <ActionBtn title="Edit" onClick={() => setModal({ type: "edit", user })}>
                      <Pencil size={14} />
                    </ActionBtn>
                    <ActionBtn title="Delete" danger onClick={() => setModal({ type: "delete", user })}>
                      <Trash2 size={14} />
                    </ActionBtn>
                  </div>
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "36px 16px", color: "var(--c-text-faint)", fontSize: 13 }}>
                  No users match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div style={ts.pagination}>
          <span style={{ fontSize: 13, color: "var(--c-text-muted)" }}>
            Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} results
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            <PageBtn disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft size={14} />
            </PageBtn>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <PageBtn key={p} active={p === page} onClick={() => setPage(p)}>{p}</PageBtn>
            ))}
            {totalPages > 5 && (
              <>
                <span style={{ padding: "6px 4px", color: "var(--c-text-faint)" }}>…</span>
                <PageBtn active={page === totalPages} onClick={() => setPage(totalPages)}>{totalPages}</PageBtn>
              </>
            )}
            <PageBtn disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight size={14} />
            </PageBtn>
          </div>
        </div>
      </div>

      {/* Modals */}
      {modal.type === "add" && (
        <AddUserModal totalCount={users.length} onClose={() => setModal({ type: "none" })} onSave={handleAdd} />
      )}
      {modal.type === "view" && (
        <ViewUserModal
          user={modal.user}
          onClose={() => setModal({ type: "none" })}
          onEdit={() => setModal({ type: "edit", user: modal.user })}
        />
      )}
      {modal.type === "edit" && (
        <EditUserModal
          user={modal.user}
          onClose={() => setModal({ type: "none" })}
          onSave={handleSaveEdit}
        />
      )}
      {modal.type === "delete" && (
        <DeleteUserModal
          user={modal.user}
          onClose={() => setModal({ type: "none" })}
          onConfirm={() => handleDelete(modal.user.id)}
        />
      )}
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────
function ActionBtn({ children, title, onClick, danger }: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 30, height: 30,
        display: "flex", alignItems: "center", justifyContent: "center",
        border: `1px solid ${danger ? "#fca5a5" : "var(--c-input-border)"}`,
        borderRadius: 7,
        background: danger ? "#fff1f2" : "var(--c-card)",
        cursor: "pointer",
        color: danger ? "#dc2626" : "var(--c-text-muted)",
        transition: "background 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function PageBtn({ children, active, disabled, onClick }: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        minWidth: 32, height: 32,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 8px", fontSize: 13,
        border: `1px solid ${active ? "#2563eb" : "var(--c-input-border)"}`,
        borderRadius: 7,
        background: active ? "#2563eb" : "var(--c-card)",
        cursor: disabled ? "not-allowed" : "pointer",
        color: active ? "#ffffff" : "var(--c-text-muted)",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ts: Record<string, React.CSSProperties> = {
  card: {
    background: "var(--c-card)",
    border: "1px solid var(--c-card-border)",
    borderRadius: 14, overflow: "hidden",
  },
  toolbar: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: 12, padding: "14px 20px",
    borderBottom: "1px solid var(--c-row-border)",
    flexWrap: "wrap",
  },
  searchInput: {
    flex: 1, minWidth: 200, maxWidth: 340,
    padding: "8px 12px", fontSize: 13.5,
    border: "1px solid var(--c-input-border)", borderRadius: 8,
    outline: "none", color: "var(--c-text)", background: "var(--c-input-bg)",
  },
  toolbarRight: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  select: {
    padding: "7px 10px", fontSize: 13,
    border: "1px solid var(--c-input-border)", borderRadius: 8,
    outline: "none", color: "var(--c-text-2)", background: "var(--c-card)", cursor: "pointer",
  },
  iconBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "7px 12px", fontSize: 13,
    border: "1px solid var(--c-input-border)", borderRadius: 8,
    background: "var(--c-card)", color: "var(--c-text-2)", cursor: "pointer", fontWeight: 500,
  },
  addBtn: {
    display: "inline-flex", alignItems: "center", gap: 7,
    padding: "8px 16px", fontSize: 13.5, fontWeight: 600,
    border: "none", borderRadius: 8,
    background: "#2563eb", color: "#ffffff", cursor: "pointer",
  },
  table: { width: "100%", borderCollapse: "collapse" as const },
  th: {
    padding: "11px 20px", textAlign: "left" as const,
    fontSize: 11, fontWeight: 700, color: "var(--c-text-faint)",
    letterSpacing: "0.6px", textTransform: "uppercase" as const,
    background: "var(--c-table-head)",
    borderBottom: "1px solid var(--c-row-border)",
  },
  tr: { borderBottom: "1px solid var(--c-row-border)" },
  td: { padding: "14px 20px", verticalAlign: "middle" as const },
  avatar: {
    width: 36, height: 36, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0,
  },
  userName: { fontSize: 13.5, fontWeight: 600, color: "var(--c-text)" },
  userEmail: { fontSize: 12, color: "var(--c-text-faint)", marginTop: 2 },
  badge: {
    display: "inline-flex", alignItems: "center",
    padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
  },
  pagination: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "12px 20px", borderTop: "1px solid var(--c-row-border)",
  },
};

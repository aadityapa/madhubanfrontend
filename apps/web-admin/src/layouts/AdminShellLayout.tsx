import containerLogo from "../assets/Container.svg";
import {
  BarChart2,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  Calculator,
  CircleHelp,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Moon,
  Search,
  ShoppingCart,
  Sparkles,
  Sun,
  Users,
  Wrench,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useShellHeaderValue } from "../context/ShellHeaderContext";
import { useTheme } from "../context/ThemeContext";
import "./admin-shell.css";

// ─── Nav config ───────────────────────────────────────────────────────────────
const PRIMARY_NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/users", label: "User Management", icon: Users },
  { to: "/properties", label: "Property Management", icon: Building2 },
  { to: "/tasks", label: "Task Manager", icon: ClipboardList },
];

const SYSTEM_NAV = [
  { to: "/hrms", label: "HRMS", icon: Briefcase },
  { to: "/sales", label: "Sales and Lease", icon: BarChart2 },
  { to: "/facilities", label: "Facility Management", icon: Wrench },
  { to: "/legal", label: "Legal and Documentations", icon: FileText },
  { to: "/accounts", label: "Accounts", icon: Calculator },
  { to: "/store", label: "Store and Purchase", icon: ShoppingCart },
  { to: "/reports", label: "Reports", icon: BookOpen },
];

// ─── Sidebar link ─────────────────────────────────────────────────────────────
function SidebarLink({
  to,
  label,
  icon: Icon,
  end,
}: {
  to: string;
  label: string;
  icon: React.ElementType;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `shell-nav__link${isActive ? " shell-nav__link--active" : ""}`
      }
    >
      <Icon size={16} className="shell-nav__icon" />
      <span>{label}</span>
    </NavLink>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  }

  return (
    <aside className="shell-sidebar">
      <div className="shell-sidebar__brand">
        <img src={containerLogo} alt="Madhuban" className="shell-sidebar__logo" />
      </div>

      <nav className="shell-nav">
        {PRIMARY_NAV.map((item) => (
          <SidebarLink key={item.to} {...item} />
        ))}
      </nav>

      <div className="shell-nav__section-label">System</div>
      <nav className="shell-nav">
        {SYSTEM_NAV.map((item) => (
          <SidebarLink key={item.to} {...item} />
        ))}
      </nav>

      <div className="shell-sidebar__profile">
        <div className="shell-sidebar__avatar">HS</div>
        <div className="shell-sidebar__profile-info">
          <span className="shell-sidebar__profile-name">Harish Sawant</span>
          <span className="shell-sidebar__profile-role">Head Administrator</span>
        </div>
        <button className="shell-sidebar__logout" title="Log out" onClick={handleLogout}>
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}

// ─── Top bar ──────────────────────────────────────────────────────────────────
function TopBar() {
  const { title, badge, actions, showSearch } = useShellHeaderValue();
  const { isDark, toggle } = useTheme();

  return (
    <header className="shell-topbar">
      <div className="shell-topbar__left">
        {showSearch && !title ? (
          <div className="shell-topbar__search">
            <Search size={15} className="shell-topbar__search-icon" />
            <input
              type="text"
              placeholder="Search anything..."
              className="shell-topbar__search-input"
            />
          </div>
        ) : (
          <div className="shell-topbar__page-ctx">
            <span className="shell-topbar__page-title">{title}</span>
            {badge && <span className="shell-topbar__badge">{badge}</span>}
          </div>
        )}
      </div>

      <div className="shell-topbar__right">
        {actions}

        <div className="shell-topbar__divider" />

        {/* Dark / Light mode toggle */}
        <button
          className="shell-topbar__icon-btn"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          onClick={toggle}
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <button className="shell-topbar__icon-btn" title="AI Assistant">
          <Sparkles size={17} />
        </button>

        <button
          className="shell-topbar__icon-btn shell-topbar__icon-btn--notify"
          title="Notifications"
        >
          <Bell size={17} />
          <span className="shell-topbar__notify-dot" />
        </button>

        <button className="shell-topbar__icon-btn" title="Help">
          <CircleHelp size={17} />
        </button>
      </div>
    </header>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export function AdminShellLayout() {
  return (
    <div className="admin-shell">
      <Sidebar />
      <div className="shell-body">
        <TopBar />
        <main className="shell-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

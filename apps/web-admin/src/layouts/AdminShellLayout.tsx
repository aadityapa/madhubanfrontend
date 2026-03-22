import { NavLink, Outlet } from "react-router-dom";
import "./admin-shell.css";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/users", label: "Users" },
];

export function AdminShellLayout() {
  return (
    <div className="admin-shell">
      <aside className="admin-shell__sidebar">
        <div className="admin-shell__brand">Madhuban 360</div>
        <nav className="admin-shell__nav">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `admin-shell__link${isActive ? " admin-shell__link--active" : ""}`
              }
              end={l.to === "/"}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="admin-shell__main">
        <Outlet />
      </main>
    </div>
  );
}

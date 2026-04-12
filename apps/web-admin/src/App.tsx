import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { ToastContainer } from "./components/Toast";
import { ShellHeaderProvider } from "./context/ShellHeaderContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { AdminShellLayout } from "./layouts/AdminShellLayout";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { ComingSoonPage } from "./pages/ComingSoonPage";
import { LoginPage } from "./pages/LoginPage";
import { PropertyManagementPage } from "./pages/PropertyManagementPage";
import { TaskManagerPage } from "./pages/TaskManagerPage";
import { UserManagementPage } from "./pages/UserManagementPage";

function RequireAuth() {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ShellHeaderProvider>
          <Routes>
            {/* Public */}
            <Route path="login" element={<LoginPage />} />

            {/* Protected shell */}
            <Route element={<RequireAuth />}>
              <Route element={<AdminShellLayout />}>
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="users" element={<UserManagementPage />} />
                <Route path="properties" element={<PropertyManagementPage />} />
                <Route path="tasks" element={<TaskManagerPage />} />

                {/* System modules – coming soon */}
                <Route path="hrms" element={<ComingSoonPage />} />
                <Route path="sales" element={<ComingSoonPage />} />
                <Route path="facilities" element={<ComingSoonPage />} />
                <Route path="legal" element={<ComingSoonPage />} />
                <Route path="accounts" element={<ComingSoonPage />} />
                <Route path="store" element={<ComingSoonPage />} />
                <Route path="reports" element={<ComingSoonPage />} />
              </Route>
            </Route>

            {/* Redirect root → dashboard, everything else → login */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          {/* Global toast overlay – rendered outside the shell so it's always on top */}
          <ToastContainer />
        </ShellHeaderProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

import { Navigate, Route, Routes } from "react-router-dom";
import { ShellHeaderProvider } from "./context/ShellHeaderContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AdminShellLayout } from "./layouts/AdminShellLayout";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { PropertyManagementPage } from "./pages/PropertyManagementPage";
import { UserManagementPage } from "./pages/UserManagementPage";

export default function App() {
  return (
    <ThemeProvider>
      <ShellHeaderProvider>
        <Routes>
          <Route element={<AdminShellLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="properties" element={<PropertyManagementPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ShellHeaderProvider>
    </ThemeProvider>
  );
}

import { Navigate, Route, Routes } from "react-router-dom";
import { AdminShellLayout } from "./layouts/AdminShellLayout";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { UsersPlaceholderPage } from "./pages/UsersPlaceholderPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AdminShellLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<UsersPlaceholderPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

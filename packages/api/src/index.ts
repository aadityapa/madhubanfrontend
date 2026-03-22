export {
  configureApiBaseUrl,
  getApiBaseUrl,
  getDevTokenFallback,
  allowDemo404Fallback,
} from "./env";
export { configureAuthTokenGetter, getAuthHeaders, readJsonOrThrow } from "./client";
export { login, type LoginResult } from "./auth";
export {
  normalizeMobile,
  mobileLogin,
  requestOtp,
  verifyOtp,
  resetPasswordWithOtp,
} from "./mobileAuth";
export {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  approveTask,
  rejectTask,
  normalizeTask,
  type TaskFilters,
} from "./tasks";
export {
  getDashboardMetrics,
  getSalesPipeline,
  getRevenue,
  getAlerts,
  getActivity,
} from "./dashboard";
export { getUsers, getUsersForAssignee, getSupervisors } from "./users";
export {
  getCurrentUser,
  changePassword,
  updateUserProfile,
  getMyTasks,
} from "./endUser";
export { getSupervisorDashboard } from "./supervisor";

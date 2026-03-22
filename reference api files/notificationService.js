/**
 * notificationService – Notifications API for mobile
 * -----------------------------------------------------------------------
 * Backend: GET /api/staff/notifications
 * Response: { success, data: { notifications: [...], unreadCount } }
 * (Manager uses same endpoint; backend filters by authenticated user role)
 */

import { API_BASE_URL } from "../../config/api";
import { getAuthHeaders } from "../../lib/apiClient";

const API = `${API_BASE_URL}/api`;

/**
 * GET /api/staff/notifications - fetch notifications for logged-in user
 * Returns: { list, unreadCount }
 */
export async function getNotifications(isManager = false) {
  const endpoint = `${API}/staff/notifications`;
  const res = await fetch(endpoint, { headers: getAuthHeaders() });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) return { list: [], unreadCount: 0 };
    throw new Error(json?.message || json?.error || "Failed to fetch notifications");
  }

  const data = json?.data ?? json;
  const notifications = data?.notifications ?? (Array.isArray(data) ? data : []);
  const list = (notifications || []).map(normalizeNotification);
  const unreadCount =
    typeof data?.unreadCount === "number" && Number.isInteger(data.unreadCount)
      ? data.unreadCount
      : list.filter((n) => !n.read).length;

  return { list, unreadCount };
}

/**
 * PATCH /api/staff/notifications/:id/read - mark notification as read
 */
export async function markAsRead(id) {
  const base = `${API}/staff/notifications`;
  const res = await fetch(`${base}/${id}/read`, {
    method: "PATCH",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ read: true }),
  });
  if (!res.ok && res.status !== 404) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json?.message || json?.error || "Failed to mark as read");
  }
  return { success: true };
}

function normalizeNotification(n) {
  return {
    id: n.id ?? n._id,
    type: n.type ?? "default",
    title: n.title ?? "Notification",
    description: n.description ?? n.body ?? "",
    entityType: n.entityType ?? null,
    entityId: n.entityId ?? null,
    createdAt: n.createdAt ?? n.created_at ?? new Date().toISOString(),
    read: Boolean(n.read),
    readAt: n.readAt ?? null,
  };
}

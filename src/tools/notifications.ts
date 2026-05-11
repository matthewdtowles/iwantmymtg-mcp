import { z } from "zod";
import { apiFetch } from "../api-client.js";

export const listNotificationsTool = {
  name: "list_notifications",
  description:
    "List the authenticated user's price alert notifications, newest first. Includes both read and unread. Requires IWMM_API_KEY.",
  inputSchema: z.object({}),
  handler: () => apiFetch({ path: "/api/v1/notifications", authenticated: true }),
};

export const getUnreadCountTool = {
  name: "get_unread_notification_count",
  description: "Get the count of unread notifications for the authenticated user. Requires IWMM_API_KEY.",
  inputSchema: z.object({}),
  handler: () => apiFetch({ path: "/api/v1/notifications/unread-count", authenticated: true }),
};

export const markNotificationReadTool = {
  name: "mark_notification_read",
  description: "Mark a single notification as read. Requires IWMM_API_KEY.",
  inputSchema: z.object({ id: z.string() }),
  handler: ({ id }: { id: string }) =>
    apiFetch({ path: `/api/v1/notifications/${encodeURIComponent(id)}/read`, method: "PATCH", authenticated: true }),
};

export const markAllNotificationsReadTool = {
  name: "mark_all_notifications_read",
  description: "Mark every notification for the authenticated user as read. Requires IWMM_API_KEY.",
  inputSchema: z.object({}),
  handler: () => apiFetch({ path: "/api/v1/notifications/read-all", method: "PATCH", authenticated: true }),
};

import { z } from "zod";
import { apiClient, AUTH_HEADERS, unwrap } from "../api-client.js";

export const listNotificationsTool = {
  name: "list_notifications",
  description:
    "List the authenticated user's price alert notifications, newest first. Includes both read and unread. Requires IWMM_API_KEY.",
  inputSchema: z.object({}),
  handler: async () => {
    const { data, error } = await apiClient.GET("/api/v1/notifications", {
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
};

export const getUnreadCountTool = {
  name: "get_unread_notification_count",
  description: "Get the count of unread notifications for the authenticated user. Requires IWMM_API_KEY.",
  inputSchema: z.object({}),
  handler: async () => {
    const { data, error } = await apiClient.GET("/api/v1/notifications/unread-count", {
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
};

export const markNotificationReadTool = {
  name: "mark_notification_read",
  description: "Mark a single notification as read. Requires IWMM_API_KEY.",
  inputSchema: z.object({ id: z.string() }),
  handler: async ({ id }: { id: string }) => {
    const { data, error } = await apiClient.PATCH("/api/v1/notifications/{id}/read", {
      params: { path: { id } as never },
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
};

export const markAllNotificationsReadTool = {
  name: "mark_all_notifications_read",
  description: "Mark every notification for the authenticated user as read. Requires IWMM_API_KEY.",
  inputSchema: z.object({}),
  handler: async () => {
    const { data, error } = await apiClient.PATCH("/api/v1/notifications/read-all", {
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
};

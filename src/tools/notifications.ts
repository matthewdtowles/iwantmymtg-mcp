import { z } from "zod";
import { AUTH_HEADERS, apiClient, unwrap } from "../api-client.js";
import { defineTool } from "./types.js";

export const listNotificationsTool = defineTool({
  name: "list_notifications",
  requiresAuth: true,
  readOnly: true,
  description:
    "List the authenticated user's price alert notifications, newest first. Includes both read and unread.",
  inputSchema: z.object({}),
  handler: async () => {
    const { data, error } = await apiClient.GET("/api/v1/notifications", {
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

export const getUnreadCountTool = defineTool({
  name: "get_unread_notification_count",
  requiresAuth: true,
  readOnly: true,
  description: "Get the count of unread notifications for the authenticated user.",
  inputSchema: z.object({}),
  handler: async () => {
    const { data, error } = await apiClient.GET("/api/v1/notifications/unread-count", {
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

export const markNotificationReadTool = defineTool({
  name: "mark_notification_read",
  requiresAuth: true,
  description: "Mark a single notification as read.",
  inputSchema: z.object({ id: z.coerce.number().int() }),
  handler: async ({ id }: { id: number }) => {
    const { data, error } = await apiClient.PATCH("/api/v1/notifications/{id}/read", {
      params: { path: { id } },
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

export const markAllNotificationsReadTool = defineTool({
  name: "mark_all_notifications_read",
  requiresAuth: true,
  description: "Mark every notification for the authenticated user as read.",
  inputSchema: z.object({}),
  handler: async () => {
    const { data, error } = await apiClient.PATCH("/api/v1/notifications/read-all", {
      headers: AUTH_HEADERS,
    });
    return unwrap(data, error);
  },
});

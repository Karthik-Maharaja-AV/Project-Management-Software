"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSocket } from "@/components/providers/socket-provider";

export type NotificationDTO = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
  actor: { id: string; name: string; username: string; avatarUrl: string | null } | null;
};

async function fetchNotifications(): Promise<{ notifications: NotificationDTO[]; unreadCount: number }> {
  const res = await fetch("/api/notifications");
  if (!res.ok) throw new Error("Failed to load notifications");
  return res.json();
}

export function useNotifications() {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const query = useQuery({ queryKey: ["notifications"], queryFn: fetchNotifications });

  useEffect(() => {
    if (!socket) return;
    const handler = (notification: NotificationDTO) => {
      queryClient.setQueryData<{ notifications: NotificationDTO[]; unreadCount: number }>(
        ["notifications"],
        (old) =>
          old
            ? { notifications: [notification, ...old.notifications], unreadCount: old.unreadCount + 1 }
            : { notifications: [notification], unreadCount: 1 },
      );
      toast(notification.title, { description: notification.body ?? undefined });
    };
    socket.on("notification:new", handler);
    return () => {
      socket.off("notification:new", handler);
    };
  }, [socket, queryClient]);

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    },
    onMutate: async (id: string) => {
      queryClient.setQueryData<{ notifications: NotificationDTO[]; unreadCount: number }>(
        ["notifications"],
        (old) => {
          if (!old) return old;
          const target = old.notifications.find((n) => n.id === id);
          if (!target || target.isRead) return old;
          return {
            notifications: old.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
            unreadCount: Math.max(0, old.unreadCount - 1),
          };
        },
      );
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await fetch("/api/notifications/read-all", { method: "POST" });
    },
    onMutate: async () => {
      queryClient.setQueryData<{ notifications: NotificationDTO[]; unreadCount: number }>(
        ["notifications"],
        (old) => (old ? { notifications: old.notifications.map((n) => ({ ...n, isRead: true })), unreadCount: 0 } : old),
      );
    },
  });

  return {
    notifications: query.data?.notifications ?? [],
    unreadCount: query.data?.unreadCount ?? 0,
    isLoading: query.isLoading,
    markRead: markRead.mutate,
    markAllRead: markAllRead.mutate,
  };
}

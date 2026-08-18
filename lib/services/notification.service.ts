import { prisma } from "@/lib/prisma";
import { emitToUser } from "@/lib/socket-server";
import type { NotificationType } from "@prisma/client";

export async function createNotification(params: {
  userId: string;
  actorId?: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}) {
  // Don't notify users about their own actions.
  if (params.actorId && params.actorId === params.userId) return null;

  const notification = await prisma.notification.create({
    data: {
      userId: params.userId,
      actorId: params.actorId,
      type: params.type,
      title: params.title,
      body: params.body,
      link: params.link,
    },
    include: { actor: { select: { id: true, name: true, username: true, avatarUrl: true } } },
  });

  emitToUser(params.userId, "notification:new", notification);
  return notification;
}

export async function createNotifications(
  userIds: string[],
  params: Omit<Parameters<typeof createNotification>[0], "userId">,
) {
  const unique = [...new Set(userIds)];
  await Promise.all(unique.map((userId) => createNotification({ ...params, userId })));
}

export async function listNotifications(userId: string, limit = 30) {
  return prisma.notification.findMany({
    where: { userId },
    include: { actor: { select: { id: true, name: true, username: true, avatarUrl: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function unreadNotificationCount(userId: string) {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification || notification.userId !== userId) return null;
  return prisma.notification.update({ where: { id: notificationId }, data: { isRead: true } });
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
}

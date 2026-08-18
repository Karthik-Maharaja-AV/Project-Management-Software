import { NextResponse } from "next/server";
import { requireUser, withApiError } from "@/lib/api-utils";
import { listNotifications, unreadNotificationCount } from "@/lib/services/notification.service";

export const GET = withApiError(async () => {
  const user = await requireUser();
  const [notifications, unreadCount] = await Promise.all([
    listNotifications(user.id),
    unreadNotificationCount(user.id),
  ]);
  return NextResponse.json({ notifications, unreadCount });
});

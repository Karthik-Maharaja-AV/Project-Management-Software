import { NextResponse } from "next/server";
import { requireUser, withApiError } from "@/lib/api-utils";
import { markAllNotificationsRead } from "@/lib/services/notification.service";

export const POST = withApiError(async () => {
  const user = await requireUser();
  await markAllNotificationsRead(user.id);
  return NextResponse.json({ ok: true });
});

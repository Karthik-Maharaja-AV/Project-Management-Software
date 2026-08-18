import { NextResponse } from "next/server";
import { requireUser, withApiError } from "@/lib/api-utils";
import { markNotificationRead } from "@/lib/services/notification.service";

type Params = { params: Promise<{ notificationId: string }> };

export const POST = withApiError(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { notificationId } = await params;
  await markNotificationRead(user.id, notificationId);
  return NextResponse.json({ ok: true });
});

import { NextResponse } from "next/server";
import { requireUser, withApiError } from "@/lib/api-utils";
import { revokeInvitation } from "@/lib/services/workspace.service";

type Params = { params: Promise<{ workspaceId: string; invitationId: string }> };

export const DELETE = withApiError(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { workspaceId, invitationId } = await params;
  await revokeInvitation(user.id, workspaceId, invitationId);
  return NextResponse.json({ ok: true });
});

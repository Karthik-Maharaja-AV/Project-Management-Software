import { NextResponse } from "next/server";
import { requireUser, withApiError } from "@/lib/api-utils";
import { updateMemberRoleSchema } from "@/lib/validations/workspace";
import { removeMember, updateMemberRole } from "@/lib/services/workspace.service";

type Params = { params: Promise<{ workspaceId: string; userId: string }> };

export const PATCH = withApiError(async (req: Request, { params }: Params) => {
  const user = await requireUser();
  const { workspaceId, userId } = await params;
  const { role } = updateMemberRoleSchema.parse(await req.json());
  const member = await updateMemberRole(user.id, workspaceId, userId, role);
  return NextResponse.json({ member });
});

export const DELETE = withApiError(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { workspaceId, userId } = await params;
  await removeMember(user.id, workspaceId, userId);
  return NextResponse.json({ ok: true });
});

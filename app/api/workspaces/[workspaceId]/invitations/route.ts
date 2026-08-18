import { NextResponse } from "next/server";
import { requireUser, withApiError } from "@/lib/api-utils";
import { inviteMemberSchema } from "@/lib/validations/workspace";
import { inviteMember, listInvitations } from "@/lib/services/workspace.service";

type Params = { params: Promise<{ workspaceId: string }> };

export const GET = withApiError(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { workspaceId } = await params;
  const invitations = await listInvitations(user.id, workspaceId);
  return NextResponse.json({ invitations });
});

export const POST = withApiError(async (req: Request, { params }: Params) => {
  const user = await requireUser();
  const { workspaceId } = await params;
  const input = inviteMemberSchema.parse(await req.json());
  const invitation = await inviteMember(user.id, workspaceId, input);
  return NextResponse.json({ invitation }, { status: 201 });
});

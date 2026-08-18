import { NextResponse } from "next/server";
import { requireUser, withApiError } from "@/lib/api-utils";
import { listMembers } from "@/lib/services/workspace.service";

type Params = { params: Promise<{ workspaceId: string }> };

export const GET = withApiError(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { workspaceId } = await params;
  const members = await listMembers(user.id, workspaceId);
  return NextResponse.json({ members });
});

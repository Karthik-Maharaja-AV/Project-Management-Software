import { NextResponse } from "next/server";
import { requireUser, withApiError } from "@/lib/api-utils";
import { removeProjectMember } from "@/lib/services/project.service";

type Params = { params: Promise<{ projectId: string; userId: string }> };

export const DELETE = withApiError(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { projectId, userId } = await params;
  await removeProjectMember(user.id, projectId, userId);
  return NextResponse.json({ ok: true });
});

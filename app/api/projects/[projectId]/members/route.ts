import { NextResponse } from "next/server";
import { requireUser, withApiError } from "@/lib/api-utils";
import { addProjectMemberSchema } from "@/lib/validations/project";
import { addProjectMember, listProjectMembers } from "@/lib/services/project.service";

type Params = { params: Promise<{ projectId: string }> };

export const GET = withApiError(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { projectId } = await params;
  const members = await listProjectMembers(user.id, projectId);
  return NextResponse.json({ members });
});

export const POST = withApiError(async (req: Request, { params }: Params) => {
  const user = await requireUser();
  const { projectId } = await params;
  const input = addProjectMemberSchema.parse(await req.json());
  const member = await addProjectMember(user.id, projectId, input);
  return NextResponse.json({ member }, { status: 201 });
});

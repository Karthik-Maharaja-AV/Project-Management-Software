import { NextResponse } from "next/server";
import { requireUser, withApiError } from "@/lib/api-utils";
import { updateProjectSchema } from "@/lib/validations/project";
import { archiveProject, updateProject } from "@/lib/services/project.service";

type Params = { params: Promise<{ projectId: string }> };

export const PATCH = withApiError(async (req: Request, { params }: Params) => {
  const user = await requireUser();
  const { projectId } = await params;
  const input = updateProjectSchema.parse(await req.json());
  const project = await updateProject(user.id, projectId, input);
  return NextResponse.json({ project });
});

export const DELETE = withApiError(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { projectId } = await params;
  await archiveProject(user.id, projectId);
  return NextResponse.json({ ok: true });
});

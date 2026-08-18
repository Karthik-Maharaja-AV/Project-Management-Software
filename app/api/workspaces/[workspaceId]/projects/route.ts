import { NextResponse } from "next/server";
import { requireUser, withApiError } from "@/lib/api-utils";
import { createProjectSchema } from "@/lib/validations/project";
import { createProject, listProjects } from "@/lib/services/project.service";

type Params = { params: Promise<{ workspaceId: string }> };

export const GET = withApiError(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { workspaceId } = await params;
  const projects = await listProjects(user.id, workspaceId);
  return NextResponse.json({ projects });
});

export const POST = withApiError(async (req: Request, { params }: Params) => {
  const user = await requireUser();
  const { workspaceId } = await params;
  const input = createProjectSchema.parse(await req.json());
  const project = await createProject(user.id, workspaceId, input);
  return NextResponse.json({ project }, { status: 201 });
});

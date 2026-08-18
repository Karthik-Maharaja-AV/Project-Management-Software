import { NextResponse } from "next/server";
import { requireUser, withApiError } from "@/lib/api-utils";
import { createSprintSchema } from "@/lib/validations/sprint";
import { createSprint, listSprints } from "@/lib/services/sprint.service";

type Params = { params: Promise<{ projectId: string }> };

export const GET = withApiError(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { projectId } = await params;
  const sprints = await listSprints(user.id, projectId);
  return NextResponse.json({ sprints });
});

export const POST = withApiError(async (req: Request, { params }: Params) => {
  const user = await requireUser();
  const { projectId } = await params;
  const input = createSprintSchema.parse(await req.json());
  const sprint = await createSprint(user.id, projectId, input);
  return NextResponse.json({ sprint }, { status: 201 });
});

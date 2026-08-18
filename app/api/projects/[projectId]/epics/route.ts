import { NextResponse } from "next/server";
import { requireUser, withApiError } from "@/lib/api-utils";
import { createEpicSchema } from "@/lib/validations/epic";
import { createEpic, listEpics } from "@/lib/services/epic.service";

type Params = { params: Promise<{ projectId: string }> };

export const GET = withApiError(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { projectId } = await params;
  const epics = await listEpics(user.id, projectId);
  return NextResponse.json({ epics });
});

export const POST = withApiError(async (req: Request, { params }: Params) => {
  const user = await requireUser();
  const { projectId } = await params;
  const input = createEpicSchema.parse(await req.json());
  const epic = await createEpic(user.id, projectId, input);
  return NextResponse.json({ epic }, { status: 201 });
});

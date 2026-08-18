import { NextResponse } from "next/server";
import { requireUser, withApiError } from "@/lib/api-utils";
import { updateSprintSchema } from "@/lib/validations/sprint";
import { deleteSprint, getSprint, updateSprint } from "@/lib/services/sprint.service";

type Params = { params: Promise<{ sprintId: string }> };

export const GET = withApiError(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { sprintId } = await params;
  const sprint = await getSprint(user.id, sprintId);
  return NextResponse.json({ sprint });
});

export const PATCH = withApiError(async (req: Request, { params }: Params) => {
  const user = await requireUser();
  const { sprintId } = await params;
  const input = updateSprintSchema.parse(await req.json());
  const sprint = await updateSprint(user.id, sprintId, input);
  return NextResponse.json({ sprint });
});

export const DELETE = withApiError(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { sprintId } = await params;
  await deleteSprint(user.id, sprintId);
  return NextResponse.json({ ok: true });
});

import { NextResponse } from "next/server";
import { requireUser, withApiError } from "@/lib/api-utils";
import { createLabelSchema } from "@/lib/validations/project";
import { deleteLabel, updateLabel } from "@/lib/services/label.service";

type Params = { params: Promise<{ projectId: string; labelId: string }> };

export const PATCH = withApiError(async (req: Request, { params }: Params) => {
  const user = await requireUser();
  const { projectId, labelId } = await params;
  const input = createLabelSchema.partial().parse(await req.json());
  const label = await updateLabel(user.id, projectId, labelId, input);
  return NextResponse.json({ label });
});

export const DELETE = withApiError(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { projectId, labelId } = await params;
  await deleteLabel(user.id, projectId, labelId);
  return NextResponse.json({ ok: true });
});

import { NextResponse } from "next/server";
import { requireUser, withApiError } from "@/lib/api-utils";
import { updateEpicSchema } from "@/lib/validations/epic";
import { deleteEpic, getEpic, updateEpic } from "@/lib/services/epic.service";

type Params = { params: Promise<{ epicId: string }> };

export const GET = withApiError(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { epicId } = await params;
  const epic = await getEpic(user.id, epicId);
  return NextResponse.json({ epic });
});

export const PATCH = withApiError(async (req: Request, { params }: Params) => {
  const user = await requireUser();
  const { epicId } = await params;
  const input = updateEpicSchema.parse(await req.json());
  const epic = await updateEpic(user.id, epicId, input);
  return NextResponse.json({ epic });
});

export const DELETE = withApiError(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { epicId } = await params;
  await deleteEpic(user.id, epicId);
  return NextResponse.json({ ok: true });
});

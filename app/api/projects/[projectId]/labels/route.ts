import { NextResponse } from "next/server";
import { requireUser, withApiError } from "@/lib/api-utils";
import { createLabelSchema } from "@/lib/validations/project";
import { createLabel, listLabels } from "@/lib/services/label.service";

type Params = { params: Promise<{ projectId: string }> };

export const GET = withApiError(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { projectId } = await params;
  const labels = await listLabels(user.id, projectId);
  return NextResponse.json({ labels });
});

export const POST = withApiError(async (req: Request, { params }: Params) => {
  const user = await requireUser();
  const { projectId } = await params;
  const input = createLabelSchema.parse(await req.json());
  const label = await createLabel(user.id, projectId, input);
  return NextResponse.json({ label }, { status: 201 });
});

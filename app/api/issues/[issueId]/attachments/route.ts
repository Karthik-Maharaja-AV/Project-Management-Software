import { NextResponse } from "next/server";
import { requireUser, withApiError, ApiError } from "@/lib/api-utils";
import { listAttachments, uploadAttachment } from "@/lib/services/attachment.service";

type Params = { params: Promise<{ issueId: string }> };

export const GET = withApiError(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { issueId } = await params;
  const attachments = await listAttachments(user.id, issueId);
  return NextResponse.json({ attachments });
});

export const POST = withApiError(async (req: Request, { params }: Params) => {
  const user = await requireUser();
  const { issueId } = await params;

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new ApiError("No file provided", 400);
  }

  const attachment = await uploadAttachment(user.id, issueId, file);
  return NextResponse.json({ attachment }, { status: 201 });
});

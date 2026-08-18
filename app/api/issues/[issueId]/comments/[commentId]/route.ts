import { NextResponse } from "next/server";
import { requireUser, withApiError } from "@/lib/api-utils";
import { createCommentSchema } from "@/lib/validations/issue";
import { deleteComment, updateComment } from "@/lib/services/comment.service";

type Params = { params: Promise<{ issueId: string; commentId: string }> };

export const PATCH = withApiError(async (req: Request, { params }: Params) => {
  const user = await requireUser();
  const { issueId, commentId } = await params;
  const { body } = createCommentSchema.parse(await req.json());
  const comment = await updateComment(user.id, issueId, commentId, body);
  return NextResponse.json({ comment });
});

export const DELETE = withApiError(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { issueId, commentId } = await params;
  await deleteComment(user.id, issueId, commentId);
  return NextResponse.json({ ok: true });
});

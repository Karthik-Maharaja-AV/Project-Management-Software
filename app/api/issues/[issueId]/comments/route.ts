import { NextResponse } from "next/server";
import { requireUser, withApiError } from "@/lib/api-utils";
import { createCommentSchema } from "@/lib/validations/issue";
import { createComment, listComments } from "@/lib/services/comment.service";

type Params = { params: Promise<{ issueId: string }> };

export const GET = withApiError(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { issueId } = await params;
  const comments = await listComments(user.id, issueId);
  return NextResponse.json({ comments });
});

export const POST = withApiError(async (req: Request, { params }: Params) => {
  const user = await requireUser();
  const { issueId } = await params;
  const { body } = createCommentSchema.parse(await req.json());
  const comment = await createComment(user.id, issueId, body);
  return NextResponse.json({ comment }, { status: 201 });
});

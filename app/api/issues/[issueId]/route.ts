import { NextResponse } from "next/server";
import { requireUser, withApiError } from "@/lib/api-utils";
import { updateIssueSchema } from "@/lib/validations/issue";
import { deleteIssue, getIssue, updateIssue } from "@/lib/services/issue.service";

type Params = { params: Promise<{ issueId: string }> };

export const GET = withApiError(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { issueId } = await params;
  const issue = await getIssue(user.id, issueId);
  return NextResponse.json({ issue });
});

export const PATCH = withApiError(async (req: Request, { params }: Params) => {
  const user = await requireUser();
  const { issueId } = await params;
  const input = updateIssueSchema.parse(await req.json());
  const issue = await updateIssue(user.id, issueId, input);
  return NextResponse.json({ issue });
});

export const DELETE = withApiError(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { issueId } = await params;
  await deleteIssue(user.id, issueId);
  return NextResponse.json({ ok: true });
});

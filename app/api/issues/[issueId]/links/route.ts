import { NextResponse } from "next/server";
import { requireUser, withApiError } from "@/lib/api-utils";
import { createIssueLinkSchema } from "@/lib/validations/issue";
import { createIssueLink, listIssueLinks } from "@/lib/services/issue.service";

type Params = { params: Promise<{ issueId: string }> };

export const GET = withApiError(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { issueId } = await params;
  const links = await listIssueLinks(user.id, issueId);
  return NextResponse.json({ links });
});

export const POST = withApiError(async (req: Request, { params }: Params) => {
  const user = await requireUser();
  const { issueId } = await params;
  const { targetIssueId, type } = createIssueLinkSchema.parse(await req.json());
  const link = await createIssueLink(user.id, issueId, targetIssueId, type);
  return NextResponse.json({ link }, { status: 201 });
});

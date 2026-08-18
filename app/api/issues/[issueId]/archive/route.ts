import { NextResponse } from "next/server";
import { requireUser, withApiError } from "@/lib/api-utils";
import { archiveIssue } from "@/lib/services/issue.service";

type Params = { params: Promise<{ issueId: string }> };

export const POST = withApiError(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { issueId } = await params;
  const issue = await archiveIssue(user.id, issueId);
  return NextResponse.json({ issue });
});

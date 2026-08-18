import { NextResponse } from "next/server";
import { requireUser, withApiError } from "@/lib/api-utils";
import { getIssueByHumanKey } from "@/lib/services/issue.service";

type Params = { params: Promise<{ workspaceSlug: string; issueKey: string }> };

export const GET = withApiError(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { workspaceSlug, issueKey } = await params;
  const issue = await getIssueByHumanKey(user.id, workspaceSlug, issueKey);
  return NextResponse.json({ issue });
});

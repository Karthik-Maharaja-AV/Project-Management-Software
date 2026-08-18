import { NextResponse } from "next/server";
import { requireUser, withApiError } from "@/lib/api-utils";
import { deleteIssueLink } from "@/lib/services/issue.service";

type Params = { params: Promise<{ issueId: string; linkId: string }> };

export const DELETE = withApiError(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { issueId, linkId } = await params;
  await deleteIssueLink(user.id, issueId, linkId);
  return NextResponse.json({ ok: true });
});

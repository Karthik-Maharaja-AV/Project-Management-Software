import { NextResponse } from "next/server";
import { requireUser, withApiError } from "@/lib/api-utils";
import { listIssueActivity } from "@/lib/services/activity.service";

type Params = { params: Promise<{ issueId: string }> };

export const GET = withApiError(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { issueId } = await params;
  const activity = await listIssueActivity(user.id, issueId);
  return NextResponse.json({ activity });
});

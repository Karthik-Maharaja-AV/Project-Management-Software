import { NextResponse } from "next/server";
import { requireUser, withApiError } from "@/lib/api-utils";
import { moveIssueSchema } from "@/lib/validations/issue";
import { moveIssue } from "@/lib/services/issue.service";

type Params = { params: Promise<{ issueId: string }> };

export const POST = withApiError(async (req: Request, { params }: Params) => {
  const user = await requireUser();
  const { issueId } = await params;
  const input = moveIssueSchema.parse(await req.json());
  const issue = await moveIssue(user.id, issueId, input);
  return NextResponse.json({ issue });
});

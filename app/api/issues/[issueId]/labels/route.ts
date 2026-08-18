import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, withApiError } from "@/lib/api-utils";
import { setIssueLabels } from "@/lib/services/issue.service";

type Params = { params: Promise<{ issueId: string }> };

const schema = z.object({ labelIds: z.array(z.string().min(1)) });

export const PUT = withApiError(async (req: Request, { params }: Params) => {
  const user = await requireUser();
  const { issueId } = await params;
  const { labelIds } = schema.parse(await req.json());
  const issue = await setIssueLabels(user.id, issueId, labelIds);
  return NextResponse.json({ issue });
});

import { NextResponse } from "next/server";
import { requireUser, withApiError } from "@/lib/api-utils";
import { completeSprint } from "@/lib/services/sprint.service";

type Params = { params: Promise<{ sprintId: string }> };

export const POST = withApiError(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { sprintId } = await params;
  const sprint = await completeSprint(user.id, sprintId);
  return NextResponse.json({ sprint });
});

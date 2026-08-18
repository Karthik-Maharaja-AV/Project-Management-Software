import { NextResponse } from "next/server";
import { requireUser, withApiError } from "@/lib/api-utils";
import { getProjectDashboard } from "@/lib/services/analytics.service";

type Params = { params: Promise<{ projectId: string }> };

export const GET = withApiError(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { projectId } = await params;
  const dashboard = await getProjectDashboard(user.id, projectId);
  return NextResponse.json(dashboard);
});

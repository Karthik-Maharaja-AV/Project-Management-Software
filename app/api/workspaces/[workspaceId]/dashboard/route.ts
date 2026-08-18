import { NextResponse } from "next/server";
import { requireUser, withApiError } from "@/lib/api-utils";
import { getWorkspaceDashboard } from "@/lib/services/analytics.service";

type Params = { params: Promise<{ workspaceId: string }> };

export const GET = withApiError(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { workspaceId } = await params;
  const dashboard = await getWorkspaceDashboard(user.id, workspaceId);
  return NextResponse.json(dashboard);
});

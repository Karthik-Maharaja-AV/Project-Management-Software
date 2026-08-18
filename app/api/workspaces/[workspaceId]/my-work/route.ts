import { NextResponse } from "next/server";
import { requireUser, withApiError } from "@/lib/api-utils";
import { getMyWork } from "@/lib/services/my-work.service";

type Params = { params: Promise<{ workspaceId: string }> };

export const GET = withApiError(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { workspaceId } = await params;
  const data = await getMyWork(user.id, workspaceId);
  return NextResponse.json(data);
});

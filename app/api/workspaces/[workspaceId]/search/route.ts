import { NextResponse } from "next/server";
import { requireUser, withApiError } from "@/lib/api-utils";
import { searchWorkspace } from "@/lib/services/search.service";

type Params = { params: Promise<{ workspaceId: string }> };

export const GET = withApiError(async (req: Request, { params }: Params) => {
  const user = await requireUser();
  const { workspaceId } = await params;
  const query = new URL(req.url).searchParams.get("q") ?? "";
  const results = await searchWorkspace(user.id, workspaceId, query);
  return NextResponse.json(results);
});

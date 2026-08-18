import { NextResponse } from "next/server";
import { requireUser, withApiError } from "@/lib/api-utils";
import { updateWorkspaceSchema } from "@/lib/validations/workspace";
import { updateWorkspace } from "@/lib/services/workspace.service";

type Params = { params: Promise<{ workspaceId: string }> };

export const PATCH = withApiError(async (req: Request, { params }: Params) => {
  const user = await requireUser();
  const { workspaceId } = await params;
  const input = updateWorkspaceSchema.parse(await req.json());
  const workspace = await updateWorkspace(user.id, workspaceId, input);
  return NextResponse.json({ workspace });
});

import { NextResponse } from "next/server";
import { requireUser, withApiError } from "@/lib/api-utils";
import { createWorkspaceSchema } from "@/lib/validations/workspace";
import { createWorkspace, listUserWorkspaces } from "@/lib/services/workspace.service";

export const GET = withApiError(async () => {
  const user = await requireUser();
  const workspaces = await listUserWorkspaces(user.id);
  return NextResponse.json({ workspaces });
});

export const POST = withApiError(async (req: Request) => {
  const user = await requireUser();
  const input = createWorkspaceSchema.parse(await req.json());
  const workspace = await createWorkspace(user.id, input);
  return NextResponse.json({ workspace }, { status: 201 });
});

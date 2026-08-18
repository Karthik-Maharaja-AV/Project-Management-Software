import { NextResponse } from "next/server";
import { withApiError } from "@/lib/api-utils";
import { getInvitationByToken } from "@/lib/services/workspace.service";

type Params = { params: Promise<{ token: string }> };

export const GET = withApiError(async (_req: Request, { params }: Params) => {
  const { token } = await params;
  const invitation = await getInvitationByToken(token);
  return NextResponse.json({ invitation });
});

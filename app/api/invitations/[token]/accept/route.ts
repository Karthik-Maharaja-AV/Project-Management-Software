import { NextResponse } from "next/server";
import { requireUser, withApiError } from "@/lib/api-utils";
import { acceptInvitation } from "@/lib/services/workspace.service";

type Params = { params: Promise<{ token: string }> };

export const POST = withApiError(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { token } = await params;
  const member = await acceptInvitation(user.id, user.email!, token);
  return NextResponse.json({ member });
});

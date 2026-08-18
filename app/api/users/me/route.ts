import { NextResponse } from "next/server";
import { requireUser, withApiError } from "@/lib/api-utils";
import { updateProfileSchema } from "@/lib/validations/auth";
import { getPublicUser, updateProfile } from "@/lib/services/user.service";

export const GET = withApiError(async () => {
  const user = await requireUser();
  const profile = await getPublicUser(user.id);
  return NextResponse.json({ user: profile });
});

export const PATCH = withApiError(async (req: Request) => {
  const user = await requireUser();
  const input = updateProfileSchema.parse(await req.json());
  const profile = await updateProfile(user.id, input);
  return NextResponse.json({ user: profile });
});

import { NextResponse } from "next/server";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { resetPassword } from "@/lib/services/user.service";
import { withApiError } from "@/lib/api-utils";

export const POST = withApiError(async (req: Request) => {
  const body = await req.json();
  const input = resetPasswordSchema.parse(body);
  await resetPassword(input);
  return NextResponse.json({ message: "Password updated. You can now log in." });
});

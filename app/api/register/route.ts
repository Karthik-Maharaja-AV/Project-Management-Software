import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/validations/auth";
import { registerUser } from "@/lib/services/user.service";
import { withApiError } from "@/lib/api-utils";

export const POST = withApiError(async (req: Request) => {
  const body = await req.json();
  const input = registerSchema.parse(body);
  const user = await registerUser(input);
  return NextResponse.json({ user }, { status: 201 });
});

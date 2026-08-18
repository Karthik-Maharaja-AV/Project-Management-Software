import { NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { requestPasswordReset } from "@/lib/services/user.service";
import { withApiError } from "@/lib/api-utils";

// No SMTP is configured for this deployment, so the reset link is written to the
// server console instead of the HTTP response — returning it to the caller would let
// anyone reset any account just by knowing its email address.
export const POST = withApiError(async (req: Request) => {
  const body = await req.json();
  const { email } = forgotPasswordSchema.parse(body);

  const result = await requestPasswordReset(email);
  if (result) {
    const resetUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/reset-password?token=${result.token}`;
    console.log(`\n[password-reset] Reset link for ${result.user.email}:\n  ${resetUrl}\n`);
  }

  // Always the same response, whether or not the account exists.
  return NextResponse.json({
    message:
      "If that email is registered, a reset link has been generated. Ask whoever runs this PixelForge server to grab it from the server console for you.",
  });
});

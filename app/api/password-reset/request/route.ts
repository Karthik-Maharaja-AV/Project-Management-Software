import { NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { requestPasswordReset } from "@/lib/services/user.service";
import { withApiError } from "@/lib/api-utils";
import { sendPasswordResetEmail } from "@/lib/email";

// The response is intentionally identical whether or not the account exists — returning
// the reset link directly (or revealing account existence) would let anyone reset any
// account just by knowing its email address.
export const POST = withApiError(async (req: Request) => {
  const body = await req.json();
  const { email } = forgotPasswordSchema.parse(body);

  const result = await requestPasswordReset(email);
  if (result) {
    const resetUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/reset-password?token=${result.token}`;
    await sendPasswordResetEmail(result.user.email, resetUrl);
  }

  return NextResponse.json({
    message:
      "If that email is registered, a reset link has been sent. (No email provider configured yet? Ask whoever runs this PixelForge server to grab the link from the server console instead.)",
  });
});

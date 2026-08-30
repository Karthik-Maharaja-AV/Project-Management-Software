import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "PixelForge <onboarding@resend.dev>";

/**
 * Sends an email via Resend if RESEND_API_KEY is configured; otherwise logs the
 * content to the console. This keeps the app fully functional (readable by whoever
 * runs the server) even before an email provider is wired up.
 */
export async function sendEmail(params: { to: string; subject: string; html: string; text: string }) {
  if (!resend) {
    console.log(`\n[email] RESEND_API_KEY not set — logging instead of sending:\n  to: ${params.to}\n  subject: ${params.subject}\n  ${params.text}\n`);
    return { sent: false as const };
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    return { sent: true as const };
  } catch (err) {
    console.error("[email] Failed to send:", err);
    return { sent: false as const };
  }
}

function emailShell(bodyHtml: string) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1c1a17;">
      <p style="font-weight: 700; font-size: 18px; margin-bottom: 24px;">🛠️ PixelForge</p>
      ${bodyHtml}
    </div>
  `;
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  return sendEmail({
    to,
    subject: "Reset your PixelForge password",
    text: `Reset your password: ${resetUrl} (expires in 1 hour, ignore if you didn't request this)`,
    html: emailShell(`
      <p>Someone requested a password reset for this account. If that was you, click below:</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="background:#e2661c;color:#fff8f1;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;">Reset password</a>
      </p>
      <p style="color:#5b564e;font-size:13px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
    `),
  });
}

export async function sendInvitationEmail(params: {
  to: string;
  inviterName: string;
  workspaceName: string;
  inviteUrl: string;
}) {
  return sendEmail({
    to: params.to,
    subject: `${params.inviterName} invited you to ${params.workspaceName} on PixelForge`,
    text: `${params.inviterName} invited you to join ${params.workspaceName} on PixelForge: ${params.inviteUrl}`,
    html: emailShell(`
      <p><strong>${params.inviterName}</strong> invited you to join <strong>${params.workspaceName}</strong> on PixelForge.</p>
      <p style="margin: 24px 0;">
        <a href="${params.inviteUrl}" style="background:#e2661c;color:#fff8f1;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;">Accept invitation</a>
      </p>
      <p style="color:#5b564e;font-size:13px;">If you don't have a PixelForge account yet, you'll be asked to create one first.</p>
    `),
  });
}

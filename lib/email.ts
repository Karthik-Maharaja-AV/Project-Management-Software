import nodemailer from "nodemailer";

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER || "PixelForge <noreply@localhost>";

/** Escapes a string for safe interpolation into an HTML email body — user-controlled
 * values (display names, workspace names) flow into these templates unvalidated for
 * HTML safety, so this prevents them from injecting markup/links into outgoing mail. */
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Sends an email via SMTP if SMTP_HOST/SMTP_USER/SMTP_PASS are configured; otherwise
 * logs the content to the console. This keeps the app fully functional (readable by
 * whoever runs the server) even before an email provider is wired up. Never uses
 * nodemailer's `raw` option or file/URL-based attachments — both are user-input-free
 * here by design, since those are the vectors for nodemailer's known SSRF/file-read
 * advisories on messages built from untrusted input.
 */
export async function sendEmail(params: { to: string; subject: string; html: string; text: string }) {
  const transport = createTransport();
  if (!transport) {
    console.log(`\n[email] SMTP not configured — logging instead of sending:\n  to: ${params.to}\n  subject: ${params.subject}\n  ${params.text}\n`);
    return { sent: false as const };
  }

  try {
    await transport.sendMail({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
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
  const safeUrl = escapeHtml(resetUrl);
  return sendEmail({
    to,
    subject: "Reset your PixelForge password",
    text: `Reset your password: ${resetUrl} (expires in 1 hour, ignore if you didn't request this)`,
    html: emailShell(`
      <p>Someone requested a password reset for this account. If that was you, click below:</p>
      <p style="margin: 24px 0;">
        <a href="${safeUrl}" style="background:#e2661c;color:#fff8f1;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;">Reset password</a>
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
  // subject/text are plain strings (no HTML rendering), so only the HTML body needs escaping
  const safeInviterName = escapeHtml(params.inviterName);
  const safeWorkspaceName = escapeHtml(params.workspaceName);
  const safeUrl = escapeHtml(params.inviteUrl);
  return sendEmail({
    to: params.to,
    subject: `${params.inviterName} invited you to ${params.workspaceName} on PixelForge`,
    text: `${params.inviterName} invited you to join ${params.workspaceName} on PixelForge: ${params.inviteUrl}`,
    html: emailShell(`
      <p><strong>${safeInviterName}</strong> invited you to join <strong>${safeWorkspaceName}</strong> on PixelForge.</p>
      <p style="margin: 24px 0;">
        <a href="${safeUrl}" style="background:#e2661c;color:#fff8f1;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;">Accept invitation</a>
      </p>
      <p style="color:#5b564e;font-size:13px;">If you don't have a PixelForge account yet, you'll be asked to create one first.</p>
    `),
  });
}

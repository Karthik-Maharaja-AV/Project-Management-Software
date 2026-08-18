import path from "node:path";
import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { requireUser, withApiError } from "@/lib/api-utils";
import { deleteAttachment, getAttachmentForDownload } from "@/lib/services/attachment.service";
import { UPLOADS_DIR } from "@/lib/uploads";

type Params = { params: Promise<{ attachmentId: string }> };

export const GET = withApiError(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { attachmentId } = await params;
  const attachment = await getAttachmentForDownload(user.id, attachmentId);

  const buffer = await fs.readFile(path.join(UPLOADS_DIR, attachment.filepath));
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(attachment.filename)}"`,
      "Content-Length": String(attachment.size),
      "Cache-Control": "private, max-age=3600",
    },
  });
});

export const DELETE = withApiError(async (_req: Request, { params }: Params) => {
  const user = await requireUser();
  const { attachmentId } = await params;
  await deleteAttachment(user.id, attachmentId);
  return NextResponse.json({ ok: true });
});

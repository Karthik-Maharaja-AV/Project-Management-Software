import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-utils";
import { requireIssueAccess } from "@/lib/authz";
import { logActivity } from "@/lib/services/activity.service";
import { emitToProject } from "@/lib/socket-server";
import { ALLOWED_MIME_TYPES, MAX_UPLOAD_BYTES, UPLOADS_DIR } from "@/lib/uploads";

function sanitizeFilename(name: string) {
  return name.replace(/[^\w.\- ]/g, "_").slice(0, 180) || "file";
}

export async function uploadAttachment(userId: string, issueId: string, file: File) {
  const { issue, project } = await requireIssueAccess(userId, issueId, "MEMBER");

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ApiError(`File exceeds the ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB limit`, 413);
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new ApiError(`File type "${file.type || "unknown"}" is not allowed`, 415);
  }

  await fs.mkdir(UPLOADS_DIR, { recursive: true });

  const storedName = `${crypto.randomBytes(16).toString("hex")}${path.extname(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(UPLOADS_DIR, storedName), buffer);

  const attachment = await prisma.attachment.create({
    data: {
      issueId,
      uploaderId: userId,
      filename: sanitizeFilename(file.name),
      filepath: storedName,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
    },
    include: { uploader: { select: { id: true, name: true, username: true, avatarUrl: true } } },
  });

  await logActivity({
    workspaceId: project.workspaceId,
    projectId: project.id,
    issueId,
    actorId: userId,
    type: "issue.attachment_added",
    data: { attachment: attachment.filename },
  });

  emitToProject(project.id, "attachment:created", { issueId, attachment });
  void issue;
  return attachment;
}

export async function listAttachments(userId: string, issueId: string) {
  await requireIssueAccess(userId, issueId, "GUEST");
  return prisma.attachment.findMany({
    where: { issueId },
    include: { uploader: { select: { id: true, name: true, username: true, avatarUrl: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAttachmentForDownload(userId: string, attachmentId: string) {
  const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } });
  if (!attachment || !attachment.issueId) throw new ApiError("Attachment not found", 404);
  await requireIssueAccess(userId, attachment.issueId, "GUEST");
  return attachment;
}

export async function deleteAttachment(userId: string, attachmentId: string) {
  const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } });
  if (!attachment || !attachment.issueId) throw new ApiError("Attachment not found", 404);
  const { project } = await requireIssueAccess(userId, attachment.issueId, "MEMBER");

  await prisma.attachment.delete({ where: { id: attachmentId } });
  await fs.rm(path.join(UPLOADS_DIR, attachment.filepath), { force: true });
  emitToProject(project.id, "attachment:deleted", { issueId: attachment.issueId, attachmentId });
}

import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";
import { requireIssueAccess } from "@/lib/authz";
import { logActivity } from "@/lib/services/activity.service";
import { createNotifications, createNotification } from "@/lib/services/notification.service";
import { emitToProject } from "@/lib/socket-server";
import { issueUrl } from "@/lib/services/issue.service";

const COMMENT_AUTHOR_SELECT = { id: true, name: true, username: true, avatarUrl: true } as const;

function extractMentionedUsernames(body: string): string[] {
  const matches = body.matchAll(/@([a-z0-9_-]+)/gi);
  return [...new Set([...matches].map((m) => m[1].toLowerCase()))];
}

export async function listComments(userId: string, issueId: string) {
  await requireIssueAccess(userId, issueId, "GUEST");
  return prisma.comment.findMany({
    where: { issueId },
    include: { author: { select: COMMENT_AUTHOR_SELECT } },
    orderBy: { createdAt: "asc" },
  });
}

export async function createComment(userId: string, issueId: string, body: string) {
  const { issue, project } = await requireIssueAccess(userId, issueId, "MEMBER");

  const comment = await prisma.comment.create({
    data: { issueId, authorId: userId, body },
    include: { author: { select: COMMENT_AUTHOR_SELECT } },
  });

  const key = `${project.key}-${issue.number}`;
  const workspace = await prisma.workspace.findUniqueOrThrow({ where: { id: project.workspaceId } });
  const link = issueUrl(workspace.slug, project.key, key);

  await logActivity({
    workspaceId: project.workspaceId,
    projectId: project.id,
    issueId,
    actorId: userId,
    type: "issue.commented",
  });

  const notifyIds = new Set<string>();
  if (issue.assigneeId) notifyIds.add(issue.assigneeId);
  if (issue.reporterId) notifyIds.add(issue.reporterId);
  notifyIds.delete(userId);

  await createNotifications([...notifyIds], {
    actorId: userId,
    type: "COMMENT_ON_ISSUE",
    title: `New comment on ${key}`,
    body: body.slice(0, 140),
    link,
  });

  const mentionedUsernames = extractMentionedUsernames(body);
  if (mentionedUsernames.length > 0) {
    const mentionedUsers = await prisma.user.findMany({
      where: { username: { in: mentionedUsernames } },
    });
    for (const mentioned of mentionedUsers) {
      if (mentioned.id === userId) continue;
      await createNotification({
        userId: mentioned.id,
        actorId: userId,
        type: "MENTIONED",
        title: `You were mentioned on ${key}`,
        body: body.slice(0, 140),
        link,
      });
    }
  }

  emitToProject(project.id, "comment:created", { issueId, comment });
  return comment;
}

export async function updateComment(userId: string, issueId: string, commentId: string, body: string) {
  const { project } = await requireIssueAccess(userId, issueId, "GUEST");
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment || comment.issueId !== issueId) throw new ApiError("Comment not found", 404);
  if (comment.authorId !== userId) throw new ApiError("You can only edit your own comments", 403);

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { body, editedAt: new Date() },
    include: { author: { select: COMMENT_AUTHOR_SELECT } },
  });

  emitToProject(project.id, "comment:updated", { issueId, comment: updated });
  return updated;
}

export async function deleteComment(userId: string, issueId: string, commentId: string) {
  const { project, workspaceMember } = await requireIssueAccess(userId, issueId, "GUEST");
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment || comment.issueId !== issueId) throw new ApiError("Comment not found", 404);
  if (comment.authorId !== userId && workspaceMember.role !== "OWNER" && workspaceMember.role !== "ADMIN") {
    throw new ApiError("You can only delete your own comments", 403);
  }

  await prisma.comment.delete({ where: { id: commentId } });
  emitToProject(project.id, "comment:deleted", { issueId, commentId });
}

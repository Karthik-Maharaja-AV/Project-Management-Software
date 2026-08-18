import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { emitToProject, emitToWorkspace } from "@/lib/socket-server";

export type ActivityType =
  | "issue.created"
  | "issue.status_changed"
  | "issue.assigned"
  | "issue.unassigned"
  | "issue.priority_changed"
  | "issue.label_added"
  | "issue.label_removed"
  | "issue.moved_to_sprint"
  | "issue.removed_from_sprint"
  | "issue.epic_changed"
  | "issue.commented"
  | "issue.archived"
  | "issue.deleted"
  | "project.created"
  | "project.member_added"
  | "sprint.created"
  | "sprint.started"
  | "sprint.completed"
  | "workspace.member_joined";

export async function logActivity(params: {
  workspaceId: string;
  projectId?: string;
  issueId?: string;
  actorId: string;
  type: ActivityType;
  data?: Record<string, unknown>;
}) {
  const activity = await prisma.activity.create({
    data: {
      workspaceId: params.workspaceId,
      projectId: params.projectId,
      issueId: params.issueId,
      actorId: params.actorId,
      type: params.type,
      data: (params.data ?? {}) as Prisma.InputJsonValue,
    },
    include: { actor: { select: { id: true, name: true, username: true, avatarUrl: true } } },
  });

  if (params.projectId) {
    emitToProject(params.projectId, "activity:created", activity);
  }
  emitToWorkspace(params.workspaceId, "activity:created", activity);

  return activity;
}

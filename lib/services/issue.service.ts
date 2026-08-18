import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";
import { requireProjectAccess, requireIssueAccess } from "@/lib/authz";
import { logActivity } from "@/lib/services/activity.service";
import { createNotification } from "@/lib/services/notification.service";
import { emitToProject } from "@/lib/socket-server";
import type { CreateIssueInput, IssueFilterInput, MoveIssueInput, UpdateIssueInput } from "@/lib/validations/issue";
import type { Prisma } from "@prisma/client";

export const ISSUE_INCLUDE = {
  assignee: { select: { id: true, name: true, username: true, avatarUrl: true } },
  reporter: { select: { id: true, name: true, username: true, avatarUrl: true } },
  epic: { select: { id: true, name: true, color: true } },
  sprint: { select: { id: true, name: true, status: true } },
  project: {
    select: {
      id: true,
      key: true,
      name: true,
      color: true,
      workspaceId: true,
      workspace: { select: { slug: true } },
    },
  },
  parent: { select: { id: true, title: true, number: true } },
  subtasks: {
    select: {
      id: true,
      number: true,
      title: true,
      status: true,
      assignee: { select: { id: true, name: true, username: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "asc" },
  },
  labels: { include: { label: true } },
  _count: { select: { subtasks: true, comments: true, attachments: true } },
} satisfies Prisma.IssueInclude;

export type IssueWithRelations = Prisma.IssueGetPayload<{ include: typeof ISSUE_INCLUDE }>;

export function issueUrl(workspaceSlug: string, projectKey: string, issueKey: string) {
  return `/${workspaceSlug}/${projectKey}/board?issue=${issueKey}`;
}

function serializeIssue(issue: IssueWithRelations) {
  const key = `${issue.project.key}-${issue.number}`;
  return {
    ...issue,
    key,
    labels: issue.labels.map((l) => l.label),
    url: issueUrl(issue.project.workspace.slug, issue.project.key, key),
  };
}

async function nextIssueNumber(projectId: string) {
  const project = await prisma.project.update({
    where: { id: projectId },
    data: { issueCounter: { increment: 1 } },
  });
  return project.issueCounter;
}

async function nextBoardOrder(projectId: string, status: string) {
  const last = await prisma.issue.findFirst({
    where: { projectId, status: status as never, archivedAt: null },
    orderBy: { boardOrder: "desc" },
  });
  return (last?.boardOrder ?? 0) + 1024;
}

export async function createIssue(userId: string, input: CreateIssueInput) {
  const { project } = await requireProjectAccess(userId, input.projectId, "MEMBER");

  const [number, boardOrder] = await Promise.all([
    nextIssueNumber(project.id),
    nextBoardOrder(project.id, input.status ?? "BACKLOG"),
  ]);

  const issue = await prisma.issue.create({
    data: {
      projectId: project.id,
      number,
      title: input.title,
      description: input.description,
      type: input.type ?? "TASK",
      status: input.status ?? "BACKLOG",
      priority: input.priority ?? "NO_PRIORITY",
      assigneeId: input.assigneeId ?? undefined,
      epicId: input.epicId ?? undefined,
      sprintId: input.sprintId ?? undefined,
      parentId: input.parentId ?? undefined,
      storyPoints: input.storyPoints ?? undefined,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      reporterId: userId,
      boardOrder,
      labels: input.labelIds?.length
        ? { create: input.labelIds.map((labelId) => ({ labelId })) }
        : undefined,
    },
    include: ISSUE_INCLUDE,
  });

  await logActivity({
    workspaceId: project.workspaceId,
    projectId: project.id,
    issueId: issue.id,
    actorId: userId,
    type: "issue.created",
    data: { title: issue.title },
  });

  const serialized = serializeIssue(issue);

  if (input.assigneeId && input.assigneeId !== userId) {
    await createNotification({
      userId: input.assigneeId,
      actorId: userId,
      type: "ISSUE_ASSIGNED",
      title: `You were assigned to ${serialized.key}`,
      body: issue.title,
      link: serialized.url,
    });
  }
  emitToProject(project.id, "issue:created", serialized);
  return serialized;
}

export async function getIssue(userId: string, issueId: string) {
  const { project } = await requireIssueAccess(userId, issueId, "GUEST");
  const issue = await prisma.issue.findUniqueOrThrow({ where: { id: issueId }, include: ISSUE_INCLUDE });
  void project;
  return serializeIssue(issue);
}

export async function getIssueByHumanKey(userId: string, workspaceSlug: string, issueKey: string) {
  const match = issueKey.match(/^([A-Za-z0-9]+)-(\d+)$/);
  if (!match) throw new ApiError("Invalid issue key", 400);
  const [, projectKey, numberStr] = match;

  const workspace = await prisma.workspace.findUnique({ where: { slug: workspaceSlug } });
  if (!workspace) throw new ApiError("Workspace not found", 404);

  const project = await prisma.project.findUnique({
    where: { workspaceId_key: { workspaceId: workspace.id, key: projectKey.toUpperCase() } },
  });
  if (!project) throw new ApiError("Issue not found", 404);

  await requireProjectAccess(userId, project.id, "GUEST");

  const issue = await prisma.issue.findUnique({
    where: { projectId_number: { projectId: project.id, number: Number(numberStr) } },
    include: ISSUE_INCLUDE,
  });
  if (!issue) throw new ApiError("Issue not found", 404);

  await prisma.recentlyViewed.upsert({
    where: { userId_issueId: { userId, issueId: issue.id } },
    create: { userId, issueId: issue.id },
    update: { viewedAt: new Date() },
  });

  return serializeIssue(issue);
}

export async function listIssues(userId: string, projectId: string, filters: IssueFilterInput = {}) {
  await requireProjectAccess(userId, projectId, "GUEST");

  const where: Prisma.IssueWhereInput = {
    projectId,
    archivedAt: null,
    ...(filters.status?.length ? { status: { in: filters.status } } : {}),
    ...(filters.assigneeId?.length ? { assigneeId: { in: filters.assigneeId } } : {}),
    ...(filters.priority?.length ? { priority: { in: filters.priority } } : {}),
    ...(filters.type?.length ? { type: { in: filters.type } } : {}),
    ...(filters.sprintId ? { sprintId: filters.sprintId } : {}),
    ...(filters.epicId ? { epicId: filters.epicId } : {}),
    ...(filters.labelId?.length ? { labels: { some: { labelId: { in: filters.labelId } } } } : {}),
    ...(filters.search
      ? { title: { contains: filters.search, mode: "insensitive" as const } }
      : {}),
  };

  const issues = await prisma.issue.findMany({
    where,
    include: ISSUE_INCLUDE,
    orderBy: [{ boardOrder: "asc" }],
  });

  return issues.map(serializeIssue);
}

function diffFields<T extends Record<string, unknown>>(before: T, after: Partial<T>) {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of Object.keys(after)) {
    if (after[key] !== undefined && after[key] !== before[key]) {
      changes[key] = { from: before[key], to: after[key] };
    }
  }
  return changes;
}

export async function updateIssue(userId: string, issueId: string, input: UpdateIssueInput) {
  const { issue: before, project } = await requireIssueAccess(userId, issueId, "MEMBER");

  const data: Prisma.IssueUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.type !== undefined) data.type = input.type;
  if (input.status !== undefined) data.status = input.status;
  if (input.priority !== undefined) data.priority = input.priority;
  if (input.storyPoints !== undefined) data.storyPoints = input.storyPoints;
  if (input.dueDate !== undefined) data.dueDate = input.dueDate ? new Date(input.dueDate) : null;
  if (input.boardOrder !== undefined) data.boardOrder = input.boardOrder;
  if (input.assigneeId !== undefined) {
    data.assignee = input.assigneeId ? { connect: { id: input.assigneeId } } : { disconnect: true };
  }
  if (input.epicId !== undefined) {
    data.epic = input.epicId ? { connect: { id: input.epicId } } : { disconnect: true };
  }
  if (input.sprintId !== undefined) {
    data.sprint = input.sprintId ? { connect: { id: input.sprintId } } : { disconnect: true };
  }
  if (input.parentId !== undefined) {
    data.parent = input.parentId ? { connect: { id: input.parentId } } : { disconnect: true };
  }

  const issue = await prisma.issue.update({ where: { id: issueId }, data, include: ISSUE_INCLUDE });

  const changes = diffFields(
    {
      title: before.title,
      status: before.status,
      priority: before.priority,
      assigneeId: before.assigneeId,
      epicId: before.epicId,
      sprintId: before.sprintId,
    },
    {
      title: input.title,
      status: input.status,
      priority: input.priority,
      assigneeId: input.assigneeId,
      epicId: input.epicId,
      sprintId: input.sprintId,
    },
  );

  if (changes.status) {
    await logActivity({
      workspaceId: project.workspaceId,
      projectId: project.id,
      issueId,
      actorId: userId,
      type: "issue.status_changed",
      data: changes.status,
    });
  }
  if (changes.priority) {
    await logActivity({
      workspaceId: project.workspaceId,
      projectId: project.id,
      issueId,
      actorId: userId,
      type: "issue.priority_changed",
      data: changes.priority,
    });
  }
  const serialized = serializeIssue(issue);

  if (changes.assigneeId) {
    await logActivity({
      workspaceId: project.workspaceId,
      projectId: project.id,
      issueId,
      actorId: userId,
      type: changes.assigneeId.to ? "issue.assigned" : "issue.unassigned",
      data: changes.assigneeId,
    });
    if (issue.assigneeId && issue.assigneeId !== userId) {
      await createNotification({
        userId: issue.assigneeId,
        actorId: userId,
        type: "ISSUE_ASSIGNED",
        title: `You were assigned to ${serialized.key}`,
        body: issue.title,
        link: serialized.url,
      });
    }
  }
  if (changes.sprintId) {
    await logActivity({
      workspaceId: project.workspaceId,
      projectId: project.id,
      issueId,
      actorId: userId,
      type: changes.sprintId.to ? "issue.moved_to_sprint" : "issue.removed_from_sprint",
      data: changes.sprintId,
    });
  }
  if (before.reporterId !== userId && before.assigneeId !== userId && (changes.status || changes.priority)) {
    await createNotification({
      userId: before.reporterId,
      actorId: userId,
      type: "STATUS_CHANGED",
      title: `${serialized.key} was updated`,
      body: issue.title,
      link: serialized.url,
    });
  }

  emitToProject(project.id, "issue:updated", serialized);
  return serialized;
}

export async function moveIssue(userId: string, issueId: string, input: MoveIssueInput) {
  const { project } = await requireIssueAccess(userId, issueId, "MEMBER");

  let boardOrder: number;
  if (input.beforeId || input.afterId) {
    const [before, after] = await Promise.all([
      input.beforeId ? prisma.issue.findUnique({ where: { id: input.beforeId } }) : null,
      input.afterId ? prisma.issue.findUnique({ where: { id: input.afterId } }) : null,
    ]);
    if (before && after) boardOrder = (before.boardOrder + after.boardOrder) / 2;
    else if (before) boardOrder = before.boardOrder + 1024;
    else if (after) boardOrder = after.boardOrder - 1024;
    else boardOrder = await nextBoardOrder(project.id, input.status);
  } else {
    boardOrder = await nextBoardOrder(project.id, input.status);
  }

  return updateIssue(userId, issueId, { status: input.status, boardOrder });
}

export async function deleteIssue(userId: string, issueId: string) {
  const { issue, project } = await requireIssueAccess(userId, issueId, "MEMBER");
  await prisma.issue.delete({ where: { id: issueId } });
  await logActivity({
    workspaceId: project.workspaceId,
    projectId: project.id,
    actorId: userId,
    type: "issue.deleted",
    data: { title: issue.title, key: `${project.key}-${issue.number}` },
  });
  emitToProject(project.id, "issue:deleted", { id: issueId });
}

export async function archiveIssue(userId: string, issueId: string) {
  const { project } = await requireIssueAccess(userId, issueId, "MEMBER");
  const issue = await prisma.issue.update({
    where: { id: issueId },
    data: { archivedAt: new Date() },
    include: ISSUE_INCLUDE,
  });
  await logActivity({
    workspaceId: project.workspaceId,
    projectId: project.id,
    issueId,
    actorId: userId,
    type: "issue.archived",
  });
  const serialized = serializeIssue(issue);
  emitToProject(project.id, "issue:deleted", { id: issueId });
  return serialized;
}

export async function setIssueLabels(userId: string, issueId: string, labelIds: string[]) {
  const { project } = await requireIssueAccess(userId, issueId, "MEMBER");
  await prisma.$transaction([
    prisma.issueLabel.deleteMany({ where: { issueId } }),
    prisma.issueLabel.createMany({ data: labelIds.map((labelId) => ({ issueId, labelId })) }),
  ]);
  const issue = await prisma.issue.findUniqueOrThrow({ where: { id: issueId }, include: ISSUE_INCLUDE });
  const serialized = serializeIssue(issue);
  emitToProject(project.id, "issue:updated", serialized);
  return serialized;
}

export async function listIssueLinks(userId: string, issueId: string) {
  await requireIssueAccess(userId, issueId, "GUEST");
  const [outgoing, incoming] = await Promise.all([
    prisma.issueLink.findMany({
      where: { sourceIssueId: issueId },
      include: { targetIssue: { include: ISSUE_INCLUDE } },
    }),
    prisma.issueLink.findMany({
      where: { targetIssueId: issueId },
      include: { sourceIssue: { include: ISSUE_INCLUDE } },
    }),
  ]);
  return [
    ...outgoing.map((l) => ({ id: l.id, type: l.type, issue: serializeIssue(l.targetIssue) })),
    ...incoming.map((l) => ({ id: l.id, type: `INVERSE_${l.type}`, issue: serializeIssue(l.sourceIssue) })),
  ];
}

export async function createIssueLink(userId: string, issueId: string, targetIssueId: string, type: string) {
  await requireIssueAccess(userId, issueId, "MEMBER");
  await requireIssueAccess(userId, targetIssueId, "GUEST");
  if (issueId === targetIssueId) throw new ApiError("An issue can't link to itself", 400);

  return prisma.issueLink.create({
    data: { sourceIssueId: issueId, targetIssueId, type: type as never },
  });
}

export async function deleteIssueLink(userId: string, issueId: string, linkId: string) {
  await requireIssueAccess(userId, issueId, "MEMBER");
  const link = await prisma.issueLink.findUnique({ where: { id: linkId } });
  if (!link || (link.sourceIssueId !== issueId && link.targetIssueId !== issueId)) {
    throw new ApiError("Link not found", 404);
  }
  await prisma.issueLink.delete({ where: { id: linkId } });
}

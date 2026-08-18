import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-utils";
import { requireProjectAccess } from "@/lib/authz";
import { logActivity } from "@/lib/services/activity.service";
import { createNotifications } from "@/lib/services/notification.service";
import type { CreateSprintInput, UpdateSprintInput } from "@/lib/validations/sprint";

function withSprintProgress<T extends { issues: { status: string; storyPoints: number | null }[] }>(sprint: T) {
  const total = sprint.issues.length;
  const done = sprint.issues.filter((i) => i.status === "DONE").length;
  const totalPoints = sprint.issues.reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);
  const donePoints = sprint.issues
    .filter((i) => i.status === "DONE")
    .reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);
  return {
    ...sprint,
    progress: { total, done, totalPoints, donePoints, percent: total === 0 ? 0 : Math.round((done / total) * 100) },
  };
}

export async function listSprints(userId: string, projectId: string) {
  await requireProjectAccess(userId, projectId, "GUEST");
  const sprints = await prisma.sprint.findMany({
    where: { projectId },
    include: { issues: { select: { id: true, status: true, storyPoints: true } } },
    orderBy: { createdAt: "asc" },
  });
  return sprints.map(withSprintProgress);
}

export async function getSprint(userId: string, sprintId: string) {
  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
    include: {
      project: true,
      issues: {
        include: {
          assignee: { select: { id: true, name: true, username: true, avatarUrl: true } },
          labels: { include: { label: true } },
        },
        orderBy: { boardOrder: "asc" },
      },
    },
  });
  if (!sprint) throw new ApiError("Sprint not found", 404);
  await requireProjectAccess(userId, sprint.projectId, "GUEST");
  return withSprintProgress(sprint);
}

export async function createSprint(userId: string, projectId: string, input: CreateSprintInput) {
  await requireProjectAccess(userId, projectId, "MEMBER");
  return prisma.sprint.create({
    data: {
      projectId,
      name: input.name,
      goal: input.goal,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
    },
  });
}

export async function updateSprint(userId: string, sprintId: string, input: UpdateSprintInput) {
  const sprint = await prisma.sprint.findUnique({ where: { id: sprintId } });
  if (!sprint) throw new ApiError("Sprint not found", 404);
  await requireProjectAccess(userId, sprint.projectId, "MEMBER");
  return prisma.sprint.update({
    where: { id: sprintId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.goal !== undefined ? { goal: input.goal } : {}),
      ...(input.startDate !== undefined ? { startDate: input.startDate ? new Date(input.startDate) : null } : {}),
      ...(input.endDate !== undefined ? { endDate: input.endDate ? new Date(input.endDate) : null } : {}),
    },
  });
}

export async function startSprint(userId: string, sprintId: string) {
  const sprint = await prisma.sprint.findUnique({ where: { id: sprintId } });
  if (!sprint) throw new ApiError("Sprint not found", 404);
  if (sprint.status !== "PLANNED") throw new ApiError("Only a planned sprint can be started", 400);
  const { project } = await requireProjectAccess(userId, sprint.projectId, "MEMBER");

  const activeSprint = await prisma.sprint.findFirst({ where: { projectId: sprint.projectId, status: "ACTIVE" } });
  if (activeSprint) throw new ApiError("Another sprint is already active. Complete it first.", 409);

  const updated = await prisma.sprint.update({
    where: { id: sprintId },
    data: { status: "ACTIVE", startDate: sprint.startDate ?? new Date() },
  });

  await logActivity({ workspaceId: project.workspaceId, projectId: project.id, actorId: userId, type: "sprint.started", data: { sprintId, name: sprint.name } });

  const members = await prisma.projectMember.findMany({ where: { projectId: sprint.projectId } });
  await createNotifications(members.map((m) => m.userId), {
    actorId: userId,
    type: "SPRINT_STARTED",
    title: `${sprint.name} has started`,
    link: `/sprints/${sprintId}`,
  });

  return updated;
}

export async function completeSprint(userId: string, sprintId: string, moveIncompleteToBacklog = true) {
  const sprint = await prisma.sprint.findUnique({ where: { id: sprintId } });
  if (!sprint) throw new ApiError("Sprint not found", 404);
  if (sprint.status !== "ACTIVE") throw new ApiError("Only an active sprint can be completed", 400);
  const { project } = await requireProjectAccess(userId, sprint.projectId, "MEMBER");

  const updated = await prisma.sprint.update({
    where: { id: sprintId },
    data: { status: "COMPLETED", endDate: sprint.endDate ?? new Date() },
  });

  if (moveIncompleteToBacklog) {
    await prisma.issue.updateMany({
      where: { sprintId, status: { not: "DONE" } },
      data: { sprintId: null, status: "BACKLOG" },
    });
  }

  await logActivity({ workspaceId: project.workspaceId, projectId: project.id, actorId: userId, type: "sprint.completed", data: { sprintId, name: sprint.name } });

  const members = await prisma.projectMember.findMany({ where: { projectId: sprint.projectId } });
  await createNotifications(members.map((m) => m.userId), {
    actorId: userId,
    type: "SPRINT_ENDED",
    title: `${sprint.name} has completed`,
    link: `/sprints/${sprintId}`,
  });

  return updated;
}

export async function deleteSprint(userId: string, sprintId: string) {
  const sprint = await prisma.sprint.findUnique({ where: { id: sprintId } });
  if (!sprint) throw new ApiError("Sprint not found", 404);
  if (sprint.status === "ACTIVE") throw new ApiError("Complete the sprint before deleting it", 400);
  await requireProjectAccess(userId, sprint.projectId, "MEMBER");
  await prisma.issue.updateMany({ where: { sprintId }, data: { sprintId: null } });
  await prisma.sprint.delete({ where: { id: sprintId } });
}

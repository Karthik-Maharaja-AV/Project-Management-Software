import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-utils";
import { requireProjectAccess } from "@/lib/authz";
import type { CreateEpicInput, UpdateEpicInput } from "@/lib/validations/epic";

export async function listEpics(userId: string, projectId: string) {
  await requireProjectAccess(userId, projectId, "GUEST");
  const epics = await prisma.epic.findMany({
    where: { projectId },
    include: { issues: { select: { id: true, status: true, storyPoints: true } } },
    orderBy: { createdAt: "asc" },
  });
  return epics.map(withEpicProgress);
}

function withEpicProgress<T extends { issues: { status: string; storyPoints: number | null }[] }>(epic: T) {
  const total = epic.issues.length;
  const done = epic.issues.filter((i) => i.status === "DONE").length;
  const totalPoints = epic.issues.reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);
  const donePoints = epic.issues
    .filter((i) => i.status === "DONE")
    .reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);
  return {
    ...epic,
    progress: { total, done, totalPoints, donePoints, percent: total === 0 ? 0 : Math.round((done / total) * 100) },
  };
}

export async function getEpic(userId: string, epicId: string) {
  const epic = await prisma.epic.findUnique({
    where: { id: epicId },
    include: {
      project: true,
      issues: {
        include: {
          assignee: { select: { id: true, name: true, username: true, avatarUrl: true } },
          labels: { include: { label: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!epic) throw new ApiError("Epic not found", 404);
  await requireProjectAccess(userId, epic.projectId, "GUEST");
  return withEpicProgress(epic);
}

export async function createEpic(userId: string, projectId: string, input: CreateEpicInput) {
  await requireProjectAccess(userId, projectId, "MEMBER");
  return prisma.epic.create({ data: { projectId, ...input } });
}

export async function updateEpic(userId: string, epicId: string, input: UpdateEpicInput) {
  const epic = await prisma.epic.findUnique({ where: { id: epicId } });
  if (!epic) throw new ApiError("Epic not found", 404);
  await requireProjectAccess(userId, epic.projectId, "MEMBER");
  return prisma.epic.update({ where: { id: epicId }, data: input });
}

export async function deleteEpic(userId: string, epicId: string) {
  const epic = await prisma.epic.findUnique({ where: { id: epicId } });
  if (!epic) throw new ApiError("Epic not found", 404);
  await requireProjectAccess(userId, epic.projectId, "MEMBER");
  await prisma.epic.delete({ where: { id: epicId } });
}

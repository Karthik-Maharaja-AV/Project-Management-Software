import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-utils";
import { requireProjectAccess } from "@/lib/authz";
import type { CreateLabelInput } from "@/lib/validations/project";

export async function listLabels(userId: string, projectId: string) {
  await requireProjectAccess(userId, projectId, "GUEST");
  return prisma.label.findMany({ where: { projectId }, orderBy: { name: "asc" } });
}

export async function createLabel(userId: string, projectId: string, input: CreateLabelInput) {
  await requireProjectAccess(userId, projectId, "MEMBER");
  const existing = await prisma.label.findUnique({
    where: { projectId_name: { projectId, name: input.name } },
  });
  if (existing) throw new ApiError("A label with this name already exists", 409);
  return prisma.label.create({ data: { projectId, ...input } });
}

export async function updateLabel(userId: string, projectId: string, labelId: string, input: Partial<CreateLabelInput>) {
  await requireProjectAccess(userId, projectId, "MEMBER");
  const label = await prisma.label.findUnique({ where: { id: labelId } });
  if (!label || label.projectId !== projectId) throw new ApiError("Label not found", 404);
  return prisma.label.update({ where: { id: labelId }, data: input });
}

export async function deleteLabel(userId: string, projectId: string, labelId: string) {
  await requireProjectAccess(userId, projectId, "MEMBER");
  const label = await prisma.label.findUnique({ where: { id: labelId } });
  if (!label || label.projectId !== projectId) throw new ApiError("Label not found", 404);
  await prisma.label.delete({ where: { id: labelId } });
}

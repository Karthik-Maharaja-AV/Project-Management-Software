import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";
import { requireWorkspaceRole, requireProjectAccess, requireWorkspaceBySlug, AuthzError } from "@/lib/authz";
import { logActivity } from "@/lib/services/activity.service";
import { createNotification } from "@/lib/services/notification.service";
import type { AddProjectMemberInput, CreateProjectInput, UpdateProjectInput } from "@/lib/validations/project";

export async function createProject(userId: string, workspaceId: string, input: CreateProjectInput) {
  await requireWorkspaceRole(userId, workspaceId, "MEMBER");

  const existingKey = await prisma.project.findUnique({
    where: { workspaceId_key: { workspaceId, key: input.key } },
  });
  if (existingKey) throw new ApiError(`Project key "${input.key}" is already used in this workspace`, 409);

  const project = await prisma.project.create({
    data: {
      workspaceId,
      name: input.name,
      key: input.key,
      description: input.description,
      icon: input.icon,
      color: input.color ?? "#e2661c",
      members: { create: { userId, role: "LEAD" } },
      labels: {
        create: [
          { name: "bug", color: "#d1403a" },
          { name: "frontend", color: "#6b7fd7" },
          { name: "backend", color: "#1f8a9e" },
          { name: "documentation", color: "#a8a296" },
        ],
      },
    },
  });

  await logActivity({ workspaceId, projectId: project.id, actorId: userId, type: "project.created" });

  return project;
}

export async function listProjects(userId: string, workspaceId: string) {
  await requireWorkspaceRole(userId, workspaceId, "GUEST");
  return prisma.project.findMany({
    where: { workspaceId, archivedAt: null },
    include: { _count: { select: { issues: true, members: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function getProjectByKey(userId: string, workspaceSlug: string, projectKey: string) {
  const { workspace, member } = await requireWorkspaceBySlug(userId, workspaceSlug, "GUEST");
  const project = await prisma.project.findUnique({
    where: { workspaceId_key: { workspaceId: workspace.id, key: projectKey.toUpperCase() } },
  });
  if (!project) throw new ApiError("Project not found", 404);
  return { workspace, project, workspaceRole: member.role };
}

export async function updateProject(userId: string, projectId: string, input: UpdateProjectInput) {
  const { project } = await requireProjectAccess(userId, projectId, "MEMBER");
  return prisma.project.update({
    where: { id: project.id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.icon !== undefined ? { icon: input.icon } : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
    },
  });
}

export async function archiveProject(userId: string, projectId: string) {
  await requireProjectAccess(userId, projectId, "ADMIN");
  return prisma.project.update({ where: { id: projectId }, data: { archivedAt: new Date() } });
}

export async function listProjectMembers(userId: string, projectId: string) {
  await requireProjectAccess(userId, projectId, "GUEST");
  return prisma.projectMember.findMany({
    where: { projectId },
    include: { user: { select: { id: true, name: true, username: true, avatarUrl: true, email: true } } },
    orderBy: { joinedAt: "asc" },
  });
}

export async function addProjectMember(userId: string, projectId: string, input: AddProjectMemberInput) {
  const { project, workspaceMember: actorMembership } = await requireProjectAccess(userId, projectId, "MEMBER");

  const targetMembership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: project.workspaceId, userId: input.userId } },
  });
  if (!targetMembership) {
    throw new ApiError("That user isn't a member of this workspace", 400);
  }
  void actorMembership;

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: input.userId } },
  });
  if (existing) throw new ApiError("Already a project member", 409);

  const member = await prisma.projectMember.create({
    data: { projectId, userId: input.userId, role: input.role },
    include: { user: { select: { id: true, name: true, username: true, avatarUrl: true } } },
  });

  await logActivity({
    workspaceId: project.workspaceId,
    projectId,
    actorId: userId,
    type: "project.member_added",
    data: { targetUserId: input.userId },
  });

  await createNotification({
    userId: input.userId,
    actorId: userId,
    type: "ADDED_TO_PROJECT",
    title: `You were added to ${project.name}`,
    link: `/projects/${project.id}`,
  });

  return member;
}

export async function removeProjectMember(userId: string, projectId: string, targetUserId: string) {
  const { project } = await requireProjectAccess(userId, projectId, "MEMBER");
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: targetUserId } },
  });
  if (!membership) throw new ApiError("Member not found", 404);
  if (membership.role === "LEAD" && membership.userId === userId) {
    const leadCount = await prisma.projectMember.count({ where: { projectId, role: "LEAD" } });
    if (leadCount <= 1) throw new AuthzError("Assign another lead before leaving the project", 400);
  }
  await prisma.projectMember.delete({ where: { id: membership.id } });
  void project;
}

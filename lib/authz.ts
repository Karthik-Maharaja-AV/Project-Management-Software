import { prisma } from "@/lib/prisma";
import type { WorkspaceRole } from "@prisma/client";

export class AuthzError extends Error {
  status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.name = "AuthzError";
    this.status = status;
  }
}

const ROLE_RANK: Record<WorkspaceRole, number> = {
  GUEST: 0,
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3,
};

export function workspaceRoleAtLeast(role: WorkspaceRole, min: WorkspaceRole) {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}

/** Verifies the user belongs to the workspace with at least `minRole`, throws AuthzError otherwise. */
export async function requireWorkspaceRole(
  userId: string,
  workspaceId: string,
  minRole: WorkspaceRole = "GUEST",
) {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!member) {
    throw new AuthzError("You do not have access to this workspace", 403);
  }
  if (!workspaceRoleAtLeast(member.role, minRole)) {
    throw new AuthzError("Insufficient permissions in this workspace", 403);
  }
  return member;
}

/** Verifies the user can access the project's parent workspace. Returns project + membership. */
export async function requireProjectAccess(
  userId: string,
  projectId: string,
  minRole: WorkspaceRole = "GUEST",
) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new AuthzError("Project not found", 404);
  }
  const workspaceMember = await requireWorkspaceRole(userId, project.workspaceId, minRole);
  return { project, workspaceMember };
}

/** Verifies the user can access the issue's project/workspace. Returns issue + project. */
export async function requireIssueAccess(
  userId: string,
  issueId: string,
  minRole: WorkspaceRole = "GUEST",
) {
  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue) {
    throw new AuthzError("Issue not found", 404);
  }
  const { project, workspaceMember } = await requireProjectAccess(userId, issue.projectId, minRole);
  return { issue, project, workspaceMember };
}

/** Resolves a workspace by slug, verifying membership. */
export async function requireWorkspaceBySlug(
  userId: string,
  slug: string,
  minRole: WorkspaceRole = "GUEST",
) {
  const workspace = await prisma.workspace.findUnique({ where: { slug } });
  if (!workspace) {
    throw new AuthzError("Workspace not found", 404);
  }
  const member = await requireWorkspaceRole(userId, workspace.id, minRole);
  return { workspace, member };
}

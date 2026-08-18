import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";
import { requireWorkspaceRole, workspaceRoleAtLeast, AuthzError } from "@/lib/authz";
import { slugify } from "@/lib/slug";
import { logActivity } from "@/lib/services/activity.service";
import { createNotification } from "@/lib/services/notification.service";
import type { CreateWorkspaceInput, InviteMemberInput, UpdateWorkspaceInput } from "@/lib/validations/workspace";
import type { WorkspaceRole } from "@prisma/client";

const INVITATION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

// Top-level static routes a workspace slug must never collide with.
const RESERVED_SLUGS = new Set([
  "invite",
  "workspaces",
  "api",
  "login",
  "register",
  "forgot-password",
  "reset-password",
  "settings",
  "my-work",
  "search",
  "_next",
]);

async function uniqueSlug(base: string) {
  const root = slugify(base);
  let candidate = root;
  let n = 1;
  while (true) {
    const taken = RESERVED_SLUGS.has(candidate) || (await prisma.workspace.findUnique({ where: { slug: candidate } }));
    if (!taken) return candidate;
    n += 1;
    candidate = `${root}-${n}`;
  }
}

export async function createWorkspace(userId: string, input: CreateWorkspaceInput) {
  const slug = await uniqueSlug(input.name);

  return prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({
      data: {
        name: input.name,
        slug,
        icon: input.icon,
        description: input.description,
        ownerId: userId,
        members: { create: { userId, role: "OWNER" } },
      },
    });
    return workspace;
  });
}

export async function listUserWorkspaces(userId: string) {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: {
        include: { _count: { select: { members: true, projects: true } } },
      },
    },
    orderBy: { joinedAt: "asc" },
  });
  return memberships.map((m) => ({ ...m.workspace, role: m.role }));
}

export async function getWorkspaceDetail(userId: string, slug: string) {
  const workspace = await prisma.workspace.findUnique({ where: { slug } });
  if (!workspace) throw new ApiError("Workspace not found", 404);
  const member = await requireWorkspaceRole(userId, workspace.id, "GUEST");
  return { workspace, role: member.role };
}

export async function updateWorkspace(userId: string, workspaceId: string, input: UpdateWorkspaceInput) {
  await requireWorkspaceRole(userId, workspaceId, "ADMIN");
  return prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.icon !== undefined ? { icon: input.icon } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    },
  });
}

export async function listMembers(userId: string, workspaceId: string) {
  await requireWorkspaceRole(userId, workspaceId, "GUEST");
  return prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: { user: { select: { id: true, name: true, username: true, avatarUrl: true, email: true } } },
    orderBy: { joinedAt: "asc" },
  });
}

export async function listInvitations(userId: string, workspaceId: string) {
  await requireWorkspaceRole(userId, workspaceId, "ADMIN");
  return prisma.workspaceInvitation.findMany({
    where: { workspaceId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
}

export async function inviteMember(userId: string, workspaceId: string, input: InviteMemberInput) {
  await requireWorkspaceRole(userId, workspaceId, "ADMIN");

  const workspace = await prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId } });

  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
  if (existingUser) {
    const existingMember = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: existingUser.id } },
    });
    if (existingMember) throw new ApiError("This person is already a member", 409);
  }

  const existingInvite = await prisma.workspaceInvitation.findFirst({
    where: { workspaceId, email: input.email, status: "PENDING" },
  });
  if (existingInvite) throw new ApiError("An invitation is already pending for this email", 409);

  const token = crypto.randomBytes(24).toString("hex");
  const invitation = await prisma.workspaceInvitation.create({
    data: {
      workspaceId,
      email: input.email,
      role: input.role,
      token,
      invitedById: userId,
      expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
    },
  });

  if (existingUser) {
    await createNotification({
      userId: existingUser.id,
      actorId: userId,
      type: "ADDED_TO_WORKSPACE",
      title: `You've been invited to ${workspace.name}`,
      link: `/invite/${token}`,
    });
  }

  return invitation;
}

export async function revokeInvitation(userId: string, workspaceId: string, invitationId: string) {
  await requireWorkspaceRole(userId, workspaceId, "ADMIN");
  const invitation = await prisma.workspaceInvitation.findUnique({ where: { id: invitationId } });
  if (!invitation || invitation.workspaceId !== workspaceId) {
    throw new ApiError("Invitation not found", 404);
  }
  await prisma.workspaceInvitation.update({ where: { id: invitationId }, data: { status: "REVOKED" } });
}

export async function getInvitationByToken(token: string) {
  const invitation = await prisma.workspaceInvitation.findUnique({
    where: { token },
    include: { workspace: true, invitedBy: { select: { name: true, username: true } } },
  });
  if (!invitation) throw new ApiError("Invitation not found", 404);
  return invitation;
}

export async function acceptInvitation(userId: string, userEmail: string, token: string) {
  const invitation = await prisma.workspaceInvitation.findUnique({ where: { token } });
  if (!invitation) throw new ApiError("Invitation not found", 404);
  if (invitation.status !== "PENDING") throw new ApiError("This invitation is no longer valid", 400);
  if (invitation.expiresAt < new Date()) throw new ApiError("This invitation has expired", 400);
  if (invitation.email !== userEmail) {
    throw new ApiError("This invitation was sent to a different email address", 403);
  }

  const existing = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: invitation.workspaceId, userId } },
  });
  if (existing) {
    await prisma.workspaceInvitation.update({ where: { id: invitation.id }, data: { status: "ACCEPTED" } });
    return existing;
  }

  const [member] = await prisma.$transaction([
    prisma.workspaceMember.create({
      data: { workspaceId: invitation.workspaceId, userId, role: invitation.role },
    }),
    prisma.workspaceInvitation.update({ where: { id: invitation.id }, data: { status: "ACCEPTED" } }),
  ]);

  await logActivity({
    workspaceId: invitation.workspaceId,
    actorId: userId,
    type: "workspace.member_joined",
  });

  return member;
}

export async function rejectInvitation(userEmail: string, token: string) {
  const invitation = await prisma.workspaceInvitation.findUnique({ where: { token } });
  if (!invitation) throw new ApiError("Invitation not found", 404);
  if (invitation.email !== userEmail) throw new ApiError("This invitation was sent to a different email address", 403);
  await prisma.workspaceInvitation.update({ where: { id: invitation.id }, data: { status: "REJECTED" } });
}

export async function removeMember(userId: string, workspaceId: string, targetUserId: string) {
  const actorMember = await requireWorkspaceRole(userId, workspaceId, "ADMIN");
  const targetMember = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
  });
  if (!targetMember) throw new ApiError("Member not found", 404);

  if (targetMember.role === "OWNER") {
    throw new AuthzError("The workspace owner can't be removed", 403);
  }
  if (!workspaceRoleAtLeast(actorMember.role, targetMember.role) && actorMember.role !== "OWNER") {
    throw new AuthzError("You can't remove a member with an equal or higher role", 403);
  }

  await prisma.workspaceMember.delete({ where: { id: targetMember.id } });
}

export async function updateMemberRole(
  userId: string,
  workspaceId: string,
  targetUserId: string,
  role: WorkspaceRole,
) {
  const actorMember = await requireWorkspaceRole(userId, workspaceId, "ADMIN");
  if (actorMember.role !== "OWNER") {
    throw new AuthzError("Only the workspace owner can change member roles", 403);
  }
  const targetMember = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
  });
  if (!targetMember) throw new ApiError("Member not found", 404);
  if (targetMember.role === "OWNER") throw new ApiError("Ownership can't be changed here", 400);

  return prisma.workspaceMember.update({ where: { id: targetMember.id }, data: { role } });
}

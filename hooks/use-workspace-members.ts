"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { WorkspaceRole } from "@prisma/client";
import type { InviteMemberInput } from "@/lib/validations/workspace";

export type WorkspaceMemberDTO = {
  id: string;
  role: WorkspaceRole;
  userId: string;
  user: { id: string; name: string; username: string; avatarUrl: string | null; email: string };
};

export type WorkspaceInvitationDTO = {
  id: string;
  email: string;
  role: WorkspaceRole;
  status: string;
  createdAt: string;
};

export function useWorkspaceMembers(workspaceId: string) {
  return useQuery({
    queryKey: ["workspace-members", workspaceId],
    queryFn: async (): Promise<WorkspaceMemberDTO[]> => {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`);
      if (!res.ok) throw new Error("Failed to load members");
      return (await res.json()).members;
    },
  });
}

export function useWorkspaceInvitations(workspaceId: string) {
  return useQuery({
    queryKey: ["workspace-invitations", workspaceId],
    queryFn: async (): Promise<WorkspaceInvitationDTO[]> => {
      const res = await fetch(`/api/workspaces/${workspaceId}/invitations`);
      if (!res.ok) throw new Error("Failed to load invitations");
      return (await res.json()).invitations;
    },
  });
}

export function useInviteMember(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: InviteMemberInput) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to send invitation");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspace-invitations", workspaceId] }),
  });
}

export function useRevokeInvitation(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invitationId: string) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/invitations/${invitationId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to revoke invitation");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspace-invitations", workspaceId] }),
  });
}

export function useRemoveMember(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to remove member");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspace-members", workspaceId] }),
  });
}

export function useUpdateMemberRole(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: WorkspaceRole }) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to update role");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspace-members", workspaceId] }),
  });
}

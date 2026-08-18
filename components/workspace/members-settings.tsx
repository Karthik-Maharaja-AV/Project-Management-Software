"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { MoreHorizontal, Send, X } from "lucide-react";
import type { WorkspaceRole } from "@prisma/client";
import { inviteMemberSchema, type InviteMemberInput } from "@/lib/validations/workspace";
import {
  useInviteMember,
  useRemoveMember,
  useRevokeInvitation,
  useUpdateMemberRole,
  useWorkspaceInvitations,
  useWorkspaceMembers,
} from "@/hooks/use-workspace-members";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function MembersSettings({
  workspaceId,
  currentUserId,
  isOwner,
  isAdmin,
}: {
  workspaceId: string;
  currentUserId: string;
  isOwner: boolean;
  isAdmin: boolean;
}) {
  const { data: members, isLoading: loadingMembers } = useWorkspaceMembers(workspaceId);
  const { data: invitations, isLoading: loadingInvites } = useWorkspaceInvitations(workspaceId);
  const removeMember = useRemoveMember(workspaceId);
  const updateRole = useUpdateMemberRole(workspaceId);
  const revokeInvite = useRevokeInvitation(workspaceId);
  const inviteMember = useInviteMember(workspaceId);
  const [inviteOpen, setInviteOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { role: "MEMBER" },
  });

  const onInvite = async (data: InviteMemberInput) => {
    try {
      await inviteMember.mutateAsync(data);
      toast.success(`Invitation sent to ${data.email}`);
      reset({ email: "", role: "MEMBER" });
      setInviteOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send invitation");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {isAdmin && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Invite a friend</CardTitle>
              <CardDescription>They&apos;ll get an in-app invitation to accept.</CardDescription>
            </div>
            {!inviteOpen && <Button onClick={() => setInviteOpen(true)}>Invite</Button>}
          </CardHeader>
          {inviteOpen && (
            <CardContent>
              <form onSubmit={handleSubmit(onInvite)} className="flex items-start gap-2">
                <div className="flex-1">
                  <Input placeholder="friend@example.com" {...register("email")} />
                  {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
                </div>
                <Controller
                  control={control}
                  name="role"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="MEMBER">Member</SelectItem>
                        <SelectItem value="GUEST">Guest</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <Button type="submit" disabled={inviteMember.isPending}>
                  <Send className="size-3.5" /> Send
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => setInviteOpen(false)}>
                  <X className="size-4" />
                </Button>
              </form>
            </CardContent>
          )}
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {loadingMembers ? (
            <MemberSkeletons />
          ) : (
            members?.map((member) => (
              <div key={member.id} className="flex items-center gap-3 rounded-[var(--radius-sm)] px-2 py-2 hover:bg-surface-2">
                <Avatar name={member.user.name} src={member.user.avatarUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-text-primary">{member.user.name}</p>
                  <p className="truncate text-xs text-text-tertiary">{member.user.email}</p>
                </div>
                {isOwner && member.role !== "OWNER" ? (
                  <Select
                    defaultValue={member.role}
                    onValueChange={(role) => updateRole.mutate({ userId: member.userId, role: role as WorkspaceRole })}
                  >
                    <SelectTrigger className="h-7 w-28 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="GUEST">Guest</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={member.role === "OWNER" ? "accent" : "default"}>{member.role.toLowerCase()}</Badge>
                )}
                {isAdmin && member.role !== "OWNER" && member.userId !== currentUserId && (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex size-7 items-center justify-center rounded-[var(--radius-sm)] text-text-tertiary hover:bg-surface-2">
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-danger focus:bg-danger-muted"
                        onSelect={() => removeMember.mutate(member.userId)}
                      >
                        Remove from workspace
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Pending invitations</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {loadingInvites ? (
              <MemberSkeletons />
            ) : invitations && invitations.length > 0 ? (
              invitations.map((inv) => (
                <div key={inv.id} className="flex items-center gap-3 rounded-[var(--radius-sm)] px-2 py-2 hover:bg-surface-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-text-primary">{inv.email}</p>
                  </div>
                  <Badge>{inv.role.toLowerCase()}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => revokeInvite.mutate(inv.id)}>
                    Revoke
                  </Button>
                </div>
              ))
            ) : (
              <p className="px-2 py-3 text-sm text-text-tertiary">No pending invitations.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MemberSkeletons() {
  return (
    <div className="flex flex-col gap-2">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  );
}

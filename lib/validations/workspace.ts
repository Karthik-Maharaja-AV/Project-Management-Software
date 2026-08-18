import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  icon: z.string().trim().max(8).optional(),
  description: z.string().trim().max(280).optional(),
});
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

export const updateWorkspaceSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  icon: z.string().trim().max(8).optional().nullable(),
  description: z.string().trim().max(280).optional().nullable(),
});
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;

export const inviteMemberSchema = z.object({
  email: z.email().trim().toLowerCase(),
  role: z.enum(["ADMIN", "MEMBER", "GUEST"]),
});
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const updateMemberRoleSchema = z.object({
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "GUEST"]),
});
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

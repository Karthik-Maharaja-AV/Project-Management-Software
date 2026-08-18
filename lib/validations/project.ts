import { z } from "zod";

const keyRegex = /^[A-Z][A-Z0-9]{1,9}$/;

export const createProjectSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  key: z
    .string()
    .trim()
    .toUpperCase()
    .regex(keyRegex, "2-10 uppercase letters/numbers, starting with a letter"),
  description: z.string().trim().max(280).optional(),
  icon: z.string().trim().max(8).optional(),
  color: z.string().trim().max(9).optional(),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  description: z.string().trim().max(280).optional().nullable(),
  icon: z.string().trim().max(8).optional().nullable(),
  color: z.string().trim().max(9).optional(),
});
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const addProjectMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["LEAD", "MEMBER", "VIEWER"]).default("MEMBER"),
});
export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;

export const createLabelSchema = z.object({
  name: z.string().trim().min(1).max(30),
  color: z.string().trim().min(4).max(9),
  description: z.string().trim().max(140).optional(),
});
export type CreateLabelInput = z.infer<typeof createLabelSchema>;

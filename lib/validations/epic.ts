import { z } from "zod";

export const createEpicSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(4000).optional(),
  color: z.string().trim().max(9).optional(),
});
export type CreateEpicInput = z.infer<typeof createEpicSchema>;

export const updateEpicSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(4000).optional().nullable(),
  color: z.string().trim().max(9).optional(),
  status: z.enum(["PLANNED", "IN_PROGRESS", "DONE"]).optional(),
});
export type UpdateEpicInput = z.infer<typeof updateEpicSchema>;

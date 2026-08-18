import { z } from "zod";

export const createSprintSchema = z.object({
  name: z.string().trim().min(1).max(120),
  goal: z.string().trim().max(500).optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
});
export type CreateSprintInput = z.infer<typeof createSprintSchema>;

export const updateSprintSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  goal: z.string().trim().max(500).optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
});
export type UpdateSprintInput = z.infer<typeof updateSprintSchema>;

import { z } from "zod";

const issueTypeEnum = z.enum(["TASK", "BUG", "FEATURE", "IMPROVEMENT", "EPIC", "STORY"]);
const issueStatusEnum = z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]);
const issuePriorityEnum = z.enum(["NO_PRIORITY", "LOW", "MEDIUM", "HIGH", "URGENT"]);

export const createIssueSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().trim().min(1, "Title is required").max(240),
  description: z.string().trim().max(20000).optional(),
  type: issueTypeEnum.optional(),
  status: issueStatusEnum.optional(),
  priority: issuePriorityEnum.optional(),
  assigneeId: z.string().min(1).optional().nullable(),
  epicId: z.string().min(1).optional().nullable(),
  sprintId: z.string().min(1).optional().nullable(),
  parentId: z.string().min(1).optional().nullable(),
  storyPoints: z.number().int().min(0).max(999).optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  labelIds: z.array(z.string().min(1)).optional(),
});
export type CreateIssueInput = z.infer<typeof createIssueSchema>;

export const updateIssueSchema = z.object({
  title: z.string().trim().min(1).max(240).optional(),
  description: z.string().trim().max(20000).optional().nullable(),
  type: issueTypeEnum.optional(),
  status: issueStatusEnum.optional(),
  priority: issuePriorityEnum.optional(),
  assigneeId: z.string().min(1).optional().nullable(),
  epicId: z.string().min(1).optional().nullable(),
  sprintId: z.string().min(1).optional().nullable(),
  parentId: z.string().min(1).optional().nullable(),
  storyPoints: z.number().int().min(0).max(999).optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  boardOrder: z.number().optional(),
});
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>;

export const moveIssueSchema = z.object({
  status: issueStatusEnum,
  beforeId: z.string().min(1).optional().nullable(),
  afterId: z.string().min(1).optional().nullable(),
});
export type MoveIssueInput = z.infer<typeof moveIssueSchema>;

export const issueFilterSchema = z.object({
  status: z.array(issueStatusEnum).optional(),
  assigneeId: z.array(z.string()).optional(),
  priority: z.array(issuePriorityEnum).optional(),
  type: z.array(issueTypeEnum).optional(),
  labelId: z.array(z.string()).optional(),
  sprintId: z.string().optional(),
  epicId: z.string().optional(),
  search: z.string().optional(),
});
export type IssueFilterInput = z.infer<typeof issueFilterSchema>;

export const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(10000),
});
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const createIssueLinkSchema = z.object({
  targetIssueId: z.string().min(1),
  type: z.enum(["BLOCKS", "BLOCKED_BY", "RELATES_TO", "DUPLICATES", "DUPLICATED_BY"]),
});
export type CreateIssueLinkInput = z.infer<typeof createIssueLinkSchema>;

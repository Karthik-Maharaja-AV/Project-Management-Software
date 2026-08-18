import type { IssuePriority, IssueStatus, IssueType, SprintStatus, EpicStatus } from "@prisma/client";

export type UserSummary = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
};

export type LabelDTO = {
  id: string;
  name: string;
  color: string;
  description: string | null;
  projectId: string;
};

export type EpicSummary = { id: string; name: string; color: string; status?: EpicStatus };
export type SprintSummary = { id: string; name: string; status: SprintStatus };
export type ProjectSummaryDTO = {
  id: string;
  key: string;
  name: string;
  color: string;
  workspaceId: string;
};

export type IssueDTO = {
  id: string;
  key: string;
  url: string;
  number: number;
  projectId: string;
  title: string;
  description: string | null;
  type: IssueType;
  status: IssueStatus;
  priority: IssuePriority;
  assigneeId: string | null;
  assignee: UserSummary | null;
  reporterId: string;
  reporter: UserSummary;
  epicId: string | null;
  epic: EpicSummary | null;
  sprintId: string | null;
  sprint: SprintSummary | null;
  parentId: string | null;
  parent: { id: string; title: string; number: number } | null;
  subtasks: { id: string; number: number; title: string; status: IssueStatus; assignee: UserSummary | null }[];
  storyPoints: number | null;
  dueDate: string | null;
  boardOrder: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  labels: LabelDTO[];
  project: ProjectSummaryDTO;
  _count: { subtasks: number; comments: number; attachments: number };
};

export type CommentDTO = {
  id: string;
  issueId: string;
  authorId: string;
  author: UserSummary;
  body: string;
  editedAt: string | null;
  createdAt: string;
};

export type ActivityDTO = {
  id: string;
  workspaceId: string;
  projectId: string | null;
  issueId: string | null;
  actorId: string;
  actor: UserSummary;
  type: string;
  data: Record<string, unknown>;
  createdAt: string;
};

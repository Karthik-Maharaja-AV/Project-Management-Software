import {
  Bug,
  CheckCircle2,
  Circle,
  CircleDot,
  Eye,
  ListTodo,
  Sparkles,
  Wrench,
  BookOpen,
  Flag,
  SignalHigh,
  SignalLow,
  SignalMedium,
  AlertTriangle,
  Minus,
} from "lucide-react";
import type { IssueStatus, IssuePriority, IssueType, WorkspaceRole, ProjectRole } from "@prisma/client";

export const ISSUE_STATUSES: { value: IssueStatus; label: string; color: string }[] = [
  { value: "BACKLOG", label: "Backlog", color: "var(--status-backlog)" },
  { value: "TODO", label: "Todo", color: "var(--status-todo)" },
  { value: "IN_PROGRESS", label: "In Progress", color: "var(--status-in-progress)" },
  { value: "IN_REVIEW", label: "In Review", color: "var(--status-in-review)" },
  { value: "DONE", label: "Done", color: "var(--status-done)" },
];

export const BOARD_STATUSES: IssueStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

export const STATUS_ICON: Record<IssueStatus, typeof Circle> = {
  BACKLOG: Circle,
  TODO: CircleDot,
  IN_PROGRESS: ListTodo,
  IN_REVIEW: Eye,
  DONE: CheckCircle2,
};

export const ISSUE_PRIORITIES: { value: IssuePriority; label: string; color: string }[] = [
  { value: "URGENT", label: "Urgent", color: "var(--priority-urgent)" },
  { value: "HIGH", label: "High", color: "var(--priority-high)" },
  { value: "MEDIUM", label: "Medium", color: "var(--priority-medium)" },
  { value: "LOW", label: "Low", color: "var(--priority-low)" },
  { value: "NO_PRIORITY", label: "No priority", color: "var(--priority-none)" },
];

export const PRIORITY_ICON: Record<IssuePriority, typeof Flag> = {
  URGENT: AlertTriangle,
  HIGH: SignalHigh,
  MEDIUM: SignalMedium,
  LOW: SignalLow,
  NO_PRIORITY: Minus,
};

export const ISSUE_TYPES: { value: IssueType; label: string; color: string }[] = [
  { value: "TASK", label: "Task", color: "var(--type-task)" },
  { value: "BUG", label: "Bug", color: "var(--type-bug)" },
  { value: "FEATURE", label: "Feature", color: "var(--type-feature)" },
  { value: "IMPROVEMENT", label: "Improvement", color: "var(--type-improvement)" },
  { value: "EPIC", label: "Epic", color: "var(--type-epic)" },
  { value: "STORY", label: "Story", color: "var(--type-story)" },
];

export const TYPE_ICON: Record<IssueType, typeof Wrench> = {
  TASK: ListTodo,
  BUG: Bug,
  FEATURE: Sparkles,
  IMPROVEMENT: Wrench,
  EPIC: Flag,
  STORY: BookOpen,
};

export const WORKSPACE_ROLES: WorkspaceRole[] = ["OWNER", "ADMIN", "MEMBER", "GUEST"];
export const PROJECT_ROLES: ProjectRole[] = ["LEAD", "MEMBER", "VIEWER"];

export const LABEL_COLORS = [
  "#e2661c",
  "#d1403a",
  "#b7791f",
  "#c9a227",
  "#1f8a5f",
  "#1f8a9e",
  "#2563a8",
  "#6b7fd7",
  "#9256d9",
  "#a8a296",
];

export function findMeta<T extends { value: string }>(list: T[], value: string) {
  return list.find((item) => item.value === value) ?? list[list.length - 1];
}

export function randomLabelColor() {
  return LABEL_COLORS[Math.floor(Math.random() * LABEL_COLORS.length)];
}

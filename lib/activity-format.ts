import { findMeta, ISSUE_STATUSES, ISSUE_PRIORITIES } from "@/lib/constants";
import type { ActivityDTO } from "@/lib/types";

function statusLabel(value: unknown) {
  if (typeof value !== "string") return "none";
  return findMeta(ISSUE_STATUSES, value).label;
}
function priorityLabel(value: unknown) {
  if (typeof value !== "string") return "none";
  return findMeta(ISSUE_PRIORITIES, value).label;
}

export function formatActivity(activity: ActivityDTO): string {
  const d = activity.data ?? {};
  switch (activity.type) {
    case "issue.created":
      return "created this issue";
    case "issue.status_changed": {
      const from = (d.status as { from?: unknown; to?: unknown }) ?? {};
      return `changed status from ${statusLabel(from.from)} to ${statusLabel(from.to)}`;
    }
    case "issue.priority_changed": {
      const p = (d.priority as { from?: unknown; to?: unknown }) ?? {};
      return `changed priority from ${priorityLabel(p.from)} to ${priorityLabel(p.to)}`;
    }
    case "issue.assigned":
      return "assigned this issue";
    case "issue.unassigned":
      return "unassigned this issue";
    case "issue.moved_to_sprint":
      return "moved this issue into a sprint";
    case "issue.removed_from_sprint":
      return "moved this issue back to the backlog";
    case "issue.commented":
      return "commented";
    case "issue.attachment_added":
      return `attached ${typeof d.attachment === "string" ? `"${d.attachment}"` : "a file"}`;
    case "issue.archived":
      return "archived this issue";
    case "issue.deleted":
      return "deleted this issue";
    case "project.created":
      return "created this project";
    case "project.member_added":
      return "added a member to the project";
    case "sprint.created":
      return "created a sprint";
    case "sprint.started":
      return `started sprint "${(d as { name?: string }).name ?? ""}"`;
    case "sprint.completed":
      return `completed sprint "${(d as { name?: string }).name ?? ""}"`;
    case "workspace.member_joined":
      return "joined the workspace";
    default:
      return activity.type.replace(/[._]/g, " ");
  }
}

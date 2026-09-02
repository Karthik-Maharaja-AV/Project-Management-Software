"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IssueCard } from "@/components/issues/issue-card";
import type { IssueDTO } from "@/lib/types";

export function DraggableIssueCard({ issue, workspaceSlug }: { issue: IssueDTO; workspaceSlug: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: issue.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={isDragging ? "opacity-40" : undefined}
    >
      <IssueCard issue={issue} workspaceSlug={workspaceSlug} />
    </div>
  );
}

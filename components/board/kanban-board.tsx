"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { BOARD_STATUSES } from "@/lib/constants";
import { useProjectIssues, useMoveIssue } from "@/hooks/use-issues";
import { BoardColumn } from "@/components/board/board-column";
import { BoardFilters, EMPTY_FILTERS, applyFilters, type BoardFilterState } from "@/components/board/board-filters";
import { IssueCard } from "@/components/issues/issue-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { IssueDTO } from "@/lib/types";
import type { IssueStatus } from "@prisma/client";

export function KanbanBoard({ projectId }: { projectId: string }) {
  const { data: issues, isLoading } = useProjectIssues(projectId);
  const moveIssue = useMoveIssue(projectId);
  const [filters, setFilters] = useState<BoardFilterState>(EMPTY_FILTERS);
  const [activeIssue, setActiveIssue] = useState<IssueDTO | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const filtered = useMemo(() => (issues ? applyFilters(issues, filters) : []), [issues, filters]);

  const columns = useMemo(() => {
    const grouped: Record<IssueStatus, IssueDTO[]> = {
      BACKLOG: [],
      TODO: [],
      IN_PROGRESS: [],
      IN_REVIEW: [],
      DONE: [],
    };
    for (const issue of filtered) {
      grouped[issue.status].push(issue);
    }
    for (const status of BOARD_STATUSES) {
      grouped[status].sort((a, b) => a.boardOrder - b.boardOrder);
    }
    return grouped;
  }, [filtered]);

  function handleDragStart(event: DragStartEvent) {
    const issue = issues?.find((i) => i.id === event.active.id);
    setActiveIssue(issue ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveIssue(null);
    const { active, over } = event;
    if (!over || !issues) return;

    const draggedIssue = issues.find((i) => i.id === active.id);
    if (!draggedIssue) return;

    let targetStatus: IssueStatus;
    let overIssueId: string | null = null;

    if (typeof over.id === "string" && over.id.startsWith("column:")) {
      targetStatus = over.id.replace("column:", "") as IssueStatus;
    } else {
      const overIssue = issues.find((i) => i.id === over.id);
      if (!overIssue) return;
      targetStatus = overIssue.status;
      overIssueId = overIssue.id;
    }

    const columnIssues = columns[targetStatus].filter((i) => i.id !== draggedIssue.id);
    let beforeId: string | null = null;
    let afterId: string | null = null;

    if (overIssueId) {
      const overIndex = columnIssues.findIndex((i) => i.id === overIssueId);
      afterId = columnIssues[overIndex - 1]?.id ?? null;
      beforeId = columnIssues[overIndex]?.id ?? null;
    } else {
      afterId = columnIssues[columnIssues.length - 1]?.id ?? null;
    }

    if (draggedIssue.status === targetStatus && !overIssueId) return;

    try {
      await moveIssue.mutateAsync({
        issueId: draggedIssue.id,
        input: { status: targetStatus, beforeId, afterId },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to move issue");
    }
  }

  if (isLoading) {
    return (
      <div className="flex gap-4 p-4">
        {BOARD_STATUSES.map((s) => (
          <div key={s} className="flex w-72 shrink-0 flex-col gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <BoardFilters projectId={projectId} filters={filters} onChange={setFilters} />
      <div className="flex-1 overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex h-full gap-4 p-4">
            {BOARD_STATUSES.map((status) => (
              <BoardColumn key={status} status={status} issues={columns[status]} projectId={projectId} />
            ))}
          </div>
          <DragOverlay>{activeIssue && <IssueCard issue={activeIssue} className="w-72 rotate-2" />}</DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

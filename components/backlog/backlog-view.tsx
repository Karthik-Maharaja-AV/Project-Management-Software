"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useProjectIssues, useUpdateIssue } from "@/hooks/use-issues";
import { useProjectSprints } from "@/hooks/use-sprints";
import { useUiStore } from "@/lib/stores/ui-store";
import { SprintSection } from "@/components/backlog/sprint-section";
import { BacklogIssueRow } from "@/components/backlog/backlog-issue-row";
import { CreateSprintDialog } from "@/components/backlog/create-sprint-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ListTree } from "lucide-react";
import type { IssueDTO } from "@/lib/types";

type SprintDTO = {
  id: string;
  name: string;
  goal: string | null;
  status: "PLANNED" | "ACTIVE" | "COMPLETED";
  startDate: string | null;
  endDate: string | null;
};

export function BacklogView({ projectId }: { projectId: string }) {
  const { data: issues, isLoading: issuesLoading } = useProjectIssues(projectId);
  const { data: sprints, isLoading: sprintsLoading } = useProjectSprints(projectId);
  const updateIssue = useUpdateIssue(projectId);
  const openCreateIssue = useUiStore((s) => s.openCreateIssue);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [createSprintOpen, setCreateSprintOpen] = useState(false);

  const activeAndPlannedSprints = useMemo(
    () => (sprints ?? []).filter((s: SprintDTO) => s.status !== "COMPLETED"),
    [sprints],
  );

  const issuesBySprintId = useMemo(() => {
    const map = new Map<string, IssueDTO[]>();
    for (const issue of issues ?? []) {
      if (!issue.sprintId) continue;
      if (!map.has(issue.sprintId)) map.set(issue.sprintId, []);
      map.get(issue.sprintId)!.push(issue);
    }
    return map;
  }, [issues]);

  const backlogIssues = useMemo(
    () => (issues ?? []).filter((i) => !i.sprintId && i.status !== "DONE").sort((a, b) => a.boardOrder - b.boardOrder),
    [issues],
  );

  function toggleSelect(id: string, selected: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function changeIssueSprint(issueId: string, sprintId: string | null) {
    try {
      await updateIssue.mutateAsync({ issueId, input: { sprintId } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to move issue");
    }
  }

  async function bulkMove(sprintId: string | null) {
    await Promise.all([...selectedIds].map((id) => changeIssueSprint(id, sprintId)));
    setSelectedIds(new Set());
    toast.success(sprintId ? "Issues moved to sprint" : "Issues moved to backlog");
  }

  if (issuesLoading || sprintsLoading) {
    return (
      <div className="flex flex-col gap-3 p-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col overflow-y-auto p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-text-primary">Backlog</h1>
        <Button variant="secondary" onClick={() => setCreateSprintOpen(true)}>
          <Plus className="size-4" /> Create sprint
        </Button>
      </div>

      {activeAndPlannedSprints.map((sprint: SprintDTO) => (
        <SprintSection
          key={sprint.id}
          sprint={sprint}
          issues={(issuesBySprintId.get(sprint.id) ?? []).sort((a, b) => a.boardOrder - b.boardOrder)}
          projectId={projectId}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onIssueSprintChange={changeIssueSprint}
          defaultOpen={sprint.status === "ACTIVE"}
        />
      ))}

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border">
        <div className="flex items-center gap-2 bg-surface-1 px-3 py-2.5">
          <span className="text-sm font-medium text-text-primary">Backlog</span>
          <span className="text-xs text-text-tertiary">{backlogIssues.length} issues</span>
          <button
            onClick={() => openCreateIssue()}
            className="ml-auto flex items-center gap-1 text-xs text-text-tertiary hover:text-text-primary"
          >
            <Plus className="size-3.5" /> Add issue
          </button>
        </div>
        {backlogIssues.length === 0 ? (
          <EmptyState icon={ListTree} title="Backlog is empty" description="Create an issue to start planning." className="border-none py-8" />
        ) : (
          backlogIssues.map((issue) => (
            <BacklogIssueRow
              key={issue.id}
              issue={issue}
              selected={selectedIds.has(issue.id)}
              onSelectChange={(s) => toggleSelect(issue.id, s)}
              onSprintChange={(sprintId) => changeIssueSprint(issue.id, sprintId)}
            />
          ))
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-[var(--radius-lg)] border border-border-strong bg-surface-3 px-4 py-2.5 shadow-[var(--shadow-lg)]">
          <span className="text-sm text-text-primary">{selectedIds.size} selected</span>
          {activeAndPlannedSprints.map((sprint: SprintDTO) => (
            <Button key={sprint.id} size="sm" variant="secondary" onClick={() => bulkMove(sprint.id)}>
              Move to {sprint.name}
            </Button>
          ))}
          <Button size="sm" variant="secondary" onClick={() => bulkMove(null)}>
            Move to backlog
          </Button>
          <button onClick={() => setSelectedIds(new Set())} className="text-text-tertiary hover:text-text-primary">
            <X className="size-4" />
          </button>
        </div>
      )}

      <CreateSprintDialog projectId={projectId} open={createSprintOpen} onOpenChange={setCreateSprintOpen} />
    </div>
  );
}

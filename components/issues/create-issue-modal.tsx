"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useUiStore } from "@/lib/stores/ui-store";
import { useCreateIssue } from "@/hooks/use-issues";
import { useProjectMembers } from "@/hooks/use-project-members";
import { useProjectEpics } from "@/hooks/use-epics";
import { useProjectSprints } from "@/hooks/use-sprints";
import { useProjectLabels } from "@/hooks/use-labels";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TypeSelect } from "@/components/issues/type-select";
import { PrioritySelect } from "@/components/issues/priority-select";
import { AssigneePicker } from "@/components/issues/assignee-picker";
import { LabelPicker } from "@/components/issues/label-picker";
import { EpicPicker } from "@/components/issues/epic-picker";
import { SprintPicker } from "@/components/issues/sprint-picker";
import { MarkdownEditor } from "@/components/issues/markdown-editor";
import type { ProjectSummary } from "@/components/layout/project-nav";
import type { IssueType, IssuePriority, IssueStatus } from "@prisma/client";

export function CreateIssueModal({ projects }: { projects: ProjectSummary[] }) {
  const open = useUiStore((s) => s.createIssueOpen);
  const defaults = useUiStore((s) => s.createIssueDefaults);
  const closeCreateIssue = useUiStore((s) => s.closeCreateIssue);

  const [projectId, setProjectId] = useState<string>(projects[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<IssueType>("TASK");
  const [priority, setPriority] = useState<IssuePriority>("NO_PRIORITY");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [epicId, setEpicId] = useState<string | null>(null);
  const [sprintId, setSprintId] = useState<string | null>(null);
  const [labelIds, setLabelIds] = useState<string[]>([]);

  const createIssue = useCreateIssue(projectId);
  const { data: members } = useProjectMembers(projectId);
  const { data: epics } = useProjectEpics(projectId);
  const { data: sprints } = useProjectSprints(projectId);
  const { data: labels } = useProjectLabels(projectId);

  // Adjust state during render (React's recommended alternative to an effect here) when the
  // dialog transitions from closed to open, so it picks up the latest defaults from the store.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setSprintId(defaults?.sprintId ?? null);
      setEpicId(defaults?.epicId ?? null);
    }
  }

  function reset() {
    setTitle("");
    setDescription("");
    setType("TASK");
    setPriority("NO_PRIORITY");
    setAssigneeId(null);
    setEpicId(null);
    setSprintId(null);
    setLabelIds([]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !projectId) return;
    try {
      const issue = await createIssue.mutateAsync({
        projectId,
        title: title.trim(),
        description: description || undefined,
        type,
        priority,
        status: (defaults?.status as IssueStatus) ?? undefined,
        assigneeId,
        epicId,
        sprintId,
        labelIds,
      });
      toast.success(`${issue.key} created`);
      reset();
      closeCreateIssue();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create issue");
    }
  }

  const assigneeUser = members?.find((m) => m.userId === assigneeId)?.user ?? null;
  const epicValue = epics?.find((e: { id: string }) => e.id === epicId) ?? null;
  const sprintValue = sprints?.find((s: { id: string }) => s.id === sprintId) ?? null;
  const selectedLabels = (labels ?? []).filter((l) => labelIds.includes(l.id));

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? undefined : closeCreateIssue())}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>New issue</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="flex flex-col gap-3 px-5">
            <div className="flex items-center gap-2">
              <Select
                value={projectId}
                onValueChange={(v) => {
                  setProjectId(v);
                  setAssigneeId(null);
                  setEpicId(null);
                  setSprintId(null);
                  setLabelIds([]);
                }}
              >
                <SelectTrigger className="h-8 w-40 text-xs">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.key} — {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <TypeSelect value={type} onChange={setType} />
              <PrioritySelect value={priority} onChange={setPriority} />
            </div>

            <Input
              autoFocus
              placeholder="Issue title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 text-[15px] font-medium"
            />

            {projectId && (
              <MarkdownEditor
                projectId={projectId}
                value={description}
                onChange={setDescription}
                placeholder="Add a description…"
                minRows={4}
              />
            )}

            {projectId && (
              <div className="flex flex-wrap items-center gap-1.5">
                <AssigneePicker projectId={projectId} value={assigneeUser} onChange={setAssigneeId} />
                <EpicPicker projectId={projectId} value={epicValue} onChange={setEpicId} />
                <SprintPicker projectId={projectId} value={sprintValue} onChange={setSprintId} />
                <LabelPicker projectId={projectId} value={selectedLabels} onChange={setLabelIds} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={closeCreateIssue}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || !projectId || createIssue.isPending}>
              {createIssue.isPending ? "Creating…" : "Create issue"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

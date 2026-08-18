"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Archive, Copy, MoreHorizontal, Trash2, X } from "lucide-react";
import { useUiStore } from "@/lib/stores/ui-store";
import { useIssueByKey } from "@/hooks/use-issue";
import { useDeleteIssue, useUpdateIssue } from "@/hooks/use-issues";
import { useSocketRoom } from "@/components/providers/socket-provider";
import { useIssueDrawerSync } from "@/hooks/use-issue-drawer-sync";
import { TypeSelect } from "@/components/issues/type-select";
import { StatusSelect } from "@/components/issues/status-select";
import { PrioritySelect } from "@/components/issues/priority-select";
import { AssigneePicker } from "@/components/issues/assignee-picker";
import { LabelPicker } from "@/components/issues/label-picker";
import { EpicPicker } from "@/components/issues/epic-picker";
import { SprintPicker } from "@/components/issues/sprint-picker";
import { MarkdownEditor } from "@/components/issues/markdown-editor";
import { SubtasksList } from "@/components/issues/subtasks-list";
import { AttachmentsList } from "@/components/issues/attachments-list";
import { IssueLinks } from "@/components/issues/issue-links";
import { ActivityFeed } from "@/components/issues/activity-feed";
import { CommentList } from "@/components/comments/comment-list";
import { CommentComposer } from "@/components/comments/comment-composer";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { IssueDTO } from "@/lib/types";
import type { IssueStatus, IssuePriority, IssueType } from "@prisma/client";

export function IssueDetailDrawer({ workspaceSlug }: { workspaceSlug: string }) {
  useIssueDrawerSync();
  const activeIssueKey = useUiStore((s) => s.activeIssueKey);
  const closeIssue = useUiStore((s) => s.closeIssue);
  const { data: issue, isLoading } = useIssueByKey(workspaceSlug, activeIssueKey);
  useSocketRoom("project", issue?.projectId);

  return (
    <DialogPrimitive.Root open={!!activeIssueKey} onOpenChange={(o) => !o && closeIssue()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-overlay data-[state=open]:animate-fade-in" />
        <DialogPrimitive.Content className="fixed right-0 top-0 z-40 flex h-full w-full max-w-3xl flex-col border-l border-border-strong bg-surface-1 shadow-[var(--shadow-lg)] focus:outline-none">
          <DialogPrimitive.Title className="sr-only">Issue details</DialogPrimitive.Title>
          {isLoading || !issue ? <DrawerSkeleton /> : <DrawerBody key={issue.id} issue={issue} workspaceSlug={workspaceSlug} />}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function DrawerSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

function DrawerBody({ issue, workspaceSlug }: { issue: IssueDTO; workspaceSlug: string }) {
  const closeIssue = useUiStore((s) => s.closeIssue);
  const openIssue = useUiStore((s) => s.openIssue);
  const updateIssueMutation = useUpdateIssue(issue.projectId);
  const deleteIssueMutation = useDeleteIssue(issue.projectId);
  const queryClient = useQueryClient();

  const [title, setTitle] = useState(issue.title);
  const [description, setDescription] = useState(issue.description ?? "");

  async function patch(input: Parameters<typeof updateIssueMutation.mutateAsync>[0]["input"]) {
    try {
      const updated = await updateIssueMutation.mutateAsync({ issueId: issue.id, input });
      queryClient.setQueryData(["issue", workspaceSlug, issue.key], updated);
      return updated;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update issue");
      throw err;
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete ${issue.key}? This can't be undone.`)) return;
    await deleteIssueMutation.mutateAsync(issue.id);
    toast.success(`${issue.key} deleted`);
    closeIssue();
  }

  async function handleArchive() {
    await fetch(`/api/issues/${issue.id}/archive`, { method: "POST" });
    toast.success(`${issue.key} archived`);
    closeIssue();
  }

  function handleDuplicate() {
    toast.info("Use “New issue” to create a copy — quick-duplicate is on the roadmap.");
  }

  return (
    <>
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
        <TypeSelect value={issue.type} onChange={(v: IssueType) => patch({ type: v })} compact />
        <span className="font-mono text-xs text-text-tertiary">{issue.key}</span>
        <div className="ml-auto flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex size-7 items-center justify-center rounded-[var(--radius-sm)] text-text-tertiary hover:bg-surface-2">
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={handleDuplicate}>
                <Copy className="size-3.5" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleArchive}>
                <Archive className="size-3.5" /> Archive
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleDelete} className="text-danger focus:bg-danger-muted">
                <Trash2 className="size-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DialogPrimitive.Close className="flex size-7 items-center justify-center rounded-[var(--radius-sm)] text-text-tertiary hover:bg-surface-2">
            <X className="size-4" />
          </DialogPrimitive.Close>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto p-6">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => title.trim() && title !== issue.title && patch({ title: title.trim() })}
            className="mb-4 border-none bg-transparent text-xl font-semibold text-text-primary outline-none"
          />

          {issue.parent && (
            <button
              onClick={() => openIssue(`${issue.project.key}-${issue.parent!.number}`)}
              className="mb-3 flex w-fit items-center gap-1.5 rounded-[var(--radius-sm)] bg-surface-2 px-2 py-1 text-xs text-text-secondary hover:text-text-primary"
            >
              Subtask of {issue.project.key}-{issue.parent.number} {issue.parent.title}
            </button>
          )}

          <MarkdownEditor
            projectId={issue.projectId}
            value={description}
            onChange={setDescription}
            onBlur={() => description !== (issue.description ?? "") && patch({ description })}
            placeholder="Add a description…"
            minRows={5}
          />

          <div className="mt-6">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              Subtasks {issue.subtasks.length > 0 && `(${issue.subtasks.length})`}
            </h3>
            <SubtasksList issue={issue} />
          </div>

          <div className="mt-6">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">Linked issues</h3>
            <IssueLinks issueId={issue.id} workspaceSlug={workspaceSlug} />
          </div>

          <div className="mt-6">
            <AttachmentsList issueId={issue.id} />
          </div>

          <Separator className="my-6" />

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              Comments {issue._count.comments > 0 && `(${issue._count.comments})`}
            </h3>
            <CommentList issueId={issue.id} />
            <div className="mt-4">
              <CommentComposer issueId={issue.id} projectId={issue.projectId} />
            </div>
          </div>

          <Separator className="my-6" />

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-tertiary">Activity</h3>
            <ActivityFeed issueId={issue.id} />
          </div>
        </div>

        <div className="w-64 shrink-0 overflow-y-auto border-l border-border p-4">
          <div className="flex flex-col gap-4">
            <SidebarField label="Status">
              <StatusSelect value={issue.status} onChange={(v: IssueStatus) => patch({ status: v })} />
            </SidebarField>
            <SidebarField label="Priority">
              <PrioritySelect value={issue.priority} onChange={(v: IssuePriority) => patch({ priority: v })} />
            </SidebarField>
            <SidebarField label="Assignee">
              <AssigneePicker
                projectId={issue.projectId}
                value={issue.assignee}
                onChange={(v) => patch({ assigneeId: v })}
              />
            </SidebarField>
            <SidebarField label="Reporter">
              <div className="flex items-center gap-1.5 px-1 py-1 text-xs text-text-secondary">
                <Avatar name={issue.reporter.name} src={issue.reporter.avatarUrl} size="xs" />
                {issue.reporter.name}
              </div>
            </SidebarField>
            <SidebarField label="Labels">
              <LabelPicker
                projectId={issue.projectId}
                value={issue.labels}
                onChange={async (labelIds) => {
                  const res = await fetch(`/api/issues/${issue.id}/labels`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ labelIds }),
                  });
                  if (res.ok) queryClient.setQueryData(["issue", workspaceSlug, issue.key], (await res.json()).issue);
                }}
              />
            </SidebarField>
            <SidebarField label="Epic">
              <EpicPicker projectId={issue.projectId} value={issue.epic} onChange={(v) => patch({ epicId: v })} />
            </SidebarField>
            <SidebarField label="Sprint">
              <SprintPicker projectId={issue.projectId} value={issue.sprint} onChange={(v) => patch({ sprintId: v })} />
            </SidebarField>
            <SidebarField label="Due date">
              <Input
                type="date"
                className="h-7 text-xs"
                defaultValue={issue.dueDate ? issue.dueDate.slice(0, 10) : ""}
                onBlur={(e) =>
                  patch({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : null })
                }
              />
            </SidebarField>
            <SidebarField label="Story points">
              <Input
                type="number"
                min={0}
                max={999}
                className="h-7 w-20 text-xs"
                defaultValue={issue.storyPoints ?? ""}
                onBlur={(e) => patch({ storyPoints: e.target.value ? Number(e.target.value) : null })}
              />
            </SidebarField>

            <Separator />

            <div className="text-[11px] text-text-tertiary">
              <p>Created {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}</p>
              <p>Updated {formatDistanceToNow(new Date(issue.updatedAt), { addSuffix: true })}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function SidebarField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium text-text-tertiary">{label}</span>
      {children}
    </div>
  );
}


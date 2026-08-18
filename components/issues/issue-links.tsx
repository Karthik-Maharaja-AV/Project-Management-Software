"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Link2, Plus, X } from "lucide-react";
import { useCreateIssueLink, useDeleteIssueLink, useIssueLinks } from "@/hooks/use-issue-links";
import { useUiStore } from "@/lib/stores/ui-store";
import { STATUS_ICON, findMeta, ISSUE_STATUSES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const LINK_LABELS: Record<string, string> = {
  BLOCKS: "Blocks",
  BLOCKED_BY: "Blocked by",
  RELATES_TO: "Relates to",
  DUPLICATES: "Duplicates",
  DUPLICATED_BY: "Duplicated by",
  INVERSE_BLOCKS: "Blocked by",
  INVERSE_BLOCKED_BY: "Blocks",
  INVERSE_RELATES_TO: "Relates to",
  INVERSE_DUPLICATES: "Duplicated by",
  INVERSE_DUPLICATED_BY: "Duplicates",
};

const LINK_TYPE_OPTIONS = [
  { value: "BLOCKS", label: "Blocks" },
  { value: "BLOCKED_BY", label: "Is blocked by" },
  { value: "RELATES_TO", label: "Relates to" },
  { value: "DUPLICATES", label: "Duplicates" },
  { value: "DUPLICATED_BY", label: "Is duplicated by" },
];

export function IssueLinks({ issueId, workspaceSlug }: { issueId: string; workspaceSlug: string }) {
  const { data: links } = useIssueLinks(issueId);
  const createLink = useCreateIssueLink(issueId);
  const deleteLink = useDeleteIssueLink(issueId);
  const openIssue = useUiStore((s) => s.openIssue);

  const [adding, setAdding] = useState(false);
  const [linkType, setLinkType] = useState("BLOCKS");
  const [targetKey, setTargetKey] = useState("");
  const [resolving, setResolving] = useState(false);

  async function submit() {
    if (!targetKey.trim()) return;
    setResolving(true);
    try {
      const res = await fetch(`/api/w/${workspaceSlug}/issues/${targetKey.trim().toUpperCase()}`);
      if (!res.ok) throw new Error("Issue not found");
      const { issue: target } = await res.json();
      await createLink.mutateAsync({ targetIssueId: target.id, type: linkType });
      setTargetKey("");
      setAdding(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to link issue");
    } finally {
      setResolving(false);
    }
  }

  if ((!links || links.length === 0) && !adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-primary"
      >
        <Link2 className="size-3.5" /> Link an issue
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {(links ?? []).map((link) => {
        const StatusIcon = STATUS_ICON[link.issue.status];
        const meta = findMeta(ISSUE_STATUSES, link.issue.status);
        return (
          <div key={link.id} className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-border px-2 py-1.5 text-[13px]">
            <span className="w-24 shrink-0 text-[11px] text-text-tertiary">{LINK_LABELS[link.type] ?? link.type}</span>
            <button onClick={() => openIssue(link.issue.key)} className="flex min-w-0 flex-1 items-center gap-1.5 text-left">
              <StatusIcon className="size-3.5 shrink-0" style={{ color: meta.color }} />
              <span className="font-mono text-[11px] text-text-tertiary">{link.issue.key}</span>
              <span className="truncate text-text-primary">{link.issue.title}</span>
            </button>
            <button onClick={() => deleteLink.mutate(link.id)} className="text-text-tertiary hover:text-danger">
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}

      {adding ? (
        <div className="flex items-center gap-1.5">
          <Select value={linkType} onValueChange={setLinkType}>
            <SelectTrigger className="h-7 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LINK_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="FDJ-12"
            value={targetKey}
            onChange={(e) => setTargetKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="h-7 w-24 text-xs"
          />
          <Button size="sm" onClick={submit} disabled={resolving || !targetKey.trim()}>
            Link
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-primary"
        >
          <Plus className="size-3.5" /> Link another issue
        </button>
      )}
    </div>
  );
}

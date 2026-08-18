"use client";

import { useRef } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { File as FileIcon, FileText, Image as ImageIcon, Paperclip, Trash2, Download } from "lucide-react";
import { useAttachments, useDeleteAttachment, useUploadAttachment } from "@/hooks/use-attachments";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function iconFor(mimeType: string) {
  if (mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType === "application/pdf" || mimeType.startsWith("text/")) return FileText;
  return FileIcon;
}

export function AttachmentsList({ issueId }: { issueId: string }) {
  const { data: attachments, isLoading } = useAttachments(issueId);
  const upload = useUploadAttachment(issueId);
  const deleteAttachment = useDeleteAttachment(issueId);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      try {
        await upload.mutateAsync(file);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `Failed to upload ${file.name}`);
      }
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
          Attachments {attachments && attachments.length > 0 && `(${attachments.length})`}
        </h3>
        <Button size="sm" variant="ghost" onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
          <Paperclip className="size-3.5" /> {upload.isPending ? "Uploading…" : "Attach"}
        </Button>
        <input ref={inputRef} type="file" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {isLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : !attachments || attachments.length === 0 ? (
        <p className="text-sm text-text-tertiary">No attachments yet.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {attachments.map((att) => {
            const Icon = iconFor(att.mimeType);
            return (
              <div key={att.id} className="flex items-center gap-2.5 rounded-[var(--radius-sm)] border border-border px-2.5 py-2">
                <Icon className="size-4 shrink-0 text-text-tertiary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-text-primary">{att.filename}</p>
                  <p className="text-[11px] text-text-tertiary">
                    {formatSize(att.size)} · {att.uploader.name} ·{" "}
                    {formatDistanceToNow(new Date(att.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <a
                  href={`/api/attachments/${att.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex size-6 items-center justify-center rounded text-text-tertiary hover:bg-surface-2 hover:text-text-primary"
                >
                  <Download className="size-3.5" />
                </a>
                <button
                  onClick={() => deleteAttachment.mutate(att.id)}
                  className="flex size-6 items-center justify-center rounded text-text-tertiary hover:bg-danger-muted hover:text-danger"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

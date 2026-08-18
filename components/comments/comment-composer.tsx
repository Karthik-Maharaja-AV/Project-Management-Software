"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCreateComment } from "@/hooks/use-comments";
import { MarkdownEditor } from "@/components/issues/markdown-editor";
import { Button } from "@/components/ui/button";

export function CommentComposer({ issueId, projectId }: { issueId: string; projectId: string }) {
  const [body, setBody] = useState("");
  const createComment = useCreateComment(issueId);

  async function submit() {
    if (!body.trim()) return;
    try {
      await createComment.mutateAsync(body.trim());
      setBody("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post comment");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <MarkdownEditor
        projectId={projectId}
        value={body}
        onChange={setBody}
        placeholder="Leave a comment… use @ to mention someone"
        minRows={3}
      />
      <div className="flex justify-end">
        <Button size="sm" onClick={submit} disabled={!body.trim() || createComment.isPending}>
          {createComment.isPending ? "Posting…" : "Comment"}
        </Button>
      </div>
    </div>
  );
}

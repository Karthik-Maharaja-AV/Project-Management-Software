"use client";

import { formatDistanceToNow } from "date-fns";
import { useSession } from "next-auth/react";
import { MoreHorizontal } from "lucide-react";
import { useComments, useDeleteComment } from "@/hooks/use-comments";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkdownContent } from "@/components/issues/markdown-content";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function CommentList({ issueId }: { issueId: string }) {
  const { data: comments, isLoading } = useComments(issueId);
  const deleteComment = useDeleteComment(issueId);
  const { data: session } = useSession();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-2.5">
            <Skeleton className="size-7 rounded-full" />
            <Skeleton className="h-12 flex-1" />
          </div>
        ))}
      </div>
    );
  }

  if (!comments || comments.length === 0) {
    return <p className="text-sm text-text-tertiary">No comments yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-2.5">
          <Avatar name={comment.author.name} src={comment.author.avatarUrl} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-text-primary">{comment.author.name}</span>
              <span className="text-[11px] text-text-tertiary">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                {comment.editedAt && " (edited)"}
              </span>
              {comment.authorId === session?.user?.id && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="ml-auto flex size-5 items-center justify-center rounded text-text-tertiary hover:bg-surface-2">
                    <MoreHorizontal className="size-3.5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-danger focus:bg-danger-muted"
                      onSelect={() => deleteComment.mutate(comment.id)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <MarkdownContent content={comment.body} className="mt-1 text-[13px]" />
          </div>
        </div>
      ))}
    </div>
  );
}


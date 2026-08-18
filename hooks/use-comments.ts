"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/components/providers/socket-provider";
import type { CommentDTO } from "@/lib/types";

function key(issueId: string) {
  return ["comments", issueId] as const;
}

export function useComments(issueId: string | undefined) {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const query = useQuery({
    queryKey: key(issueId ?? ""),
    queryFn: async (): Promise<CommentDTO[]> => {
      const res = await fetch(`/api/issues/${issueId}/comments`);
      if (!res.ok) throw new Error("Failed to load comments");
      return (await res.json()).comments;
    },
    enabled: !!issueId,
  });

  useEffect(() => {
    if (!socket || !issueId) return;
    const onCreated = ({ issueId: id, comment }: { issueId: string; comment: CommentDTO }) => {
      if (id !== issueId) return;
      queryClient.setQueryData<CommentDTO[]>(key(issueId), (old) => (old ? [...old, comment] : [comment]));
    };
    const onUpdated = ({ issueId: id, comment }: { issueId: string; comment: CommentDTO }) => {
      if (id !== issueId) return;
      queryClient.setQueryData<CommentDTO[]>(key(issueId), (old) =>
        old ? old.map((c) => (c.id === comment.id ? comment : c)) : old,
      );
    };
    const onDeleted = ({ issueId: id, commentId }: { issueId: string; commentId: string }) => {
      if (id !== issueId) return;
      queryClient.setQueryData<CommentDTO[]>(key(issueId), (old) => (old ? old.filter((c) => c.id !== commentId) : old));
    };
    socket.on("comment:created", onCreated);
    socket.on("comment:updated", onUpdated);
    socket.on("comment:deleted", onDeleted);
    return () => {
      socket.off("comment:created", onCreated);
      socket.off("comment:updated", onUpdated);
      socket.off("comment:deleted", onDeleted);
    };
  }, [socket, issueId, queryClient]);

  return query;
}

export function useCreateComment(issueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      const res = await fetch(`/api/issues/${issueId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to post comment");
      return (await res.json()).comment as CommentDTO;
    },
    onSuccess: (comment) => {
      queryClient.setQueryData<CommentDTO[]>(key(issueId), (old) =>
        old && !old.some((c) => c.id === comment.id) ? [...old, comment] : old ?? [comment],
      );
    },
  });
}

export function useDeleteComment(issueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      const res = await fetch(`/api/issues/${issueId}/comments/${commentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to delete comment");
    },
    onSuccess: (_d, commentId) => {
      queryClient.setQueryData<CommentDTO[]>(key(issueId), (old) => (old ? old.filter((c) => c.id !== commentId) : old));
    },
  });
}

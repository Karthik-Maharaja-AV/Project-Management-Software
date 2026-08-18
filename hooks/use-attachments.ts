"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/components/providers/socket-provider";

export type AttachmentDTO = {
  id: string;
  filename: string;
  filepath: string;
  mimeType: string;
  size: number;
  createdAt: string;
  uploader: { id: string; name: string; username: string; avatarUrl: string | null };
};

function key(issueId: string) {
  return ["attachments", issueId] as const;
}

export function useAttachments(issueId: string | undefined) {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const query = useQuery({
    queryKey: key(issueId ?? ""),
    queryFn: async (): Promise<AttachmentDTO[]> => {
      const res = await fetch(`/api/issues/${issueId}/attachments`);
      if (!res.ok) throw new Error("Failed to load attachments");
      return (await res.json()).attachments;
    },
    enabled: !!issueId,
  });

  useEffect(() => {
    if (!socket || !issueId) return;
    const onCreated = ({ issueId: id, attachment }: { issueId: string; attachment: AttachmentDTO }) => {
      if (id !== issueId) return;
      queryClient.setQueryData<AttachmentDTO[]>(key(issueId), (old) => (old ? [attachment, ...old] : [attachment]));
    };
    const onDeleted = ({ issueId: id, attachmentId }: { issueId: string; attachmentId: string }) => {
      if (id !== issueId) return;
      queryClient.setQueryData<AttachmentDTO[]>(key(issueId), (old) => (old ? old.filter((a) => a.id !== attachmentId) : old));
    };
    socket.on("attachment:created", onCreated);
    socket.on("attachment:deleted", onDeleted);
    return () => {
      socket.off("attachment:created", onCreated);
      socket.off("attachment:deleted", onDeleted);
    };
  }, [socket, issueId, queryClient]);

  return query;
}

export function useUploadAttachment(issueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: globalThis.File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/issues/${issueId}/attachments`, { method: "POST", body: formData });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to upload file");
      return (await res.json()).attachment as AttachmentDTO;
    },
    onSuccess: (attachment) => {
      queryClient.setQueryData<AttachmentDTO[]>(key(issueId), (old) =>
        old && !old.some((a) => a.id === attachment.id) ? [attachment, ...old] : old ?? [attachment],
      );
    },
  });
}

export function useDeleteAttachment(issueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (attachmentId: string) => {
      const res = await fetch(`/api/attachments/${attachmentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to delete file");
    },
    onSuccess: (_d, attachmentId) => {
      queryClient.setQueryData<AttachmentDTO[]>(key(issueId), (old) => (old ? old.filter((a) => a.id !== attachmentId) : old));
    },
  });
}

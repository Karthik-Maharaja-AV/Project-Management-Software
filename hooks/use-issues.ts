"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSocketRoom, useSocket } from "@/components/providers/socket-provider";
import type { IssueDTO } from "@/lib/types";
import type { CreateIssueInput, MoveIssueInput, UpdateIssueInput } from "@/lib/validations/issue";

function issuesKey(projectId: string) {
  return ["issues", projectId] as const;
}

export function useProjectIssues(projectId: string | undefined) {
  const queryClient = useQueryClient();
  const socket = useSocket();
  useSocketRoom("project", projectId);

  const query = useQuery({
    queryKey: issuesKey(projectId ?? ""),
    queryFn: async (): Promise<IssueDTO[]> => {
      const res = await fetch(`/api/projects/${projectId}/issues`);
      if (!res.ok) throw new Error("Failed to load issues");
      return (await res.json()).issues;
    },
    enabled: !!projectId,
  });

  useEffect(() => {
    if (!socket || !projectId) return;
    const key = issuesKey(projectId);

    const onCreated = (issue: IssueDTO) => {
      if (issue.projectId !== projectId) return;
      queryClient.setQueryData<IssueDTO[]>(key, (old) => (old ? [...old, issue] : [issue]));
    };
    const onUpdated = (issue: IssueDTO) => {
      if (issue.projectId !== projectId) return;
      queryClient.setQueryData<IssueDTO[]>(key, (old) =>
        old ? old.map((i) => (i.id === issue.id ? issue : i)) : old,
      );
    };
    const onDeleted = ({ id }: { id: string }) => {
      queryClient.setQueryData<IssueDTO[]>(key, (old) => (old ? old.filter((i) => i.id !== id) : old));
    };

    socket.on("issue:created", onCreated);
    socket.on("issue:updated", onUpdated);
    socket.on("issue:deleted", onDeleted);
    return () => {
      socket.off("issue:created", onCreated);
      socket.off("issue:updated", onUpdated);
      socket.off("issue:deleted", onDeleted);
    };
  }, [socket, projectId, queryClient]);

  return query;
}

export function useCreateIssue(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateIssueInput) => {
      const res = await fetch(`/api/projects/${projectId}/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to create issue");
      return (await res.json()).issue as IssueDTO;
    },
    onSuccess: (issue) => {
      queryClient.setQueryData<IssueDTO[]>(issuesKey(projectId), (old) =>
        old ? [...old.filter((i) => i.id !== issue.id), issue] : [issue],
      );
    },
  });
}

export function useUpdateIssue(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ issueId, input }: { issueId: string; input: UpdateIssueInput }) => {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to update issue");
      return (await res.json()).issue as IssueDTO;
    },
    onSuccess: (issue) => {
      queryClient.setQueryData<IssueDTO[]>(issuesKey(projectId), (old) =>
        old ? old.map((i) => (i.id === issue.id ? issue : i)) : old,
      );
    },
  });
}

export function useMoveIssue(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ issueId, input }: { issueId: string; input: MoveIssueInput }) => {
      const res = await fetch(`/api/issues/${issueId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to move issue");
      return (await res.json()).issue as IssueDTO;
    },
    onMutate: async ({ issueId, input }) => {
      await queryClient.cancelQueries({ queryKey: issuesKey(projectId) });
      const previous = queryClient.getQueryData<IssueDTO[]>(issuesKey(projectId));
      queryClient.setQueryData<IssueDTO[]>(issuesKey(projectId), (old) =>
        old ? old.map((i) => (i.id === issueId ? { ...i, status: input.status } : i)) : old,
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(issuesKey(projectId), context.previous);
    },
    onSuccess: (issue) => {
      queryClient.setQueryData<IssueDTO[]>(issuesKey(projectId), (old) =>
        old ? old.map((i) => (i.id === issue.id ? issue : i)) : old,
      );
    },
  });
}

export function useDeleteIssue(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (issueId: string) => {
      const res = await fetch(`/api/issues/${issueId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to delete issue");
    },
    onSuccess: (_data, issueId) => {
      queryClient.setQueryData<IssueDTO[]>(issuesKey(projectId), (old) =>
        old ? old.filter((i) => i.id !== issueId) : old,
      );
    },
  });
}

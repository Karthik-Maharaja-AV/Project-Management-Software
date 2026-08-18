"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { IssueDTO } from "@/lib/types";

export type IssueLinkDTO = { id: string; type: string; issue: IssueDTO };

function key(issueId: string) {
  return ["issue-links", issueId] as const;
}

export function useIssueLinks(issueId: string | undefined) {
  return useQuery({
    queryKey: key(issueId ?? ""),
    queryFn: async (): Promise<IssueLinkDTO[]> => {
      const res = await fetch(`/api/issues/${issueId}/links`);
      if (!res.ok) throw new Error("Failed to load links");
      return (await res.json()).links;
    },
    enabled: !!issueId,
  });
}

export function useCreateIssueLink(issueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { targetIssueId: string; type: string }) => {
      const res = await fetch(`/api/issues/${issueId}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to link issue");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(issueId) }),
  });
}

export function useDeleteIssueLink(issueId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (linkId: string) => {
      const res = await fetch(`/api/issues/${issueId}/links/${linkId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to remove link");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(issueId) }),
  });
}

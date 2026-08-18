"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/components/providers/socket-provider";
import type { IssueDTO } from "@/lib/types";

export function useIssueByKey(workspaceSlug: string | undefined, issueKey: string | null) {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const query = useQuery({
    queryKey: ["issue", workspaceSlug, issueKey],
    queryFn: async (): Promise<IssueDTO> => {
      const res = await fetch(`/api/w/${workspaceSlug}/issues/${issueKey}`);
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load issue");
      return (await res.json()).issue;
    },
    enabled: !!workspaceSlug && !!issueKey,
  });

  useEffect(() => {
    if (!socket || !issueKey) return;
    const onUpdated = (issue: IssueDTO) => {
      if (issue.key !== issueKey) return;
      queryClient.setQueryData(["issue", workspaceSlug, issueKey], issue);
    };
    socket.on("issue:updated", onUpdated);
    return () => {
      socket.off("issue:updated", onUpdated);
    };
  }, [socket, workspaceSlug, issueKey, queryClient]);

  return query;
}

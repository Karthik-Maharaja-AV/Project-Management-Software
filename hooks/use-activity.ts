"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/components/providers/socket-provider";
import type { ActivityDTO } from "@/lib/types";

export function useIssueActivity(issueId: string | undefined) {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const query = useQuery({
    queryKey: ["activity", issueId],
    queryFn: async (): Promise<ActivityDTO[]> => {
      const res = await fetch(`/api/issues/${issueId}/activity`);
      if (!res.ok) throw new Error("Failed to load activity");
      return (await res.json()).activity;
    },
    enabled: !!issueId,
  });

  useEffect(() => {
    if (!socket || !issueId) return;
    const onCreated = (activity: ActivityDTO) => {
      if (activity.issueId !== issueId) return;
      queryClient.setQueryData<ActivityDTO[]>(["activity", issueId], (old) =>
        old ? [...old, activity] : [activity],
      );
    };
    socket.on("activity:created", onCreated);
    return () => {
      socket.off("activity:created", onCreated);
    };
  }, [socket, issueId, queryClient]);

  return query;
}

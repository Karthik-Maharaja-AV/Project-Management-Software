"use client";

import { useQuery } from "@tanstack/react-query";
import type { UserSummary } from "@/lib/types";

export function useProjectMembers(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project-members", projectId],
    queryFn: async (): Promise<{ userId: string; role: string; user: UserSummary }[]> => {
      const res = await fetch(`/api/projects/${projectId}/members`);
      if (!res.ok) throw new Error("Failed to load members");
      return (await res.json()).members;
    },
    enabled: !!projectId,
  });
}

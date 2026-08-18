"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateProjectInput } from "@/lib/validations/project";

export function useUpdateProject(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, input }: { projectId: string; input: UpdateProjectInput }) => {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to update project");
      return (await res.json()).project;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects", workspaceId] }),
  });
}

export function useArchiveProject(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) => {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to archive project");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects", workspaceId] }),
  });
}

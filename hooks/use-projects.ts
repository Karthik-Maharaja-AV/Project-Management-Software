"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateProjectInput } from "@/lib/validations/project";

export function useCreateProject(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create project");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", workspaceId] });
    },
  });
}

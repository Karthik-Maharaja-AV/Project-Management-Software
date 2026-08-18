"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LabelDTO } from "@/lib/types";
import type { CreateLabelInput } from "@/lib/validations/project";

export function useProjectLabels(projectId: string | undefined) {
  return useQuery({
    queryKey: ["labels", projectId],
    queryFn: async (): Promise<LabelDTO[]> => {
      const res = await fetch(`/api/projects/${projectId}/labels`);
      if (!res.ok) throw new Error("Failed to load labels");
      return (await res.json()).labels;
    },
    enabled: !!projectId,
  });
}

export function useCreateLabel(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateLabelInput) => {
      const res = await fetch(`/api/projects/${projectId}/labels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to create label");
      return (await res.json()).label as LabelDTO;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["labels", projectId] }),
  });
}

export function useDeleteLabel(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (labelId: string) => {
      const res = await fetch(`/api/projects/${projectId}/labels/${labelId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to delete label");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["labels", projectId] }),
  });
}

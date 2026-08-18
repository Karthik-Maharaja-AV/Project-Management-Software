"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateEpicInput, UpdateEpicInput } from "@/lib/validations/epic";

export function useProjectEpics(projectId: string | undefined) {
  return useQuery({
    queryKey: ["epics", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/epics`);
      if (!res.ok) throw new Error("Failed to load epics");
      return (await res.json()).epics;
    },
    enabled: !!projectId,
  });
}

export function useEpic(epicId: string | undefined) {
  return useQuery({
    queryKey: ["epic", epicId],
    queryFn: async () => {
      const res = await fetch(`/api/epics/${epicId}`);
      if (!res.ok) throw new Error("Failed to load epic");
      return (await res.json()).epic;
    },
    enabled: !!epicId,
  });
}

export function useCreateEpic(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateEpicInput) => {
      const res = await fetch(`/api/projects/${projectId}/epics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to create epic");
      return (await res.json()).epic;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["epics", projectId] }),
  });
}

export function useUpdateEpic(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ epicId, input }: { epicId: string; input: UpdateEpicInput }) => {
      const res = await fetch(`/api/epics/${epicId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to update epic");
      return (await res.json()).epic;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["epics", projectId] });
      queryClient.invalidateQueries({ queryKey: ["epic", vars.epicId] });
    },
  });
}

export function useDeleteEpic(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (epicId: string) => {
      const res = await fetch(`/api/epics/${epicId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to delete epic");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["epics", projectId] }),
  });
}

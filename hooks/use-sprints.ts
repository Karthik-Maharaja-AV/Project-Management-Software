"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CreateSprintInput, UpdateSprintInput } from "@/lib/validations/sprint";

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>, projectId: string, sprintId?: string) {
  queryClient.invalidateQueries({ queryKey: ["sprints", projectId] });
  queryClient.invalidateQueries({ queryKey: ["issues", projectId] });
  if (sprintId) queryClient.invalidateQueries({ queryKey: ["sprint", sprintId] });
}

export function useProjectSprints(projectId: string | undefined) {
  return useQuery({
    queryKey: ["sprints", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/sprints`);
      if (!res.ok) throw new Error("Failed to load sprints");
      return (await res.json()).sprints;
    },
    enabled: !!projectId,
  });
}

export function useSprint(sprintId: string | undefined) {
  return useQuery({
    queryKey: ["sprint", sprintId],
    queryFn: async () => {
      const res = await fetch(`/api/sprints/${sprintId}`);
      if (!res.ok) throw new Error("Failed to load sprint");
      return (await res.json()).sprint;
    },
    enabled: !!sprintId,
  });
}

export function useCreateSprint(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateSprintInput) => {
      const res = await fetch(`/api/projects/${projectId}/sprints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to create sprint");
      return (await res.json()).sprint;
    },
    onSuccess: () => invalidateAll(queryClient, projectId),
  });
}

export function useUpdateSprint(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sprintId, input }: { sprintId: string; input: UpdateSprintInput }) => {
      const res = await fetch(`/api/sprints/${sprintId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to update sprint");
      return (await res.json()).sprint;
    },
    onSuccess: (_d, vars) => invalidateAll(queryClient, projectId, vars.sprintId),
  });
}

export function useStartSprint(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sprintId: string) => {
      const res = await fetch(`/api/sprints/${sprintId}/start`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to start sprint");
      return (await res.json()).sprint;
    },
    onSuccess: (_d, sprintId) => {
      invalidateAll(queryClient, projectId, sprintId);
      toast.success("Sprint started");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to start sprint"),
  });
}

export function useCompleteSprint(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sprintId: string) => {
      const res = await fetch(`/api/sprints/${sprintId}/complete`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to complete sprint");
      return (await res.json()).sprint;
    },
    onSuccess: (_d, sprintId) => {
      invalidateAll(queryClient, projectId, sprintId);
      toast.success("Sprint completed");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to complete sprint"),
  });
}

export function useDeleteSprint(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sprintId: string) => {
      const res = await fetch(`/api/sprints/${sprintId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to delete sprint");
    },
    onSuccess: () => invalidateAll(queryClient, projectId),
  });
}

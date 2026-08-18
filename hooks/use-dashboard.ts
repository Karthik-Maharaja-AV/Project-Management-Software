"use client";

import { useQuery } from "@tanstack/react-query";

export function useWorkspaceDashboard(workspaceId: string) {
  return useQuery({
    queryKey: ["workspace-dashboard", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/dashboard`);
      if (!res.ok) throw new Error("Failed to load dashboard");
      return res.json();
    },
  });
}

export function useProjectDashboard(projectId: string) {
  return useQuery({
    queryKey: ["project-dashboard", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/dashboard`);
      if (!res.ok) throw new Error("Failed to load dashboard");
      return res.json();
    },
  });
}

export function useMyWork(workspaceId: string) {
  return useQuery({
    queryKey: ["my-work", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/my-work`);
      if (!res.ok) throw new Error("Failed to load your work");
      return res.json();
    },
  });
}

"use client";

import Link from "next/link";
import { FolderKanban, Plus, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useUiStore } from "@/lib/stores/ui-store";

export type ProjectCardData = {
  id: string;
  name: string;
  key: string;
  description: string | null;
  icon: string | null;
  color: string;
  _count: { issues: number; members: number };
};

export function ProjectsOverview({
  workspaceSlug,
  projects,
}: {
  workspaceId: string;
  workspaceSlug: string;
  projects: ProjectCardData[];
}) {
  const openCreateProject = useUiStore((s) => s.openCreateProject);

  return (
    <div className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-text-primary">Projects</h1>
        <Button onClick={() => openCreateProject()}>
          <Plus className="size-4" /> New project
        </Button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="Your workspace is empty"
          description="Create your first project to start tracking issues, sprints, and epics with your team."
          action={
            <Button onClick={() => openCreateProject()}>
              <Plus className="size-4" /> Create your first project
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/${workspaceSlug}/${project.key}/board`}>
              <Card className="h-full p-4 transition-shadow hover:shadow-[var(--shadow-md)]">
                <div className="flex items-start gap-3">
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-sm font-bold text-white"
                    style={{ backgroundColor: project.color }}
                  >
                    {project.icon || project.key[0]}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text-primary">{project.name}</p>
                    <p className="font-mono text-xs text-text-tertiary">{project.key}</p>
                  </div>
                </div>
                {project.description && (
                  <p className="mt-3 line-clamp-2 text-xs text-text-secondary">{project.description}</p>
                )}
                <div className="mt-4 flex items-center gap-3 text-xs text-text-tertiary">
                  <span>{project._count.issues} issues</span>
                  <span className="flex items-center gap-1">
                    <Users className="size-3" /> {project._count.members}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

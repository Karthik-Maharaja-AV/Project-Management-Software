"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronRight, KanbanSquare, ListTree, Settings, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProjectSummary = { id: string; name: string; key: string; icon: string | null; color: string };

export function ProjectNav({
  workspaceSlug,
  projects,
}: {
  workspaceSlug: string;
  projects: ProjectSummary[];
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-0.5">
      {projects.map((project) => (
        <ProjectItem
          key={project.id}
          project={project}
          workspaceSlug={workspaceSlug}
          active={pathname?.includes(`/${workspaceSlug}/${project.key}`) ?? false}
        />
      ))}
    </div>
  );
}

function ProjectItem({
  project,
  workspaceSlug,
  active,
}: {
  project: ProjectSummary;
  workspaceSlug: string;
  active: boolean;
}) {
  const [open, setOpen] = useState(active);
  const base = `/${workspaceSlug}/${project.key}`;
  const pathname = usePathname();

  const links = [
    { href: `${base}/board`, label: "Board", icon: KanbanSquare },
    { href: `${base}/backlog`, label: "Backlog", icon: ListTree },
    { href: `${base}/epics`, label: "Epics", icon: Layers },
    { href: `${base}/settings`, label: "Settings", icon: Settings },
  ];

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors"
      >
        <ChevronRight className={cn("size-3.5 shrink-0 text-text-tertiary transition-transform", open && "rotate-90")} />
        <span
          className="flex size-4 shrink-0 items-center justify-center rounded-[4px] text-[9px] font-bold text-white"
          style={{ backgroundColor: project.color }}
        >
          {project.icon || project.key[0]}
        </span>
        <span className="min-w-0 flex-1 truncate text-left">{project.name}</span>
      </button>
      {open && (
        <div className="ml-[19px] flex flex-col gap-0.5 border-l border-border pl-2">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-[13px] transition-colors",
                  isActive
                    ? "bg-accent-muted text-accent-muted-foreground font-medium"
                    : "text-text-secondary hover:bg-surface-2 hover:text-text-primary",
                )}
              >
                <link.icon className="size-3.5" />
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function ProjectHeader({
  workspaceSlug,
  project,
}: {
  workspaceSlug: string;
  project: { key: string; name: string; icon: string | null; color: string };
}) {
  const pathname = usePathname();
  const base = `/${workspaceSlug}/${project.key}`;

  const tabs = [
    { href: base, label: "Overview" },
    { href: `${base}/board`, label: "Board" },
    { href: `${base}/backlog`, label: "Backlog" },
    { href: `${base}/epics`, label: "Epics" },
    { href: `${base}/settings`, label: "Settings" },
  ];

  return (
    <div className="flex shrink-0 items-center gap-4 border-b border-border px-6 pt-4">
      <div className="flex items-center gap-2">
        <span
          className="flex size-6 items-center justify-center rounded-[6px] text-xs font-bold text-white"
          style={{ backgroundColor: project.color }}
        >
          {project.icon || project.key[0]}
        </span>
        <span className="font-semibold text-text-primary">{project.name}</span>
      </div>
      <nav className="flex gap-1">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "border-b-2 border-transparent px-2.5 pb-3 text-sm transition-colors",
                active ? "border-accent font-medium text-text-primary" : "text-text-secondary hover:text-text-primary",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

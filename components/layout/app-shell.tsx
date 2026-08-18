"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Plus, Search, User } from "lucide-react";
import { WorkspaceSwitcher, type WorkspaceSummary } from "@/components/layout/workspace-switcher";
import { ProjectNav, type ProjectSummary } from "@/components/layout/project-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { CommandPalette } from "@/components/search/command-palette";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { CreateIssueModal } from "@/components/issues/create-issue-modal";
import { IssueDetailDrawer } from "@/components/issues/issue-detail-drawer";
import { useUiStore } from "@/lib/stores/ui-store";
import { cn } from "@/lib/utils";

export function AppShell({
  workspace,
  workspaces,
  projects,
  children,
}: {
  workspace: WorkspaceSummary;
  workspaces: WorkspaceSummary[];
  projects: ProjectSummary[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const setCommandPaletteOpen = useUiStore((s) => s.setCommandPaletteOpen);
  const openCreateIssue = useUiStore((s) => s.openCreateIssue);
  const createProjectOpen = useUiStore((s) => s.createProjectOpen);
  const openCreateProject = useUiStore((s) => s.openCreateProject);
  const closeCreateProject = useUiStore((s) => s.closeCreateProject);

  const isDashboard = pathname === `/${workspace.slug}`;
  const isMyWork = pathname === `/${workspace.slug}/my-work`;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface-0">
      <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-surface-1">
        <div className="p-2.5">
          <WorkspaceSwitcher current={workspace} workspaces={workspaces} />
        </div>

        <div className="px-2.5">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] border border-border-strong bg-surface-1 px-2.5 py-1.5 text-xs text-text-tertiary hover:bg-surface-2 transition-colors"
          >
            <Search className="size-3.5" />
            <span className="flex-1 text-left">Search…</span>
            <kbd className="rounded border border-border-strong px-1 text-[10px]">⌘K</kbd>
          </button>
        </div>

        <nav className="mt-3 flex flex-col gap-0.5 px-2.5">
          <SidebarLink href={`/${workspace.slug}`} icon={LayoutDashboard} label="Dashboard" active={isDashboard} />
          <SidebarLink href={`/${workspace.slug}/my-work`} icon={User} label="My Work" active={isMyWork} />
        </nav>

        <div className="mt-5 flex items-center justify-between px-3.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">Projects</span>
          <button
            onClick={() => openCreateProject()}
            className="flex size-5 items-center justify-center rounded-[var(--radius-sm)] text-text-tertiary hover:bg-surface-2 hover:text-text-primary transition-colors"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2.5 py-1.5">
          <ProjectNav workspaceSlug={workspace.slug} projects={projects} />
        </div>

        <div className="border-t border-border p-2.5">
          <UserMenu workspaceSlug={workspace.slug} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center justify-end gap-1 border-b border-border px-4">
          <button
            onClick={() => openCreateIssue()}
            className="mr-auto flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground hover:bg-accent-hover transition-colors"
          >
            <Plus className="size-3.5" /> New issue
          </button>
          <NotificationBell />
        </header>
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>

      <CommandPalette workspaceId={workspace.id} workspaceSlug={workspace.slug} projects={projects} />
      <CreateIssueModal projects={projects} />
      <IssueDetailDrawer workspaceSlug={workspace.slug} />
      <CreateProjectDialog
        workspaceId={workspace.id}
        workspaceSlug={workspace.slug}
        open={createProjectOpen}
        onOpenChange={(o) => (o ? openCreateProject() : closeCreateProject())}
      />
    </div>
  );
}

function SidebarLink({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm transition-colors",
        active
          ? "bg-accent-muted text-accent-muted-foreground font-medium"
          : "text-text-secondary hover:bg-surface-2 hover:text-text-primary",
      )}
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Command } from "cmdk";
import { useTheme } from "next-themes";
import {
  Bug,
  FolderKanban,
  KanbanSquare,
  Layers,
  LayoutDashboard,
  ListTree,
  Moon,
  Plus,
  Search,
  Sun,
  Tag,
  User,
} from "lucide-react";
import { useUiStore } from "@/lib/stores/ui-store";
import { STATUS_ICON } from "@/lib/constants";
import { Avatar } from "@/components/ui/avatar";
import type { ProjectSummary } from "@/components/layout/project-nav";
import type { IssueStatus } from "@prisma/client";

type SearchResults = {
  issues: { id: string; key: string; title: string; status: IssueStatus; url: string }[];
  projects: { id: string; key: string; name: string; color: string }[];
  users: { id: string; name: string; username: string; avatarUrl: string | null }[];
  epics: { id: string; name: string; color: string; projectKey: string }[];
  labels: { id: string; name: string; color: string; projectKey: string }[];
};

export function CommandPalette({
  workspaceId,
  workspaceSlug,
  projects,
}: {
  workspaceId: string;
  workspaceSlug: string;
  projects: ProjectSummary[];
}) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const open = useUiStore((s) => s.commandPaletteOpen);
  const setOpen = useUiStore((s) => s.setCommandPaletteOpen);
  const openCreateIssue = useUiStore((s) => s.openCreateIssue);
  const openCreateProject = useUiStore((s) => s.openCreateProject);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(search.trim()), 200);
    return () => clearTimeout(timeout);
  }, [search]);

  const { data: results } = useQuery({
    queryKey: ["workspace-search", workspaceId, debounced],
    queryFn: async (): Promise<SearchResults> => {
      const res = await fetch(`/api/workspaces/${workspaceId}/search?q=${encodeURIComponent(debounced)}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: debounced.length >= 2,
  });

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isTyping = ["INPUT", "TEXTAREA"].includes(target.tagName) || target.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(!open);
        return;
      }
      if (!isTyping && !open && e.key === "/") {
        e.preventDefault();
        setOpen(true);
        return;
      }
      if (!isTyping && !open && e.key.toLowerCase() === "c") {
        e.preventDefault();
        openCreateIssue();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen, openCreateIssue]);

  function go(href: string) {
    router.push(href);
    setOpen(false);
  }

  const keyMatch = search.trim().match(/^([a-z]{2,10})-(\d+)$/i);
  const isSearching = debounced.length >= 2;

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command palette"
      shouldFilter={!keyMatch && !isSearching}
      className="fixed left-1/2 top-[18%] z-50 w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-[var(--radius-lg)] border border-border-strong bg-surface-3 shadow-[var(--shadow-lg)]"
    >
      <div className="flex items-center gap-2 border-b border-border px-3.5">
        <Search className="size-4 text-text-tertiary" />
        <Command.Input
          value={search}
          onValueChange={setSearch}
          placeholder="Search issues, jump to a project, or run a command…"
          className="h-11 w-full bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none"
        />
      </div>
      <Command.List className="max-h-96 overflow-y-auto p-2">
        <Command.Empty className="py-8 text-center text-sm text-text-tertiary">No results found.</Command.Empty>

        {keyMatch && (
          <Command.Group heading="Jump to issue" className="px-1 pb-2 text-[11px] font-medium uppercase text-text-tertiary [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5">
            <Command.Item
              onSelect={() =>
                go(
                  `/${workspaceSlug}/${keyMatch[1].toUpperCase()}/board?issue=${keyMatch[1].toUpperCase()}-${keyMatch[2]}`,
                )
              }
              className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] px-2 py-2 text-sm text-text-primary data-[selected=true]:bg-surface-2"
            >
              <Bug className="size-3.5 text-text-tertiary" />
              Open {keyMatch[1].toUpperCase()}-{keyMatch[2]}
            </Command.Item>
          </Command.Group>
        )}

        {results && debounced.length >= 2 && (
          <>
            {results.issues.length > 0 && (
              <Command.Group heading="Issues" className="px-1 pb-2 text-[11px] font-medium uppercase text-text-tertiary [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5">
                {results.issues.map((issue) => {
                  const StatusIcon = STATUS_ICON[issue.status];
                  return (
                    <Command.Item
                      key={issue.id}
                      value={`issue-${issue.id}`}
                      onSelect={() => go(issue.url)}
                      className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] px-2 py-2 text-sm text-text-primary data-[selected=true]:bg-surface-2"
                    >
                      <StatusIcon className="size-3.5 text-text-tertiary" />
                      <span className="font-mono text-[11px] text-text-tertiary">{issue.key}</span>
                      <span className="truncate">{issue.title}</span>
                    </Command.Item>
                  );
                })}
              </Command.Group>
            )}
            {results.projects.length > 0 && (
              <Command.Group heading="Projects" className="px-1 pb-2 text-[11px] font-medium uppercase text-text-tertiary [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5">
                {results.projects.map((p) => (
                  <Command.Item
                    key={p.id}
                    value={`project-${p.id}`}
                    onSelect={() => go(`/${workspaceSlug}/${p.key}/board`)}
                    className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] px-2 py-2 text-sm text-text-primary data-[selected=true]:bg-surface-2"
                  >
                    <FolderKanban className="size-3.5" style={{ color: p.color }} />
                    {p.name}
                  </Command.Item>
                ))}
              </Command.Group>
            )}
            {results.users.length > 0 && (
              <Command.Group heading="People" className="px-1 pb-2 text-[11px] font-medium uppercase text-text-tertiary [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5">
                {results.users.map((u) => (
                  <Command.Item
                    key={u.id}
                    value={`user-${u.id}`}
                    onSelect={() => setOpen(false)}
                    className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] px-2 py-2 text-sm text-text-primary data-[selected=true]:bg-surface-2"
                  >
                    <Avatar name={u.name} src={u.avatarUrl} size="xs" />
                    {u.name} <span className="text-text-tertiary">@{u.username}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
            {results.epics.length > 0 && (
              <Command.Group heading="Epics" className="px-1 pb-2 text-[11px] font-medium uppercase text-text-tertiary [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5">
                {results.epics.map((e) => (
                  <Command.Item
                    key={e.id}
                    value={`epic-${e.id}`}
                    onSelect={() => go(`/${workspaceSlug}/${e.projectKey}/epics`)}
                    className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] px-2 py-2 text-sm text-text-primary data-[selected=true]:bg-surface-2"
                  >
                    <Layers className="size-3.5" style={{ color: e.color }} />
                    {e.name}
                  </Command.Item>
                ))}
              </Command.Group>
            )}
            {results.labels.length > 0 && (
              <Command.Group heading="Labels" className="px-1 pb-2 text-[11px] font-medium uppercase text-text-tertiary [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5">
                {results.labels.map((l) => (
                  <Command.Item
                    key={l.id}
                    value={`label-${l.id}`}
                    onSelect={() => go(`/${workspaceSlug}/${l.projectKey}/board`)}
                    className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] px-2 py-2 text-sm text-text-primary data-[selected=true]:bg-surface-2"
                  >
                    <Tag className="size-3.5" style={{ color: l.color }} />
                    {l.name}
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </>
        )}

        {!isSearching && (
          <>
            <Command.Group heading="Navigate" className="px-1 pb-2 text-[11px] font-medium uppercase text-text-tertiary [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5">
              <PaletteItem icon={LayoutDashboard} label="Go to dashboard" onSelect={() => go(`/${workspaceSlug}`)} />
              <PaletteItem icon={User} label="Go to My Work" onSelect={() => go(`/${workspaceSlug}/my-work`)} />
              <PaletteItem
                icon={Plus}
                label="Create project"
                onSelect={() => {
                  openCreateProject();
                  setOpen(false);
                }}
              />
            </Command.Group>

            {projects.length > 0 && (
              <Command.Group heading="Projects" className="px-1 pb-2 text-[11px] font-medium uppercase text-text-tertiary [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5">
                {projects.map((p) => (
                  <PaletteItem
                    key={p.id}
                    icon={KanbanSquare}
                    label={`${p.name} — Board`}
                    onSelect={() => go(`/${workspaceSlug}/${p.key}/board`)}
                  />
                ))}
                {projects.map((p) => (
                  <PaletteItem
                    key={`${p.id}-backlog`}
                    icon={ListTree}
                    label={`${p.name} — Backlog`}
                    onSelect={() => go(`/${workspaceSlug}/${p.key}/backlog`)}
                  />
                ))}
              </Command.Group>
            )}

            <Command.Group heading="Actions" className="px-1 pb-2 text-[11px] font-medium uppercase text-text-tertiary [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5">
              <PaletteItem
                icon={Plus}
                label="Create issue"
                shortcut="C"
                onSelect={() => {
                  openCreateIssue();
                  setOpen(false);
                }}
              />
              <PaletteItem icon={Sun} label="Light theme" onSelect={() => { setTheme("light"); setOpen(false); }} />
              <PaletteItem icon={Moon} label="Dark theme" onSelect={() => { setTheme("dark"); setOpen(false); }} />
            </Command.Group>
          </>
        )}
      </Command.List>
    </Command.Dialog>
  );
}

function PaletteItem({
  icon: Icon,
  label,
  shortcut,
  onSelect,
}: {
  icon: typeof Plus;
  label: string;
  shortcut?: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] px-2 py-2 text-sm text-text-primary data-[selected=true]:bg-surface-2"
    >
      <Icon className="size-3.5 text-text-tertiary" />
      <span className="flex-1">{label}</span>
      {shortcut && <kbd className="rounded border border-border-strong px-1.5 py-0.5 text-[10px] text-text-tertiary">{shortcut}</kbd>}
    </Command.Item>
  );
}

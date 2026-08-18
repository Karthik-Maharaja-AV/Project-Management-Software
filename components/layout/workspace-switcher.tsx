"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type WorkspaceSummary = { id: string; name: string; slug: string; icon: string | null };

export function WorkspaceSwitcher({
  current,
  workspaces,
}: {
  current: WorkspaceSummary;
  workspaces: WorkspaceSummary[];
}) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left hover:bg-surface-2 transition-colors">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-accent text-[13px] text-accent-foreground">
          {current.icon || current.name[0]?.toUpperCase()}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary">{current.name}</span>
        <ChevronsUpDown className="size-3.5 text-text-tertiary" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        {workspaces.map((ws) => (
          <DropdownMenuItem key={ws.id} onSelect={() => router.push(`/${ws.slug}`)}>
            <span className="flex size-5 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-surface-2 text-[11px]">
              {ws.icon || ws.name[0]?.toUpperCase()}
            </span>
            <span className="flex-1 truncate">{ws.name}</span>
            {ws.slug === current.slug && <Check className="size-3.5 text-accent" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/workspaces/new">
            <Plus className="size-3.5" /> Create workspace
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

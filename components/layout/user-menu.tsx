"use client";

import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { LogOut, Monitor, Moon, Settings, Sun, User } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu({ workspaceSlug }: { workspaceSlug: string }) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  if (!session?.user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] p-1.5 text-left hover:bg-surface-2 transition-colors">
        <Avatar name={session.user.name ?? "?"} src={session.user.image} size="sm" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-xs font-medium text-text-primary">{session.user.name}</span>
          <span className="truncate text-[11px] text-text-tertiary">@{session.user.username}</span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Account</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href={`/${workspaceSlug}/settings/profile`}>
            <User className="size-3.5" /> Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/${workspaceSlug}/settings/members`}>
            <Settings className="size-3.5" /> Workspace settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {theme === "dark" ? <Moon className="size-3.5" /> : theme === "light" ? <Sun className="size-3.5" /> : <Monitor className="size-3.5" />}
            Appearance
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onSelect={() => setTheme("light")}>
              <Sun className="size-3.5" /> Light
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setTheme("dark")}>
              <Moon className="size-3.5" /> Dark
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setTheme("system")}>
              <Monitor className="size-3.5" /> System
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => signOut({ callbackUrl: "/login" })} className="text-danger focus:bg-danger-muted">
          <LogOut className="size-3.5" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

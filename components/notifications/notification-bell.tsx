"use client";

import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNotifications } from "@/hooks/use-notifications";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative flex size-8 items-center justify-center rounded-[var(--radius-sm)] text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors">
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex size-2 items-center justify-center rounded-full bg-accent" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <span className="text-sm font-semibold text-text-primary">Notifications</span>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead()}
              className="flex items-center gap-1 text-xs text-text-tertiary hover:text-accent transition-colors"
            >
              <CheckCheck className="size-3.5" /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="You're all caught up"
              description="No notifications yet."
              className="border-none py-10"
            />
          ) : (
            notifications.map((n) => (
              <Link
                key={n.id}
                href={n.link ?? "#"}
                onClick={() => !n.isRead && markRead(n.id)}
                className={cn(
                  "flex gap-2.5 border-b border-border px-3 py-2.5 text-left transition-colors hover:bg-surface-2",
                  !n.isRead && "bg-accent-muted/40",
                )}
              >
                <Avatar name={n.actor?.name ?? "System"} src={n.actor?.avatarUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] leading-snug text-text-primary">{n.title}</p>
                  {n.body && <p className="truncate text-xs text-text-tertiary">{n.body}</p>}
                  <p className="mt-0.5 text-[11px] text-text-tertiary">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {!n.isRead && <span className="mt-1 size-1.5 shrink-0 rounded-full bg-accent" />}
              </Link>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function NotificationBellButtonFallback() {
  return (
    <Button variant="ghost" size="icon" disabled>
      <Bell className="size-4" />
    </Button>
  );
}

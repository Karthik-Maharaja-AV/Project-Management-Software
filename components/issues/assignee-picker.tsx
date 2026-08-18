"use client";

import { useState } from "react";
import { Check, User as UserIcon } from "lucide-react";
import { useProjectMembers } from "@/hooks/use-project-members";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { UserSummary } from "@/lib/types";

export function AssigneePicker({
  projectId,
  value,
  onChange,
  compact,
}: {
  projectId: string;
  value: UserSummary | null;
  onChange: (userId: string | null) => void;
  compact?: boolean;
}) {
  const { data: members } = useProjectMembers(projectId);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = (members ?? []).filter((m) =>
    m.user.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-border-strong bg-surface-1 px-2 py-1 text-xs text-text-primary hover:bg-surface-2 transition-colors",
            compact && "border-none bg-transparent px-1 py-0.5",
          )}
        >
          {value ? (
            <Avatar name={value.name} src={value.avatarUrl} size="xs" />
          ) : (
            <span className="flex size-5 items-center justify-center rounded-full border border-dashed border-border-strong text-text-tertiary">
              <UserIcon className="size-3" />
            </span>
          )}
          {!compact && <span className="truncate">{value?.name ?? "Unassigned"}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1">
        <div className="p-1 pb-1.5">
          <Input
            autoFocus
            placeholder="Assign to…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 text-xs"
          />
        </div>
        <button
          onClick={() => {
            onChange(null);
            setOpen(false);
          }}
          className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm text-text-secondary hover:bg-surface-2 transition-colors"
        >
          <span className="flex size-5 items-center justify-center rounded-full border border-dashed border-border-strong">
            <UserIcon className="size-3" />
          </span>
          Unassigned
          {!value && <Check className="ml-auto size-3.5 text-accent" />}
        </button>
        {filtered.map((m) => (
          <button
            key={m.userId}
            onClick={() => {
              onChange(m.userId);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm text-text-primary hover:bg-surface-2 transition-colors"
          >
            <Avatar name={m.user.name} src={m.user.avatarUrl} size="xs" />
            <span className="truncate">{m.user.name}</span>
            {value?.id === m.userId && <Check className="ml-auto size-3.5 text-accent" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;
export const DropdownMenuSub = DropdownMenuPrimitive.Sub;
export const DropdownMenuSubTrigger = ({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger>) => (
  <DropdownMenuPrimitive.SubTrigger
    className={cn(
      "flex cursor-pointer select-none items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm text-text-primary outline-none data-[state=open]:bg-surface-2 focus:bg-surface-2",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto size-3.5 text-text-tertiary" />
  </DropdownMenuPrimitive.SubTrigger>
);

export function DropdownMenuContent({
  className,
  sideOffset = 6,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[180px] overflow-hidden rounded-[var(--radius-md)] border border-border-strong bg-surface-3 p-1 shadow-[var(--shadow-lg)]",
          "data-[state=open]:animate-fade-in",
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}
export const DropdownMenuSubContent = DropdownMenuContent;

export function DropdownMenuItem({
  className,
  inset,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & { inset?: boolean }) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm text-text-primary outline-none transition-colors",
        "focus:bg-surface-2 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        inset && "pl-7",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-[var(--radius-sm)] py-1.5 pl-7 pr-2 text-sm text-text-primary outline-none focus:bg-surface-2",
        className,
      )}
      checked={checked}
      {...props}
    >
      <span className="absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Check className="size-3.5 text-accent" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

export function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & { inset?: boolean }) {
  return (
    <DropdownMenuPrimitive.Label
      className={cn(
        "px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-text-tertiary",
        inset && "pl-7",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

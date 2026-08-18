"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function SettingsTabs({ workspaceSlug }: { workspaceSlug: string }) {
  const pathname = usePathname();
  const base = `/${workspaceSlug}/settings`;
  const tabs = [
    { href: `${base}/profile`, label: "Profile" },
    { href: `${base}/members`, label: "Members" },
    { href: `${base}/appearance`, label: "Appearance" },
  ];

  return (
    <div className="mb-6 flex gap-1 border-b border-border">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "border-b-2 border-transparent px-3 py-2 text-sm transition-colors",
            pathname === tab.href
              ? "border-accent text-text-primary font-medium"
              : "text-text-secondary hover:text-text-primary",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

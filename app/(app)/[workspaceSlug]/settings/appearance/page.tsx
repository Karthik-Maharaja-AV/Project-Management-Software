"use client";

import { useTheme } from "next-themes";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export default function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Choose how PixelForge looks on this device.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-[var(--radius-md)] border p-4 transition-colors",
                theme === opt.value
                  ? "border-accent bg-accent-muted"
                  : "border-border-strong hover:bg-surface-2",
              )}
            >
              {theme === opt.value && (
                <Check className="absolute right-2 top-2 size-3.5 text-accent" />
              )}
              <opt.icon className="size-5 text-text-secondary" />
              <span className="text-sm text-text-primary">{opt.label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { SocketProvider } from "@/components/providers/socket-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
      <SessionProvider>
        <QueryProvider>
          <SocketProvider>
          <TooltipProvider delayDuration={300}>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: "var(--surface-3)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-strong)",
                },
              }}
            />
          </TooltipProvider>
          </SocketProvider>
        </QueryProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}

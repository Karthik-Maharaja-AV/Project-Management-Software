"use client";

import { useState } from "react";
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
        queryCache: new QueryCache({
          onError: (error, query) => {
            // Only surface a toast when there's no cached data to fall back on —
            // a background refetch failure shouldn't interrupt an otherwise-working view.
            if (query.state.data !== undefined) return;
            toast.error(error instanceof Error ? error.message : "Something went wrong loading data");
          },
        }),
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

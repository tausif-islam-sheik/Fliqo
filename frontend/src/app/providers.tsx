"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useState } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return (
    <NuqsAdapter>
      <QueryClientProvider client={client}>
        {children}
        <Toaster richColors position="top-center" toastOptions={{ className: "!rounded-2xl" }} />
      </QueryClientProvider>
    </NuqsAdapter>
  );
}

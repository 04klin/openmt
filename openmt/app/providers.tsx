// app/providers.tsx
"use client";

import {
  isServer,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useEffect } from "react";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, staleTime above 0 prevents immediate refetching on the client
        staleTime: 60 * 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (isServer) {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: reuse client if already instantiated
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  useEffect(() => {
    const applyTheme = (theme: string | null) => {
      const valid = ["dark", "light", "carbon", "pastel"].includes(theme || "") ? theme : "pastel";
      document.documentElement.dataset.theme = valid || "pastel";
    };
    applyTheme(localStorage.getItem("openmt-theme"));
    const handleThemeChange = () => applyTheme(localStorage.getItem("openmt-theme"));
    window.addEventListener("openmt-theme-change", handleThemeChange);
    return () => window.removeEventListener("openmt-theme-change", handleThemeChange);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

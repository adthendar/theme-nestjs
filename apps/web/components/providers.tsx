"use client";
import { useEffect, useState, type ReactNode } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "next-themes";
import type { Settings } from "@starter/shared";
import { api, ApiError } from "@/lib/client";
export type Branding = Omit<Settings, "timezone">;
export function useBranding() {
  return useQuery({
    queryKey: ["branding"],
    queryFn: () => api<Branding>("branding"),
  });
}
function BrandingSync() {
  const { data } = useBranding();
  const { setTheme } = useTheme();
  useEffect(() => {
    if (data) {
      document.title = data.name;
      if (!localStorage.getItem("starter-theme-choice"))
        setTheme(data.defaultTheme);
    }
  }, [data, setTheme]);
  return null;
}
export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: (count, error) =>
              count < 1 &&
              (!(error instanceof ApiError) || error.status >= 500),
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <ThemeProvider
        attribute="class"
        storageKey="starter-theme"
        enableSystem
        disableTransitionOnChange
      >
        <BrandingSync />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

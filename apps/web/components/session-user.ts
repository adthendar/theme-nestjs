"use client";

import { useQuery } from "@tanstack/react-query";
import type { SessionUser } from "@starter/shared";
import { api } from "@/lib/client";

export function useSessionUser() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => api<SessionUser>("auth/me"),
  });
}

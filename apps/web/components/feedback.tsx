"use client";
import { usePanelTranslation } from "@/components/panel-language";
import type { ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
export function Pending({ label }: { label: string }) {
  return (
    <div role="status" className="space-y-3">
      <p>{label}</p>
      <Skeleton
        aria-hidden
        className="h-16 w-full motion-reduce:animate-none"
      />
    </div>
  );
}
export function Failure({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  const t = usePanelTranslation();
  return (
    <Alert>
      <AlertTitle>{t("Something went wrong", "Terjadi gangguan")}</AlertTitle>
      <AlertDescription>
        <p role="alert">
          {error instanceof Error
            ? error.message
            : t("Unable to load data", "Data tidak dapat dimuat")}
        </p>
        {retry && (
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={retry}
          >
            {t("Retry", "Coba lagi")}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="border-y border-border py-6 text-muted-foreground">
      {children}
    </p>
  );
}

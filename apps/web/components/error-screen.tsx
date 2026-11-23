"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { errorMessages, type ErrorStatus } from "@/lib/error-pages";
import type { Language } from "@/components/panel-language";

export function ErrorScreen({
  status,
  retry,
}: {
  status: ErrorStatus;
  retry?: () => void;
}) {
  const [locale, setLocale] = useState<Language>("en");
  const [title, description] = errorMessages(status, locale);
  return (
    <main
      lang={locale}
      className="grid min-h-dvh place-items-center bg-background p-4 text-foreground"
    >
      <div className="w-full max-w-lg rounded-[2rem] bg-card p-8 ring-1 ring-border">
        <code className="text-brand">{status}</code>
        <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
        <p className="mt-2 text-muted-foreground">{description}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild variant="ink">
            <Link href="/dashboard">
              {locale === "en" ? "Back to dashboard" : "Kembali ke dasbor"}
            </Link>
          </Button>
          {retry && (
            <Button variant="outline" onClick={retry}>
              {locale === "en" ? "Retry" : "Coba lagi"}
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => setLocale(locale === "en" ? "id" : "en")}
          >
            {locale === "en" ? "Bahasa Indonesia" : "English"}
          </Button>
        </div>
      </div>
    </main>
  );
}

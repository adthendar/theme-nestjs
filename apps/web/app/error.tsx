"use client";

import { ErrorScreen } from "@/components/error-screen";

export default function Error({ reset }: { reset: () => void }) {
  return <ErrorScreen status={500} retry={reset} />;
}

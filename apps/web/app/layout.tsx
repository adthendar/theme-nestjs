import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/figtree";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { Providers } from "@/components/providers";
export const metadata: Metadata = {
  title: "Administrasi",
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

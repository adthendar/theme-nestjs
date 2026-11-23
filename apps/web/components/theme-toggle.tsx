"use client";

import {
  ThemeToggler,
  type ThemeSelection,
} from "@animate-ui/react/primitives/effects/theme-toggler";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const next: Record<ThemeSelection, ThemeSelection> = {
  light: "system",
  system: "dark",
  dark: "light",
};
const labelsId = { light: "Terang", system: "Sistem", dark: "Gelap" };
const icons = { light: Sun, system: Monitor, dark: Moon };

export function ThemeToggle({ locale = "id" }: { locale?: "en" | "id" }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <ThemeToggler
      theme={theme === "light" || theme === "dark" ? theme : "system"}
      resolvedTheme={resolvedTheme === "dark" ? "dark" : "light"}
      setTheme={setTheme}
      onImmediateChange={(value) =>
        localStorage.setItem("starter-theme-choice", value)
      }
    >
      {({ effective, toggleTheme }) => {
        const Icon = icons[effective];
        const labels =
          locale === "id"
            ? labelsId
            : { light: "Light", system: "System", dark: "Dark" };
        const label =
          locale === "id"
            ? `Tema ${labels[effective]}. Ganti ke ${labels[next[effective]]}`
            : `${labels[effective]} theme. Switch to ${labels[next[effective]]}`;
        return (
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={label}
            title={label}
            onClick={() => toggleTheme(next[effective])}
          >
            <Icon aria-hidden="true" />
          </Button>
        );
      }}
    </ThemeToggler>
  );
}

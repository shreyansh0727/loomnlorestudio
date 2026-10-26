"use client";

import { Moon, Sun } from "lucide-react";
import { applyThemeToDocument, currentTheme, THEME_STORAGE_KEY } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function ThemeToggle({
  className,
  withLabel = false,
}: {
  className?: string;
  withLabel?: boolean;
}) {
  function toggleTheme() {
    const next = currentTheme() === "dark" ? "light" : "dark";
    applyThemeToDocument(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage can be blocked (private mode); the theme still applies for this page.
    }
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Switch colour theme"
      title="Switch colour theme"
      className={cn("inline-flex items-center gap-2 transition-colors", className)}
    >
      <Moon className="size-[1.15rem] dark:hidden" strokeWidth={1.5} aria-hidden />
      <Sun className="hidden size-[1.15rem] dark:block" strokeWidth={1.5} aria-hidden />
      {withLabel ? (
        <>
          <span className="dark:hidden">Dark mode</span>
          <span className="hidden dark:inline">Light mode</span>
        </>
      ) : null}
    </button>
  );
}

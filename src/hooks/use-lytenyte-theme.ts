import { useEffect, useState } from "react";
import { useSettingsStore } from "@/store/settingsStore";

/**
 * Hook to get the appropriate LyteNyte theme class based on current app theme.
 *
 * LyteNyte supports these theme classes:
 * - "light" - Light theme
 * - "dark" - Dark theme
 * - "lng1771-shadcn" - Shadcn-compatible theme (uses CSS variables)
 * - "lng1771-teal" - Teal accent theme
 *
 * This hook returns "lng1771-shadcn" as base with "dark" added for dark mode,
 * ensuring LyteNyte integrates with the app's shadcn-based design system.
 */
export function useLyteNyteTheme(): string {
  const { preferences } = useSettingsStore();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const theme = preferences.theme;

    if (theme === "system") {
      // Check system preference
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      setIsDark(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setIsDark(e.matches);
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    setIsDark(theme === "dark");
  }, [preferences.theme]);

  // Return combined class: shadcn base + dark modifier when needed
  return isDark ? "lng1771-shadcn dark" : "lng1771-shadcn";
}

/**
 * Returns just the dark/light state for simpler use cases
 */
export function useLyteNyteIsDark(): boolean {
  const { preferences } = useSettingsStore();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const theme = preferences.theme;

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      setIsDark(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setIsDark(e.matches);
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    setIsDark(theme === "dark");
  }, [preferences.theme]);

  return isDark;
}

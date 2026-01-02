import { useEffect } from "react";
import { useSettingsStore } from "@/store/settingsStore";
import i18n from "i18next";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { preferences } = useSettingsStore();

  useEffect(() => {
    const root = window.document.documentElement;
    const theme = preferences.theme;

    const applyTheme = (isDark: boolean) => {
      root.classList.toggle("dark", isDark);
      root.style.colorScheme = isDark ? "dark" : "light";
    };

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      
      const handleChange = () => {
        applyTheme(mediaQuery.matches);
      };

      handleChange(); // Initial check
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    applyTheme(theme === "dark");
  }, [preferences.theme]);

  useEffect(() => {
    if (i18n.language !== preferences.language) {
      i18n.changeLanguage(preferences.language);
    }
  }, [preferences.language]);

  return <>{children}</>;
}

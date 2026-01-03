import { useState, useEffect } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSettingsStore } from "@/store/settingsStore";
import { useTranslation } from "react-i18next";

export function ThemeToggle() {
  const { preferences, updatePreferences } = useSettingsStore();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-lg"
        disabled
      >
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    );
  }

  const theme = preferences.theme;
  const isDark = theme === "dark" ||
    (theme === "system" &&
     typeof window !== "undefined" &&
     window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg"
          title={t('shell.theme.toggle')}
        >
          {isDark ? (
            <Moon className="h-[1.2rem] w-[1.2rem]" />
          ) : (
            <Sun className="h-[1.2rem] w-[1.2rem]" />
          )}
          <span className="sr-only">{t('shell.theme.toggle')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => updatePreferences({ theme: "light" })}>
          <Sun className="mr-2 h-4 w-4" />
          <span>{t('shell.theme.light')}</span> 
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => updatePreferences({ theme: "dark" })}>
          <Moon className="mr-2 h-4 w-4" />
          <span>{t('shell.theme.dark')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => updatePreferences({ theme: "system" })}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>{t('shell.theme.system')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

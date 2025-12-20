"use client";

import { Calendar, Clock, Globe, Languages, Loader2, Moon, Save, Sun, Timer } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/registry/new-york/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/registry/new-york/ui/card";
import { Field, FieldContent, FieldDescription, FieldLabel } from "@/registry/new-york/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/new-york/ui/select";
import { Separator } from "@/registry/new-york/ui/separator";
import { Switch } from "@/registry/new-york/ui/switch";

export type DateFormatPreset =
  | "YYYY-MM-DD"
  | "YYYY/MM/DD"
  | "MM/DD/YYYY"
  | "DD/MM/YYYY"
  | "MMM D, YYYY";

export interface PreferencesData {
  theme: "light" | "dark" | "system";
  language: "en" | "zh";
  timezone: string;
  dateFormat: DateFormatPreset;
  timeFormat: "12h" | "24h";
  showSeconds: boolean;
  defaultCommandTimeout: number; // in minutes
}

export interface SettingsPreferencesProps {
  preferences?: PreferencesData;
  onSave?: (data: PreferencesData) => Promise<void>;
  className?: string;
}

function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function formatPreview(date: Date, prefs: PreferencesData): string {
  const locale = prefs.language === "zh" ? "zh-CN" : "en-US";
  const timeZone = prefs.timezone || "UTC";

  const parts = new Intl.DateTimeFormat(locale, {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: prefs.showSeconds ? "2-digit" : undefined,
    hour12: prefs.timeFormat === "12h",
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const year = get("year");
  const month = get("month");
  const day = get("day");

  let dateStr = "";
  switch (prefs.dateFormat) {
    case "YYYY-MM-DD":
      dateStr = `${year}-${month}-${day}`;
      break;
    case "YYYY/MM/DD":
      dateStr = `${year}/${month}/${day}`;
      break;
    case "MM/DD/YYYY":
      dateStr = `${month}/${day}/${year}`;
      break;
    case "DD/MM/YYYY":
      dateStr = `${day}/${month}/${year}`;
      break;
    case "MMM D, YYYY":
      dateStr = new Intl.DateTimeFormat(locale, {
        timeZone,
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date);
      break;
  }

  let timeStr = `${get("hour")}:${get("minute")}`;
  if (prefs.showSeconds) {
    timeStr += `:${get("second")}`;
  }
  if (prefs.timeFormat === "12h") {
    const dayPeriod = get("dayPeriod");
    if (dayPeriod) timeStr += ` ${dayPeriod}`;
  }

  return `${dateStr} ${timeStr}`;
}

const defaultPreferences: PreferencesData = {
  theme: "system",
  language: "en",
  timezone: getBrowserTimezone(),
  dateFormat: "YYYY-MM-DD",
  timeFormat: "24h",
  showSeconds: false,
  defaultCommandTimeout: 60,
};

export default function SettingsPreferences({
  preferences = defaultPreferences,
  onSave,
  className,
}: SettingsPreferencesProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [localPreferences, setLocalPreferences] = useState<PreferencesData>({
    ...defaultPreferences,
    ...preferences,
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave?.(localPreferences);
    } finally {
      setIsSaving(false);
    }
  };

  const languages = useMemo(
    () => [
      { value: "en" as const, label: "English" },
      { value: "zh" as const, label: "中文" },
    ],
    []
  );

  const timezones = useMemo(
    () => [
      { value: "UTC", label: "UTC" },
      { value: "Asia/Shanghai", label: "Asia/Shanghai" },
      { value: "Asia/Tokyo", label: "Asia/Tokyo" },
      { value: "Europe/London", label: "Europe/London" },
      { value: "America/Los_Angeles", label: "America/Los_Angeles" },
      { value: "America/New_York", label: "America/New_York" },
    ],
    []
  );

  const dateFormats = useMemo(
    () => [
      { value: "YYYY-MM-DD" as const, label: "YYYY-MM-DD" },
      { value: "YYYY/MM/DD" as const, label: "YYYY/MM/DD" },
      { value: "MM/DD/YYYY" as const, label: "MM/DD/YYYY" },
      { value: "DD/MM/YYYY" as const, label: "DD/MM/YYYY" },
      { value: "MMM D, YYYY" as const, label: "MMM D, YYYY" },
    ],
    []
  );

  const preview = useMemo(() => {
    const sampleUtc = new Date("2025-12-13T02:37:19.000Z");
    return formatPreview(sampleUtc, localPreferences);
  }, [localPreferences]);

  return (
    <Card className={cn("w-full shadow-xs", className)}>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <CardTitle className="wrap-break-word">Preferences</CardTitle>
            <CardDescription className="wrap-break-word">
              Server timestamps are stored in UTC. Choose how they are displayed in the UI.
            </CardDescription>
          </div>
          {onSave && (
            <Button
              aria-busy={isSaving}
              className="w-full sm:w-auto"
              data-loading={isSaving}
              disabled={isSaving}
              onClick={handleSave}
              type="button"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span className="whitespace-nowrap">Saving…</span>
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  <span className="whitespace-nowrap">Save</span>
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Sun className="size-5 text-muted-foreground" />
              <h3 className="font-semibold text-base">Appearance</h3>
            </div>

            <Field>
              <FieldLabel>Theme</FieldLabel>
              <FieldContent>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    onClick={() => setLocalPreferences((p) => ({ ...p, theme: "light" }))}
                    size="sm"
                    type="button"
                    variant={localPreferences.theme === "light" ? "default" : "outline"}
                  >
                    <Sun className="size-4" />
                    Light
                  </Button>
                  <Button
                    onClick={() => setLocalPreferences((p) => ({ ...p, theme: "dark" }))}
                    size="sm"
                    type="button"
                    variant={localPreferences.theme === "dark" ? "default" : "outline"}
                  >
                    <Moon className="size-4" />
                    Dark
                  </Button>
                  <Button
                    onClick={() => setLocalPreferences((p) => ({ ...p, theme: "system" }))}
                    size="sm"
                    type="button"
                    variant={localPreferences.theme === "system" ? "default" : "outline"}
                  >
                    System
                  </Button>
                </div>
              </FieldContent>
            </Field>
          </div>

          <Separator />

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Globe className="size-5 text-muted-foreground" />
              <h3 className="font-semibold text-base">Language & Region</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="language">Language</FieldLabel>
                <FieldContent>
                  <Select
                    onValueChange={(next) =>
                      setLocalPreferences((p) => ({ ...p, language: next as PreferencesData["language"] }))
                    }
                    value={localPreferences.language}
                  >
                    <SelectTrigger className="w-full" id="language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((l) => (
                        <SelectItem key={l.value} value={l.value}>
                          <span className="flex items-center gap-2">
                            <Languages className="size-4" />
                            {l.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
                <FieldContent>
                  <Select
                    onValueChange={(next) =>
                      setLocalPreferences((p) => ({ ...p, timezone: next }))
                    }
                    value={localPreferences.timezone}
                  >
                    <SelectTrigger className="w-full" id="timezone">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          <span className="flex items-center gap-2">
                             <Globe className="size-4" />
                            {tz.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="size-5 text-muted-foreground" />
              <h3 className="font-semibold text-base">Date & Time</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="date-format">Date format</FieldLabel>
                <FieldContent>
                  <Select
                    onValueChange={(next) =>
                      setLocalPreferences((p) => ({
                        ...p,
                        dateFormat: next as PreferencesData["dateFormat"],
                      }))
                    }
                    value={localPreferences.dateFormat}
                  >
                    <SelectTrigger className="w-full" id="date-format">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      {dateFormats.map((df) => (
                        <SelectItem key={df.value} value={df.value}>
                          <span className="flex items-center gap-2">
                            <Calendar className="size-4" />
                            {df.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="time-format">Time format</FieldLabel>
                <FieldContent>
                  <Select
                    onValueChange={(next) =>
                      setLocalPreferences((p) => ({
                        ...p,
                        timeFormat: next as PreferencesData["timeFormat"],
                      }))
                    }
                    value={localPreferences.timeFormat}
                  >
                    <SelectTrigger className="w-full" id="time-format">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">
                        <span className="flex items-center gap-2">
                          <Clock className="size-4" />
                          24-hour
                        </span>
                      </SelectItem>
                      <SelectItem value="12h">
                        <span className="flex items-center gap-2">
                          <Clock className="size-4" />
                          12-hour (AM/PM)
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
            </div>

            <Field>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                    <Clock className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <FieldLabel className="mb-0" htmlFor="show-seconds">
                      Show seconds
                    </FieldLabel>
                    <FieldDescription className="text-xs">
                      Include seconds in time displays.
                    </FieldDescription>
                  </div>
                </div>
                <Switch
                  checked={localPreferences.showSeconds}
                  id="show-seconds"
                  onCheckedChange={(checked) =>
                    setLocalPreferences((p) => ({ ...p, showSeconds: checked }))
                  }
                />
              </div>
            </Field>

            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="size-4 text-muted-foreground" />
                Preview
              </div>
              <p className="mt-2 font-mono text-sm">{preview}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Example stored as UTC: <span className="font-mono">2025-12-13T02:37:19.000Z</span>
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Timer className="size-5 text-muted-foreground" />
              <h3 className="font-semibold text-base">Commands</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="command-timeout">Default Command Timeout</FieldLabel>
                <FieldContent>
                  <Select
                    onValueChange={(next) =>
                      setLocalPreferences((p) => ({
                        ...p,
                        defaultCommandTimeout: parseInt(next),
                      }))
                    }
                    value={String(localPreferences.defaultCommandTimeout)}
                  >
                    <SelectTrigger className="w-full" id="command-timeout">
                      <SelectValue placeholder="Select timeout" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="1440">24 hours</SelectItem>
                      <SelectItem value="4320">3 days</SelectItem>
                      <SelectItem value="10080">7 days</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldContent>
                <FieldDescription>
                  Commands will expire if not retrieved by devices within this period.
                </FieldDescription>
              </Field>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
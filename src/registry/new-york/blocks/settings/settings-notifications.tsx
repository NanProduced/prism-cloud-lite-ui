"use client";

import { Bell, Clock, Filter, Loader2, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/registry/new-york/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/new-york/ui/card";
import { Checkbox } from "@/registry/new-york/ui/checkbox";
import { Field, FieldContent, FieldDescription, FieldLabel } from "@/registry/new-york/ui/field";
import { InputGroup, InputGroupInput } from "@/registry/new-york/ui/input-group";
import { Separator } from "@/registry/new-york/ui/separator";
import { Switch } from "@/registry/new-york/ui/switch";
import type { MessageKind, MessageStatus } from "@/types/message";
import {
  defaultNotificationSettings,
  MESSAGE_TYPE_OPTIONS,
  type NotificationSettingsV2,
} from "@/types/notificationSettings";

export interface SettingsNotificationsProps {
  settings?: NotificationSettingsV2;
  onSave?: (next: NotificationSettingsV2) => Promise<void>;
  className?: string;
}

export default function SettingsNotifications({
  settings = defaultNotificationSettings,
  onSave,
  className,
}: SettingsNotificationsProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState<NotificationSettingsV2>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const kindOptions = useMemo(
    () =>
      [
        { value: "NOTIFICATION" as const, label: "Notifications" },
        { value: "TASK" as const, label: "Tasks" },
      ] satisfies Array<{ value: MessageKind; label: string }>,
    []
  );

  const statusOptions = useMemo(
    () =>
      [
        { value: "SUCCESS" as const, label: "Success" },
        { value: "FAILED" as const, label: "Failed" },
        { value: "RUNNING" as const, label: "Running" },
        { value: "PENDING" as const, label: "Pending" },
      ] satisfies Array<{ value: MessageStatus; label: string }>,
    []
  );

  const toggleFromArray = <T,>(items: T[], value: T, checked: boolean) => {
    if (checked) {
      return items.includes(value) ? items : [...items, value];
    }
    return items.filter((x) => x !== value);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave?.(localSettings);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className={cn("w-full shadow-xs", className)}>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <CardTitle className="wrap-break-word">Notifications</CardTitle>
            <CardDescription className="wrap-break-word">
              Controls in-app toasts for Message Center events. This does not affect which messages are stored or shown in the Inbox.
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
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                  <Bell className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <FieldLabel className="mb-0" htmlFor="toast-enabled">
                    In-app toasts
                  </FieldLabel>
                  <FieldDescription className="text-xs">
                    Show toast notifications for message events.
                  </FieldDescription>
                </div>
              </div>
              <Switch
                checked={localSettings.toast.enabled}
                id="toast-enabled"
                onCheckedChange={(checked) =>
                  setLocalSettings((prev) => ({
                    ...prev,
                    toast: { ...prev.toast, enabled: checked },
                  }))
                }
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex flex-col gap-0.5">
                    <FieldLabel className="mb-0" htmlFor="toast-on-created">
                      On message created
                    </FieldLabel>
                    <FieldDescription className="text-xs">
                      Trigger on <span className="font-mono">message.created</span>.
                    </FieldDescription>
                  </div>
                  <Switch
                    checked={localSettings.toast.triggerOnCreated}
                    id="toast-on-created"
                    onCheckedChange={(checked) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        toast: { ...prev.toast, triggerOnCreated: checked },
                      }))
                    }
                  />
                </div>
              </Field>

              <Field>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex flex-col gap-0.5">
                    <FieldLabel className="mb-0" htmlFor="toast-on-updated">
                      On message updated
                    </FieldLabel>
                    <FieldDescription className="text-xs">
                      Trigger on <span className="font-mono">message.updated</span> when status changes.
                    </FieldDescription>
                  </div>
                  <Switch
                    checked={localSettings.toast.triggerOnUpdated}
                    id="toast-on-updated"
                    onCheckedChange={(checked) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        toast: { ...prev.toast, triggerOnUpdated: checked },
                      }))
                    }
                  />
                </div>
              </Field>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Filter className="size-5 text-muted-foreground" />
              <h3 className="font-semibold text-base">Filters</h3>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="text-sm font-medium">Kinds</div>
                  <div className="space-y-2">
                    {kindOptions.map((opt) => (
                      <label key={opt.value} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={localSettings.toast.kinds.includes(opt.value)}
                          onCheckedChange={(checked) =>
                            setLocalSettings((prev) => ({
                              ...prev,
                              toast: {
                                ...prev.toast,
                                kinds: toggleFromArray(prev.toast.kinds, opt.value, Boolean(checked)),
                              },
                            }))
                          }
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-medium">Statuses</div>
                  <div className="space-y-2">
                    {statusOptions.map((opt) => (
                      <label key={opt.value} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={localSettings.toast.statuses.includes(opt.value)}
                          onCheckedChange={(checked) =>
                            setLocalSettings((prev) => ({
                              ...prev,
                              toast: {
                                ...prev.toast,
                                statuses: toggleFromArray(prev.toast.statuses, opt.value, Boolean(checked)),
                              },
                            }))
                          }
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-3">
                <div className="text-sm font-medium">Message types</div>
                <FieldDescription>
                  If you select no types, it means <span className="font-medium">allow all</span>.
                </FieldDescription>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {MESSAGE_TYPE_OPTIONS.map((opt) => (
                    <label key={opt.type} className="flex items-start gap-2 text-sm">
                      <Checkbox
                        checked={localSettings.toast.types.includes(opt.type)}
                        onCheckedChange={(checked) =>
                          setLocalSettings((prev) => ({
                            ...prev,
                            toast: {
                              ...prev.toast,
                              types: toggleFromArray(prev.toast.types, opt.type, Boolean(checked)),
                            },
                          }))
                        }
                      />
                      <span className="leading-tight">
                        <span className="block font-medium">{opt.label}</span>
                        <span className="block text-xs text-muted-foreground">
                          {opt.description} <span className="font-mono">({opt.type})</span>
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Clock className="size-5 text-muted-foreground" />
              <h3 className="font-semibold text-base">Quiet Hours</h3>
            </div>

            <Field>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex flex-col gap-1">
                  <FieldLabel className="mb-0" htmlFor="quiet-hours">
                    Enable Quiet Hours
                  </FieldLabel>
                  <FieldDescription>
                    Suppress toasts during these hours (messages are still stored in the Inbox).
                  </FieldDescription>
                </div>
                <Switch
                  checked={localSettings.toast.quietHours.enabled}
                  id="quiet-hours"
                  onCheckedChange={(checked) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      toast: {
                        ...prev.toast,
                        quietHours: { ...prev.toast.quietHours, enabled: checked },
                      },
                    }))
                  }
                />
              </div>
            </Field>

            {localSettings.toast.quietHours.enabled && (
              <div className="grid grid-cols-1 gap-4 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="quiet-start">Start</FieldLabel>
                  <FieldContent>
                    <InputGroup>
                      <InputGroupInput
                        id="quiet-start"
                        onChange={(e) =>
                          setLocalSettings((prev) => ({
                            ...prev,
                            toast: {
                              ...prev.toast,
                              quietHours: { ...prev.toast.quietHours, start: e.target.value },
                            },
                          }))
                        }
                        type="time"
                        value={localSettings.toast.quietHours.start}
                      />
                    </InputGroup>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="quiet-end">End</FieldLabel>
                  <FieldContent>
                    <InputGroup>
                      <InputGroupInput
                        id="quiet-end"
                        onChange={(e) =>
                          setLocalSettings((prev) => ({
                            ...prev,
                            toast: {
                              ...prev.toast,
                              quietHours: { ...prev.toast.quietHours, end: e.target.value },
                            },
                          }))
                        }
                        type="time"
                        value={localSettings.toast.quietHours.end}
                      />
                    </InputGroup>
                  </FieldContent>
                </Field>
              </div>
            )}

            <Field>
              <FieldLabel htmlFor="toast-cooldown">Toast cooldown (seconds)</FieldLabel>
              <FieldContent>
                <InputGroup>
                  <InputGroupInput
                    id="toast-cooldown"
                    inputMode="numeric"
                    onChange={(e) => {
                      const next = Number.parseInt(e.target.value || "0", 10);
                      setLocalSettings((prev) => ({
                        ...prev,
                        toast: {
                          ...prev.toast,
                          cooldownSeconds: Number.isFinite(next) ? Math.max(0, next) : prev.toast.cooldownSeconds,
                        },
                      }));
                    }}
                    type="number"
                    value={String(localSettings.toast.cooldownSeconds)}
                  />
                </InputGroup>
              </FieldContent>
              <FieldDescription>
                Prevents repeated toasts for the same message in a short period.
              </FieldDescription>
            </Field>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

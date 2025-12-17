"use client";

import { Check, Loader2, Save } from "lucide-react";
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
import { Field, FieldContent, FieldError, FieldLabel } from "@/registry/new-york/ui/field";
import { InputGroup, InputGroupInput } from "@/registry/new-york/ui/input-group";
import { Separator } from "@/registry/new-york/ui/separator";

export interface ProfileData {
  name: string;
  email: string;
  avatarPreset: string;
}

export interface SettingsProfileProps {
  profile?: ProfileData;
  onSave?: (data: ProfileData) => Promise<void>;
  className?: string;
}

type AvatarPreset = {
  id: string;
  label: string;
  initials: string;
  swatchClassName: string;
};

export default function SettingsProfile({
  profile,
  onSave,
  className,
}: SettingsProfileProps) {
  const presets = useMemo<AvatarPreset[]>(
    () => [
      {
        id: "prism",
        label: "Prism",
        initials: "P",
        swatchClassName: "bg-gradient-to-br from-indigo-500 to-purple-500",
      },
      {
        id: "aurora",
        label: "Aurora",
        initials: "A",
        swatchClassName: "bg-gradient-to-br from-emerald-500 to-cyan-500",
      },
      {
        id: "ember",
        label: "Ember",
        initials: "E",
        swatchClassName: "bg-gradient-to-br from-rose-500 to-orange-500",
      },
      {
        id: "nebula",
        label: "Nebula",
        initials: "N",
        swatchClassName: "bg-gradient-to-br from-slate-700 to-slate-950",
      },
      {
        id: "mint",
        label: "Mint",
        initials: "M",
        swatchClassName: "bg-gradient-to-br from-teal-500 to-emerald-600",
      },
      {
        id: "sky",
        label: "Sky",
        initials: "S",
        swatchClassName: "bg-gradient-to-br from-sky-500 to-blue-600",
      },
    ],
    []
  );

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<ProfileData>({
    name: profile?.name || "",
    email: profile?.email || "",
    avatarPreset: profile?.avatarPreset || presets[0]?.id || "prism",
  });

  const handleSave = async () => {
    setErrors({});

    if (!formData.name.trim()) {
      setErrors({ name: "Display name is required" });
      return;
    }

    setIsSaving(true);
    try {
      await onSave?.(formData);
    } catch (error) {
      setErrors({
        _general: error instanceof Error ? error.message : "Failed to save",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedPreset = presets.find((p) => p.id === formData.avatarPreset) ?? presets[0];

  return (
    <Card className={cn("w-full shadow-xs", className)}>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <CardTitle className="wrap-break-word">Profile</CardTitle>
            <CardDescription className="wrap-break-word">
              Choose a preset avatar and manage your display name.
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
          {errors._general && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-destructive text-sm">{errors._general}</p>
            </div>
          )}

          <Field>
            <FieldLabel>Avatar</FieldLabel>
            <FieldContent>
              <div className="flex items-center gap-4">
                <div
                  aria-label="Selected avatar"
                  className={cn(
                    "flex size-14 items-center justify-center rounded-full text-white shadow-sm",
                    selectedPreset?.swatchClassName
                  )}
                >
                  <span className="text-lg font-semibold">
                    {selectedPreset?.initials}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{selectedPreset?.label}</p>
                  <p className="text-xs text-muted-foreground">
                    Custom uploads are disabled. Choose from presets.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
                {presets.map((preset) => {
                  const selected = formData.avatarPreset === preset.id;
                  return (
                    <button
                      aria-label={`Select avatar ${preset.label}`}
                      className={cn(
                        "group relative flex aspect-square items-center justify-center rounded-lg border bg-background p-2 transition-colors hover:bg-muted/40",
                        selected && "border-primary ring-2 ring-ring/50"
                      )}
                      key={preset.id}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          avatarPreset: preset.id,
                        }))
                      }
                      type="button"
                    >
                      <div
                        className={cn(
                          "flex size-10 items-center justify-center rounded-full text-white",
                          preset.swatchClassName
                        )}
                      >
                        <span className="text-sm font-semibold">
                          {preset.initials}
                        </span>
                      </div>
                      {selected && (
                        <span className="absolute right-2 top-2 inline-flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                          <Check className="size-3" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </FieldContent>
          </Field>

          <Separator />

          <div className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="display-name">
                Display name <span className="text-destructive">*</span>
              </FieldLabel>
              <FieldContent>
                <InputGroup>
                  <InputGroupInput
                    autoComplete="nickname"
                    id="display-name"
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Your display name"
                    value={formData.name}
                  />
                </InputGroup>
                {errors.name && <FieldError>{errors.name}</FieldError>}
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <FieldContent>
                <InputGroup>
                  <InputGroupInput
                    disabled
                    id="email"
                    placeholder="your.email@example.com"
                    type="email"
                    value={formData.email}
                  />
                </InputGroup>
              </FieldContent>
            </Field>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


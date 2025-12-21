"use client";

import { Check, ChevronDown, ChevronUp, Loader2, Save } from "lucide-react";
import { useState } from "react";
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
import { ALL_AVATARS, getAvatarById } from "@/lib/avatars";

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

export default function SettingsProfile({
  profile,
  onSave,
  className,
}: SettingsProfileProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<ProfileData>({
    name: profile?.name || "",
    email: profile?.email || "",
    avatarPreset: profile?.avatarPreset || ALL_AVATARS[0]?.id || "m-1",
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

  const selectedAvatar = getAvatarById(formData.avatarPreset) || ALL_AVATARS[0];

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
              <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center gap-4">
                  <div
                    aria-label="Selected avatar"
                    className="flex size-14 items-center justify-center overflow-hidden rounded-full border bg-background shadow-sm"
                  >
                    {selectedAvatar ? (
                      <img
                        alt="Current avatar"
                        className="size-full object-cover"
                        src={selectedAvatar.url}
                      />
                    ) : (
                      <div className="size-full bg-gradient-to-br from-indigo-500 to-purple-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      Profile Picture
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Click "Change" to pick a new one.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                >
                  {showAvatarPicker ? (
                    <>
                      <ChevronUp className="size-4" />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="size-4" />
                      <span>Change</span>
                    </>
                  )}
                </Button>
              </div>

              {showAvatarPicker && (
                <div className="mt-4 rounded-lg border bg-card p-4 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                  <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
                    {ALL_AVATARS.map((avatar) => {
                      const selected = formData.avatarPreset === avatar.id;
                      return (
                        <button
                          aria-label="Select avatar"
                          className={cn(
                            "group relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border bg-background p-1 transition-all hover:scale-105 hover:shadow-md",
                            selected && "border-primary ring-2 ring-ring/50"
                          )}
                          key={avatar.id}
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              avatarPreset: avatar.id,
                            }))
                          }
                          type="button"
                        >
                          <img
                            alt=""
                            className="size-full rounded-md object-cover"
                            src={avatar.url}
                          />
                          {selected && (
                            <span className="absolute right-1 top-1 inline-flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                              <Check className="size-2.5" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
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


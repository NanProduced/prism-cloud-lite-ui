import { useMemo, useState } from 'react';
import type { DeviceCustomFieldDef, DeviceCustomFieldOption, DeviceCustomFieldType } from '@/types/device-custom-field';
import { FREE_CUSTOM_FIELD_QUOTA } from '@/lib/mock/device-custom-fields';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  getTagPresetClassName,
  hexToRgba,
  isHexColor,
  resolveTagIcon,
  TAG_COLOR_PRESETS,
  TAG_ICON_OPTIONS,
} from '@/components/devices/tagging';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, Lock, Plus, Settings2, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const FIELD_TYPES: Array<{ value: DeviceCustomFieldType; label: string }> = [
  { value: 'TEXT', label: 'Text' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'DATETIME', label: 'Datetime' },
  { value: 'BOOLEAN', label: 'Boolean' },
  { value: 'SELECT', label: 'Select' },
  { value: 'MULTI_SELECT', label: 'Multi-select' },
  { value: 'URL', label: 'URL' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'COUNTRY', label: 'Country' },
];

function slugify(value: string): string {
  return stableKey(value, '_');
}

function slugifyHyphen(value: string): string {
  return stableKey(value, '-');
}

function stableKey(value: string, separator: '_' | '-'): string {
  const normalized = value.trim().normalize('NFKD').toLocaleLowerCase();
  const withoutMarks = normalized.replace(/[\u0300-\u036f]/g, '');
  const replaced = withoutMarks.replace(/[^\p{L}\p{N}]+/gu, separator);
  return replaced.replace(new RegExp(`^${separator}+|${separator}+$`, 'g'), '');
}

function nextId(): number {
  return Number(`${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`);
}

function sortBySequence<T extends { sequence?: number }>(a: T, b: T): number {
  return (a.sequence ?? 0) - (b.sequence ?? 0);
}

function ColorDot({ color }: { color?: string }) {
  const presetClassName = color ? getTagPresetClassName(color) : null;
  const isCustomHex = Boolean(color && isHexColor(color));

  return (
    <span
      className={cn('inline-flex h-4 w-4 rounded-full border', presetClassName ?? 'border-border bg-transparent')}
      style={
        isCustomHex && color
          ? {
              borderColor: color,
              backgroundColor: hexToRgba(color, 0.35),
            }
          : undefined
      }
    />
  );
}

function IconPicker({
  value,
  disabled,
  onChange,
  compact,
}: {
  value?: string;
  disabled?: boolean;
  onChange: (next?: string) => void;
  compact?: boolean;
}) {
  const Icon = resolveTagIcon(value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        {compact ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={disabled}
            aria-label="Pick icon"
          >
            {Icon ? <Icon className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="justify-start gap-2"
            disabled={disabled}
          >
            {Icon ? <Icon className="h-4 w-4" /> : <Plus className="h-4 w-4 text-muted-foreground" />}
            {Icon ? 'Icon' : 'Add icon'}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[340px] p-3" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="grid gap-3">
          <div className="text-xs font-semibold text-muted-foreground">Header icon</div>
          <div className="grid grid-cols-8 gap-2">
            <Button
              type="button"
              variant={!value ? 'default' : 'outline'}
              size="icon"
              className="h-9 w-9"
              onClick={() => onChange(undefined)}
              aria-label="No icon"
              title="No icon"
            >
              <X className="h-4 w-4" />
            </Button>
            {TAG_ICON_OPTIONS.map(({ key, Icon: OptionIcon, label }) => (
              <Button
                key={key}
                type="button"
                variant={value === key ? 'default' : 'outline'}
                size="icon"
                className="h-9 w-9"
                onClick={() => onChange(key)}
                aria-label={label}
                title={label}
              >
                <OptionIcon className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function OptionColorPicker({
  value,
  disabled,
  onChange,
}: {
  value?: string;
  disabled?: boolean;
  onChange: (next?: string) => void;
}) {
  const isCustomHex = Boolean(value && isHexColor(value));
  const customColorValue = isCustomHex && value ? value : '#64748b';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="icon" className="h-8 w-8" disabled={disabled}>
          <ColorDot color={value} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="grid gap-3">
          <div className="text-xs font-semibold text-muted-foreground">Option color</div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant={!value ? 'default' : 'outline'}
              size="icon"
              className="h-8 w-8"
              onClick={() => onChange(undefined)}
              aria-label="Default color"
              title="Default color"
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
            {TAG_COLOR_PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                className={cn(
                  'h-8 w-8 rounded-full border transition ring-offset-background',
                  preset.className,
                  value === preset.key && 'ring-2 ring-ring ring-offset-2',
                  disabled && 'opacity-60 cursor-not-allowed',
                )}
                onClick={() => {
                  if (disabled) return;
                  onChange(preset.key);
                }}
                aria-label={preset.label}
                title={preset.label}
                disabled={disabled}
              />
            ))}

            <div className="flex items-center gap-2 ms-auto">
              <div className="text-xs text-muted-foreground">Custom</div>
              <input
                type="color"
                value={customColorValue}
                onChange={(e) => onChange(e.target.value)}
                className="h-8 w-10 rounded border bg-transparent p-0"
                aria-label="Custom color"
                title="Custom color"
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function DeviceCustomFieldsSheet({
  customFieldDefs,
  isProActive,
  onProActiveChange,
  onCustomFieldDefsChange,
  onCustomFieldCreate,
  onCustomFieldDelete,
}: {
  customFieldDefs: DeviceCustomFieldDef[];
  isProActive: boolean;
  onProActiveChange?: (next: boolean) => void;
  onCustomFieldDefsChange: (next: DeviceCustomFieldDef[]) => void;
  onCustomFieldCreate: (def: DeviceCustomFieldDef) => void;
  onCustomFieldDelete: (fieldId: number) => void;
}) {
  const ordered = useMemo(
    () => customFieldDefs.slice().sort(sortBySequence),
    [customFieldDefs]
  );

  const freeCount = ordered.filter((d) => !d.planTierRequired).length;
  const canCreate = isProActive || freeCount < FREE_CUSTOM_FIELD_QUOTA;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [optionsOpenFor, setOptionsOpenFor] = useState<DeviceCustomFieldDef | null>(null);

  const [editingFieldId, setEditingFieldId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  const beginRename = (def: DeviceCustomFieldDef) => {
    setEditingFieldId(def.fieldId);
    setEditingName(def.displayName);
  };

  const commitRename = () => {
    const id = editingFieldId;
    if (!id) return;

    const currentDef = customFieldDefs.find((d) => d.fieldId === id);
    if (currentDef?.planTierRequired && !isProActive) {
      toast('Read-only custom field', {
        description: 'This field requires an active Pro subscription to edit.',
      });
      setEditingFieldId(null);
      setEditingName('');
      return;
    }

    const name = editingName.trim();
    if (!name) {
      toast('Name is required');
      return;
    }
    onCustomFieldDefsChange(
      customFieldDefs.map((d) => (d.fieldId === id ? { ...d, displayName: name } : d))
    );
    setEditingFieldId(null);
    setEditingName('');
  };

  const moveField = (fieldId: number, dir: 'up' | 'down') => {
    const idx = ordered.findIndex((d) => d.fieldId === fieldId);
    if (idx < 0) return;
    const next = ordered.slice();
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= next.length) return;
    const tmp = next[idx]!;
    next[idx] = next[swap]!;
    next[swap] = tmp;
    const withSeq = next.map((d, i) => ({ ...d, sequence: i + 1 }));
    onCustomFieldDefsChange(withSeq);
  };

  const handleDelete = (fieldId: number) => {
    const def = customFieldDefs.find((d) => d.fieldId === fieldId);
    if (def?.planTierRequired && !isProActive) {
      toast('Read-only custom field', {
        description: 'This field requires an active Pro subscription to edit.',
      });
      return;
    }
    onCustomFieldDelete(fieldId);
    toast('Custom field deleted');
  };

  const createField = (draft: {
    type: DeviceCustomFieldType;
    name: string;
    icon?: string;
    optionsText?: string;
  }) => {
    if (!canCreate) {
      toast('Upgrade to Pro to create more custom fields', {
        description: `Free plan supports up to ${FREE_CUSTOM_FIELD_QUOTA} custom fields.`,
      });
      return;
    }

    const displayName = draft.name.trim();
    if (!displayName) {
      toast('Name is required');
      return;
    }

    const baseKey = slugify(displayName) || `field_${Date.now()}`;
    let fieldKey = baseKey;
    let i = 2;
    while (customFieldDefs.some((d) => d.fieldKey === fieldKey)) {
      fieldKey = `${baseKey}_${i++}`;
    }

    const nextSeq = (Math.max(0, ...customFieldDefs.map((d) => d.sequence ?? 0)) + 1) || 1;
    const planTierRequired = freeCount >= FREE_CUSTOM_FIELD_QUOTA;

    const options = (() => {
      if (draft.type !== 'SELECT' && draft.type !== 'MULTI_SELECT') return undefined;
      const lines = (draft.optionsText ?? '')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length === 0) return [];
      const seen = new Set<string>();
      return lines.map((name, idx) => {
        const base = slugifyHyphen(name) || `opt-${idx + 1}`;
        let optionKey = base;
        let k = 2;
        while (seen.has(optionKey)) optionKey = `${base}-${k++}`;
        seen.add(optionKey);
        const defaultColor = TAG_COLOR_PRESETS[idx % TAG_COLOR_PRESETS.length]?.key;
        return {
          optionId: nextId(),
          optionKey,
          displayName: name,
          active: true,
          sequence: idx + 1,
          color: defaultColor,
        } satisfies DeviceCustomFieldOption;
      });
    })();

    const def: DeviceCustomFieldDef = {
      fieldId: nextId(),
      fieldKey,
      fieldType: draft.type,
      displayName,
      planTierRequired,
      sequence: nextSeq,
      icon: draft.icon,
      options,
    };

    onCustomFieldCreate(def);
    setCreateOpen(false);
    toast('Custom field created');
  };

  const updateOptions = (fieldId: number, updater: (prev: DeviceCustomFieldOption[]) => DeviceCustomFieldOption[]) => {
    onCustomFieldDefsChange(
      customFieldDefs.map((d) => {
        if (d.fieldId !== fieldId) return d;
        const nextOptions = updater((d.options ?? []).slice().sort(sortBySequence)).map((o, i) => ({
          ...o,
          sequence: i + 1,
        }));
        return { ...d, options: nextOptions };
      }),
    );
  };

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) {
          setCreateOpen(false);
          setOptionsOpenFor(null);
          setEditingFieldId(null);
          setEditingName('');
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Custom Fields
          <Badge variant="secondary" className="ml-1">
            {customFieldDefs.length}
          </Badge>
        </Button>
      </DialogTrigger>

      <DialogContent className="!w-[min(92vw,64rem)] !max-w-none p-0 overflow-hidden max-h-[78vh]">
        <div className="flex flex-col max-h-[78vh]">
          <div className="p-6 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-lg font-semibold">Custom Fields</div>
                <div className="text-sm text-muted-foreground">
                  Create typed columns and edit values in Grid like a spreadsheet.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={isProActive ? 'default' : 'secondary'}>
                  {isProActive ? 'PRO' : 'FREE'}
                </Badge>
                {import.meta.env.DEV && onProActiveChange && (
                  <div className="flex items-center rounded-md border p-1">
                    <Button
                      type="button"
                      size="sm"
                      variant={!isProActive ? 'secondary' : 'ghost'}
                      className="h-7 px-2 text-xs"
                      onClick={() => onProActiveChange(false)}
                    >
                      Free
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={isProActive ? 'secondary' : 'ghost'}
                      className="h-7 px-2 text-xs"
                      onClick={() => onProActiveChange(true)}
                    >
                      Pro
                    </Button>
                  </div>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setDialogOpen(false)}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                Editable fields:{' '}
                <span className="font-medium text-foreground">
                  {Math.min(freeCount, FREE_CUSTOM_FIELD_QUOTA)}
                </span>
                /{FREE_CUSTOM_FIELD_QUOTA}
              </div>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => {
                  if (!canCreate) {
                    toast('Upgrade to Pro to create more custom fields', {
                      description: `Free plan supports up to ${FREE_CUSTOM_FIELD_QUOTA} custom fields.`,
                    });
                    return;
                  }
                  setCreateOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Add Field
              </Button>
            </div>
          </div>

          <Separator />

          <ScrollArea className="flex-1">
            <div className="p-6 pt-4 space-y-3">
              {ordered.length === 0 && (
                <div className="text-sm text-muted-foreground py-8 text-center">
                  No custom fields yet.
                </div>
              )}

              {ordered.map((def) => {
                const typeLabel = FIELD_TYPES.find((t) => t.value === def.fieldType)?.label ?? def.fieldType;
                const locked = Boolean(def.planTierRequired && !isProActive);
                const canManageOptions = def.fieldType === 'SELECT' || def.fieldType === 'MULTI_SELECT';
                const isEditing = editingFieldId === def.fieldId;
                const FieldIcon = resolveTagIcon(def.icon);

                return (
                  <div key={def.fieldId} className="rounded-lg border bg-card p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={commitRename}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitRename();
                              if (e.key === 'Escape') {
                                setEditingFieldId(null);
                                setEditingName('');
                              }
                            }}
                            autoFocus
                            className="h-8"
                          />
                        ) : (
                          <button
                            type="button"
                            className="text-left w-full"
                            onDoubleClick={() => {
                              if (locked) {
                                toast('Read-only custom field', {
                                  description: 'This field requires an active Pro subscription to edit.',
                                });
                                return;
                              }
                              beginRename(def);
                            }}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {FieldIcon && (
                                <FieldIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                              )}
                              <div className="font-semibold truncate" title={def.displayName}>
                                {def.displayName}
                              </div>
                              {def.planTierRequired && (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'text-[10px] px-1 py-0.5',
                                    locked && 'border-amber-500/50',
                                  )}
                                >
                                  <Lock className="h-3 w-3 mr-1" />
                                  Pro
                                </Badge>
                              )}
                            </div>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Badge variant="secondary" className="text-xs">
                          {typeLabel}
                        </Badge>
                        <IconPicker
                          compact
                          value={def.icon}
                          disabled={locked}
                          onChange={(next) => {
                            onCustomFieldDefsChange(
                              customFieldDefs.map((d) => (d.fieldId === def.fieldId ? { ...d, icon: next } : d)),
                            );
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => moveField(def.fieldId, 'up')}
                          disabled={locked}
                          aria-label="Move up"
                          title={locked ? 'Read-only in Free plan' : 'Move up'}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => moveField(def.fieldId, 'down')}
                          disabled={locked}
                          aria-label="Move down"
                          title={locked ? 'Read-only in Free plan' : 'Move down'}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        {canManageOptions && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setOptionsOpenFor(def)}
                            disabled={locked}
                            aria-label="Manage options"
                            title={locked ? 'Read-only in Free plan' : 'Manage options'}
                          >
                            <Settings2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(def.fieldId)}
                          disabled={locked}
                          aria-label="Delete field"
                          title={locked ? 'Read-only in Free plan' : 'Delete field'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {def.description && (
                      <div className="text-xs text-muted-foreground mt-2">
                        {def.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create custom field</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Field type cannot be changed after creation.
                </DialogDescription>
              </DialogHeader>
              <CreateFieldForm
                isProActive={isProActive}
                freeCount={freeCount}
                onCancel={() => setCreateOpen(false)}
                onCreate={createField}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={optionsOpenFor != null} onOpenChange={(open) => setOptionsOpenFor(open ? optionsOpenFor : null)}>
            {optionsOpenFor && (
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Options · {optionsOpenFor.displayName}</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Rename, reorder, deactivate, and color options.
                  </DialogDescription>
                </DialogHeader>
                <OptionsEditor
                  field={optionsOpenFor}
                  locked={Boolean(optionsOpenFor.planTierRequired && !isProActive)}
                  onClose={() => setOptionsOpenFor(null)}
                  onOptionsChange={(next) => updateOptions(optionsOpenFor.fieldId, () => next)}
                />
              </DialogContent>
            )}
          </Dialog>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateFieldForm({
  isProActive,
  freeCount,
  onCancel,
  onCreate,
}: {
  isProActive: boolean;
  freeCount: number;
  onCancel: () => void;
  onCreate: (draft: { type: DeviceCustomFieldType; name: string; icon?: string; optionsText?: string }) => void;
}) {
  const [type, setType] = useState<DeviceCustomFieldType>('TEXT');
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string | undefined>(undefined);
  const [optionsText, setOptionsText] = useState('');

  const needsOptions = type === 'SELECT' || type === 'MULTI_SELECT';
  const willBeProLocked = freeCount >= FREE_CUSTOM_FIELD_QUOTA;

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <div className="text-sm font-medium">Type</div>
        <div className="grid grid-cols-2 gap-2">
          {FIELD_TYPES.map((t) => (
            <Button
              key={t.value}
              type="button"
              variant={type === t.value ? 'default' : 'outline'}
              size="sm"
              className="justify-start"
              onClick={() => setType(t.value)}
            >
              {t.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <div className="text-sm font-medium">Name</div>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pricing Tier" />
      </div>

      <div className="grid gap-2">
        <div className="text-sm font-medium">Header icon (optional)</div>
        <IconPicker value={icon} onChange={setIcon} />
      </div>

      {needsOptions && (
        <div className="grid gap-2">
          <div className="text-sm font-medium">Options (one per line)</div>
          <textarea
            value={optionsText}
            onChange={(e) => setOptionsText(e.target.value)}
            className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder={'Option A\nOption B\nOption C'}
          />
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">
          {isProActive ? (
            willBeProLocked ? (
              <span className="inline-flex items-center gap-1">
                <Lock className="h-3.5 w-3.5" />
                This field will become read-only when Pro expires.
              </span>
            ) : (
              `Counts towards the ${FREE_CUSTOM_FIELD_QUOTA} editable fields quota.`
            )
          ) : (
            `Free plan supports up to ${FREE_CUSTOM_FIELD_QUOTA} editable fields.`
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() =>
              onCreate({ type, name, icon, optionsText: needsOptions ? optionsText : undefined })
            }
          >
            Create
          </Button>
        </div>
      </div>
    </div>
  );
}

function OptionsEditor({
  field,
  locked,
  onClose,
  onOptionsChange,
}: {
  field: DeviceCustomFieldDef;
  locked?: boolean;
  onClose: () => void;
  onOptionsChange: (next: DeviceCustomFieldOption[]) => void;
}) {
  const [drafts, setDrafts] = useState<DeviceCustomFieldOption[]>(
    (field.options ?? []).slice().sort(sortBySequence)
  );
  const [newOptionName, setNewOptionName] = useState('');

  const addOption = () => {
    if (locked) return;
    const name = newOptionName.trim();
    if (!name) return;
    const base = slugifyHyphen(name) || `opt-${drafts.length + 1}`;
    let optionKey = base;
    let i = 2;
    while (drafts.some((o) => o.optionKey === optionKey)) optionKey = `${base}-${i++}`;
    const next: DeviceCustomFieldOption = {
      optionId: nextId(),
      optionKey,
      displayName: name,
      active: true,
      sequence: drafts.length + 1,
      color: TAG_COLOR_PRESETS[drafts.length % TAG_COLOR_PRESETS.length]?.key,
    };
    setDrafts((prev) => [...prev, next]);
    setNewOptionName('');
  };

  const move = (optionKey: string, dir: 'up' | 'down') => {
    const idx = drafts.findIndex((o) => o.optionKey === optionKey);
    if (idx < 0) return;
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= drafts.length) return;
    const next = drafts.slice();
    const tmp = next[idx]!;
    next[idx] = next[swap]!;
    next[swap] = tmp;
    setDrafts(next);
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <div className="flex items-center gap-2">
          <Input
            value={newOptionName}
            onChange={(e) => setNewOptionName(e.target.value)}
            placeholder="Add option…"
            disabled={locked}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addOption();
            }}
          />
          <Button type="button" onClick={addOption} className="gap-2" disabled={locked}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          Tip: Deactivate an option instead of deleting, to keep historical values readable.
        </div>
      </div>

      <ScrollArea className="h-[360px] rounded-md border">
        <div className="p-3 space-y-2">
          {drafts.length === 0 && (
            <div className="text-sm text-muted-foreground py-6 text-center">
              No options yet.
            </div>
          )}
          {drafts.map((o) => (
            <div key={o.optionKey} className="flex items-center gap-2 rounded-md border p-2">
              <div className="min-w-0 flex-1">
                <Input
                  value={o.displayName}
                  disabled={locked}
                  onChange={(e) => {
                    const name = e.target.value;
                    setDrafts((prev) =>
                      prev.map((x) => (x.optionKey === o.optionKey ? { ...x, displayName: name } : x))
                    );
                  }}
                  className="h-8"
                />
              </div>
              <div className="flex items-center gap-2">
                <OptionColorPicker
                  value={o.color}
                  disabled={locked}
                  onChange={(color) => {
                    setDrafts((prev) =>
                      prev.map((x) => (x.optionKey === o.optionKey ? { ...x, color } : x)),
                    );
                  }}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={o.active}
                    disabled={locked}
                    onChange={(e) => {
                      const active = e.target.checked;
                      setDrafts((prev) =>
                        prev.map((x) => (x.optionKey === o.optionKey ? { ...x, active } : x))
                      );
                    }}
                  />
                  Active
                </label>
                <div className="flex flex-col">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => move(o.optionKey, 'up')}
                    disabled={locked}
                    aria-label="Move up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => move(o.optionKey, 'down')}
                    disabled={locked}
                    aria-label="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Close
        </Button>
        <Button
          type="button"
          onClick={() => {
            onOptionsChange(drafts.map((o, i) => ({ ...o, sequence: i + 1 })));
            toast('Options updated');
            onClose();
          }}
          disabled={locked}
        >
          Save
        </Button>
      </div>
    </div>
  );
}

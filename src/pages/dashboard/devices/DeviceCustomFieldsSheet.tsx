import { useMemo, useState } from 'react';
import type { DeviceCustomFieldDef, DeviceCustomFieldOption, DeviceCustomFieldType } from '@/types/device-custom-field';
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
import { 
  Plus, 
  X, 
  GripVertical, 
  Type, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  Hash, 
  List, 
  Trash2,
  Save,
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Lock,
  Settings2,
  Link,
  Mail,
  Phone,
  Globe,
  ChevronDown,
  ChevronLeft
} from 'lucide-react';
import { toast } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

// Quotas per tier
const QUOTAS = {
  FREE: 3,
  PRO: 20,
  ULTRA: 100,
};

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
      className={cn('inline-flex h-3.5 w-3.5 rounded-full border', presetClassName ?? 'border-border bg-transparent')}
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
            className="h-8 w-8 rounded-lg hover:bg-muted"
            disabled={disabled}
            aria-label="Pick icon"
          >
            {Icon ? <Icon className="h-4 w-4" /> : <Plus className="h-4 w-4 opacity-40" />}
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full h-10 justify-between gap-3 bg-muted/20 border-border/50 rounded-lg hover:bg-muted/30 transition-all text-xs font-medium"
            disabled={disabled}
          >
            <div className="flex items-center gap-2 text-left min-w-0">
              <div className="p-1.5 rounded-md bg-background shadow-sm ring-1 ring-border/50 shrink-0">
                {Icon ? <Icon className="h-3.5 w-3.5 text-primary" /> : <Plus className="h-3.5 w-3.5 text-muted-foreground/40" />}
              </div>
              <span className={cn("truncate", !Icon && "text-muted-foreground/60")}>
                {Icon ? "Icon assigned" : "Select icon"}
              </span>
            </div>
            <ChevronDown className="h-3 w-3 opacity-40 shrink-0" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[340px] p-0 shadow-xl border-border rounded-xl overflow-hidden" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="flex flex-col">
          <div className="px-4 py-2.5 bg-muted/30 border-b flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground/70">Pick a header icon</span>
            {value && <button onClick={() => onChange(undefined)} className="text-[10px] text-destructive hover:underline font-semibold">Clear</button>}
          </div>
          <div className="p-3 grid grid-cols-6 gap-2">
            {TAG_ICON_OPTIONS.map(({ key, Icon: OptionIcon, label }) => (
              <Button
                key={key}
                type="button"
                variant={value === key ? 'default' : 'ghost'}
                size="icon"
                className={cn(
                  "h-10 w-10 rounded-lg transition-all",
                  value === key ? "shadow-md scale-110" : "hover:bg-primary/5 hover:text-primary"
                )}
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
  const { user } = useAuthStore();
  const currentQuota = useMemo(() => {
    const tier = (user?.subscriptionTier || 'FREE') as keyof typeof QUOTAS;
    return QUOTAS[tier] || QUOTAS.FREE;
  }, [user]);

  const ordered = useMemo(
    () => customFieldDefs.slice().sort(sortBySequence),
    [customFieldDefs]
  );

  const freeCount = ordered.filter((d) => !d.planTierRequired).length;
  const canCreate = ordered.length < currentQuota;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeView, setActiveView] = useState<'list' | 'create' | 'options'>('list');
  const [optionsFor, setOptionsFor] = useState<DeviceCustomFieldDef | null>(null);

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
      toast('Read-only custom field', { description: 'This field requires an active Pro subscription to edit.' });
      setEditingFieldId(null);
      setEditingName('');
      return;
    }
    const name = editingName.trim();
    if (!name) return;
    onCustomFieldDefsChange(customFieldDefs.map((d) => (d.fieldId === id ? { ...d, displayName: name } : d)));
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
    onCustomFieldDelete(fieldId);
    toast('Custom field deleted');
  };

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) {
          setActiveView('list');
          setOptionsFor(null);
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

      <DialogContent className="!w-[min(92vw,60rem)] !max-w-none p-0 overflow-hidden h-[80vh] max-h-[85vh] rounded-xl border shadow-2xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-4 border-b bg-card flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-4 min-w-0">
              {activeView !== 'list' && (
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full -ml-1" onClick={() => setActiveView('list')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <div className="space-y-0.5">
                <DialogTitle className="text-base font-bold tracking-tight">
                  {activeView === 'list' && "Custom Fields"}
                  {activeView === 'create' && "Create Field"}
                  {activeView === 'options' && "Manage Choices"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground truncate">
                  {activeView === 'list' && "Manage device metadata and grid columns"}
                  {activeView === 'create' && "Add a new data dimension to your devices"}
                  {activeView === 'options' && `Configuring options for ${optionsFor?.displayName}`}
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg border bg-muted/30 shrink-0">
               <div className="text-right leading-none">
                  <p className="text-[10px] font-bold text-muted-foreground tracking-tight mb-0.5">Usage</p>
                  <p className="text-xs font-mono font-bold text-foreground">{ordered.length}/{currentQuota}</p>
               </div>
               <div className="h-6 w-px bg-border" />
               <Badge variant={isProActive ? "default" : "secondary"} className={cn("h-5 px-1.5 text-[10px] font-bold uppercase tracking-tight", isProActive && "bg-primary text-primary-foreground")}>
                 {user?.subscriptionTier || 'FREE'}
               </Badge>
            </div>
          </div>

          {/* Body content switches based on activeView */}
          <div className="flex-1 overflow-hidden relative">
            {activeView === 'list' && (
              <div className="flex flex-col h-full">
                <div className="p-4 px-6 flex items-center justify-between bg-muted/5 border-b shrink-0">
                   <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                     {ordered.length} active columns
                   </div>
                   <Button size="sm" className="gap-2 rounded-lg font-bold text-xs h-8 px-4 shadow-sm" onClick={() => setActiveView('create')} disabled={!canCreate}>
                      <Plus className="h-3.5 w-3.5" />
                      Add Field
                   </Button>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-6 space-y-3">
                    {ordered.length === 0 && (
                      <div className="text-sm text-muted-foreground py-24 text-center flex flex-col items-center gap-4 opacity-30">
                        <Settings2 className="h-12 w-12" />
                        <p className="font-medium">Define your first custom field to start organizing device metadata.</p>
                      </div>
                    )}
                    {ordered.map((def) => {
                      const typeLabel = FIELD_TYPES.find((t) => t.value === def.fieldType)?.label ?? def.fieldType;
                      const locked = Boolean(def.planTierRequired && !isProActive);
                      const canManageOptions = def.fieldType === 'SELECT' || def.fieldType === 'MULTI_SELECT';
                      const isEditing = editingFieldId === def.fieldId;
                      const FieldIcon = resolveTagIcon(def.icon);

                      return (
                        <div key={def.fieldId} className="group rounded-xl border bg-card p-3 pr-4 hover:border-primary/20 hover:shadow-md transition-all">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                               {isEditing ? (
                                 <Input
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    onBlur={commitRename}
                                    onKeyDown={(e) => e.key === 'Enter' && commitRename()}
                                    autoFocus
                                    className="h-8 rounded-md"
                                 />
                               ) : (
                                 <div className="flex items-center gap-4">
                                    <div className="p-2.5 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                       {FieldIcon ? <FieldIcon className="h-4 w-4" /> : <Settings2 className="h-4 w-4" />}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                       <div className="flex items-center gap-2">
                                          <span className="font-bold text-sm truncate" onDoubleClick={() => !locked && beginRename(def)}>{def.displayName}</span>
                                          {def.planTierRequired && <Badge variant="outline" className="text-[9px] h-4 font-bold border-indigo-200 text-indigo-600 bg-indigo-50/50">PRO</Badge>}
                                       </div>
                                       <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-tighter">{typeLabel}</span>
                                    </div>
                                 </div>
                               )}
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               <IconPicker compact value={def.icon} disabled={locked} onChange={(next) => onCustomFieldDefsChange(customFieldDefs.map((d) => (d.fieldId === def.fieldId ? { ...d, icon: next } : d)))} />
                               <div className="w-px h-3 bg-border mx-2" />
                               <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => moveField(def.fieldId, 'up')} disabled={locked}><ArrowUp className="h-3.5 w-3.5" /></Button>
                               <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => moveField(def.fieldId, 'down')} disabled={locked}><ArrowDown className="h-3.5 w-3.5" /></Button>
                               {canManageOptions && (
                                 <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-primary hover:bg-primary/5" onClick={() => { setOptionsFor(def); setActiveView('options'); }} disabled={locked}><List className="h-4 w-4" /></Button>
                               )}
                               <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive" onClick={() => handleDelete(def.fieldId)} disabled={locked}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}

            {activeView === 'create' && (
              <CreateFieldForm
                isProActive={isProActive}
                freeCount={freeCount}
                onCancel={() => setActiveView('list')}
                onCreate={(draft) => {
                  onCustomFieldCreate({
                    fieldId: nextId(),
                    fieldKey: slugify(draft.name) || `field_${Date.now()}`,
                    fieldType: draft.type,
                    displayName: draft.name,
                    planTierRequired: ordered.length >= QUOTAS.FREE,
                    sequence: (Math.max(0, ...customFieldDefs.map((d) => d.sequence ?? 0)) + 1) || 1,
                    icon: draft.icon,
                    options: draft.options,
                  });
                  setActiveView('list');
                  toast('Custom field created');
                }}
              />
            )}

            {activeView === 'options' && optionsFor && (
               <OptionsEditor
                 field={optionsFor}
                 locked={Boolean(optionsFor.planTierRequired && !isProActive)}
                 onClose={() => setActiveView('list')}
                 onOptionsChange={(next) => {
                   onCustomFieldDefsChange(customFieldDefs.map(d => d.fieldId === optionsFor.fieldId ? { ...d, options: next } : d));
                   setActiveView('list');
                 }}
               />
            )}
          </div>
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
  onCreate: (draft: { type: DeviceCustomFieldType; name: string; icon?: string; options?: DeviceCustomFieldOption[] }) => void;
}) {
  const [type, setType] = useState<DeviceCustomFieldType>('TEXT');
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string | undefined>(undefined);
  
  const [options, setOptions] = useState<DeviceCustomFieldOption[]>([]);
  const [newOptionName, setNewOptionName] = useState('');

  const needsOptions = type === 'SELECT' || type === 'MULTI_SELECT';

  const typeIcons: Record<DeviceCustomFieldType, any> = {
    TEXT: Type,
    NUMBER: Hash,
    DATETIME: CalendarIcon,
    BOOLEAN: CheckSquare,
    SELECT: List,
    MULTI_SELECT: List,
    URL: Link,
    EMAIL: Mail,
    PHONE: Phone,
    COUNTRY: Globe,
  };

  const addOption = () => {
    const val = newOptionName.trim();
    if (!val) return;
    if (options.some(o => o.displayName.toLowerCase() === val.toLowerCase())) {
      toast('Option already exists');
      return;
    }
    const next: DeviceCustomFieldOption = {
      optionId: nextId(),
      optionKey: slugifyHyphen(val) || `opt-${options.length + 1}`,
      displayName: val,
      active: true,
      sequence: options.length + 1,
      color: TAG_COLOR_PRESETS[options.length % TAG_COLOR_PRESETS.length]?.key,
    };
    setOptions([...options, next]);
    setNewOptionName('');
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="p-8 space-y-10 max-w-4xl mx-auto">
          {/* Step 1 */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">1. Choose format</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {FIELD_TYPES.map((t) => {
                const Icon = typeIcons[t.value] || Type;
                const isSelected = type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={cn(
                      "flex flex-col items-center gap-3 p-4 rounded-xl border transition-all duration-200",
                      isSelected 
                        ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm" 
                        : "border-border bg-card hover:border-muted-foreground/40 hover:bg-muted/30"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-lg transition-colors",
                      isSelected ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className={cn("text-[11px] font-bold", isSelected ? "text-primary" : "text-foreground/70")}>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            {/* Step 2 */}
            <section className="space-y-6">
               <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">2. Identity</h3>
               <div className="space-y-5">
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-foreground/80 px-1">Display name</p>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Asset category" className="h-11 rounded-xl shadow-sm border-muted-foreground/20" />
                  </div>
                  <div className="space-y-2">
                     <p className="text-[11px] font-bold text-foreground/80 px-1">Column icon</p>
                     <IconPicker value={icon} onChange={setIcon} />
                  </div>
               </div>
            </section>

            {/* Step 3 */}
            {needsOptions && (
              <section className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">3. Choices</h3>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={newOptionName}
                      onChange={(e) => setNewOptionName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                      placeholder="Type and hit Enter..."
                      className="h-11 rounded-xl"
                    />
                    <Button type="button" onClick={addOption} className="h-11 px-5 font-bold shadow-md">Add</Button>
                  </div>
                  <div className="rounded-2xl border bg-muted/10 overflow-hidden shadow-inner">
                    <ScrollArea className="h-[240px]">
                      <div className="p-1.5 space-y-1">
                        {options.length === 0 ? (
                          <div className="py-20 text-center text-xs text-muted-foreground italic opacity-50">No choices added yet</div>
                        ) : (
                          options.map((opt, idx) => (
                            <div key={opt.optionId} className="flex items-center justify-between gap-3 p-2.5 px-4 rounded-xl bg-background border shadow-sm group">
                              <div className="flex items-center gap-3 min-w-0">
                                <ColorDot color={opt.color} />
                                <span className="text-sm font-bold truncate">{opt.displayName}</span>
                              </div>
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100" onClick={() => setOptions(options.filter((_, i) => i !== idx))}><X className="h-4 w-4" /></Button>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </ScrollArea>

      <footer className="px-8 py-5 border-t bg-muted/5 flex items-center justify-end gap-3 shrink-0">
        <Button variant="ghost" onClick={onCancel} className="h-11 px-6 font-bold text-xs uppercase tracking-widest text-muted-foreground">Discard</Button>
        <Button
          onClick={() => onCreate({ type, name, icon, options: needsOptions ? options : undefined })}
          disabled={!name.trim() || (needsOptions && options.length === 0)}
          className="h-11 px-10 font-bold text-xs uppercase tracking-widest shadow-xl shadow-primary/20"
        >
          Create field
        </Button>
      </footer>
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
  const [drafts, setDrafts] = useState<DeviceCustomFieldOption[]>( (field.options ?? []).slice().sort(sortBySequence) );
  const [newOptionName, setNewOptionName] = useState('');

  const addOption = () => {
    if (locked) return;
    const name = newOptionName.trim();
    if (!name || drafts.some(o => o.displayName.toLowerCase() === name.toLowerCase())) return;
    const next: DeviceCustomFieldOption = {
      optionId: nextId(),
      optionKey: slugifyHyphen(name) || `opt-${drafts.length + 1}`,
      displayName: name,
      active: true,
      sequence: drafts.length + 1,
      color: TAG_COLOR_PRESETS[drafts.length % TAG_COLOR_PRESETS.length]?.key,
    };
    setDrafts([...drafts, next]);
    setNewOptionName('');
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="p-8 space-y-8 max-w-2xl mx-auto">
          <div className="space-y-4 p-6 rounded-2xl border bg-muted/20 shadow-inner">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Add new choice</h4>
            <div className="flex gap-2">
              <Input value={newOptionName} onChange={(e) => setNewOptionName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addOption()} placeholder="e.g. Standard" className="h-12 bg-background rounded-xl font-bold" />
              <Button onClick={addOption} className="h-12 px-6 font-bold shadow-lg" disabled={locked}>Add</Button>
            </div>
          </div>

          <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
            <div className="p-2 space-y-1">
              {drafts.length === 0 ? (
                <div className="py-24 text-center text-xs text-muted-foreground opacity-40 italic">No options defined</div>
              ) : (
                drafts.map((o, idx) => (
                  <div key={o.optionKey} className="group flex items-center gap-4 p-3 px-4 rounded-xl hover:bg-muted/30 transition-all border border-transparent hover:border-border">
                    <div className="flex flex-col gap-0.5">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                        const next = [...drafts];
                        if (idx > 0) { [next[idx], next[idx-1]] = [next[idx-1], next[idx]]; setDrafts(next); }
                      }} disabled={locked}><ArrowUp className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                        const next = [...drafts];
                        if (idx < next.length - 1) { [next[idx], next[idx+1]] = [next[idx+1], next[idx]]; setDrafts(next); }
                      }} disabled={locked}><ArrowDown className="h-3 w-3" /></Button>
                    </div>
                    <Input value={o.displayName} disabled={locked} onChange={(e) => setDrafts(drafts.map((x, i) => i === idx ? { ...x, displayName: e.target.value } : x))} className="flex-1 h-10 bg-transparent border-transparent focus-visible:bg-background focus-visible:border-border font-bold text-sm rounded-lg" />
                    <OptionColorPicker value={o.color} disabled={locked} onChange={(color) => setDrafts(drafts.map((x, i) => i === idx ? { ...x, color } : x))} />
                    <button type="button" className={cn("px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all", o.active ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-muted text-muted-foreground grayscale")} onClick={() => !locked && setDrafts(drafts.map((x, i) => i === idx ? { ...x, active: !x.active } : x))}>{o.active ? "Active" : "Hidden"}</button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100" onClick={() => setDrafts(drafts.filter((_, i) => i !== idx))} disabled={locked}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </ScrollArea>

      <footer className="px-8 py-5 border-t bg-muted/5 flex items-center justify-between shrink-0">
        <p className="text-xs font-bold text-muted-foreground italic">{drafts.length} options configured</p>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} className="h-11 px-6 font-bold text-xs uppercase tracking-widest text-muted-foreground">Cancel</Button>
          <Button className="h-11 px-10 font-bold text-xs uppercase tracking-widest shadow-xl shadow-primary/20" onClick={() => { onOptionsChange(drafts.map((o, i) => ({ ...o, sequence: i + 1 }))); toast('Options updated'); onClose(); }} disabled={locked}>Save changes</Button>
        </div>
      </footer>
    </div>
  );
}

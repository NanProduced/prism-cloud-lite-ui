import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import type {
  FilterDate,
  FilterDateOperator,
  FilterFunc,
  FilterModelItem,
  FilterNumber,
  FilterNumberOperator,
  FilterString,
  FilterStringOperator,
  HeaderFloatingCellRendererParams,
  EditRendererFnParams,
} from '@1771technologies/lytenyte-core/types';
import type { Device } from '@/types/device';
import type { DeviceCustomFieldDef, DeviceCustomFieldOption } from '@/types/device-custom-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CountryPicker } from '@/components/ui/country-picker';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Calendar, Check, ChevronDown, Filter, X } from 'lucide-react';
import { COUNTRIES, countryLabel } from '@/lib/countries';

function optionSort(a: DeviceCustomFieldOption, b: DeviceCustomFieldOption): number {
  return (a.sequence ?? 0) - (b.sequence ?? 0);
}

function optionLabel(options: DeviceCustomFieldOption[] | undefined, optionKey: string): string {
  const hit = options?.find((o) => o.optionKey === optionKey);
  return hit?.displayName ?? optionKey;
}

function parsePrefixed(text: string): { prefix?: string; value: string } {
  const match = text.match(/^(>=|<=|!=|>|<)\s*(.+)$/);
  if (!match) return { value: text };
  return { prefix: match[1], value: match[2].trim() };
}

function prefixToStringOperator(prefix?: string): FilterStringOperator {
  if (prefix === '!=') return 'not_equals';
  return 'contains';
}

function prefixToNumberOperator(prefix?: string): FilterNumberOperator {
  switch (prefix) {
    case '>=': return 'greater_than_or_equals';
    case '<=': return 'less_than_or_equals';
    case '>': return 'greater_than';
    case '<': return 'less_than';
    case '!=': return 'not_equals';
    default: return 'equals';
  }
}

function prefixToDateOperator(prefix?: string): FilterDateOperator {
  switch (prefix) {
    case '>=': return 'after_or_equals';
    case '<=': return 'before_or_equals';
    case '>': return 'after';
    case '<': return 'before';
    case '!=': return 'not_equals';
    default: return 'equals';
  }
}

function filterItemToText(filter?: FilterModelItem<Device>): string {
  if (!filter) return '';
  if (filter.kind === 'func') {
    const f = filter as any;
    if (f.prismSelected) return f.prismSelected.join(', ');
    if (f.prismDate) {
      const { start, end } = f.prismDate;
      if (start && end) return `${start} ~ ${end}`;
      return start ? `Since ${start}` : end ? `Before ${end}` : 'Date Filter';
    }
    return 'Active Filter';
  }
  if (filter.kind === 'string') return String(filter.value ?? '');
  if (filter.kind === 'number') {
    const f = filter as FilterNumber;
    const opMap: any = { equals: '=', not_equals: '!=', greater_than: '>', less_than: '<', greater_than_or_equals: '>=', less_than_or_equals: '<=' };
    return `${opMap[f.operator] || ''}${f.value}`;
  }
  if (filter.kind === 'date') return filter.value == null ? '' : String(filter.value);
  return '';
}

function OperatorSelect<T extends string>({
  value,
  options,
  onValueChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onValueChange: (value: T) => void;
}) {
  const active = options.find((o) => o.value === value)?.label ?? value;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 w-full justify-between bg-muted/20 border-muted/50 text-xs font-normal px-2">
          <span className="truncate">{active}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 rounded-xl">
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onValueChange(v as T)}>
          {options.map((o) => (
            <DropdownMenuRadioItem key={o.value} value={o.value} className="text-xs">
              {o.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DeviceCustomFieldFloatingFilterCell({
  grid,
  column,
  fieldDef,
}: HeaderFloatingCellRendererParams<Device> & { fieldDef: DeviceCustomFieldDef }) {
  const filterModel = grid.state.filterModel.useValue();
  const current = filterModel[column.id] as (FilterModelItem<Device> & Record<string, any>) | undefined;

  const fieldType = fieldDef.fieldType;
  const isEnum = ['SELECT', 'MULTI_SELECT', 'BOOLEAN', 'COUNTRY'].includes(fieldType);
  const isNumber = fieldType === 'NUMBER';
  const isDateTime = fieldType === 'DATETIME';

  const value = filterItemToText(current);

  const clearFilter = () => {
    grid.state.filterModel.set((prev) => {
      const updated = { ...prev };
      delete updated[column.id];
      return updated;
    });
  };

  const handleTextChange = (raw: string) => {
    const text = raw.trim();
    grid.state.filterModel.set((prev) => {
      const next = { ...prev };
      if (!text) {
        delete next[column.id];
      } else {
        const parsed = parsePrefixed(text);
        if (fieldType === 'NUMBER') {
          const num = Number(parsed.value);
          if (!Number.isNaN(num)) {
            next[column.id] = { kind: 'number', operator: prefixToNumberOperator(parsed.prefix), value: num } as any;
          }
        } else if (fieldType === 'DATETIME') {
          next[column.id] = { kind: 'date', operator: prefixToDateOperator(parsed.prefix), value: parsed.value } as any;
        } else {
          next[column.id] = { kind: 'string', operator: prefixToStringOperator(parsed.prefix), value: parsed.value } as any;
        }
      }
      return next;
    });
  };

  // Hide text input for enum types, numbers, and datetime (use popover filter instead)
  const hideInput = isEnum || isNumber || isDateTime;

  return (
    <div className="flex items-center w-full h-full gap-1 px-1 transition-colors duration-200">
      <div className="relative flex-1 min-w-0">
        {!hideInput ? (
          <Input
            value={value}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Search…"
            className={cn(
              "h-7 text-[11px] px-2 pr-6 flex-1 bg-background/50 border-transparent hover:border-muted-foreground/30 focus-visible:ring-1",
              current && "border-primary/40 bg-background shadow-inner"
            )}
          />
        ) : (
          <div
            className={cn(
              "h-7 flex items-center px-2 text-[10px] font-medium truncate cursor-default rounded-md border border-transparent",
              current && "bg-primary/10 text-primary border-primary/20"
            )}
          >
            {current ? (
              <span className="truncate">{value}</span>
            ) : null}
          </div>
        )}
        
        {current && (
          <button 
            onClick={(e) => { e.stopPropagation(); clearFilter(); }}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        )}
      </div>

      <CustomFieldFilterPopover
        grid={grid}
        column={column}
        fieldDef={fieldDef}
        current={current}
        onApply={(next) => {
          grid.state.filterModel.set((prev) => {
            const updated = { ...prev };
            if (!next) delete updated[column.id];
            else updated[column.id] = next;
            return updated;
          });
        }}
        onClear={clearFilter}
      />
    </div>
  );
}

function CustomFieldFilterPopover({
  grid,
  column,
  fieldDef,
  current,
  onApply,
  onClear,
}: {
  grid: any;
  column: any;
  fieldDef: DeviceCustomFieldDef;
  current?: FilterModelItem<Device> & Record<string, any>;
  onApply: (next?: FilterModelItem<Device>) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const type = fieldDef.fieldType;

  // Enum Options
  const options = useMemo(() => {
    if (type === 'BOOLEAN') return [{ value: 'true', label: 'True' }, { value: 'false', label: 'False' }];
    if (type === 'COUNTRY') return COUNTRIES.map(c => ({ value: c.code, label: countryLabel(c.code) }));
    if (type === 'SELECT' || type === 'MULTI_SELECT') {
      return (fieldDef.options ?? []).slice().sort(optionSort).map(o => ({ value: o.optionKey, label: o.displayName }));
    }
    return null;
  }, [fieldDef.options, type]);

  const [enumSelected, setEnumSelected] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Default values
  const [operator, setOperator] = useState('contains');
  const [value, setValue] = useState('');
  const filterDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const isDateTime = type === 'DATETIME';
  const isBoolean = type === 'BOOLEAN';
  const isNumber = type === 'NUMBER';

  // Initialization ref to break loops
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (open) {
      setEnumSelected(new Set(current?.prismSelected || []));
      setDateRange(current?.prismDate || { start: '', end: '' });
      setOperator(current?.operator || (type === 'NUMBER' ? 'equals' : 'contains'));
      setValue(current?.value != null ? String(current.value) : '');
      hasInitialized.current = true;
    } else {
      hasInitialized.current = false;
    }
  }, [open, type]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current);
    };
  }, []);

  // Debounced text filter application for performance
  const debouncedTextFilter = useCallback((v: string, op: string) => {
    if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current);
    filterDebounceRef.current = setTimeout(() => {
      const trimmed = v.trim();
      if (!trimmed) {
        onApply(undefined);
      } else if (isNumber) {
        const num = Number(trimmed);
        if (!Number.isNaN(num)) {
          onApply({ kind: 'number', operator: op as any, value: num } as any);
        }
      } else {
        onApply({ kind: 'string', operator: op, value: trimmed } as any);
      }
    }, 150);
  }, [onApply, isNumber]);

  const apply = () => {
    if (!hasInitialized.current) return;
    if (options) {
      const selected = Array.from(enumSelected);
      if (selected.length === 0) onApply(undefined);
      else {
        onApply({
          kind: 'func', prismSelected: selected,
          func: ({ data }: any) => {
            const raw = data.customFieldValues?.[fieldDef.fieldKey];
            if (type === 'MULTI_SELECT') {
              const arr = Array.isArray(raw) ? raw : [];
              return selected.some(s => arr.includes(s));
            }
            if (type === 'BOOLEAN') {
              const v = raw === true ? 'true' : raw === false ? 'false' : '';
              return selected.includes(v);
            }
            return typeof raw === 'string' && selected.includes(raw);
          }
        } as any);
      }
    } else {
      const trimmed = value.trim();
      if (!trimmed) onApply(undefined);
      else {
        if (type === 'NUMBER') {
          const num = Number(trimmed);
          if (!Number.isNaN(num)) {
            onApply({ kind: 'number', operator: operator as any, value: num } as any);
          }
        } else if (type === 'DATETIME') {
          onApply({ kind: 'date', operator, value: trimmed } as any);
        } else {
          onApply({ kind: 'string', operator, value: trimmed } as any);
        }
      }
    }
    setOpen(false);
  };

  const handleLiveChange = (updates: any) => {
    if (!hasInitialized.current) return;
    if (updates.enum) {
      const selected = Array.from(updates.enum);
      if (selected.length === 0) onApply(undefined);
      else {
        onApply({
          kind: 'func', prismSelected: selected,
          func: ({ data }: any) => {
            const raw = data.customFieldValues?.[fieldDef.fieldKey];
            if (type === 'MULTI_SELECT') return Array.isArray(raw) && selected.some(s => raw.includes(s));
            if (type === 'BOOLEAN') return selected.includes(raw === true ? 'true' : raw === false ? 'false' : '');
            return typeof raw === 'string' && selected.includes(raw);
          }
        } as any);
      }
    } else if (updates.date) {
      const { start, end } = updates.date;
      if (!start && !end) onApply(undefined);
      else {
        onApply({
          kind: 'func', prismDate: updates.date,
          func: ({ data }: any) => {
            const raw = data.customFieldValues?.[fieldDef.fieldKey];
            if (!raw || typeof raw !== 'string') return false;
            const t = new Date(raw).getTime();
            if (Number.isNaN(t)) return false;
            if (start && t < new Date(start).getTime()) return false;
            if (end && t > (new Date(end).getTime() + 86400000 - 1)) return false;
            return true;
          }
        } as any);
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={current ? "secondary" : "ghost"}
          size="icon"
          className={cn("h-7 w-7 transition-colors", current && "text-primary bg-primary/10")}
          onClick={(e) => e.stopPropagation()}
        >
          <Filter className={cn("h-3.5 w-3.5", current && "fill-current")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-4 shadow-xl border-muted/50 rounded-xl" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="grid gap-4">
          <header className="flex items-center justify-between border-b pb-2">
             <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                   <Filter className="h-3.5 w-3.5 text-primary" />
                </div>
                <h4 className="font-semibold text-sm">{fieldDef.displayName}</h4>
             </div>
             {current && <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive" onClick={() => { onClear(); setOpen(false); }}>Reset</Button>}
          </header>

          {isBoolean && (
            <div className="grid gap-1 py-1">
              {[
                { value: '', label: 'Any', description: 'Show all values' },
                { value: 'true', label: 'True', description: 'Only true values' },
                { value: 'false', label: 'False', description: 'Only false values' },
              ].map((opt) => {
                const selected = enumSelected.size === 0 ? opt.value === '' :
                                 enumSelected.size === 1 && enumSelected.has(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={cn(
                      "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all hover:bg-muted/50",
                      selected && "bg-primary/10 border border-primary/30"
                    )}
                    onClick={() => {
                      if (opt.value === '') {
                        setEnumSelected(new Set());
                        handleLiveChange({ enum: new Set() });
                      } else {
                        const n = new Set([opt.value]);
                        setEnumSelected(n);
                        handleLiveChange({ enum: n });
                      }
                    }}
                  >
                    <div className={cn(
                      "h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors",
                      selected ? "border-primary bg-primary" : "border-muted-foreground/30"
                    )}>
                      {selected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                    <div className="flex-1">
                      <div className={cn("text-sm font-medium", selected && "text-primary")}>{opt.label}</div>
                      <div className="text-[10px] text-muted-foreground">{opt.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {options && !isBoolean && (
            <div className="grid gap-2">
              <ScrollArea className="h-48 rounded-lg border bg-muted/20">
                <div className="p-1.5 grid gap-1">
                  {options.map((opt) => {
                    const checked = enumSelected.has(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        className={cn(
                          "w-full flex items-center justify-between rounded-md px-2.5 py-2 text-sm transition-all hover:bg-background",
                          checked ? "bg-background shadow-sm border" : "border-transparent"
                        )}
                        onClick={() => {
                          const n = new Set(enumSelected);
                          if (n.has(opt.value)) n.delete(opt.value); else n.add(opt.value);
                          setEnumSelected(n); handleLiveChange({ enum: n });
                        }}
                      >
                        <span className={cn(checked ? "font-semibold" : "text-muted-foreground")}>
                          {opt.label}
                        </span>
                        {checked && <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
              <div className="flex justify-between items-center px-1">
                 <Button variant="link" className="h-auto p-0 text-[10px]" onClick={() => { const a = new Set(options.map(o => o.value)); setEnumSelected(a); handleLiveChange({ enum: a }); }}>Select All</Button>
                 <Button variant="link" className="h-auto p-0 text-[10px]" onClick={() => { setEnumSelected(new Set()); handleLiveChange({ enum: new Set() }); }}>Clear All</Button>
              </div>
            </div>
          )}

          {isDateTime && (
            <div className="space-y-4 py-1">
              {(['start', 'end'] as const).map((key) => (
                <div key={key} className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                      {key === 'start' ? 'Start Date' : 'End Date'}
                    </label>
                  </div>
                  <Input
                    type="date"
                    value={dateRange[key]}
                    onChange={(e) => {
                      const next = { ...dateRange, [key]: e.target.value };
                      setDateRange(next);
                      handleLiveChange({ date: next });
                    }}
                    className="h-9 text-sm"
                  />
                </div>
              ))}
              {(dateRange.start || dateRange.end) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-8 text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    const empty = { start: '', end: '' };
                    setDateRange(empty);
                    handleLiveChange({ date: empty });
                  }}
                >
                  Clear Dates
                </Button>
              )}
            </div>
          )}

          {!options && !isDateTime && (
            <div className="grid gap-3">
              <OperatorSelect
                value={operator}
                onValueChange={(v: any) => { setOperator(v); if(value) apply(); }}
                options={type === 'NUMBER' ? [
                  { value: 'equals', label: 'Equals' },
                  { value: 'not_equals', label: 'Not equals' },
                  { value: 'greater_than', label: 'Greater than' },
                  { value: 'less_than', label: 'Less than' },
                  { value: 'greater_than_or_equals', label: 'Greater or equal' },
                  { value: 'less_than_or_equals', label: 'Less or equal' },
                ] : [
                  { value: 'contains', label: 'Contains' },
                  { value: 'equals', label: 'Equals' },
                  { value: 'begins_with', label: 'Begins with' },
                ]}
              />
              <Input
                type={type === 'NUMBER' ? 'number' : 'text'}
                value={value}
                onChange={(e) => {
                  const v = e.target.value;
                  setValue(v);
                  debouncedTextFilter(v, operator);
                }}
                placeholder={type === 'NUMBER' ? "Enter number..." : "Search value..."}
                className="h-9 text-sm"
                autoFocus
              />
            </div>
          )}

          <footer className="flex items-center justify-end gap-2 pt-2 border-t mt-2">
            <Button variant="outline" size="sm" className="h-8 rounded-lg font-bold" onClick={() => setOpen(false)}>Done</Button>
          </footer>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function toDatetimeLocalValue(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function DeviceCustomFieldEditRenderer({
  grid,
  row,
  value: cellValue,
  onChange,
  fieldDef,
}: EditRendererFnParams<Device> & { fieldDef: DeviceCustomFieldDef }) {
  const [multiOpen, setMultiOpen] = useState(true);
  const gridViewport = grid.state.viewport.useValue();

  const type = fieldDef.fieldType;
  const options = useMemo(() => (fieldDef.options ?? []).slice().sort(optionSort), [fieldDef.options]);
  const initialMultiSelected = useMemo(() => {
    if (row.kind !== 'leaf' || !row.data) return [];
    const raw = row.data.customFieldValues?.[fieldDef.fieldKey];
    return Array.isArray(raw) ? raw : [];
  }, [fieldDef.fieldKey, row]);
  const [multiSelected, setMultiSelected] = useState<string[]>(initialMultiSelected);

  if (type === 'BOOLEAN') {
    const value =
      cellValue === 'true' || cellValue === true ? 'true' :
      cellValue === 'false' || cellValue === false ? 'false' :
      '';
    return (
      <select
        className="h-8 w-full rounded-md border bg-background px-2 text-sm"
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          if (v === '') onChange(null);
          else onChange(v === 'true');
        }}
      >
        <option value="">—</option>
        <option value="true">True</option>
        <option value="false">False</option>
      </select>
    );
  }

  if (type === 'SELECT') {
    const value = typeof cellValue === 'string' ? cellValue : '';
    return (
      <select
        className="h-8 w-full rounded-md border bg-background px-2 text-sm"
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v ? v : null);
          grid.api.editEnd();
        }}
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.optionKey} value={o.optionKey} disabled={o.active === false}>
            {o.displayName}
          </option>
        ))}
      </select>
    );
  }

  if (type === 'COUNTRY') {
    const value = typeof cellValue === 'string' ? cellValue : '';
    return (
      <CountryPicker
        value={value || null}
        gridViewport={gridViewport}
        onValueChange={(next) => {
          onChange(next);
          grid.api.editEnd();
        }}
      />
    );
  }

  if (type === 'MULTI_SELECT') {
    return (
      <Popover open={multiOpen} onOpenChange={setMultiOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-full justify-between px-2 text-sm font-normal"
          >
            <span className="truncate">
              {multiSelected.length === 0
                ? '—'
                : multiSelected.length === 1
                ? optionLabel(options, multiSelected[0]!)
                : `${multiSelected.length} selected`}
            </span>
            <ChevronDown className="h-4 w-4 opacity-70" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-3" onOpenAutoFocus={(e) => e.preventDefault()}>
          <div className="grid gap-3">
            <div className="text-xs font-semibold text-muted-foreground">{fieldDef.displayName}</div>
            <ScrollArea className="h-44 rounded border">
              <div className="p-2 grid gap-2">
                {options.map((o) => {
                  const checked = multiSelected.includes(o.optionKey);
                  return (
                    <label
                      key={o.optionKey}
                      className={cn(
                        'flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent cursor-pointer',
                        o.active === false && 'opacity-60 cursor-not-allowed hover:bg-transparent',
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        disabled={o.active === false}
                        onCheckedChange={() => {
                          if (o.active === false) return;
                          const next = checked
                            ? multiSelected.filter((k) => k !== o.optionKey)
                            : [...multiSelected, o.optionKey];
                          setMultiSelected(next);
                          onChange(next);
                        }}
                      />
                      <span className="truncate">{o.displayName}</span>
                      {o.active === false && (
                        <Badge variant="outline" className="ml-auto text-xs">
                          Inactive
                        </Badge>
                      )}
                    </label>
                  );
                })}
              </div>
            </ScrollArea>
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMultiSelected([]);
                  onChange([]);
                }}
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setMultiOpen(false);
                  grid.api.editEnd();
                }}
              >
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  if (type === 'NUMBER') {
    const valueText =
      typeof cellValue === 'number'
        ? String(cellValue)
        : typeof cellValue === 'string'
        ? cellValue
        : '';
    return (
      <Input
        type="number"
        step="any"
        value={valueText}
        onChange={(e) => {
          const v = e.target.value;
          if (!v) onChange(null);
          else {
            const num = Number(v);
            onChange(Number.isNaN(num) ? null : num);
          }
        }}
        className="h-8"
      />
    );
  }

  if (type === 'DATETIME') {
    const valueText = typeof cellValue === 'string' ? toDatetimeLocalValue(cellValue) : '';
    return (
      <Input
        type="datetime-local"
        value={valueText}
        onChange={(e) => {
          const v = e.target.value;
          if (!v) onChange(null);
          else {
            const d = new Date(v);
            onChange(Number.isNaN(d.getTime()) ? null : d.toISOString());
          }
        }}
        className="h-8"
      />
    );
  }

  const valueText = typeof cellValue === 'string' ? cellValue : '';
  return (
    <Input
      value={valueText}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v.trim() ? v : null);
      }}
      className="h-8"
    />
  );
}
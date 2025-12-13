import { useEffect, useMemo, useState } from 'react';
import type {
  FilterCombination,
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
import { cn } from '@/lib/utils';
import { Check, ChevronDown } from 'lucide-react';

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
    case '>=':
      return 'greater_than_or_equals';
    case '<=':
      return 'less_than_or_equals';
    case '>':
      return 'greater_than';
    case '<':
      return 'less_than';
    case '!=':
      return 'not_equals';
    default:
      return 'equals';
  }
}

function prefixToDateOperator(prefix?: string): FilterDateOperator {
  switch (prefix) {
    case '>=':
      return 'after_or_equals';
    case '<=':
      return 'before_or_equals';
    case '>':
      return 'after';
    case '<':
      return 'before';
    case '!=':
      return 'not_equals';
    default:
      return 'equals';
  }
}

function filterItemToText(filter?: FilterModelItem<Device>): string {
  if (!filter) return '';
  if (filter.kind === 'string') return String(filter.value ?? '');
  if (filter.kind === 'number') return filter.value == null ? '' : String(filter.value);
  if (filter.kind === 'date') return filter.value == null ? '' : String(filter.value);
  if (filter.kind === 'combination') return '';
  if (filter.kind === 'func') return '';
  return '';
}

function extractEnumValues(filter: FilterCombination): string[] {
  if (filter.operator !== 'OR') return [];
  return filter.filters
    .filter((f) => f.kind === 'string' && f.operator === 'equals')
    .map((f) => (f as FilterString).value)
    .filter((v): v is string => typeof v === 'string' && v.length > 0);
}

type EnumOption = { value: string; label: string; disabled?: boolean };

function EnumFilterPopover({
  open,
  onOpenChange,
  title,
  options,
  selected,
  onSelectedChange,
  onApply,
  onClear,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  options: EnumOption[];
  selected: Set<string>;
  onSelectedChange: (next: Set<string>) => void;
  onApply: () => void;
  onClear: () => void;
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 w-full justify-between px-2 text-xs font-normal">
          <span className="truncate">
            {selected.size === 0 || selected.size === options.length
              ? 'Any'
              : selected.size === 1
              ? options.find((o) => selected.has(o.value))?.label ?? '1 selected'
              : `${selected.size} selected`}
          </span>
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-3" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="grid gap-3">
          <div className="text-xs font-semibold text-muted-foreground">{title}</div>

          <ScrollArea className="h-44 rounded border">
            <div className="p-2 grid gap-2">
              {options.map((o) => {
                const checked = selected.has(o.value);
                return (
                  <button
                    key={o.value}
                    type="button"
                    className={cn(
                      'w-full flex items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-accent',
                      o.disabled && 'opacity-60 cursor-not-allowed hover:bg-transparent',
                    )}
                    disabled={o.disabled}
                    onClick={() => {
                      onSelectedChange((() => {
                        const next = new Set(selected);
                        if (next.has(o.value)) next.delete(o.value);
                        else next.add(o.value);
                        return next;
                      })());
                    }}
                  >
                    <span className="truncate">{o.label}</span>
                    {checked && <Check className="h-4 w-4 text-emerald-600" />}
                  </button>
                );
              })}
            </div>
          </ScrollArea>

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onClear}>
              Clear
            </Button>
            <Button size="sm" onClick={onApply}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const COUNTRY_OPTIONS: EnumOption[] = [
  { value: 'US', label: 'US' },
  { value: 'CN', label: 'CN' },
  { value: 'JP', label: 'JP' },
  { value: 'DE', label: 'DE' },
  { value: 'GB', label: 'GB' },
  { value: 'SG', label: 'SG' },
  { value: 'AU', label: 'AU' },
];

export function DeviceCustomFieldFloatingFilterCell({
  grid,
  column,
  fieldDef,
}: HeaderFloatingCellRendererParams<Device> & { fieldDef: DeviceCustomFieldDef }) {
  const filterModel = grid.state.filterModel.useValue();
  const current = filterModel[column.id] as (FilterModelItem<Device> & Record<string, unknown>) | undefined;

  const fieldType = fieldDef.fieldType;
  const isEnum =
    fieldType === 'SELECT' ||
    fieldType === 'MULTI_SELECT' ||
    fieldType === 'BOOLEAN' ||
    fieldType === 'COUNTRY';

  const options: EnumOption[] = useMemo(() => {
    if (fieldType === 'BOOLEAN') {
      return [
        { value: 'true', label: 'True' },
        { value: 'false', label: 'False' },
      ];
    }
    if (fieldType === 'COUNTRY') return COUNTRY_OPTIONS;
    if (fieldType === 'SELECT' || fieldType === 'MULTI_SELECT') {
      const list = (fieldDef.options ?? []).slice().sort(optionSort);
      return list.map((o) => ({
        value: o.optionKey,
        label: o.displayName,
        disabled: o.active === false,
      }));
    }
    return [];
  }, [fieldDef.options, fieldType]);

  const [enumOpen, setEnumOpen] = useState(false);

  const initialEnumSelected = useMemo(() => {
    if (!isEnum) return new Set<string>();
    if (options.length === 0) return new Set<string>();

    if (!current) return new Set<string>(options.map((o) => o.value));
    if (typeof current.prismSelected === 'object' && Array.isArray(current.prismSelected)) {
      const selected = (current.prismSelected as unknown[]).filter((v): v is string => typeof v === 'string');
      return new Set(selected);
    }
    if (current.kind === 'combination') return new Set(extractEnumValues(current));
    if (current.kind === 'string' && current.operator === 'equals' && typeof current.value === 'string') {
      return new Set([current.value]);
    }
    return new Set<string>(options.map((o) => o.value));
  }, [current, fieldType, isEnum, options]);

  const [enumSelected, setEnumSelected] = useState<Set<string>>(initialEnumSelected);

  useEffect(() => {
    if (!enumOpen) return;
    setEnumSelected(new Set(initialEnumSelected));
  }, [enumOpen, initialEnumSelected]);

  useEffect(() => {
    if (enumOpen) return;
    setEnumSelected(new Set(initialEnumSelected));
  }, [enumOpen, initialEnumSelected]);

  const applyEnum = () => {
    if (!isEnum) return;
    const selected = Array.from(enumSelected);
    grid.state.filterModel.set((prev) => {
      const next = { ...prev };
      if (options.length === 0 || selected.length === 0 || selected.length === options.length) {
        delete next[column.id];
        return next;
      }

      const selectedKeys = selected.slice();
      const filter: FilterFunc<Device> & { prismSelected: string[]; prismMode: 'any' } = {
        kind: 'func',
        prismSelected: selectedKeys,
        prismMode: 'any',
        func: ({ data }) => {
          if (!data) return true;
          const raw = data.customFieldValues?.[String(fieldDef.fieldId)];

          if (fieldType === 'MULTI_SELECT') {
            const arr = Array.isArray(raw) ? raw : [];
            return selectedKeys.some((k) => arr.includes(k));
          }

          if (fieldType === 'BOOLEAN') {
            const v = raw === true ? 'true' : raw === false ? 'false' : '';
            if (!v) return false;
            return selectedKeys.includes(v);
          }

          if (fieldType === 'SELECT' || fieldType === 'COUNTRY') {
            if (typeof raw !== 'string' || !raw) return false;
            return selectedKeys.includes(raw);
          }

          return true;
        },
      };

      next[column.id] = filter as unknown as FilterModelItem<Device>;
      return next;
    });
    setEnumOpen(false);
  };

  const clearEnum = () => {
    grid.state.filterModel.set((prev) => {
      const next = { ...prev };
      delete next[column.id];
      return next;
    });
    setEnumOpen(false);
  };

  if (isEnum) {
    return (
      <EnumFilterPopover
        open={enumOpen}
        onOpenChange={setEnumOpen}
        title={fieldDef.displayName}
        options={options}
        selected={enumSelected}
        onSelectedChange={setEnumSelected}
        onApply={applyEnum}
        onClear={clearEnum}
      />
    );
  }

  const value = filterItemToText(current);

  const handleTextChange = (raw: string) => {
    const text = raw.trim();
    grid.state.filterModel.set((prev) => {
      const next = { ...prev };
      if (!text) {
        delete next[column.id];
        return next;
      }

      if (fieldType === 'NUMBER') {
        const parsed = parsePrefixed(text);
        const operator = prefixToNumberOperator(parsed.prefix);
        const num = Number(parsed.value);
        if (Number.isNaN(num)) return next;
        const filter: FilterNumber = { kind: 'number', operator, value: num };
        next[column.id] = filter;
        return next;
      }

      if (fieldType === 'DATETIME') {
        const parsed = parsePrefixed(text);
        const operator = prefixToDateOperator(parsed.prefix);
        const filter: FilterDate = { kind: 'date', operator, value: parsed.value };
        next[column.id] = filter;
        return next;
      }

      const parsed = parsePrefixed(text);
      const operator = prefixToStringOperator(parsed.prefix);
      next[column.id] = { kind: 'string', operator, value: parsed.value };
      return next;
    });
  };

  return (
    <div className="flex items-center w-full h-full gap-1">
      <Input
        value={value}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder="Filter…"
        className="h-7 text-xs px-2 flex-1"
      />
    </div>
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

  const type = fieldDef.fieldType;
  const options = useMemo(() => (fieldDef.options ?? []).slice().sort(optionSort), [fieldDef.options]);
  const initialMultiSelected = useMemo(() => {
    if (row.kind !== 'leaf' || !row.data) return [];
    const raw = row.data.customFieldValues?.[String(fieldDef.fieldId)];
    return Array.isArray(raw) ? raw : [];
  }, [fieldDef.fieldId, row]);
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

import type {
  FilterCombination,
  FilterDate,
  FilterDateOperator,
  FilterModelItem,
  FilterNumber,
  FilterNumberOperator,
  FilterString,
  FilterStringOperator,
  HeaderFloatingCellRendererParams,
} from '@1771technologies/lytenyte-core/types';
import type { Device } from '@/types/device';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, ChevronDown, Filter } from 'lucide-react';

const ENUM_FILTER_VALUES: Record<string, readonly string[]> = {
  status: ['online', 'offline', 'pending'],
  networkType: ['WiFi', '4G', 'Ethernet'],
};

export function DeviceGridFloatingFilterCell({
  grid,
  column,
}: HeaderFloatingCellRendererParams<Device>) {
  const filterModel = grid.state.filterModel.useValue();
  const current = filterModel[column.id] as FilterModelItem<Device> | undefined;
  const value = filterItemToText(current);

  if (column.id === 'actions') return null;

  const enumValues = ENUM_FILTER_VALUES[column.id];

  const handleChange = (raw: string) => {
    const nextFilter = buildFilterFromText(column.type ?? 'string', raw);
    grid.state.filterModel.set(prev => {
      const next = { ...prev };
      if (!nextFilter) {
        delete next[column.id];
      } else {
        next[column.id] = nextFilter;
      }
      return next;
    });
  };

  return (
    <div className="flex items-center w-full h-full gap-1">
      <Input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Filter…"
        className="h-7 text-xs px-2 flex-1"
      />

      <FilterPopover
        columnName={column.name ?? column.id}
        columnType={column.type ?? 'string'}
        enumValues={enumValues}
        current={current}
        onApply={(next) => {
          grid.state.filterModel.set((prev) => {
            const updated = { ...prev };
            if (!next) delete updated[column.id];
            else updated[column.id] = next;
            return updated;
          });
        }}
        onClear={() => {
          grid.state.filterModel.set((prev) => {
            const updated = { ...prev };
            delete updated[column.id];
            return updated;
          });
        }}
      />
    </div>
  );
}

function filterItemToText(filter?: FilterModelItem<Device>): string {
  if (!filter) return '';
  if (filter.kind === 'string') return String(filter.value ?? '');
  if (filter.kind === 'number') return filter.value == null ? '' : String(filter.value);
  if (filter.kind === 'date') return filter.value == null ? '' : String(filter.value);
  if (filter.kind === 'combination') {
    const values = extractEnumValues(filter);
    if (values.length > 0) return values.join(', ');
  }
  return '';
}

function buildFilterFromText(
  type: string,
  raw: string
): FilterModelItem<Device> | undefined {
  const text = raw.trim();
  if (!text) return undefined;

  if (type === 'number') {
    const parsed = parsePrefixed(text);
    const operator = prefixToNumberOperator(parsed.prefix);
    const num = Number(parsed.value);
    if (Number.isNaN(num)) return undefined;
    const filter: FilterNumber = {
      kind: 'number',
      operator,
      value: num,
    };
    return filter;
  }

  if (type === 'date' || type === 'datetime') {
    const parsed = parsePrefixed(text);
    const operator = prefixToDateOperator(parsed.prefix);
    const filter: FilterDate = {
      kind: 'date',
      operator,
      value: parsed.value,
    };
    return filter;
  }

  const parsed = parsePrefixed(text);
  const operator = prefixToStringOperator(parsed.prefix);
  const filter: FilterString = {
    kind: 'string',
    operator,
    value: parsed.value,
  };
  return filter;
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

type FilterOperatorOption<T extends string> = { value: T; label: string };

function OperatorSelect<T extends string>({
  value,
  options,
  onValueChange,
}: {
  value: T;
  options: Array<FilterOperatorOption<T>>;
  onValueChange: (value: T) => void;
}) {
  const active = options.find((o) => o.value === value)?.label ?? value;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 w-full justify-between">
          <span className="truncate">{active}</span>
          <ChevronDown className="h-4 w-4 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onValueChange(v as T)}>
          {options.map((o) => (
            <DropdownMenuRadioItem key={o.value} value={o.value}>
              {o.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function extractEnumValues(filter: FilterCombination): string[] {
  if (filter.operator !== 'OR') return [];
  const values = filter.filters
    .filter((f) => f.kind === 'string' && f.operator === 'equals')
    .map((f) => (f as FilterString).value)
    .filter((v): v is string => typeof v === 'string' && v.length > 0);
  return values;
}

function FilterPopover({
  columnName,
  columnType,
  enumValues,
  current,
  onApply,
  onClear,
}: {
  columnName: string;
  columnType: string;
  enumValues?: readonly string[];
  current?: FilterModelItem<Device>;
  onApply: (next?: FilterModelItem<Device>) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);

  const initialEnumSelected = useMemo(() => {
    if (!enumValues) return new Set<string>();
    if (!current) return new Set<string>(enumValues);
    if (current.kind === 'combination') return new Set(extractEnumValues(current));
    if (current.kind === 'string' && current.operator === 'equals' && typeof current.value === 'string') {
      return new Set([current.value]);
    }
    return new Set<string>(enumValues);
  }, [current, enumValues]);

  const [enumSelected, setEnumSelected] = useState<Set<string>>(initialEnumSelected);

  const initialString = useMemo(() => {
    const filter = current?.kind === 'string' ? current : undefined;
    return {
      operator: (filter?.operator ?? 'contains') as FilterStringOperator,
      value: filter?.value ? String(filter.value) : '',
    };
  }, [current]);
  const [stringOperator, setStringOperator] = useState<FilterStringOperator>(initialString.operator);
  const [stringValue, setStringValue] = useState(initialString.value);

  const initialNumber = useMemo(() => {
    const filter = current?.kind === 'number' ? current : undefined;
    return {
      operator: (filter?.operator ?? 'equals') as FilterNumberOperator,
      value: filter?.value == null ? '' : String(filter.value),
    };
  }, [current]);
  const [numberOperator, setNumberOperator] = useState<FilterNumberOperator>(initialNumber.operator);
  const [numberValue, setNumberValue] = useState(initialNumber.value);

  const initialDate = useMemo(() => {
    const filter = current?.kind === 'date' ? current : undefined;
    return {
      operator: (filter?.operator ?? 'equals') as FilterDateOperator,
      value: filter?.value == null ? '' : String(filter.value),
    };
  }, [current]);
  const [dateOperator, setDateOperator] = useState<FilterDateOperator>(initialDate.operator);
  const [dateValue, setDateValue] = useState(initialDate.value);

  useEffect(() => {
    if (!open) return;
    setEnumSelected(new Set(initialEnumSelected));
    setStringOperator(initialString.operator);
    setStringValue(initialString.value);
    setNumberOperator(initialNumber.operator);
    setNumberValue(initialNumber.value);
    setDateOperator(initialDate.operator);
    setDateValue(initialDate.value);
  }, [open, initialEnumSelected, initialString, initialNumber, initialDate]);

  const applyEnum = () => {
    if (!enumValues) return;
    const selected = Array.from(enumSelected);
    if (selected.length === 0 || selected.length === enumValues.length) {
      onApply(undefined);
      return;
    }
    const filters: FilterString[] = selected.map((v) => ({
      kind: 'string',
      operator: 'equals',
      value: v,
    }));
    const combo: FilterCombination = { kind: 'combination', operator: 'OR', filters };
    onApply(combo);
  };

  const applyString = () => {
    const trimmed = stringValue.trim();
    if (!trimmed) onApply(undefined);
    else onApply({ kind: 'string', operator: stringOperator, value: trimmed });
  };

  const applyNumber = () => {
    const trimmed = numberValue.trim();
    if (!trimmed) onApply(undefined);
    else {
      const num = Number(trimmed);
      if (Number.isNaN(num)) return;
      const filter: FilterNumber = { kind: 'number', operator: numberOperator, value: num };
      onApply(filter);
    }
  };

  const applyDate = () => {
    const trimmed = dateValue.trim();
    if (!trimmed) onApply(undefined);
    else onApply({ kind: 'date', operator: dateOperator, value: trimmed });
  };

  const apply = () => {
    if (enumValues) applyEnum();
    else if (columnType === 'number') applyNumber();
    else if (columnType === 'date' || columnType === 'datetime') applyDate();
    else applyString();
    setOpen(false);
  };

  const clear = () => {
    onClear();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Filter ${columnName}`}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-3" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="grid gap-3">
          <div className="grid gap-1">
            <div className="text-xs font-semibold text-muted-foreground">Operator</div>
            {enumValues ? (
              <div className="text-sm font-medium">In list</div>
            ) : columnType === 'number' ? (
              <OperatorSelect
                value={numberOperator}
                onValueChange={setNumberOperator}
                options={[
                  { value: 'equals', label: 'Equals' },
                  { value: 'not_equals', label: 'Not equals' },
                  { value: 'greater_than', label: 'Greater than' },
                  { value: 'greater_than_or_equals', label: 'Greater or equals' },
                  { value: 'less_than', label: 'Less than' },
                  { value: 'less_than_or_equals', label: 'Less or equals' },
                ]}
              />
            ) : columnType === 'date' || columnType === 'datetime' ? (
              <OperatorSelect
                value={dateOperator}
                onValueChange={setDateOperator}
                options={[
                  { value: 'equals', label: 'Equals' },
                  { value: 'not_equals', label: 'Not equals' },
                  { value: 'after', label: 'After' },
                  { value: 'after_or_equals', label: 'After or equals' },
                  { value: 'before', label: 'Before' },
                  { value: 'before_or_equals', label: 'Before or equals' },
                ]}
              />
            ) : (
              <OperatorSelect
                value={stringOperator}
                onValueChange={setStringOperator}
                options={[
                  { value: 'contains', label: 'Contains' },
                  { value: 'not_contains', label: 'Not contains' },
                  { value: 'equals', label: 'Equals' },
                  { value: 'not_equals', label: 'Not equals' },
                  { value: 'begins_with', label: 'Begins with' },
                  { value: 'ends_with', label: 'Ends with' },
                ]}
              />
            )}
          </div>

          <div className="grid gap-1">
            <div className="text-xs font-semibold text-muted-foreground">Values</div>
            {enumValues ? (
              <ScrollArea className="h-40 rounded border">
                <div className="p-1">
                  {enumValues.map((v) => {
                    const checked = enumSelected.has(v);
                    return (
                      <button
                        key={v}
                        type="button"
                        className="w-full flex items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-accent"
                        onClick={() => {
                          setEnumSelected((prev) => {
                            const next = new Set(prev);
                            if (next.has(v)) next.delete(v);
                            else next.add(v);
                            return next;
                          });
                        }}
                      >
                        <span>{v}</span>
                        {checked && <Check className="h-4 w-4 text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : columnType === 'number' ? (
              <Input
                value={numberValue}
                onChange={(e) => setNumberValue(e.target.value)}
                placeholder="Number…"
                className="h-8"
              />
            ) : columnType === 'date' || columnType === 'datetime' ? (
              <Input
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
                placeholder="YYYY-MM-DD or ISO timestamp…"
                className="h-8"
              />
            ) : (
              <Input
                value={stringValue}
                onChange={(e) => setStringValue(e.target.value)}
                placeholder="Text…"
                className="h-8"
              />
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={clear}>
              Clear
            </Button>
            <Button size="sm" onClick={apply}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

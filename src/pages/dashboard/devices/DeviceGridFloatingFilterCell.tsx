import type {
  FilterCombination,
  FilterDate,
  FilterDateOperator,
  FilterModelItem,
  FilterNumber,
  FilterNumberOperator,
  FilterString,
  FilterStringOperator,
  FilterFunc,
  HeaderFloatingCellRendererParams,
} from '@1771technologies/lytenyte-core/types';
import type { Device } from '@/types/device';
import { resolveDeviceStatus } from '@/types/device';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Check, 
  ChevronDown, 
  Filter, 
  Circle, 
  Wifi, 
  RadioTower, 
  EthernetPort,
  Tag as TagIcon,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Metadata for Enumerated filters
const STATUS_OPTIONS = [
  { value: 'online', label: 'Online', color: 'text-emerald-500', icon: Circle },
  { value: 'offline', label: 'Offline', color: 'text-muted-foreground', icon: Circle },
  { value: 'pending', label: 'Pending', color: 'text-amber-500', icon: Circle },
] as const;

const NETWORK_OPTIONS = [
  { value: 'WiFi', label: 'WiFi', icon: Wifi },
  { value: 'WIFI', label: 'WiFi', icon: Wifi },
  { value: '4G', label: '4G', icon: RadioTower },
  { value: 'FOUR_G', label: '4G', icon: RadioTower },
  { value: 'Ethernet', label: 'Ethernet', icon: EthernetPort },
  { value: 'ETHERNET', label: 'Ethernet', icon: EthernetPort },
] as const;

export function DeviceGridFloatingFilterCell({
  grid,
  column,
}: HeaderFloatingCellRendererParams<Device>) {
  const filterModel = grid.state.filterModel.useValue();
  const current = filterModel[column.id] as (FilterModelItem<Device> & Record<string, any>) | undefined;
  
  if (column.id === 'actions' || column.id === 'lastScreenshotUrl') return null;

  // Detect filter type based on column ID or type
  const isStatus = column.id === 'onlineStatus';
  const isNetwork = column.id === 'networkType';
  const isAutoEnum = ['model', 'version', 'resolution', 'playingProgram'].includes(column.id);
  const isNumericRange = ['brightness', 'storagePct', 'networkStrength'].includes(column.id);
  const isTags = column.id === 'tags';

  const value = filterItemToText(current, { isStatus, isNetwork });

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

  const clearFilter = () => {
    grid.state.filterModel.set((prev) => {
      const updated = { ...prev };
      delete updated[column.id];
      return updated;
    });
  };

  return (
    <div className="flex items-center w-full h-full gap-1 px-1">
      <div className="relative flex-1 min-w-0">
        <Input
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Filter…"
          className={cn(
            "h-7 text-[11px] px-2 pr-6 flex-1 bg-background/50 focus-visible:ring-1",
            current && "border-primary/50 bg-primary/5"
          )}
        />
        {current && (
          <button 
            onClick={clearFilter}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <FilterPopover
        columnId={column.id}
        columnName={column.name ?? column.id}
        columnType={column.type ?? 'string'}
        isStatus={isStatus}
        isNetwork={isNetwork}
        isAutoEnum={isAutoEnum}
        isNumericRange={isNumericRange}
        isTags={isTags}
        grid={grid}
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

function filterItemToText(filter?: FilterModelItem<Device>, opts?: { isStatus?: boolean; isNetwork?: boolean }): string {
  if (!filter) return '';
  
  // Custom text for Enum/Set filters
  if (filter.kind === 'func' || filter.kind === 'combination') {
    const prismSelected = (filter as any).prismSelected as string[] | undefined;
    if (prismSelected && prismSelected.length > 0) {
      if (opts?.isStatus) {
        return prismSelected.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ');
      }
      return prismSelected.join(', ');
    }
  }

  if (filter.kind === 'string') return String(filter.value ?? '');
  if (filter.kind === 'number') return filter.value == null ? '' : String(filter.value);
  if (filter.kind === 'date') return filter.value == null ? '' : String(filter.value);
  
  return '';
}

function buildFilterFromText(
  type: string,
  raw: string
): FilterModelItem<Device> | undefined {
  const text = raw.trim();
  if (!text) return undefined;

  const parsed = parsePrefixed(text);

  if (type === 'number') {
    const operator = prefixToNumberOperator(parsed.prefix);
    const num = Number(parsed.value);
    if (Number.isNaN(num)) return undefined;
    return { kind: 'number', operator, value: num } as FilterNumber;
  }

  if (type === 'date' || type === 'datetime') {
    const operator = prefixToDateOperator(parsed.prefix);
    return { kind: 'date', operator, value: parsed.value } as FilterDate;
  }

  const operator = prefixToStringOperator(parsed.prefix);
  return { kind: 'string', operator, value: parsed.value } as FilterString;
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

function FilterPopover({
  columnId,
  columnName,
  columnType,
  isStatus,
  isNetwork,
  isAutoEnum,
  isNumericRange,
  isTags,
  grid,
  current,
  onApply,
  onClear,
}: {
  columnId: string;
  columnName: string;
  columnType: string;
  isStatus?: boolean;
  isNetwork?: boolean;
  isAutoEnum?: boolean;
  isNumericRange?: boolean;
  isTags?: boolean;
  grid: any;
  current?: FilterModelItem<Device> & Record<string, any>;
  onApply: (next?: FilterModelItem<Device>) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);

  // Enum Options logic
  const enumOptions = useMemo(() => {
    if (isStatus) return STATUS_OPTIONS;
    if (isNetwork) return NETWORK_OPTIONS;
    if (isAutoEnum) {
      // Extract unique models/versions from current data
      const data = grid.state.rowDataSource.get()?.data as Device[] || [];
      const unique = Array.from(new Set(data.map(d => (d as any)[columnId]).filter(Boolean)));
      return unique.sort().map(v => ({ value: String(v), label: String(v) }));
    }
    return null;
  }, [isStatus, isNetwork, isAutoEnum, grid, columnId]);

  const initialEnumSelected = useMemo(() => {
    if (!enumOptions) return new Set<string>();
    if (current?.prismSelected) return new Set(current.prismSelected);
    return new Set<string>();
  }, [current, enumOptions]);

  const [enumSelected, setEnumSelected] = useState<Set<string>>(initialEnumSelected);

  // Range Slider logic
  const initialRange = useMemo(() => {
    if (current?.kind === 'func' && current.prismRange) {
      return current.prismRange as [number, number];
    }
    return [0, 100] as [number, number];
  }, [current]);
  const [range, setRange] = useState<[number, number]>(initialRange);

  // Generic Number/String logic
  const [operator, setOperator] = useState<any>(current?.operator ?? (columnType === 'number' ? 'equals' : 'contains'));
  const [value, setValue] = useState(current?.value ? String(current.value) : '');

  useEffect(() => {
    if (!open) return;
    setEnumSelected(new Set(initialEnumSelected));
    setRange(initialRange);
    setOperator(current?.operator ?? (columnType === 'number' ? 'equals' : 'contains'));
    setValue(current?.value ? String(current.value) : '');
  }, [open, initialEnumSelected, initialRange, current, columnType]);

  const apply = () => {
    // 1. Enum Filter (Status, Network, Model)
    if (enumOptions) {
      const selected = Array.from(enumSelected);
      if (selected.length === 0) {
        onApply(undefined);
      } else {
        const filter: FilterFunc<Device> & { prismSelected: string[] } = {
          kind: 'func',
          prismSelected: selected,
          func: ({ data }) => {
            if (!data) return false;
            if (isStatus) {
              return selected.includes(resolveDeviceStatus(data));
            }
            const val = (data as any)[columnId];
            return selected.includes(val);
          }
        };
        onApply(filter as any);
      }
    } 
    // 2. Numeric Range Filter
    else if (isNumericRange) {
      const filter: FilterFunc<Device> & { prismRange: [number, number] } = {
        kind: 'func',
        prismRange: range,
        func: ({ data }) => {
          if (!data) return false;
          let val = 0;
          if (columnId === 'storagePct') {
            val = data.totalStorage ? ((data.totalStorage - data.freeStorage) / data.totalStorage) * 100 : 0;
          } else {
            val = (data as any)[columnId] || 0;
          }
          
          // SPECIAL LOGIC: Signal Strength only for 4G
          if (columnId === 'networkStrength') {
             const is4G = data.networkType === '4G' || data.networkType === 'FOUR_G';
             if (!is4G) return false; // Or return true if you want to show others? User said only 4G has it.
          }

          return val >= range[0] && val <= range[1];
        }
      };
      onApply(filter as any);
    }
    // 3. Tags Filter
    else if (isTags) {
      const trimmed = value.trim().toLowerCase();
      if (!trimmed) {
        onApply(undefined);
      } else {
        const filter: FilterFunc<Device> = {
          kind: 'func',
          func: ({ data }) => {
            if (!data || !data.tags) return false;
            return data.tags.some(t => 
              t.tagName.toLowerCase().includes(trimmed) || 
              t.tagSlug.toLowerCase().includes(trimmed)
            );
          }
        };
        onApply(filter as any);
      }
    }
    // 4. Default String/Number/Date
    else {
      if (!value.trim()) {
        onApply(undefined);
      } else {
        if (columnType === 'number') {
          const num = Number(value);
          if (!Number.isNaN(num)) {
            onApply({ kind: 'number', operator, value: num });
          }
        } else if (columnType === 'date' || columnType === 'datetime') {
          onApply({ kind: 'date', operator, value: value.trim() });
        } else {
          onApply({ kind: 'string', operator, value: value.trim() });
        }
      }
    }
    setOpen(false);
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
                <h4 className="font-semibold text-sm">{columnName} Filter</h4>
             </div>
             {current && (
               <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive" onClick={onClear}>
                 Reset
               </Button>
             )}
          </header>

          {/* 1. Enum Options (Status, Network, Model) */}
          {enumOptions && (
            <div className="grid gap-2">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Select Options</div>
              <ScrollArea className="h-48 rounded-lg border bg-muted/20">
                <div className="p-1.5 grid gap-1">
                  {enumOptions.map((opt) => {
                    const checked = enumSelected.has(opt.value);
                    const Icon = (opt as any).icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        className={cn(
                          "w-full flex items-center justify-between rounded-md px-2.5 py-2 text-sm transition-all hover:bg-background",
                          checked ? "bg-background shadow-sm border" : "border-transparent"
                        )}
                        onClick={() => {
                          setEnumSelected((prev) => {
                            const next = new Set(prev);
                            if (next.has(opt.value)) next.delete(opt.value);
                            else next.add(opt.value);
                            return next;
                          });
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          {Icon && <Icon className={cn("h-3.5 w-3.5", (opt as any).color)} />}
                          <span className={cn(checked ? "font-semibold" : "text-muted-foreground")}>
                            {opt.label}
                          </span>
                        </div>
                        {checked && <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
              <div className="flex justify-between items-center px-1">
                 <Button variant="link" className="h-auto p-0 text-[10px]" onClick={() => setEnumSelected(new Set(enumOptions.map(o => o.value)))}>Select All</Button>
                 <Button variant="link" className="h-auto p-0 text-[10px]" onClick={() => setEnumSelected(new Set())}>Clear All</Button>
              </div>
            </div>
          )}

          {/* 2. Numeric Range Slider */}
          {isNumericRange && (
            <div className="grid gap-4 py-2">
              <div className="flex items-center justify-between">
                 <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Range Value</div>
                 <div className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {range[0]}% - {range[1]}%
                 </div>
              </div>
              <div className="px-2">
                 <Slider 
                    value={range} 
                    onValueChange={(v) => setRange(v as [number, number])} 
                    max={100} 
                    step={1} 
                    className="cursor-pointer"
                 />
              </div>
              {columnId === 'networkStrength' && (
                <div className="p-2 bg-amber-50 rounded-lg border border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30">
                   <p className="text-[10px] text-amber-700 leading-tight">
                      Note: Signal strength filtering is only applicable to 4G devices.
                   </p>
                </div>
              )}
            </div>
          )}

          {/* 3. Tags or Default Text */}
          {!enumOptions && !isNumericRange && (
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                 <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Operator</div>
                 <OperatorSelect
                   value={operator}
                   onValueChange={setOperator}
                   options={columnType === 'number' ? [
                     { value: 'equals', label: 'Equals' },
                     { value: 'not_equals', label: 'Not equals' },
                     { value: 'greater_than', label: 'Greater than' },
                     { value: 'less_than', label: 'Less than' },
                   ] : [
                     { value: 'contains', label: 'Contains' },
                     { value: 'not_contains', label: 'Not contains' },
                     { value: 'equals', label: 'Equals' },
                     { value: 'begins_with', label: 'Begins with' },
                   ]}
                 />
              </div>
              <div className="grid gap-1.5">
                 <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Search Value</div>
                 <div className="relative">
                    {isTags ? <TagIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" /> : null}
                    <Input
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder={isTags ? "Search tags..." : "Enter value..."}
                      className={cn("h-9 text-sm", isTags && "pl-8")}
                      autoFocus
                    />
                 </div>
              </div>
            </div>
          )}

          <footer className="flex items-center justify-end gap-2 pt-2 border-t mt-2">
            <Button variant="ghost" size="sm" className="h-8 rounded-lg" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" className="h-8 px-5 rounded-lg font-bold" onClick={apply}>
              Apply Filter
            </Button>
          </footer>
        </div>
      </PopoverContent>
    </Popover>
  );
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
        <Button variant="outline" size="sm" className="h-9 w-full justify-between bg-muted/20 border-muted/50 text-xs">
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
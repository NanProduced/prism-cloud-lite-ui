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
import { useEffect, useMemo, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  X,
  Calendar,
  Search
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
  { value: '4G', label: '4G', icon: RadioTower },
  { value: 'Ethernet', label: 'Ethernet', icon: EthernetPort },
] as const;

export function DeviceGridFloatingFilterCell({
  grid,
  column,
}: HeaderFloatingCellRendererParams<Device>) {
  const filterModel = grid.state.filterModel.useValue();
  const current = filterModel[column.id] as (FilterModelItem<Device> & Record<string, any>) | undefined;
  
  if (column.id === 'actions' || column.id === 'lastScreenshotUrl') return null;

  const isStatus = column.id === 'onlineStatus';
  const isNetwork = column.id === 'networkType';
  const isAutoEnum = ['model', 'version', 'resolution', 'playingProgram'].includes(column.id);
  const isNumericRange = ['brightness', 'storagePct', 'networkStrength'].includes(column.id);
  const isTags = column.id === 'tags';
  const isTime = column.id === 'lastReportTime';

  const hideInput = isStatus || isNetwork || isNumericRange || isTime || isAutoEnum;
  const value = filterItemToText(current, { isStatus, isNetwork, isTime, isNumericRange });

  const handleChange = (raw: string) => {
    if (hideInput) return;
    const nextFilter = buildFilterFromText(column.type ?? 'string', raw);
    grid.state.filterModel.set(prev => {
      const next = { ...prev };
      if (!nextFilter) delete next[column.id];
      else next[column.id] = nextFilter;
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
    <div className={cn(
      "flex items-center w-full h-full gap-1 px-1 transition-colors duration-200",
      current && "bg-primary/5"
    )}>
      <div className="relative flex-1 min-w-0">
        {!hideInput ? (
          <Input
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Search…"
            className={cn(
              "h-7 text-[11px] px-2 pr-6 flex-1 bg-background/50 border-transparent hover:border-muted-foreground/30 focus-visible:ring-1",
              current && "border-primary/40 bg-background shadow-inner"
            )}
          />
        ) : (
          <div className={cn(
            "h-7 flex items-center px-2 text-[10px] font-medium truncate cursor-default rounded-md border border-transparent",
            current && "bg-primary/10 text-primary border-primary/20"
          )}>
            {current ? <span className="truncate">{value}</span> : null}
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

      <FilterPopover
        columnId={column.id}
        columnName={column.name ?? column.id}
        columnType={column.type ?? 'string'}
        isStatus={isStatus}
        isNetwork={isNetwork}
        isAutoEnum={isAutoEnum}
        isNumericRange={isNumericRange}
        isTags={isTags}
        isTime={isTime}
        hideInput={hideInput}
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

function filterItemToText(filter?: FilterModelItem<Device>, opts?: any): string {
  if (!filter) return '';
  if (filter.kind === 'func' || filter.kind === 'combination') {
    const f = filter as any;
    if (f.prismSelected?.length > 0) return f.prismSelected.join(', ');
    if (f.prismRange) return `${f.prismRange[0]} - ${f.prismRange[1]}${opts?.isNumericRange ? '%' : ''}`;
    if (f.prismDate) {
      const { start, end } = f.prismDate;
      if (start && end) return `${start} to ${end}`;
      return start ? `Since ${start}` : end ? `Before ${end}` : 'Date Filter';
    }
    return 'Active Filter';
  }
  return String((filter as any).value ?? '');
}

function buildFilterFromText(type: string, raw: string): FilterModelItem<Device> | undefined {
  const text = raw.trim();
  if (!text) return undefined;
  const parsed = parsePrefixed(text);
  if (type === 'number') {
    const num = Number(parsed.value);
    return Number.isNaN(num) ? undefined : { kind: 'number', operator: prefixToNumberOperator(parsed.prefix), value: num } as any;
  }
  if (type === 'date' || type === 'datetime') return { kind: 'date', operator: prefixToDateOperator(parsed.prefix), value: parsed.value } as any;
  return { kind: 'string', operator: prefixToStringOperator(parsed.prefix), value: parsed.value } as any;
}

function parsePrefixed(text: string) {
  const match = text.match(/^(>=|<=|!=|>|<)\s*(.+)$/);
  return match ? { prefix: match[1], value: match[2].trim() } : { value: text };
}

function prefixToStringOperator(p?: string): FilterStringOperator { return p === '!=' ? 'not_equals' : 'contains'; }
function prefixToNumberOperator(p?: string): FilterNumberOperator {
  switch(p) { case '>=': return 'greater_than_or_equals'; case '<=': return 'less_than_or_equals'; case '>': return 'greater_than'; case '<': return 'less_than'; case '!=': return 'not_equals'; default: return 'equals'; }
}
function prefixToDateOperator(p?: string): FilterDateOperator {
  switch(p) { case '>=': return 'after_or_equals'; case '<=': return 'before_or_equals'; case '>': return 'after'; case '<': return 'before'; case '!=': return 'not_equals'; default: return 'equals'; }
}

function FilterPopover({
  columnId, columnName, columnType, isStatus, isNetwork, isAutoEnum, isNumericRange, isTags, isTime, grid, current, onApply, onClear
}: any) {
  const [open, setOpen] = useState(false);
  const [internalSearch, setInternalSearch] = useState('');

  const rowDataSource = grid.state.rowDataSource?.useValue?.() ?? null;
  const rows = grid.state.rows?.useValue?.() ?? [];

  const enumOptions = useMemo(() => {
    if (isStatus) return STATUS_OPTIONS;
    if (isNetwork) return NETWORK_OPTIONS;
    if (isAutoEnum) {
      let data: any[] = [];
      if (Array.isArray(rowDataSource)) {
        data = rowDataSource;
      } else if (rowDataSource && Array.isArray(rowDataSource.data)) {
        data = rowDataSource.data;
      }

      if (data.length === 0 && Array.isArray(rows)) {
        data = rows.filter((r: any) => r.kind === 'leaf').map((r: any) => r.data);
      }

      if (!Array.isArray(data) || data.length === 0) return [];

      const unique = Array.from(new Set(data.map((d: any) => {
         const item = d?.data || d;
         const val = item?.[columnId];
         if (val == null || val === '') return null;
         if (columnId === 'resolution' && typeof val === 'object') return `${val.width} x ${val.height}`;
         return String(val);
      }))).filter(Boolean).sort();
      return unique.map(v => ({ value: String(v), label: String(v) }));
    }
    return null;
  }, [isStatus, isNetwork, isAutoEnum, rowDataSource, rows, columnId]);

  const filteredOptions = useMemo(() => {
    if (!enumOptions || !internalSearch) return enumOptions;
    const q = internalSearch.toLowerCase();
    return enumOptions.filter((o: any) => o.label.toLowerCase().includes(q));
  }, [enumOptions, internalSearch]);

  const [enumSelected, setEnumSelected] = useState<Set<string>>(new Set());
  const [range, setRange] = useState<[number, number]>([0, 100]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [operator, setOperator] = useState('contains');
  const [value, setValue] = useState('');

  // Critical: Only initialize on Open to avoid feedback loops
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (open) {
      setEnumSelected(new Set(current?.prismSelected || []));
      setRange(current?.prismRange || [0, 100]);
      setDateRange(current?.prismDate || { start: '', end: '' });
      setOperator(current?.operator || (columnType === 'number' ? 'equals' : 'contains'));
      setValue(current?.value != null ? String(current.value) : '');
      setInternalSearch('');
      hasInitialized.current = true;
    } else {
      hasInitialized.current = false;
    }
  }, [open, columnType]); // Removed current/initial deps to break loop

  const handleLiveChange = (updates: any) => {
    if (!hasInitialized.current) return;
    if (updates.enum) {
      const selected = Array.from(updates.enum);
      if (selected.length === 0) onApply(undefined);
      else onApply({
        kind: 'func', prismSelected: selected,
        func: ({ data }: any) => {
          const item = data?.data || data;
          if (isStatus) return selected.includes(resolveDeviceStatus(item));
          let val = item?.[columnId];
          if (val == null) return false;
          if (columnId === 'resolution' && typeof val === 'object') val = `${val.width} x ${val.height}`;
          const sVal = String(val).toLowerCase();
          return selected.some(s => s.toLowerCase() === sVal);
        }
      });
    } else if (updates.range) {
      onApply({
        kind: 'func', prismRange: updates.range,
        func: ({ data }: any) => {
          const item = data?.data || data;
          let val = (columnId === 'storagePct' && item.totalStorage) 
            ? ((item.totalStorage - item.freeStorage) / item.totalStorage) * 100 
            : item?.[columnId];
          if (val == null) return false;
          if (columnId === 'networkStrength' && !(item.networkType === '4G' || item.networkType === 'FOUR_G')) return false;
          return val >= updates.range[0] && val <= updates.range[1];
        }
      });
    } else if (updates.date) {
      const { start, end } = updates.date;
      if (!start && !end) onApply(undefined);
      else onApply({
        kind: 'func', prismDate: updates.date,
        func: ({ data }: any) => {
          const val = (data?.data || data)?.[columnId];
          if (!val) return false;
          const t = new Date(val).getTime();
          if (start && t < new Date(start).getTime()) return false;
          if (end && t > (new Date(end).getTime() + 86400000 - 1)) return false;
          return true;
        }
      });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant={current ? "secondary" : "ghost"} size="icon" className={cn("h-7 w-7 transition-all", current ? "text-primary bg-primary/20" : "")}>
          <Filter className={cn("h-3.5 w-3.5", current && "fill-current")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0 shadow-2xl border-muted/60 rounded-xl overflow-hidden" onOpenAutoFocus={e => e.preventDefault()}>
        <div className="flex flex-col">
          <header className="px-4 py-3 bg-muted/30 border-b flex items-center justify-between">
             <div className="flex items-center gap-2">
                <div className="p-1.5 bg-background rounded-md shadow-sm">
                   {isTime ? <Calendar className="h-3.5 w-3.5 text-primary" /> : <Filter className="h-3.5 w-3.5 text-primary" />}
                </div>
                <h4 className="font-bold text-sm tracking-tight">{columnName}</h4>
             </div>
             {current && <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] uppercase font-bold text-muted-foreground hover:text-destructive" onClick={() => { onClear(); setOpen(false); }}>Reset</Button>}
          </header>
          <div className="p-4 space-y-4">
            {enumOptions && (
              <div className="space-y-3">
                {(isAutoEnum || enumOptions.length > 6) && (
                   <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input placeholder="Search options..." className="h-8 pl-8 text-xs bg-muted/20 border-transparent" value={internalSearch} onChange={e => setInternalSearch(e.target.value)} />
                   </div>
                )}
                <ScrollArea className="h-44 rounded-lg border bg-background/50">
                  <div className="p-1.5 grid gap-0.5">
                    {filteredOptions?.length ? filteredOptions.map((opt: any) => {
                      const checked = enumSelected.has(opt.value);
                      const Icon = opt.icon;
                      return (
                        <button key={opt.value} type="button" className={cn("w-full flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-all", checked ? "bg-primary/5 text-primary" : "text-muted-foreground hover:bg-muted")} onClick={() => {
                          const n = new Set(enumSelected);
                          if (n.has(opt.value)) n.delete(opt.value); else n.add(opt.value);
                          setEnumSelected(n); handleLiveChange({ enum: n });
                        }}>
                          <div className="flex items-center gap-2.5">
                            {Icon && <Icon className={cn("h-3 w-3", opt.color)} />}
                            <span className={cn(checked && "font-semibold")}>{opt.label}</span>
                          </div>
                          {checked && <Check className="h-3.5 w-3.5" />}
                        </button>
                      );
                    }) : <div className="py-8 text-center text-[11px] text-muted-foreground">{enumOptions.length ? "No matches" : "Extracting..."}</div>}
                  </div>
                </ScrollArea>
                <div className="flex justify-between items-center px-1">
                   <button className="text-[10px] text-primary hover:underline font-medium" onClick={() => { const a = new Set(enumOptions.map((o: any) => o.value)); setEnumSelected(a); handleLiveChange({ enum: a }); }}>Select All</button>
                   <button className="text-[10px] text-muted-foreground hover:underline font-medium" onClick={() => { setEnumSelected(new Set()); handleLiveChange({ enum: new Set() }); }}>Deselect All</button>
                </div>
              </div>
            )}
            {isNumericRange && (
              <div className="space-y-6 py-2">
                <div className="flex items-center justify-between">
                   <div className="text-[10px] font-bold text-muted-foreground uppercase">Range Value</div>
                   <Badge variant="outline" className="font-mono text-[10px] bg-background">{range[0]}% - {range[1]}%</Badge>
                </div>
                <div className="px-2">
                   <Slider value={range} onValueChange={(v: any) => { setRange(v); handleLiveChange({ range: v }); }} max={100} step={1} />
                </div>
              </div>
            )}
            {isTime && (
              <div className="space-y-4 py-1">
                {['start', 'end'].map(key => (
                  <div key={key} className="grid gap-2">
                     <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">{key} Date</label>
                     </div>
                     <Input type="date" className="h-9 text-xs bg-muted/20 border-transparent" value={(dateRange as any)[key]} onChange={e => {
                        const n = { ...dateRange, [key]: e.target.value };
                        setDateRange(n); handleLiveChange({ date: n });
                     }} />
                  </div>
                ))}
                <div className="pt-2 flex justify-end">
                   <Button variant="link" className="h-auto p-0 text-[10px] text-muted-foreground" onClick={() => { const e = { start: '', end: '' }; setDateRange(e); handleLiveChange({ date: e }); }}>Clear dates</Button>
                </div>
              </div>
            )}
            {!enumOptions && !isNumericRange && !isTime && (
              <div className="space-y-3">
                <OperatorSelect value={operator} onValueChange={(v: any) => { setOperator(v); if(value) onApply({ kind: columnType === 'number' ? 'number' : 'string', operator: v, value: columnType === 'number' ? Number(value) : value } as any); }} options={columnType === 'number' ? [{ value: 'equals', label: 'Equals' }, { value: 'not_equals', label: 'Not equals' }, { value: 'greater_than', label: 'Greater than' }, { value: 'less_than', label: 'Less than' }] : [{ value: 'contains', label: 'Contains' }, { value: 'not_contains', label: 'Not contains' }, { value: 'equals', label: 'Equals' }, { value: 'begins_with', label: 'Begins with' }]} />
                <div className="relative">
                  {isTags && <TagIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />}
                  <Input value={value} onChange={e => {
                    const v = e.target.value; setValue(v);
                    if (!v.trim()) onApply(undefined);
                    else if (isTags) onApply({ kind: 'func', func: ({ data }: any) => (data?.data || data).tags?.some((t: any) => t.tagName.toLowerCase().includes(v.toLowerCase())) });
                    else onApply({ kind: columnType === 'number' ? 'number' : 'string', operator, value: columnType === 'number' ? Number(v) : v });
                  }} placeholder={isTags ? "Filter by tag name..." : "Enter text..."} className={cn("h-9 text-xs", isTags && "pl-8")} autoFocus />
                </div>
              </div>
            )}
          </div>
          <footer className="px-4 py-3 bg-muted/10 border-t flex items-center justify-end">
             <Button variant="outline" size="sm" className="h-8 rounded-lg font-bold" onClick={() => setOpen(false)}>Done</Button>
          </footer>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function OperatorSelect({ value, options, onValueChange }: any) {
  const active = options.find((o: any) => o.value === value)?.label ?? value;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 w-full justify-between bg-background text-[11px] font-medium border-muted-foreground/20">
          <span className="truncate">{active}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 rounded-xl">
        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
          {options.map((o: any) => <DropdownMenuRadioItem key={o.value} value={o.value} className="text-[11px] py-2">{o.label}</DropdownMenuRadioItem>)}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

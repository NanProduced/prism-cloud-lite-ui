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
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { resolveTagIcon, hexToRgba } from '@/components/devices/tagging';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
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

// Metadata for Enumerated filters - using translation keys
const getStatusOptions = (t: (key: string) => string) => [
  { value: 'online', label: t('devices.filter.status.online'), color: 'text-emerald-500', icon: Circle },
  { value: 'offline', label: t('devices.filter.status.offline'), color: 'text-muted-foreground', icon: Circle },
  { value: 'pending', label: t('devices.filter.status.pending'), color: 'text-amber-500', icon: Circle },
];

const getNetworkOptions = (t: (key: string) => string) => [
  { value: 'WiFi', label: t('devices.filter.network.wifi'), icon: Wifi },
  { value: '4G', label: t('devices.filter.network.4g'), icon: RadioTower },
  { value: 'Ethernet', label: t('devices.filter.network.ethernet'), icon: EthernetPort },
];

export function DeviceGridFloatingFilterCell({
  grid,
  column,
  allTags,
}: HeaderFloatingCellRendererParams<Device> & { allTags?: any[] }) {
  const { t } = useTranslation();
  const filterModel = grid.state.filterModel.useValue();
  const current = filterModel[column.id] as (FilterModelItem<Device> & Record<string, any>) | undefined;
  
  if (column.id === 'actions' || column.id === 'lastScreenshotUrl') return null;

  const isStatus = column.id === 'onlineStatus';
  const isNetwork = column.id === 'networkType';
  const isAutoEnum = ['model', 'version', 'resolution', 'playingProgram'].includes(column.id);
  const isNumeric = ['brightness', 'storagePct', 'networkStrength'].includes(column.id) || column.type === 'number';
  const isTags = column.id === 'tags';
  const isTime = column.id === 'lastReportTime';

  const hideInput = isStatus || isNetwork || isNumeric || isTime || isAutoEnum || isTags;
  const value = filterItemToText(current, { isStatus, isNetwork, isTime, isNumeric, isTags }, t);

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
            placeholder={t('devices.filter.search')}
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
        isNumeric={isNumeric}
        isTags={isTags}
        isTime={isTime}
        allTags={allTags}
        hideInput={hideInput}
        grid={grid}
        current={current}
        t={t}
        onApply={(next: any) => {
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

function filterItemToText(filter?: FilterModelItem<Device>, opts?: any, t?: (key: string) => string): string {
  if (!filter) return '';
  if (filter.kind === 'func' || filter.kind === 'combination') {
    const f = filter as any;
    if (f.prismSelected?.length > 0) {
      // Replace __NO_TAGS__ with a user-friendly label
      const noTagsLabel = t ? t('devices.filter.noTags') : 'No Tags';
      const displayLabels = f.prismSelected.map((s: string) => s === '__NO_TAGS__' ? noTagsLabel : s);
      return displayLabels.join(', ');
    }
    if (f.prismRange) return `${f.prismRange[0]} - ${f.prismRange[1]}${opts?.isNumeric ? '%' : ''}`;
    if (f.prismDate) {
      const { start, end } = f.prismDate;
      if (start && end) return `${start} to ${end}`;
      return start ? `Since ${start}` : end ? `Before ${end}` : 'Date Filter';
    }
    return 'Active Filter';
  }
     if (filter.kind === 'number') {
       const f = filter as FilterNumber;
       const opMap: any = { equals: '=', not_equals: '!=', greater_than: '>', less_than: '<', greater_than_or_equals: '>=', less_than_or_equals: '<=' };
  
     return `${opMap[f.operator] || ''}${f.value}`;
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
  columnId, columnName, columnType, isStatus, isNetwork, isAutoEnum, isNumeric, isTags, isTime, allTags, grid, current, t, onApply, onClear
}: any) {
  const [open, setOpen] = useState(false);
  const [internalSearch, setInternalSearch] = useState('');
  const filterDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Rules of Hooks: Always call useValue at the top level
  const filterModel = grid?.state?.filterModel?.useValue() || {};
  const rows = grid?.state?.rows?.useValue() || [];
  const rowDataSource = grid?.state?.rowDataSource?.useValue();
  
  const rawData = useMemo(() => {
    if (!rowDataSource) return [];
    const ds = rowDataSource as any;
    if (ds.state?.data?.get) {
      try {
        return ds.state.data.get() || [];
      } catch (e) {
        return [];
      }
    }
    return [];
  }, [rowDataSource]);

  const enumOptions = useMemo(() => {
    if (isStatus) return getStatusOptions(t);
    if (isNetwork) return getNetworkOptions(t);
    if (isTags && allTags) {
       const tagOptions = allTags.map((tag: any) => ({
         value: tag.tagName,
         label: tag.tagName,
         color: tag.color,
         icon: tag.icon ? resolveTagIcon(tag.icon) : null
       }));
       // Add "No Tags" option at the beginning
       return [
         { value: '__NO_TAGS__', label: t('devices.filter.noTags'), color: null, icon: null, isSpecial: true },
         ...tagOptions
       ];
    }
    if ((isAutoEnum || isTags) && open) {
      const values = new Set<string>();

      // Extract leaf data from grid rows state (LyteNyte format: { kind: 'leaf', data: {...} })
      const allLeafData: any[] = [];
      if (rows && Array.isArray(rows)) {
        const extractLeafData = (rowList: any[]) => {
          rowList.forEach((row: any) => {
            if (row?.kind === 'leaf' && row?.data) {
              allLeafData.push(row.data);
            } else if (row?.children && Array.isArray(row.children)) {
              extractLeafData(row.children);
            }
          });
        };
        extractLeafData(rows);
      }

      // Fallback to rawData if rows didn't yield results
      const sourceData = allLeafData.length > 0 ? allLeafData : rawData;
      if (sourceData.length === 0) return [];

      sourceData.forEach((item: any) => {
        if (!item) return;

        if (isTags) {
          (item.tags || []).forEach((t: any) => {
            if (t?.tagName) values.add(t.tagName);
          });
          return;
        }

        let val = item[columnId];
        if (columnId === 'playingProgram') {
          val = val || item.currentProgram?.name || item.playing_program;
        } else if (columnId === 'resolution') {
          if (val && typeof val === 'object') val = `${val.width} x ${val.height}`;
        }
        if (val != null && val !== '' && val !== '—' && val !== '-') values.add(String(val));
      });
      const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
      return Array.from(values).sort(collator.compare).map(v => ({ value: v, label: v }));
    }
    return (isAutoEnum || isTags) ? [] : null;
  }, [open, rows, rawData, columnId, isStatus, isNetwork, isAutoEnum, isTags, allTags]);

  const filteredOptions = useMemo(() => {
    if (!enumOptions || !internalSearch) return enumOptions;
    const q = internalSearch.toLowerCase();
    return enumOptions.filter((o: any) => o.label.toLowerCase().includes(q));
  }, [enumOptions, internalSearch]);

  const [enumSelected, setEnumSelected] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [operator, setOperator] = useState('contains');
  const [value, setValue] = useState('');

  // Critical: Only initialize on Open to avoid feedback loops
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (open) {
      setEnumSelected(new Set(current?.prismSelected || []));
      setDateRange(current?.prismDate || { start: '', end: '' });
      setOperator(current?.operator || (isNumeric ? 'equals' : 'contains'));
      setValue(current?.value != null ? String(current.value) : '');
      setInternalSearch('');
      hasInitialized.current = true;
    } else {
      hasInitialized.current = false;
    }
  }, [open, isNumeric]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current);
    };
  }, []);

  // Debounced text filter application (150ms delay for better performance)
  const debouncedTextFilter = useCallback((v: string, op: string) => {
    if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current);
    filterDebounceRef.current = setTimeout(() => {
      if (!v.trim()) {
        onApply(undefined);
      } else if (isTags) {
        onApply({ kind: 'func', func: ({ data }: any) => (data?.data || data).tags?.some((t: any) => t.tagName.toLowerCase().includes(v.toLowerCase())) });
      } else {
        onApply({ kind: isNumeric ? 'number' : 'string', operator: op, value: isNumeric ? Number(v) : v });
      }
    }, 150);
  }, [onApply, isTags, isNumeric]);

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
          
          if (isTags) {
            const deviceTags = (item.tags || []).map((t: any) => t.tagName);
            // Handle "No Tags" special case
            if (selected.includes('__NO_TAGS__')) {
              if (deviceTags.length === 0) return true;
              // Also check if any other selected tags match
              const otherSelected = selected.filter(s => s !== '__NO_TAGS__');
              if (otherSelected.length > 0) {
                return otherSelected.some(s => deviceTags.includes(s));
              }
              return false;
            }
            return selected.some(s => deviceTags.includes(s));
          }

          let val = item?.[columnId];
          if (columnId === 'playingProgram') val = val || item.currentProgram?.name || item.playing_program;
          if (columnId === 'resolution' && typeof val === 'object') val = `${val.width} x ${val.height}`;
          if (val == null) return false;
          const sVal = String(val).toLowerCase();
          return (selected as string[]).some(s => s.toLowerCase() === sVal);
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
             {current && <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-bold text-muted-foreground hover:text-destructive" onClick={() => { onClear(); setOpen(false); }}>{t('devices.filter.reset')}</Button>}
          </header>
          <div className="p-4 space-y-4">
            {enumOptions && (
              <div className="space-y-3">
                {(isAutoEnum || enumOptions.length > 6) && (
                   <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input placeholder={t('devices.filter.searchOptions')} className="h-8 pl-8 text-xs bg-muted/20 border-transparent" value={internalSearch} onChange={e => setInternalSearch(e.target.value)} />
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
                          <div className="flex items-center gap-2.5 min-w-0">
                            {isTags && opt.isSpecial ? (
                              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-dashed border-muted-foreground/40 text-[10px] font-medium text-muted-foreground">
                                <span className="truncate">{opt.label}</span>
                              </div>
                            ) : isTags && opt.color ? (
                              <div
                                className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold"
                                style={{
                                  borderColor: opt.color,
                                  color: opt.color,
                                  backgroundColor: hexToRgba(opt.color, 0.1)
                                }}
                              >
                                {Icon && <Icon className="h-3 w-3" />}
                                <span className="truncate">{opt.label}</span>
                              </div>
                            ) : (
                              <>
                                {Icon && <Icon className={cn("h-3 w-3", opt.color)} />}
                                <span className={cn(checked && "font-semibold")}>{opt.label}</span>
                              </>
                            )}
                          </div>
                          {checked && <Check className="h-3.5 w-3.5" />}
                        </button>
                      );
                    }) : <div className="py-8 text-center text-[11px] text-muted-foreground">{enumOptions.length ? t('devices.filter.noMatches') : t('devices.filter.extracting')}</div>}
                  </div>
                </ScrollArea>
                <div className="flex justify-between items-center px-1">
                   <button className="text-[10px] text-primary hover:underline font-medium" onClick={() => { const a = new Set(enumOptions.map((o: any) => o.value)); setEnumSelected(a); handleLiveChange({ enum: a }); }}>{t('devices.filter.selectAll')}</button>
                   <button className="text-[10px] text-muted-foreground hover:underline font-medium" onClick={() => { setEnumSelected(new Set()); handleLiveChange({ enum: new Set() }); }}>{t('devices.filter.deselectAll')}</button>
                </div>
              </div>
            )}
            {isTime && (
              <div className="space-y-4 py-1">
                {['start', 'end'].map(key => (
                  <div key={key} className="grid gap-2">
                     <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <label className="text-[10px] font-bold text-muted-foreground">{key === 'start' ? t('devices.filter.startDate') : t('devices.filter.endDate')}</label>
                     </div>
                     <Input type="date" className="h-9 text-xs bg-muted/20 border-transparent" value={(dateRange as any)[key]} onChange={e => {
                        const n = { ...dateRange, [key]: e.target.value };
                        setDateRange(n); handleLiveChange({ date: n });
                     }} />
                  </div>
                ))}
                <div className="pt-2 flex justify-end">
                   <Button variant="link" className="h-auto p-0 text-[10px] text-muted-foreground" onClick={() => { const e = { start: '', end: '' }; setDateRange(e); handleLiveChange({ date: e }); }}>{t('devices.filter.clearDates')}</Button>
                </div>
              </div>
            )}
            {!enumOptions && !isTime && (
              <div className="space-y-3">
                <OperatorSelect
                  value={operator}
                  onValueChange={(v: any) => {
                    setOperator(v);
                    if(value) onApply({ kind: isNumeric ? 'number' : 'string', operator: v, value: isNumeric ? Number(value) : value } as any);
                  }}
                  options={isNumeric ? [
                    { value: 'equals', label: t('devices.filter.operators.equals') },
                    { value: 'not_equals', label: t('devices.filter.operators.notEquals') },
                    { value: 'greater_than', label: t('devices.filter.operators.greaterThan') },
                    { value: 'less_than', label: t('devices.filter.operators.lessThan') },
                    { value: 'greater_than_or_equals', label: t('devices.filter.operators.greaterOrEqual') },
                    { value: 'less_than_or_equals', label: t('devices.filter.operators.lessOrEqual') }
                  ] : [
                    { value: 'contains', label: t('devices.filter.operators.contains') },
                    { value: 'not_contains', label: t('devices.filter.operators.notContains') },
                    { value: 'equals', label: t('devices.filter.operators.equals') },
                    { value: 'begins_with', label: t('devices.filter.operators.beginsWith') }
                  ]}
                />
                <div className="relative">
                  {isTags && <TagIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />}
                  <Input
                    type={isNumeric ? 'number' : 'text'}
                    value={value}
                    onChange={e => {
                      const v = e.target.value;
                      setValue(v);
                      debouncedTextFilter(v, operator);
                    }}
                    placeholder={isTags ? t('devices.filter.filterByTag') : isNumeric ? t('devices.filter.enterNumber') : t('devices.filter.enterText')}
                    className={cn("h-9 text-xs", isTags && "pl-8")}
                    autoFocus
                  />
                </div>
              </div>
            )}
          </div>
          <footer className="px-4 py-3 bg-muted/10 border-t flex items-center justify-end">
             <Button variant="outline" size="sm" className="h-8 rounded-lg font-bold" onClick={() => setOpen(false)}>{t('devices.filter.done')}</Button>
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

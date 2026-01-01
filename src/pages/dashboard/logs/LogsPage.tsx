import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  History, 
  Terminal, 
  Search, 
  Download,
  RefreshCw,
  Calendar,
  Monitor,
  Tag,
  CheckCircle2,
  Check,
  ChevronsUpDown,
  X,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { getDeviceLogTypes } from '@/services/logApi';
import { filterDevices } from '@/services/deviceApi';
import { DeviceLogTable } from './DeviceLogTable';
import { CommandLogTable } from './CommandLogTable';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import { toast } from '@/store/notificationStore';

export default function LogsPage() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') || 'device') as 'device' | 'terminal';
  const urlDeviceId = (() => {
    const raw = (searchParams.get('deviceId') || '').trim();
    if (!raw) return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  })();

  // Common Filters
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - (activeTab === 'device' ? 1 : 7) * 24 * 60 * 60 * 1000).toISOString(),
    to: new Date().toISOString(),
  });
  
  // Device Selection
  const [selectedDevice, setSelectedDevice] = useState<{ id: number; name: string } | null>(null);
  const [deviceSearch, setDeviceSearch] = useState('');
  const [openDevicePicker, setOpenDevicePicker] = useState(false);

  // Device Log Specific Filters
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedOperationId, setSelectedOperationId] = useState<string>('all');

  // Command Log Specific Filters
  const [keyword, setKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Sync status filter from URL (e.g. `?tab=terminal&statuses=FAILED,EXPIRED`)
  useEffect(() => {
    const raw = (searchParams.get('statuses') || '').trim();
    if (!raw) return;
    setSelectedStatus(raw);
  }, [searchParams]);

  // Dictionary for Device Log Types
  const { data: logTypesRes } = useQuery({
    queryKey: ['device-log-types'],
    queryFn: getDeviceLogTypes,
    staleTime: Infinity,
  });

  // Device search query
  const { data: devicesRes } = useQuery({
    queryKey: ['devices-filter', deviceSearch],
    queryFn: () => filterDevices({ keyword: deviceSearch }),
    enabled: openDevicePicker,
  });

  const logTypes = logTypesRes?.data || [];
  const searchedDevices = devicesRes?.data || [];

  // Get unique types
  const logTypeCategories = useMemo(() => {
    const types = new Set<string>();
    logTypes.forEach(item => {
      if (item.type) types.add(item.type);
    });
    return Array.from(types).sort();
  }, [logTypes]);

  // Operations filtered by selected type
  const filteredOperations = useMemo(() => {
    if (selectedType === 'all') return [];
    return logTypes.filter(item => item.type === selectedType);
  }, [logTypes, selectedType]);

  const handleTabChange = (nextTab: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (nextTab === 'all') next.delete('tab');
      else next.set('tab', nextTab);
      return next;
    });
  };

  // Keep date range in sync when activeTab changes from URL
  useEffect(() => {
    if (activeTab === 'device') {
      setDateRange(prev => ({
        ...prev,
        from: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }));
    } else {
      setDateRange(prev => ({
        ...prev,
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      }));
    }
  }, [activeTab]);

  const setQuickRange = (days: number) => {
    const now = new Date();
    const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    setDateRange({
      from: from.toISOString(),
      to: now.toISOString(),
    });
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: [activeTab === 'device' ? 'device-logs' : 'device-command-logs'] });
  };

  // Helper to determine if a range is active (approximate due to time drift)
  const isQuickRangeActive = (days: number) => {
    const fromTime = new Date(dateRange.from).getTime();
    const toTime = new Date(dateRange.to).getTime();
    const diffDays = (toTime - fromTime) / (24 * 3600 * 1000);
    return diffDays > days - 0.1 && diffDays < days + 0.1;
  };

  const getFilters = () => {
    const from = new Date(dateRange.from).toISOString();
    const to = dateRange.to.includes('T') ? new Date(dateRange.to).toISOString() : new Date(dateRange.to + 'T23:59:59').toISOString();
    
    return {
      from,
      to,
      deviceId: selectedDevice?.id ?? urlDeviceId,
    };
  };

  return (
    <div className="flex flex-col gap-6 p-6 h-full animate-in fade-in duration-500 overflow-hidden">
      {/* TOPBAR: TABS & QUICK ACTIONS */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center bg-muted/30 p-1 rounded-2xl border shadow-sm w-fit">
          <button
            type="button"
            className={cn(
              'rounded-xl px-8 py-2 text-[11px] font-bold tracking-widest transition-all flex items-center gap-2',
              activeTab === 'device' ? 'bg-background text-primary shadow-sm ring-1 ring-black/5' : 'text-muted-foreground/60 hover:text-muted-foreground',
            )}
            onClick={() => handleTabChange('device')}
          >
            <History className="h-4 w-4" />
            {t('logs.tabs.deviceLogs')}
          </button>
          <button
            type="button"
            className={cn(
              'rounded-xl px-8 py-2 text-[11px] font-bold tracking-widest transition-all flex items-center gap-2',
              activeTab === 'terminal' ? 'bg-background text-primary shadow-sm ring-1 ring-black/5' : 'text-muted-foreground/60 hover:text-muted-foreground',
            )}
            onClick={() => handleTabChange('terminal')}
          >
            <Terminal className="h-4 w-4" />
            {t('logs.tabs.commandLogs')}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-muted/30 rounded-2xl p-1 border shadow-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuickRange(1)}
              className={cn("h-8 px-4 text-[10px] font-black rounded-xl transition-all", isQuickRangeActive(1) && "bg-background text-primary shadow-sm")}
            >24H</Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuickRange(7)}
              className={cn("h-8 px-4 text-[10px] font-black rounded-xl transition-all", isQuickRangeActive(7) && "bg-background text-primary shadow-sm")}
            >7D</Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuickRange(30)}
              className={cn("h-8 px-4 text-[10px] font-black rounded-xl transition-all", isQuickRangeActive(30) && "bg-background text-primary shadow-sm")}        
            >30D</Button>
          </div>
          <Button variant="outline" size="icon" className="rounded-2xl h-10 w-10 border-2 hover:bg-primary hover:text-white transition-all shadow-sm" onClick={handleRefresh}>     
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="flex items-center gap-4 flex-wrap bg-card/50 backdrop-blur-md p-4 px-6 shadow-xl shadow-black/5 border-2 rounded-[2rem]"> 
        <div className="flex items-center gap-2">
          <DateRangePicker 
            value={dateRange}
            onChange={setDateRange}
            label="Log period"
            className="!h-11"
          />
        </div>

        <Separator orientation="vertical" className="h-10 mx-2" />

        {/* Device Picker */}
        <div className="flex items-center gap-4 bg-muted/40 px-5 py-2 rounded-2xl border-2 border-transparent hover:border-primary/20 hover:bg-muted/60 transition-all min-w-[180px]">
          <Monitor className="h-5 w-5 text-primary/60 shrink-0" />
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[10px] font-black tracking-widest text-primary/40 leading-none mb-1.5">{t('logs.common.filterDevice')}</span>
            <Popover open={openDevicePicker} onOpenChange={setOpenDevicePicker}>
              <PopoverTrigger asChild>
                <div className="flex items-center justify-between gap-3 group cursor-pointer">
                   <span className={cn(
                     "text-[13px] font-bold transition-colors truncate",
                      selectedDevice ? "text-foreground" : "text-muted-foreground/50 group-hover:text-muted-foreground"
                    )}>
                     {selectedDevice ? selectedDevice.name : t('logs.common.allDevices')}
                    </span>
                   {selectedDevice ? (
                     <X 
                       className="h-4 w-4 text-muted-foreground/40 hover:text-destructive transition-colors shrink-0" 
                       onClick={(e) => {
                         e.stopPropagation();
                         setSelectedDevice(null);
                       }} 
                     />
                   ) : (
                     <ChevronsUpDown className="h-3 w-3 text-muted-foreground/20 group-hover:text-muted-foreground/40 transition-colors shrink-0" />
                   )}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0 border-none shadow-2xl rounded-2xl overflow-hidden" align="start">
                <Command shouldFilter={false}>
                  <CommandInput 
                    placeholder={t('logs.common.searchDevicePlaceholder')}
                    value={deviceSearch}
                    onValueChange={setDeviceSearch}
                    className="h-12 border-none focus:ring-0"
                  />
                  <CommandList className="max-h-[300px]">
                    <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">{t('logs.common.noDeviceFound')}</CommandEmpty>
                    <CommandGroup>
                      {searchedDevices.map((device) => (
                        <CommandItem
                          key={device.deviceId}
                          value={String(device.deviceId)}
                          onSelect={() => {
                            setSelectedDevice({ id: device.deviceId, name: device.deviceName });
                            setOpenDevicePicker(false);
                          }}
                          className="flex items-center gap-3 p-3 cursor-pointer hover:bg-primary/5 transition-colors"
                        >
                          <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                             <Monitor className="h-4 w-4 text-primary/40" />
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-bold text-sm truncate">{device.deviceName}</span>
                            <span className="text-[10px] text-muted-foreground/60 font-mono ">{device.model}</span>
                          </div>
                          {selectedDevice?.id === device.deviceId && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {activeTab === 'device' ? (
          <>
            {/* Step 1: Category */}
            <div className="flex items-center gap-4 bg-muted/40 px-5 py-2 rounded-2xl border-2 border-transparent hover:border-primary/20 transition-all min-w-[150px]">
              <Tag className="h-5 w-5 text-primary/60 shrink-0" />
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[10px] font-black tracking-widest text-primary/40 leading-none mb-1.5">{t('logs.device.operationType')}</span>
                <Select value={selectedType} onValueChange={(val) => { setSelectedType(val); setSelectedOperationId('all'); }}>
                  <SelectTrigger className="h-5 border-none bg-transparent font-bold text-[13px] p-0 focus:ring-0 shadow-none">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    <SelectItem value="all" className="font-bold">{t('logs.common.all')}</SelectItem>
                    {logTypeCategories.map(cat => (
                      <SelectItem key={cat} value={cat} className="font-medium">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Step 2: Operation */}
            {selectedType !== 'all' && (
              <div className="flex items-center gap-4 bg-muted/40 px-5 py-2 rounded-2xl border-2 border-primary/20 bg-primary/[0.02] transition-all min-w-[180px] animate-in slide-in-from-left-2 duration-300">
                <Layers className="h-5 w-5 text-primary/60 shrink-0" />
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-[10px] font-black tracking-widest text-primary/40 leading-none mb-1.5">Operation</span>
                  <Select value={selectedOperationId} onValueChange={setSelectedOperationId}>
                    <SelectTrigger className="h-5 border-none bg-transparent font-bold text-[13px] p-0 focus:ring-0 shadow-none">
                      <SelectValue placeholder="Operation" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl max-h-[400px]">
                      <SelectItem value="all" className="font-bold">{t('logs.common.all')}</SelectItem>
                      {filteredOperations.map(op => (
                        <SelectItem key={op.id} value={op.id.toString()} className="font-medium">{op.operation}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-4 bg-muted/40 px-5 py-2 rounded-2xl border-2 border-transparent hover:border-primary/20 transition-all min-w-[140px]">
              <CheckCircle2 className="h-5 w-5 text-primary/60 shrink-0" />
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[10px] font-black tracking-widest text-primary/40 leading-none mb-1.5">{t('logs.command.statusLabel')}</span>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="h-5 border-none bg-transparent font-bold text-[13px] p-0 focus:ring-0 shadow-none">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    <SelectItem value="all" className="font-bold">{t('logs.common.all')}</SelectItem>
                    <SelectItem value="PUBLISHED" className="font-medium">{t('logs.command.status.PUBLISHED')}</SelectItem>
                    <SelectItem value="CONFIRMED" className="font-medium">{t('logs.command.status.CONFIRMED')}</SelectItem>
                    <SelectItem value="COMPLETED" className="font-medium">{t('logs.command.status.COMPLETED')}</SelectItem>
                    <SelectItem value="FAILED" className="font-medium text-rose-600">{t('logs.command.status.FAILED')}</SelectItem>
                    <SelectItem value="EXPIRED" className="font-medium text-amber-600">{t('logs.command.status.EXPIRED')}</SelectItem>
                    <SelectItem value="FAILED,EXPIRED" className="font-bold text-rose-700">{t('logs.command.statusUi.PROBLEMS')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-muted/30 px-5 py-2 rounded-2xl border-2 border-muted/20 flex-1 max-w-[420px] focus-within:bg-background focus-within:border-primary/40 focus-within:shadow-lg focus-within:shadow-primary/5 transition-all">
              <Search className="h-5 w-5 text-primary/30 shrink-0" />
              <Input
                placeholder={t('logs.command.searchPlaceholder')}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="h-6 border-none bg-transparent font-bold text-[13px] p-0 focus-visible:ring-0 placeholder:text-muted-foreground/30"       
              />
            </div>
          </>
        )}

        <div className="flex items-center gap-3 ml-auto">
          <Button 
            variant="default" 
            size="sm" 
            className="h-11 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] px-8 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            onClick={() => toast.info("Export feature is coming soon")}
          >
            <Download className="mr-3 h-4 w-4" />
            {t('logs.common.export')}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {activeTab === 'device' ? (
          <DeviceLogTable
            filters={{
              ...getFilters(),
              operationIds: selectedOperationId === 'all' ? undefined : [Number(selectedOperationId)]       
            }}
            logTypes={logTypes}
          />
        ) : (
          <CommandLogTable
             searchText={keyword}
             filters={{
               ...getFilters(),
               operationId: (() => {
                 const v = keyword.trim();
                 if (!v) return undefined;
                 const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                 return uuid.test(v) ? v : undefined;
               })(),
               statuses:
                 selectedStatus === 'all'
                   ? undefined
                   : selectedStatus.split(',').map(s => s.trim()).filter(Boolean)
             }}
           />
         )}
      </div>
    </div>
  );
}
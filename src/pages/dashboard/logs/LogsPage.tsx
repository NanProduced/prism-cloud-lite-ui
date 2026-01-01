import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  History, 
  Terminal, 
  Search, 
  Download,
  RefreshCw,
  Monitor,
  Tag,
  CheckCircle2,
  Check,
  ChevronsUpDown,
  X
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
  SelectGroup,
  SelectLabel
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

  // Group log types by 'type' field
  const groupedLogTypes = useMemo(() => {
    const groups: Record<string, typeof logTypes> = {};
    logTypes.forEach(item => {
      const typeName = item.type || 'Other';
      if (!groups[typeName]) groups[typeName] = [];
      groups[typeName].push(item);
    });
    return groups;
  }, [logTypes]);

  const handleTabChange = (value: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', value);
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
    <div className="flex flex-col gap-4 p-0 h-full animate-in fade-in duration-500">
      {/* TOPBAR: TABS & QUICK ACTIONS */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center bg-muted/40 p-1 rounded-xl border shadow-inner w-fit">
          <button
            type="button"
            className={cn(
              'rounded-lg px-6 py-1.5 text-[10px] font-bold  tracking-widest transition-all flex items-center gap-1.5',
              activeTab === 'device' ? 'bg-background text-foreground shadow-sm ring-1 ring-foreground/[0.03]' : 'text-muted-foreground/60 hover:text-muted-foreground',
            )}
            onClick={() => handleTabChange('device')}
          >
            <History className="h-3.5 w-3.5" />
            {t('logs.tabs.deviceLogs')}
          </button>
          <button
            type="button"
            className={cn(
              'rounded-lg px-6 py-1.5 text-[10px] font-bold  tracking-widest transition-all flex items-center gap-1.5',
              activeTab === 'terminal' ? 'bg-background text-foreground shadow-sm ring-1 ring-foreground/[0.03]' : 'text-muted-foreground/60 hover:text-muted-foreground',
            )}
            onClick={() => handleTabChange('terminal')}
          >
            <Terminal className="h-3.5 w-3.5" />
            {t('logs.tabs.commandLogs')}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted/50 rounded-xl p-1 border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuickRange(1)}
              className={cn("h-7 px-3 text-[10px] font-bold  rounded-lg", isQuickRangeActive(1) && "bg-background shadow-sm")}
            >24H</Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuickRange(7)}
              className={cn("h-7 px-3 text-[10px] font-bold  rounded-lg", isQuickRangeActive(7) && "bg-background shadow-sm")}
            >7D</Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuickRange(30)}
              className={cn("h-7 px-3 text-[10px] font-bold  rounded-lg", isQuickRangeActive(30) && "bg-background shadow-sm")}        
            >30D</Button>
          </div>
          <Button variant="outline" size="icon" className="rounded-xl h-9 w-9" onClick={handleRefresh}>     
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="flex items-center gap-3 flex-wrap p-3 px-4 shadow-sm border rounded-2xl bg-card"> 
        <div className="flex items-center gap-2">
          <DateRangePicker 
            value={dateRange}
            onChange={setDateRange}
            label="Log period"
          />
        </div>

        <Separator orientation="vertical" className="h-8 mx-1" />

        <div className="flex items-center gap-3 bg-muted/30 px-3 py-1.5 rounded-xl border border-transparent hover:border-muted-foreground/10 transition-all">
          <Monitor className="h-4 w-4 text-muted-foreground/60" />
          <div className="flex flex-col min-w-[100px]">
            <span className="text-[9px] font-bold tracking-wider text-muted-foreground opacity-60 leading-none mb-1">{t('logs.common.filterDevice')}</span>
            <Popover open={openDevicePicker} onOpenChange={setOpenDevicePicker}>
              <PopoverTrigger asChild>
                <div className="flex items-center justify-between gap-2 group cursor-pointer">
                   <span className={cn(
                     "text-xs font-bold transition-colors truncate max-w-[120px]",
                      selectedDevice ? "text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground"
                    )}>
                     {selectedDevice ? selectedDevice.name : t('logs.common.allDevices')}
                    </span>
                   {selectedDevice ? (
                     <X 
                       className="h-3 w-3 text-muted-foreground/40 hover:text-destructive transition-colors shrink-0" 
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
              <PopoverContent className="w-64 p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput 
                    placeholder={t('logs.common.searchDevicePlaceholder')}
                    value={deviceSearch}
                    onValueChange={setDeviceSearch}
                  />
                  <CommandList>
                    <CommandEmpty>{t('logs.common.noDeviceFound')}</CommandEmpty>
                    <CommandGroup>
                      {searchedDevices.map((device) => (
                        <CommandItem
                          key={device.deviceId}
                          value={String(device.deviceId)}
                          onSelect={() => {
                            setSelectedDevice({ id: device.deviceId, name: device.deviceName });
                            setOpenDevicePicker(false);
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-bold">{device.deviceName}</span>
                            <span className="text-[10px] text-muted-foreground opacity-60 ">{device.model}</span>
                          </div>
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              selectedDevice?.id === device.deviceId ? "opacity-100" : "opacity-0"
                            )}
                          />
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
          <div className="flex items-center gap-3 bg-muted/30 px-3 py-1.5 rounded-xl border border-transparent hover:border-muted-foreground/10 transition-all">
            <Tag className="h-4 w-4 text-muted-foreground/60" />
            <div className="flex flex-col min-w-[120px]">
              <span className="text-[9px] font-bold tracking-wider text-muted-foreground opacity-60 leading-none mb-1">{t('logs.device.operationType')}</span>
              <Select value={selectedOperationId} onValueChange={setSelectedOperationId}>
                <SelectTrigger className="h-4 border-none bg-transparent font-bold text-xs p-0 focus:ring-0 shadow-none">
                  <SelectValue placeholder="All Operations" />
                </SelectTrigger>
                <SelectContent className="max-h-[400px]">
                  <SelectItem value="all">{t('logs.common.all')}</SelectItem>
                  {Object.entries(groupedLogTypes).map(([type, items]) => (
                    <SelectGroup key={type}>
                      <SelectLabel className="text-[10px] text-muted-foreground px-2 py-1 bg-muted/20 uppercase tracking-widest">{type}</SelectLabel>
                      {items.map(item => (
                        <SelectItem key={item.id} value={item.id.toString()} className="pl-4">
                           <span className="text-muted-foreground/40 font-normal mr-1">{type}-</span>
                           {item.operation}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 bg-muted/30 px-3 py-1.5 rounded-xl border border-transparent hover:border-muted-foreground/10 transition-all">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground/60" />
              <div className="flex flex-col min-w-[100px]">
                <span className="text-[9px] font-bold tracking-wider text-muted-foreground opacity-60 leading-none mb-1">{t('logs.command.status')}</span>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="h-4 border-none bg-transparent font-bold text-xs p-0 focus:ring-0 shadow-none">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('logs.common.all')}</SelectItem>
                    <SelectItem value="PUBLISHED">{t('logs.command.status.PUBLISHED')}</SelectItem>
                    <SelectItem value="CONFIRMED">{t('logs.command.status.CONFIRMED')}</SelectItem>
                    <SelectItem value="COMPLETED">{t('logs.command.status.COMPLETED')}</SelectItem>
                    <SelectItem value="FAILED">{t('logs.command.status.FAILED')}</SelectItem>
                    <SelectItem value="EXPIRED">{t('logs.command.status.EXPIRED')}</SelectItem>
                    <SelectItem value="FAILED,EXPIRED">{t('logs.command.statusUi.PROBLEMS')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-muted/20 px-3 py-1.5 rounded-xl border border-muted/10 flex-1 max-w-[240px] focus-within:bg-muted/30 focus-within:border-primary/20 transition-all">
              <Search className="h-4 w-4 text-muted-foreground/40" />
              <Input
                placeholder={t('logs.command.searchPlaceholder')}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="h-5 border-none bg-transparent font-bold text-xs p-0 focus-visible:ring-0 placeholder:text-muted-foreground/30"       
              />
            </div>
          </>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 rounded-xl text-[11px] font-bold tracking-wider px-5 shadow-sm hover:bg-primary hover:text-white transition-all border-muted-foreground/10"
            onClick={() => toast.info("Export feature is coming soon")}
          >
            <Download className="mr-2 h-4 w-4 opacity-70" />
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
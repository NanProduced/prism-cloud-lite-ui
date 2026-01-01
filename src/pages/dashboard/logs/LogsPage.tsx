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
  Clock,
  Check,
  ChevronsUpDown,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
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
import { getDeviceLogs, getDeviceCommandLogs, getDeviceLogTypes } from '@/services/logApi';
import { filterDevices } from '@/services/deviceApi';
import { DeviceLogTable } from './DeviceLogTable';
import { CommandLogTable } from './CommandLogTable';
import { useTimeFormatter } from '@/hooks/use-time-formatter';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export default function LogsPage() {
  const queryClient = useQueryClient();
  const { timeZone } = useTimeFormatter();
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
    from: new Date(Date.now() - (activeTab === 'device' ? 1 : 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
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
        from: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }));
    } else {
      setDateRange(prev => ({
        ...prev,
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }));
    }
  }, [activeTab]);

  const setQuickRange = (days: number) => {
    setDateRange({
      from: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0],
    });
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: [activeTab === 'device' ? 'device-logs' : 'device-command-logs'] });
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
              className={cn("h-7 px-3 text-[10px] font-bold  rounded-lg", dateRange.from === new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] && "bg-background shadow-sm")}
            >24H</Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuickRange(7)}
              className={cn("h-7 px-3 text-[10px] font-bold  rounded-lg", dateRange.from === new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] && "bg-background shadow-sm")}
            >7D</Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuickRange(30)}
              className={cn("h-7 px-3 text-[10px] font-bold  rounded-lg", dateRange.from === new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] && "bg-background shadow-sm")}        
            >30D</Button>
          </div>
          <Button variant="outline" size="icon" className="rounded-xl h-9 w-9" onClick={handleRefresh}>     
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <Card className="flex items-center gap-4 flex-wrap p-3 px-6 shadow-sm border rounded-2xl bg-card/50"> 
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <div className="flex items-center gap-1">
            <Input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="h-8 w-32 border-none bg-transparent font-bold text-xs p-0 focus-visible:ring-0 cursor-pointer"
            />
            <span className="text-[10px] font-bold opacity-30">TO</span>
            <Input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="h-8 w-32 border-none bg-transparent font-bold text-xs p-0 focus-visible:ring-0 cursor-pointer"
            />
          </div>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="text-[8px] font-bold  tracking-widest text-muted-foreground/50 leading-none mb-0.5">{t('logs.common.filterDevice')}</span>
            <Popover open={openDevicePicker} onOpenChange={setOpenDevicePicker}>
              <PopoverTrigger asChild>
                <div className="flex items-center gap-1 group cursor-pointer">
                   <span className={cn(
                     "text-xs font-bold transition-colors truncate max-w-[120px]",
                      selectedDevice ? "text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground"
                    )}>
                     {selectedDevice ? selectedDevice.name : t('logs.common.allDevices')}
                    </span>
                   {selectedDevice ? (
                     <X 
                       className="h-3 w-3 text-muted-foreground hover:text-destructive transition-colors" 
                       onClick={(e) => {
                         e.stopPropagation();
                         setSelectedDevice(null);
                       }} 
                     />
                   ) : (
                     <ChevronsUpDown className="h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
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

        <Separator orientation="vertical" className="h-6" />

        {activeTab === 'device' ? (
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-[8px] font-bold  tracking-widest text-muted-foreground/50 leading-none mb-0.5">{t('logs.device.operationType')}</span>
              <Select value={selectedOperationId} onValueChange={setSelectedOperationId}>
                <SelectTrigger className="h-6 border-none bg-transparent font-bold text-xs p-0 focus:ring-0 shadow-none w-32">
                  <SelectValue placeholder="All Operations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('logs.common.all')}</SelectItem>
                  {logTypes.map(type => (
                    <SelectItem key={type.id} value={type.id.toString()}>{type.operation}</SelectItem>      
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-[8px] font-bold  tracking-widest text-muted-foreground/50 leading-none mb-0.5">{t('logs.command.status')}</span>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="h-6 border-none bg-transparent font-bold text-xs p-0 focus:ring-0 shadow-none w-24">
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
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2 flex-1 max-w-[200px]">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('logs.command.searchPlaceholder')}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="h-8 border-none bg-transparent font-bold text-xs p-0 focus-visible:ring-0"       
              />
            </div>
          </>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center gap-1 mr-2 px-2 py-1 bg-muted/30 rounded-lg">
             <Clock className="h-3 w-3 text-muted-foreground/60" />
             <span className="text-[10px] font-bold text-muted-foreground/60  tracking-tight">{timeZone}</span>
          </div>
          <Button variant="outline" size="sm" className="h-8 rounded-xl text-[10px] font-bold  tracking-widest px-4">
            <Download className="mr-2 h-3.5 w-3.5" />
            {t('logs.common.export')}
          </Button>
        </div>
      </Card>

      <div className="flex-1 flex flex-col min-h-0">
        {activeTab === 'device' ? (
          <DeviceLogTable
            filters={{
              from: new Date(dateRange.from).toISOString(),
              to: new Date(dateRange.to + 'T23:59:59').toISOString(),
              deviceId: selectedDevice?.id ?? urlDeviceId,
              operationIds: selectedOperationId === 'all' ? undefined : [Number(selectedOperationId)]       
            }}
            logTypes={logTypes}
          />
        ) : (
          <CommandLogTable
             searchText={keyword}
             filters={{
               from: new Date(dateRange.from).toISOString(),
               to: new Date(dateRange.to + 'T23:59:59').toISOString(),
               deviceId: selectedDevice?.id ?? urlDeviceId,
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

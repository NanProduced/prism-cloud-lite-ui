import { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Check, 
  ChevronRight, 
  Monitor, 
  Search, 
  Loader2, 
  Power, 
  RotateCcw, 
  Sun, 
  Volume2, 
  Clock, 
  Languages, 
  Plus,
  Trash2,
  AlertCircle,
  ChevronLeft,
  CloudUpload,
  Moon,
  Film,
  Timer,
  Thermometer
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { type Device, resolveDeviceStatus } from '@/types/device';
import { executeBatchActions } from '@/services/deviceApi';
import { SlideToUnlock } from '@/components/ui/slide-to-unlock';

// --- Types ---

type ActionType = 
  | 'POWER' 
  | 'BRIGHTNESS' 
  | 'VOLUME' 
  | 'COLOR_TEMP' 
  | 'INPUT_MODE'
  | 'TIMEZONE' 
  | 'LOCALE' 
  | 'CONTENT_REPORT_SWITCH' 
  | 'CLEAR_CACHE'
  | 'SCREENSHOT';

interface ActionConfig {
  type: ActionType;
  params: any;
  timeout: number; // in minutes
}

type CommandMode = 'MULTI_DEVICE_SINGLE_COMMAND' | 'SINGLE_DEVICE_MULTI_COMMAND';

interface BatchCommandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  devices: Device[];
  initialSelectedDeviceIds?: string[];
  mode?: 'multi-device' | 'single-device'; 
}

// --- Logic Helpers ---

function formatActionParams(type: ActionType, params: any): string {
  switch (type) {
    case 'POWER':
      if (params.command === 'reboot') return 'System Reboot';
      return params.command === 'wakeup' ? 'Switch to Wake State' : 'Switch to Sleep State';
    case 'BRIGHTNESS':
      return `Brightness: ${params.brightness}%`;
    case 'VOLUME':
      return `Volume: ${params.musicvolume}/15`;
    case 'COLOR_TEMP':
      return `Color Temp: ${params.colortemp}K`;
    case 'INPUT_MODE':
      return `Input Mode: ${(params.inputmode || '').toUpperCase()}`;
    case 'TIMEZONE':
      return `${params.timezoneId} (UTC${params.timezone >= 0 ? '+' : ''}${params.timezone})`;
    case 'LOCALE': {
      const langs: any = { zh: 'Chinese', en: 'English', ja: 'Japanese' };
      return `Language: ${langs[params.language] || params.language} (${params.country})`;
    }
    case 'CONTENT_REPORT_SWITCH':
      return params.status === 1 ? 'Report Enabled' : 'Report Disabled';
    case 'CLEAR_CACHE':
      return 'Clear Terminal Cache';
    case 'SCREENSHOT':
      return 'Capture current frame';
    default:
      return '';
  }
}

// --- Main Component ---

export function BatchCommandDialog({
  open,
  onOpenChange,
  devices,
  initialSelectedDeviceIds = [],
  mode: rawMode = 'multi-device'
}: BatchCommandDialogProps) {
  const mode: CommandMode = rawMode === 'multi-device' 
    ? 'MULTI_DEVICE_SINGLE_COMMAND' 
    : 'SINGLE_DEVICE_MULTI_COMMAND';

  const [step, setStep] = useState(0);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<string>>(new Set(initialSelectedDeviceIds));
  const [actions, setActions] = useState<ActionConfig[]>([]);
  const [executionResults, setExecutionResults] = useState<Record<string, { status: string, operationId?: string, deviceId?: string }>>({});
  const [riskConfirmed, setRiskConfirmed] = useState(false);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // SSE tracking
  useEffect(() => {
    const handleOperationUpdate = (event: any) => {
      const { scope, data } = event.detail;
      const { operationId } = scope;
      const { status } = data;

      if (!operationId) return;

      setExecutionResults(prev => {
        const next = { ...prev };
        let found = false;
        for (const key in next) {
          if (String(next[key].operationId) === String(operationId)) {
            next[key] = { ...next[key], status };
            found = true;
          }
        }
        return found ? next : prev;
      });
    };

    window.addEventListener('prism.operation.updated' as any, handleOperationUpdate);
    return () => window.removeEventListener('prism.operation.updated' as any, handleOperationUpdate);
  }, []);

  useEffect(() => {
    if (open) {
      const startAtStep = initialSelectedDeviceIds.length > 0 ? 1 : 0;
      setStep(startAtStep);
      setSelectedDeviceIds(new Set(initialSelectedDeviceIds));
      setActions([]);
      setExecutionResults({});
      setRiskConfirmed(false);
      setOnlineOnly(false);
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => onOpenChange(false);

  const hasHighRisk = useMemo(() => actions.some(a => a.type === 'POWER'), [actions]);

  const canNext = useMemo(() => {
    if (step === 0) return selectedDeviceIds.size > 0;
    if (step === 1) return actions.length > 0;
    if (step === 2 && hasHighRisk) return riskConfirmed;
    return true;
  }, [step, selectedDeviceIds.size, actions.length, hasHighRisk, riskConfirmed]);

  const handleExecute = async () => {
    setIsLoading(true);
    setStep(3);
    
    try {
      const items = mode === 'MULTI_DEVICE_SINGLE_COMMAND' 
        ? Array.from(selectedDeviceIds).map(id => ({
            deviceId: id,
            action: {
              type: actions[0].type,
              body: actions[0].params
            }
          }))
        : actions.map(action => ({
            deviceId: Array.from(selectedDeviceIds)[0],
            action: {
              type: action.type,
              body: action.params
            }
          }));

      const response = await executeBatchActions({ items });
      
      if (response.success && response.data) {
        toast.success('Commands dispatched');
        const results: Record<string, any> = {};
        const apiResults = response.data.results || [];
        
        items.forEach((item, i) => {
          const apiResult = apiResults[i] || {};
          const key = mode === 'MULTI_DEVICE_SINGLE_COMMAND' ? String(item.deviceId) : `${item.deviceId}-action-${i}`;
          results[key] = { 
            status: apiResult.status || 'DISPATCHED',
            operationId: apiResult.operationId,
            deviceId: String(item.deviceId)
          };
        });
        setExecutionResults(results);
      } else {
        toast.error(response.error?.message || 'Failed to dispatch commands');
        setStep(2);
      }
    } catch (error) {
      toast.error('Network error during dispatch');
      setStep(2);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedDevicesCount = selectedDeviceIds.size;
  const currentDeviceName = devices.find(d => String(d.deviceId) === Array.from(selectedDeviceIds)[0])?.deviceName;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1000px] h-[750px] p-0 overflow-hidden border shadow-lg rounded-xl flex flex-col bg-background">
        <div className="px-8 py-6 border-b flex items-center justify-between bg-muted/10 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-xl font-bold tracking-tight">
                {mode === 'MULTI_DEVICE_SINGLE_COMMAND' ? 'Command Devices' : 'Advanced Remote Command'}
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Target:</span>
              {mode === 'MULTI_DEVICE_SINGLE_COMMAND' ? (
                <span className="font-medium text-foreground">{selectedDevicesCount} device(s)</span>
              ) : (
                <span className="font-medium text-foreground">{currentDeviceName}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={close} className="h-9 w-9 rounded-md">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-[200px] border-r bg-muted/5 flex flex-col p-6 shrink-0">
            <VerticalStepper 
              currentStep={step} 
              steps={[
                { label: 'Selection', description: 'Target scope' },
                { label: 'Parameters', description: 'Action settings' },
                { label: 'Review', description: 'Safety check' },
                { label: 'Terminal', description: 'Real-time status' }
              ]} 
            />
          </div>

          <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden p-8">
            {step === 0 && (
              <DeviceSelectStep
                devices={devices}
                selectedDeviceIds={selectedDeviceIds}
                onSelectionChange={setSelectedDeviceIds}
                locked={mode === 'SINGLE_DEVICE_MULTI_COMMAND'}
              />
            )}
            {step === 1 && (
              <ActionConfigStep
                actions={actions}
                onActionsChange={setActions}
                mode={mode}
              />
            )}
            {step === 2 && (
              <ReviewStep
                mode={mode}
                selectedDeviceIds={selectedDeviceIds}
                devices={devices}
                actions={actions}
                onActionsChange={setActions}
                riskConfirmed={riskConfirmed}
                setRiskConfirmed={setRiskConfirmed}
                onlineOnly={onlineOnly}
                setOnlineOnly={setOnlineOnly}
              />
            )}
            {step === 3 && (
              <ExecutionStep
                mode={mode}
                selectedDeviceIds={selectedDeviceIds}
                devices={devices}
                actions={actions}
                results={executionResults}
                onlineOnly={onlineOnly}
              />
            )}
          </div>
        </div>

        <div className="px-8 py-4 bg-muted/20 border-t flex items-center justify-between shrink-0">
          <div>
            {step < 3 && !(step === 1 && initialSelectedDeviceIds.length > 0) && (
              <Button 
                variant="outline" 
                onClick={step === 0 ? close : () => setStep(s => s - 1)} 
                className="px-6 h-10 gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                {step === 0 ? 'Cancel' : 'Back'}
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {step < 3 && (
              <Button 
                onClick={step === 2 ? handleExecute : () => setStep(s => s + 1)} 
                disabled={!canNext}
                className="px-8 h-10 gap-2 shadow-sm"
              >
                {step === 2 ? (
                  <><CloudUpload className="h-4 w-4" /> Dispatch Payload</>
                ) : (
                  <>Continue <ChevronRight className="h-4 w-4" /></>
                )}
              </Button>
            )}
            {step === 3 && (
              <Button 
                 onClick={close} 
                 className="px-10 h-10 bg-zinc-900 text-white hover:bg-zinc-800"
              >
                Exit Console
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function VerticalStepper({ currentStep, steps }: { currentStep: number, steps: { label: string, description: string }[] }) {
  return (
    <nav className="flex flex-col gap-6">
      {steps.map((step, idx) => {
        const isActive = idx === currentStep;
        const isCompleted = idx < currentStep;
        
        return (
          <div key={idx} className="relative flex items-start gap-4">
            {idx < steps.length - 1 && (
              <div className={cn(
                "absolute left-[11px] top-6 w-[1px] h-10",
                isCompleted ? "bg-primary" : "bg-border"
              )} />
            )}
            
            <div className={cn(
              "z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all",
              isActive ? "border-primary bg-background text-primary shadow-sm" : 
              isCompleted ? "border-primary bg-primary text-white" : "border-muted bg-muted/50 text-muted-foreground/30"
            )}>
              {isCompleted ? <Check className="h-3 w-3 stroke-[3]" /> : (
                <span className="text-[10px] font-medium">{idx + 1}</span>
              )}
            </div>

            <div className="flex flex-col gap-0.5 min-w-0">
               <span className={cn(
                 "text-xs font-bold transition-colors",
                 isActive ? "text-foreground" : "text-muted-foreground"
               )}>{step.label}</span>
               <span className={cn(
                 "text-[10px] transition-colors",
                 isActive ? "text-muted-foreground" : "text-muted-foreground/40"
               )}>{step.description}</span>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function DeviceSelectStep({ 
  devices, 
  selectedDeviceIds, 
  onSelectionChange,
  locked = false
}: { 
  devices: Device[], 
  selectedDeviceIds: Set<string>, 
  onSelectionChange: (ids: Set<string>) => void,
  locked?: boolean
}) {
  const [query, setQuery] = useState('');
  const filtered = devices.filter(d => 
    d.deviceName.toLowerCase().includes(query.toLowerCase())
  );

  const toggle = (id: string) => {
    if (locked) return;
    const next = new Set(selectedDeviceIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-left-4 duration-500">
      {!locked && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            placeholder="Search devices..." 
            className="pl-10 h-10 border rounded-lg bg-muted/5 focus-visible:ring-1"
          />
        </div>
      )}

      <div className={cn(
        "flex-1 border rounded-xl bg-muted/5 overflow-hidden flex flex-col",
        locked && "bg-muted/10 border-dashed"
      )}>
        <div className="flex items-center gap-6 px-6 py-4 bg-muted/20 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b">
          {!locked && (
            <Checkbox 
              checked={filtered.length > 0 && filtered.every(d => selectedDeviceIds.has(String(d.deviceId)))}
              onCheckedChange={(checked) => {
                const next = new Set(selectedDeviceIds);
                if (checked) filtered.forEach(d => next.add(String(d.deviceId)));
                else filtered.forEach(d => next.delete(String(d.deviceId)));
                onSelectionChange(next);
              }}
            />
          )}
          <span className="flex-1">Device Name</span>
          <span className="w-32 text-center">Telemetry</span>
          <span className="w-24 text-right">Status</span>
        </div>
        <ScrollArea className="flex-1">
          <div className="divide-y divide-border/50">
            {locked ? (
              <div className="p-20 flex flex-col items-center justify-center text-center gap-6">
                 <div className="p-6 rounded-full bg-muted">
                    <Monitor className="h-8 w-8 text-muted-foreground" />
                 </div>
                 <div>
                    <p className="text-xl font-bold">{devices.find(d => String(d.deviceId) === Array.from(selectedDeviceIds)[0])?.deviceName}</p>
                    <Badge variant="secondary" className="mt-2 font-normal">Target Locked</Badge>
                 </div>
              </div>
            ) : filtered.map(d => (
              <div 
                key={d.deviceId} 
                className={cn(
                  "flex items-center gap-6 px-6 py-4 hover:bg-primary/[0.02] cursor-pointer transition-all relative group",
                  selectedDeviceIds.has(String(d.deviceId)) ? "bg-primary/[0.04]" : "bg-transparent"
                )}
                onClick={() => toggle(String(d.deviceId))}
              >
                <Checkbox 
                  checked={selectedDeviceIds.has(String(d.deviceId))} 
                  onCheckedChange={(checked) => {
                    const next = new Set(selectedDeviceIds);
                    if (checked) next.add(String(d.deviceId));
                    else next.delete(String(d.deviceId));
                    onSelectionChange(next);
                  }} 
                  onClick={(e) => e.stopPropagation()}
                  className="rounded h-5 w-5" 
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{d.deviceName}</p>
                  <p className="text-[10px] text-muted-foreground uppercase mt-0.5">{d.model}</p>
                </div>
                <div className="w-32 flex flex-col items-center gap-1">
                   <div className="flex items-center gap-2">
                      <Sun className="h-3 w-3 text-amber-500" />
                      <span className="text-[10px] font-bold tabular-nums">{d.brightness}%</span>
                   </div>
                </div>
                <div className="w-24 text-right">
                   <Badge variant="outline" className={cn(
                     "text-[9px] uppercase h-5 border-none shadow-none px-2",
                     resolveDeviceStatus(d) === 'online' ? "bg-emerald-500/10 text-emerald-600" : 
                     resolveDeviceStatus(d) === 'pending' ? "bg-amber-500/10 text-amber-600" :
                     "bg-zinc-500/10 text-zinc-500"
                   )}>
                     {resolveDeviceStatus(d)}
                   </Badge>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

function ActionConfigStep({
  actions,
  onActionsChange,
  mode
}: {
  actions: ActionConfig[],
  onActionsChange: (actions: ActionConfig[]) => void,
  mode: CommandMode
}) {
  const ALL_ACTION_TYPES: { type: ActionType, label: string, desc: string, icon: any }[] = [
    { type: 'POWER', label: 'Power', desc: 'Manage display power state', icon: Power },
    { type: 'BRIGHTNESS', label: 'Brightness', desc: 'Adjust screen luminance', icon: Sun },
    { type: 'VOLUME', label: 'Volume', desc: 'Control acoustic output', icon: Volume2 },
    { type: 'COLOR_TEMP', label: 'Color Temp', desc: 'Adjust display color temperature', icon: Thermometer },
    { type: 'INPUT_MODE', label: 'Input Mode', desc: 'Switch video input source', icon: Monitor },
    { type: 'TIMEZONE', label: 'Timezone', desc: 'Sync system clock & region', icon: Clock },
    { type: 'LOCALE', label: 'Locale', desc: 'Set interface core dialect', icon: Languages },
    { type: 'CONTENT_REPORT_SWITCH', label: 'Reporting', desc: 'Material/Program stats report', icon: Film },
    { type: 'CLEAR_CACHE', label: 'Clear Cache', desc: 'Clear terminal storage cache', icon: Trash2 },
  ];

  const addAction = (type: ActionType) => {
    const defaultParams = getDefaultParams(type);
    const defaultTimeout = 60; 

    if (mode === 'MULTI_DEVICE_SINGLE_COMMAND') {
      onActionsChange([{ type, params: defaultParams, timeout: defaultTimeout }]);
    } else {
      if (actions.some(a => a.type === type)) {
        toast.error('Command already in queue');
        return;
      }
      onActionsChange([...actions, { type, params: defaultParams, timeout: defaultTimeout }]);
    }
  };

  const removeAction = (index: number) => {
    onActionsChange(actions.filter((_, i) => i !== index));
  };

  const updateParam = (index: number, key: string, value: any) => {
    const next = [...actions];
    next[index] = { ...next[index], params: { ...next[index].params, [key]: value } };
    onActionsChange(next);
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
         {ALL_ACTION_TYPES.map(item => {
           const isSelected = actions.some(a => a.type === item.type);
           const Icon = item.icon;
           return (
             <button
               key={item.type}
               onClick={() => addAction(item.type)}
               className={cn(
                 "action-type-btn group flex flex-col items-center justify-center p-3 rounded-lg border transition-all gap-2 relative",
                 isSelected ? "border-primary bg-primary/[0.05] ring-1 ring-primary/20" : "border-muted bg-muted/5 hover:border-primary/40"
               )}
             >
               <div className={cn(
                 "p-2 rounded-md transition-all",
                 isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground"
               )}>
                 <Icon className="h-4 w-4" />
               </div>
               <span className="text-[10px] font-bold text-center leading-tight whitespace-nowrap">{item.label}</span>
             </button>
           );
         })}
      </div>

      <div className="flex-1 flex flex-col gap-4 min-h-0">
        <ScrollArea className="flex-1 -mr-4 pr-4">
          <div className="space-y-4 pb-6">
            {actions.map((action, index) => (
              <Card key={index} className="border shadow-none relative group animate-in slide-in-from-bottom-2 duration-300">
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-primary/10 text-primary">
                      <ActionIcon type={action.type} className="h-4 w-4" />
                    </div>
                    <div>
                       <CardTitle className="text-sm font-bold">{formatActionType(action.type)}</CardTitle>
                       <CardDescription className="text-[10px]">
                         {ALL_ACTION_TYPES.find(t => t.type === action.type)?.desc}
                       </CardDescription>
                    </div>
                  </div>
                  {mode === 'SINGLE_DEVICE_MULTI_COMMAND' && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive" 
                      onClick={() => removeAction(index)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </CardHeader>
                
                <CardContent className="p-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    {action.type === 'POWER' && (
                      <div className="space-y-2 col-span-2">
                        <p className="text-[11px] font-bold uppercase text-muted-foreground">Command</p>
                        <div className="flex gap-3">
                          <Button 
                            variant={action.params.command === 'wakeup' ? 'default' : 'outline'}
                            onClick={() => updateParam(index, 'command', 'wakeup')}
                            className="flex-1 h-10 gap-2 text-xs"
                          ><Power className="h-3.5 w-3.5" /> Wake Up</Button>
                          <Button 
                            variant={action.params.command === 'sleep' ? 'default' : 'outline'}
                            onClick={() => updateParam(index, 'command', 'sleep')}
                            className="flex-1 h-10 gap-2 text-xs"
                          ><Moon className="h-3.5 w-3.5" /> Sleep</Button>
                          <Button 
                            variant={action.params.command === 'reboot' ? 'default' : 'outline'}
                            onClick={() => updateParam(index, 'command', 'reboot')}
                            className="flex-1 h-10 gap-2 text-xs"
                          ><RotateCcw className="h-3.5 w-3.5" /> Reboot</Button>
                        </div>
                      </div>
                    )}
                    {action.type === 'BRIGHTNESS' && (
                      <ControlItem label={`Brightness: ${action.params.brightness}%`} className="col-span-2">
                         <div className="pt-2 px-1">
                            <Slider value={[action.params.brightness]} onValueChange={([v]) => updateParam(index, 'brightness', v)} max={100} step={1} />
                         </div>
                      </ControlItem>
                    )}
                    {action.type === 'VOLUME' && (
                      <ControlItem label={`Volume Level: ${action.params.musicvolume}`} className="col-span-2">
                         <div className="flex items-center gap-6 bg-muted/20 p-3 rounded-md border">
                            <Volume2 className="h-4 w-4 text-primary" />
                            <Slider value={[action.params.musicvolume]} onValueChange={([v]) => updateParam(index, 'musicvolume', v)} max={15} step={1} className="flex-1" />
                            <span className="font-bold tabular-nums text-base w-6 text-primary">15</span>
                         </div>
                      </ControlItem>
                    )}
                    {action.type === 'COLOR_TEMP' && (
                      <ControlItem label={`Color Temperature: ${action.params.colortemp}K`} className="col-span-2">
                         <div className="pt-2 px-1">
                            <Slider value={[action.params.colortemp]} onValueChange={([v]) => updateParam(index, 'colortemp', v)} min={2000} max={10000} step={100} />
                         </div>
                      </ControlItem>
                    )}
                    {action.type === 'INPUT_MODE' && (
                      <ControlItem label="Input Mode" className="col-span-2">
                        <Select 
                          value={action.params.inputmode} 
                          onValueChange={(v) => updateParam(index, 'inputmode', v)}
                        >
                          <SelectTrigger className="h-9 rounded-md bg-muted/30 border border-transparent focus:border-primary/40 focus:ring-0 focus-visible:ring-0 outline-none px-3 text-xs transition-all shadow-none">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent position="popper" sideOffset={4} className="z-[101]">
                            <SelectItem value="hdmi" className="text-xs">HDMI</SelectItem>
                            <SelectItem value="dvi" className="text-xs">DVI</SelectItem>
                            <SelectItem value="vga" className="text-xs">VGA</SelectItem>
                          </SelectContent>
                        </Select>
                      </ControlItem>
                    )}
                    {action.type === 'TIMEZONE' && (
                        <ControlItem label="Select Timezone" className="col-span-2">
                          <Select 
                            value={action.params.timezoneId} 
                            onValueChange={(v) => {
                              const mapping: Record<string, number> = { 'Asia/Shanghai': 8, 'UTC': 0, 'America/New_York': -5 };
                              updateParam(index, 'timezoneId', v);
                              updateParam(index, 'timezone', mapping[v] || 0);
                            }}
                          >
                            <SelectTrigger className="h-9 rounded-md bg-muted/30 border border-transparent focus:border-primary/40 focus:ring-0 focus-visible:ring-0 outline-none px-3 text-xs transition-all shadow-none">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent position="popper" sideOffset={4} className="z-[101]">
                              <SelectItem value="Asia/Shanghai" className="text-xs">Shanghai (UTC+8)</SelectItem>
                              <SelectItem value="UTC" className="text-xs">Universal (UTC+0)</SelectItem>
                              <SelectItem value="America/New_York" className="text-xs">New York (UTC-5)</SelectItem>
                            </SelectContent>
                          </Select>
                        </ControlItem>
                    )}
                    {action.type === 'LOCALE' && (
                      <>
                        <ControlItem label="Language">
                          <Select value={action.params.language} onValueChange={(v) => updateParam(index, 'language', v)}>
                            <SelectTrigger className="h-9 rounded-md bg-muted/30 border border-transparent focus:ring-0 px-3 text-xs shadow-none">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent position="popper" sideOffset={4} className="z-[101]">
                              <SelectItem value="zh" className="text-xs">Chinese (zh)</SelectItem>
                              <SelectItem value="en" className="text-xs">English (en)</SelectItem>
                              <SelectItem value="ja" className="text-xs">Japanese (ja)</SelectItem>
                            </SelectContent>
                          </Select>
                        </ControlItem>
                        <ControlItem label="Country">
                          <Select value={action.params.country} onValueChange={(v) => updateParam(index, 'country', v)}>
                            <SelectTrigger className="h-9 rounded-md bg-muted/30 border border-transparent focus:ring-0 px-3 text-xs shadow-none">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent position="popper" sideOffset={4} className="z-[101]">
                              <SelectItem value="CN" className="text-xs">China (CN)</SelectItem>
                              <SelectItem value="US" className="text-xs">USA (US)</SelectItem>
                              <SelectItem value="JP" className="text-xs">Japan (JP)</SelectItem>
                            </SelectContent>
                          </Select>
                        </ControlItem>
                      </>
                    )}
                    {action.type === 'CONTENT_REPORT_SWITCH' && (
                      <ControlItem label="Reporting Switches" className="col-span-2">
                        <div className="flex items-center justify-between p-3 bg-primary/[0.02] border border-dashed rounded-md">
                          <div>
                             <p className="text-xs font-bold">Terminal Stats Report</p>
                             <p className="text-[10px] text-muted-foreground mt-0.5">Collect playback and material telemetry</p>
                          </div>
                          <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px]">General</span>
                              <Switch checked={action.params.status === 1} onCheckedChange={(v) => updateParam(index, 'status', v ? 1 : 0)} className="scale-75" />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px]">Program</span>
                              <Switch checked={action.params.programReportStatus === 1} onCheckedChange={(v) => updateParam(index, 'programReportStatus', v ? 1 : 0)} className="scale-75" />
                            </div>
                          </div>
                        </div>
                      </ControlItem>
                    )}
                    {action.type === 'CLEAR_CACHE' && (
                      <div className="col-span-2 flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-md">
                         <Trash2 className="h-4 w-4 text-blue-600 shrink-0" />
                         <p className="text-[11px] text-blue-900 font-medium leading-relaxed">This will clear all downloaded materials and cached data on the terminal. The device will re-download required content.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {actions.length === 0 && (
              <div 
                className="h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-lg bg-muted/5 hover:bg-muted/10 transition-colors cursor-pointer group"
                onClick={() => {(document.querySelector('.action-type-btn') as any)?.focus();}}
              >
                <div className="p-3 rounded-full bg-muted mb-3 group-hover:scale-105 transition-transform"><Plus className="h-6 w-6 text-muted-foreground" /></div>
                <p className="text-sm font-bold text-muted-foreground">Select a command type above to start</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

function ControlItem({ label, children, className }: { label: string, children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
       <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider ml-0.5">{label}</label>
       {children}
    </div>
  );
}

function ReviewStep({ 
  selectedDeviceIds, 
  devices, 
  actions,
  onActionsChange,
  riskConfirmed,
  setRiskConfirmed,
  onlineOnly,
  setOnlineOnly
}: { 
  mode: CommandMode,
  selectedDeviceIds: Set<string>, 
  devices: Device[], 
  actions: ActionConfig[],
  onActionsChange: (v: ActionConfig[]) => void,
  riskConfirmed: boolean,
  setRiskConfirmed: (v: boolean) => void,
  onlineOnly: boolean,
  setOnlineOnly: (v: boolean) => void
}) {
  const selectedDevices = Array.from(selectedDeviceIds).map(id => devices.find(d => String(d.deviceId) === id)).filter(Boolean) as Device[];
  const onlineCount = selectedDevices.filter(d => resolveDeviceStatus(d) === 'online').length;
  const pendingCount = selectedDevices.filter(d => resolveDeviceStatus(d) === 'pending').length;
  const offlineCount = selectedDevices.length - onlineCount - pendingCount;
  const hasHighRisk = actions.some(a => a.type === 'POWER');

  const updateTimeout = (index: number, val: number) => {
    const next = [...actions];
    next[index] = { ...next[index], timeout: val };
    onActionsChange(next);
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
       <div className="grid grid-cols-2 gap-4">
         <div className="p-4 border rounded-lg bg-muted/5">
           <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Target Scope</p>
           <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold tabular-nums">{selectedDeviceIds.size}</p>
              <div className="flex flex-wrap gap-1.5">
                 <Badge variant="secondary" className="text-[9px] px-1.5 h-4 bg-emerald-500/10 text-emerald-600 border-none">Online: {onlineCount}</Badge>
                 <Badge variant="secondary" className="text-[9px] px-1.5 h-4 bg-amber-500/10 text-amber-600 border-none">Pending: {pendingCount}</Badge>
                 <Badge variant="secondary" className="text-[9px] px-1.5 h-4 bg-zinc-500/10 text-zinc-500 border-none">Offline: {offlineCount}</Badge>
              </div>
           </div>
         </div>
         <div className="p-4 border rounded-lg bg-muted/5">
           <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Payload Count</p>
           <p className="text-2xl font-bold tabular-nums">{actions.length}</p>
         </div>
       </div>

       <div className="space-y-3">
         {hasHighRisk && (
           <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-lg flex items-center justify-between gap-4">
             <div className="flex items-center gap-3">
               <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
               <div>
                 <p className="text-xs font-bold text-rose-900">Critical Confirmation</p>
                 <p className="text-[10px] text-rose-800/60">Operation includes hardware state changes</p>
               </div>
             </div>
             <div className="flex items-center gap-2 px-2.5 py-1 rounded-md border border-rose-200 shrink-0">
               <Checkbox id="risk-confirm" checked={riskConfirmed} onCheckedChange={(v) => setRiskConfirmed(!!v)} className="h-4 w-4" />
               <label htmlFor="risk-confirm" className="text-[10px] font-bold cursor-pointer select-none">Confirmed</label>
             </div>
           </div>
         )}
       </div>

       <div className="flex-1 border rounded-lg overflow-hidden flex flex-col bg-muted/5">
          <div className="flex items-center gap-6 px-4 py-2 bg-muted/20 text-[10px] font-bold text-muted-foreground border-b uppercase tracking-wider">
             <span className="flex-1">Configuration Manifest</span>
             <span className="w-32 text-right">TTL (min)</span>
          </div>
          <ScrollArea className="flex-1">
             <div className="divide-y px-4">
                <div className="py-4 flex flex-wrap gap-1.5">
                    {selectedDevices.map(d => (
                        <Badge key={d.deviceId} variant="outline" className="text-[10px] font-medium bg-background px-2 h-5">{d.deviceName}</Badge>
                    ))}
                </div>
                <div className="space-y-2 py-4">
                    {actions.map((a, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 bg-background border rounded-lg shadow-sm">
                        <ActionIcon type={a.type} className="h-4 w-4 text-primary" />
                        <div className="min-w-0 flex-1">
                           <span className="text-xs font-bold">{formatActionType(a.type)}</span>
                           <p className="text-[10px] text-muted-foreground truncate">{formatActionParams(a.type, a.params)}</p>
                        </div>
                        <div className="flex items-center gap-2 border-l pl-4">
                           <Timer className="h-3 w-3 text-muted-foreground" />
                           <Select value={String(a.timeout)} onValueChange={(v) => updateTimeout(i, parseInt(v))}>
                              <SelectTrigger className="h-7 w-[90px] text-[10px] font-bold bg-muted/10 border-transparent shadow-none">
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent position="popper" sideOffset={4} className="z-[101]">
                                 <SelectItem value="15" className="text-[10px]">15m</SelectItem>
                                 <SelectItem value="60" className="text-[10px]">1h</SelectItem>
                                 <SelectItem value="1440" className="text-[10px]">24h</SelectItem>
                              </SelectContent>
                           </Select>
                        </div>
                      </div>
                    ))}
                </div>
             </div>
          </ScrollArea>
       </div>
    </div>
  );
}

function ExecutionStep({
  mode,
  selectedDeviceIds,
  devices,
  actions,
  results,
  onlineOnly
}: {
  mode: CommandMode,
  selectedDeviceIds: Set<string>,
  devices: Device[],
  actions: ActionConfig[],
  results: Record<string, any>,
  onlineOnly: boolean
}) {
  const trackingData = mode === 'MULTI_DEVICE_SINGLE_COMMAND' 
        ? Array.from(selectedDeviceIds).map(id => {
              const d = devices.find(x => String(x.deviceId) === id);
              const status = d ? resolveDeviceStatus(d) : 'offline';
              const isOnline = status === 'online';
              if (onlineOnly && !isOnline) return null;
              return { id, label: d?.deviceName || id, sub: isOnline ? 'Real-time sync' : 'Queued for heartbeat', isDevice: true, isOffline: !isOnline };
            }).filter(Boolean) as any[]
    : actions.map((a, idx) => ({ id: `${Array.from(selectedDeviceIds)[0]}-action-${idx}`, label: formatActionType(a.type), sub: formatActionParams(a.type, a.params), isDevice: false, type: a.type, isOffline: false }));

  const activeStream = trackingData.filter(t => !t.isOffline);
  const queueStream = trackingData.filter(t => t.isOffline);
  const finishedCount = Object.values(results).filter(r => ['COMPLETED', 'CONFIRMED', 'SUCCEEDED', 'FAILED', 'EXPIRED'].includes(r.status)).length;
  const isAllFinished = trackingData.length > 0 && finishedCount >= activeStream.length;

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between bg-muted/40 p-4 rounded-lg border">
        <div className="flex items-center gap-4">
          <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", isAllFinished ? "bg-emerald-500 text-white" : "bg-primary/10 text-primary")}>
             {isAllFinished ? <Check className="h-4 w-4 stroke-[3]" /> : <CloudUpload className="h-4 w-4 animate-bounce" />}
          </div>
          <div>
            <h3 className="text-sm font-bold">{isAllFinished ? 'All commands processed' : 'Commands dispatched'}</h3>
            <div className="flex items-center gap-2 mt-0.5">
               <Badge variant="outline" className={cn("border-none text-[9px] h-4 px-1.5", isAllFinished ? "bg-emerald-500/10 text-emerald-600" : "bg-blue-500/10 text-blue-600")}>
                 {isAllFinished ? <>Execution Complete</> : <><div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" /> Tracking Live</>}
               </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 border rounded-lg overflow-hidden flex flex-col relative bg-muted/5">
        <div className="flex items-center gap-6 px-4 py-2 bg-muted/20 text-[10px] font-bold text-muted-foreground border-b uppercase tracking-wider">
          <span className="flex-1">{mode === 'MULTI_DEVICE_SINGLE_COMMAND' ? 'Device' : 'Queue'}</span>
          <span className="w-32 text-center">Status</span>
        </div>
        <ScrollArea className="flex-1">
          <div className="divide-y divide-border/50">
            {activeStream.map(item => (
              <div key={item.id} className="flex items-center gap-4 px-4 py-3 group transition-all">
                <div className="flex-1 min-w-0 flex items-center gap-4">
                  <div className={cn("p-2 rounded-md bg-background border shadow-none", item.isDevice ? "text-primary" : "text-emerald-500")}>
                    {item.isDevice ? <Monitor className="h-4 w-4" /> : <ActionIcon type={(item as any).type} className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate opacity-70">{item.sub}</p>
                  </div>
                </div>
                <div className="w-32 flex justify-center">
                  <StatusBadge status={results[item.id]?.status || 'WAITING'} />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="h-1 bg-muted">
           <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${(finishedCount / trackingData.length) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'WAITING': return <Badge variant="outline" className="bg-zinc-100 text-zinc-500 border-zinc-200 gap-1.5 h-6 px-2 rounded-md"><Clock className="h-3 w-3" /><span className="text-[9px] font-bold uppercase">In Queue</span></Badge>;
    case 'DISPATCHED':
    case 'PUBLISHED': return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200 gap-1.5 h-6 px-2 rounded-md"><Loader2 className="h-3 w-3 animate-spin" /><span className="text-[9px] font-bold uppercase">Sending</span></Badge>;
    case 'ACKED':
    case 'CONFIRMED': return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200 gap-1.5 h-6 px-2 rounded-md"><Check className="h-3 w-3" /><span className="text-[9px] font-bold uppercase">Received</span></Badge>;
    case 'SUCCEEDED':
    case 'COMPLETED': return <Badge className="bg-emerald-500 text-white border-none gap-1.5 h-6 px-2 rounded-md shadow-none"><Check className="h-3 w-3 stroke-[3]" /><span className="text-[9px] font-bold uppercase">Success</span></Badge>;
    case 'FAILED':
    case 'EXPIRED': return <Badge className="bg-destructive text-white border-none gap-1.5 h-6 px-2 rounded-md shadow-none"><AlertCircle className="h-3 w-3" /><span className="text-[9px] font-bold uppercase">{status === 'EXPIRED' ? 'Expired' : 'Failed'}</span></Badge>;
    default: return <Badge variant="outline" className="opacity-20 h-6 px-2">{status}</Badge>;
  }
}

function ActionIcon({ type, className }: { type: ActionType, className?: string }) {
  switch (type) {
    case 'POWER': return <Power className={className} />;
    case 'BRIGHTNESS': return <Sun className={className} />;
    case 'VOLUME': return <Volume2 className={className} />;
    case 'COLOR_TEMP': return <Thermometer className={className} />;
    case 'INPUT_MODE': return <Monitor className={className} />;
    case 'TIMEZONE': return <Clock className={className} />;
    case 'LOCALE': return <Languages className={className} />;
    case 'CONTENT_REPORT_SWITCH': return <Film className={className} />;
    case 'CLEAR_CACHE': return <Trash2 className={className} />;
    case 'SCREENSHOT': return <Monitor className={className} />;
  }
}

function formatActionType(type: ActionType): string {
  if (type === 'COLOR_TEMP') return 'Color Temp';
  if (type === 'CONTENT_REPORT_SWITCH') return 'Reporting';
  if (type === 'INPUT_MODE') return 'Input Mode';
  return type.charAt(0) + type.slice(1).toLowerCase().replace(/_/g, ' ');
}

function getDefaultParams(type: ActionType): any {
  switch (type) {
    case 'POWER': return { command: 'wakeup' };
    case 'BRIGHTNESS': return { brightness: 50 };
    case 'VOLUME': return { musicvolume: 10 };
    case 'COLOR_TEMP': return { colortemp: 5000 };
    case 'INPUT_MODE': return { inputmode: 'hdmi' };
    case 'TIMEZONE': return { timezoneId: 'Asia/Shanghai', timezone: 8 };
    case 'LOCALE': return { language: 'en', country: 'US' };
    case 'CONTENT_REPORT_SWITCH': return { status: 1, programReportStatus: 1 };
    case 'CLEAR_CACHE': return {};
    case 'SCREENSHOT': return {};
    default: return {};
  }
}

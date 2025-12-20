import { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Check, 
  ChevronRight, 
  Zap, 
  Monitor, 
  Settings2, 
  ShieldCheck, 
  Search, 
  Loader2, 
  Power, 
  RotateCcw, 
  Sun, 
  Volume2, 
  Clock, 
  Languages, 
  Info, 
  BarChart3, 
  PlaySquare,
  Plus,
  Trash2,
  AlertCircle,
  ChevronLeft,
  Server,
  CloudUpload,
  Moon
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
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Device, Tag } from '@/types/device';

// --- Types ---

type ActionType = 
  | 'WAKE_SLEEP' 
  | 'REBOOT' 
  | 'BRIGHTNESS' 
  | 'VOLUME' 
  | 'TIMEZONE' 
  | 'LANGUAGE' 
  | 'DISPLAY_NAME' 
  | 'MATERIAL_STATS' 
  | 'PROGRAM_STATS';

interface ActionConfig {
  type: ActionType;
  params: any;
}

type CommandMode = 'MULTI_DEVICE_SINGLE_COMMAND' | 'SINGLE_DEVICE_MULTI_COMMAND';

interface BatchCommandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  devices: Device[];
  tags: Tag[];
  initialSelectedDeviceIds?: string[];
  mode?: 'multi-device' | 'single-device'; 
}

// --- Logic Helpers ---

function formatActionParams(type: ActionType, params: any): string {
  switch (type) {
    case 'WAKE_SLEEP':
      return params.state === 'wake' ? 'Switch to Wake State' : 'Switch to Sleep State';
    case 'REBOOT':
      return 'Full System Reboot';
    case 'BRIGHTNESS':
      return params.auto ? 'Automatic Brightness' : `Fixed Luminance: ${params.value}%`;
    case 'VOLUME':
      return `Volume Level: ${params.value}/15`;
    case 'TIMEZONE':
      return `${params.timezone} ${params.sync ? '(NTP Sync On)' : ''}`;
    case 'LANGUAGE': {
      const langs: any = { zh: 'Chinese', en: 'English', ja: 'Japanese' };
      return `Node Language: ${langs[params.language] || params.language}`;
    }
    case 'DISPLAY_NAME':
    case 'MATERIAL_STATS':
    case 'PROGRAM_STATS':
      return params.enabled ? 'Protocol Enabled' : 'Protocol Disabled';
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
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResults, setExecutionResults] = useState<Record<string, any>>({});
  const [riskConfirmed, setRiskConfirmed] = useState(false);
  const [includeOffline, setIncludeOffline] = useState(true);

  useEffect(() => {
    if (open) {
      setStep(initialSelectedDeviceIds.length > 0 ? 1 : 0);
      setSelectedDeviceIds(new Set(initialSelectedDeviceIds));
      setActions([]);
      setIsExecuting(false);
      setExecutionResults({});
      setRiskConfirmed(false);
      setIncludeOffline(true);
    }
  }, [open, initialSelectedDeviceIds]);

  const close = () => onOpenChange(false);

  const hasHighRisk = useMemo(() => actions.some(a => a.type === 'REBOOT' || a.type === 'WAKE_SLEEP'), [actions]);

  const canNext = useMemo(() => {
    if (step === 0) return selectedDeviceIds.size > 0;
    if (step === 1) return actions.length > 0;
    if (step === 2 && hasHighRisk) return riskConfirmed;
    return true;
  }, [step, selectedDeviceIds.size, actions.length, hasHighRisk, riskConfirmed]);

  const handleExecute = async () => {
    setIsExecuting(true);
    setStep(3);
    
    const targets = mode === 'MULTI_DEVICE_SINGLE_COMMAND' 
      ? Array.from(selectedDeviceIds) 
      : actions.map((_, i) => `${Array.from(selectedDeviceIds)[0]}-action-${i}`);

    for (const targetId of targets) {
      simulateStatusUpdate(targetId);
    }
    
    setTimeout(() => setIsExecuting(false), 500); 
  };

  const simulateStatusUpdate = async (id: string) => {
    setExecutionResults(prev => ({ ...prev, [id]: { status: 'DISPATCHED' } }));
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
    setExecutionResults(prev => ({ ...prev, [id]: { status: 'ACKED' } }));
    await new Promise(r => setTimeout(r, 1500 + Math.random() * 2000));
    const success = Math.random() > 0.1;
    setExecutionResults(prev => ({ ...prev, [id]: { status: success ? 'SUCCEEDED' : 'FAILED' } }));
  };

  const selectedDevicesCount = selectedDeviceIds.size;
  const currentDeviceName = devices.find(d => d.id === Array.from(selectedDeviceIds)[0])?.deviceName;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1000px] h-[750px] p-0 overflow-hidden border shadow-lg rounded-xl flex flex-col bg-background">
        {/* Top Header */}
        <div className="px-8 py-6 border-b flex items-center justify-between bg-muted/10 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-xl font-bold tracking-tight">
                {mode === 'MULTI_DEVICE_SINGLE_COMMAND' ? '批量下发指令' : '高级指令配置'}
              </DialogTitle>
              <Badge variant="secondary" className="font-normal text-[10px] px-2 h-5">
                {mode === 'MULTI_DEVICE_SINGLE_COMMAND' ? '多设备模式' : '单设备模式'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>已选设备:</span>
              {mode === 'MULTI_DEVICE_SINGLE_COMMAND' ? (
                <span className="font-medium text-foreground">{selectedDevicesCount} 台设备</span>
              ) : (
                <span className="font-medium text-foreground">{currentDeviceName}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={close} className="h-9 w-9 rounded-md">
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>关闭</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Navigation & Summary */}
          <div className="w-[240px] border-r bg-muted/5 flex flex-col p-6 shrink-0">
            <div className="space-y-8">
              <VerticalStepper 
                currentStep={step} 
                steps={[
                  { label: '选择设备', description: '选择目标范围' },
                  { label: '指令配置', description: '设置具体动作' },
                  { label: '确认发布', description: '最后核对检查' },
                  { label: '执行监控', description: '查看实时进度' }
                ]} 
              />

              {step > 0 && (
                <div className="pt-6 border-t space-y-4">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">执行摘要</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">待处理设备</span>
                      <span className="font-medium">{selectedDevicesCount}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">指令总数</span>
                      <span className="font-medium">{actions.length}</span>
                    </div>
                    {hasHighRisk && (
                      <div className="flex items-center gap-1.5 text-xs text-rose-500 font-medium">
                        <AlertCircle className="h-3 w-3" />
                        <span>存在高风险操作</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-auto pt-6 text-center">
               <p className="text-[10px] font-medium text-muted-foreground/50">Prism Cloud Lite v2.5</p>
            </div>
          </div>

          {/* Main Content Area */}
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
                riskConfirmed={riskConfirmed}
                setRiskConfirmed={setRiskConfirmed}
                includeOffline={includeOffline}
                setIncludeOffline={setIncludeOffline}
              />
            )}
            {step === 3 && (
              <ExecutionStep
                mode={mode}
                selectedDeviceIds={selectedDeviceIds}
                devices={devices}
                actions={actions}
                results={executionResults}
                includeOffline={includeOffline}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-muted/20 border-t flex items-center justify-between shrink-0">
          <Button 
            variant="outline" 
            onClick={step === 0 ? close : () => setStep(s => s - 1)} 
            disabled={step === 3 && isExecuting}
            className="px-6 h-10 gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            {step === 0 ? '取消' : '上一步'}
          </Button>
          
          <div className="flex items-center gap-3">
            {step < 3 && (
              <Button 
                onClick={step === 2 ? handleExecute : () => setStep(s => s + 1)} 
                disabled={!canNext}
                className="px-8 h-10 gap-2"
              >
                {step === 2 ? (
                  <><CloudUpload className="h-4 w-4" /> 确认并下发指令</>
                ) : (
                  <>继续下一步 <ChevronRight className="h-4 w-4" /></>
                )}
              </Button>
            )}
            {step === 3 && (
              <Button 
                 onClick={close} 
                 className="px-10 h-10 bg-zinc-900 text-white hover:bg-zinc-800"
              >
                关闭界面
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Sub-components ---

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
              isActive ? "border-primary bg-background text-primary" : 
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
    d.deviceName.toLowerCase().includes(query.toLowerCase()) || 
    d.id.toLowerCase().includes(query.toLowerCase())
  );

  const toggle = (id: string) => {
    if (locked) return;
    const next = new Set(selectedDeviceIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  return (
    <div className="h-full flex flex-col gap-8 animate-in fade-in slide-in-from-left-6 duration-700">
      {!locked && (
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 transition-colors group-focus-within:text-primary" />
          <Input 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            placeholder="Search Target Terminals..." 
            className="pl-14 h-16 bg-muted/20 border-none rounded-3xl font-black text-sm tracking-tight focus-visible:ring-2 focus-visible:ring-primary/20"
          />
        </div>
      )}

      <div className={cn(
        "flex-1 border-2 border-muted rounded-[3rem] bg-muted/5 overflow-hidden flex flex-col",
        locked && "bg-primary/[0.02] border-primary/20 ring-12 ring-primary/[0.01]"
      )}>
        <div className="flex items-center gap-6 px-12 py-6 bg-muted/20 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 border-b">
          {!locked && (
            <Checkbox 
              checked={filtered.length > 0 && filtered.every(d => selectedDeviceIds.has(d.id))}
              onCheckedChange={(checked) => {
                const next = new Set(selectedDeviceIds);
                if (checked) filtered.forEach(d => next.add(d.id));
                else filtered.forEach(d => next.delete(d.id));
                onSelectionChange(next);
              }}
              className="rounded-lg h-5 w-5"
            />
          )}
          <span className="flex-1">Hardware Endpoint</span>
          <span className="w-32 text-center">Telemetry</span>
          <span className="w-24 text-right">Status</span>
        </div>
        <ScrollArea className="flex-1">
          <div className="divide-y divide-foreground/[0.03]">
            {locked ? (
              <div className="p-20 flex flex-col items-center justify-center text-center gap-6">
                 <div className="p-8 rounded-[2.5rem] bg-primary/10 border-2 border-primary/20 shadow-2xl shadow-primary/10">
                    <Server className="h-12 w-12 text-primary" />
                 </div>
                 <div>
                    <p className="text-2xl font-black tracking-tighter uppercase">{devices.find(d => d.id === Array.from(selectedDeviceIds)[0])?.deviceName}</p>
                    <Badge className="bg-primary text-white border-none mt-2 px-3 h-5 text-[9px] font-black uppercase tracking-widest">Target Locked</Badge>
                 </div>
              </div>
            ) : filtered.map(d => (
              <div 
                key={d.id} 
                className={cn(
                  "flex items-center gap-6 px-12 py-6 hover:bg-primary/[0.02] cursor-pointer transition-all relative group",
                  selectedDeviceIds.has(d.id) ? "bg-primary/[0.04]" : "bg-transparent"
                )}
                onClick={() => toggle(d.id)}
              >
                {selectedDeviceIds.has(d.id) && (
                   <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary shadow-[4px_0_20px_rgba(var(--primary),0.6)] rounded-r-full" />
                )}
                <Checkbox 
                  checked={selectedDeviceIds.has(d.id)} 
                  onCheckedChange={(checked) => {
                    // Prevent row click from firing again if we click the checkbox directly
                    const next = new Set(selectedDeviceIds);
                    if (checked) next.add(d.id);
                    else next.delete(d.id);
                    onSelectionChange(next);
                  }} 
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-lg h-6 w-6 border-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" 
                />
                <div className="flex-1 min-w-0">
                  <p className="text-base font-black truncate tracking-tight uppercase">{d.deviceName}</p>
                  <p className="text-[10px] text-muted-foreground font-mono opacity-50 uppercase tracking-tighter mt-1">{d.id}</p>
                </div>
                <div className="w-32 flex flex-col items-center gap-1.5">
                   <div className="flex items-center gap-2">
                      <Sun className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-[11px] font-black tabular-nums">{d.brightness}%</span>
                   </div>
                   <div className="flex items-center gap-2 opacity-50">
                      <Volume2 className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-[11px] font-black tabular-nums">{d.volume}</span>
                   </div>
                </div>
                <div className="w-24 text-right">
                   <Badge className={cn(
                     "text-[9px] font-black uppercase tracking-widest px-3 h-6 border-none rounded-lg shadow-sm",
                     d.status === 'online' ? "bg-emerald-500 text-white" : "bg-zinc-500 text-white/70"
                   )}>
                     {d.status}
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
  const ALL_ACTION_TYPES: { type: ActionType, label: string, icon: any }[] = [
    { type: 'WAKE_SLEEP', label: 'Wake/Sleep', icon: Power },
    { type: 'REBOOT', label: 'Hard Reboot', icon: RotateCcw },
    { type: 'BRIGHTNESS', label: 'Brightness', icon: Sun },
    { type: 'VOLUME', label: 'Volume Ctrl', icon: Volume2 },
    { type: 'TIMEZONE', label: 'Set Timezone', icon: Clock },
    { type: 'LANGUAGE', label: 'Node Lang', icon: Languages },
    { type: 'DISPLAY_NAME', label: 'Screen Name', icon: Info },
    { type: 'MATERIAL_STATS', label: 'Asset Stats', icon: BarChart3 },
    { type: 'PROGRAM_STATS', label: 'Play Stats', icon: PlaySquare },
  ];

  const addAction = (type: ActionType) => {
    const defaultParams = getDefaultParams(type);
    if (mode === 'MULTI_DEVICE_SINGLE_COMMAND') {
      onActionsChange([{ type, params: defaultParams }]);
    } else {
      if (actions.some(a => a.type === type)) {
        toast.error('该指令已在队列中');
        return;
      }
      onActionsChange([...actions, { type, params: defaultParams }]);
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
    <div className="h-full flex flex-col gap-8 animate-in fade-in slide-in-from-right-6 duration-700">
      <div className="grid grid-cols-5 md:grid-cols-9 gap-2">
         {ALL_ACTION_TYPES.map(item => {
           const isSelected = actions.some(a => a.type === item.type);
           const Icon = item.icon;
           return (
             <button
               key={item.type}
               onClick={() => addAction(item.type)}
               className={cn(
                 "action-type-btn group flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-2 relative",
                 isSelected ? "border-primary bg-primary/[0.05]" : "border-muted bg-muted/5 hover:border-primary/40"
               )}
             >
               <div className={cn(
                 "p-2 rounded-lg transition-all",
                 isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground"
               )}>
                 <Icon className="h-5 w-5" />
               </div>
               <span className="text-[10px] font-bold text-center leading-tight">{item.label}</span>
               {isSelected && mode === 'MULTI_DEVICE_SINGLE_COMMAND' && (
                  <div className="absolute -top-1 -right-1 bg-primary text-white rounded-full p-0.5 shadow-sm"><Check className="h-2 w-2 stroke-[4]" /></div>
               )}
             </button>
           );
         })}
      </div>

      <div className="flex-1 flex flex-col gap-4 min-h-0">
        <div className="flex items-center justify-between">
           <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3">
             <Settings2 className="h-4 w-4 text-primary" />
             指令配置
           </h3>
           <Badge variant="outline" className="font-mono text-[10px] opacity-40 px-3 h-6 rounded-lg border-2 uppercase">{actions.length} Task(s)</Badge>
        </div>

        <ScrollArea className="flex-1 -mr-4 pr-4">
          <div className="space-y-4 pb-6">
            {actions.map((action, index) => (
              <Card key={index} className="border shadow-sm relative group animate-in slide-in-from-bottom-2 duration-300">
                <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <ActionIcon type={action.type} className="h-5 w-5" />
                    </div>
                    <div>
                       <CardTitle className="text-base font-bold">{formatActionType(action.type)}</CardTitle>
                       <CardDescription className="text-[10px] uppercase tracking-wider">指令参数设置</CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive" 
                    onClick={() => removeAction(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                
                <CardContent className="p-5 pt-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {action.type === 'WAKE_SLEEP' && (
                      <div className="space-y-3 col-span-2">
                        <p className="text-[11px] font-bold uppercase text-muted-foreground">目标电源状态</p>
                        <div className="flex gap-4">
                          <Button 
                            variant={action.params.state === 'wake' ? 'default' : 'outline'}
                            onClick={() => updateParam(index, 'state', 'wake')}
                            className="flex-1 h-12 gap-2"
                          ><Power className="h-4 w-4" /> 唤醒终端</Button>
                          <Button 
                            variant={action.params.state === 'sleep' ? 'default' : 'outline'}
                            onClick={() => updateParam(index, 'state', 'sleep')}
                            className="flex-1 h-12 gap-2"
                          ><Moon className="h-4 w-4" /> 屏幕休眠</Button>
                        </div>
                      </div>
                    )}
                    {action.type === 'BRIGHTNESS' && (
                      <>
                        <ControlItem label="自动调节">
                           <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-transparent">
                             <span className="text-xs font-medium text-foreground">自动增益控制</span>
                             <Switch checked={action.params.auto} onCheckedChange={(v) => updateParam(index, 'auto', v)} />
                           </div>
                        </ControlItem>
                        {!action.params.auto && (
                          <ControlItem label={`手动亮度: ${action.params.value}%`}>
                             <div className="pt-2 px-1">
                                <Slider value={[action.params.value]} onValueChange={([v]) => updateParam(index, 'value', v)} max={100} step={1} />
                             </div>
                          </ControlItem>
                        )}
                      </>
                    )}
                    {action.type === 'VOLUME' && (
                      <ControlItem label={`音量等级: ${action.params.value}`} className="col-span-2">
                         <div className="flex items-center gap-6 bg-muted/20 p-4 rounded-lg">
                            <Volume2 className="h-4 w-4 text-primary" />
                            <Slider value={[action.params.value]} onValueChange={([v]) => updateParam(index, 'value', v)} max={15} step={1} className="flex-1" />
                            <span className="font-bold tabular-nums text-lg w-8 text-primary">15</span>
                         </div>
                      </ControlItem>
                    )}
                    {action.type === 'TIMEZONE' && (
                      <>
                        <ControlItem label="同步协议">
                           <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                             <span className="text-xs font-medium">NTP 时间同步</span>
                             <Switch checked={action.params.sync} onCheckedChange={(v) => updateParam(index, 'sync', v)} />
                           </div>
                        </ControlItem>
                        <ControlItem label="时区设置">
                          <Select value={action.params.timezone} onValueChange={(v) => updateParam(index, 'timezone', v)}>
                            <SelectTrigger className="h-10 rounded-md bg-muted/30 border-none px-4 text-xs font-medium">
                              <SelectValue placeholder="选择时区" />
                            </SelectTrigger>
                            <SelectContent className="z-[101]">
                              <SelectItem value="UTC+8" className="text-xs">亚洲/上海 (UTC+8)</SelectItem>
                              <SelectItem value="UTC+0" className="text-xs">欧洲/伦敦 (UTC+0)</SelectItem>
                              <SelectItem value="UTC-5" className="text-xs">美洲/纽约 (UTC-5)</SelectItem>
                            </SelectContent>
                          </Select>
                        </ControlItem>
                      </>
                    )}
                    {action.type === 'LANGUAGE' && (
                      <ControlItem label="系统语言" className="col-span-2">
                        <Select value={action.params.language} onValueChange={(v) => updateParam(index, 'language', v)}>
                          <SelectTrigger className="h-10 rounded-md bg-muted/30 border-none px-4 text-xs font-medium">
                            <SelectValue placeholder="选择语言" />
                          </SelectTrigger>
                          <SelectContent className="z-[101]">
                            <SelectItem value="zh" className="text-xs">简体中文 (zh-CN)</SelectItem>
                            <SelectItem value="en" className="text-xs">Standard English (en-US)</SelectItem>
                            <SelectItem value="ja" className="text-xs">日本語 (ja-JP)</SelectItem>
                          </SelectContent>
                        </Select>
                      </ControlItem>
                    )}
                    {['DISPLAY_NAME', 'MATERIAL_STATS', 'PROGRAM_STATS'].includes(action.type) && (
                      <ControlItem label="监控配置" className="col-span-2">
                        <div className="flex items-center justify-between p-4 bg-primary/[0.02] border border-dashed rounded-lg">
                          <div>
                             <p className="text-xs font-bold">{formatActionType(action.type)} 监控</p>
                             <p className="text-[10px] text-muted-foreground mt-0.5">全局遥测数据覆盖</p>
                          </div>
                          <Switch checked={action.params.enabled} onCheckedChange={(v) => updateParam(index, 'enabled', v)} />
                        </div>
                      </ControlItem>
                    )}
                    {action.type === 'REBOOT' && (
                      <div className="col-span-2 flex items-center gap-4 p-4 bg-rose-50 border border-rose-100 rounded-lg">
                         <div className="p-2 bg-rose-100 rounded-md"><AlertCircle className="h-5 w-5 text-rose-600" /></div>
                         <p className="text-xs text-rose-900 font-medium leading-relaxed">警告：终端将执行全系统重启。所有正在播放的任务将中断，直到系统完全恢复。</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {actions.length === 0 && (
              <div 
                className="h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/5 hover:bg-muted/10 transition-colors cursor-pointer group"
                onClick={() => {
                  const firstBtn = document.querySelector('.action-type-btn') as HTMLButtonElement;
                  firstBtn?.focus();
                }}
              >
                <div className="p-4 rounded-full bg-muted mb-4 group-hover:scale-110 transition-transform"><Plus className="h-8 w-8 text-muted-foreground" /></div>
                <p className="text-sm font-bold text-muted-foreground">请从上方选择一个指令开始配置</p>
                <p className="text-[11px] text-muted-foreground/60 mt-1">支持串联多条指令按序下发</p>
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
    <div className={cn("space-y-4", className)}>
       <label className="text-[11px] font-black uppercase text-muted-foreground tracking-[0.25em] ml-2">{label}</label>
       {children}
    </div>
  );
}

function ReviewStep({
  selectedDeviceIds,
  devices,
  actions,
  riskConfirmed,
  setRiskConfirmed,
  includeOffline,
  setIncludeOffline
}: {
  mode: CommandMode,
  selectedDeviceIds: Set<string>,
  devices: Device[],
  actions: ActionConfig[],
  riskConfirmed: boolean,
  setRiskConfirmed: (v: boolean) => void,
  includeOffline: boolean,
  setIncludeOffline: (v: boolean) => void
}) {
  const selectedDevices = Array.from(selectedDeviceIds).map(id => devices.find(d => d.id === id)).filter(Boolean) as Device[];
  const onlineCount = selectedDevices.filter(d => d.status === 'online').length;
  const offlineCount = selectedDevices.length - onlineCount;
  const hasHighRisk = actions.some(a => a.type === 'REBOOT' || a.type === 'WAKE_SLEEP');

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
       <div className="grid grid-cols-2 gap-4">
         <Card className="p-5 border bg-muted/5">
           <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">执行目标范围</p>
           <div className="flex items-baseline gap-3">
              <p className="text-3xl font-bold tabular-nums">{selectedDeviceIds.size}</p>
              <div className="flex gap-1.5">
                 <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-none text-[9px]">在线: {onlineCount}</Badge>
                 <Badge variant="outline" className="bg-zinc-500/5 text-zinc-600 border-none text-[9px]">离线: {offlineCount}</Badge>
              </div>
           </div>
         </Card>
         <Card className="p-5 border bg-muted/5">
           <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">待发指令总数</p>
           <p className="text-3xl font-bold tabular-nums">{actions.length}</p>
         </Card>
       </div>

       <div className="grid grid-cols-1 gap-4">
         {hasHighRisk && (
           <div className="p-4 bg-rose-50 border border-rose-100 rounded-lg flex items-center justify-between gap-4">
             <div className="flex items-center gap-3">
               <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
               <div className="min-w-0">
                 <p className="text-xs font-bold text-rose-900">风险指令确认</p>
                 <p className="text-[10px] text-rose-800/60">包含重启或电源状态切换</p>
               </div>
             </div>
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-rose-200 shrink-0">
               <Checkbox id="risk-confirm" checked={riskConfirmed} onCheckedChange={(v) => setRiskConfirmed(!!v)} />
               <label htmlFor="risk-confirm" className="text-[10px] font-bold cursor-pointer">已知晓操作影响</label>
             </div>
           </div>
         )}

         {offlineCount > 0 && (
           <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg flex items-center justify-between gap-4">
             <div className="flex items-center gap-3">
               <Clock className="h-4 w-4 text-amber-600 shrink-0" />
               <div className="min-w-0">
                 <p className="text-xs font-bold text-amber-900">离线设备处理</p>
                 <p className="text-[10px] text-amber-800/60">指令将在此类设备上线后自动推送</p>
               </div>
             </div>
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-amber-200 shrink-0">
               <Switch checked={includeOffline} onCheckedChange={setIncludeOffline} className="scale-75" />
               <span className="text-[10px] font-bold">包含离线执行</span>
             </div>
           </div>
         )}
       </div>

       <div className="flex-1 border rounded-lg overflow-hidden flex flex-col bg-muted/5 shadow-inner">
          <div className="flex items-center gap-6 px-6 py-3 bg-muted/20 text-[10px] font-bold text-muted-foreground border-b">
             <span className="flex-1">执行目标与参数摘要</span>
             <span className="w-24 text-right">状态验证</span>
          </div>
          <ScrollArea className="flex-1">
             <div className="divide-y px-4">
                <div className="py-4">
                  <div className="flex flex-wrap gap-2">
                    {selectedDevices.map(d => (
                        <Badge key={d.id} variant="outline" className="text-[10px] font-medium bg-background px-3">
                          {d.deviceName}
                        </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 py-4">
                    {actions.map((a, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 bg-background border rounded-lg shadow-sm">
                        <div className="p-2 rounded-md bg-muted text-foreground">
                           <ActionIcon type={a.type} className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                           <span className="text-xs font-bold">{formatActionType(a.type)}</span>
                           <p className="text-[10px] text-muted-foreground">
                              {formatActionParams(a.type, a.params)}
                           </p>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-500">
                          <Check className="h-3 w-3 stroke-[3]" />
                          <span className="text-[9px] font-bold">就绪</span>
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
  includeOffline
}: {
  mode: CommandMode,
  selectedDeviceIds: Set<string>,
  devices: Device[],
  actions: ActionConfig[],
  results: Record<string, any>,
  includeOffline: boolean
}) {
  const trackingData = mode === 'MULTI_DEVICE_SINGLE_COMMAND' 
    ? Array.from(selectedDeviceIds)
        .map(id => {
          const d = devices.find(x => x.id === id);
          if (!includeOffline && d?.status !== 'online') return null;
          return { 
            id, 
            label: d?.deviceName || id,
            sub: id,
            isDevice: true,
            deviceStatus: d?.status,
            isOffline: d?.status !== 'online'
          }
        })
        .filter(Boolean) as any[]
    : actions.map((a, idx) => ({
        id: `${Array.from(selectedDeviceIds)[0]}-action-${idx}`,
        label: formatActionType(a.type),
        sub: formatActionParams(a.type, a.params),
        isDevice: false,
        type: a.type,
        isOffline: false 
      }));

  const activeStream = trackingData.filter(t => !t.isOffline);
  const queueStream = trackingData.filter(t => t.isOffline);

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between bg-muted/40 p-5 rounded-lg border">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
             <CloudUpload className="h-5 w-5 animate-bounce" />
          </div>
          <div>
            <h3 className="text-sm font-bold">指令正在同步下发</h3>
            <div className="flex items-center gap-2 mt-0.5">
               <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-none text-[9px] gap-1.5 h-5 px-2">
                 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> 实时状态 (演示)
               </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 border rounded-lg overflow-hidden flex flex-col relative bg-muted/5">
        <div className="flex items-center gap-6 px-6 py-3 bg-muted/20 text-[10px] font-bold text-muted-foreground border-b">
          <span className="flex-1">{mode === 'MULTI_DEVICE_SINGLE_COMMAND' ? '执行节点' : '指令队列'}</span>
          <span className="w-40 text-center">当前状态</span>
        </div>
        <ScrollArea className="flex-1">
          <div className="divide-y divide-border/50">
            {activeStream.map(item => (
              <div key={item.id} className="flex items-center gap-6 px-6 py-4 hover:bg-muted/10 transition-all group">
                <div className="flex-1 min-w-0 flex items-center gap-4">
                  <div className={cn(
                     "p-2 rounded-lg bg-background border shadow-sm group-hover:scale-105 transition-transform",
                     item.isDevice ? "text-primary" : "text-emerald-500"
                  )}>
                    {item.isDevice ? <Monitor className="h-4 w-4" /> : <ActionIcon type={(item as any).type} className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate opacity-70">{item.sub}</p>
                  </div>
                </div>
                <div className="w-40 flex justify-center">
                  <StatusBadge status={results[item.id]?.status || 'WAITING'} />
                </div>
              </div>
            ))}

            {queueStream.length > 0 && (
               <div className="bg-amber-500/5">
                  <div className="px-6 py-2 flex items-center gap-2 opacity-60 border-t border-dashed">
                     <Clock className="h-3 w-3" />
                     <span className="text-[9px] font-bold uppercase">排队等待中 (离线设备)</span>
                  </div>
                  {queueStream.map(item => (
                    <div key={item.id} className="flex items-center gap-6 px-6 py-3 opacity-60">
                      <div className="flex-1 min-w-0 flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-background border"><Monitor className="h-4 w-4" /></div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">{item.label}</p>
                          <p className="text-[10px] text-muted-foreground">设备上线后自动下发</p>
                        </div>
                      </div>
                      <div className="w-40 flex justify-center">
                         <StatusBadge status="WAITING" />
                      </div>
                    </div>
                  ))}
               </div>
            )}
          </div>
        </ScrollArea>

        <div className="h-1 bg-muted">
           <div 
              className="h-full bg-primary transition-all duration-1000" 
              style={{ width: `${(Object.values(results).filter(r => r.status === 'SUCCEEDED').length / trackingData.length) * 100}%` }} 
           />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'WAITING':
      return (
        <Badge variant="outline" className="bg-zinc-100 text-zinc-500 border-zinc-200 gap-2 h-8 px-4 rounded-xl">
          <Clock className="h-3.5 w-3.5" />
          <span className="text-[10px] font-black uppercase tracking-widest">In Queue</span>
        </Badge>
      );
    case 'DISPATCHED':
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200 gap-2 h-8 px-4 rounded-xl shadow-sm">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-widest">Dispatching</span>
        </Badge>
      );
    case 'ACKED':
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200 gap-2 h-8 px-4 rounded-xl shadow-sm">
          <Check className="h-3.5 w-3.5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Received</span>
        </Badge>
      );
    case 'SUCCEEDED':
      return (
        <Badge className="bg-emerald-500 text-white border-none gap-2 h-8 px-4 rounded-xl shadow-xl shadow-emerald-500/30">
          <Check className="h-3.5 w-3.5 stroke-[3]" />
          <span className="text-[10px] font-black uppercase tracking-widest">Success</span>
        </Badge>
      );
    case 'FAILED':
      return (
        <Badge className="bg-destructive text-white border-none gap-2 h-8 px-4 rounded-xl shadow-xl shadow-destructive/30">
          <AlertCircle className="h-3.5 w-3.5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Failed</span>
        </Badge>
      );
    default:
      return <Badge variant="outline" className="opacity-20 h-8 px-4">-</Badge>;
  }
}

function ActionIcon({ type, className }: { type: ActionType, className?: string }) {
  switch (type) {
    case 'WAKE_SLEEP': return <Power className={className} />;
    case 'REBOOT': return <RotateCcw className={className} />;
    case 'BRIGHTNESS': return <Sun className={className} />;
    case 'VOLUME': return <Volume2 className={className} />;
    case 'TIMEZONE': return <Clock className={className} />;
    case 'LANGUAGE': return <Languages className={className} />;
    case 'DISPLAY_NAME': return <Info className={className} />;
    case 'MATERIAL_STATS': return <BarChart3 className={className} />;
    case 'PROGRAM_STATS': return <PlaySquare className={className} />;
  }
}

function formatActionType(type: ActionType): string {
  return type.replace(/_/g, ' ');
}

function getDefaultParams(type: ActionType): any {
  switch (type) {
    case 'WAKE_SLEEP': return { state: 'wake' };
    case 'BRIGHTNESS': return { auto: true, value: 50 };
    case 'VOLUME': return { value: 10 };
    case 'TIMEZONE': return { timezone: 'UTC+8', sync: true };
    case 'LANGUAGE': return { language: 'zh' };
    case 'DISPLAY_NAME': return { enabled: true };
    case 'MATERIAL_STATS': return { enabled: true };
    case 'PROGRAM_STATS': return { enabled: true };
    default: return {};
  }
}

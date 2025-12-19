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
  Filter, 
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
  ArrowRight,
  Plus,
  Trash2,
  AlertCircle,
  LayoutGrid,
  ChevronLeft,
  Server
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

// Action Types
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

// Modes: 
// 1. MULTI_DEVICE_SINGLE_COMMAND (N Devices + 1 Command)
// 2. SINGLE_DEVICE_MULTI_COMMAND (1 Device + N Commands)
type CommandMode = 'MULTI_DEVICE_SINGLE_COMMAND' | 'SINGLE_DEVICE_MULTI_COMMAND';

interface BatchCommandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  devices: Device[];
  tags: Tag[];
  initialSelectedDeviceIds?: string[];
  // Input mode simplified to Boolean or String from parent
  mode?: 'multi-device' | 'single-device'; 
}

export function BatchCommandDialog({
  open,
  onOpenChange,
  devices,
  tags,
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

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      // If we already have device(s) selected, move to config
      // But in single-device mode, we always have 1 device, so we start at step 0 (which will be locked) or skip to 1
      setStep(initialSelectedDeviceIds.length > 0 ? 1 : 0);
      setSelectedDeviceIds(new Set(initialSelectedDeviceIds));
      setActions([]);
      setIsExecuting(false);
      setExecutionResults({});
    }
  }, [open, initialSelectedDeviceIds]);

  const close = () => onOpenChange(false);

  const canNext = useMemo(() => {
    if (step === 0) return selectedDeviceIds.size > 0;
    if (step === 1) return actions.length > 0;
    return true;
  }, [step, selectedDeviceIds.size, actions.length]);

  const handleExecute = async () => {
    setIsExecuting(true);
    setStep(3);
    
    // Mock execution based on mode
    if (mode === 'MULTI_DEVICE_SINGLE_COMMAND') {
      const devicesArray = Array.from(selectedDeviceIds);
      for (const deviceId of devicesArray) {
        await simulateStatusUpdate(deviceId);
      }
    } else {
      // SINGLE_DEVICE_MULTI_COMMAND
      const deviceId = Array.from(selectedDeviceIds)[0];
      for (let i = 0; i < actions.length; i++) {
        await simulateStatusUpdate(`${deviceId}-action-${i}`);
      }
    }
    setIsExecuting(false);
  };

  const simulateStatusUpdate = async (id: string) => {
    setExecutionResults(prev => ({ ...prev, [id]: { status: 'DISPATCHED' } }));
    await new Promise(r => setTimeout(r, 600 + Math.random() * 800));
    setExecutionResults(prev => ({ ...prev, [id]: { status: 'ACKED' } }));
    await new Promise(r => setTimeout(r, 800 + Math.random() * 1500));
    const success = Math.random() > 0.1;
    setExecutionResults(prev => ({ ...prev, [id]: { status: success ? 'SUCCEEDED' : 'FAILED' } }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1200px] h-[800px] p-0 overflow-hidden border-0 shadow-2xl rounded-[2.5rem] flex flex-row">
        {/* Left Side: Vertical Stepper */}
        <div className="w-[280px] bg-muted/30 border-r flex flex-col p-8 shrink-0">
          <div className="flex items-center gap-3 mb-12">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest leading-none">Command</h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Center</p>
            </div>
          </div>

          <VerticalStepper 
            currentStep={step} 
            steps={[
              { label: 'Nodes', description: mode === 'MULTI_DEVICE_SINGLE_COMMAND' ? 'Select targets' : 'Target Locked' },
              { label: 'Config', description: mode === 'MULTI_DEVICE_SINGLE_COMMAND' ? 'Single Action' : 'Action Builder' },
              { label: 'Confirm', description: 'Review Manifest' },
              { label: 'Status', description: 'Live Monitor' }
            ]} 
          />

          <div className="mt-auto pt-8 border-t border-muted-foreground/10 opacity-40">
             <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                Secure Protocol
             </div>
          </div>
        </div>

        {/* Right Side: Content */}
        <div className="flex-1 flex flex-col bg-background min-w-0">
          {/* Header */}
          <div className="px-10 py-6 border-b flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-black tracking-tight">
                {mode === 'MULTI_DEVICE_SINGLE_COMMAND' ? 'Multi-Device Single-Command' : 'Single-Device Multi-Command'}
              </DialogTitle>
              <p className="text-xs font-medium text-muted-foreground mt-1 uppercase tracking-wider">
                {mode === 'MULTI_DEVICE_SINGLE_COMMAND' 
                  ? `Executing on ${selectedDeviceIds.size} devices`
                  : `Target: ${devices.find(d => d.id === Array.from(selectedDeviceIds)[0])?.deviceName || 'Selected Node'}`
                }
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={close} className="rounded-full hover:bg-muted/50 -mr-4">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-hidden p-10">
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
              />
            )}
            {step === 3 && (
              <ExecutionStep
                mode={mode}
                selectedDeviceIds={selectedDeviceIds}
                devices={devices}
                actions={actions}
                results={executionResults}
              />
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-10 py-6 border-t bg-muted/5 flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={step === 0 ? close : () => setStep(s => s - 1)} 
              disabled={step === 3 && isExecuting}
              className="px-8 font-black uppercase text-[11px] tracking-[0.2em] h-12 rounded-2xl gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              {step === 0 ? 'Abort' : 'Back'}
            </Button>
            <div className="flex items-center gap-3">
              {step < 3 && (
                <Button 
                  onClick={step === 2 ? handleExecute : () => setStep(s => s + 1)} 
                  disabled={!canNext}
                  className="px-12 font-black uppercase text-[11px] tracking-[0.2em] h-12 rounded-2xl gap-3 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {step === 2 ? (
                    <><ShieldCheck className="h-4 w-4" /> Execute Manifest</>
                  ) : (
                    <>Continue <ChevronRight className="h-4 w-4" /></>
                  )}
                </Button>
              )}
              {step === 3 && !isExecuting && (
                <Button onClick={close} className="px-12 font-black uppercase text-[11px] tracking-[0.2em] h-12 rounded-2xl">
                  Close Bridge
                </Button>
              )}
            </div>
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
            {/* Step Line */}
            {idx < steps.length - 1 && (
              <div className={cn(
                "absolute left-4 top-10 w-0.5 h-6 transition-colors duration-500",
                isCompleted ? "bg-primary" : "bg-muted"
              )} />
            )}
            
            {/* Step Circle */}
            <div className={cn(
              "z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
              isActive ? "border-primary bg-background shadow-[0_0_15px_rgba(var(--primary),0.3)] scale-110" : 
              isCompleted ? "border-primary bg-primary text-white" : "border-muted bg-background text-muted-foreground/40"
            )}>
              {isCompleted ? <Check className="h-4 w-4" /> : (
                <span className="text-[10px] font-black">{idx + 1}</span>
              )}
            </div>

            <div className="flex flex-col gap-0.5 min-w-0">
               <span className={cn(
                 "text-[11px] font-black uppercase tracking-widest transition-colors",
                 isActive ? "text-foreground" : "text-muted-foreground/40"
               )}>{step.label}</span>
               <span className={cn(
                 "text-[9px] font-bold truncate opacity-60 transition-colors",
                 isActive ? "text-muted-foreground" : "text-muted-foreground/20"
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
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-left-4 duration-500">
      {!locked && (
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
          <Input 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            placeholder="Filter target devices..." 
            className="pl-12 h-14 bg-muted/20 border-none rounded-2xl font-bold"
          />
        </div>
      )}

      <div className={cn(
        "flex-1 border-2 border-muted rounded-[2rem] bg-muted/5 overflow-hidden flex flex-col",
        locked && "bg-primary/[0.02] border-primary/10 ring-8 ring-primary/[0.01]"
      )}>
        <div className="flex items-center gap-6 px-10 py-5 bg-muted/20 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 border-b">
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
          <span className="flex-1">Hardware Node</span>
          <span className="w-32 text-center">Telemetry</span>
          <span className="w-24 text-right">State</span>
        </div>
        <ScrollArea className="flex-1">
          <div className="divide-y divide-foreground/[0.03]">
            {locked ? (
              <div className="p-10 flex flex-col items-center justify-center text-center gap-4">
                 <div className="p-6 rounded-full bg-primary/10 border-2 border-primary/20">
                    <Server className="h-10 w-10 text-primary" />
                 </div>
                 <div>
                    <p className="text-lg font-black tracking-tight">{devices.find(d => d.id === Array.from(selectedDeviceIds)[0])?.deviceName}</p>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase mt-1 tracking-widest">Device Selection Immutable</p>
                 </div>
              </div>
            ) : filtered.map(d => (
              <div 
                key={d.id} 
                className={cn(
                  "flex items-center gap-6 px-10 py-5 hover:bg-primary/[0.02] cursor-pointer transition-all relative group",
                  selectedDeviceIds.has(d.id) ? "bg-primary/[0.04]" : "grayscale opacity-60 hover:grayscale-0 hover:opacity-100"
                )}
                onClick={() => toggle(d.id)}
              >
                {selectedDeviceIds.has(d.id) && (
                   <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary shadow-[2px_0_15px_rgba(var(--primary),0.4)] rounded-r-full" />
                )}
                <Checkbox checked={selectedDeviceIds.has(d.id)} onCheckedChange={() => {}} className="rounded-lg h-5 w-5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black truncate tracking-tight">{d.deviceName}</p>
                  <p className="text-[9px] text-muted-foreground font-mono opacity-50 uppercase tracking-tighter mt-1">{d.id}</p>
                </div>
                <div className="w-32 flex flex-col items-center gap-1">
                   <div className="flex items-center gap-2">
                      <Sun className="h-3 w-3 text-amber-500" />
                      <span className="text-[10px] font-black">{d.brightness}%</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <Volume2 className="h-3 w-3 text-blue-500" />
                      <span className="text-[10px] font-black">{d.volume}</span>
                   </div>
                </div>
                <div className="w-24 text-right">
                   <Badge className={cn(
                     "text-[8px] font-black uppercase tracking-widest px-2 h-5 border-none",
                     d.status === 'online' ? "bg-emerald-500 shadow-lg shadow-emerald-500/20" : "bg-zinc-400"
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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

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
      setEditingIndex(0);
    } else {
      if (actions.some(a => a.type === type)) {
        toast.error('Instruction already in queue');
        return;
      }
      const next = [...actions, { type, params: defaultParams }];
      onActionsChange(next);
      setEditingIndex(next.length - 1);
    }
  };

  const removeAction = (index: number) => {
    onActionsChange(actions.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  const updateParam = (index: number, key: string, value: any) => {
    const next = [...actions];
    next[index] = { ...next[index], params: { ...next[index].params, [key]: value } };
    onActionsChange(next);
  };

  return (
    <div className="h-full flex flex-col gap-10 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Action Selection Grid */}
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
         {ALL_ACTION_TYPES.map(item => {
           const isSelected = actions.some(a => a.type === item.type);
           const Icon = item.icon;
           return (
             <button
               key={item.type}
               onClick={() => addAction(item.type)}
               className={cn(
                 "group flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2",
                 isSelected ? "border-primary bg-primary/[0.03] shadow-lg shadow-primary/5" : "border-muted bg-muted/5 hover:border-primary/40 hover:bg-muted/10 grayscale opacity-70 hover:grayscale-0 hover:opacity-100"
               )}
             >
               <div className={cn(
                 "p-2 rounded-xl transition-colors",
                 isSelected ? "bg-primary text-white" : "bg-muted group-hover:bg-primary/20 group-hover:text-primary"
               )}>
                 <Icon className="h-5 w-5" />
               </div>
               <span className="text-[9px] font-black uppercase tracking-tighter whitespace-nowrap">{item.label}</span>
             </button>
           );
         })}
      </div>

      <Separator />

      {/* Action Editor */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        <div className="flex items-center justify-between">
           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
             <Settings2 className="h-3.5 w-3.5" />
             Instruction Payload {mode === 'MULTI_DEVICE_SINGLE_COMMAND' ? '(Global)' : '(Sequence)'}
           </h3>
           <Badge variant="outline" className="font-mono text-[9px] opacity-40">{actions.length} COMMANDS</Badge>
        </div>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {actions.map((action, index) => (
              <div key={index} className="bg-background border-2 rounded-[1.5rem] p-8 shadow-sm relative group animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
                      <ActionIcon type={action.type} className="h-5 w-5" />
                    </div>
                    <div>
                       <span className="text-base font-black uppercase tracking-tight">{formatActionType(action.type)}</span>
                       <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">Node Configuration</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => removeAction(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {action.type === 'WAKE_SLEEP' && (
                    <div className="space-y-4 col-span-2">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Command Target State</p>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => updateParam(index, 'state', 'wake')}
                          className={cn(
                            "flex-1 h-14 rounded-2xl border-2 font-black uppercase text-xs transition-all",
                            action.params.state === 'wake' ? "border-primary bg-primary/5 text-primary" : "border-muted hover:border-primary/40"
                          )}
                        >Wake Terminal</button>
                        <button 
                          onClick={() => updateParam(index, 'state', 'sleep')}
                          className={cn(
                            "flex-1 h-14 rounded-2xl border-2 font-black uppercase text-xs transition-all",
                            action.params.state === 'sleep' ? "border-primary bg-primary/5 text-primary" : "border-muted hover:border-primary/40"
                          )}
                        >Suspend Screen</button>
                      </div>
                    </div>
                  )}
                  {action.type === 'BRIGHTNESS' && (
                    <>
                      <ControlItem label="Intelligent Auto-Adjust">
                         <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl">
                           <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ambient Light Sensor</span>
                           <Switch checked={action.params.auto} onCheckedChange={(v) => updateParam(index, 'auto', v)} />
                         </div>
                      </ControlItem>
                      {!action.params.auto && (
                        <ControlItem label={`Manual Luminance: ${action.params.value}%`}>
                           <div className="pt-2 px-1">
                              <Slider value={[action.params.value]} onValueChange={([v]) => updateParam(index, 'value', v)} max={100} step={1} />
                           </div>
                        </ControlItem>
                      )}
                    </>
                  )}
                  {action.type === 'VOLUME' && (
                    <ControlItem label={`Audio Gain Output: ${action.params.value}`} className="col-span-2">
                       <div className="pt-4 px-1 flex items-center gap-6">
                          <Volume2 className="h-5 w-5 text-blue-500 opacity-40" />
                          <Slider value={[action.params.value]} onValueChange={([v]) => updateParam(index, 'value', v)} max={15} step={1} />
                          <span className="font-black tabular-nums text-lg w-8">15</span>
                       </div>
                    </ControlItem>
                  )}
                  {action.type === 'TIMEZONE' && (
                    <>
                      <ControlItem label="Network Time Sync (NTP)">
                         <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl">
                           <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Online Clock Master</span>
                           <Switch checked={action.params.sync} onCheckedChange={(v) => updateParam(index, 'sync', v)} />
                         </div>
                      </ControlItem>
                      <ControlItem label="Geographic Offset">
                        <Select value={action.params.timezone} onValueChange={(v) => updateParam(index, 'timezone', v)}>
                          <SelectTrigger className="h-14 rounded-2xl bg-muted/20 border-none font-bold">
                            <SelectValue placeholder="Select Timezone" />
                          </SelectTrigger>
                          <SelectContent className="z-[101]">
                            <SelectItem value="UTC+8" className="font-bold uppercase text-[10px]">Asia/Shanghai (UTC+8)</SelectItem>
                            <SelectItem value="UTC+0" className="font-bold uppercase text-[10px]">Europe/London (UTC+0)</SelectItem>
                            <SelectItem value="UTC-5" className="font-bold uppercase text-[10px]">America/New York (UTC-5)</SelectItem>
                          </SelectContent>
                        </Select>
                      </ControlItem>
                    </>
                  )}
                  {action.type === 'LANGUAGE' && (
                    <ControlItem label="Interface Dialect" className="col-span-2">
                      <Select value={action.params.language} onValueChange={(v) => updateParam(index, 'language', v)}>
                        <SelectTrigger className="h-14 rounded-2xl bg-muted/20 border-none font-bold">
                          <SelectValue placeholder="Select Language" />
                        </SelectTrigger>
                        <SelectContent className="z-[101]">
                          <SelectItem value="zh" className="font-bold uppercase text-[10px]">Simplified Chinese (zh-CN)</SelectItem>
                          <SelectItem value="en" className="font-bold uppercase text-[10px]">Standard English (en-US)</SelectItem>
                          <SelectItem value="ja" className="font-bold uppercase text-[10px]">Japanese Nihongo (ja-JP)</SelectItem>
                        </SelectContent>
                      </Select>
                    </ControlItem>
                  )}
                  {['DISPLAY_NAME', 'MATERIAL_STATS', 'PROGRAM_STATS'].includes(action.type) && (
                    <ControlItem label="Operation Protocol" className="col-span-2">
                      <div className="flex items-center justify-between p-5 bg-primary/[0.02] border-2 border-dashed border-primary/20 rounded-2xl">
                        <div>
                           <p className="text-xs font-black uppercase tracking-tight">{formatActionType(action.type)} State</p>
                           <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">Global switch for node feedback</p>
                        </div>
                        <Switch checked={action.params.enabled} onCheckedChange={(v) => updateParam(index, 'enabled', v)} />
                      </div>
                    </ControlItem>
                  )}
                  {action.type === 'REBOOT' && (
                    <div className="col-span-2 flex items-center gap-4 p-6 bg-rose-500/5 border-2 border-rose-500/10 rounded-2xl">
                       <AlertCircle className="h-6 w-6 text-rose-500 shrink-0" />
                       <p className="text-[11px] text-rose-700/80 font-bold uppercase leading-relaxed">Safety Protocol: Requesting a full hardware power cycle. The terminal will be unavailable for approx. 120 seconds after deployment.</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {actions.length === 0 && (
              <div className="h-64 flex flex-col items-center justify-center opacity-10 grayscale border-4 border-dashed rounded-[3rem] animate-pulse">
                <Plus className="h-16 w-16 mb-4" />
                <p className="text-sm font-black uppercase tracking-[0.3em]">Initialize Instruction</p>
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
    <div className={cn("space-y-3", className)}>
       <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.15em] ml-1">{label}</label>
       {children}
    </div>
  );
}

function ReviewStep({ 
  mode,
  selectedDeviceIds, 
  devices, 
  actions 
}: { 
  mode: CommandMode,
  selectedDeviceIds: Set<string>, 
  devices: Device[], 
  actions: ActionConfig[] 
}) {
  return (
    <div className="h-full flex flex-col space-y-10 animate-in fade-in zoom-in-95 duration-500">
       <div className="grid grid-cols-2 gap-6">
         <div className="p-8 rounded-[2.5rem] bg-primary/[0.03] border-2 border-primary/10 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><Monitor className="h-20 w-20" /></div>
           <p className="text-[10px] font-black uppercase text-primary/50 mb-2 tracking-widest">Nodes Identified</p>
           <p className="text-5xl font-black tabular-nums tracking-tighter">{selectedDeviceIds.size}</p>
         </div>
         <div className="p-8 rounded-[2.5rem] bg-emerald-500/[0.03] border-2 border-emerald-500/10 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><Zap className="h-20 w-20" /></div>
           <p className="text-[10px] font-black uppercase text-emerald-500/50 mb-2 tracking-widest">Active Instructions</p>
           <p className="text-5xl font-black tabular-nums tracking-tighter">{actions.length}</p>
         </div>
       </div>

       <div className="flex-1 border-2 border-muted rounded-[3rem] bg-muted/5 overflow-hidden flex flex-col shadow-inner relative">
          <div className="flex items-center gap-6 px-12 py-5 bg-muted/20 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 border-b">
             <span className="flex-1">Target Resource</span>
             <span className="w-48 text-center">Protocol Hash</span>
             <span className="w-24 text-right">Scope</span>
          </div>
          <ScrollArea className="flex-1">
             <div className="divide-y divide-foreground/[0.04] p-6">
                {/* Devices Summary */}
                <div className="mb-10 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-4 mb-4 flex items-center gap-3">
                    <div className="h-1 w-6 bg-primary rounded-full" /> Endpoint List
                  </p>
                  <div className="flex flex-wrap gap-2 px-4">
                    {Array.from(selectedDeviceIds).map(id => {
                      const d = devices.find(x => x.id === id);
                      return (
                        <Badge key={id} variant="outline" className="text-[9px] font-black uppercase py-1.5 px-3 rounded-lg border-2 bg-background shadow-sm">
                          {d?.deviceName || id}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {/* Operations Summary */}
                <div className="space-y-4 pt-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60 ml-4 mb-4 flex items-center gap-3">
                    <div className="h-1 w-6 bg-emerald-500 rounded-full" /> Instruction Chain
                  </p>
                  <div className="space-y-3 px-4">
                    {actions.map((a, i) => (
                      <div key={i} className="flex items-center gap-6 p-5 bg-background rounded-[1.5rem] border-2 shadow-sm group hover:border-primary/30 transition-all">
                        <div className="p-3 rounded-xl bg-muted text-foreground group-hover:bg-primary group-hover:text-white transition-colors shadow-inner">
                           <ActionIcon type={a.type} className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                           <span className="text-xs font-black uppercase tracking-widest">{formatActionType(a.type)}</span>
                           <div className="flex items-center gap-2 mt-1 opacity-40">
                              <span className="text-[9px] font-mono truncate">{JSON.stringify(a.params)}</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 text-primary">
                           <ArrowRight className="h-3 w-3" />
                           <span className="text-[9px] font-black">DEQUEUED</span>
                        </div>
                      </div>
                    ))}
                  </div>
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
  results
}: {
  mode: CommandMode,
  selectedDeviceIds: Set<string>,
  devices: Device[],
  actions: ActionConfig[],
  results: Record<string, any>
}) {
  // Tracking Targets:
  // If MULTI_DEVICE: each entry is a device
  // If SINGLE_DEVICE: each entry is an action
  const trackingData = mode === 'MULTI_DEVICE_SINGLE_COMMAND' 
    ? Array.from(selectedDeviceIds).map(id => ({ 
        id, 
        label: devices.find(d => d.id === id)?.deviceName || id,
        sub: id,
        isDevice: true,
        deviceStatus: devices.find(d => d.id === id)?.status
      }))
    : actions.map((a, idx) => ({
        id: `${Array.from(selectedDeviceIds)[0]}-action-${idx}`,
        label: formatActionType(a.type),
        sub: JSON.stringify(a.params),
        isDevice: false,
        type: a.type
      }));

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between bg-primary/5 p-6 rounded-[2rem] border-2 border-primary/10">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
             <Zap className="h-6 w-6 text-white animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight">Signal Bridge Active</h3>
            <div className="flex items-center gap-3 mt-1">
               <Badge variant="outline" className="bg-background text-emerald-600 border-emerald-500/20 text-[9px] font-black uppercase tracking-widest gap-1.5 h-5 px-2">
                 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> SSE LIVE STREAM
               </Badge>
            </div>
          </div>
        </div>
        <Badge variant="outline" className="h-10 px-6 rounded-xl border-2 font-mono text-xs opacity-50 uppercase">Session: {Math.random().toString(36).substring(7).toUpperCase()}</Badge>
      </div>

      <div className="flex-1 border-2 border-muted rounded-[2.5rem] bg-muted/5 overflow-hidden flex flex-col relative">
        <div className="flex items-center gap-6 px-12 py-5 bg-muted/20 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 border-b">
          <span className="flex-1">{mode === 'MULTI_DEVICE_SINGLE_COMMAND' ? 'Node Endpoint' : 'Instruction Chain'}</span>
          <span className="w-48 text-center">Execution Lifecycle</span>
        </div>
        <ScrollArea className="flex-1">
          <div className="divide-y divide-foreground/[0.03]">
            {trackingData.map(item => {
              const res = results[item.id] || { status: 'WAITING' };
              const isOffline = item.isDevice && item.deviceStatus === 'offline';
              
              return (
                <div key={item.id} className="flex items-center gap-6 px-12 py-6 hover:bg-muted/10 transition-all relative group">
                  <div className="flex-1 min-w-0 flex items-center gap-4">
                    {item.isDevice ? (
                       <div className="p-3 rounded-xl bg-card border-2 shadow-sm text-primary group-hover:scale-110 transition-transform">
                          <Monitor className="h-5 w-5" />
                       </div>
                    ) : (
                       <div className="p-3 rounded-xl bg-card border-2 shadow-sm text-emerald-500 group-hover:scale-110 transition-transform">
                          <ActionIcon type={(item as any).type} className="h-5 w-5" />
                       </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-black truncate tracking-tight">{item.label}</p>
                      <p className="text-[10px] font-mono text-muted-foreground opacity-40 truncate max-w-[400px] mt-1 uppercase tracking-tighter">{item.sub}</p>
                    </div>
                  </div>
                  <div className="w-48 flex justify-center">
                    <StatusBadge status={isOffline ? 'WAITING' : res.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        {/* Progress HUD */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-2 bg-black/80 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl">
           <div className="flex -space-x-2 px-2">
              {trackingData.slice(0, 5).map(t => (
                <div key={t.id} className={cn(
                  "w-2 h-2 rounded-full border border-black transition-colors",
                  results[t.id]?.status === 'SUCCEEDED' ? "bg-emerald-500" : "bg-muted"
                )} />
              ))}
           </div>
           <span className="text-[9px] font-black text-white px-2 uppercase tracking-tighter opacity-60">Real-time Telemetry Processing</span>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'WAITING':
      return (
        <Badge variant="outline" className="bg-zinc-500/10 text-zinc-500 border-zinc-200/50 gap-2 h-7 px-3 rounded-lg">
          <Clock className="h-3 w-3" />
          <span className="text-[10px] font-black uppercase tracking-widest">Pending</span>
        </Badge>
      );
    case 'DISPATCHED':
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200 gap-2 h-7 px-3 rounded-lg shadow-sm">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-widest">In Transit</span>
        </Badge>
      );
    case 'ACKED':
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200 gap-2 h-7 px-3 rounded-lg shadow-sm">
          <Check className="h-3 w-3" />
          <span className="text-[10px] font-black uppercase tracking-widest">Received</span>
        </Badge>
      );
    case 'SUCCEEDED':
      return (
        <Badge className="bg-emerald-500 text-white border-none gap-2 h-7 px-3 rounded-lg shadow-lg shadow-emerald-500/20">
          <Check className="h-3 w-3" />
          <span className="text-[10px] font-black uppercase tracking-widest">Success</span>
        </Badge>
      );
    case 'FAILED':
      return (
        <Badge className="bg-destructive text-white border-none gap-2 h-7 px-3 rounded-lg shadow-lg shadow-destructive/20">
          <AlertCircle className="h-3 w-3" />
          <span className="text-[10px] font-black uppercase tracking-widest">Terminal Error</span>
        </Badge>
      );
    case 'TIMEOUT':
      return (
        <Badge className="bg-zinc-800 text-white border-none gap-2 h-7 px-3 rounded-lg">
          <Clock className="h-3 w-3" />
          <span className="text-[10px] font-black uppercase tracking-widest">Timeout</span>
        </Badge>
      );
    default:
      return <Badge variant="outline" className="opacity-20 h-7 px-3">-</Badge>;
  }
}

// Sub-components & Helpers

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
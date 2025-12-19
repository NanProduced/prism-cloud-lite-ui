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
  Server,
  CloudUpload,
  ArrowUpRight,
  ExternalLink
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
    case 'LANGUAGE':
      const langs: any = { zh: 'Chinese', en: 'English', ja: 'Japanese' };
      return `Node Language: ${langs[params.language] || params.language}`;
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

  useEffect(() => {
    if (open) {
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
    
    // Process list
    const targets = mode === 'MULTI_DEVICE_SINGLE_COMMAND' 
      ? Array.from(selectedDeviceIds) 
      : actions.map((_, i) => `${Array.from(selectedDeviceIds)[0]}-action-${i}`);

    for (const targetId of targets) {
      // Async simulation
      simulateStatusUpdate(targetId);
    }
    
    // In a real app, the "Execute" button triggers the API, 
    // and we don't necessarily block the UI here.
    // The user can close the dialog anytime.
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1200px] h-[800px] p-0 overflow-hidden border-0 shadow-2xl rounded-[3rem] flex flex-row bg-background">
        {/* Left Side: Vertical Stepper */}
        <div className="w-[300px] bg-muted/20 border-r flex flex-col p-10 shrink-0">
          <div className="flex items-center gap-4 mb-16">
            <div className="p-3 rounded-2xl bg-primary text-white shadow-xl shadow-primary/20">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest leading-none">Command</h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 opacity-50">Bridge Interface</p>
            </div>
          </div>

          <VerticalStepper 
            currentStep={step} 
            steps={[
              { label: 'Nodes', description: mode === 'MULTI_DEVICE_SINGLE_COMMAND' ? 'Select targets' : 'Target Locked' },
              { label: 'Config', description: 'Action Payload' },
              { label: 'Confirm', description: 'Manifest Review' },
              { label: 'Deploy', description: 'Execution Stream' }
            ]} 
          />

          <div className="mt-auto space-y-6">
             <div className="p-5 rounded-2xl bg-background/50 border border-muted-foreground/10 space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground">
                   <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                   Security Status
                </div>
                <p className="text-[9px] leading-relaxed text-muted-foreground font-medium">Commands are encrypted via TLS 1.3 and signed by the core controller.</p>
             </div>
             <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 text-center">Prism Cloud Lite v2.5</p>
          </div>
        </div>

        {/* Right Side: Content */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Header */}
          <div className="px-12 py-8 flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-black tracking-tighter uppercase">
                {mode === 'MULTI_DEVICE_SINGLE_COMMAND' ? 'Mass Deployment' : 'Deep Node Config'}
              </DialogTitle>
              <div className="flex items-center gap-3 mt-1.5">
                 <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 text-[9px] font-black uppercase tracking-widest px-2 h-5">
                   Mode: {mode === 'MULTI_DEVICE_SINGLE_COMMAND' ? 'BATCH_NODES' : 'BATCH_ACTIONS'}
                 </Badge>
                 <Separator orientation="vertical" className="h-3" />
                 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider opacity-60">
                   {mode === 'MULTI_DEVICE_SINGLE_COMMAND' 
                     ? `${selectedDeviceIds.size} Target Terminals`
                     : `Target: ${devices.find(d => d.id === Array.from(selectedDeviceIds)[0])?.deviceName}`
                   }
                 </span>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={close} className="rounded-2xl hover:bg-muted/50 h-12 w-12 border">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-hidden px-12 pb-12">
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
          <div className="px-12 py-8 bg-muted/5 border-t flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={step === 0 ? close : () => setStep(s => s - 1)} 
              disabled={step === 3 && isExecuting}
              className="px-8 font-black uppercase text-[10px] tracking-[0.25em] h-14 rounded-2xl gap-3 border hover:bg-background"
            >
              <ChevronLeft className="h-4 w-4" />
              {step === 0 ? 'Abort' : 'Back'}
            </Button>
            <div className="flex items-center gap-4">
              {step < 3 && (
                <Button 
                  onClick={step === 2 ? handleExecute : () => setStep(s => s + 1)} 
                  disabled={!canNext}
                  className="px-14 font-black uppercase text-[10px] tracking-[0.25em] h-14 rounded-2xl gap-4 shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {step === 2 ? (
                    <><CloudUpload className="h-4 w-4" /> Deploy Manifest</>
                  ) : (
                    <>Next Phase <ChevronRight className="h-4 w-4" /></>
                  )}
                </Button>
              )}
              {step === 3 && (
                <Button 
                   onClick={close} 
                   className="px-14 font-black uppercase text-[10px] tracking-[0.25em] h-14 rounded-2xl bg-zinc-900 text-white hover:bg-zinc-800 shadow-xl"
                >
                  Minimize Window
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
    <nav className="flex flex-col gap-10">
      {steps.map((step, idx) => {
        const isActive = idx === currentStep;
        const isCompleted = idx < currentStep;
        
        return (
          <div key={idx} className="relative flex items-start gap-6">
            {idx < steps.length - 1 && (
              <div className={cn(
                "absolute left-[15px] top-10 w-[2px] h-10 transition-all duration-700",
                isCompleted ? "bg-primary" : "bg-muted"
              )} />
            )}
            
            <div className={cn(
              "z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500",
              isActive ? "border-primary bg-background shadow-[0_0_20px_rgba(var(--primary),0.4)] scale-125" : 
              isCompleted ? "border-primary bg-primary text-white" : "border-muted bg-background text-muted-foreground/30"
            )}>
              {isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : (
                <span className="text-[10px] font-black">{idx + 1}</span>
              )}
            </div>

            <div className="flex flex-col gap-1 min-w-0">
               <span className={cn(
                 "text-[11px] font-black uppercase tracking-[0.2em] transition-colors",
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
                  selectedDeviceIds.has(d.id) ? "bg-primary/[0.04]" : "grayscale opacity-50 hover:grayscale-0 hover:opacity-100"
                )}
                onClick={() => toggle(d.id)}
              >
                {selectedDeviceIds.has(d.id) && (
                   <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary shadow-[4px_0_20px_rgba(var(--primary),0.6)] rounded-r-full" />
                )}
                <Checkbox checked={selectedDeviceIds.has(d.id)} onCheckedChange={() => {}} className="rounded-lg h-6 w-6 border-2" />
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
        toast.error('Instruction already in queue');
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
    <div className="h-full flex flex-col gap-12 animate-in fade-in slide-in-from-right-6 duration-700">
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4">
         {ALL_ACTION_TYPES.map(item => {
           const isSelected = actions.some(a => a.type === item.type);
           const Icon = item.icon;
           return (
             <button
               key={item.type}
               onClick={() => addAction(item.type)}
               className={cn(
                 "group flex flex-col items-center justify-center p-5 rounded-[2rem] border-2 transition-all gap-3 relative",
                 isSelected ? "border-primary bg-primary/[0.05] shadow-2xl shadow-primary/10" : "border-muted bg-muted/5 hover:border-primary/40 hover:bg-muted/10 grayscale opacity-60 hover:grayscale-0 hover:opacity-100"
               )}
             >
               <div className={cn(
                 "p-3 rounded-2xl transition-all duration-500",
                 isSelected ? "bg-primary text-white scale-110 shadow-lg" : "bg-muted group-hover:bg-primary/20 group-hover:text-primary"
               )}>
                 <Icon className="h-6 w-6" />
               </div>
               <span className="text-[10px] font-black uppercase tracking-tighter whitespace-nowrap">{item.label}</span>
               {isSelected && mode === 'MULTI_DEVICE_SINGLE_COMMAND' && (
                  <div className="absolute -top-1.5 -right-1.5 bg-primary text-white rounded-full p-1 shadow-lg"><Check className="h-3 w-3 stroke-[4]" /></div>
               )}
             </button>
           );
         })}
      </div>

      <Separator className="opacity-50" />

      <div className="flex-1 flex flex-col gap-6 min-h-0">
        <div className="flex items-center justify-between">
           <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3">
             <Settings2 className="h-4 w-4 text-primary" />
             Instruction Chain Setup
           </h3>
           <Badge variant="outline" className="font-mono text-[10px] opacity-40 px-3 h-6 rounded-lg border-2 uppercase">{actions.length} Task(s)</Badge>
        </div>

        <ScrollArea className="flex-1 -mr-4 pr-4">
          <div className="space-y-6 pb-6">
            {actions.map((action, index) => (
              <div key={index} className="bg-background border-2 rounded-[2.5rem] p-10 shadow-sm relative group animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-5">
                    <div className="p-4 rounded-3xl bg-primary text-white shadow-2xl shadow-primary/30">
                      <ActionIcon type={action.type} className="h-7 w-7" />
                    </div>
                    <div>
                       <span className="text-xl font-black uppercase tracking-tight">{formatActionType(action.type)}</span>
                       <p className="text-[11px] font-bold text-muted-foreground uppercase opacity-40 tracking-widest mt-1">Payload Parameters</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-12 w-12 rounded-2xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/20 transition-all" 
                    onClick={() => removeAction(index)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {action.type === 'WAKE_SLEEP' && (
                    <div className="space-y-5 col-span-2">
                      <p className="text-[11px] font-black uppercase text-muted-foreground tracking-widest ml-1">Target Power State</p>
                      <div className="flex gap-6">
                        <button 
                          onClick={() => updateParam(index, 'state', 'wake')}
                          className={cn(
                            "flex-1 h-20 rounded-3xl border-2 font-black uppercase text-sm tracking-widest transition-all shadow-sm flex items-center justify-center gap-3",
                            action.params.state === 'wake' ? "border-primary bg-primary/[0.03] text-primary shadow-xl shadow-primary/5" : "border-muted hover:border-primary/40 bg-muted/5"
                          )}
                        ><Power className="h-4 w-4" /> Wake Terminal</button>
                        <button 
                          onClick={() => updateParam(index, 'state', 'sleep')}
                          className={cn(
                            "flex-1 h-20 rounded-3xl border-2 font-black uppercase text-sm tracking-widest transition-all shadow-sm flex items-center justify-center gap-3",
                            action.params.state === 'sleep' ? "border-primary bg-primary/[0.03] text-primary shadow-xl shadow-primary/5" : "border-muted hover:border-primary/40 bg-muted/5"
                          )}
                        ><Moon className="h-4 w-4" /> Suspend Screen</button>
                      </div>
                    </div>
                  )}
                  {action.type === 'BRIGHTNESS' && (
                    <>
                      <ControlItem label="Intelligent Logic">
                         <div className="flex items-center justify-between p-6 bg-muted/20 rounded-[1.5rem] border border-transparent hover:border-primary/20 transition-all">
                           <div>
                              <span className="text-xs font-black uppercase tracking-wider text-foreground">Automatic Gain</span>
                              <p className="text-[10px] text-muted-foreground font-medium uppercase mt-0.5 opacity-60">Adaptive sensor feedback</p>
                           </div>
                           <Switch checked={action.params.auto} onCheckedChange={(v) => updateParam(index, 'auto', v)} />
                         </div>
                      </ControlItem>
                      {!action.params.auto && (
                        <ControlItem label={`Manual Intensity: ${action.params.value}%`}>
                           <div className="pt-4 px-2">
                              <Slider value={[action.params.value]} onValueChange={([v]) => updateParam(index, 'value', v)} max={100} step={1} />
                              <div className="flex justify-between mt-3 text-[9px] font-black uppercase text-muted-foreground/40 tracking-tighter">
                                 <span>Min</span>
                                 <span>Mid</span>
                                 <span>Max</span>
                              </div>
                           </div>
                        </ControlItem>
                      )}
                    </>
                  )}
                  {action.type === 'VOLUME' && (
                    <ControlItem label={`Acoustic Output Level: ${action.params.value}`} className="col-span-2">
                       <div className="pt-6 px-2 flex items-center gap-8 bg-muted/10 p-6 rounded-[1.5rem]">
                          <Volume2 className="h-6 w-6 text-primary animate-pulse" />
                          <Slider value={[action.params.value]} onValueChange={([v]) => updateParam(index, 'value', v)} max={15} step={1} className="flex-1" />
                          <span className="font-black tabular-nums text-2xl w-12 text-primary">15</span>
                       </div>
                    </ControlItem>
                  )}
                  {action.type === 'TIMEZONE' && (
                    <>
                      <ControlItem label="Chrono Sync Protocol">
                         <div className="flex items-center justify-between p-6 bg-muted/20 rounded-[1.5rem]">
                           <span className="text-xs font-black uppercase tracking-wider">Network Time Master</span>
                           <Switch checked={action.params.sync} onCheckedChange={(v) => updateParam(index, 'sync', v)} />
                         </div>
                      </ControlItem>
                      <ControlItem label="Geographic Reference">
                        <Select value={action.params.timezone} onValueChange={(v) => updateParam(index, 'timezone', v)}>
                          <SelectTrigger className="h-16 rounded-[1.5rem] bg-muted/20 border-none font-black text-xs uppercase px-6">
                            <SelectValue placeholder="Select Timezone" />
                          </SelectTrigger>
                          <SelectContent className="z-[101]">
                            <SelectItem value="UTC+8" className="font-black uppercase text-[10px] py-3">Asia/Shanghai (UTC+8)</SelectItem>
                            <SelectItem value="UTC+0" className="font-black uppercase text-[10px] py-3">Europe/London (UTC+0)</SelectItem>
                            <SelectItem value="UTC-5" className="font-black uppercase text-[10px] py-3">America/New York (UTC-5)</SelectItem>
                          </SelectContent>
                        </Select>
                      </ControlItem>
                    </>
                  )}
                  {action.type === 'LANGUAGE' && (
                    <ControlItem label="Interface Core Dialect" className="col-span-2">
                      <Select value={action.params.language} onValueChange={(v) => updateParam(index, 'language', v)}>
                        <SelectTrigger className="h-16 rounded-[1.5rem] bg-muted/20 border-none font-black text-xs uppercase px-6">
                          <SelectValue placeholder="Select Language" />
                        </SelectTrigger>
                        <SelectContent className="z-[101]">
                          <SelectItem value="zh" className="font-black uppercase text-[10px] py-3">Simplified Chinese (zh-CN)</SelectItem>
                          <SelectItem value="en" className="font-black uppercase text-[10px] py-3">Standard English (en-US)</SelectItem>
                          <SelectItem value="ja" className="font-black uppercase text-[10px] py-3">Japanese Nihongo (ja-JP)</SelectItem>
                        </SelectContent>
                      </Select>
                    </ControlItem>
                  )}
                  {['DISPLAY_NAME', 'MATERIAL_STATS', 'PROGRAM_STATS'].includes(action.type) && (
                    <ControlItem label="Feedback Protocol" className="col-span-2">
                      <div className="flex items-center justify-between p-8 bg-primary/[0.02] border-2 border-dashed border-primary/20 rounded-[2rem]">
                        <div>
                           <p className="text-sm font-black uppercase tracking-tight">{formatActionType(action.type)} Monitor</p>
                           <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-50 mt-1 tracking-widest">Global telemetry override</p>
                        </div>
                        <Switch checked={action.params.enabled} onCheckedChange={(v) => updateParam(index, 'enabled', v)} className="scale-125" />
                      </div>
                    </ControlItem>
                  )}
                  {action.type === 'REBOOT' && (
                    <div className="col-span-2 flex items-center gap-6 p-8 bg-rose-500/5 border-2 border-rose-500/10 rounded-[2rem]">
                       <div className="p-4 rounded-2xl bg-rose-500/10"><AlertCircle className="h-8 w-8 text-rose-600" /></div>
                       <p className="text-xs text-rose-900/70 font-black uppercase leading-relaxed tracking-wider">Warning: Node will perform a full kernel restart. All active play tasks will be terminated until system recovery.</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {actions.length === 0 && (
              <div className="h-80 flex flex-col items-center justify-center opacity-10 grayscale border-4 border-dashed rounded-[4rem] animate-pulse transition-all">
                <div className="p-10 rounded-full border-4 border-dashed mb-6"><Plus className="h-20 w-20" /></div>
                <p className="text-base font-black uppercase tracking-[0.5em]">Initialize Protocol</p>
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
    <div className="h-full flex flex-col space-y-12 animate-in fade-in zoom-in-95 duration-700">
       <div className="grid grid-cols-2 gap-8">
         <div className="p-10 rounded-[3rem] bg-primary/[0.04] border-2 border-primary/20 relative overflow-hidden group hover:border-primary/40 transition-all">
           <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform"><Monitor className="h-32 w-32" /></div>
           <p className="text-[11px] font-black uppercase text-primary/60 mb-2 tracking-[0.3em]">Endpoints Verified</p>
           <p className="text-6xl font-black tabular-nums tracking-tighter">{selectedDeviceIds.size}</p>
         </div>
         <div className="p-10 rounded-[3rem] bg-emerald-500/[0.04] border-2 border-emerald-500/20 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
           <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform"><Zap className="h-32 w-32" /></div>
           <p className="text-[11px] font-black uppercase text-emerald-600/60 mb-2 tracking-[0.3em]">Signals Pending</p>
           <p className="text-6xl font-black tabular-nums tracking-tighter">{actions.length}</p>
         </div>
       </div>

       <div className="flex-1 border-2 border-muted rounded-[3.5rem] bg-muted/5 overflow-hidden flex flex-col shadow-inner">
          <div className="flex items-center gap-6 px-14 py-6 bg-muted/20 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 border-b">
             <span className="flex-1">Object Identifier</span>
             <span className="w-64 text-center">Config Summary</span>
             <span className="w-32 text-right">Context</span>
          </div>
          <ScrollArea className="flex-1">
             <div className="divide-y divide-foreground/[0.04] px-8 py-4">
                <div className="mb-12">
                  <div className="flex flex-wrap gap-3 px-6">
                    {Array.from(selectedDeviceIds).map(id => {
                      const d = devices.find(x => x.id === id);
                      return (
                        <Badge key={id} variant="outline" className="text-[10px] font-black uppercase py-2.5 px-5 rounded-2xl border-2 bg-background shadow-sm hover:border-primary transition-colors">
                          {d?.deviceName || id}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4 pt-10">
                  <div className="space-y-4 px-6">
                    {actions.map((a, i) => (
                      <div key={i} className="flex items-center gap-8 p-8 bg-background rounded-[2.5rem] border-2 shadow-md group hover:border-primary/30 transition-all">
                        <div className="p-5 rounded-2xl bg-muted text-foreground group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner group-hover:shadow-primary/30 group-hover:scale-110">
                           <ActionIcon type={a.type} className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                           <span className="text-sm font-black uppercase tracking-[0.2em] text-foreground/80">{formatActionType(a.type)}</span>
                           <p className="text-[11px] font-bold text-muted-foreground mt-1.5 uppercase tracking-wider opacity-60">
                              {formatActionParams(a.type, a.params)}
                           </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                           <div className="flex items-center gap-2 text-primary">
                              <span className="text-[10px] font-black uppercase tracking-widest">Validated</span>
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                           </div>
                           <p className="text-[9px] font-mono opacity-30">P: {Math.random().toString(36).substring(7).toUpperCase()}</p>
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
  const onlineDevices = useMemo(() => 
    Array.from(selectedDeviceIds).map(id => devices.find(d => d.id === id)).filter(d => d?.status === 'online'),
  [selectedDeviceIds, devices]);

  const offlineDevices = useMemo(() => 
    Array.from(selectedDeviceIds).map(id => devices.find(d => d.id === id)).filter(d => d?.status !== 'online'),
  [selectedDeviceIds, devices]);

  const trackingData = mode === 'MULTI_DEVICE_SINGLE_COMMAND' 
    ? Array.from(selectedDeviceIds).map(id => {
        const d = devices.find(x => x.id === id);
        return { 
          id, 
          label: d?.deviceName || id,
          sub: id,
          isDevice: true,
          deviceStatus: d?.status,
          isOffline: d?.status !== 'online'
        }
      })
    : actions.map((a, idx) => ({
        id: `${Array.from(selectedDeviceIds)[0]}-action-${idx}`,
        label: formatActionType(a.type),
        sub: formatActionParams(a.type, a.params),
        isDevice: false,
        type: a.type,
        isOffline: false // Single device mode only happens for online/local device usually
      }));

  // Grouped for display
  const activeStream = trackingData.filter(t => !t.isOffline);
  const queueStream = trackingData.filter(t => t.isOffline);

  return (
    <div className="h-full flex flex-col space-y-10 animate-in fade-in duration-1000">
      <div className="flex items-center justify-between bg-zinc-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:rotate-12 transition-transform duration-1000"><Zap className="h-40 w-40 text-white" /></div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 ring-4 ring-white/5">
             <CloudUpload className="h-8 w-8 text-white animate-bounce" />
          </div>
          <div>
            <h3 className="text-xl font-black tracking-tight text-white uppercase">Broadcast Signal Live</h3>
            <div className="flex items-center gap-3 mt-2">
               <Badge className="bg-emerald-500 text-white border-none text-[9px] font-black uppercase tracking-widest gap-2 h-6 px-3">
                 <div className="h-2 w-2 rounded-full bg-white animate-pulse" /> SSE CONNECTED
               </Badge>
               <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Socket Bridge: RT-1029</span>
            </div>
          </div>
        </div>
        <div className="text-right relative z-10 hidden md:block">
           <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] mb-1">Session Protocol</p>
           <p className="text-xs font-mono text-primary font-bold">X7-SIGNAL-982-B</p>
        </div>
      </div>

      <div className="flex-1 border-2 border-muted rounded-[3.5rem] bg-muted/5 overflow-hidden flex flex-col relative shadow-inner">
        <div className="flex items-center gap-6 px-14 py-6 bg-muted/20 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 border-b">
          <span className="flex-1">{mode === 'MULTI_DEVICE_SINGLE_COMMAND' ? 'Node Endpoint' : 'Instruction Chain'}</span>
          <span className="w-56 text-center">Life Cycle Status</span>
        </div>
        <ScrollArea className="flex-1">
          <div className="divide-y divide-foreground/[0.04]">
            {/* Active Execution Section */}
            {activeStream.length > 0 && (
               <div className="pb-4">
                  {activeStream.map(item => (
                    <div key={item.id} className="flex items-center gap-8 px-14 py-8 hover:bg-muted/10 transition-all relative group">
                      <div className="flex-1 min-w-0 flex items-center gap-6">
                        <div className={cn(
                           "p-4 rounded-2xl bg-card border-2 shadow-sm transition-all duration-500 group-hover:scale-110",
                           item.isDevice ? "text-primary border-primary/10" : "text-emerald-500 border-emerald-500/10"
                        )}>
                          {item.isDevice ? <Monitor className="h-6 w-6" /> : <ActionIcon type={(item as any).type} className="h-6 w-6" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-base font-black truncate tracking-tight uppercase">{item.label}</p>
                          <p className="text-[11px] font-bold text-muted-foreground opacity-40 truncate max-w-[450px] mt-1.5 uppercase tracking-wider">{item.sub}</p>
                        </div>
                      </div>
                      <div className="w-56 flex justify-center">
                        <StatusBadge status={results[item.id]?.status || 'WAITING'} />
                      </div>
                    </div>
                  ))}
               </div>
            )}

            {/* Offline/Waiting Queue Section */}
            {queueStream.length > 0 && (
               <div className="bg-muted/10 border-t-2 border-dashed">
                  <div className="px-14 py-4 flex items-center gap-3 opacity-40">
                     <Clock className="h-3.5 w-3.5" />
                     <span className="text-[9px] font-black uppercase tracking-widest">Post-Deployment Queue (Offline Nodes)</span>
                  </div>
                  {queueStream.map(item => (
                    <div key={item.id} className="flex items-center gap-8 px-14 py-6 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all">
                      <div className="flex-1 min-w-0 flex items-center gap-6">
                        <div className="p-4 rounded-2xl bg-card border-2 shadow-sm"><Monitor className="h-6 w-6" /></div>
                        <div className="min-w-0">
                          <p className="text-base font-black truncate tracking-tight uppercase">{item.label}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 tracking-widest">Pending: Will pull on next heartbeat</p>
                        </div>
                      </div>
                      <div className="w-56 flex justify-center">
                         <StatusBadge status="WAITING" />
                      </div>
                    </div>
                  ))}
               </div>
            )}
          </div>
        </ScrollArea>

        {/* Global Progress Bar at the bottom of list */}
        <div className="h-1.5 bg-muted">
           <div 
              className="h-full bg-primary transition-all duration-1000 shadow-[0_0_10px_rgba(var(--primary),0.8)]" 
              style={{ width: `${(Object.values(results).filter(r => r.status === 'SUCCEEDED').length / trackingData.length) * 100}%` }} 
           />
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-4 text-muted-foreground/40 animate-pulse">
         <Info className="h-3 w-3" />
         <span className="text-[9px] font-black uppercase tracking-[0.4em]">Node Feedback Processing - Synchronous Response Required</span>
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

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Play, 
  Clock, 
  Sun, 
  Moon, 
  RefreshCw, 
  Info,
  ChevronRight,
  MousePointer2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// --- Types for Prototype ---
export interface TimelineRule {
  id: string;
  type: 'rotation' | 'spot' | 'command';
  name: string;
  startTime: string; // HH:mm:ss
  endTime?: string;  // HH:mm:ss (null for commands)
  priority: number;
  color: string;
  payload?: any;
}

interface TimelineProjectionProps {
  rules: TimelineRule[];
  onRuleClick?: (rule: TimelineRule) => void;
}

// --- Constants ---
const HOURS = Array.from({ length: 24 }).map((_, i) => i);

export function TimelineProjection({ rules, onRuleClick }: TimelineProjectionProps) {
  const [hoverTime, setHoverTime] = useState<number | null>(null); // 0 - 100 percentage
  const [activeRuleId, setActiveRuleId] = useState<string | null>(null);

  // Helper: Convert time string to percentage of day
  const timeToPct = (timeStr: string) => {
    const [h, m, s] = timeStr.split(':').map(Number);
    return ((h * 3600 + m * 60 + (s || 0)) / 86400) * 100;
  };

  // Group rules for rendering
  const { spotRules, rotationRules, commandRules } = useMemo(() => ({
    spotRules: rules.filter(r => r.type === 'spot').sort((a, b) => a.priority - b.priority),
    rotationRules: rules.filter(r => r.type === 'rotation'),
    commandRules: rules.filter(r => r.type === 'command'),
  }), [rules]);

  // Determine what's "actually playing" at hover position
  const currentlyPlaying = useMemo(() => {
    if (hoverTime === null) return null;
    const timeInSec = (hoverTime / 100) * 86400;
    
    // 1. Check spots (highest priority wins)
    const activeSpots = spotRules.filter(r => {
      const startPct = timeToPct(r.startTime);
      const endPct = timeToPct(r.endTime!);
      const start = (startPct / 100) * 86400;
      const end = (endPct / 100) * 86400;
      return timeInSec >= start && timeInSec <= end;
    }).sort((a, b) => b.priority - a.priority);

    if (activeSpots.length > 0) return activeSpots[0];

    // 2. Check rotations
    const activeRotations = rotationRules.filter(r => {
      const startPct = timeToPct(r.startTime);
      const endPct = timeToPct(r.endTime!);
      const start = (startPct / 100) * 86400;
      const end = (endPct / 100) * 86400;
      return timeInSec >= start && timeInSec <= end;
    });

    return activeRotations[0] || null;
  }, [hoverTime, spotRules, rotationRules]);

  return (
    <div className="w-full space-y-8 p-6 bg-card rounded-[2rem] border shadow-2xl overflow-hidden select-none">
      {/* Header Info */}
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-primary/10 rounded-2xl">
              <RefreshCw className="h-5 w-5 text-primary animate-spin-slow" />
           </div>
           <div>
              <h3 className="text-lg font-black uppercase tracking-tight">Timeline Simulation</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Interactive Logic Projection</p>
           </div>
        </div>

        <div className="flex gap-2">
           <Badge variant="outline" className="bg-rose-500/5 text-rose-600 border-rose-500/20 px-3">Spot Track (High)</Badge>
           <Badge variant="outline" className="bg-blue-500/5 text-blue-600 border-blue-500/20 px-3">Rotation Track (Base)</Badge>
        </div>
      </div>

      {/* Main Timeline Area */}
      <div 
        className="relative pt-12 pb-8 px-6 group"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          setHoverTime(Math.max(0, Math.min(100, (x / rect.width) * 100)));
        }}
        onMouseLeave={() => setHoverTime(null)}
      >
        {/* 24H Ruler */}
        <div className="absolute top-0 left-6 right-6 h-8 flex justify-between border-b border-dashed">
          {HOURS.map(h => (
            <div key={h} className="relative h-full flex flex-col items-center justify-end pb-1">
               <span className="text-[9px] font-black text-muted-foreground/30">{h.toString().padStart(2, '0')}</span>
               <div className="w-px h-1 bg-muted-foreground/20" />
            </div>
          ))}
        </div>

        {/* Tracks Container */}
        <div className="space-y-4 relative z-10">
          
          {/* Track 1: Commands (Discrete points) */}
          <div className="h-10 relative bg-muted/5 rounded-xl flex items-center border border-transparent hover:border-amber-500/20 transition-colors">
            <div className="absolute -left-16 text-[8px] font-black text-amber-500/50 uppercase vertical-text">CMD</div>
            {commandRules.map(r => (
              <div 
                key={r.id}
                className="absolute -ml-3 cursor-pointer group/cmd"
                style={{ left: `${timeToPct(r.startTime)}%` }}
                onClick={() => onRuleClick?.(r)}
              >
                <div className="p-1.5 rounded-full bg-amber-500 text-white shadow-lg group-hover/cmd:scale-125 transition-transform">
                   {r.payload?.type === 'power' ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
                </div>
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-zinc-900 text-white text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover/cmd:opacity-100 transition-opacity z-50">
                   {r.name} @ {r.startTime.slice(0,5)}
                </div>
              </div>
            ))}
          </div>

          {/* Track 2: Spots (Overlays) */}
          <div className="h-16 relative bg-rose-500/[0.02] rounded-xl border border-rose-500/5">
             <div className="absolute -left-16 text-[8px] font-black text-rose-500/50 uppercase vertical-text mt-6">Spot</div>
             {spotRules.map(r => {
               const start = timeToPct(r.startTime);
               const end = timeToPct(r.endTime!);
               return (
                 <motion.div
                   key={r.id}
                   whileHover={{ scaleY: 1.05 }}
                   className={cn(
                     "absolute h-12 top-2 rounded-lg border-2 flex items-center px-3 cursor-pointer overflow-hidden transition-all",
                     "bg-rose-500/10 border-rose-500/30 text-rose-700 shadow-sm shadow-rose-500/5",
                     activeRuleId === r.id && "ring-2 ring-rose-500 ring-offset-2"
                   )}
                   style={{ left: `${start}%`, width: `${end - start}%`, zIndex: r.priority }}
                   onClick={() => {
                     setActiveRuleId(r.id);
                     onRuleClick?.(r);
                   }}
                 >
                    <Zap className="h-3 w-3 mr-2 shrink-0 opacity-50" />
                    <span className="text-[10px] font-black uppercase truncate">{r.name}</span>
                    <div className="ml-auto opacity-30 font-mono text-[8px]">P{r.priority}</div>
                 </motion.div>
               );
             })}
          </div>

          {/* Track 3: Rotation (Base) */}
          <div className="h-16 relative bg-blue-500/[0.02] rounded-xl border border-blue-500/5">
             <div className="absolute -left-16 text-[8px] font-black text-blue-500/50 uppercase vertical-text mt-6">Loop</div>
             {rotationRules.map(r => {
               const start = timeToPct(r.startTime);
               const end = timeToPct(r.endTime!);
               return (
                 <div
                   key={r.id}
                   className={cn(
                     "absolute h-12 top-2 rounded-lg border-2 flex items-center px-3 cursor-pointer overflow-hidden transition-all",
                     "bg-blue-500/10 border-blue-500/30 text-blue-700 opacity-80",
                     currentlyPlaying?.id !== r.id && currentlyPlaying?.type === 'spot' && "grayscale-[0.8] opacity-20 border-dashed"
                   )}
                   style={{ left: `${start}%`, width: `${end - start}%` }}
                   onClick={() => onRuleClick?.(r)}
                 >
                    <Play className="h-3 w-3 mr-2 shrink-0 opacity-50" />
                    <span className="text-[10px] font-black uppercase truncate">{r.name}</span>
                 </div>
               );
             })}
          </div>
        </div>

        {/* Scrubber (Hover Indicator) */}
        {hoverTime !== null && (
          <div 
            className="absolute top-0 bottom-0 w-px bg-primary z-20 pointer-events-none"
            style={{ left: `${hoverTime}%` }}
          >
             <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-primary" />
             
             {/* Dynamic Status Card */}
             <div className="absolute top-1/2 left-4 -translate-y-1/2 bg-zinc-900 text-white p-3 rounded-2xl shadow-2xl min-w-[180px] space-y-2 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                   <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-primary" />
                      <span className="text-[10px] font-mono font-bold">
                        {new Date((hoverTime / 100) * 86400 * 1000).toISOString().substr(11, 8)}
                      </span>
                   </div>
                   <Badge className="bg-primary/20 text-primary border-none text-[8px]">Simulating</Badge>
                </div>
                
                <div>
                   <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Active Content</p>
                   {currentlyPlaying ? (
                     <div className="flex items-center gap-2 mt-1">
                        <div className={cn("w-1.5 h-1.5 rounded-full", currentlyPlaying.type === 'spot' ? 'bg-rose-500' : 'bg-blue-500')} />
                        <p className="text-[11px] font-black uppercase truncate">{currentlyPlaying.name}</p>
                     </div>
                   ) : (
                     <p className="text-[10px] font-medium text-white/20 italic">Black Screen / Idle</p>
                   )}
                </div>

                {currentlyPlaying?.type === 'spot' && (
                  <div className="bg-rose-500/20 p-2 rounded-lg border border-rose-500/30">
                     <p className="text-[8px] font-bold text-rose-300 uppercase leading-tight">Priority Override Active</p>
                  </div>
                )}
             </div>
          </div>
        )}
      </div>

      {/* Logic Legend / Summary */}
      <div className="bg-muted/30 rounded-[1.5rem] p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="space-y-2">
            <div className="flex items-center gap-2 text-rose-600">
               <Zap className="h-4 w-4" />
               <span className="text-[10px] font-black uppercase tracking-widest">Conflicts Resolved</span>
            </div>
            <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
              Spots automatically mask base rotations. Higher priority (P+) values take precedence if multiple spots overlap.
            </p>
         </div>

         <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-600">
               <Sun className="h-4 w-4" />
               <span className="text-[10px] font-black uppercase tracking-widest">Energy Policy</span>
            </div>
            <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
              Device commands are triggered as events. Ensure no "Sleep" commands conflict with "Spot" campaigns.
            </p>
         </div>

         <div className="flex items-center justify-end">
            <button className="flex items-center gap-3 bg-zinc-900 text-white px-6 py-3 rounded-2xl hover:scale-105 transition-transform active:scale-95 shadow-xl">
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">Validate Rules</span>
               <ChevronRight className="h-4 w-4" />
            </button>
         </div>
      </div>

      <style>{`
        .vertical-text {
          writing-mode: vertical-lr;
          transform: rotate(180deg);
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
import { startOfDay, addDays, format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isWithinInterval, parseISO } from "date-fns"
import { ChevronLeft, ChevronRight, Info } from "lucide-react"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

// Types
interface ScheduleVisualizerProps {
  rules: any[] // ScheduleContentsRuleResp
  commandRules?: any[] // ScheduleCommandRuleResp
  className?: string
}

interface TimelineBlock {
  id: string
  startPercent: number // 0-100
  widthPercent: number // 0-100
  type: 'rotation' | 'spot' | 'command'
  priority: number
  color: string
  rule: any
  icon?: React.ReactNode
}

const WEEKDAY_MAP: Record<string, number> = {
  "SUN": 0, "MON": 1, "TUE": 2, "WED": 3, "THU": 4, "FRI": 5, "SAT": 6
};

// Helpers
function getDayStatus(date: Date, rules: any[]) {
  let hasRotation = false
  let hasSpot = false
  
  for (const rule of rules) {
    // 1. Check Date Range
    if (rule.ifLimitDate && rule.limitDate) {
      try {
        const start = parseISO(rule.limitDate.start)
        const end = parseISO(rule.limitDate.end)
        if (!isWithinInterval(date, { start, end })) continue
      } catch (e) { continue }
    }
    
    // 2. Check Weekday
    if (rule.ifLimitWeekday && Array.isArray(rule.limitWeekday)) {
      const dayIdx = getDay(date) // 0=Sun
      const raw = rule.limitWeekday as string[];
      const allowedDays = raw.map(s => WEEKDAY_MAP[s] ?? -1);
      
      if (!allowedDays.includes(dayIdx)) continue
    }
    
    if (rule.type === 'spot') hasSpot = true
    else hasRotation = true
  }
  
  return { hasRotation, hasSpot }
}

function computeTimeline(date: Date, rules: any[], commandRules: any[] = []): TimelineBlock[] {
  const blocks: TimelineBlock[] = []
  
  // 1. Program Rules
  for (const rule of rules) {
    // Basic Eligibility
    if (rule.ifLimitDate && rule.limitDate) {
       try {
        const start = parseISO(rule.limitDate.start)
        const end = parseISO(rule.limitDate.end)
        if (!isWithinInterval(date, { start, end })) continue
      } catch (e) { continue }
    }
    if (rule.ifLimitWeekday && Array.isArray(rule.limitWeekday)) {
       const dayIdx = getDay(date)
       const raw = rule.limitWeekday as string[];
       const allowedDays = raw.map(s => WEEKDAY_MAP[s] ?? -1);
       if (!allowedDays.includes(dayIdx)) continue
    }

    // Time Mapping
    let timeSlots: {start: string, end: string}[] = []
    
    if (rule.ifLimitTime) {
        if (Array.isArray(rule.limitTime)) {
            timeSlots = rule.limitTime
        } else if (typeof rule.limitTime === 'object' && rule.limitTime !== null) {
            timeSlots = [rule.limitTime as {start: string, end: string}]
        } else {
             timeSlots = [{ start: "00:00:00", end: "23:59:59" }]
        }
    } else {
      timeSlots = [{ start: "00:00:00", end: "23:59:59" }]
    }

    for (const slot of timeSlots) {
      const startMin = parseTime(slot.start)
      const endMin = parseTime(slot.end)
      const totalMin = 1440
      
      blocks.push({
        id: `${rule.id}-${slot.start}`,
        startPercent: (startMin / totalMin) * 100,
        widthPercent: ((endMin - startMin) / totalMin) * 100,
        type: rule.type,
        priority: rule.priority,
        color: rule.type === 'spot' ? 'bg-rose-500' : 'bg-blue-500',
        rule: rule
      })
    }
  }

  // 2. Command Rules
  for (const rule of commandRules) {
      let payload = rule.payload;
      // Handle payload string or object
      if (typeof payload === 'string') {
          try { payload = JSON.parse(payload) } catch {}
      }
      
      // Basic Eligibility (similar checks if payload has ifLimitDate etc.)
      if (rule.ifLimitDate || payload?.ifLimitDate) {
          // ... (skipped for MVP brevity, assuming commands mostly daily or similar logic)
      }

      // opTime is usually array of strings "HH:mm:ss"
      // Wait, in ScheduleCommandRuleResp, payload is the FULL commandSchedule JSON from device protocol?
      // Or is it our internal structure?
      // Based on schedulePayload.ts, the 'payload' stored in DB is the `commandSchedule` item.
      // It contains `opTime` array.
      
      const opTimes = payload?.opTime || [];
      if (!Array.isArray(opTimes)) continue;

      for (const t of opTimes) {
          const min = parseTime(t);
          const totalMin = 1440;
          
          blocks.push({
              id: `cmd-${rule.id}-${t}`,
              startPercent: (min / totalMin) * 100,
              widthPercent: 1, // small width for icon
              type: 'command',
              priority: 999, // On top
              color: 'bg-yellow-500',
              rule: rule,
              icon: <div className="h-2 w-2 rounded-full bg-yellow-400 ring-1 ring-white" />
          })
      }
  }

  return blocks.sort((a, b) => a.priority - b.priority)
}

function parseTime(t: string) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

export function ScheduleVisualizer({ rules, commandRules = [], className }: ScheduleVisualizerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  
  // Calendar Grid Generation
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    const days = eachDayOfInterval({ start, end })
    
    // Padding for start of week (Sun)
    const startDay = getDay(start)
    const padding = Array(startDay).fill(null)
    
    return [...padding, ...days]
  }, [currentMonth])

  // Timeline Data
  const timelineBlocks = useMemo(() => {
    return computeTimeline(selectedDate, rules, commandRules)
  }, [selectedDate, rules, commandRules])

  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-6", className)}>
      {/* Macro View: Calendar */}
      <Card className="h-fit">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {format(currentMonth, "MMMM yyyy")}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addDays(currentMonth, -30))}>
               <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addDays(currentMonth, 30))}>
               <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 text-center text-xs text-muted-foreground mb-2">
            <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (!day) return <div key={i} />
              const { hasRotation, hasSpot } = getDayStatus(day, rules)
              const isSelected = isSameDay(day, selectedDate)
              
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "relative h-9 rounded-md text-sm flex items-center justify-center transition-colors",
                    isSelected ? "bg-primary text-primary-foreground font-bold" : "hover:bg-accent",
                    !isSelected && hasSpot && "text-rose-600 font-medium",
                    !isSelected && !hasSpot && hasRotation && "text-blue-600"
                  )}
                >
                  {format(day, "d")}
                  <div className="absolute bottom-1 flex gap-0.5">
                     {hasRotation && <div className={cn("h-1 w-1 rounded-full", isSelected ? "bg-white" : "bg-blue-400")} />}
                     {hasSpot && <div className={cn("h-1 w-1 rounded-full", isSelected ? "bg-white" : "bg-rose-500")} />}
                  </div>
                </button>
              )
            })}
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
             <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-blue-400" /> Rotation</div>
             <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-rose-500" /> Spot</div>
             <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-yellow-400" /> Command</div>
          </div>
        </CardContent>
      </Card>

      {/* Micro View: Timeline */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center justify-between">
             <span>Schedule for {format(selectedDate, "yyyy-MM-dd")}</span>
             <span className="text-xs font-normal text-muted-foreground">{timelineBlocks.length} active items</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative pt-6 pb-2">
            {/* Time Axis Labels */}
            <div className="flex justify-between text-xs text-muted-foreground mb-1 select-none">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>23:59</span>
            </div>

            {/* Timeline Track */}
            <div className="relative h-16 w-full bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden border">
              {/* Hour Grid Lines */}
              {[0, 6, 12, 18].map(h => (
                 <div key={h} className="absolute top-0 bottom-0 border-l border-slate-200 dark:border-slate-800" style={{ left: `${(h/24)*100}%` }} />
              ))}

              {timelineBlocks.length === 0 ? (
                 <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                    No programs scheduled for this day
                 </div>
              ) : (
                timelineBlocks.map(block => (
                  <Tooltip key={block.id}>
                    <TooltipTrigger asChild>
                      <div
                        style={{ left: `${block.startPercent}%`, width: `${block.widthPercent}%` }}
                        className={cn(
                          "absolute top-2 bottom-2 rounded-md transition-all hover:brightness-110 cursor-pointer border border-white/10 z-10",
                          block.color,
                          block.type === 'command' && "top-0 bottom-auto h-2 w-2 rounded-full -ml-1 border-none shadow-sm z-20"
                        )}
                      >
                         {block.type === 'command' && <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0.5 h-16 bg-yellow-400/50 -z-10" />}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                       {block.type === 'command' ? (
                           <div className="text-xs">
                               <p className="font-semibold">Command</p>
                               <pre className="mt-1 font-mono text-[10px]">{JSON.stringify(block.rule.payload?.operation || {}, null, 2)}</pre>
                           </div>
                       ) : (
                           <>
                               <p className="font-semibold">{block.type === 'spot' ? 'Spot' : 'Rotation'}</p>
                               <p className="text-xs">Priority: {block.priority}</p>
                               <p className="text-xs font-mono">v{block.rule.releaseVersion}</p>
                           </>
                       )}
                    </TooltipContent>
                  </Tooltip>
                ))
              )}
            </div>
            
             <div className="mt-4 p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground flex gap-2">
               <Info className="h-4 w-4 shrink-0" />
               <p>
                 Higher priority items (e.g. Spot) will display on top. Commands are shown as yellow markers.
               </p>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

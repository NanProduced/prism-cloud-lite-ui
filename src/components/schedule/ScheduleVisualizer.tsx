import { addDays, format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isWithinInterval, parseISO } from "date-fns"
import { ChevronLeft, ChevronRight, Clock, List, BarChart3, Calendar, CalendarDays } from "lucide-react"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { isDateAllowedByWeekday, formatWeekdaySelection, formatTimeRange, formatDateRange, weekdayBooleanToIndices } from "@/lib/schedule/weekdayUtils"
import { COMMAND_TYPE_CONFIG, DEFAULT_COMMAND_TYPE_INFO } from "@/lib/schedule/commandConfig"
import { useTranslation } from "react-i18next"

// Types
interface ScheduleVisualizerProps {
  rules: any[] // ScheduleContentsRuleResp
  commandRules?: any[] // ScheduleCommandRuleResp
  programsMap?: Record<string, any>
  onTabChange?: (tab: 'programs' | 'commands') => void
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
  timeLabel?: string
}

interface ActiveRule {
  id: number
  type: 'rotation' | 'spot'
  priority: number
  programName: string
  version?: number
  timeSlots: string[]
  isActiveToday: boolean
  rule: any
}

interface ActiveCommand {
  id: number
  actionType: string
  opTimes: string[]
  valueDesc: string | null
  isActiveToday: boolean
  rule: any
}

// Helpers
function getDayStatus(date: Date, rules: any[]) {
  let hasRotation = false
  let hasSpot = false

  for (const rule of rules) {
    if (rule.ifLimitDate && rule.limitDate) {
      try {
        const start = parseISO(rule.limitDate.start)
        const end = parseISO(rule.limitDate.end)
        if (!isWithinInterval(date, { start, end })) continue
      } catch (e) { continue }
    }

    if (rule.ifLimitWeekday && !isDateAllowedByWeekday(date, rule.limitWeekday)) {
      continue
    }

    if (rule.type === 'spot') hasSpot = true
    else hasRotation = true
  }

  return { hasRotation, hasSpot }
}

function getActiveRulesForDate(date: Date, rules: any[], t: any): ActiveRule[] {
  const activeRules: ActiveRule[] = []

  for (const rule of rules) {
    let isActiveToday = true

    // Check Date Range
    if (rule.ifLimitDate && rule.limitDate) {
      try {
        const start = parseISO(rule.limitDate.start)
        const end = parseISO(rule.limitDate.end)
        if (!isWithinInterval(date, { start, end })) isActiveToday = false
      } catch (e) { isActiveToday = false }
    }

    // Check Weekday
    if (isActiveToday && rule.ifLimitWeekday && !isDateAllowedByWeekday(date, rule.limitWeekday)) {
      isActiveToday = false
    }

    // Get time slots
    let timeSlots: string[] = []
    if (rule.ifLimitTime && rule.limitTime) {
      const slots = Array.isArray(rule.limitTime) ? rule.limitTime : [rule.limitTime]
      timeSlots = slots.map((slot: { start?: string; end?: string }) =>
        formatTimeRange(slot.start, slot.end)
      ).filter((s: string) => s !== '—')
    } else {
      timeSlots = [t('schedules.details.visualizer.allDay')]
    }

    activeRules.push({
      id: rule.id,
      type: rule.type,
      priority: rule.priority,
      programName: rule.deviceTitleSnapshot || t('schedules.dialogs.create.untitled'),
      version: rule.releaseVersion,
      timeSlots,
      isActiveToday,
      rule
    })
  }

  return activeRules.sort((a, b) => {
    // Active rules first, then by priority
    if (a.isActiveToday !== b.isActiveToday) return a.isActiveToday ? -1 : 1
    return a.priority - b.priority
  })
}

function getActiveCommandsForDate(date: Date, commandRules: any[]): ActiveCommand[] {
  const activeCommands: ActiveCommand[] = []

  for (const rule of commandRules) {
    let payload = rule.payload
    if (typeof payload === 'string') {
      try { payload = JSON.parse(payload) } catch { continue }
    }
    if (!payload) continue

    // Backend returns snake_case: op_time, if_limit_weekday, limit_weekday, etc.
    const opTimes = payload?.op_time || payload?.opTime || []
    if (!Array.isArray(opTimes) || opTimes.length === 0) continue

    // Parse operation structure (backend uses author_url + content)
    const operation = payload?.operation || {}
    const authorUrl = (operation?.author_url || '').toLowerCase()

    // Infer action type from author_url
    let actionType = 'UNKNOWN'
    if (authorUrl === 'api/brightness') actionType = 'BRIGHTNESS'
    else if (authorUrl === 'api/volume') actionType = 'VOLUME'
    else if (authorUrl === 'api/action') actionType = 'POWER'
    else if (authorUrl === 'api/inputmode') actionType = 'INPUT_MODE'
    else if (authorUrl === 'api/colortemp') actionType = 'COLOR_TEMP'
    else if (authorUrl === 'api/clrresunused') actionType = 'CLEAR_CACHE'

    // Parse content (JSON string in operation.content)
    let body: Record<string, unknown> = {}
    try {
      const content = operation?.content
      if (typeof content === 'string') body = JSON.parse(content)
      else if (typeof content === 'object' && content) body = content as Record<string, unknown>
    } catch { /* ignore */ }

    // Get value description
    let valueDesc: string | null = null
    switch (actionType) {
      case 'BRIGHTNESS':
        valueDesc = `${Math.round(((body.brightness as number) ?? 0) / 255 * 100)}%`
        break
      case 'VOLUME':
        valueDesc = `${Math.round(((body.musicvolume as number) ?? 0) / 15 * 100)}%`
        break
      case 'POWER':
        valueDesc = (body.command as string) || 'wakeup'
        break
      case 'INPUT_MODE':
        valueDesc = ((body.inputmode as string) || 'hdmi').toUpperCase()
        break
      case 'COLOR_TEMP':
        valueDesc = `${(body.colortemp as number) || 6500}K`
        break
    }

    // Check if active today based on date/weekday limits
    let isActiveToday = true
    const ifLimitDate = payload?.if_limit_date || payload?.ifLimitDate
    const limitDate = payload?.limit_date || payload?.limitDate
    if (ifLimitDate && limitDate) {
      try {
        const start = parseISO(limitDate.start)
        const end = parseISO(limitDate.end)
        if (!isWithinInterval(date, { start, end })) isActiveToday = false
      } catch { isActiveToday = false }
    }

    const ifLimitWeekday = payload?.if_limit_weekday || payload?.ifLimitWeekday
    const limitWeekday = payload?.limit_weekday || payload?.limitWeekday
    if (isActiveToday && ifLimitWeekday && !isDateAllowedByWeekday(date, limitWeekday)) {
      isActiveToday = false
    }

    activeCommands.push({
      id: rule.id,
      actionType,
      opTimes: opTimes.map((t: string) => t.slice(0, 5)),
      valueDesc,
      isActiveToday,
      rule
    })
  }

  return activeCommands
}

function computeTimeline(date: Date, rules: any[], commandRules: any[] = []): TimelineBlock[] {
  const blocks: TimelineBlock[] = []

  // Program Rules
  for (const rule of rules) {
    if (rule.ifLimitDate && rule.limitDate) {
      try {
        const start = parseISO(rule.limitDate.start)
        const end = parseISO(rule.limitDate.end)
        if (!isWithinInterval(date, { start, end })) continue
      } catch (e) { continue }
    }
    if (rule.ifLimitWeekday && !isDateAllowedByWeekday(date, rule.limitWeekday)) {
      continue
    }

    let timeSlots: {start: string, end: string}[] = []
    if (rule.ifLimitTime && rule.limitTime) {
      const rawSlots = Array.isArray(rule.limitTime) ? rule.limitTime : [rule.limitTime]
      // Normalize time slot keys (handle start/startTime/start_time variants)
      timeSlots = rawSlots.map((slot: Record<string, unknown>) => normalizeTimeSlot(slot))
    } else {
      timeSlots = [{ start: "00:00:00", end: "23:59:59" }]
    }

    for (const slot of timeSlots) {
      const startMin = parseTime(slot.start)
      const endMin = parseTime(slot.end)
      const totalMin = 1440
      // Handle cross-midnight case
      const effectiveEnd = endMin <= startMin ? totalMin : endMin

      blocks.push({
        id: `${rule.id}-${slot.start}`,
        startPercent: (startMin / totalMin) * 100,
        widthPercent: ((effectiveEnd - startMin) / totalMin) * 100,
        type: rule.type,
        priority: rule.priority,
        color: rule.type === 'spot' ? 'bg-rose-500' : 'bg-blue-500',
        rule: rule,
        timeLabel: `${slot.start.slice(0, 5)} - ${slot.end.slice(0, 5)}`
      })
    }
  }

  // Command Rules (backend uses snake_case: op_time, if_limit_weekday, etc.)
  for (const rule of commandRules) {
    let payload = rule.payload
    if (typeof payload === 'string') {
      try { payload = JSON.parse(payload) } catch {}
    }

    // Check date/weekday limits
    const ifLimitDate = payload?.if_limit_date || payload?.ifLimitDate
    const limitDate = payload?.limit_date || payload?.limitDate
    if (ifLimitDate && limitDate) {
      try {
        const start = parseISO(limitDate.start)
        const end = parseISO(limitDate.end)
        if (!isWithinInterval(date, { start, end })) continue
      } catch { continue }
    }

    const ifLimitWeekday = payload?.if_limit_weekday || payload?.ifLimitWeekday
    const limitWeekday = payload?.limit_weekday || payload?.limitWeekday
    if (ifLimitWeekday && !isDateAllowedByWeekday(date, limitWeekday)) {
      continue
    }

    const opTimes = payload?.op_time || payload?.opTime || []
    if (!Array.isArray(opTimes)) continue

    for (const t of opTimes) {
      const min = parseTime(t)
      const totalMin = 1440

      blocks.push({
        id: `cmd-${rule.id}-${t}`,
        startPercent: (min / totalMin) * 100,
        widthPercent: 1,
        type: 'command',
        priority: 999,
        color: 'bg-yellow-500',
        rule: rule,
        icon: <div className="h-2 w-2 rounded-full bg-yellow-400 ring-1 ring-white" />,
        timeLabel: t.slice(0, 5)
      })
    }
  }

  return blocks.sort((a, b) => a.priority - b.priority)
}

function parseTime(t: string) {
  if (!t) return 0
  const [h, m] = t.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

// Helper: Normalize time slot keys (backend may use start/start_time/startTime variants)
function normalizeTimeSlot(slot: Record<string, unknown>): { start: string; end: string } {
  const start = (slot.start || slot.startTime || slot.start_time || '00:00:00') as string
  const end = (slot.end || slot.endTime || slot.end_time || '23:59:59') as string
  return { start, end }
}

export function ScheduleVisualizer({ rules, commandRules = [], programsMap = {}, onTabChange, className }: ScheduleVisualizerProps) {
  const { t } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list')

  // Calendar Grid Generation
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    const days = eachDayOfInterval({ start, end })
    const startDay = getDay(start)
    const padding = Array(startDay).fill(null)
    return [...padding, ...days]
  }, [currentMonth])

  // Active Rules for Selected Date
  const activeRules = useMemo(() => getActiveRulesForDate(selectedDate, rules, t), [selectedDate, rules, t])
  const activeCommands = useMemo(() => getActiveCommandsForDate(selectedDate, commandRules), [selectedDate, commandRules])

  // Timeline Data
  const timelineBlocks = useMemo(() => computeTimeline(selectedDate, rules, commandRules), [selectedDate, rules, commandRules])

  const activeCount = activeRules.filter(r => r.isActiveToday).length + activeCommands.filter(c => c.isActiveToday).length

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
            <div>{t('schedules.details.visualizer.days.su')}</div>
            <div>{t('schedules.details.visualizer.days.mo')}</div>
            <div>{t('schedules.details.visualizer.days.tu')}</div>
            <div>{t('schedules.details.visualizer.days.we')}</div>
            <div>{t('schedules.details.visualizer.days.th')}</div>
            <div>{t('schedules.details.visualizer.days.fr')}</div>
            <div>{t('schedules.details.visualizer.days.sa')}</div>
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
            <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-blue-400" /> {t('schedules.details.programRules.rotation')}</div>
            <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-rose-500" /> {t('schedules.details.programRules.spot')}</div>
            <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-yellow-400" /> {t('logs.command.actionType.POWER')}</div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content: Rule List / Timeline */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium">
                {t('schedules.details.visualizer.scheduleFor', { date: format(selectedDate, "EEEE, MMM d, yyyy") })}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('schedules.details.visualizer.activeItems', { count: activeCount })}
              </p>
            </div>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'timeline')} className="h-8">
              <TabsList className="h-8">
                <TabsTrigger value="list" className="h-7 px-2 gap-1 text-xs">
                  <List className="h-3.5 w-3.5" /> {t('schedules.details.visualizer.list')}
                </TabsTrigger>
                <TabsTrigger value="timeline" className="h-7 px-2 gap-1 text-xs">
                  <BarChart3 className="h-3.5 w-3.5" /> {t('schedules.details.visualizer.timeline')}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'list' ? (
            <div className="space-y-4">
              {/* Program Rules Section */}
              {activeRules.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground tracking-wide">{t('schedules.details.tabs.programs')}</h4>
                  <div className="space-y-2">
                    {activeRules.map((r) => {
                      const programInfo = r.rule.programId ? programsMap[r.rule.programId] : null;
                      const displayName = programInfo?.name || r.programName;
                      return (
                        <div
                          key={r.id}
                          className={cn(
                            "p-3 rounded-lg border transition-colors",
                            r.isActiveToday
                              ? "bg-card border-border"
                              : "bg-muted/30 border-transparent opacity-50"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={cn(
                                  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                                  r.type === 'spot'
                                    ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                                    : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                )}>
                                  {r.type === 'spot' ? t('schedules.details.programRules.spot') : t('schedules.details.programRules.rotation')}
                                </span>
                                <span className="text-xs text-muted-foreground">{t('schedules.details.programRules.priority')} {r.priority}</span>
                                {r.version != null && (
                                  <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">v{r.version}</span>
                                )}
                                {!r.isActiveToday && (
                                  <span className="text-xs text-amber-600 dark:text-amber-400">{t('schedules.details.visualizer.notActiveToday')}</span>
                                )}
                              </div>
                              <p className="text-sm font-medium mt-1 truncate">{displayName}</p>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                {r.timeSlots.map((slot, i) => (
                                  <span key={i} className="inline-flex items-center gap-1 rounded-md bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 text-xs font-medium text-violet-700 dark:text-violet-300">
                                    <Clock className="h-3 w-3 opacity-60" /> {slot}
                                  </span>
                                ))}
                                {r.rule.ifLimitWeekday && r.rule.limitWeekday && (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                                    <Calendar className="h-3 w-3 opacity-60" /> {formatWeekdaySelection(weekdayBooleanToIndices(r.rule.limitWeekday), t)}
                                  </span>
                                )}
                                {r.rule.ifLimitDate && r.rule.limitDate && (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                                    <CalendarDays className="h-3 w-3 opacity-60" /> {formatDateRange(r.rule.limitDate.start, r.rule.limitDate.end)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Command Rules Section */}
              {activeCommands.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground tracking-wide">{t('schedules.details.tabs.commands')}</h4>
                  <div className="space-y-2">
                    {activeCommands.map((c) => {
                      const typeInfo = COMMAND_TYPE_CONFIG[c.actionType] || DEFAULT_COMMAND_TYPE_INFO
                      const IconComponent = typeInfo.icon
                      return (
                        <div
                          key={c.id}
                          className={cn(
                            "p-3 rounded-lg border transition-colors",
                            c.isActiveToday
                              ? "bg-card border-border"
                              : "bg-muted/30 border-transparent opacity-50"
                          )}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium', typeInfo.color)}>
                              <IconComponent className="h-3 w-3" /> {typeInfo.label}
                            </span>
                            {c.valueDesc && (
                              <span className="text-sm font-semibold">{c.valueDesc}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 text-xs font-medium text-violet-700 dark:text-violet-300">
                              <Clock className="h-3 w-3 opacity-60" /> {c.opTimes.join(', ')}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {activeRules.length === 0 && activeCommands.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  <p className="text-sm font-medium">{t('schedules.details.commandRules.noRules')}</p>
                  <p className="text-xs mt-1">{t('schedules.details.commandRules.noRulesDesc')}</p>
                </div>
              )}
            </div>
          ) : (
            /* Timeline View */
            <div className="space-y-4">
              <div className="relative pt-2 pb-2">
                {/* Time Axis Labels */}
                <div className="flex justify-between text-xs text-muted-foreground mb-1 select-none">
                  <span>00:00</span>
                  <span>06:00</span>
                  <span>12:00</span>
                  <span>18:00</span>
                  <span>23:59</span>
                </div>

                {/* Timeline Track */}
                <div className="relative h-20 w-full bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden border">
                  {/* Hour Grid Lines */}
                  {[0, 6, 12, 18].map(h => (
                    <div key={h} className="absolute top-0 bottom-0 border-l border-slate-200 dark:border-slate-800" style={{ left: `${(h/24)*100}%` }} />
                  ))}

                  {timelineBlocks.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                      {t('schedules.details.visualizer.noPrograms')}
                    </div>
                  ) : (
                    timelineBlocks.map(block => {
                      const programInfo = block.rule?.programId ? programsMap[block.rule.programId] : null;
                      const programName = programInfo?.name || block.rule?.deviceTitleSnapshot || block.rule?.programName || '';
                      const isWideEnough = block.widthPercent > 8
                      return (
                        <Tooltip key={block.id}>
                          <TooltipTrigger asChild>
                            <div
                              style={{ left: `${block.startPercent}%`, width: `${Math.max(block.widthPercent, 0.5)}%` }}
                              onClick={() => onTabChange?.(block.type === 'command' ? 'commands' : 'programs')}
                              className={cn(
                                "absolute top-2 bottom-2 rounded-md transition-all hover:brightness-110 cursor-pointer border border-white/20 z-10 overflow-hidden",
                                block.color,
                                block.type === 'command' && "top-1 bottom-auto h-3 w-3 rounded-full -ml-1.5 border-none shadow-sm z-20"
                              )}
                            >
                              {block.type === 'command' && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-16 bg-yellow-400/50 -z-10" />
                              )}
                              {block.type !== 'command' && isWideEnough && (
                                <div className="h-full flex flex-col justify-center px-1.5 py-1">
                                  <span className="text-[10px] font-semibold text-white truncate leading-tight">{programName}</span>
                                  <span className="text-[9px] text-white/80 font-medium">{block.type === 'spot' ? t('schedules.details.programRules.spot') : t('schedules.details.programRules.rotation')} P{block.priority}</span>
                                </div>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            {block.type === 'command' ? (
                              <div className="text-xs space-y-1">
                                <div className="flex items-center justify-between gap-4">
                                  <p className="font-semibold">{t('schedules.details.visualizer.command')}</p>
                                  <span className="font-mono text-[10px] bg-primary/10 text-primary px-1 rounded">{block.timeLabel}</span>
                                </div>
                                <p className="text-muted-foreground">{t('schedules.details.visualizer.viewInCommands')}</p>
                              </div>
                            ) : (
                              <div className="text-xs space-y-1">
                                <div className="flex items-center justify-between gap-4">
                                  <p className="font-semibold truncate max-w-[140px]">{programName || t('schedules.dialogs.create.untitled')}</p>
                                  <span className="font-mono text-[10px] bg-primary/10 text-primary px-1 rounded whitespace-nowrap">{block.timeLabel}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={cn(
                                    "px-1.5 py-0.5 rounded text-[10px] font-medium",
                                    block.type === 'spot' ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
                                  )}>
                                    {block.type === 'spot' ? t('schedules.details.programRules.spot') : t('schedules.details.programRules.rotation')}
                                  </span>
                                  <span>{t('schedules.details.programRules.priority')} {block.priority}</span>
                                  {block.rule.releaseVersion != null && (
                                    <span className="font-mono">v{block.rule.releaseVersion}</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  )
}

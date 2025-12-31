import React, { useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronDown, Clock, History } from 'lucide-react';
import { format, subDays, subHours, startOfDay, endOfDay, isSameDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useTimeFormatter } from '@/hooks/use-time-formatter';
import { formatInTimeZone } from 'date-fns-tz';

export interface DateRange {
  from: string;
  to: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
  showTime?: boolean;
  presets?: { label: string; getValue: () => DateRange }[];
  className?: string;
  align?: 'start' | 'center' | 'end';
}

export function DateRangePicker({
  value,
  onChange,
  showTime = false,
  presets,
  className,
  align = 'start',
}: DateRangePickerProps) {
  const { formatDateTime, timeZone, locale, preferences } = useTimeFormatter();

  const defaultPresets = useMemo(() => {
    if (showTime) {
      return [
        {
          label: 'Last 1 Hour',
          getValue: () => ({
            from: subHours(new Date(), 1).toISOString(),
            to: new Date().toISOString(),
          }),
        },
        {
          label: 'Last 6 Hours',
          getValue: () => ({
            from: subHours(new Date(), 6).toISOString(),
            to: new Date().toISOString(),
          }),
        },
        {
          label: 'Last 24 Hours',
          getValue: () => ({
            from: subDays(new Date(), 1).toISOString(),
            to: new Date().toISOString(),
          }),
        },
      ];
    }
    return [
      {
        label: 'Today',
        getValue: () => ({
          from: format(startOfDay(new Date()), 'yyyy-MM-dd'),
          to: format(endOfDay(new Date()), 'yyyy-MM-dd'),
        }),
      },
      {
        label: 'Last 7 Days',
        getValue: () => ({
          from: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
          to: format(new Date(), 'yyyy-MM-dd'),
        }),
      },
      {
        label: 'Last 30 Days',
        getValue: () => ({
          from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
          to: format(new Date(), 'yyyy-MM-dd'),
        }),
      },
    ];
  }, [showTime]);

  const activePresets = presets || defaultPresets;

  const formattedRange = useMemo(() => {
    try {
      const fromDate = new Date(value.from);
      const toDate = new Date(value.to);
      
      if (showTime) {
        return `${formatDateTime(fromDate)} — ${formatDateTime(toDate)}`;
      }
      
      // Date part only logic from useTimeFormatter
      let datePattern = 'yyyy-MM-dd';
      switch (preferences.dateFormat) {
        case 'YYYY/MM/DD': datePattern = 'yyyy/MM/dd'; break;
        case 'MM/DD/YYYY': datePattern = 'MM/dd/yyyy'; break;
        case 'DD/MM/YYYY': datePattern = 'dd/MM/yyyy'; break;
        case 'MMM D, YYYY': datePattern = 'MMM d, yyyy'; break;
      }
      
      return `${formatInTimeZone(fromDate, timeZone, datePattern, { locale })} — ${formatInTimeZone(toDate, timeZone, datePattern, { locale })}`;
    } catch {
      return 'Select range';
    }
  }, [value, showTime, formatDateTime, preferences.dateFormat, timeZone, locale]);

  // Helper to convert ISO to local datetime-local format
  const toLocalInputValue = (iso: string) => {
    try {
      const date = new Date(iso);
      if (isNaN(date.getTime())) return '';
      if (showTime) {
        const local = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
        return local.toISOString().slice(0, 16);
      }
      return format(date, 'yyyy-MM-dd');
    } catch {
      return '';
    }
  };

  const handleInputChange = (key: 'from' | 'to', val: string) => {
    try {
      if (!val) return;
      
      // If we are in date-only mode, we keep the yyyy-MM-dd format if that's what we got
      if (!showTime && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
        onChange({
          ...value,
          [key]: val,
        });
        return;
      }

      const date = new Date(val);
      if (isNaN(date.getTime())) return;
      
      onChange({
        ...value,
        [key]: showTime ? date.toISOString() : format(date, 'yyyy-MM-dd'),
      });
    } catch (e) {
      // ignore invalid dates
    }
  };

  const selectedRange = useMemo(() => {
    return {
      from: new Date(value.from),
      to: new Date(value.to),
    };
  }, [value]);

  const handleCalendarSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range) return;
    
    const nextRange = { ...value };
    if (range.from) {
      const currentFrom = new Date(value.from);
      const nextFrom = range.from;
      // Keep time if possible
      if (showTime) {
        nextFrom.setHours(currentFrom.getHours(), currentFrom.getMinutes(), currentFrom.getSeconds(), currentFrom.getMilliseconds());
        nextRange.from = nextFrom.toISOString();
      } else {
        nextRange.from = format(nextFrom, 'yyyy-MM-dd');
      }
    }
    
    if (range.to) {
      const currentTo = new Date(value.to);
      const nextTo = range.to;
      if (showTime) {
        nextTo.setHours(currentTo.getHours(), currentTo.getMinutes(), currentTo.getSeconds(), currentTo.getMilliseconds());
        nextRange.to = nextTo.toISOString();
      } else {
        nextRange.to = format(nextTo, 'yyyy-MM-dd');
      }
    } else if (range.from && !range.to) {
      // If only one date is selected, we might want to set to to same date but end of day
      if (!showTime) {
        nextRange.to = format(range.from, 'yyyy-MM-dd');
      }
    }

    onChange(nextRange);
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              'h-10 justify-start text-left font-semibold text-xs border-none bg-background hover:bg-muted ring-1 ring-muted shadow-sm px-3 gap-3 min-w-[280px] rounded-xl transition-all duration-200',
              !value && 'text-muted-foreground'
            )}
          >
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <CalendarIcon className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-[0.15em] leading-none opacity-70">Analysis Period</span>
              <span className="leading-none truncate">{formattedRange}</span>
            </div>
            <ChevronDown className="h-3 w-3 ml-auto opacity-30 group-data-[state=open]:rotate-180 transition-transform" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-[1.5rem] overflow-hidden ring-1 ring-muted/50" align={align}>
          <div className="flex flex-col md:flex-row">
            {/* Presets Sidebar */}
            <div className="flex flex-col p-3 bg-muted/20 min-w-[160px] border-r border-muted/30">
              <div className="px-3 py-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Quick Select</span>
              </div>
              <div className="space-y-1">
                {activePresets.map((preset) => {
                  // Basic logic to detect if preset is currently active
                  // Note: strict equality might not work due to relative time, but it's okay for UI
                  return (
                    <Button
                      key={preset.label}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start h-9 text-xs font-bold hover:bg-primary/10 hover:text-primary transition-all px-3 gap-2.5 rounded-xl group"
                      onClick={() => onChange(preset.getValue())}
                    >
                      <History className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                      {preset.label}
                    </Button>
                  );
                })}
              </div>
              
              <div className="mt-auto pt-4 px-3">
                <div className="p-3 rounded-2xl bg-primary/5 border border-primary/10">
                  <p className="text-[9px] font-bold text-primary uppercase tracking-wider mb-1">Timezone</p>
                  <p className="text-[10px] font-mono font-medium text-muted-foreground">{timeZone}</p>
                </div>
              </div>
            </div>

            {/* Calendar & Manual Inputs */}
            <div className="flex flex-col bg-background p-1">
               <Calendar
                initialFocus
                mode="range"
                defaultMonth={selectedRange.from}
                selected={{
                  from: selectedRange.from,
                  to: selectedRange.to,
                }}
                onSelect={handleCalendarSelect}
                numberOfMonths={2}
                disabled={{ after: new Date() }}
                className="p-4"
              />
              
              {showTime && (
                <div className="mx-5 mb-5 mt-2 p-5 rounded-2xl bg-muted/10 border border-muted/20 flex flex-col gap-5 shadow-inner">
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex-1 space-y-2">
                       <label className="text-[10px] font-extrabold text-muted-foreground/80 flex items-center gap-2 uppercase tracking-widest pl-1">
                        <Clock className="h-3 w-3 text-primary" /> Start
                      </label>
                      <input
                        type="datetime-local"
                        value={toLocalInputValue(value.from)}
                        onChange={(e) => handleInputChange('from', e.target.value)}
                        className="w-full h-10 bg-background border border-muted-foreground/10 rounded-xl px-3 text-[11px] font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                       <label className="text-[10px] font-extrabold text-muted-foreground/80 flex items-center gap-2 uppercase tracking-widest pl-1">
                        <Clock className="h-3 w-3 text-primary" /> End
                      </label>
                      <input
                        type="datetime-local"
                        value={toLocalInputValue(value.to)}
                        onChange={(e) => handleInputChange('to', e.target.value)}
                        className="w-full h-10 bg-background border border-muted-foreground/10 rounded-xl px-3 text-[11px] font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}


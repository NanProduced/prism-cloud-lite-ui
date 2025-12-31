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
              'h-10 justify-start text-left font-semibold text-xs border-none bg-background hover:bg-muted ring-1 ring-muted shadow-sm px-3 gap-3 min-w-[260px] rounded-xl transition-all duration-200',
              !value && 'text-muted-foreground'
            )}
          >
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <CalendarIcon className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider leading-none">Time Range</span>
              <span className="leading-none">{formattedRange}</span>
            </div>
            <ChevronDown className="h-3 w-3 ml-auto opacity-40 group-data-[state=open]:rotate-180 transition-transform" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <div className="flex flex-col md:flex-row">
            {/* Presets Column */}
            <div className="flex flex-col p-2 bg-muted/20 min-w-[140px] border-r">
              <div className="px-2 py-1.5 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Presets</span>
              </div>
              {activePresets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  size="sm"
                  className="justify-start h-8 text-xs font-medium hover:bg-primary/5 hover:text-primary transition-all px-2 gap-2"
                  onClick={() => onChange(preset.getValue())}
                >
                  <History className="h-3 w-3 opacity-50" />
                  {preset.label}
                </Button>
              ))}
            </div>

            {/* Calendar Column */}
            <div className="flex flex-col p-0">
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
                className="p-3"
              />
              
              {showTime && (
                <div className="p-4 pt-0 border-t bg-muted/5 flex flex-col gap-4">
                  <div className="pt-4 flex items-center justify-between gap-4">
                    <div className="flex-1 space-y-1.5">
                       <label className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5 uppercase">
                        <Clock className="h-3 w-3" /> Start Time
                      </label>
                      <input
                        type="datetime-local"
                        value={toLocalInputValue(value.from)}
                        onChange={(e) => handleInputChange('from', e.target.value)}
                        className="w-full h-8 bg-background border border-muted-foreground/10 rounded-md px-2 text-[11px] font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                    <div className="flex-1 space-y-1.5">
                       <label className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5 uppercase">
                        <Clock className="h-3 w-3" /> End Time
                      </label>
                      <input
                        type="datetime-local"
                        value={toLocalInputValue(value.to)}
                        onChange={(e) => handleInputChange('to', e.target.value)}
                        className="w-full h-8 bg-background border border-muted-foreground/10 rounded-md px-2 text-[11px] font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="text-[9px] text-muted-foreground italic px-1 flex items-center justify-between">
                    <span>* Using {timeZone} timezone</span>
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


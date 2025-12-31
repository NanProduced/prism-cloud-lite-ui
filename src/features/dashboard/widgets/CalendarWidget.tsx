import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

export const CalendarWidget = () => {
  const now = new Date();
  const days = useMemo(() => {
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    return eachDayOfInterval({ start, end });
  }, [now]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-primary">{format(now, 'MMMM yyyy')}</span>
        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">
          {format(now, 'EEE')}
        </span>
      </div>
      
      <div className="grid grid-cols-7 gap-1 flex-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
          <div key={d} className="text-[8px] text-center font-bold text-muted-foreground">{d}</div>
        ))}
        {Array.from({ length: days[0].getDay() }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map(day => (
          <div 
            key={day.toISOString()}
            className={cn(
              "text-[9px] flex items-center justify-center aspect-square rounded-full transition-colors",
              isToday(day) ? "bg-primary text-primary-foreground font-bold" : "hover:bg-muted"
            )}
          >
            {format(day, 'd')}
          </div>
        ))}
      </div>
    </div>
  );
};

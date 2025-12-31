import { useMemo, useState } from 'react';
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, 
  isToday, isSameDay, addMonths, subMonths 
} from 'date-fns';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { getSchedules } from '@/services/scheduleApi';
import { CalendarClock, ChevronRight, ListTodo, ChevronLeft, Calendar as CalendarIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const CalendarWidget = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const navigate = useNavigate();
  
  const days = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const { data: schedulesRes } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => getSchedules(),
  });

  const upcomingSchedules = useMemo(() => {
    return (schedulesRes?.data || [])
      .filter(s => s.enabled)
      .slice(0, 3);
  }, [schedulesRes]);

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="flex h-full gap-4 p-1 overflow-hidden">
      <div className="flex-[1.2] flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-3 border-b border-muted/50 pb-2">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-primary uppercase leading-none tracking-widest">{format(currentDate, 'MMMM')}</span>
            <span className="text-xl font-black leading-tight tracking-tighter">{format(currentDate, 'yyyy')}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCurrentDate(new Date())} title="Go to today">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-y-1 gap-x-0.5 flex-1 content-start">
          {weekDays.map(d => (
            <div key={d} className="text-[8px] text-center font-black text-muted-foreground/30 pb-1">{d}</div>
          ))}
          {Array.from({ length: days[0].getDay() }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {days.map(day => (
            <div 
              key={day.toISOString()}
              className={cn(
                "text-[9px] flex items-center justify-center aspect-square rounded-md transition-all font-bold relative",
                isToday(day) 
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 scale-110 z-10" 
                  : isSameDay(day, currentDate) && !isToday(day)
                    ? "bg-muted text-foreground"
                    : "hover:bg-muted text-muted-foreground/60"
              )}
              onClick={() => setCurrentDate(day)}
            >
              {format(day, 'd')}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col border-l pl-3 min-w-0 group/agenda">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground flex items-center gap-1">
            <CalendarClock className="h-2.5 w-2.5" />
            Agenda
          </span>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="space-y-2 pr-2 pb-2">
            {upcomingSchedules.map(item => (
              <button 
                key={item.scheduleId}
                onClick={() => navigate(`/dashboard/schedule/${item.scheduleId}`)}
                className="w-full text-left p-1.5 rounded-lg border bg-muted/30 hover:bg-accent transition-colors group/item"
              >
                <div className="text-[10px] font-bold truncate leading-tight group-hover:item:text-primary transition-colors">
                  {item.name}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[8px] text-muted-foreground font-medium">{item.boundDevices} devices</span>
                  <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/30 group-hover:item:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
            {upcomingSchedules.length === 0 && (
              <div className="py-8 text-center flex flex-col items-center gap-1 opacity-20">
                <CalendarIcon className="h-6 w-6" />
                <p className="text-[9px] font-medium leading-tight">No active<br/>schedules</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

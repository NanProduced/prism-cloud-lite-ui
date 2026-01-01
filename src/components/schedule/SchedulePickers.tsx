import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { WheelPicker, WheelPickerWrapper, type WheelPickerOption } from "@/components/ui/wheel-picker";

interface DatePickerProps {
  value: string; // "yyyy-MM-dd"
  onChange: (value: string) => void;
  placeholder?: string;
}

export function DatePicker({ value, onChange, placeholder = "Pick a date" }: DatePickerProps) {
  const date = value ? new Date(value) : undefined;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal h-10 rounded-lg",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "yyyy-MM-dd") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => d && onChange(format(d, "yyyy-MM-dd"))}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

interface TimePickerProps {
  value: string; // "HH:mm:ss"
  onChange: (value: string) => void;
}

export function TimePicker({ value, onChange }: TimePickerProps) {
  const [localValue, setLocalValue] = React.useState(value || "00:00:00");
  const [isOpen, setIsOpen] = React.useState(false);

  // Sync from prop when popover opens
  React.useEffect(() => {
    if (isOpen) {
      setLocalValue(value || "00:00:00");
    }
  }, [isOpen, value]);

  const parts = localValue.split(':');
  const h = parseInt(parts[0]) || 0;
  const m = parseInt(parts[1]) || 0;
  const s = parseInt(parts[2]) || 0;

  const hours = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    value: i,
    label: i.toString().padStart(2, '0'),
  }));
  const minutes = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    value: i,
    label: i.toString().padStart(2, '0'),
  }));
  const seconds = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    value: i,
    label: i.toString().padStart(2, '0'),
  }));

  const handleWheelChange = (type: 'h' | 'm' | 's', val: number) => {
    let nextH = h;
    let nextM = m;
    let nextS = s;
    if (type === 'h') nextH = val;
    if (type === 'm') nextM = val;
    if (type === 's') nextS = val;
    
    const newValue = `${nextH.toString().padStart(2, '0')}:${nextM.toString().padStart(2, '0')}:${nextS.toString().padStart(2, '0')}`;
    setLocalValue(newValue);
    // Also trigger onChange immediately for better feedback if desired, 
    // but local state keeps it stable during scroll
    onChange(newValue);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-10 rounded-lg",
            !value && "text-muted-foreground"
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value || "00:00:00"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-4" align="start">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center border-b pb-2">
            <span className="text-sm font-medium">Select Time</span>
            <span className="text-sm font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">
              {localValue}
            </span>
          </div>
          <WheelPickerWrapper className="w-full h-[180px] bg-transparent border-none shadow-none">
            <WheelPicker
              options={hours}
              value={h}
              onValueChange={(val: number) => handleWheelChange('h', val)}
            />
            <WheelPicker
              options={minutes}
              value={m}
              onValueChange={(val: number) => handleWheelChange('m', val)}
            />
            <WheelPicker
              options={seconds}
              value={s}
              onValueChange={(val: number) => handleWheelChange('s', val)}
            />
          </WheelPickerWrapper>
          <Button size="sm" className="w-full" onClick={() => setIsOpen(false)}>Done</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

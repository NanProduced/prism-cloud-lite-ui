import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface WeekdaySelectorProps {
  value: number[] // 0=Sun, 1=Mon, ..., 6=Sat
  onChange: (value: number[]) => void
  disabled?: boolean
}

const WEEKDAYS = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
]

export function WeekdaySelector({ value, onChange, disabled }: WeekdaySelectorProps) {
  const toggleDay = (dayIndex: number) => {
    if (value.includes(dayIndex)) {
      onChange(value.filter((d) => d !== dayIndex).sort())
    } else {
      onChange([...value, dayIndex].sort())
    }
  }

  const selectAll = () => onChange([0, 1, 2, 3, 4, 5, 6])
  const selectWorkdays = () => onChange([1, 2, 3, 4, 5])
  const selectWeekend = () => onChange([0, 6])
  const clear = () => onChange([])

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {WEEKDAYS.map((day) => {
          const isSelected = value.includes(day.value)
          return (
            <button
              key={day.value}
              type="button"
              disabled={disabled}
              onClick={() => toggleDay(day.value)}
              className={cn(
                "h-10 w-10 rounded-full border text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {day.label.charAt(0)}
            </button>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <Button variant="outline" size="sm" onClick={selectAll} disabled={disabled} className="h-7">
          All
        </Button>
        <Button variant="outline" size="sm" onClick={selectWorkdays} disabled={disabled} className="h-7">
          Workdays
        </Button>
        <Button variant="outline" size="sm" onClick={selectWeekend} disabled={disabled} className="h-7">
          Weekend
        </Button>
        <Button variant="ghost" size="sm" onClick={clear} disabled={disabled} className="h-7">
          Clear
        </Button>
      </div>
    </div>
  )
}

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"

export interface WeekdaySelectorProps {
  /**
   * Selected weekday indices using backend convention:
   * 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
   */
  value: number[]
  onChange: (value: number[]) => void
  disabled?: boolean
}

export function WeekdaySelector({ value, onChange, disabled }: WeekdaySelectorProps) {
  const { t } = useTranslation();
  
  const toggleDay = (dayIndex: number) => {
    if (value.includes(dayIndex)) {
      onChange(value.filter((d) => d !== dayIndex).sort())
    } else {
      onChange([...value, dayIndex].sort())
    }
  }

  const selectAll = () => onChange([0, 1, 2, 3, 4, 5, 6])
  // Workdays: Mon(0), Tue(1), Wed(2), Thu(3), Fri(4)
  const selectWorkdays = () => onChange([0, 1, 2, 3, 4])
  // Weekend: Sat(5), Sun(6)
  const selectWeekend = () => onChange([5, 6])
  const clear = () => onChange([])

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4, 5, 6].map((dayValue) => {
          const isSelected = value.includes(dayValue)
          return (
            <button
              key={dayValue}
              type="button"
              disabled={disabled}
              onClick={() => toggleDay(dayValue)}
              className={cn(
                "h-10 w-10 rounded-full border text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {t(`schedules.weekdaySelector.short.${dayValue}`)}
            </button>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <Button variant="outline" size="sm" onClick={selectAll} disabled={disabled} className="h-7">
          {t('schedules.weekdaySelector.all')}
        </Button>
        <Button variant="outline" size="sm" onClick={selectWorkdays} disabled={disabled} className="h-7">
          {t('schedules.weekdaySelector.workdays')}
        </Button>
        <Button variant="outline" size="sm" onClick={selectWeekend} disabled={disabled} className="h-7">
          {t('schedules.weekdaySelector.weekend')}
        </Button>
        <Button variant="ghost" size="sm" onClick={clear} disabled={disabled} className="h-7">
          {t('schedules.weekdaySelector.clear')}
        </Button>
      </div>
    </div>
  )
}

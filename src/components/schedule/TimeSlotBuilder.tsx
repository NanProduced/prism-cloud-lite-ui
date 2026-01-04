import * as React from "react"
import { Plus, Trash2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslation } from "react-i18next"

export interface TimeSlot {
  start: string // "HH:mm:ss"
  end: string   // "HH:mm:ss"
}

export interface TimeSlotBuilderProps {
  value: TimeSlot[]
  onChange: (value: TimeSlot[]) => void
  disabled?: boolean
}

export function TimeSlotBuilder({ value, onChange, disabled }: TimeSlotBuilderProps) {
  const { t } = useTranslation();
  const addSlot = () => {
    onChange([...value, { start: "08:00:00", end: "18:00:00" }])
  }

  const removeSlot = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const updateSlot = (index: number, field: keyof TimeSlot, newValue: string) => {
    const next = [...value]
    // Ensure seconds are present
    if (newValue.length === 5) newValue += ":00"
    next[index] = { ...next[index], [field]: newValue }
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {value.length === 0 ? (
        <div className="flex h-20 flex-col items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
          <p>{t('schedules.details.timeSlotBuilder.noLimits')}</p>
          <Button variant="link" onClick={addSlot} disabled={disabled} className="h-auto p-0 text-xs">
            {t('schedules.details.timeSlotBuilder.addSlot')}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {value.map((slot, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  step="1"
                  value={slot.start.slice(0, 5)} // Display HH:mm
                  onChange={(e) => updateSlot(idx, "start", e.target.value)}
                  className="pl-9 font-mono"
                  disabled={disabled}
                />
              </div>
              <span className="text-muted-foreground">-</span>
              <div className="relative flex-1">
                 <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  step="1"
                  value={slot.end.slice(0, 5)} // Display HH:mm
                  onChange={(e) => updateSlot(idx, "end", e.target.value)}
                  className="pl-9 font-mono"
                  disabled={disabled}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeSlot(idx)}
                disabled={disabled}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addSlot} disabled={disabled} className="w-full gap-2 border-dashed">
            <Plus className="h-4 w-4" /> {t('schedules.details.timeSlotBuilder.addAnother')}
          </Button>
        </div>
      )}
    </div>
  )
}

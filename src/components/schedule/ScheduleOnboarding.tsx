import { CalendarDays, CheckCircle2, Layers, Play, Send, Settings2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ScheduleOnboardingProps {
  variant: 'empty-list' | 'empty-schedule'
  className?: string
}

const WORKFLOW_STEPS = [
  {
    icon: CalendarDays,
    title: "Create a Schedule",
    description: "A schedule is a container for program rules and command rules that can be assigned to devices.",
    color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30"
  },
  {
    icon: Layers,
    title: "Add Program Rules",
    description: "Add rotation or spot programs with time/date/weekday constraints. Higher priority rules take precedence.",
    color: "text-violet-600 bg-violet-100 dark:bg-violet-900/30"
  },
  {
    icon: Settings2,
    title: "Add Command Rules",
    description: "Schedule device actions like brightness, volume, power on/off at specific times.",
    color: "text-orange-600 bg-orange-100 dark:bg-orange-900/30"
  },
  {
    icon: Play,
    title: "Bind Devices",
    description: "Assign devices to this schedule. Each device can only be bound to one schedule at a time.",
    color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30"
  },
  {
    icon: Send,
    title: "Push to Devices",
    description: "After saving changes, push to notify bound devices to fetch and apply the latest configuration.",
    color: "text-rose-600 bg-rose-100 dark:bg-rose-900/30"
  }
]

const CONCEPTS = [
  {
    term: "Rotation",
    definition: "Content that plays in a loop. Lower priority than Spot. Usually used for general advertising or information."
  },
  {
    term: "Spot",
    definition: "Time-sensitive content with higher priority. Interrupts rotation playback during its scheduled time window."
  },
  {
    term: "Priority",
    definition: "Lower number = higher priority. When multiple rules apply, the highest priority (lowest number) wins."
  },
  {
    term: "Constraints",
    definition: "Rules can be limited by time range, date range, and/or weekdays. Rules without constraints apply 24/7."
  }
]

export function ScheduleOnboarding({ variant, className }: ScheduleOnboardingProps) {
  if (variant === 'empty-list') {
    return (
      <div className={cn("space-y-6", className)}>
        <Card className="border-dashed border-2 bg-muted/20">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-2">
              <CalendarDays className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg">Welcome to Schedules</CardTitle>
            <CardDescription className="max-w-md mx-auto">
              Schedules let you control what content plays on your devices and when. Follow the workflow below to get started.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-4 md:grid-cols-5">
              {WORKFLOW_STEPS.map((step, i) => (
                <div key={step.title} className="relative">
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", step.color)}>
                      <step.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{step.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-3">{step.description}</p>
                    </div>
                  </div>
                  {i < WORKFLOW_STEPS.length - 1 && (
                    <div className="hidden md:block absolute top-5 left-[calc(50%+24px)] w-[calc(100%-48px)] h-px bg-border" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Key Concepts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {CONCEPTS.map((c) => (
                <div key={c.term} className="flex gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{c.term}</p>
                    <p className="text-xs text-muted-foreground">{c.definition}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <span className="text-sm">1.</span>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Save vs Push:</span> Saving stores your changes on the server. Pushing notifies devices to download updates.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-sm">2.</span>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">One schedule per device:</span> A device can only be bound to one schedule. Binding to a new schedule removes the old binding.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-sm">3.</span>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Timezone matters:</span> Schedule times are in the device's local timezone, not your browser's timezone.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-sm">4.</span>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Version lock:</span> The same program can only have one version per schedule. Changing version updates all rules using that program.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // variant === 'empty-schedule'
  return (
    <Card className={cn("border-dashed border-2 bg-muted/20", className)}>
      <CardContent className="py-8">
        <div className="text-center max-w-md mx-auto">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
            <Layers className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold">Add Rules to Get Started</h3>
          <p className="text-sm text-muted-foreground mt-2">
            This schedule is empty. Add program rules (rotation/spot) or command rules (brightness, power, etc.) to define what happens on your devices.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 text-left">
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                  <Layers className="h-4 w-4" />
                </div>
                <span className="font-medium text-sm">Program Rules</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Schedule content playback with rotation or spot programs. Set time, date, and weekday constraints.
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 flex items-center justify-center">
                  <Settings2 className="h-4 w-4" />
                </div>
                <span className="font-medium text-sm">Command Rules</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Schedule device actions like brightness, volume, power on/off, input switching at specific times.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

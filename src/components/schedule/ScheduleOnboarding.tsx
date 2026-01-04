import { CalendarDays, CheckCircle2, Layers, Play, Send, Settings2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

interface ScheduleOnboardingProps {
  variant: 'empty-list' | 'empty-schedule'
  className?: string
}

export function ScheduleOnboarding({ variant, className }: ScheduleOnboardingProps) {
  const { t } = useTranslation();

  const WORKFLOW_STEPS = [
    {
      icon: CalendarDays,
      title: t('schedules.onboarding.workflow.create.title'),
      description: t('schedules.onboarding.workflow.create.desc'),
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30"
    },
    {
      icon: Layers,
      title: t('schedules.onboarding.workflow.program.title'),
      description: t('schedules.onboarding.workflow.program.desc'),
      color: "text-violet-600 bg-violet-100 dark:bg-violet-900/30"
    },
    {
      icon: Settings2,
      title: t('schedules.onboarding.workflow.command.title'),
      description: t('schedules.onboarding.workflow.command.desc'),
      color: "text-orange-600 bg-orange-100 dark:bg-orange-900/30"
    },
    {
      icon: Play,
      title: t('schedules.onboarding.workflow.bind.title'),
      description: t('schedules.onboarding.workflow.bind.desc'),
      color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30"
    },
    {
      icon: Send,
      title: t('schedules.onboarding.workflow.push.title'),
      description: t('schedules.onboarding.workflow.push.desc'),
      color: "text-rose-600 bg-rose-100 dark:bg-rose-900/30"
    }
  ];

  const CONCEPTS = [
    {
      term: t('schedules.onboarding.concepts.rotation.term'),
      definition: t('schedules.onboarding.concepts.rotation.desc')
    },
    {
      term: t('schedules.onboarding.concepts.spot.term'),
      definition: t('schedules.onboarding.concepts.spot.desc')
    },
    {
      term: t('schedules.onboarding.concepts.priority.term'),
      definition: t('schedules.onboarding.concepts.priority.desc')
    },
    {
      term: t('schedules.onboarding.concepts.constraints.term'),
      definition: t('schedules.onboarding.concepts.constraints.desc')
    }
  ];

  if (variant === 'empty-list') {
    return (
      <div className={cn("space-y-6", className)}>
        <Card className="border-dashed border-2 bg-muted/20">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-2">
              <CalendarDays className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg">{t('schedules.onboarding.welcome')}</CardTitle>
            <CardDescription className="max-w-md mx-auto">
              {t('schedules.onboarding.subtitle')}
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
              <CardTitle className="text-sm">{t('schedules.onboarding.concepts.title')}</CardTitle>
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
              <CardTitle className="text-sm">{t('schedules.onboarding.tips.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <span className="text-sm">1.</span>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{t('schedules.onboarding.tips.saveVsPush.label')}</span> {t('schedules.onboarding.tips.saveVsPush.desc')}
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-sm">2.</span>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{t('schedules.onboarding.tips.oneSchedule.label')}</span> {t('schedules.onboarding.tips.oneSchedule.desc')}
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-sm">3.</span>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{t('schedules.onboarding.tips.timezone.label')}</span> {t('schedules.onboarding.tips.timezone.desc')}
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-sm">4.</span>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{t('schedules.onboarding.tips.versionLock.label')}</span> {t('schedules.onboarding.tips.versionLock.desc')}
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
          <h3 className="text-lg font-semibold">{t('schedules.onboarding.emptySchedule.title')}</h3>
          <p className="text-sm text-muted-foreground mt-2">
            {t('schedules.onboarding.emptySchedule.desc')}
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 text-left">
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                  <Layers className="h-4 w-4" />
                </div>
                <span className="font-medium text-sm">{t('schedules.onboarding.emptySchedule.programRules')}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('schedules.onboarding.emptySchedule.programRulesDesc')}
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 flex items-center justify-center">
                  <Settings2 className="h-4 w-4" />
                </div>
                <span className="font-medium text-sm">{t('schedules.onboarding.emptySchedule.commandRules')}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('schedules.onboarding.emptySchedule.commandRulesDesc')}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

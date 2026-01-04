import { useMemo } from 'react';
import { FileClock } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york/ui/card';
import { Field, FieldContent, FieldDescription, FieldLabel } from '@/registry/new-york/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/registry/new-york/ui/select';

import type { ProgramDraftSavePolicy } from '@/features/programs/storage/draftPolicyDb';
import { useTranslation } from 'react-i18next';

export function ProgramDraftPolicyCard({
  value,
  onChange,
}: {
  value: ProgramDraftSavePolicy;
  onChange: (next: ProgramDraftSavePolicy) => void;
}) {
  const { t } = useTranslation();
  const options = useMemo(
    () =>
      [
        {
          value: 'ask' as const,
          label: t('settings.draftPolicy.options.ask.label'),
          description: t('settings.draftPolicy.options.ask.desc'),
        },
        {
          value: 'always' as const,
          label: t('settings.draftPolicy.options.always.label'),
          description: t('settings.draftPolicy.options.always.desc'),
        },
        {
          value: 'never' as const,
          label: t('settings.draftPolicy.options.never.label'),
          description: t('settings.draftPolicy.options.never.desc'),
        },
      ] satisfies Array<{ value: ProgramDraftSavePolicy; label: string; description: string }>,
    [t],
  );

  const selected = options.find((o) => o.value === value) ?? options[0];

  return (
    <Card className="w-full shadow-xs">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
            <FileClock className="size-5 text-muted-foreground" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <CardTitle className="wrap-break-word">{t('settings.draftPolicy.title')}</CardTitle>
            <CardDescription className="wrap-break-word">
              {t('settings.draftPolicy.subtitle')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Field>
          <FieldLabel>{t('settings.draftPolicy.label')}</FieldLabel>
          <FieldContent>
            <Select value={value} onValueChange={(next) => onChange(next as ProgramDraftSavePolicy)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldContent>
          <FieldDescription>{selected.description}</FieldDescription>
        </Field>
      </CardContent>
    </Card>
  );
}


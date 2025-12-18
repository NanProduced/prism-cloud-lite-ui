import { useMemo } from 'react';
import { FileClock } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york/ui/card';
import { Field, FieldContent, FieldDescription, FieldLabel } from '@/registry/new-york/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/registry/new-york/ui/select';

import type { ProgramDraftSavePolicy } from '@/features/programs/storage/draftPolicyDb';

export function ProgramDraftPolicyCard({
  value,
  onChange,
}: {
  value: ProgramDraftSavePolicy;
  onChange: (next: ProgramDraftSavePolicy) => void;
}) {
  const options = useMemo(
    () =>
      [
        {
          value: 'ask' as const,
          label: 'Always ask (recommended)',
          description: 'Prompt when leaving the editor with unpublished changes.',
        },
        {
          value: 'always' as const,
          label: 'Always save draft',
          description: 'Keep a draft snapshot automatically when leaving or switching versions.',
        },
        {
          value: 'never' as const,
          label: 'Never save draft',
          description: 'Discard unpublished changes when leaving or switching versions.',
        },
      ] satisfies Array<{ value: ProgramDraftSavePolicy; label: string; description: string }>,
    [],
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
            <CardTitle className="wrap-break-word">Program draft saving</CardTitle>
            <CardDescription className="wrap-break-word">
              Controls what happens to unpublished changes when you leave the program editor.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Field>
          <FieldLabel>Draft save rule</FieldLabel>
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


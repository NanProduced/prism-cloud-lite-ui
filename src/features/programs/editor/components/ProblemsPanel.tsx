import { AlertTriangle, CircleAlert } from 'lucide-react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { VsnValidationIssue } from '@/features/programs/vsn/validator';

import type { EditorSelection } from '../types';
import { selectionFromVsnPath } from '../utils';

export function ProblemsPanel({
  issues,
  onJumpToSelection,
}: {
  issues: VsnValidationIssue[];
  onJumpToSelection: (partial: Partial<EditorSelection>) => void;
}) {
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Problems</p>
        <div className="flex items-center gap-2 text-xs">
          <span className={cn('rounded-full px-2 py-0.5', errors.length ? 'bg-red-500/10 text-red-600' : 'bg-muted text-muted-foreground')}>
            {errors.length} error
          </span>
          <span className={cn('rounded-full px-2 py-0.5', warnings.length ? 'bg-amber-500/10 text-amber-700' : 'bg-muted text-muted-foreground')}>
            {warnings.length} warn
          </span>
        </div>
      </div>

      <Separator className="my-3" />

      <ScrollArea className="flex-1 pr-3">
        {issues.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
            No issues found.
          </div>
        ) : (
          <div className="space-y-2">
            {issues.map((issue, index) => (
              <button
                key={`${issue.code}-${index}`}
                type="button"
                className={cn(
                  'w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                  'hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                )}
                onClick={() => {
                  const sel = selectionFromVsnPath(issue.path);
                  if (sel) onJumpToSelection(sel);
                }}
              >
                <div className="flex items-start gap-2">
                  {issue.severity === 'error' ? (
                    <CircleAlert className="mt-0.5 h-4 w-4 text-red-600" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-700" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{issue.message}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{issue.path}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}


import { useMemo } from 'react';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { VsnDocument } from '@/features/programs/vsn/types';

export function VsnJsonPanel({ doc }: { doc: VsnDocument | null }) {
  const jsonText = useMemo(() => (doc ? JSON.stringify(stripEditorFields(doc), null, 2) : ''), [doc]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">VSN JSON</p>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={!jsonText}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(jsonText);
              toast.success('Copied JSON');
            } catch {
              toast.error('Copy failed');
            }
          }}
        >
          <Copy className="h-4 w-4" />
          Copy
        </Button>
      </div>

      <Separator className="my-3" />

      <ScrollArea className="flex-1 pr-3">
        {!jsonText ? (
          <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
            No document loaded.
          </div>
        ) : (
          <pre className="whitespace-pre-wrap break-words rounded-lg border bg-background p-3 text-xs leading-relaxed">
            {jsonText}
          </pre>
        )}
      </ScrollArea>
    </div>
  );
}

function stripEditorFields(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripEditorFields);
  if (!value || typeof value !== 'object') return value;
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (key.startsWith('__')) continue;
    out[key] = stripEditorFields(child);
  }
  return out;
}

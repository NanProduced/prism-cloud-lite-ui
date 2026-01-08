import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tool } from '@/components/ai-elements/tool';

function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function AIMessageParts({
  parts,
  addToolOutput,
  isLatestAssistantMessage,
}: {
  parts: any[];
  addToolOutput?: (options: any) => void;
  isLatestAssistantMessage: boolean;
}) {
  const visibleParts = useMemo(() => {
    return (parts || []).filter((p) => {
      const t = (p as any)?.type;
      if (typeof t !== 'string') return true;
      // Internal step boundary parts from AI SDK; not user-facing.
      if (t === 'step-start' || t === 'step-end' || t === 'step-finish') return false;
      if (t === 'start-step' || t === 'finish-step') return false;
      // Stream-level envelope parts; shouldn't appear in UI parts but filter defensively.
      if (t === 'start' || t === 'finish') return false;
      return true;
    });
  }, [parts]);

  const sourceUrls = useMemo(() => {
    return visibleParts
      .filter((p) => p?.type === 'source-url')
      .map((p) => ({ sourceId: p.sourceId, url: p.url, title: p.title || p.url }));
  }, [visibleParts]);

  return (
    <div className="space-y-2">
      {visibleParts.map((part, index) => {
        if (!part || typeof part !== 'object') return null;

        if (part.type === 'text') {
          return (
            <div
              key={index}
              className="prose prose-sm max-w-none break-words dark:prose-invert prose-p:first:mt-0 prose-p:last:mb-0"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{part.text}</ReactMarkdown>
            </div>
          );
        }

        if (part.type === 'reasoning') {
          return (
            <details key={index} className="group rounded-xl border bg-muted/20 px-3 py-2">
              <summary className="cursor-pointer select-none text-xs font-medium text-muted-foreground">
                推理过程
              </summary>
              <div className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                {part.text}
              </div>
            </details>
          );
        }

        if (typeof part.type === 'string' && (part.type.startsWith('tool-') || part.type === 'dynamic-tool')) {
          return (
            <Tool
              key={part.toolCallId || index}
              toolPart={part}
              addToolOutput={addToolOutput}
              disabled={!isLatestAssistantMessage}
            />
          );
        }

        if (part.type === 'source-url') {
          // Rendered as a combined section at the end.
          return null;
        }

        if (part.type === 'file') {
          return (
            <div key={index} className="rounded-xl border bg-muted/20 px-3 py-2 text-xs">
              <div className="flex items-center justify-between gap-3">
                <div className="truncate">
                  <div className="font-medium">{part.filename || '附件'}</div>
                  <div className="text-muted-foreground">{part.mediaType}</div>
                </div>
                <a
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                  href={part.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  打开 <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          );
        }

        if (typeof part.type === 'string' && part.type.startsWith('data-')) {
          return (
            <details key={index} className="rounded-xl border bg-muted/20 px-3 py-2">
              <summary className="cursor-pointer select-none text-xs font-medium">
                结构化数据 <Badge variant="secondary" className="ml-2 text-[10px]">{part.type}</Badge>
              </summary>
              <pre className={cn('mt-2 overflow-auto whitespace-pre-wrap break-words text-xs text-muted-foreground')}>
                {safeStringify(part.data)}
              </pre>
            </details>
          );
        }

        return (
          <details key={index} className="rounded-xl border bg-muted/20 px-3 py-2">
            <summary className="cursor-pointer select-none text-xs font-medium">
              未识别内容 <Badge variant="secondary" className="ml-2 text-[10px]">{String(part.type)}</Badge>
            </summary>
            <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words text-xs text-muted-foreground">
              {safeStringify(part)}
            </pre>
          </details>
        );
      })}

      {sourceUrls.length > 0 ? (
        <div className="rounded-xl border bg-muted/10 px-3 py-2">
          <div className="text-xs font-medium text-muted-foreground">引用来源</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {sourceUrls.map((s) => (
              <a
                key={s.sourceId}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-1 text-xs hover:border-primary/30 hover:text-primary"
              >
                <ExternalLink className="h-3 w-3" />
                <span className="max-w-[220px] truncate">{s.title}</span>
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

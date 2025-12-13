import { useEffect, useMemo, useState } from "react";
import {
  Glimpse,
  GlimpseContent,
  GlimpseDescription,
  GlimpseImage,
  GlimpseTitle,
  GlimpseTrigger,
} from "@/components/kibo-ui/glimpse";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";

type GlimpseMeta = { title: string | null; description: string | null; image: string | null };

const metaCache = new Map<string, GlimpseMeta | null>();

function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const u = new URL(trimmed);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    // Try adding scheme for values like "example.com/path"
    try {
      const u = new URL(`https://${trimmed}`);
      return u.toString();
    } catch {
      return null;
    }
  }
}

function fallbackTitle(url: string) {
  try {
    const u = new URL(url);
    return u.host;
  } catch {
    return url;
  }
}

export function UrlGlimpseLink({ value }: { value: string }) {
  const href = useMemo(() => normalizeUrl(value), [value]);
  const [open, setOpen] = useState(false);
  const [meta, setMeta] = useState<GlimpseMeta | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !href) return;

    if (metaCache.has(href)) {
      setMeta(metaCache.get(href) ?? null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const { glimpse } = await import("@/components/kibo-ui/glimpse/server");
        const result = (await glimpse(href)) as GlimpseMeta;
        metaCache.set(href, result);
        if (!cancelled) setMeta(result);
      } catch {
        metaCache.set(href, null);
        if (!cancelled) setMeta(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [href, open]);

  if (!href) {
    return <span className="truncate block">{value}</span>;
  }

  const title = meta?.title ?? fallbackTitle(href);
  const description = meta?.description ?? href;

  return (
    <Glimpse open={open} onOpenChange={setOpen} openDelay={250}>
      <GlimpseTrigger asChild>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-sky-600 hover:underline truncate block"
        >
          {value}
        </a>
      </GlimpseTrigger>
      <GlimpseContent className="w-[22rem]">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading preview…
          </div>
        )}

        {!loading && meta?.image && <GlimpseImage src={meta.image} alt={title} />}

        {!loading && (
          <div className="space-y-3">
            <div className="space-y-1">
              <GlimpseTitle title={title}>{title}</GlimpseTitle>
              <GlimpseDescription>{description}</GlimpseDescription>
            </div>
            <div className="flex justify-end">
              <Button asChild variant="outline" size="sm" className="gap-2">
                <a href={href} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Open
                </a>
              </Button>
            </div>
          </div>
        )}
      </GlimpseContent>
    </Glimpse>
  );
}

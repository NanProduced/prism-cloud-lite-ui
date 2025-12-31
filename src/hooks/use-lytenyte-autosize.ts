import { useCallback, useEffect, useRef } from 'react';
import type { Grid } from '@1771technologies/lytenyte-core/types';

export function useLyteNyteAutosize<T>(grid: Grid<T>, deps: unknown[] = []) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const autosize = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      try {
        grid.api.columnAutosize({ includeHeader: true });
      } catch {
        // ignore
      }
    });
  }, [grid]);

  useEffect(() => {
    autosize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autosize, grid, ...deps]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      if (rect.width <= 0 || rect.height <= 0) return;
      autosize();
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [autosize]);

  return { containerRef, autosize };
}


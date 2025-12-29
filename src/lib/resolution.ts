export type Resolution = { width: number; height: number };

export function parseResolution(value: unknown, fallback: Resolution = { width: 1920, height: 1080 }): Resolution {
  if (!value) return fallback;

  if (typeof value === 'string') {
    const match = value.match(/(\d+)\s*[xX×*]\s*(\d+)/);
    if (match) {
      const width = Number.parseInt(match[1], 10);
      const height = Number.parseInt(match[2], 10);
      if (Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0) {
        return { width, height };
      }
    }
    return fallback;
  }

  if (typeof value === 'object') {
    const maybe = value as { width?: unknown; height?: unknown };
    const width = typeof maybe.width === 'number' ? maybe.width : Number.parseInt(String(maybe.width ?? ''), 10);
    const height = typeof maybe.height === 'number' ? maybe.height : Number.parseInt(String(maybe.height ?? ''), 10);
    if (Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0) {
      return { width, height };
    }
  }

  return fallback;
}


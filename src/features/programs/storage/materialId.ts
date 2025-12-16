const STORAGE_KEY = 'prism-cloud-lite.materialIdMap.v1';

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/**
 * Resolves a stable UUID materialId for a given asset id.
 *
 * - Real backend ids are already UUIDs → returns as-is.
 * - Mock/demo ids → generate + persist a UUID mapping in localStorage so previews remain consistent.
 */
export function resolveMaterialId(assetId: string): string {
  if (isUuid(assetId)) return assetId;

  const map = loadMap();
  const existing = map[assetId];
  if (typeof existing === 'string' && isUuid(existing)) return existing;

  const next = safeRandomUUID();
  map[assetId] = next;
  saveMap(map);
  return next;
}

function loadMap(): Record<string, string> {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

function saveMap(map: Record<string, string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

function safeRandomUUID(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}


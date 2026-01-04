function normalizeOrigin(origin: string | undefined | null): string {
  const v = (origin ?? "").trim();
  if (!v) return "";
  return v.replace(/\/+$/, "");
}

export const gatewayOrigin = normalizeOrigin(import.meta.env.VITE_GATEWAY_ORIGIN);

export function joinUrl(origin: string, path: string): string {
  const o = normalizeOrigin(origin);
  if (!o) return path.startsWith("/") ? path : `/${path}`;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${o}${p}`;
}


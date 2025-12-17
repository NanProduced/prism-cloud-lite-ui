const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY as string | undefined;
const MAP_STYLE_OVERRIDE = import.meta.env.VITE_MAP_STYLE_URL as string | undefined;

export const MAP_STYLE_FALLBACK = "https://demotiles.maplibre.org/style.json";

export const MAP_STYLES = [
  { id: "streets", label: "Streets", kind: "maptiler", styleId: "streets-v2" },
  { id: "dark", label: "Dark", kind: "maptiler", styleId: "dataviz-dark" },
  { id: "satellite", label: "Satellite", kind: "maptiler", styleId: "hybrid" },
  { id: "demo", label: "Demo (fallback)", kind: "demo", styleId: "demo" },
] as const;

export type MapStyleId = (typeof MAP_STYLES)[number]["id"];

export function hasBasemapConfig() {
  return Boolean(MAP_STYLE_OVERRIDE || MAPTILER_KEY);
}

export function getMapStyleUrl(styleId: MapStyleId) {
  if (MAP_STYLE_OVERRIDE) return MAP_STYLE_OVERRIDE;
  const style = MAP_STYLES.find((s) => s.id === styleId);
  if (!style || style.kind === "demo") return MAP_STYLE_FALLBACK;
  if (!MAPTILER_KEY) return MAP_STYLE_FALLBACK;
  return `https://api.maptiler.com/maps/${style.styleId}/style.json?key=${MAPTILER_KEY}`;
}

export function canUseMapTiler() {
  return Boolean(MAPTILER_KEY || MAP_STYLE_OVERRIDE);
}


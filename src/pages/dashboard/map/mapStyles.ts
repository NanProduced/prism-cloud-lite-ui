const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY as string | undefined;
const MAP_STYLE_OVERRIDE = import.meta.env.VITE_MAP_STYLE_URL as string | undefined;

export const MAP_STYLE_FALLBACK = "https://demotiles.maplibre.org/style.json";

export function getMapStyles(t: any) {
  return [
    { id: "streets", label: t('map.presets.styles.streets'), kind: "maptiler", styleId: "streets-v4" },
    { id: "dark", label: t('map.presets.styles.dark'), kind: "maptiler", styleId: "dataviz-dark" },
    { id: "satellite", label: t('map.presets.styles.satellite'), kind: "maptiler", styleId: "hybrid" },
  ] as const;
}

export const MAP_STYLES_RAW = [
  { id: "streets", kind: "maptiler", styleId: "streets-v4" },
  { id: "dark", kind: "maptiler", styleId: "dataviz-dark" },
  { id: "satellite", kind: "maptiler", styleId: "hybrid" },
] as const;

export type MapStyleId = (typeof MAP_STYLES_RAW)[number]["id"];

export function hasBasemapConfig() {
  return Boolean(MAP_STYLE_OVERRIDE || MAPTILER_KEY);
}

export function getMapStyleUrl(styleId: MapStyleId) {
  if (MAP_STYLE_OVERRIDE) return MAP_STYLE_OVERRIDE;
  const style = MAP_STYLES_RAW.find((s) => s.id === styleId);
  if (!style) return MAP_STYLE_FALLBACK;
  if (!MAPTILER_KEY) return MAP_STYLE_FALLBACK;
  return `https://api.maptiler.com/maps/${style.styleId}/style.json?key=${MAPTILER_KEY}`;
}

export function canUseMapTiler() {
  return Boolean(MAPTILER_KEY || MAP_STYLE_OVERRIDE);
}


import type { LayerProps } from "react-map-gl/maplibre";

export function getDeviceLayers(): {
  clusters: LayerProps;
  clusterCount: LayerProps;
  points: LayerProps;
} {
  return {
    clusters: {
      id: "device-clusters",
      type: "circle",
      source: "devices",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "rgba(99, 102, 241, 0.85)",
        "circle-radius": ["step", ["get", "point_count"], 16, 20, 20, 50, 26, 100, 32],
        "circle-stroke-color": "rgba(255, 255, 255, 0.7)",
        "circle-stroke-width": 2,
      },
    },
    clusterCount: {
      id: "device-cluster-count",
      type: "symbol",
      source: "devices",
      filter: ["has", "point_count"],
      layout: {
        "text-field": "{point_count_abbreviated}",
        "text-font": ["Noto Sans Regular", "Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-size": 12,
      },
      paint: { "text-color": "#111827" },
    },
    points: {
      id: "device-points",
      type: "circle",
      source: "devices",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": [
          "match",
          ["get", "status"],
          "online",
          "#10b981",
          "offline",
          "#64748b",
          "pending",
          "#f59e0b",
          "#3b82f6",
        ],
        "circle-radius": ["case", ["boolean", ["get", "selected"], false], 10, 6],
        "circle-stroke-color": [
          "case",
          ["boolean", ["get", "selected"], false],
          "rgba(17, 24, 39, 0.8)",
          "rgba(255, 255, 255, 0.9)",
        ],
        "circle-stroke-width": ["case", ["boolean", ["get", "selected"], false], 3, 2],
      },
    },
  };
}

export const HEATMAP_LAYER: LayerProps = {
  id: "device-heatmap",
  type: "heatmap",
  source: "heatmap",
  paint: {
    "heatmap-weight": ["interpolate", ["linear"], ["get", "weight"], 0, 0, 2.4, 1],
    "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 0.7, 10, 1.6, 15, 2.4],
    "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 8, 8, 22, 14, 44],
    "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 0, 0.8, 13, 0.6, 15, 0.25],
    "heatmap-color": [
      "interpolate",
      ["linear"],
      ["heatmap-density"],
      0,
      "rgba(0,0,0,0)",
      0.12,
      "rgba(59,130,246,0.35)",
      0.28,
      "rgba(99,102,241,0.55)",
      0.48,
      "rgba(168,85,247,0.65)",
      0.68,
      "rgba(249,115,22,0.75)",
      0.86,
      "rgba(239,68,68,0.85)",
      1,
      "rgba(220,38,38,0.95)",
    ],
  },
};

export const TRACKS_LAYER: LayerProps = {
  id: "device-tracks",
  type: "line",
  source: "tracks",
  layout: { "line-cap": "round", "line-join": "round" },
  paint: {
    "line-color": ["get", "color"],
    "line-width": ["interpolate", ["linear"], ["zoom"], 3, 1.5, 8, 2.2, 12, 3.2, 15, 5],
    "line-opacity": 0.9,
  },
};


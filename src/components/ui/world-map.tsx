"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import DottedMap from "dotted-map";

interface MapProps {
  dots?: Array<{
    start: { lat: number; lng: number; label?: string };
    end: { lat: number; lng: number; label?: string };
  }>;
  lineColor?: string;
}

export function WorldMap({
  dots = [],
  lineColor = "#3b82f6",
}: MapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  
  const DottedMapClass = (DottedMap as any).default || DottedMap;
  const map = new DottedMapClass({ height: 100, grid: "diagonal" });

  const svgMap = map.getSVG({
    radius: 0.22,
    color: "rgba(255, 255, 255, 0.45)", 
    shape: "circle",
    backgroundColor: "transparent",
  });

  const projectPoint = (lat: number, lng: number) => {
    const x = (lng + 180) * (800 / 360);
    const y = (90 - lat) * (400 / 180);
    return { x, y };
  };

  const createCurvedPath = (
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => {
    const midX = (start.x + end.x) / 2;
    const midY = Math.min(start.y, end.y) - 50;
    return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
  };

  return (
    <div className="w-full aspect-[2/1] relative bg-black/40 font-sans overflow-hidden">
      {/* Background Dots */}
      <img
        src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
        className="h-full w-full pointer-events-none select-none opacity-80"
        alt="world map"
        draggable={false}
      />
      
      <svg
        ref={svgRef}
        viewBox="0 0 800 400"
        className="w-full h-full absolute inset-0 pointer-events-none select-none z-20"
      >
        <defs>
          {/* Professional Glow Filter */}
          <filter id="path-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          
          <linearGradient id="beam-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor={lineColor} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        {dots.map((dot, i) => {
          const startPoint = projectPoint(dot.start.lat, dot.start.lng);
          const endPoint = projectPoint(dot.end.lat, dot.end.lng);
          const path = createCurvedPath(startPoint, endPoint);
          
          return (
            <g key={`path-group-${i}`}>
              {/* Static background path for depth */}
              <motion.path
                d={path}
                fill="none"
                stroke={lineColor}
                strokeWidth="0.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.08 }}
                transition={{ duration: 2, delay: i * 0.1 }}
              />
              
              {/* The "Spreading" Beam - Moving from center to edges */}
              <motion.path
                d={path}
                fill="none"
                stroke={lineColor}
                strokeWidth="1.2"
                strokeLinecap="round"
                initial={{ pathLength: 0, strokeDasharray: "2px 20px" }}
                animate={{ 
                  pathLength: [0, 1],
                  strokeDashoffset: [0, -60] 
                }}
                transition={{ 
                  pathLength: { duration: 1.5, delay: i * 0.2 },
                  strokeDashoffset: { duration: 1.5, repeat: Infinity, ease: "linear" }
                }}
                filter="url(#path-glow)"
                className="opacity-90"
              />
            </g>
          );
        })}

        {dots.map((dot, i) => (
          <g key={`points-group-${i}`}>
            {/* Origin Node (Hub) - Only draw once if multiple start from same place */}
            {i === 0 && (
              <g>
                <circle
                  cx={projectPoint(dot.start.lat, dot.start.lng).x}
                  cy={projectPoint(dot.start.lat, dot.start.lng).y}
                  r="2.5"
                  fill="#fff"
                />
                <motion.circle
                  cx={projectPoint(dot.start.lat, dot.start.lng).x}
                  cy={projectPoint(dot.start.lat, dot.start.lng).y}
                  r="2.5"
                  fill={lineColor}
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 3, opacity: 0 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
                />
              </g>
            )}

            {/* Target Nodes */}
            <g>
              <circle
                cx={projectPoint(dot.end.lat, dot.end.lng).x}
                cy={projectPoint(dot.end.lat, dot.end.lng).y}
                r="1.5"
                fill="#fff"
                className="opacity-80"
              />
              <motion.circle
                cx={projectPoint(dot.end.lat, dot.end.lng).x}
                cy={projectPoint(dot.end.lat, dot.end.lng).y}
                r="1.5"
                fill={lineColor}
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 5, opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: i * 0.2 }}
              />
              {dot.end.label && (
                <text
                  x={projectPoint(dot.end.lat, dot.end.lng).x + 6}
                  y={projectPoint(dot.end.lat, dot.end.lng).y + 2}
                  fill="white"
                  className="text-[6px] font-bold uppercase tracking-widest opacity-40"
                >
                  {dot.end.label}
                </text>
              )}
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
}
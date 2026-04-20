"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

// Deterministic pseudo-random — same `seed` always produces the same sigil.
// Keeps the sigil stable across re-renders so it doesn't scramble every
// animation frame, but unique per session.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

interface NeuroSigilProps {
  seed: string;
  size?: number;
}

// A "100-years-from-now" authorization glyph — radial glyph-code, not a 2D
// barcode grid. Concentric rings of tick marks + orbital nodes + a central
// hex sigil. Reads as "neural authorization token" for the setting.
export default function NeuroSigil({ seed, size = 240 }: NeuroSigilProps) {
  const geometry = useMemo(() => {
    const rand = mulberry32(hashSeed(seed || "sovereign"));
    const rings = [
      { r: 0.92, count: 72, weight: 1 },
      { r: 0.78, count: 54, weight: 1.4 },
      { r: 0.63, count: 36, weight: 1.2 },
      { r: 0.48, count: 24, weight: 1.8 },
    ];
    const ticks: { ring: number; angle: number; len: number; weight: number; on: boolean }[] = [];
    rings.forEach((ring, ri) => {
      for (let i = 0; i < ring.count; i++) {
        const angle = (i / ring.count) * Math.PI * 2;
        const on = rand() > 0.35;
        const len = 0.02 + rand() * 0.055;
        ticks.push({ ring: ri, angle, len, weight: ring.weight, on });
      }
    });
    const nodes: { x: number; y: number; r: number; ringR: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const angle = rand() * Math.PI * 2;
      const ringR = 0.55 + rand() * 0.35;
      nodes.push({
        x: Math.cos(angle) * ringR,
        y: Math.sin(angle) * ringR,
        r: 0.018 + rand() * 0.022,
        ringR,
      });
    }
    // Hex glyph code in the center — 6 cells around center, binary on/off.
    const glyph: boolean[] = [];
    for (let i = 0; i < 7; i++) glyph.push(rand() > 0.5);
    const ringValues = rings.map((r) => ({ r: r.r, count: r.count }));
    return { ticks, nodes, glyph, ringValues };
  }, [seed]);

  const vb = 200;
  const cx = vb / 2;
  const cy = vb / 2;
  const maxR = vb / 2 - 6;

  return (
    <div
      className="relative flex items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: "radial-gradient(circle at 50% 50%, rgba(0,240,255,0.10) 0%, rgba(5,8,14,0.95) 70%)",
        boxShadow:
          "inset 0 0 60px rgba(0,240,255,0.18), 0 0 48px rgba(0,240,255,0.25), 0 0 120px rgba(255,45,135,0.12)",
      }}
    >
      {/* Slow rotating ring layer */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
      >
        <svg viewBox={`0 0 ${vb} ${vb}`} className="h-full w-full">
          {geometry.ringValues.map((ring, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={ring.r * maxR}
              fill="none"
              stroke="rgba(0,240,255,0.18)"
              strokeWidth={0.4}
              strokeDasharray="1 4"
            />
          ))}
          {geometry.ticks.map((tick, i) => {
            if (!tick.on) return null;
            const ring = geometry.ringValues[tick.ring];
            const r1 = ring.r * maxR;
            const r2 = r1 + tick.len * maxR;
            const x1 = cx + Math.cos(tick.angle) * r1;
            const y1 = cy + Math.sin(tick.angle) * r1;
            const x2 = cx + Math.cos(tick.angle) * r2;
            const y2 = cy + Math.sin(tick.angle) * r2;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#00F0FF"
                strokeWidth={tick.weight}
                strokeLinecap="round"
                opacity={0.75}
              />
            );
          })}
        </svg>
      </motion.div>

      {/* Counter-rotating node layer */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 60, ease: "linear" }}
      >
        <svg viewBox={`0 0 ${vb} ${vb}`} className="h-full w-full">
          {geometry.nodes.map((n, i) => (
            <g key={i}>
              <circle
                cx={cx + n.x * maxR}
                cy={cy + n.y * maxR}
                r={n.r * maxR}
                fill="#FF2D87"
                opacity={0.85}
              />
              <circle
                cx={cx + n.x * maxR}
                cy={cy + n.y * maxR}
                r={n.r * maxR * 2.2}
                fill="none"
                stroke="#FF2D87"
                strokeWidth={0.4}
                opacity={0.5}
              />
            </g>
          ))}
        </svg>
      </motion.div>

      {/* Static center hex sigil */}
      <svg
        viewBox={`0 0 ${vb} ${vb}`}
        className="absolute inset-0 h-full w-full"
      >
        {(() => {
          const R = 0.22 * maxR;
          const pts = Array.from({ length: 6 }, (_, i) => {
            const a = (Math.PI / 3) * i - Math.PI / 2;
            return `${cx + Math.cos(a) * R},${cy + Math.sin(a) * R}`;
          }).join(" ");
          return (
            <>
              <polygon
                points={pts}
                fill="rgba(5,8,14,0.85)"
                stroke="#00F0FF"
                strokeWidth={1.2}
              />
              {/* 7-cell binary glyph code */}
              {geometry.glyph.map((on, i) => {
                const r = 0.055 * maxR;
                let gx = cx;
                let gy = cy;
                if (i > 0) {
                  const a = (Math.PI / 3) * (i - 1) - Math.PI / 2;
                  gx = cx + Math.cos(a) * R * 0.55;
                  gy = cy + Math.sin(a) * R * 0.55;
                }
                return (
                  <circle
                    key={i}
                    cx={gx}
                    cy={gy}
                    r={r}
                    fill={on ? "#00F0FF" : "none"}
                    stroke="#00F0FF"
                    strokeWidth={0.6}
                    opacity={on ? 0.95 : 0.45}
                  />
                );
              })}
            </>
          );
        })()}
      </svg>

      {/* Pulse core glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size * 0.18,
          height: size * 0.18,
          background:
            "radial-gradient(circle, rgba(0,240,255,0.9) 0%, rgba(0,240,255,0) 70%)",
        }}
        animate={{ opacity: [0.35, 0.85, 0.35], scale: [0.9, 1.15, 0.9] }}
        transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
      />

      {/* Scan-line sweep */}
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
      >
        <motion.div
          className="absolute left-0 right-0 h-[2px]"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(0,240,255,0.9) 50%, transparent 100%)",
            filter: "blur(1px)",
          }}
          animate={{ top: ["0%", "100%", "0%"] }}
          transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }}
        />
      </motion.div>
    </div>
  );
}

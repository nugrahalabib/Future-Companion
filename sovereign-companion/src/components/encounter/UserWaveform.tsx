"use client";

import { useEffect, useRef } from "react";

interface UserWaveformProps {
  getLevel: () => number; // 0..~0.5 typical
  isActive: boolean; // recording + not muted
  width?: number;
  height?: number;
  bars?: number;
}

// Thin bar-based microphone level meter. Bars on both sides of the mic
// icon react live to user voice. Flat when idle / muted.
export default function UserWaveform({
  getLevel,
  isActive,
  width = 220,
  height = 46,
  bars = 22,
}: UserWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const historyRef = useRef<number[]>(new Array(bars).fill(0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Push current level into the head of history (feels like a wave scroll)
      const raw = isActive ? Math.min(1, getLevel() * 4.5) : 0;
      historyRef.current.shift();
      historyRef.current.push(raw);

      const barW = (width - (bars - 1) * 3) / bars;
      const cy = height / 2;
      for (let i = 0; i < bars; i++) {
        // Distance weight — bars near center look fuller, like a cone
        const centerDist = Math.abs(i - bars / 2) / (bars / 2);
        const weight = 1 - centerDist * 0.55;
        const level = historyRef.current[i] * weight;
        const h = Math.max(2, level * height * 0.9);
        const x = i * (barW + 3);
        const y = cy - h / 2;

        const alpha = isActive ? 0.55 + level * 0.5 : 0.22;
        ctx.fillStyle = `rgba(0,240,255,${Math.min(1, alpha).toFixed(3)})`;
        ctx.shadowBlur = isActive ? 6 + level * 10 : 0;
        ctx.shadowColor = "rgba(0,240,255,0.75)";
        // rounded bar
        const r = Math.min(barW / 2, 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + barW - r, y);
        ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
        ctx.lineTo(x + barW, y + h - r);
        ctx.quadraticCurveTo(x + barW, y + h, x + barW - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [getLevel, isActive, width, height, bars]);

  return <canvas ref={canvasRef} className="pointer-events-none" />;
}

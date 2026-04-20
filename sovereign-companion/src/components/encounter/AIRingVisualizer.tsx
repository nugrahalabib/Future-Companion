"use client";

import { useEffect, useRef } from "react";

interface AIRingVisualizerProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
  size?: number;
}

// Multi-layered concentric rings that breathe gently when idle and
// pulse intensely in cyan when the AI audio stream has amplitude.
export default function AIRingVisualizer({
  analyser,
  isActive,
  size = 340,
}: AIRingVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const baseRadius = size * 0.22;

    let smoothed = 0;
    const freqArr = new Uint8Array(128);

    const draw = () => {
      ctx.clearRect(0, 0, size, size);

      // Compute current amplitude (0..1)
      let amp = 0;
      if (analyser && isActive) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        analyser.getByteFrequencyData(freqArr as any);
        let sum = 0;
        for (let i = 0; i < freqArr.length; i++) sum += freqArr[i];
        amp = sum / (freqArr.length * 255);
      }
      smoothed = smoothed + (amp - smoothed) * 0.22;

      const t = performance.now() / 1000;
      const idlePulse = (Math.sin(t * 1.4) + 1) * 0.5 * 0.12;
      const intensity = isActive ? Math.max(idlePulse, smoothed) : idlePulse * 0.4;

      // --- outer halo gradient (soft atmospheric glow) ---
      const halo = ctx.createRadialGradient(cx, cy, baseRadius * 0.6, cx, cy, size * 0.5);
      halo.addColorStop(0, `rgba(0,240,255,${0.22 + intensity * 0.35})`);
      halo.addColorStop(0.6, "rgba(0,240,255,0.06)");
      halo.addColorStop(1, "rgba(0,240,255,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // --- 3 concentric animated rings ---
      const rings = [
        { rMul: 1.00, lw: 2.2, phase: 0.0 },
        { rMul: 1.25, lw: 1.6, phase: 0.6 },
        { rMul: 1.55, lw: 1.0, phase: 1.1 },
      ];
      rings.forEach((r, i) => {
        const pulse = Math.sin(t * 2.2 + r.phase) * 0.03 + intensity * (0.5 - i * 0.12);
        const radius = baseRadius * r.rMul * (1 + pulse);
        const alpha = isActive ? 0.55 - i * 0.12 + intensity * 0.5 : 0.22 - i * 0.05;
        ctx.strokeStyle = `rgba(0,240,255,${Math.min(1, alpha).toFixed(3)})`;
        ctx.lineWidth = r.lw;
        ctx.shadowBlur = isActive ? 14 + intensity * 20 : 6;
        ctx.shadowColor = "rgba(0,240,255,0.8)";
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.shadowBlur = 0;

      // --- inner reactive orb (filled disc) ---
      const orbR = baseRadius * (0.72 + intensity * 0.25);
      const orbGrad = ctx.createRadialGradient(cx, cy, orbR * 0.1, cx, cy, orbR);
      orbGrad.addColorStop(0, `rgba(0,240,255,${0.55 + intensity * 0.4})`);
      orbGrad.addColorStop(0.55, `rgba(0,180,230,${0.18 + intensity * 0.2})`);
      orbGrad.addColorStop(1, "rgba(0,240,255,0)");
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, orbR, 0, Math.PI * 2);
      ctx.fill();

      // --- core bright dot ---
      const coreR = 5 + intensity * 6;
      ctx.fillStyle = `rgba(255,255,255,${0.85 + intensity * 0.15})`;
      ctx.shadowBlur = 22;
      ctx.shadowColor = "rgba(0,240,255,0.95)";
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // --- spectral spokes that only appear when amp > threshold ---
      if (isActive && smoothed > 0.04) {
        const spokes = 48;
        for (let i = 0; i < spokes; i++) {
          const v = analyser ? freqArr[Math.floor((i / spokes) * freqArr.length)] / 255 : 0;
          if (v < 0.08) continue;
          const a = (i / spokes) * Math.PI * 2 - Math.PI / 2;
          const r1 = baseRadius * 1.7;
          const r2 = r1 + 8 + v * 42;
          ctx.strokeStyle = `rgba(0,240,255,${(v * 0.9).toFixed(3)})`;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
          ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
          ctx.stroke();
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [analyser, isActive, size]);

  return <canvas ref={canvasRef} className="pointer-events-none" />;
}

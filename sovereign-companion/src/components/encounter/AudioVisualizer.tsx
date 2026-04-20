"use client";

import { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
}

export default function AudioVisualizer({ analyser, isActive }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 300;
    canvas.width = size;
    canvas.height = size;
    const cx = size / 2;
    const cy = size / 2;
    const baseRadius = 80;

    const draw = () => {
      ctx.clearRect(0, 0, size, size);

      let dataArray: Uint8Array;
      if (analyser && isActive) {
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        analyser.getByteFrequencyData(dataArray as any);
      } else {
        // Breathing animation when idle
        const t = Date.now() / 1000;
        dataArray = new Uint8Array(128);
        for (let i = 0; i < 128; i++) {
          dataArray[i] = 20 + Math.sin(t * 1.5 + i * 0.1) * 10;
        }
      }

      // Draw circular visualizer
      const bars = dataArray.length;
      const step = (Math.PI * 2) / bars;

      ctx.beginPath();
      for (let i = 0; i < bars; i++) {
        const amplitude = dataArray[i] / 255;
        const r = baseRadius + amplitude * 40;
        const angle = i * step - Math.PI / 2;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = "rgba(0, 240, 255, 0.6)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner glow circle
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius);
      gradient.addColorStop(0, "rgba(0, 240, 255, 0.05)");
      gradient.addColorStop(1, "rgba(0, 240, 255, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
      ctx.fill();

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [analyser, isActive]);

  return (
    <canvas
      ref={canvasRef}
      className="w-[300px] h-[300px]"
    />
  );
}

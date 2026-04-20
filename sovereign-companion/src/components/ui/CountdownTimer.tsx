"use client";

import { useEffect, useRef } from "react";

interface CountdownTimerProps {
  seconds: number;
  onTick: (remaining: number) => void;
  onComplete: () => void;
  running: boolean;
  className?: string;
}

export default function CountdownTimer({
  seconds,
  onTick,
  onComplete,
  running,
  className = "",
}: CountdownTimerProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      onTick(seconds - 1);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, seconds, onTick]);

  useEffect(() => {
    if (seconds <= 0 && running) {
      onComplete();
    }
  }, [seconds, running, onComplete]);

  const mins = Math.floor(Math.max(0, seconds) / 60);
  const secs = Math.max(0, seconds) % 60;

  return (
    <div className={`font-display tabular-nums ${className}`}>
      <span className="text-cyan-accent">
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </span>
    </div>
  );
}

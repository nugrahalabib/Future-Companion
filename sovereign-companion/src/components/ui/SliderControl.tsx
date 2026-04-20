"use client";

interface SliderControlProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}

export default function SliderControl({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = "",
  onChange,
}: SliderControlProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-text-secondary">{label}</span>
        <span className="text-sm font-display text-cyan-accent tabular-nums">
          {value}
          {unit}
        </span>
      </div>
      <div className="relative">
        <div className="absolute top-1/2 left-0 h-1 rounded-full bg-obsidian-border w-full -translate-y-1/2 pointer-events-none" />
        <div
          className="absolute top-1/2 left-0 h-1 rounded-full bg-cyan-accent/60 -translate-y-1/2 pointer-events-none"
          style={{ width: `${percentage}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative z-10 w-full"
        />
      </div>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";

interface MultiChoiceOption {
  value: string;
  label: string;
}

interface MultiChoiceProps {
  question: string;
  helper?: string;
  options: MultiChoiceOption[];
  value: string[];
  onChange: (value: string[]) => void;
  // Hard cap on how many may be selected. Omit for unlimited.
  max?: number;
  invalid?: boolean;
  requiredHint?: string;
}

// Pill-style multi-select. Same interaction pattern as the hobbies picker so
// the form feels native to the booth experience.
export default function MultiChoice({
  question,
  helper,
  options,
  value,
  onChange,
  max,
  invalid,
  requiredHint,
}: MultiChoiceProps) {
  const toggle = (v: string) => {
    if (value.includes(v)) {
      onChange(value.filter((x) => x !== v));
    } else {
      if (typeof max === "number" && value.length >= max) return;
      onChange([...value, v]);
    }
  };

  return (
    <div
      className={`space-y-3 ${
        invalid
          ? "rounded-xl border border-danger/60 bg-danger/5 p-4 -mx-1"
          : ""
      }`}
      style={invalid ? { boxShadow: "0 0 14px rgba(255,90,90,0.18)" } : undefined}
    >
      <p
        className={`text-sm leading-relaxed flex items-start gap-2 ${
          invalid ? "text-danger" : "text-text-primary"
        }`}
      >
        {invalid && <span aria-hidden className="text-danger">●</span>}
        <span>{question}</span>
      </p>
      {helper && (
        <p className="text-[11px] text-text-muted font-display uppercase tracking-widest">
          {helper}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value.includes(opt.value);
          return (
            <motion.button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-full text-xs border transition-colors cursor-pointer ${
                active
                  ? "border-cyan-accent/70 bg-cyan-accent/15 text-cyan-accent"
                  : "border-glass-border bg-obsidian-surface/50 text-text-secondary hover:border-text-muted"
              }`}
              style={
                active
                  ? { boxShadow: "0 0 10px rgba(0,240,255,0.22)" }
                  : undefined
              }
            >
              {opt.label}
            </motion.button>
          );
        })}
      </div>
      {invalid && requiredHint && (
        <p className="text-[11px] text-danger font-display uppercase tracking-widest">
          {requiredHint}
        </p>
      )}
    </div>
  );
}

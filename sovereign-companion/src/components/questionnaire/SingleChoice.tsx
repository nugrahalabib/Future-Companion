"use client";

import { motion } from "framer-motion";

interface SingleChoiceOption {
  value: string;
  label: string;
  description?: string;
}

interface SingleChoiceProps {
  question: string;
  options: SingleChoiceOption[];
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  requiredHint?: string;
}

// Radio-card picker. One option active at a time, styled like the creator
// studio's role grid — glass panel, cyan glow on selection.
export default function SingleChoice({
  question,
  options,
  value,
  onChange,
  invalid,
  requiredHint,
}: SingleChoiceProps) {
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <motion.button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              whileTap={{ scale: 0.98 }}
              className={`text-left rounded-xl px-4 py-3 border transition-colors cursor-pointer ${
                active
                  ? "border-cyan-accent/70 bg-cyan-accent/10"
                  : "border-glass-border bg-obsidian-surface/50 hover:border-text-muted"
              }`}
              style={
                active
                  ? { boxShadow: "0 0 14px rgba(0,240,255,0.22)" }
                  : undefined
              }
            >
              <div
                className={`font-display text-sm ${
                  active ? "text-cyan-accent" : "text-text-primary"
                }`}
              >
                {opt.label}
              </div>
              {opt.description && (
                <div className="text-[11px] text-text-muted mt-0.5 leading-snug">
                  {opt.description}
                </div>
              )}
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

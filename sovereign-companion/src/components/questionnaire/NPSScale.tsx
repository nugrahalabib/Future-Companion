"use client";

import { motion } from "framer-motion";

interface NPSScaleProps {
  question: string;
  value: number | null;
  onChange: (value: number) => void;
  lowLabel: string;
  highLabel: string;
  invalid?: boolean;
  requiredHint?: string;
}

// Net Promoter Score 0–10. Color gradient red → yellow → green to mirror the
// familiar industry visual and to make strong scores visually rewarding.
export default function NPSScale({
  question,
  value,
  onChange,
  lowLabel,
  highLabel,
  invalid,
  requiredHint,
}: NPSScaleProps) {
  const colorFor = (n: number) => {
    if (n <= 6) return "#FF6B6B"; // detractors
    if (n <= 8) return "#FFD93D"; // passives
    return "#39FF14";             // promoters
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
      <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-between">
        {Array.from({ length: 11 }).map((_, n) => {
          const active = value === n;
          return (
            <motion.button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              whileTap={{ scale: 0.9 }}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-xs sm:text-sm font-display font-semibold border transition-colors cursor-pointer ${
                active
                  ? "text-obsidian-base"
                  : "glass border-glass-border text-text-muted hover:text-text-primary hover:border-text-muted"
              }`}
              style={
                active
                  ? {
                      backgroundColor: colorFor(n),
                      borderColor: colorFor(n),
                      boxShadow: `0 0 14px ${colorFor(n)}55`,
                    }
                  : undefined
              }
            >
              {n}
            </motion.button>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-text-muted font-display uppercase tracking-widest">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
      {invalid && requiredHint && (
        <p className="text-[11px] text-danger font-display uppercase tracking-widest">
          {requiredHint}
        </p>
      )}
    </div>
  );
}

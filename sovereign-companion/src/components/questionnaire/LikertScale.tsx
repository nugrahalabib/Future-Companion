"use client";

import { motion } from "framer-motion";
import { useT } from "@/lib/i18n/useT";

interface LikertScaleProps {
  question: string;
  questionId: string;
  value: number;
  onChange: (value: number) => void;
  // Optional custom anchor labels. When ANY is provided, the per-circle
  // `likert.N` translations are replaced with up to three anchor labels
  // pinned beneath 1 / 3 / 5 so long prompts like "Belum pernah dengar →
  // Netral → Sangat familiar" read left-to-right across the full card.
  lowLabel?: string;
  midLabel?: string;
  highLabel?: string;
  // Highlight the whole item red when the parent form detected this field as
  // unanswered after a submit/next attempt. Purely cosmetic — selection logic
  // is unchanged.
  invalid?: boolean;
  requiredHint?: string;
}

export default function LikertScale({
  question,
  questionId: _questionId,
  value,
  onChange,
  lowLabel,
  midLabel,
  highLabel,
  invalid,
  requiredHint,
}: LikertScaleProps) {
  const { t } = useT();
  const hasCustomAnchors = Boolean(lowLabel || midLabel || highLabel);

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
      <div className="flex items-center justify-between w-full">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
          >
            <motion.div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-display font-semibold transition-colors ${
                value === n
                  ? "bg-cyan-accent/25 text-cyan-accent border-2 border-cyan-accent"
                  : "glass border border-glass-border text-text-muted group-hover:text-text-secondary group-hover:border-text-muted"
              }`}
              whileTap={{ scale: 0.9 }}
              style={value === n ? { boxShadow: "0 0 12px rgba(0, 240, 255, 0.3)" } : {}}
            >
              {n}
            </motion.div>
            {!hasCustomAnchors && (
              <span className="text-[10px] text-text-muted hidden sm:block">
                {t(`likert.${n}`)}
              </span>
            )}
          </button>
        ))}
      </div>
      {hasCustomAnchors && (
        <div className="grid grid-cols-3 text-[10px] text-text-muted font-display uppercase tracking-widest pt-1">
          <span className="text-left">{lowLabel}</span>
          <span className="text-center">{midLabel}</span>
          <span className="text-right">{highLabel}</span>
        </div>
      )}
      {invalid && requiredHint && (
        <p className="text-[11px] text-danger font-display uppercase tracking-widest">
          {requiredHint}
        </p>
      )}
    </div>
  );
}

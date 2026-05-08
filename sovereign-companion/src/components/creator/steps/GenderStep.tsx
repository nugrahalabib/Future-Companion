"use client";

import { motion } from "framer-motion";
import { useCompanionStore } from "@/stores/useCompanionStore";
import StepShell from "./StepShell";
import { GENDERS, TOTAL_CREATOR_STEPS } from "@/lib/companionAssets";
import { useT } from "@/lib/i18n/useT";

export default function GenderStep() {
  const gender = useCompanionStore((s) => s.gender);
  const setGender = useCompanionStore((s) => s.setGender);
  const { t } = useT();

  return (
    <StepShell
      step={1}
      total={TOTAL_CREATOR_STEPS}
      title={t("creator.gender.title")}
      subtitle={t("creator.gender.subtitle")}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {GENDERS.map((g) => {
          const selected = gender === g.id;
          const labelKey = g.labelKey ?? "";
          const descKey = g.descriptionKey ?? "";
          return (
            <motion.button
              key={g.id}
              type="button"
              onClick={() => setGender(g.id)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`relative overflow-hidden rounded-2xl border p-4 text-left transition-colors cursor-pointer ${
                selected
                  ? "border-cyan-accent/60 bg-cyan-accent/10 shadow-[0_0_28px_rgba(0,240,255,0.2)]"
                  : "border-glass-border bg-glass-bg hover:bg-glass-bg-hover"
              }`}
            >
              <div
                className={`font-display text-4xl font-light mb-2 ${
                  selected ? "text-cyan-accent" : "text-text-primary"
                }`}
              >
                {g.glyph}
              </div>
              <div
                className={`font-display text-lg font-semibold ${
                  selected ? "text-cyan-accent" : "text-text-primary"
                }`}
              >
                {labelKey ? t(labelKey) : g.label}
              </div>
              <p className="mt-1 text-sm text-text-muted leading-relaxed">
                {descKey ? t(descKey) : g.description}
              </p>
            </motion.button>
          );
        })}
      </div>
    </StepShell>
  );
}

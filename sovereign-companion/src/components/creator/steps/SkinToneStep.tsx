"use client";

import { motion } from "framer-motion";
import { useCompanionStore } from "@/stores/useCompanionStore";
import StepShell from "./StepShell";
import { SKIN_TONES, TOTAL_CREATOR_STEPS } from "@/lib/companionAssets";
import { useT } from "@/lib/i18n/useT";

export default function SkinToneStep() {
  const skinTone = useCompanionStore((s) => s.skinTone);
  const setSkinTone = useCompanionStore((s) => s.setSkinTone);
  const { t } = useT();

  return (
    <StepShell
      step={5}
      total={TOTAL_CREATOR_STEPS}
      title={t("creator.skin.title")}
      subtitle={t("creator.skin.subtitle")}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {SKIN_TONES.map((tone) => {
          const selected = skinTone === tone.id;
          const label = tone.labelKey ? t(tone.labelKey) : tone.label;
          const description = tone.descriptionKey ? t(tone.descriptionKey) : tone.description;
          const locked = Boolean(tone.comingSoon);

          if (locked) {
            return (
              <div
                key={tone.id}
                aria-disabled="true"
                className="relative overflow-hidden rounded-2xl border border-glass-border bg-glass-bg/50 p-3 text-left cursor-not-allowed select-none"
              >
                <div
                  className="h-12 w-full rounded-lg mb-2 border border-glass-border opacity-40"
                  style={{ backgroundColor: tone.swatch }}
                />
                <div className="font-display text-base font-semibold text-text-muted/70">
                  {label}
                </div>
                <p className="mt-1 text-[13px] text-text-muted/50 leading-relaxed line-clamp-2">
                  {description}
                </p>
                <div className="absolute inset-0 flex items-center justify-center bg-obsidian-950/70 backdrop-blur-[1px]">
                  <span className="rounded-full border border-cyan-accent/40 bg-obsidian-950/80 px-3 py-1 font-display text-[11px] uppercase tracking-[0.25em] text-cyan-accent">
                    {t("common.comingSoon")}
                  </span>
                </div>
              </div>
            );
          }

          return (
            <motion.button
              key={tone.id}
              type="button"
              onClick={() => setSkinTone(tone.id)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className={`relative overflow-hidden rounded-2xl border p-3 text-left transition-colors cursor-pointer ${
                selected
                  ? "border-cyan-accent/60 bg-cyan-accent/10 shadow-[0_0_24px_rgba(0,240,255,0.2)]"
                  : "border-glass-border bg-glass-bg hover:bg-glass-bg-hover"
              }`}
            >
              <div
                className="h-12 w-full rounded-lg mb-2 border border-glass-border"
                style={{ backgroundColor: tone.swatch }}
              />
              <div
                className={`font-display text-base font-semibold ${
                  selected ? "text-cyan-accent" : "text-text-primary"
                }`}
              >
                {label}
              </div>
              <p className="mt-1 text-[13px] text-text-muted leading-relaxed line-clamp-2">{description}</p>
            </motion.button>
          );
        })}
      </div>
    </StepShell>
  );
}

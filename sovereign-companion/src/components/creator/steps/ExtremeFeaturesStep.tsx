"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useCompanionStore } from "@/stores/useCompanionStore";
import StepShell from "./StepShell";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import {
  EXTREME_FEATURES,
  TOTAL_CREATOR_STEPS,
  type ExtremeFeatureId,
  type Gender,
} from "@/lib/companionAssets";
import { useT } from "@/lib/i18n/useT";

const OWNER: Record<ExtremeFeatureId, Gender> = {
  artificialWomb: "female",
  spermBank: "male",
};

type BenefitIcon = "gestation" | "precision" | "shield" | "network" | "gamete" | "genome" | "legal" | "fraternity";

const DRAWER: Record<
  ExtremeFeatureId,
  {
    heroStatKey: string;
    heroLabelKey: string;
    heroTaglineKey: string;
    heroImage: string;
    stats: { valueKey: string; labelKey: string }[];
    benefits: { titleKey: string; bodyKey: string; icon: BenefitIcon }[];
    closerTitleKey: string;
    closerBodyKey: string;
  }
> = {
  artificialWomb: {
    heroStatKey: "creator.extreme.womb.hero.stat",
    heroLabelKey: "creator.extreme.womb.hero.label",
    heroTaglineKey: "creator.extreme.womb.hero.tagline",
    heroImage: "/assets/fiture/Rahim.png",
    stats: [
      { valueKey: "creator.extreme.womb.stat.1.value", labelKey: "creator.extreme.womb.stat.1.label" },
      { valueKey: "creator.extreme.womb.stat.2.value", labelKey: "creator.extreme.womb.stat.2.label" },
      { valueKey: "creator.extreme.womb.stat.3.value", labelKey: "creator.extreme.womb.stat.3.label" },
    ],
    benefits: [
      { titleKey: "creator.extreme.womb.benefit.1.title", bodyKey: "creator.extreme.womb.benefit.1.body", icon: "gestation" },
      { titleKey: "creator.extreme.womb.benefit.2.title", bodyKey: "creator.extreme.womb.benefit.2.body", icon: "precision" },
      { titleKey: "creator.extreme.womb.benefit.3.title", bodyKey: "creator.extreme.womb.benefit.3.body", icon: "shield" },
      { titleKey: "creator.extreme.womb.benefit.4.title", bodyKey: "creator.extreme.womb.benefit.4.body", icon: "network" },
    ],
    closerTitleKey: "creator.extreme.womb.closer.title",
    closerBodyKey: "creator.extreme.womb.closer.body",
  },
  spermBank: {
    heroStatKey: "creator.extreme.sperm.hero.stat",
    heroLabelKey: "creator.extreme.sperm.hero.label",
    heroTaglineKey: "creator.extreme.sperm.hero.tagline",
    heroImage: "/assets/fiture/bankSperm.png",
    stats: [
      { valueKey: "creator.extreme.sperm.stat.1.value", labelKey: "creator.extreme.sperm.stat.1.label" },
      { valueKey: "creator.extreme.sperm.stat.2.value", labelKey: "creator.extreme.sperm.stat.2.label" },
      { valueKey: "creator.extreme.sperm.stat.3.value", labelKey: "creator.extreme.sperm.stat.3.label" },
    ],
    benefits: [
      { titleKey: "creator.extreme.sperm.benefit.1.title", bodyKey: "creator.extreme.sperm.benefit.1.body", icon: "gamete" },
      { titleKey: "creator.extreme.sperm.benefit.2.title", bodyKey: "creator.extreme.sperm.benefit.2.body", icon: "genome" },
      { titleKey: "creator.extreme.sperm.benefit.3.title", bodyKey: "creator.extreme.sperm.benefit.3.body", icon: "legal" },
      { titleKey: "creator.extreme.sperm.benefit.4.title", bodyKey: "creator.extreme.sperm.benefit.4.body", icon: "fraternity" },
    ],
    closerTitleKey: "creator.extreme.sperm.closer.title",
    closerBodyKey: "creator.extreme.sperm.closer.body",
  },
};

function IconGlyph({ kind, color }: { kind: BenefitIcon; color: string }) {
  const common = "h-5 w-5";
  const stroke = { stroke: color, strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  switch (kind) {
    case "gestation":
      return (
        <svg viewBox="0 0 24 24" className={common}>
          <circle cx="12" cy="13" r="6" {...stroke} />
          <path d="M12 13v-4M12 9l2-2" {...stroke} />
        </svg>
      );
    case "precision":
      return (
        <svg viewBox="0 0 24 24" className={common}>
          <circle cx="12" cy="12" r="8" {...stroke} />
          <circle cx="12" cy="12" r="3" {...stroke} />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" {...stroke} />
        </svg>
      );
    case "shield":
      return (
        <svg viewBox="0 0 24 24" className={common}>
          <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6l7-3z" {...stroke} />
          <path d="M9 12l2 2 4-4" {...stroke} />
        </svg>
      );
    case "network":
      return (
        <svg viewBox="0 0 24 24" className={common}>
          <circle cx="6" cy="7" r="2" {...stroke} />
          <circle cx="18" cy="7" r="2" {...stroke} />
          <circle cx="12" cy="17" r="2" {...stroke} />
          <path d="M7.5 8.5L11 15.5M16.5 8.5L13 15.5M8 7h8" {...stroke} />
        </svg>
      );
    case "gamete":
      return (
        <svg viewBox="0 0 24 24" className={common}>
          <circle cx="8" cy="10" r="3" {...stroke} />
          <path d="M10 12c4 3 5 6 9 9" {...stroke} />
        </svg>
      );
    case "genome":
      return (
        <svg viewBox="0 0 24 24" className={common}>
          <path d="M7 3c4 4 6 10 10 18M17 3c-4 4-6 10-10 18" {...stroke} />
          <path d="M8.5 7h7M7 12h10M8.5 17h7" {...stroke} />
        </svg>
      );
    case "legal":
      return (
        <svg viewBox="0 0 24 24" className={common}>
          <rect x="5" y="4" width="14" height="16" rx="2" {...stroke} />
          <path d="M8 9h8M8 13h8M8 17h5" {...stroke} />
        </svg>
      );
    case "fraternity":
      return (
        <svg viewBox="0 0 24 24" className={common}>
          <circle cx="12" cy="8" r="3" {...stroke} />
          <path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" {...stroke} />
        </svg>
      );
  }
}

export default function ExtremeFeaturesStep() {
  const gender = useCompanionStore((s) => s.gender);
  const features = useCompanionStore((s) => s.features);
  const setFeature = useCompanionStore((s) => s.setFeature);
  const { t } = useT();

  const [expanded, setExpanded] = useState<ExtremeFeatureId | null>(null);

  const ordered = useMemo(() => {
    const primary = EXTREME_FEATURES.filter((f) => OWNER[f.id] === gender);
    const locked = EXTREME_FEATURES.filter((f) => OWNER[f.id] !== gender);
    return [...primary, ...locked];
  }, [gender]);

  return (
    <StepShell
      step={6}
      total={TOTAL_CREATOR_STEPS}
      title={t("creator.extreme.title")}
      subtitle={t("creator.extreme.subtitle")}
    >
      <div className="mb-2 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-bio-green animate-pulse" />
        <span className="text-[12px] text-bio-green uppercase tracking-[0.2em] font-display">
          {t("creator.extreme.badge")}
        </span>
      </div>

      <div className="space-y-3">
        {ordered.map((f) => {
          const allowed = OWNER[f.id] === gender;
          const isOpen = expanded === f.id;
          const lockLabel =
            OWNER[f.id] === "female"
              ? t("creator.extreme.lock.female")
              : t("creator.extreme.lock.male");
          const drawer = DRAWER[f.id];
          const color = f.badgeColor;

          return (
            <div
              key={f.id}
              className={`overflow-hidden rounded-xl border transition-all ${
                allowed
                  ? isOpen
                    ? "border-transparent bg-glass-bg shadow-[0_0_0_1px_rgba(0,240,255,0.25),0_0_48px_rgba(0,240,255,0.08)]"
                    : "border-glass-border bg-glass-bg"
                  : "border-glass-border/50 bg-glass-bg/40"
              }`}
              style={allowed && isOpen ? { boxShadow: `0 0 0 1px ${color}55, 0 0 48px ${color}18` } : undefined}
            >
              <div className="flex items-start gap-3 p-3">
                <div className="flex-1 min-w-0">
                  {allowed ? (
                    <ToggleSwitch
                      label={t(f.labelKey)}
                      description={t(f.descriptionKey)}
                      checked={features[f.id]}
                      onChange={(v) => setFeature(f.id, v)}
                    />
                  ) : (
                    <div className="flex items-start justify-between gap-3 py-1 opacity-60">
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-base text-text-primary">{t(f.labelKey)}</span>
                          <span className="rounded-full border border-text-muted/30 bg-obsidian-950/50 px-2 py-0.5 text-[11px] font-display uppercase tracking-[0.2em] text-text-muted">
                            {lockLabel}
                          </span>
                        </div>
                        <p className="text-sm text-text-muted mt-1">{t(f.descriptionKey)}</p>
                      </div>
                      <div className="relative w-12 h-6 rounded-full bg-obsidian-border border border-glass-border/40 flex-shrink-0">
                        <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-text-muted/40" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : f.id)}
                className="w-full flex items-center justify-end gap-2 border-t border-glass-border/60 bg-obsidian-950/40 px-3 py-2 text-left transition-colors hover:bg-obsidian-950/70 cursor-pointer"
              >
                <span
                  className="flex items-center gap-1.5 text-[13px] font-display uppercase tracking-[0.2em]"
                  style={{ color }}
                >
                  {isOpen ? t("creator.extreme.details.hide") : t("creator.extreme.details.show")}
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    aria-hidden
                  >
                    ▾
                  </motion.span>
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-glass-border/60">
                      {/* HERO */}
                      <div
                        className="relative overflow-hidden"
                        style={{
                          background: `radial-gradient(120% 140% at 20% 0%, ${color}22 0%, transparent 55%), radial-gradient(100% 120% at 100% 100%, ${color}14 0%, transparent 60%), #05060A`,
                        }}
                      >
                        <div
                          className="pointer-events-none absolute inset-0 opacity-30"
                          style={{
                            backgroundImage: `linear-gradient(${color}11 1px, transparent 1px), linear-gradient(90deg, ${color}11 1px, transparent 1px)`,
                            backgroundSize: "28px 28px",
                          }}
                        />
                        <div className="relative grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-5 min-h-[200px]">
                          <div className="flex flex-col items-start gap-2">
                            <span
                              className="rounded-full border px-3 py-1 font-display text-[11px] uppercase tracking-[0.3em]"
                              style={{ borderColor: `${color}55`, color, backgroundColor: `${color}11` }}
                            >
                              ◈ {t(f.labelKey)}
                            </span>
                            <div className="flex items-baseline gap-3">
                              <motion.span
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 }}
                                className="font-display text-5xl sm:text-6xl font-bold leading-none"
                                style={{ color, textShadow: `0 0 24px ${color}88` }}
                              >
                                {t(drawer.heroStatKey)}
                              </motion.span>
                              <span className="font-display text-[12.5px] uppercase tracking-[0.25em] text-text-secondary max-w-[180px] leading-snug">
                                {t(drawer.heroLabelKey)}
                              </span>
                            </div>
                            <p className="font-display text-base italic text-text-primary/90 mt-1 leading-relaxed">
                              {t(drawer.heroTaglineKey)}
                            </p>
                          </div>

                          {/* Module image */}
                          <motion.div
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1, duration: 0.5 }}
                            className="relative flex-shrink-0"
                          >
                            <div
                              className="pointer-events-none absolute inset-0 rounded-full blur-2xl opacity-60"
                              style={{ backgroundColor: color }}
                            />
                            <div
                              className="relative h-40 w-40 sm:h-48 sm:w-48 rounded-2xl border overflow-hidden"
                              style={{
                                borderColor: `${color}55`,
                                boxShadow: `0 0 32px ${color}55, inset 0 0 24px ${color}22`,
                                backgroundColor: "rgba(0,0,0,0.4)",
                              }}
                            >
                              <Image
                                src={drawer.heroImage}
                                alt={t(f.labelKey)}
                                fill
                                sizes="192px"
                                className="object-contain p-2"
                              />
                              {/* scan-line sweep */}
                              <motion.div
                                className="pointer-events-none absolute left-0 right-0 h-[2px]"
                                style={{
                                  background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
                                  boxShadow: `0 0 12px ${color}`,
                                }}
                                animate={{ top: ["0%", "100%", "0%"] }}
                                transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
                              />
                            </div>
                          </motion.div>
                        </div>
                      </div>

                      {/* STATS */}
                      <div className="grid grid-cols-3 gap-2 px-4 py-3 bg-obsidian-950/40">
                        {drawer.stats.map((s, i) => (
                          <motion.div
                            key={s.valueKey}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.08 + i * 0.05 }}
                            className="rounded-lg border px-2 py-2 text-center"
                            style={{ borderColor: `${color}33`, backgroundColor: `${color}0D` }}
                          >
                            <div className="font-display text-xl font-bold" style={{ color }}>
                              {t(s.valueKey)}
                            </div>
                            <div className="mt-1 text-[11px] font-display uppercase tracking-[0.15em] text-text-muted leading-snug">
                              {t(s.labelKey)}
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* BENEFITS GRID */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 px-4 pb-4 pt-1">
                        {drawer.benefits.map((b, i) => (
                          <motion.div
                            key={b.titleKey}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 + i * 0.06 }}
                            className="group relative overflow-hidden rounded-xl border px-3 py-2.5 transition-colors"
                            style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)" }}
                          >
                            <div
                              className="absolute left-0 top-0 h-full w-[2px] opacity-70"
                              style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
                            />
                            <div className="flex items-start gap-2.5">
                              <div
                                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border"
                                style={{ borderColor: `${color}55`, backgroundColor: `${color}15`, color }}
                              >
                                <IconGlyph kind={b.icon} color={color} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[15px] font-semibold text-text-primary leading-tight">
                                  {t(b.titleKey)}
                                </div>
                                <p className="mt-1 text-[13px] text-text-muted leading-relaxed">
                                  {t(b.bodyKey)}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* CLOSER */}
                      <div
                        className="relative mx-4 mb-4 overflow-hidden rounded-xl border px-4 py-3"
                        style={{
                          borderColor: `${color}44`,
                          background: `linear-gradient(135deg, ${color}14 0%, transparent 60%), rgba(5,6,10,0.6)`,
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full font-display text-[11px]"
                            style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}77` }}
                          >
                            ✦
                          </div>
                          <div className="flex-1">
                            <div
                              className="font-display text-[12.5px] uppercase tracking-[0.25em]"
                              style={{ color }}
                            >
                              {t(drawer.closerTitleKey)}
                            </div>
                            <p className="mt-1.5 text-[13px] text-text-secondary leading-relaxed">
                              {t(drawer.closerBodyKey)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[13px] text-text-muted leading-relaxed">
        {t("creator.extreme.note")}
      </p>
    </StepShell>
  );
}

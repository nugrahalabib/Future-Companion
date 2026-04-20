"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCompanionStore } from "@/stores/useCompanionStore";
import StepShell from "./StepShell";
import { TOTAL_CREATOR_STEPS } from "@/lib/companionAssets";
import { useT } from "@/lib/i18n/useT";

type RoleId = "romantic-partner" | "dominant-assistant" | "passive-listener" | "intellectual-rival";

type RoleMeta = {
  id: RoleId;
  labelKey: string;
  descKey: string;
  whisperKey: string;
  glyph: string;
  accent: string;
};

const ROLES: RoleMeta[] = [
  {
    id: "romantic-partner",
    labelKey: "creator.persona.role.romantic.label",
    descKey: "creator.persona.role.romantic.desc",
    whisperKey: "creator.persona.role.romantic.whisper",
    glyph: "❤",
    accent: "#FF7EB6",
  },
  {
    id: "dominant-assistant",
    labelKey: "creator.persona.role.dominant.label",
    descKey: "creator.persona.role.dominant.desc",
    whisperKey: "creator.persona.role.dominant.whisper",
    glyph: "⚔",
    accent: "#FF5E7A",
  },
  {
    id: "passive-listener",
    labelKey: "creator.persona.role.passive.label",
    descKey: "creator.persona.role.passive.desc",
    whisperKey: "creator.persona.role.passive.whisper",
    glyph: "◐",
    accent: "#A7E3FF",
  },
  {
    id: "intellectual-rival",
    labelKey: "creator.persona.role.intellectual.label",
    descKey: "creator.persona.role.intellectual.desc",
    whisperKey: "creator.persona.role.intellectual.whisper",
    glyph: "Ω",
    accent: "#9A8CFF",
  },
];

type AxisKey = "dominanceLevel" | "innocenceLevel" | "emotionalLevel" | "humorStyle";

type AxisMeta = {
  key: AxisKey;
  titleKey: string;
  leftKey: string;
  rightKey: string;
  leftGlyph: string;
  rightGlyph: string;
  leftColor: string;
  rightColor: string;
  tierKeys: [string, string, string]; // low / mid / high contextual labels
};

const AXES: AxisMeta[] = [
  {
    key: "dominanceLevel",
    titleKey: "creator.persona.axis.dominance.title",
    leftKey: "creator.persona.axis.dominance.left",
    rightKey: "creator.persona.axis.dominance.right",
    leftGlyph: "◡",
    rightGlyph: "▲",
    leftColor: "#A7E3FF",
    rightColor: "#FF5E7A",
    tierKeys: [
      "creator.persona.axis.dominance.low",
      "creator.persona.axis.dominance.mid",
      "creator.persona.axis.dominance.high",
    ],
  },
  {
    key: "innocenceLevel",
    titleKey: "creator.persona.axis.innocence.title",
    leftKey: "creator.persona.axis.innocence.left",
    rightKey: "creator.persona.axis.innocence.right",
    leftGlyph: "✿",
    rightGlyph: "♠",
    leftColor: "#FFCFE5",
    rightColor: "#B06CFF",
    tierKeys: [
      "creator.persona.axis.innocence.low",
      "creator.persona.axis.innocence.mid",
      "creator.persona.axis.innocence.high",
    ],
  },
  {
    key: "emotionalLevel",
    titleKey: "creator.persona.axis.emotional.title",
    leftKey: "creator.persona.axis.emotional.left",
    rightKey: "creator.persona.axis.emotional.right",
    leftGlyph: "◯",
    rightGlyph: "♥",
    leftColor: "#5FE0C2",
    rightColor: "#FF7EB6",
    tierKeys: [
      "creator.persona.axis.emotional.low",
      "creator.persona.axis.emotional.mid",
      "creator.persona.axis.emotional.high",
    ],
  },
  {
    key: "humorStyle",
    titleKey: "creator.persona.axis.humor.title",
    leftKey: "creator.persona.axis.humor.left",
    rightKey: "creator.persona.axis.humor.right",
    leftGlyph: "✶",
    rightGlyph: "☀",
    leftColor: "#9A8CFF",
    rightColor: "#F0C27B",
    tierKeys: [
      "creator.persona.axis.humor.low",
      "creator.persona.axis.humor.mid",
      "creator.persona.axis.humor.high",
    ],
  },
];

function tierIndex(v: number): 0 | 1 | 2 {
  if (v < 34) return 0;
  if (v < 67) return 1;
  return 2;
}

const PRESETS: { id: string; labelKey: string; values: Record<AxisKey, number>; accent: string; glyph: string }[] = [
  {
    id: "gentle",
    labelKey: "creator.persona.preset.gentle",
    glyph: "❀",
    accent: "#A7E3FF",
    values: { dominanceLevel: 25, innocenceLevel: 30, emotionalLevel: 70, humorStyle: 75 },
  },
  {
    id: "balanced",
    labelKey: "creator.persona.preset.balanced",
    glyph: "◈",
    accent: "#00F0FF",
    values: { dominanceLevel: 50, innocenceLevel: 50, emotionalLevel: 50, humorStyle: 50 },
  },
  {
    id: "bold",
    labelKey: "creator.persona.preset.bold",
    glyph: "⚡",
    accent: "#FF5E7A",
    values: { dominanceLevel: 80, innocenceLevel: 70, emotionalLevel: 55, humorStyle: 35 },
  },
  {
    id: "serene",
    labelKey: "creator.persona.preset.serene",
    glyph: "☾",
    accent: "#9A8CFF",
    values: { dominanceLevel: 35, innocenceLevel: 20, emotionalLevel: 30, humorStyle: 40 },
  },
];

export default function PersonaStep() {
  const role = useCompanionStore((s) => s.role);
  const setRole = useCompanionStore((s) => s.setRole);
  const dominanceLevel = useCompanionStore((s) => s.dominanceLevel);
  const innocenceLevel = useCompanionStore((s) => s.innocenceLevel);
  const emotionalLevel = useCompanionStore((s) => s.emotionalLevel);
  const humorStyle = useCompanionStore((s) => s.humorStyle);
  const setSlider = useCompanionStore((s) => s.setSlider);
  const { t } = useT();

  const values: Record<AxisKey, number> = {
    dominanceLevel,
    innocenceLevel,
    emotionalLevel,
    humorStyle,
  };

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    (Object.keys(p.values) as AxisKey[]).forEach((k) => setSlider(k, p.values[k]));
  };

  const activeRole = ROLES.find((r) => r.id === role) ?? ROLES[0];

  return (
    <StepShell
      step={7}
      total={TOTAL_CREATOR_STEPS}
      title={t("creator.persona.title")}
      subtitle={t("creator.persona.subtitle")}
    >
      {/* Roles */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-[12px] uppercase tracking-[0.3em] text-text-muted font-display">
            {t("creator.persona.role")}
          </span>
          <span className="text-[12px] italic text-text-muted/70">
            {t("creator.persona.role.hint")}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {ROLES.map((r) => {
            const selected = r.id === role;
            return (
              <motion.button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                layout
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.99 }}
                className={`group relative overflow-hidden rounded-xl border text-left transition-colors cursor-pointer ${
                  selected
                    ? "border-transparent"
                    : "border-glass-border bg-glass-bg hover:bg-glass-bg-hover"
                }`}
                style={
                  selected
                    ? {
                        background: `linear-gradient(135deg, ${r.accent}22 0%, ${r.accent}0A 100%)`,
                        boxShadow: `0 0 0 1px ${r.accent}88, 0 0 24px ${r.accent}33`,
                      }
                    : undefined
                }
              >
                {/* left accent bar */}
                <div
                  className="pointer-events-none absolute left-0 top-0 h-full w-[3px]"
                  style={{
                    backgroundColor: r.accent,
                    boxShadow: selected ? `0 0 10px ${r.accent}` : "none",
                    opacity: selected ? 1 : 0.4,
                  }}
                />
                <div className="px-4 py-3 pl-5">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg font-display text-lg"
                      style={{
                        color: r.accent,
                        backgroundColor: selected ? `${r.accent}2A` : `${r.accent}14`,
                        border: `1px solid ${r.accent}${selected ? "77" : "40"}`,
                        textShadow: selected ? `0 0 10px ${r.accent}` : "none",
                      }}
                    >
                      {r.glyph}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-display text-[15px] font-semibold leading-tight"
                        style={{ color: selected ? r.accent : undefined }}
                      >
                        {t(r.labelKey)}
                      </div>
                      <p className="mt-1 text-[12.5px] text-text-muted leading-snug line-clamp-1">
                        {t(r.descKey)}
                      </p>
                    </div>
                    {selected && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex h-4 w-4 items-center justify-center rounded-full"
                        style={{ backgroundColor: r.accent, boxShadow: `0 0 8px ${r.accent}` }}
                      >
                        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5">
                          <path
                            d="M2.5 6.2 L5 8.5 L9.5 3.5"
                            stroke="#05060A"
                            strokeWidth="2"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Auto-expanded detail — only when selected */}
                <AnimatePresence initial={false}>
                  {selected && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div
                        className="mx-3 mb-3 mt-0 rounded-lg border px-3 py-2.5"
                        style={{
                          borderColor: `${r.accent}33`,
                          background: `linear-gradient(135deg, ${r.accent}12 0%, transparent 85%)`,
                        }}
                      >
                        <p
                          className="text-[13px] italic leading-relaxed"
                          style={{ color: `${r.accent}CC` }}
                        >
                          &ldquo;{t(r.whisperKey)}&rdquo;
                        </p>
                        <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">
                          {t(r.descKey)}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Presets */}
      <div className="mt-5 space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-[12px] uppercase tracking-[0.3em] text-text-muted font-display">
            {t("creator.persona.preset.title")}
          </span>
          <span className="text-[12px] italic text-text-muted/70">
            {t("creator.persona.preset.hint")}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p)}
              className="group relative overflow-hidden rounded-lg border border-glass-border bg-glass-bg px-2 py-3 text-center transition-colors cursor-pointer hover:bg-glass-bg-hover"
            >
              <span
                className="block font-display text-xl leading-none"
                style={{ color: p.accent, textShadow: `0 0 8px ${p.accent}55` }}
              >
                {p.glyph}
              </span>
              <span className="mt-1.5 block font-display text-[12px] uppercase tracking-[0.2em] text-text-secondary">
                {t(p.labelKey)}
              </span>
            </button>
          ))}
        </div>

        {/* Persona Signature — live summary, nested under the preset controls */}
        <div
          className="mt-3 rounded-xl border px-3.5 py-3"
          style={{
            borderColor: `${activeRole.accent}2E`,
            background: `linear-gradient(135deg, ${activeRole.accent}0E 0%, rgba(0,0,0,0) 80%)`,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md font-display text-[13px]"
              style={{
                color: activeRole.accent,
                backgroundColor: `${activeRole.accent}22`,
                border: `1px solid ${activeRole.accent}55`,
              }}
            >
              {activeRole.glyph}
            </span>
            <span className="font-display text-[12px] uppercase tracking-[0.3em] text-text-muted">
              {t("creator.persona.signature.title")}
            </span>
            <span
              className="ml-auto font-display text-[13px]"
              style={{ color: activeRole.accent }}
            >
              {t(activeRole.labelKey)}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {AXES.map((a) => {
              const v = values[a.key];
              const idx = tierIndex(v);
              const axisColor = v < 50 ? a.leftColor : v > 50 ? a.rightColor : "#00F0FF";
              return (
                <div key={a.key} className="flex items-baseline gap-2">
                  <span
                    className="flex-shrink-0 font-display text-[11px] uppercase tracking-[0.22em] w-28"
                    style={{ color: axisColor }}
                  >
                    {t(a.titleKey)}
                  </span>
                  <span className="text-[13px] text-text-primary leading-snug">
                    {t(a.tierKeys[idx])}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Axes */}
      <div className="mt-5 space-y-3">
        <span className="text-[12px] uppercase tracking-[0.3em] text-text-muted font-display">
          {t("creator.persona.axis.title")}
        </span>
        {AXES.map((a) => {
          const v = values[a.key];
          const idx = tierIndex(v);
          const currentColor = v < 50 ? a.leftColor : v > 50 ? a.rightColor : "#00F0FF";
          return (
            <div
              key={a.key}
              className="rounded-xl border border-glass-border bg-glass-bg px-3.5 py-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-display text-[13px] uppercase tracking-[0.25em] text-text-primary">
                    {t(a.titleKey)}
                  </span>
                </div>
                <span
                  className="font-display text-3xl font-bold leading-none tabular-nums"
                  style={{
                    color: currentColor,
                    textShadow: `0 0 10px ${currentColor}88`,
                  }}
                >
                  {Math.round(v)}
                </span>
              </div>

              <div className="flex items-center justify-between text-[12px] font-display uppercase tracking-widest mb-2">
                <span className="flex items-center gap-1.5" style={{ color: a.leftColor, opacity: v < 50 ? 1 : 0.4 }}>
                  <span className="text-base leading-none">{a.leftGlyph}</span>
                  {t(a.leftKey)}
                </span>
                <span className="flex items-center gap-1.5" style={{ color: a.rightColor, opacity: v > 50 ? 1 : 0.4 }}>
                  {t(a.rightKey)}
                  <span className="text-base leading-none">{a.rightGlyph}</span>
                </span>
              </div>

              <div className="relative h-7 flex items-center">
                <div
                  className="absolute inset-x-0 h-1.5 rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${a.leftColor}66 0%, #00F0FF55 50%, ${a.rightColor}66 100%)`,
                  }}
                />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={v}
                  onChange={(e) => setSlider(a.key, Number(e.target.value))}
                  className="relative z-10 w-full h-7 appearance-none bg-transparent cursor-pointer persona-slider"
                  style={{
                    // CSS variables consumed by globals.css persona-slider thumb
                    ["--thumb-color" as unknown as string]: currentColor,
                  }}
                />
              </div>

              <p className="mt-2 text-[13px] italic text-text-muted leading-relaxed">
                <span style={{ color: currentColor }}>·</span> {t(a.tierKeys[idx])}
              </p>
            </div>
          );
        })}
      </div>

    </StepShell>
  );
}

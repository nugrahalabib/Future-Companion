"use client";

import { motion } from "framer-motion";
import { useCompanionStore } from "@/stores/useCompanionStore";
import StepShell from "./StepShell";
import { TOTAL_CREATOR_STEPS } from "@/lib/companionAssets";
import { useT } from "@/lib/i18n/useT";

type HobbyId =
  | "Technology" | "Philosophy" | "Science" | "Literature" | "Finance"
  | "Arts" | "Music" | "Cooking" | "Photography" | "Sensuality"
  | "Sports" | "Travel" | "Survival" | "Nightlife"
  | "Fashion" | "Gaming" | "Intimacy";

type CategoryKey = "mind" | "craft" | "motion" | "life";

type HobbyMeta = {
  id: HobbyId;
  glyph: string;
  accent: string; // hex color
};

const CATEGORIES: {
  key: CategoryKey;
  titleKey: string;
  hintKey: string;
  tone: string;
  icon: string;
  items: HobbyMeta[];
}[] = [
  {
    key: "mind",
    titleKey: "creator.hobbies.category.mind",
    hintKey: "creator.hobbies.category.mind.hint",
    tone: "#00F0FF",
    icon: "◈",
    items: [
      { id: "Technology", glyph: "⌁", accent: "#00F0FF" },
      { id: "Philosophy", glyph: "Ω", accent: "#9A8CFF" },
      { id: "Science", glyph: "⚛", accent: "#5ED7FF" },
      { id: "Literature", glyph: "❦", accent: "#F0C27B" },
      { id: "Finance", glyph: "$", accent: "#D4B24A" },
    ],
  },
  {
    key: "craft",
    titleKey: "creator.hobbies.category.craft",
    hintKey: "creator.hobbies.category.craft.hint",
    tone: "#FF7EB6",
    icon: "✦",
    items: [
      { id: "Arts", glyph: "✺", accent: "#FF7EB6" },
      { id: "Music", glyph: "♪", accent: "#B06CFF" },
      { id: "Cooking", glyph: "❋", accent: "#FF9A5A" },
      { id: "Photography", glyph: "◉", accent: "#A7E3FF" },
      { id: "Sensuality", glyph: "❥", accent: "#FF3E7F" },
    ],
  },
  {
    key: "motion",
    titleKey: "creator.hobbies.category.motion",
    hintKey: "creator.hobbies.category.motion.hint",
    tone: "#39FF14",
    icon: "➤",
    items: [
      { id: "Sports", glyph: "⚡", accent: "#39FF14" },
      { id: "Travel", glyph: "✈", accent: "#5FE0C2" },
      { id: "Survival", glyph: "▲", accent: "#C4E66B" },
      { id: "Nightlife", glyph: "☾", accent: "#C978FF" },
    ],
  },
  {
    key: "life",
    titleKey: "creator.hobbies.category.life",
    hintKey: "creator.hobbies.category.life.hint",
    tone: "#E0B0FF",
    icon: "❖",
    items: [
      { id: "Fashion", glyph: "♛", accent: "#E0B0FF" },
      { id: "Gaming", glyph: "▶", accent: "#FF5E7A" },
      { id: "Intimacy", glyph: "♥", accent: "#FF2D6F" },
    ],
  },
];

function getMeterMessage(count: number): string {
  if (count === 0) return "creator.hobbies.meter.empty";
  if (count < 3) return "creator.hobbies.meter.min";
  if (count < 6) return "creator.hobbies.meter.good";
  return "creator.hobbies.meter.rich";
}

export default function HobbiesStep() {
  const hobbies = useCompanionStore((s) => s.hobbies);
  const setHobbies = useCompanionStore((s) => s.setHobbies);
  const { t } = useT();

  const toggle = (id: string) => {
    if (hobbies.includes(id)) setHobbies(hobbies.filter((h) => h !== id));
    else setHobbies([...hobbies, id]);
  };

  const count = hobbies.length;
  const meterPct = Math.min(100, (count / 6) * 100);
  const meterKey = getMeterMessage(count);

  return (
    <StepShell
      step={8}
      total={TOTAL_CREATOR_STEPS}
      title={t("creator.hobbies.title")}
      subtitle={t("creator.hobbies.subtitle")}
    >
      {/* Persona meter */}
      <div className="mb-4 rounded-xl border border-glass-border bg-glass-bg px-3 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span
              className="font-display text-3xl font-bold text-cyan-accent leading-none tabular-nums"
              style={{ textShadow: "0 0 12px rgba(0,240,255,0.55)" }}
            >
              {count}
            </span>
            <span className="text-[12px] font-display uppercase tracking-[0.25em] text-text-muted">
              {t("creator.hobbies.counter")}
            </span>
          </div>
          <span className="text-[13px] italic text-text-secondary max-w-[60%] text-right leading-relaxed">
            {t(meterKey)}
          </span>
        </div>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-obsidian-border">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, #00F0FF 0%, #39FF14 100%)",
              boxShadow: "0 0 10px rgba(0,240,255,0.5)",
            }}
            animate={{ width: `${meterPct}%` }}
            transition={{ type: "spring", stiffness: 180, damping: 25 }}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {CATEGORIES.map((cat) => (
          <div key={cat.key}>
            <div className="mb-2 flex items-center gap-2">
              <span
                className="flex h-5 w-5 items-center justify-center rounded-md font-display text-[10px]"
                style={{
                  color: cat.tone,
                  backgroundColor: `${cat.tone}18`,
                  border: `1px solid ${cat.tone}55`,
                }}
              >
                {cat.icon}
              </span>
              <span
                className="font-display text-[13px] uppercase tracking-[0.3em]"
                style={{ color: cat.tone }}
              >
                {t(cat.titleKey)}
              </span>
              <span className="text-[12px] italic text-text-muted/70">
                · {t(cat.hintKey)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {cat.items.map((h) => {
                const selected = hobbies.includes(h.id);
                return (
                  <motion.button
                    key={h.id}
                    type="button"
                    onClick={() => toggle(h.id)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className={`group relative overflow-hidden rounded-xl border px-3 py-2.5 text-left transition-colors cursor-pointer ${
                      selected
                        ? "border-transparent"
                        : "border-glass-border bg-glass-bg hover:bg-glass-bg-hover"
                    }`}
                    style={
                      selected
                        ? {
                            background: `linear-gradient(135deg, ${h.accent}22 0%, ${h.accent}0A 100%)`,
                            boxShadow: `0 0 0 1px ${h.accent}88, 0 0 20px ${h.accent}33`,
                          }
                        : undefined
                    }
                  >
                    {/* accent bar */}
                    <div
                      className="absolute left-0 top-0 h-full w-[2px] transition-opacity"
                      style={{
                        backgroundColor: h.accent,
                        boxShadow: selected ? `0 0 8px ${h.accent}` : "none",
                        opacity: selected ? 1 : 0.35,
                      }}
                    />

                    <div className="flex items-start gap-2.5">
                      <span
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg font-display text-base transition-all"
                        style={{
                          color: h.accent,
                          backgroundColor: selected ? `${h.accent}2A` : `${h.accent}12`,
                          border: `1px solid ${h.accent}${selected ? "88" : "44"}`,
                          textShadow: selected ? `0 0 8px ${h.accent}` : "none",
                        }}
                      >
                        {h.glyph}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`font-display text-[15px] font-semibold leading-tight ${
                            selected ? "text-text-primary" : "text-text-primary/90"
                          }`}
                        >
                          {t(`creator.hobbies.option.${h.id}`)}
                        </div>
                        <p className="mt-1 text-[12.5px] text-text-muted leading-snug line-clamp-2">
                          {t(`creator.hobbies.vibe.${h.id}`)}
                        </p>
                      </div>
                    </div>

                    {/* selection check */}
                    {selected && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full"
                        style={{ backgroundColor: h.accent, boxShadow: `0 0 8px ${h.accent}` }}
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
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[13px] text-text-muted leading-relaxed">
        {count === 0
          ? t("creator.hobbies.empty")
          : t("creator.hobbies.selected", { count })}
      </p>
    </StepShell>
  );
}

"use client";

import { motion } from "framer-motion";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { useT } from "@/lib/i18n/useT";

interface LanguageToggleProps {
  onSwitch: (next: "id" | "en") => void;
  disabled?: boolean;
}

export default function LanguageToggle({ onSwitch, disabled }: LanguageToggleProps) {
  const locale = useLocaleStore((s) => s.locale);
  const { t } = useT();
  const nextLocale: "id" | "en" = locale === "id" ? "en" : "id";
  const label = nextLocale === "en" ? t("encounter.lang.toEN") : t("encounter.lang.toID");

  return (
    <motion.button
      type="button"
      onClick={() => !disabled && onSwitch(nextLocale)}
      whileHover={!disabled ? { scale: 1.04 } : undefined}
      whileTap={!disabled ? { scale: 0.96 } : undefined}
      disabled={disabled}
      aria-label={t("encounter.lang.switch")}
      className="flex items-center gap-2 rounded-full border border-glass-border bg-obsidian-950/70 backdrop-blur-md px-3 py-1.5 disabled:opacity-40"
      style={{ boxShadow: "0 0 16px rgba(0,240,255,0.08)" }}
    >
      <span className="font-display text-[10px] uppercase tracking-[0.28em] text-text-muted">
        {locale.toUpperCase()}
      </span>
      <span className="text-cyan-accent">→</span>
      <span className="font-display text-[10px] uppercase tracking-[0.28em] text-cyan-accent">
        {nextLocale.toUpperCase()}
      </span>
      <span className="text-[11px] text-text-secondary hidden sm:inline">· {label}</span>
    </motion.button>
  );
}

"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { VariantOption } from "@/lib/companionAssets";
import { useT } from "@/lib/i18n/useT";

interface VariantCardProps {
  option: VariantOption;
  selected: boolean;
  onSelect: () => void;
}

export default function VariantCard({ option, selected, onSelect }: VariantCardProps) {
  const { t } = useT();
  const label = option.labelKey ? t(option.labelKey) : option.label;
  const description = option.descriptionKey ? t(option.descriptionKey) : option.description;
  const isComingSoon = option.comingSoon === true;
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`group relative overflow-hidden rounded-2xl border text-left transition-colors cursor-pointer ${
        selected
          ? isComingSoon
            ? "border-[#F5A524]/70 bg-[#F5A524]/10 shadow-[0_0_24px_rgba(245,165,36,0.25)]"
            : "border-cyan-accent/60 bg-cyan-accent/10 shadow-[0_0_24px_rgba(0,240,255,0.2)]"
          : "border-glass-border bg-glass-bg hover:bg-glass-bg-hover"
      }`}
    >
      <div className="relative h-56 sm:h-64 md:h-72 w-full overflow-hidden bg-obsidian-950">
        <Image
          src={option.thumbnail}
          alt={label}
          fill
          sizes="(max-width: 768px) 50vw, 280px"
          className={`object-contain transition-[filter] duration-300 ${
            isComingSoon ? "grayscale-[0.4] opacity-80" : ""
          }`}
        />
        {selected && (
          <div
            className={`pointer-events-none absolute inset-0 ring-2 ring-inset ${
              isComingSoon ? "ring-[#F5A524]/70" : "ring-cyan-accent/70"
            }`}
          />
        )}
        {isComingSoon && (
          <div className="pointer-events-none absolute top-2 right-2 z-10">
            <span className="rounded-full border border-[#F5A524]/50 bg-obsidian-950/80 backdrop-blur-md px-2.5 py-1 font-display text-[9px] uppercase tracking-[0.18em] text-[#F5A524] shadow-[0_0_12px_rgba(245,165,36,0.3)]">
              {t("common.comingSoon")}
            </span>
          </div>
        )}
      </div>
      <div className="px-3 py-3">
        <div
          className={`font-display text-base font-semibold tracking-wide ${
            selected
              ? isComingSoon
                ? "text-[#F5A524]"
                : "text-cyan-accent"
              : "text-text-primary"
          }`}
        >
          {label}
        </div>
        <p className="mt-1 text-[13px] text-text-muted leading-relaxed line-clamp-2">{description}</p>
      </div>
    </motion.button>
  );
}

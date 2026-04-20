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
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`group relative overflow-hidden rounded-2xl border text-left transition-colors cursor-pointer ${
        selected
          ? "border-cyan-accent/60 bg-cyan-accent/10 shadow-[0_0_24px_rgba(0,240,255,0.2)]"
          : "border-glass-border bg-glass-bg hover:bg-glass-bg-hover"
      }`}
    >
      <div className="relative h-56 sm:h-64 md:h-72 w-full overflow-hidden bg-obsidian-950">
        <Image
          src={option.thumbnail}
          alt={label}
          fill
          sizes="(max-width: 768px) 50vw, 280px"
          className="object-contain"
        />
        {selected && (
          <div className="pointer-events-none absolute inset-0 ring-2 ring-inset ring-cyan-accent/70" />
        )}
      </div>
      <div className="px-3 py-3">
        <div
          className={`font-display text-base font-semibold tracking-wide ${
            selected ? "text-cyan-accent" : "text-text-primary"
          }`}
        >
          {label}
        </div>
        <p className="mt-1 text-[13px] text-text-muted leading-relaxed line-clamp-2">{description}</p>
      </div>
    </motion.button>
  );
}

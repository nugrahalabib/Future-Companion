"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useCompanionStore } from "@/stores/useCompanionStore";
import { EXTREME_FEATURES, getSkinTone } from "@/lib/companionAssets";
import { useT } from "@/lib/i18n/useT";

interface FinalRevealProps {
  imagePath: string;
}

export default function FinalReveal({ imagePath }: FinalRevealProps) {
  const skinTone = useCompanionStore((s) => s.skinTone);
  const features = useCompanionStore((s) => s.features);
  const skin = getSkinTone(skinTone);
  const role = useCompanionStore((s) => s.role);
  const companionName = useCompanionStore((s) => s.companionName);
  const { t } = useT();
  const roleKey = role.split("-")[0];
  const knownRoles = ["romantic", "dominant", "passive", "intellectual"];
  const roleLabel = knownRoles.includes(roleKey)
    ? t(`creator.persona.role.${roleKey}.label`)
    : role
        .split("-")
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" ");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
      className="flex flex-col items-center gap-6"
    >
      <div className="relative">
        <motion.div
          className="relative aspect-[2/3] w-[340px] md:w-[420px] rounded-3xl border border-cyan-accent/40 bg-obsidian-950"
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          style={{
            boxShadow:
              "0 0 60px rgba(0,240,255,0.35), 0 0 120px rgba(0,240,255,0.15)",
          }}
        >
          <div
            className="absolute inset-0 transition-[filter] duration-700"
            style={{ filter: skin.cssFilter }}
          >
            <Image
              src={imagePath}
              alt={t("assembly.alt")}
              fill
              sizes="420px"
              className="object-contain"
              priority
            />
          </div>

          {/* Feature badges */}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
            {EXTREME_FEATURES.map((f) =>
              features[f.id] ? (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-display uppercase tracking-[0.2em] backdrop-blur-sm"
                  style={{
                    backgroundColor: `${f.badgeColor}22`,
                    borderColor: `${f.badgeColor}80`,
                    color: f.badgeColor,
                    boxShadow: `0 0 12px ${f.badgeColor}55`,
                  }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: f.badgeColor }} />
                  {f.id === "artificialWomb" ? t("assembly.badge.womb") : t("assembly.badge.sperm")}
                </motion.div>
              ) : null,
            )}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-center space-y-1"
      >
        <div className="font-display text-xs uppercase tracking-[0.3em] text-cyan-accent/80">
          {t("assembly.manifested")}
        </div>
        <div className="font-display text-2xl text-text-primary">
          {companionName.trim()
            ? t("assembly.ready", { name: companionName.trim() })
            : t("assembly.ready.fallback", { role: roleLabel })}
        </div>
      </motion.div>
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";
import GlassPanel from "./GlassPanel";
import { useT } from "@/lib/i18n/useT";

interface Props {
  reason: "manual_pause" | "outside_schedule" | null;
  message?: string;
  schedule?: { enabled: boolean; activeFromHour: number; activeToHour: number } | null;
}

export default function DemoPausedScreen({ reason, message, schedule }: Props) {
  const { t } = useT();

  const headlineKey =
    reason === "outside_schedule"
      ? "demo.paused.headline.schedule"
      : "demo.paused.headline.manual";

  const scheduleLine =
    reason === "outside_schedule" && schedule?.enabled
      ? t("demo.paused.schedule", {
          from: String(schedule.activeFromHour).padStart(2, "0"),
          to: String(schedule.activeToHour).padStart(2, "0"),
        })
      : "";

  return (
    <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-lg"
      >
        <GlassPanel variant="elevated" className="p-8 text-center space-y-4 border border-cyan-accent/20">
          <div className="mx-auto w-14 h-14 rounded-full border border-cyan-accent/40 bg-cyan-accent/10 flex items-center justify-center">
            <span className="text-cyan-accent text-2xl">◴</span>
          </div>
          <p className="text-[10px] font-display uppercase tracking-widest text-cyan-accent">
            {t("demo.paused.badge")}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary">
            {t(headlineKey)}
          </h1>
          <p className="text-sm text-text-secondary whitespace-pre-line">
            {message && message.trim().length > 0 ? message : t("demo.paused.defaultMessage")}
          </p>
          {scheduleLine && (
            <p className="text-xs text-text-muted">{scheduleLine}</p>
          )}
          <p className="text-[11px] text-text-muted pt-2">
            {t("demo.paused.footer")}
          </p>
        </GlassPanel>
      </motion.div>
    </div>
  );
}

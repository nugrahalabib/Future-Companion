"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ToolEvent } from "@/lib/companionTools";
import { useT } from "@/lib/i18n/useT";

interface Props {
  events: ToolEvent[];
}

const ICONS: Record<string, string> = {
  set_smart_home: "◇",
  set_reminder: "◷",
  check_weather: "◎",
};

function summarizeArgs(ev: ToolEvent): string {
  if (ev.name === "set_smart_home") {
    const d = ev.args.device as string | undefined;
    const a = ev.args.action as string | undefined;
    const i = ev.args.intensity as number | undefined;
    return `${d ?? "device"} · ${a ?? "on"}${i !== undefined ? ` · ${i}%` : ""}`;
  }
  if (ev.name === "set_reminder") {
    const t = ev.args.topic as string | undefined;
    const m = ev.args.inMinutes as number | undefined;
    return `${t ?? ""} · +${m ?? 0}m`;
  }
  if (ev.name === "check_weather") {
    const city = (ev.result.city as string) ?? (ev.args.city as string);
    const temp = ev.result.tempC as number | undefined;
    const summary = ev.result.summary as string | undefined;
    return `${city ?? "—"} · ${temp ?? "?"}°C · ${summary ?? ""}`;
  }
  return "";
}

export default function CompanionActionsOverlay({ events }: Props) {
  const { t } = useT();
  const recent = events.slice(-3);
  if (recent.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 w-[280px]">
      <span className="font-display text-[10px] uppercase tracking-[0.3em] text-text-muted px-1">
        {t("encounter.tool.title")}
      </span>
      <AnimatePresence initial={false}>
        {recent.map((ev) => (
          <motion.div
            key={ev.id}
            layout
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-xl border border-cyan-accent/30 bg-obsidian-950/75 backdrop-blur-md px-3 py-2"
            style={{ boxShadow: "0 0 18px rgba(0,240,255,0.15)" }}
          >
            <div className="flex items-start gap-2.5">
              <span className="font-display text-cyan-accent text-lg leading-none mt-0.5">
                {ICONS[ev.name] ?? "◆"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-display text-[11px] uppercase tracking-[0.22em] text-cyan-accent/90 truncate">
                  {t(`encounter.tool.${ev.name}`) || ev.name}
                </div>
                <div className="mt-0.5 text-[12px] text-text-secondary truncate">
                  {summarizeArgs(ev)}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

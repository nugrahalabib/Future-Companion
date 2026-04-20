"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useT } from "@/lib/i18n/useT";

interface AssemblyAnimationProps {
  durationMs: number;
}

type LogLine = {
  ts: number; // seconds from start
  text: string;
  kind: "info" | "ok" | "warn" | "head";
};

export default function AssemblyAnimation({ durationMs }: AssemblyAnimationProps) {
  const { t } = useT();
  const [elapsed, setElapsed] = useState(0); // ms
  const containerRef = useRef<HTMLDivElement | null>(null);

  const script: LogLine[] = useMemo(
    () => [
      { ts: 0.00, kind: "head", text: "GENESIS PROTOCOL v2.4 — UNIT-0421" },
      { ts: 0.10, kind: "info", text: "$ sudo forge --target=humanoid --persona=custom" },
      { ts: 0.55, kind: "info", text: t("assembly.phase.calibrate.title") + "…" },
      { ts: 1.10, kind: "ok",   text: "  [✓] neural lattice aligned   (0.002ms drift)" },
      { ts: 1.45, kind: "info", text: t("assembly.phase.scaffold.title") + "…" },
      { ts: 2.05, kind: "ok",   text: "  [✓] skeletal frame locked    (128 anchors)" },
      { ts: 2.40, kind: "info", text: t("assembly.phase.weave.title") + "…" },
      { ts: 3.20, kind: "ok",   text: "  [✓] dermal substrate woven   (4.8M fibers)" },
      { ts: 3.55, kind: "info", text: t("assembly.phase.imprint.title") + "…" },
      { ts: 4.35, kind: "ok",   text: "  [✓] persona matrix imprinted (signature OK)" },
      { ts: 4.70, kind: "info", text: t("assembly.phase.seal.title") + "…" },
      { ts: 5.40, kind: "ok",   text: "  [✓] composite manifold sealed" },
      { ts: 5.75, kind: "head", text: "∎ assembly complete — vessel ready for embodiment" },
    ],
    [t],
  );

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const e = performance.now() - start;
      setElapsed(e);
      if (e < durationMs + 200) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [durationMs]);

  const seconds = elapsed / 1000;
  const totalSeconds = durationMs / 1000;

  // Typewriter: for each revealed line, count how many chars to show
  const visibleLines = useMemo(() => {
    const charsPerSecond = 65;
    return script
      .filter((l) => seconds >= l.ts)
      .map((l) => {
        const delta = seconds - l.ts;
        const maxChars = l.text.length;
        const shown = Math.min(maxChars, Math.floor(delta * charsPerSecond));
        return { ...l, shown };
      });
  }, [script, seconds]);

  // Auto-scroll terminal body as new lines arrive
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [visibleLines.length]);

  const progress = Math.min(1, seconds / totalSeconds);
  const progressPct = Math.round(progress * 100);

  // Simple stable blinking cursor (no twitchy CSS keyframes)
  const [cursorOn, setCursorOn] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setCursorOn((c) => !c), 530);
    return () => clearInterval(id);
  }, []);

  const kindColor = (k: LogLine["kind"]) => {
    switch (k) {
      case "head": return "text-cyan-accent";
      case "ok":   return "text-[#39FF14]";
      case "warn": return "text-[#F0C27B]";
      default:     return "text-text-primary/85";
    }
  };

  const lastLineIdx = visibleLines.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="w-full select-none"
      style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" }}
    >
      {/* Terminal window */}
      <div className="rounded-xl border border-glass-border bg-[#070A10]/95 shadow-[0_0_40px_rgba(0,240,255,0.08)] overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-glass-border/70 bg-[#0B0F17] px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]/80" />
          <div className="flex-1 text-center text-[11px] tracking-[0.25em] uppercase text-text-muted">
            forge@sovereign ~ genesis
          </div>
          <div className="text-[11px] tabular-nums text-text-muted/80">
            {seconds.toFixed(2)}s
          </div>
        </div>

        {/* Body */}
        <div
          ref={containerRef}
          className="relative h-[360px] overflow-y-auto px-5 py-4 text-[14px] leading-[1.65]"
        >
          {visibleLines.map((l, i) => {
            const isLast = i === lastLineIdx;
            const shownText = l.text.slice(0, l.shown);
            return (
              <div key={i} className={kindColor(l.kind)}>
                <span className="whitespace-pre-wrap">{shownText}</span>
                {isLast && seconds < totalSeconds && cursorOn && (
                  <span className="ml-0.5 inline-block h-[1em] w-[0.55ch] translate-y-[2px] bg-cyan-accent" />
                )}
              </div>
            );
          })}
        </div>

        {/* Footer progress bar */}
        <div className="border-t border-glass-border/70 bg-[#0B0F17] px-4 py-2.5">
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-[0.3em] text-text-muted">
              {t("assembly.assembling")}
            </span>
            <div className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-obsidian-border">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-accent to-[#39FF14] transition-[width] duration-150"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="w-[3ch] text-right text-[11px] tabular-nums text-text-muted">
              {progressPct}%
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

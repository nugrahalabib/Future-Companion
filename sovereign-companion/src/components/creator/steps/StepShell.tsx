"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface StepShellProps {
  step: number;
  total: number;
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function StepShell({ step, total, title, subtitle, children }: StepShellProps) {
  return (
    <motion.div
      key={step}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-3"
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-[12px] font-display uppercase tracking-[0.25em] text-cyan-accent/80">
          <span>Step {String(step).padStart(2, "0")}</span>
          <span className="text-text-muted/60">/</span>
          <span className="text-text-muted/70">{String(total).padStart(2, "0")}</span>
        </div>
        <h2 className="font-display text-2xl lg:text-3xl font-semibold text-text-primary leading-tight">{title}</h2>
        <p className="text-sm md:text-[15px] text-text-secondary leading-relaxed">{subtitle}</p>
      </div>
      <div>{children}</div>
    </motion.div>
  );
}

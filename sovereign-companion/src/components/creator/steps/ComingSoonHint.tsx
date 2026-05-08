"use client";

import { motion } from "framer-motion";
import { useT } from "@/lib/i18n/useT";

// Banner shown under the option grid when the user has picked a coming-soon
// item. Tells them they can preview but must pick an available option to
// proceed to the next step.
export default function ComingSoonHint() {
  const { t } = useT();
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-5 flex items-start gap-3 rounded-xl border border-[#F5A524]/40 bg-[#F5A524]/5 px-4 py-3"
    >
      <span
        className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#F5A524]/60 bg-[#F5A524]/10 font-display text-[11px] text-[#F5A524]"
        aria-hidden
      >
        !
      </span>
      <div className="flex-1">
        <div className="font-display text-[13px] uppercase tracking-[0.18em] text-[#F5A524]">
          {t("common.comingSoon")}
        </div>
        <p className="mt-1 text-[13px] text-text-secondary leading-relaxed">
          {t("creator.comingSoon.hint")}
        </p>
      </div>
    </motion.div>
  );
}

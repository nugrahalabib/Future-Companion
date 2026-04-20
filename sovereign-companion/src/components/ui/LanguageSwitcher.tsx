"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useLocaleStore, type Locale } from "@/stores/useLocaleStore";
import { useT } from "@/lib/i18n/useT";

const OPTIONS: { id: Locale; full: string; flag: string }[] = [
  { id: "id", full: "Bahasa Indonesia", flag: "/assets/id-en/ID.png" },
  { id: "en", full: "English", flag: "/assets/id-en/EN.png" },
];

export default function LanguageSwitcher({
  className = "",
}: {
  className?: string;
}) {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const { t } = useT();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [tooltip, setTooltip] = useState(false);

  // Silence unused-var: admin now exposes the switcher too (researchers + students
  // need ID copy). Keep pathname hook wired in case future surfaces want to opt out.
  void pathname;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.lang = locale;
  }, [locale, mounted]);

  const activeIndex = OPTIONS.findIndex((o) => o.id === locale);

  return (
    <div
      className={`fixed top-4 right-4 z-50 pointer-events-auto ${className}`}
      onMouseEnter={() => setTooltip(true)}
      onMouseLeave={() => setTooltip(false)}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : -8 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative"
      >
        <div
          role="radiogroup"
          aria-label={t("lang.label")}
          className="glass-elevated relative flex items-center gap-1 p-1 rounded-full border border-glass-border backdrop-blur-xl shadow-lg"
        >
          <motion.div
            className="absolute top-1 bottom-1 w-[calc(50%-0.25rem)] rounded-full bg-cyan-accent/15 border border-cyan-accent/35"
            initial={false}
            animate={{
              left: activeIndex === 0 ? "0.25rem" : "calc(50%)",
            }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
          />
          {OPTIONS.map((opt) => {
            const isActive = opt.id === locale;
            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={isActive}
                aria-label={opt.full}
                onClick={() => setLocale(opt.id)}
                className={`relative z-10 flex items-center justify-center px-3 py-1.5 rounded-full transition-opacity cursor-pointer select-none ${
                  isActive ? "opacity-100" : "opacity-60 hover:opacity-90"
                }`}
              >
                <span className="relative block h-5 w-8 overflow-hidden rounded-sm ring-1 ring-glass-border" aria-hidden>
                  <Image
                    src={opt.flag}
                    alt={opt.full}
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                </span>
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {tooltip && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 px-2.5 py-1 rounded-md glass border border-glass-border text-[10px] font-display uppercase tracking-widest text-text-secondary whitespace-nowrap"
            >
              {t("lang.label")} · {OPTIONS.find((o) => o.id === locale)?.full}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

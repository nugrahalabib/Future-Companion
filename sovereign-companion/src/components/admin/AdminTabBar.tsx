"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useT } from "@/lib/i18n/useT";

const TABS = [
  { href: "/admin/overview", key: "overview", tKey: "admin.tab.overview" },
  { href: "/admin/respondents", key: "respondents", tKey: "admin.tab.respondents" },
  { href: "/admin/transcripts", key: "transcripts", tKey: "admin.tab.transcripts" },
  { href: "/admin/insights", key: "insights", tKey: "admin.tab.insights" },
  { href: "/admin/research", key: "research", tKey: "admin.tab.research" },
  { href: "/admin/export", key: "export", tKey: "admin.tab.export" },
  { href: "/admin/settings", key: "settings", tKey: "admin.tab.settings" },
] as const;

export default function AdminTabBar() {
  const pathname = usePathname();
  const { t } = useT();

  return (
    <nav
      aria-label="Admin navigation"
      className="sticky top-0 z-40 -mx-6 lg:-mx-8 mb-6 px-6 lg:px-8 border-b border-glass-border bg-obsidian/70 backdrop-blur-xl"
    >
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-thin">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname?.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={`relative px-3 sm:px-4 py-3 text-xs sm:text-sm font-display uppercase tracking-widest whitespace-nowrap transition-colors ${
                active
                  ? "text-cyan-accent"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {t(tab.tKey)}
              {active && (
                <motion.span
                  layoutId="admin-tab-underline"
                  className="absolute left-2 right-2 -bottom-px h-[2px] rounded-full bg-cyan-accent"
                  style={{ boxShadow: "0 0 10px rgba(0,240,255,0.6)" }}
                  transition={{ type: "spring", stiffness: 360, damping: 28 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

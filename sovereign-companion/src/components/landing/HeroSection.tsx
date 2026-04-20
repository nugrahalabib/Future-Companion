"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import GlassButton from "@/components/ui/GlassButton";
import DemoPausedScreen from "@/components/ui/DemoPausedScreen";
import { useSessionStore } from "@/stores/useSessionStore";
import { useUserStore } from "@/stores/useUserStore";
import { useCompanionStore } from "@/stores/useCompanionStore";
import { useEncounterStore } from "@/stores/useEncounterStore";
import { useT } from "@/lib/i18n/useT";
import { useDemoStatus } from "@/lib/useDemoStatus";

export default function HeroSection() {
  const router = useRouter();
  const { t, locale } = useT();
  const { status } = useDemoStatus();

  if (status && !status.active) {
    return (
      <DemoPausedScreen
        reason={status.reason === "ok" ? null : status.reason}
        message={status.message}
        schedule={status.schedule}
      />
    );
  }

  // "Start Fresh" — the landing CTA always wipes browser-side session state so
  // the next user at the exhibition booth begins from a clean slate. Records
  // committed to the SQLite DB stay intact for research. Session stage is set
  // atomically to 2 so the RouteGuard on /register sees the correct stage on
  // the first render after navigation (splitting reset() + setStage(2) into
  // two calls left a one-tick window where currentStage was 1).
  const handleStart = () => {
    useUserStore.getState().clearUser();
    useCompanionStore.getState().reset();
    useEncounterStore.getState().reset();
    useSessionStore.setState({ sessionId: null, currentStage: 2 });
    router.push("/register");
  };

  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
      {/* Headline */}
      <motion.h1
        className="font-display text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-text-primary leading-[1.1] whitespace-nowrap"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
      >
        <span className="block">{t("landing.headline.main")}</span>
        {t("landing.headline.accent") ? (
          <span className="block mt-2 text-cyan-accent">{t("landing.headline.accent")}</span>
        ) : null}
      </motion.h1>

      {/* Sub-headline */}
      <motion.p
        className="mt-6 text-lg md:text-xl text-text-secondary max-w-2xl leading-relaxed"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.8, ease: "easeOut" }}
      >
        {t("landing.subtitle.primary")}
      </motion.p>

      {/* Accent sub-subtitle (secondary language) */}
      {locale === "id" && t("landing.subtitle.secondary") ? (
        <motion.p
          className="mt-3 text-base text-text-muted max-w-xl leading-relaxed italic"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.8, ease: "easeOut" }}
        >
          {t("landing.subtitle.secondary")}
        </motion.p>
      ) : null}

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.8, duration: 0.6, ease: "easeOut" }}
        className="mt-12"
      >
        <GlassButton
          size="lg"
          pulse
          onClick={handleStart}
        >
          {t("landing.cta")}
        </GlassButton>
      </motion.div>

      {/* Year badge + Admin link */}
      <motion.div
        className="absolute bottom-8 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5, duration: 1 }}
      >
        <span className="text-xs text-text-muted font-display tracking-widest uppercase">
          {t("common.footer")}
        </span>
        <button
          onClick={() => router.push("/admin")}
          className="text-[10px] text-text-muted/40 hover:text-cyan-accent/60 transition-colors font-display tracking-wider uppercase cursor-pointer"
        >
          {t("landing.adminLink")}
        </button>
      </motion.div>
    </div>
  );
}

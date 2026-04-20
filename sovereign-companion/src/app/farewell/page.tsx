"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import Background from "@/components/layout/Background";
import GlassPanel from "@/components/ui/GlassPanel";
import GlassButton from "@/components/ui/GlassButton";
import { useUserStore } from "@/stores/useUserStore";
import { useSessionStore } from "@/stores/useSessionStore";
import { useCompanionStore } from "@/stores/useCompanionStore";
import { useEncounterStore } from "@/stores/useEncounterStore";
import { useT } from "@/lib/i18n/useT";
import { useHydrated } from "@/lib/useHydrated";

// Auto-redirect to landing so the booth is ready for the next visitor. Short
// enough that a queue doesn't stall, long enough that the current visitor can
// read the thank-you and finish scanning the QR into their phone.
const AUTO_RETURN_SECONDS = 60;
const QUESTIONNAIRE_BASE_URL = "https://companion.agentbuff.id/questionnaire";

export default function FarewellPage() {
  const router = useRouter();
  const hydrated = useHydrated(["user", "session"]);
  const userId = useUserStore((s) => s.userId);
  const { t } = useT();

  const [count, setCount] = useState(AUTO_RETURN_SECONDS);

  // Attach the booth user's ID so the phone-side submission is tied back to
  // this visitor's session in the DB. Without it we'd lose attribution.
  const questionnaireUrl = userId
    ? `${QUESTIONNAIRE_BASE_URL}?uid=${encodeURIComponent(userId)}`
    : QUESTIONNAIRE_BASE_URL;

  // Hard-wipe browser state and send the next visitor to landing. Same pattern
  // as the landing CTA reset so the booth restarts cleanly. SQLite records
  // aren't touched — research data stays intact.
  const returnToLanding = useCallback(() => {
    useUserStore.getState().clearUser();
    useCompanionStore.getState().reset();
    useEncounterStore.getState().reset();
    useSessionStore.setState({ sessionId: null, currentStage: 1 });
    router.push("/");
  }, [router]);

  useEffect(() => {
    if (!hydrated) return;
    if (!userId) {
      router.replace("/");
    }
  }, [hydrated, userId, router]);

  useEffect(() => {
    if (count <= 0) {
      returnToLanding();
      return;
    }
    const timer = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [count, returnToLanding]);

  if (!hydrated || !userId) return null;

  return (
    <main className="relative flex-1 overflow-hidden">
      <Background />
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-5"
        >
          {/* Left — QR panel */}
          <GlassPanel variant="elevated" className="p-8 flex flex-col items-center text-center">
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="font-display text-[10px] uppercase tracking-[0.35em] text-bio-green mb-3"
              style={{ textShadow: "0 0 10px rgba(57,255,20,0.6)" }}
            >
              {t("farewell.badge")}
            </motion.span>

            <h1 className="font-display text-3xl lg:text-4xl font-bold text-text-primary leading-tight">
              {t("farewell.heading")}
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-4 text-base lg:text-lg font-semibold text-text-primary leading-relaxed max-w-md rounded-xl border border-cyan-accent/40 bg-cyan-accent/10 px-4 py-3"
              style={{
                boxShadow:
                  "0 0 0 1px rgba(0,240,255,0.2), 0 0 24px rgba(0,240,255,0.15)",
                textShadow: "0 0 14px rgba(0,240,255,0.35)",
              }}
            >
              {t("farewell.subheading")}
            </motion.p>

            <p className="mt-6 font-display text-[10px] uppercase tracking-[0.3em] text-cyan-accent/80">
              {t("farewell.qrHint")}
            </p>

            {/* QR — cyan-on-obsidian, framed to feel like the neuro-sigil from
                checkout so the visual language stays consistent. */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 180, damping: 22 }}
              className="relative mt-3 p-4 rounded-2xl bg-white"
              style={{
                boxShadow:
                  "0 0 0 1px rgba(0,240,255,0.35), 0 0 40px rgba(0,240,255,0.25)",
              }}
            >
              <QRCodeSVG
                value={questionnaireUrl}
                size={220}
                level="H"
                bgColor="#FFFFFF"
                fgColor="#05060A"
                marginSize={1}
              />
            </motion.div>

            <div className="mt-4 flex flex-col items-center">
              <span className="font-display text-[9px] uppercase tracking-[0.3em] text-text-muted">
                {t("farewell.urlLabel")}
              </span>
              <code className="mt-1 text-xs text-cyan-accent font-mono">
                companion.agentbuff.id/questionnaire
              </code>
            </div>
          </GlassPanel>

          {/* Right — gift + controls */}
          <div className="flex flex-col gap-5">
            <GlassPanel variant="default" className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-md border border-bio-green/50 text-bio-green text-[12px] font-display"
                  style={{ textShadow: "0 0 8px rgba(57,255,20,0.6)" }}
                >
                  ✦
                </span>
                <h2 className="font-display text-base font-semibold text-text-primary">
                  {t("farewell.giftTitle")}
                </h2>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                {t("farewell.giftBody")}
              </p>
            </GlassPanel>

            <GlassPanel variant="default" className="p-6 space-y-4 text-center">
              <motion.div
                key={count}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="font-display text-5xl font-bold text-cyan-accent leading-none tabular-nums"
                style={{ textShadow: "0 0 25px rgba(0,240,255,0.45)" }}
              >
                {count}
              </motion.div>
              <p className="text-xs text-text-muted font-display uppercase tracking-[0.25em]">
                {t("farewell.countdown", { count })}
              </p>

              <div className="h-1 w-full overflow-hidden rounded-full bg-glass-border">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: "linear-gradient(90deg, #00F0FF 0%, #39FF14 100%)",
                    boxShadow: "0 0 10px rgba(0,240,255,0.5)",
                  }}
                  animate={{ width: `${(count / AUTO_RETURN_SECONDS) * 100}%` }}
                  transition={{ duration: 1, ease: "linear" }}
                />
              </div>

              <GlassButton className="w-full mt-2" size="lg" pulse onClick={returnToLanding}>
                {t("farewell.nextUser")}
              </GlassButton>
            </GlassPanel>

            <p className="text-center text-[10px] font-display uppercase tracking-[0.3em] text-text-muted">
              {t("farewell.footer")}
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Background from "@/components/layout/Background";
import GlassButton from "@/components/ui/GlassButton";
import RouteGuard from "@/components/layout/RouteGuard";
import AssemblyAnimation from "@/components/assembly/AssemblyAnimation";
import FinalReveal from "@/components/assembly/FinalReveal";
import { useCompanionStore } from "@/stores/useCompanionStore";
import { useSessionStore } from "@/stores/useSessionStore";
import { useUserStore } from "@/stores/useUserStore";
import { useT } from "@/lib/i18n/useT";
import { useHydrated } from "@/lib/useHydrated";

type Phase = "assembling" | "revealing" | "ready";

const ASSEMBLY_DURATION_MS = 6500;

export default function AssemblyPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("assembling");
  const finalImagePath = useCompanionStore((s) => s.finalImagePath);
  const recomputeFinalImagePath = useCompanionStore((s) => s.recomputeFinalImagePath);
  const companionName = useCompanionStore((s) => s.companionName);
  const setStage = useSessionStore((s) => s.setStage);
  const sessionId = useSessionStore((s) => s.sessionId);
  const userId = useUserStore((s) => s.userId);
  const hydrated = useHydrated(["user", "session", "companion"]);
  const { t } = useT();

  // In case the store was re-hydrated without the derived path computed
  useEffect(() => {
    if (!finalImagePath) recomputeFinalImagePath();
  }, [finalImagePath, recomputeFinalImagePath]);

  useEffect(() => {
    if (!hydrated) return;
    if (!userId) {
      router.replace("/register");
    }
  }, [hydrated, userId, router]);

  // Drive phase progression
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("revealing"), ASSEMBLY_DURATION_MS);
    const t2 = setTimeout(() => setPhase("ready"), ASSEMBLY_DURATION_MS + 1600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Persist assembledAt timestamp once we reach reveal
  useEffect(() => {
    if (phase !== "revealing" || !sessionId) return;
    fetch("/api/sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        assembledAt: new Date().toISOString(),
      }),
    }).catch(() => {});
  }, [phase, sessionId]);

  const handleBegin = () => {
    setStage(5);
    router.push("/encounter");
  };

  if (!hydrated || !userId) return null;

  return (
    <RouteGuard requiredStage={4}>
      <main className="relative flex-1 overflow-hidden">
        <Background />
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-10">
          <AnimatePresence mode="wait">
            {phase === "assembling" && (
              <motion.div
                key="assembling"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="relative w-full max-w-3xl"
              >
                <AssemblyAnimation durationMs={ASSEMBLY_DURATION_MS} />
              </motion.div>
            )}

            {(phase === "revealing" || phase === "ready") && finalImagePath && (
              <motion.div
                key="reveal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col items-center gap-8"
              >
                <FinalReveal imagePath={finalImagePath} />
                {phase === "ready" && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <GlassButton size="lg" pulse onClick={handleBegin}>
                      {companionName.trim()
                        ? t("assembly.begin", { name: companionName.trim() })
                        : t("assembly.begin.fallback")}
                    </GlassButton>
                  </motion.div>
                )}
              </motion.div>
            )}

            {phase !== "assembling" && !finalImagePath && (
              <motion.div
                key="missing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <p className="text-text-secondary mb-4">
                  {t("assembly.missing")}
                </p>
                <GlassButton variant="secondary" onClick={() => router.push("/creator")}>
                  {t("assembly.back")}
                </GlassButton>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </RouteGuard>
  );
}

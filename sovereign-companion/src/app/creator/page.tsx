"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Background from "@/components/layout/Background";
import GlassButton from "@/components/ui/GlassButton";
import RouteGuard from "@/components/layout/RouteGuard";
import CompanionVisual from "@/components/creator/CompanionVisual";
import GenderStep from "@/components/creator/steps/GenderStep";
import FaceShapeStep from "@/components/creator/steps/FaceShapeStep";
import HairStyleStep from "@/components/creator/steps/HairStyleStep";
import BodyBuildStep from "@/components/creator/steps/BodyBuildStep";
import SkinToneStep from "@/components/creator/steps/SkinToneStep";
import ExtremeFeaturesStep from "@/components/creator/steps/ExtremeFeaturesStep";
import PersonaStep from "@/components/creator/steps/PersonaStep";
import HobbiesStep from "@/components/creator/steps/HobbiesStep";
import { useCompanionStore } from "@/stores/useCompanionStore";
import { useUserStore } from "@/stores/useUserStore";
import { useSessionStore } from "@/stores/useSessionStore";
import { CREATOR_STEPS, TOTAL_CREATOR_STEPS } from "@/lib/companionAssets";
import { useT } from "@/lib/i18n/useT";
import { useHydrated } from "@/lib/useHydrated";

const STEP_COMPONENTS: Record<number, () => React.ReactElement> = {
  1: GenderStep,
  2: FaceShapeStep,
  3: HairStyleStep,
  4: BodyBuildStep,
  5: SkinToneStep,
  6: ExtremeFeaturesStep,
  7: PersonaStep,
  8: HobbiesStep,
};

export default function CreatorPage() {
  const router = useRouter();
  const userId = useUserStore((s) => s.userId);
  const setStage = useSessionStore((s) => s.setStage);
  const { t } = useT();
  const hydrated = useHydrated(["user", "session", "companion"]);

  const currentStep = useCompanionStore((s) => s.currentStep);
  const nextStep = useCompanionStore((s) => s.nextStep);
  const prevStep = useCompanionStore((s) => s.prevStep);
  const companionName = useCompanionStore((s) => s.companionName);

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveConfig = useCallback(async () => {
    if (!userId) return;
    const config = useCompanionStore.getState().getFullConfig();
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/companion-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...config }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaveStatus("saved");
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = setTimeout(() => setSaveStatus("idle"), 1500);
    } catch {
      setSaveStatus("error");
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = setTimeout(() => setSaveStatus("idle"), 3500);
    }
  }, [userId]);

  // Auto-save on any store change, debounced 2s
  useEffect(() => {
    const unsub = useCompanionStore.subscribe(() => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(saveConfig, 2000);
    });
    return () => {
      unsub();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    };
  }, [saveConfig]);

  useEffect(() => {
    if (!hydrated) return;
    if (!userId) router.replace("/register");
  }, [hydrated, userId, router]);

  const canProceed = useCanProceed(currentStep);
  const isLastStep = currentStep >= TOTAL_CREATOR_STEPS;

  const handleNext = () => {
    if (!canProceed) return;
    nextStep();
  };

  const handleAwaken = async () => {
    setSaving(true);
    await saveConfig();
    setStage(4);
    router.push("/assembly");
  };

  const StepComponent = STEP_COMPONENTS[currentStep] ?? GenderStep;
  const currentMeta = CREATOR_STEPS[currentStep - 1];

  if (!hydrated || !userId) return null;

  return (
    <RouteGuard requiredStage={3}>
      <main className="relative flex-1 overflow-hidden">
        <Background />

        {/* Auto-save toast */}
        <AnimatePresence>
          {saveStatus !== "idle" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed top-4 left-4 z-50"
            >
              <div
                className={`px-3 py-1.5 rounded-lg text-xs font-display backdrop-blur-sm ${
                  saveStatus === "saving"
                    ? "bg-cyan-accent/10 text-cyan-accent border border-cyan-accent/20"
                    : saveStatus === "saved"
                      ? "bg-bio-green/10 text-bio-green border border-bio-green/20"
                      : "bg-danger/10 text-danger border border-danger/20"
                }`}
              >
                {saveStatus === "saving" && t("common.saving")}
                {saveStatus === "saved" && t("common.saved")}
                {saveStatus === "error" && t("common.saveFailed")}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
          {/* Left — stepper */}
          <motion.div
            className="lg:w-[60%] px-5 py-4 lg:px-8 lg:py-5"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <header className="mb-3">
              <h1 className="font-display text-xl lg:text-2xl font-bold text-text-primary leading-tight">{t("creator.heading")}</h1>
              <p className="text-xs text-text-secondary mt-0.5">
                {t("creator.subtitle")}
              </p>
            </header>

            <StepIndicator step={currentStep} />

            <div className="mt-4 pb-24">
              <AnimatePresence mode="wait">
                <StepComponent key={currentStep} />
              </AnimatePresence>
            </div>

            {/* Navigator */}
            <div className="fixed bottom-0 left-0 lg:w-[60%] w-full border-t border-glass-border bg-obsidian-950/80 backdrop-blur-md px-4 py-2.5 flex items-center justify-between gap-4">
              <GlassButton
                variant="secondary"
                size="md"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                {t("common.back")}
              </GlassButton>
              <div className="text-xs font-display uppercase tracking-[0.25em] text-text-muted">
                {currentMeta ? t(currentMeta.titleKey) : ""}
              </div>
              {!isLastStep ? (
                <GlassButton size="md" onClick={handleNext} disabled={!canProceed}>
                  {t("common.next")}
                </GlassButton>
              ) : (
                <GlassButton size="md" pulse onClick={handleAwaken} disabled={saving || !canProceed}>
                  {saving
                    ? t("creator.awaken.loading")
                    : companionName.trim()
                      ? t("creator.awaken", { name: companionName.trim() })
                      : t("creator.awaken.fallback")}
                </GlassButton>
              )}
            </div>
          </motion.div>

          {/* Right — live visual */}
          <motion.div
            className="hidden lg:block lg:w-[40%] border-l border-glass-border"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <CompanionVisual />
          </motion.div>
        </div>
      </main>
    </RouteGuard>
  );
}

function useCanProceed(step: number) {
  return useCompanionStore((s) => {
    switch (step) {
      case 1:
        return Boolean(s.gender);
      case 2:
        return Boolean(s.faceShape);
      case 3:
        return Boolean(s.hairStyle);
      case 4:
        return Boolean(s.bodyBuild);
      case 5:
        return Boolean(s.skinTone);
      case 6:
      case 7:
      case 8:
        return true;
      default:
        return false;
    }
  });
}

function StepIndicator({ step }: { step: number }) {
  const pct = useMemo(() => (step / TOTAL_CREATOR_STEPS) * 100, [step]);
  const { t } = useT();
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[9px] font-display uppercase tracking-[0.3em] text-text-muted">
        <span>{t("creator.progress")}</span>
        <span>
          {step} / {TOTAL_CREATOR_STEPS}
        </span>
      </div>
      <div className="h-0.5 w-full rounded-full bg-glass-border overflow-hidden">
        <motion.div
          className="h-full bg-cyan-accent"
          style={{ boxShadow: "0 0 12px rgba(0,240,255,0.6)" }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 30 }}
        />
      </div>
    </div>
  );
}

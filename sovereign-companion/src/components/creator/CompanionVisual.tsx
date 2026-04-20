"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo } from "react";
import { useCompanionStore } from "@/stores/useCompanionStore";
import {
  EXTREME_FEATURES,
  findVariant,
  getFaceOptions,
  getHairOptions,
  getBodyOptions,
  getSkinTone,
  type FeaturesState,
} from "@/lib/companionAssets";
import { useT } from "@/lib/i18n/useT";

/**
 * Right-panel spotlight during the creator flow.
 * Shows ONLY the most-recently-locked choice at large scale — never the final
 * composite. Final portrait is sealed until the Assembly (Awakening) sequence.
 */
export default function CompanionVisual() {
  const gender = useCompanionStore((s) => s.gender);
  const faceShape = useCompanionStore((s) => s.faceShape);
  const hairStyle = useCompanionStore((s) => s.hairStyle);
  const bodyBuild = useCompanionStore((s) => s.bodyBuild);
  const skinTone = useCompanionStore((s) => s.skinTone);
  const features = useCompanionStore((s) => s.features);
  const currentStep = useCompanionStore((s) => s.currentStep);
  const finalImagePath = useCompanionStore((s) => s.finalImagePath);
  const role = useCompanionStore((s) => s.role);
  const hobbies = useCompanionStore((s) => s.hobbies);
  const companionName = useCompanionStore((s) => s.companionName);
  const { t } = useT();

  const skin = getSkinTone(skinTone);
  const tLabel = (opt: { labelKey?: string; label: string } | null) =>
    opt ? (opt.labelKey ? t(opt.labelKey) : opt.label) : "—";

  const faceOption = useMemo(
    () => findVariant(getFaceOptions(gender), faceShape),
    [gender, faceShape],
  );
  const hairOption = useMemo(
    () => findVariant(getHairOptions(gender), hairStyle),
    [gender, hairStyle],
  );
  const bodyOption = useMemo(
    () => findVariant(getBodyOptions(gender), bodyBuild),
    [gender, bodyBuild],
  );

  // Preload the final portrait as soon as we know the full combination
  // (so Assembly reveal is instant) — but never display it here.
  useEffect(() => {
    if (!finalImagePath || typeof document === "undefined") return;
    const existing = document.head.querySelector<HTMLLinkElement>(
      `link[rel="preload"][data-companion-preload="${finalImagePath}"]`,
    );
    if (existing) return;
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = finalImagePath;
    link.setAttribute("data-companion-preload", finalImagePath);
    document.head.appendChild(link);
  }, [finalImagePath]);

  const spotlight = resolveSpotlight({
    currentStep,
    gender,
    faceOption,
    hairOption,
    bodyOption,
    skin,
    t,
    tLabel,
    features,
    role,
    hobbies,
    companionName,
  });

  return (
    <div className="sticky top-0 flex h-[calc(100vh-0rem)] flex-col items-center justify-center gap-4 px-6 py-6">
      <div className="flex flex-col items-center gap-2">
        <span className="text-[10px] font-display uppercase tracking-[0.35em] text-cyan-accent/70">
          {spotlight.kicker}
        </span>
        <h3 className="font-display text-xl font-semibold text-text-primary">
          {spotlight.title}
        </h3>
      </div>

      {/* Main spotlight frame */}
      <div className="relative aspect-[3/4] w-full max-w-[440px] overflow-hidden rounded-3xl border border-glass-border bg-obsidian-950 shadow-[0_0_48px_rgba(0,240,255,0.08)]">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,240,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.06) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={spotlight.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 flex items-center justify-center p-6"
          >
            {spotlight.visual}
          </motion.div>
        </AnimatePresence>

        {/* Bottom readout */}
        <div className="absolute bottom-0 inset-x-0 border-t border-glass-border bg-black/60 px-3 py-2 backdrop-blur-sm">
          <div className="font-display text-[10px] uppercase tracking-[0.3em] text-cyan-accent/80 text-center">
            {spotlight.status}
          </div>
        </div>
      </div>

      {/* Compact locked-components checklist */}
      <div className="w-full max-w-[440px] grid grid-cols-4 gap-1.5">
        <LockedChip active={Boolean(gender)} label={t("visual.spec.gender")} />
        <LockedChip active={Boolean(faceOption)} label={t("visual.spec.face")} />
        <LockedChip active={Boolean(hairOption)} label={t("visual.spec.hair")} />
        <LockedChip active={Boolean(bodyOption)} label={t("visual.spec.body")} />
      </div>
    </div>
  );
}

function LockedChip({ active, label }: { active: boolean; label: string }) {
  return (
    <div
      className={`rounded-lg border px-2 py-1.5 text-center transition-colors ${
        active
          ? "border-cyan-accent/50 bg-cyan-accent/10"
          : "border-glass-border bg-glass-bg"
      }`}
    >
      <div
        className={`font-display text-[9px] uppercase tracking-[0.2em] ${
          active ? "text-cyan-accent" : "text-text-muted"
        }`}
      >
        {label}
      </div>
      <div
        className={`text-[10px] mt-0.5 ${
          active ? "text-bio-green" : "text-text-muted/40"
        }`}
      >
        {active ? "●" : "○"}
      </div>
    </div>
  );
}

type SpotlightResult = {
  key: string;
  kicker: string;
  title: string;
  status: string;
  visual: React.ReactNode;
};

function resolveSpotlight({
  currentStep,
  gender,
  faceOption,
  hairOption,
  bodyOption,
  skin,
  t,
  tLabel,
  features,
  role,
  hobbies,
  companionName,
}: {
  currentStep: number;
  gender: string | null;
  faceOption: { labelKey?: string; label: string; thumbnail: string } | null;
  hairOption: { labelKey?: string; label: string; thumbnail: string } | null;
  bodyOption: { labelKey?: string; label: string; thumbnail: string } | null;
  skin: { label: string; labelKey?: string; swatch: string };
  t: (key: string, vars?: Record<string, string | number>) => string;
  tLabel: (opt: { labelKey?: string; label: string } | null) => string;
  features: FeaturesState;
  role: string;
  hobbies: string[];
  companionName: string;
}): SpotlightResult {
  const name = companionName.trim();
  const sealedStatus = name
    ? t("visual.hint.sealed", { name })
    : t("visual.hint.sealed.fallback");
  const lockedStatus = t("visual.hint.locked");
  const waitingStatus = t("visual.hint.awaiting");

  // Step 1 — Gender
  if (currentStep <= 1) {
    return {
      key: `gender-${gender ?? "none"}`,
      kicker: t("visual.preview.gender"),
      title: gender ? tLabel({ label: gender, labelKey: `creator.gender.${gender}.label` }) : "—",
      status: gender ? lockedStatus : waitingStatus,
      visual: gender ? (
        <div className="flex flex-col items-center gap-4">
          <div className="font-display text-[180px] leading-none text-cyan-accent">
            {gender === "male" ? "♂" : "♀"}
          </div>
          <div className="font-display text-sm uppercase tracking-[0.3em] text-cyan-accent/70">
            {t("visual.framework", { gender })}
          </div>
        </div>
      ) : (
        <EmptyFrame label={t("visual.hint.awaiting")} />
      ),
    };
  }

  // Step 2 — Face
  if (currentStep === 2) {
    return {
      key: `face-${faceOption?.label ?? "none"}`,
      kicker: t("visual.preview.face"),
      title: tLabel(faceOption),
      status: faceOption ? lockedStatus : waitingStatus,
      visual: faceOption ? (
        <BigImage src={faceOption.thumbnail} alt={tLabel(faceOption)} />
      ) : (
        <EmptyFrame label={t("visual.hint.awaiting")} />
      ),
    };
  }

  // Step 3 — Hair
  if (currentStep === 3) {
    return {
      key: `hair-${hairOption?.label ?? "none"}`,
      kicker: t("visual.preview.hair"),
      title: tLabel(hairOption),
      status: hairOption ? lockedStatus : waitingStatus,
      visual: hairOption ? (
        <BigImage src={hairOption.thumbnail} alt={tLabel(hairOption)} />
      ) : (
        <EmptyFrame label={t("visual.hint.awaiting")} />
      ),
    };
  }

  // Step 4 — Body
  if (currentStep === 4) {
    return {
      key: `body-${bodyOption?.label ?? "none"}`,
      kicker: t("visual.preview.body"),
      title: tLabel(bodyOption),
      status: bodyOption ? lockedStatus : waitingStatus,
      visual: bodyOption ? (
        <BigImage src={bodyOption.thumbnail} alt={tLabel(bodyOption)} />
      ) : (
        <EmptyFrame label={t("visual.hint.awaiting")} />
      ),
    };
  }

  // Step 5 — Skin tone (large swatch card)
  if (currentStep === 5) {
    return {
      key: `skin-${skin.label}`,
      kicker: t("visual.preview.skin"),
      title: skin.labelKey ? t(skin.labelKey) : skin.label,
      status: lockedStatus,
      visual: (
        <div className="flex flex-col items-center gap-6">
          <div
            className="h-56 w-56 rounded-full border-4 border-glass-border shadow-[0_0_48px_rgba(0,240,255,0.15)]"
            style={{ backgroundColor: skin.swatch }}
          />
          <div className="font-display text-sm uppercase tracking-[0.3em] text-cyan-accent/70">
            {skin.labelKey ? t(skin.labelKey) : skin.label}
          </div>
        </div>
      ),
    };
  }

  // Step 6 — Biological modules
  if (currentStep === 6) {
    return {
      key: `features-${features.artificialWomb ? "w" : ""}${features.spermBank ? "s" : ""}`,
      kicker: t("visual.preview.features"),
      title: t("creator.extreme.title"),
      status: sealedStatus,
      visual: (
        <div className="flex flex-col items-center gap-5">
          <div className="flex gap-5">
            {EXTREME_FEATURES.map((f) => (
              <div
                key={f.id}
                className="flex h-28 w-28 flex-col items-center justify-center gap-1 rounded-2xl border backdrop-blur-sm transition-all"
                style={{
                  backgroundColor: features[f.id] ? `${f.badgeColor}22` : "transparent",
                  borderColor: features[f.id] ? `${f.badgeColor}80` : "rgba(255,255,255,0.1)",
                  boxShadow: features[f.id] ? `0 0 24px ${f.badgeColor}44` : "none",
                }}
              >
                <span
                  className="font-display text-3xl"
                  style={{ color: features[f.id] ? f.badgeColor : "rgba(255,255,255,0.25)" }}
                >
                  {f.id === "artificialWomb" ? "W" : "S"}
                </span>
                <span
                  className="font-display text-[9px] uppercase tracking-[0.2em]"
                  style={{ color: features[f.id] ? f.badgeColor : "rgba(255,255,255,0.4)" }}
                >
                  {features[f.id] ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
            ))}
          </div>
          <SealedNote t={t} />
        </div>
      ),
    };
  }

  // Step 7 — Persona
  if (currentStep === 7) {
    const roleLabelMap: Record<string, string> = {
      "romantic-partner": t("creator.persona.role.romantic.label"),
      "dominant-assistant": t("creator.persona.role.dominant.label"),
      "passive-listener": t("creator.persona.role.passive.label"),
      "intellectual-rival": t("creator.persona.role.intellectual.label"),
    };
    return {
      key: `persona-${role}`,
      kicker: t("visual.preview.persona"),
      title: roleLabelMap[role] ?? role,
      status: sealedStatus,
      visual: (
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="font-display text-4xl text-cyan-accent">✦</div>
          <div className="font-display text-lg text-text-primary">
            {roleLabelMap[role] ?? role}
          </div>
          <SealedNote t={t} />
        </div>
      ),
    };
  }

  // Step 8 — Hobbies
  return {
    key: `hobbies-${hobbies.length}`,
    kicker: t("visual.preview.hobbies"),
    title: hobbies.length ? `${hobbies.length}` : "—",
    status: sealedStatus,
    visual: (
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="font-display text-6xl text-cyan-accent leading-none">
          {hobbies.length}
        </div>
        <div className="font-display text-[10px] uppercase tracking-[0.3em] text-text-muted">
          {t("creator.hobbies.title")}
        </div>
        <div className="flex flex-wrap justify-center gap-1.5 max-w-[320px]">
          {hobbies.slice(0, 8).map((h) => (
            <span
              key={h}
              className="rounded-full border border-cyan-accent/40 bg-cyan-accent/10 px-2.5 py-0.5 text-[10px] text-cyan-accent"
            >
              {t(`creator.hobbies.option.${h}`)}
            </span>
          ))}
        </div>
        <SealedNote t={t} />
      </div>
    ),
  };
}

function BigImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative h-full w-full">
      <Image src={src} alt={alt} fill sizes="440px" className="object-contain" priority />
    </div>
  );
}

function EmptyFrame({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="font-display text-5xl text-text-muted/40">◌</div>
      <div className="font-display text-[10px] uppercase tracking-[0.3em] text-text-muted/60">
        {label}
      </div>
    </div>
  );
}

function SealedNote({ t }: { t: (key: string) => string }) {
  return (
    <div className="mt-2 max-w-[340px] rounded-xl border border-cyan-accent/20 bg-cyan-accent/5 px-3 py-2 text-center">
      <div className="font-display text-[10px] uppercase tracking-[0.25em] text-cyan-accent">
        {t("visual.sealed.title")}
      </div>
      <p className="mt-1 text-[11px] text-text-muted leading-snug">
        {t("visual.sealed.body")}
      </p>
    </div>
  );
}

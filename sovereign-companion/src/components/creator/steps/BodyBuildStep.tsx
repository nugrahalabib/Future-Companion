"use client";

import { useMemo } from "react";
import { useCompanionStore } from "@/stores/useCompanionStore";
import StepShell from "./StepShell";
import VariantCard from "./VariantCard";
import ComingSoonHint from "./ComingSoonHint";
import { getBodyOptions, TOTAL_CREATOR_STEPS } from "@/lib/companionAssets";
import { useT } from "@/lib/i18n/useT";

export default function BodyBuildStep() {
  const gender = useCompanionStore((s) => s.gender);
  const bodyBuild = useCompanionStore((s) => s.bodyBuild);
  const setBodyBuild = useCompanionStore((s) => s.setBodyBuild);
  const { t } = useT();

  const options = useMemo(() => getBodyOptions(gender), [gender]);
  const currentPick = options.find((o) => o.id === bodyBuild);
  const isPickComingSoon = currentPick?.comingSoon === true;

  return (
    <StepShell
      step={4}
      total={TOTAL_CREATOR_STEPS}
      title={t("creator.body.title")}
      subtitle={t("creator.body.subtitle")}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {options.map((o) => (
          <VariantCard
            key={o.id}
            option={o}
            selected={bodyBuild === o.id}
            onSelect={() => setBodyBuild(o.id)}
          />
        ))}
      </div>
      {isPickComingSoon && <ComingSoonHint />}
    </StepShell>
  );
}

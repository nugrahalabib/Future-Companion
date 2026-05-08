"use client";

import { useMemo } from "react";
import { useCompanionStore } from "@/stores/useCompanionStore";
import StepShell from "./StepShell";
import VariantCard from "./VariantCard";
import ComingSoonHint from "./ComingSoonHint";
import { TOTAL_CREATOR_STEPS, getOutfitOptions } from "@/lib/companionAssets";
import { useT } from "@/lib/i18n/useT";

export default function OutfitStep() {
  const gender = useCompanionStore((s) => s.gender);
  const outfit = useCompanionStore((s) => s.outfit);
  const setOutfit = useCompanionStore((s) => s.setOutfit);
  const options = useMemo(() => getOutfitOptions(gender), [gender]);
  const currentPick = options.find((o) => o.id === outfit);
  const isPickComingSoon = currentPick?.comingSoon === true;
  const { t } = useT();

  return (
    <StepShell
      step={5}
      total={TOTAL_CREATOR_STEPS}
      title={t("creator.outfit.title")}
      subtitle={t("creator.outfit.subtitle")}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {options.map((o) => (
          <VariantCard
            key={o.id}
            option={o}
            selected={outfit === o.id}
            onSelect={() => setOutfit(o.id)}
          />
        ))}
      </div>
      {isPickComingSoon && <ComingSoonHint />}
    </StepShell>
  );
}

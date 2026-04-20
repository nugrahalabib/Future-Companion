"use client";

import { useCompanionStore } from "@/stores/useCompanionStore";
import StepShell from "./StepShell";
import VariantCard from "./VariantCard";
import { TOTAL_CREATOR_STEPS, getHairOptions } from "@/lib/companionAssets";
import { useT } from "@/lib/i18n/useT";

export default function HairStyleStep() {
  const gender = useCompanionStore((s) => s.gender);
  const hairStyle = useCompanionStore((s) => s.hairStyle);
  const setHairStyle = useCompanionStore((s) => s.setHairStyle);
  const options = getHairOptions(gender);
  const { t } = useT();

  return (
    <StepShell
      step={3}
      total={TOTAL_CREATOR_STEPS}
      title={t("creator.hair.title")}
      subtitle={t("creator.hair.subtitle")}
    >
      <div className="grid grid-cols-2 gap-3">
        {options.map((o) => (
          <VariantCard
            key={o.id}
            option={o}
            selected={hairStyle === o.id}
            onSelect={() => setHairStyle(o.id)}
          />
        ))}
      </div>
    </StepShell>
  );
}

"use client";

import { useCompanionStore } from "@/stores/useCompanionStore";
import StepShell from "./StepShell";
import VariantCard from "./VariantCard";
import { TOTAL_CREATOR_STEPS, getFaceOptions } from "@/lib/companionAssets";
import { useT } from "@/lib/i18n/useT";

export default function FaceShapeStep() {
  const gender = useCompanionStore((s) => s.gender);
  const faceShape = useCompanionStore((s) => s.faceShape);
  const setFaceShape = useCompanionStore((s) => s.setFaceShape);
  const options = getFaceOptions(gender);
  const { t } = useT();

  return (
    <StepShell
      step={2}
      total={TOTAL_CREATOR_STEPS}
      title={t("creator.face.title")}
      subtitle={t("creator.face.subtitle")}
    >
      <div className="grid grid-cols-2 gap-3">
        {options.map((o) => (
          <VariantCard
            key={o.id}
            option={o}
            selected={faceShape === o.id}
            onSelect={() => setFaceShape(o.id)}
          />
        ))}
      </div>
    </StepShell>
  );
}

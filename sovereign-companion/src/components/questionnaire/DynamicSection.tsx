"use client";

import LikertScale from "./LikertScale";
import SingleChoice from "./SingleChoice";
import MultiChoice from "./MultiChoice";
import NPSScale from "./NPSScale";
import { useT } from "@/lib/i18n/useT";
import type { SurveyQuestion, SurveySection } from "@/lib/surveyTemplate";

export type ResponseValue = number | string | string[];

interface Props {
  section: SurveySection;
  responses: Record<string, ResponseValue>;
  setResponse: (id: string, value: ResponseValue) => void;
  isInvalid: (id: string) => boolean;
}

/**
 * Generic renderer for a survey section loaded from the dynamic template.
 * Each question is rendered based on its `type`. The wrapper question
 * label / helper / required indicator stay consistent across types.
 */
export default function DynamicSection({
  section,
  responses,
  setResponse,
  isInvalid,
}: Props) {
  const { t, locale } = useT();
  const localeKey = locale === "en" ? "En" : "Id";
  const title = locale === "en" ? section.titleEn : section.titleId;
  const desc = locale === "en" ? section.descriptionEn : section.descriptionId;

  return (
    <div className="space-y-6">
      <SectionHeading title={title} subtitle={desc} />

      {section.questions.map((q) => {
        const value = responses[q.id];
        const invalid = isInvalid(q.id);
        const label = locale === "en" ? q.labelEn : q.labelId;
        const helper = locale === "en" ? q.helperEn : q.helperId;
        const required = q.required;

        return (
          <div key={q.id} className="space-y-2">
            <div>
              <p className="font-display text-base font-semibold text-text-primary leading-snug">
                {label}
                {required && <span className="text-cyan-accent ml-1.5">*</span>}
              </p>
              {helper && (
                <p className="mt-1 text-[13px] text-text-muted leading-relaxed">{helper}</p>
              )}
            </div>
            {renderControl(q, value, setResponse, invalid, t, localeKey)}
            {invalid && (
              <p className="text-[12px] text-danger">
                {t("q.field.required")}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function renderControl(
  q: SurveyQuestion,
  value: ResponseValue | undefined,
  setResponse: (id: string, value: ResponseValue) => void,
  invalid: boolean,
  t: (k: string, p?: Record<string, string | number>) => string,
  localeKey: "En" | "Id",
): React.ReactNode {
  switch (q.type) {
    case "likert":
      return (
        <LikertScale
          value={typeof value === "number" ? value : 0}
          onChange={(v) => setResponse(q.id, v)}
          lowLabel={pickAnchorLow(q, localeKey)}
          midLabel={pickAnchorMid(q, localeKey)}
          highLabel={pickAnchorHigh(q, localeKey)}
          invalid={invalid}
        />
      );
    case "nps": {
      const npsLow = q.npsAnchors?.[`low${localeKey}` as "lowEn" | "lowId"] ?? t("q.recommend.low");
      const npsHigh = q.npsAnchors?.[`high${localeKey}` as "highEn" | "highId"] ?? t("q.recommend.high");
      return (
        <NPSScale
          value={typeof value === "number" && value >= 0 ? value : null}
          onChange={(v) => setResponse(q.id, v)}
          lowLabel={npsLow}
          highLabel={npsHigh}
          invalid={invalid}
        />
      );
    }
    case "single":
      return (
        <SingleChoice
          value={typeof value === "string" ? value : ""}
          onChange={(v) => setResponse(q.id, v)}
          options={(q.options ?? []).map((o) => ({
            value: o.value,
            label: localeKey === "En" ? o.labelEn : o.labelId,
          }))}
          invalid={invalid}
        />
      );
    case "multi":
      return (
        <MultiChoice
          value={Array.isArray(value) ? value : []}
          onChange={(v) => setResponse(q.id, v)}
          options={(q.options ?? []).map((o) => ({
            value: o.value,
            label: localeKey === "En" ? o.labelEn : o.labelId,
          }))}
          max={q.maxSelections}
          helper={q.maxSelections ? t("q.multi.maxNotice", { max: q.maxSelections }) : undefined}
        />
      );
    case "dropdown":
      return (
        <select
          value={typeof value === "string" ? value : ""}
          onChange={(e) => setResponse(q.id, e.target.value)}
          className={`w-full bg-obsidian-surface border rounded-xl px-4 py-3 text-text-primary focus:outline-none transition-colors ${
            invalid ? "border-danger/70" : "border-glass-border focus:border-cyan-accent/40"
          }`}
        >
          <option value="">{t("q.dropdown.placeholder")}</option>
          {(q.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {localeKey === "En" ? o.labelEn : o.labelId}
            </option>
          ))}
        </select>
      );
    case "text":
      return (
        <input
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => setResponse(q.id, e.target.value)}
          className={`w-full bg-obsidian-surface border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none transition-colors ${
            invalid ? "border-danger/70" : "border-glass-border focus:border-cyan-accent/40"
          }`}
        />
      );
    case "longtext":
      return (
        <textarea
          rows={4}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => setResponse(q.id, e.target.value)}
          className={`w-full bg-obsidian-surface border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none transition-colors resize-y ${
            invalid ? "border-danger/70" : "border-glass-border focus:border-cyan-accent/40"
          }`}
        />
      );
  }
}

function pickAnchorLow(q: SurveyQuestion, localeKey: "En" | "Id"): string | undefined {
  return q.anchors?.[`low${localeKey}` as "lowEn" | "lowId"];
}
function pickAnchorMid(q: SurveyQuestion, localeKey: "En" | "Id"): string | undefined {
  return q.anchors?.[`mid${localeKey}` as "midEn" | "midId"];
}
function pickAnchorHigh(q: SurveyQuestion, localeKey: "En" | "Id"): string | undefined {
  return q.anchors?.[`high${localeKey}` as "highEn" | "highId"];
}

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="space-y-1.5">
      <h2 className="font-display text-xl sm:text-2xl font-bold text-text-primary">
        {title}
      </h2>
      {subtitle && <p className="text-sm text-text-secondary">{subtitle}</p>}
    </div>
  );
}

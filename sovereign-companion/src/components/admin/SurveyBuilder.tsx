"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import GlassPanel from "@/components/ui/GlassPanel";
import GlassButton from "@/components/ui/GlassButton";
import { adminFetch } from "@/lib/adminFetch";
import { useT } from "@/lib/i18n/useT";
import {
  type QuestionType,
  type SurveyOption,
  type SurveyQuestion,
  type SurveySection,
  type SurveyTemplateShape,
} from "@/lib/surveyTemplate";

// Question types listed in the type-picker (matches the 7 supported by the
// public DynamicSection renderer — DO NOT add types here without adding the
// matching renderer branch in DynamicSection.tsx first).
const QUESTION_TYPES: { value: QuestionType; labelEn: string; labelId: string; needsOptions: boolean }[] = [
  { value: "likert",   labelEn: "Likert (1-5 scale)",       labelId: "Likert (skala 1-5)",     needsOptions: false },
  { value: "nps",      labelEn: "NPS (0-10 scale)",         labelId: "NPS (skala 0-10)",       needsOptions: false },
  { value: "single",   labelEn: "Single choice (radio)",    labelId: "Pilihan tunggal (radio)", needsOptions: true  },
  { value: "multi",    labelEn: "Multiple choice (pills)",  labelId: "Pilihan ganda (pills)",  needsOptions: true  },
  { value: "dropdown", labelEn: "Dropdown",                 labelId: "Dropdown",               needsOptions: true  },
  { value: "text",     labelEn: "Short text",               labelId: "Teks pendek",            needsOptions: false },
  { value: "longtext", labelEn: "Long text (textarea)",     labelId: "Teks panjang (textarea)", needsOptions: false },
];

// Stable id generator (client-side; survives JSON round-trip).
function newId(prefix: string): string {
  const ts = Date.now().toString(36).slice(-4);
  const r = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${ts}${r}`;
}

interface BuilderProps {
  onSaved?: () => void;
}

export default function SurveyBuilder({ onSaved }: BuilderProps) {
  const { t, locale } = useT();
  const [template, setTemplate] = useState<SurveyTemplateShape | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTemplate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/survey-template");
      const data = await res.json();
      setTemplate(data.template ?? { version: 1, sections: [] });
      setError(null);
    } catch {
      setError(t("admin.forms.error.load"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadTemplate();
  }, [loadTemplate]);

  const handleSave = async () => {
    if (!template) return;
    setSaving(true);
    setError(null);
    try {
      const res = await adminFetch("/api/admin/survey-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message ?? t("admin.forms.error.save"));
      } else {
        setTemplate(data.template);
        setSavedAt(new Date());
        onSaved?.();
      }
    } catch {
      setError(t("admin.forms.error.save"));
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefault = async () => {
    if (!confirm(t("admin.forms.confirm.reset"))) return;
    try {
      const res = await adminFetch("/api/admin/survey-template?reset=1");
      const data = await res.json();
      if (data?.template) setTemplate(data.template);
    } catch {
      setError(t("admin.forms.error.load"));
    }
  };

  const updateSection = (idx: number, patch: Partial<SurveySection>) => {
    if (!template) return;
    const sections = [...template.sections];
    sections[idx] = { ...sections[idx], ...patch };
    setTemplate({ ...template, sections });
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    if (!template) return;
    const target = idx + dir;
    if (target < 0 || target >= template.sections.length) return;
    const sections = [...template.sections];
    [sections[idx], sections[target]] = [sections[target], sections[idx]];
    setTemplate({ ...template, sections });
  };

  const deleteSection = (idx: number) => {
    if (!template) return;
    if (!confirm(t("admin.forms.confirm.deleteSection"))) return;
    const sections = template.sections.filter((_, i) => i !== idx);
    setTemplate({ ...template, sections });
  };

  const addSection = () => {
    if (!template) return;
    const sec: SurveySection = {
      id: newId("sec"),
      titleEn: "New Section",
      titleId: "Bagian Baru",
      questions: [],
    };
    setTemplate({ ...template, sections: [...template.sections, sec] });
  };

  const updateQuestion = (sIdx: number, qIdx: number, patch: Partial<SurveyQuestion>) => {
    if (!template) return;
    const sections = [...template.sections];
    const questions = [...sections[sIdx].questions];
    questions[qIdx] = { ...questions[qIdx], ...patch };
    sections[sIdx] = { ...sections[sIdx], questions };
    setTemplate({ ...template, sections });
  };

  const moveQuestion = (sIdx: number, qIdx: number, dir: -1 | 1) => {
    if (!template) return;
    const sections = [...template.sections];
    const questions = [...sections[sIdx].questions];
    const target = qIdx + dir;
    if (target < 0 || target >= questions.length) return;
    [questions[qIdx], questions[target]] = [questions[target], questions[qIdx]];
    sections[sIdx] = { ...sections[sIdx], questions };
    setTemplate({ ...template, sections });
  };

  const deleteQuestion = (sIdx: number, qIdx: number) => {
    if (!template) return;
    if (!confirm(t("admin.forms.confirm.deleteQuestion"))) return;
    const sections = [...template.sections];
    const questions = sections[sIdx].questions.filter((_, i) => i !== qIdx);
    sections[sIdx] = { ...sections[sIdx], questions };
    setTemplate({ ...template, sections });
  };

  const addQuestion = (sIdx: number, type: QuestionType) => {
    if (!template) return;
    const sections = [...template.sections];
    const meta = QUESTION_TYPES.find((q) => q.value === type)!;
    const q: SurveyQuestion = {
      id: newId("q"),
      type,
      required: false,
      labelEn: "New question",
      labelId: "Pertanyaan baru",
    };
    if (meta.needsOptions) {
      q.options = [
        { value: "option-1", labelEn: "Option 1", labelId: "Opsi 1" },
        { value: "option-2", labelEn: "Option 2", labelId: "Opsi 2" },
      ];
    }
    sections[sIdx] = { ...sections[sIdx], questions: [...sections[sIdx].questions, q] };
    setTemplate({ ...template, sections });
  };

  if (loading) {
    return (
      <div className="text-text-muted text-sm">{t("admin.forms.loading")}</div>
    );
  }
  if (!template) {
    return (
      <div className="text-danger text-sm">{error ?? t("admin.forms.error.load")}</div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <GlassPanel variant="elevated" className="p-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-lg font-bold text-text-primary">
            {t("admin.forms.heading")}
          </h2>
          <p className="text-[12px] text-text-muted mt-0.5">
            {t("admin.forms.subheading")}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {savedAt && (
            <span className="text-[11px] text-bio-green font-display uppercase tracking-widest">
              {t("admin.forms.saved")}
            </span>
          )}
          {error && (
            <span className="text-[11px] text-danger font-display uppercase tracking-widest">
              {error}
            </span>
          )}
          <GlassButton variant="secondary" size="sm" onClick={handleResetDefault}>
            {t("admin.forms.resetDefault")}
          </GlassButton>
          <GlassButton size="sm" onClick={handleSave} disabled={saving}>
            {saving ? t("admin.forms.saving") : t("admin.forms.save")}
          </GlassButton>
        </div>
      </GlassPanel>

      {/* Sections list */}
      <AnimatePresence initial={false}>
        {template.sections.map((sec, sIdx) => (
          <motion.div
            key={sec.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
          >
            <GlassPanel variant="elevated" className="p-5 space-y-4">
              {/* Section header */}
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-[260px] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-[10px] uppercase tracking-widest text-cyan-accent/80">
                      {t("admin.forms.sectionLabel")} #{sIdx + 1}
                    </span>
                    <code className="text-[10px] text-text-muted font-mono">{sec.id}</code>
                  </div>
                  <BilingualInput
                    placeholderEn="Section title (English)"
                    placeholderId="Judul bagian (Indonesia)"
                    valueEn={sec.titleEn}
                    valueId={sec.titleId}
                    onChange={(en, id) => updateSection(sIdx, { titleEn: en, titleId: id })}
                  />
                  <BilingualInput
                    placeholderEn="Description (English, optional)"
                    placeholderId="Deskripsi (Indonesia, opsional)"
                    valueEn={sec.descriptionEn ?? ""}
                    valueId={sec.descriptionId ?? ""}
                    onChange={(en, id) =>
                      updateSection(sIdx, {
                        descriptionEn: en || undefined,
                        descriptionId: id || undefined,
                      })
                    }
                    multiline
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <ReorderControls
                    onUp={() => moveSection(sIdx, -1)}
                    onDown={() => moveSection(sIdx, 1)}
                    upDisabled={sIdx === 0}
                    downDisabled={sIdx === template.sections.length - 1}
                  />
                  <button
                    type="button"
                    className="h-7 px-2.5 rounded-lg border border-danger/40 bg-danger/5 text-danger text-[11px] font-display uppercase tracking-widest hover:bg-danger/15 transition-colors cursor-pointer"
                    onClick={() => deleteSection(sIdx)}
                  >
                    {t("admin.forms.delete")}
                  </button>
                </div>
              </div>

              {/* Questions list */}
              <div className="space-y-3">
                {sec.questions.map((q, qIdx) => (
                  <QuestionEditor
                    key={q.id}
                    question={q}
                    onChange={(patch) => updateQuestion(sIdx, qIdx, patch)}
                    onMoveUp={() => moveQuestion(sIdx, qIdx, -1)}
                    onMoveDown={() => moveQuestion(sIdx, qIdx, 1)}
                    onDelete={() => deleteQuestion(sIdx, qIdx)}
                    upDisabled={qIdx === 0}
                    downDisabled={qIdx === sec.questions.length - 1}
                    locale={locale}
                  />
                ))}
                {sec.questions.length === 0 && (
                  <div className="rounded-xl border border-dashed border-glass-border bg-glass-bg/40 px-4 py-3 text-[12px] text-text-muted">
                    {t("admin.forms.emptyQuestions")}
                  </div>
                )}
              </div>

              {/* Add question */}
              <AddQuestionMenu onPick={(type) => addQuestion(sIdx, type)} locale={locale} />
            </GlassPanel>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add section */}
      <div className="flex justify-center pt-2">
        <GlassButton variant="secondary" onClick={addSection}>
          {t("admin.forms.addSection")}
        </GlassButton>
      </div>
    </div>
  );
}

// =============================================================================
// QuestionEditor
// =============================================================================

function QuestionEditor({
  question,
  onChange,
  onMoveUp,
  onMoveDown,
  onDelete,
  upDisabled,
  downDisabled,
  locale,
}: {
  question: SurveyQuestion;
  onChange: (patch: Partial<SurveyQuestion>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  upDisabled: boolean;
  downDisabled: boolean;
  locale: "en" | "id";
}) {
  const { t } = useT();
  const meta = QUESTION_TYPES.find((q) => q.value === question.type);
  const needsOptions = meta?.needsOptions ?? false;

  return (
    <div className="rounded-xl border border-glass-border bg-glass-bg/60 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-[260px] space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={question.type}
              onChange={(e) => {
                const newType = e.target.value as QuestionType;
                const newMeta = QUESTION_TYPES.find((q) => q.value === newType)!;
                const patch: Partial<SurveyQuestion> = { type: newType };
                if (newMeta.needsOptions && (!question.options || question.options.length === 0)) {
                  patch.options = [
                    { value: "option-1", labelEn: "Option 1", labelId: "Opsi 1" },
                    { value: "option-2", labelEn: "Option 2", labelId: "Opsi 2" },
                  ];
                }
                if (!newMeta.needsOptions) {
                  patch.options = undefined;
                  patch.maxSelections = undefined;
                }
                if (newType !== "likert") patch.anchors = undefined;
                if (newType !== "nps") patch.npsAnchors = undefined;
                onChange(patch);
              }}
              className="bg-obsidian-surface border border-glass-border rounded-lg px-2.5 py-1.5 text-[12px] font-display text-text-primary focus:outline-none focus:border-cyan-accent/40"
            >
              {QUESTION_TYPES.map((qt) => (
                <option key={qt.value} value={qt.value}>
                  {locale === "en" ? qt.labelEn : qt.labelId}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 text-[12px] text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={question.required}
                onChange={(e) => onChange({ required: e.target.checked })}
                className="accent-cyan-accent"
              />
              {t("admin.forms.required")}
            </label>
            <code className="text-[10px] text-text-muted font-mono">{question.id}</code>
          </div>
          <BilingualInput
            placeholderEn="Question label (English)"
            placeholderId="Label pertanyaan (Indonesia)"
            valueEn={question.labelEn}
            valueId={question.labelId}
            onChange={(en, id) => onChange({ labelEn: en, labelId: id })}
          />
          <BilingualInput
            placeholderEn="Helper text (optional)"
            placeholderId="Teks bantuan (opsional)"
            valueEn={question.helperEn ?? ""}
            valueId={question.helperId ?? ""}
            onChange={(en, id) =>
              onChange({ helperEn: en || undefined, helperId: id || undefined })
            }
            multiline
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <ReorderControls
            onUp={onMoveUp}
            onDown={onMoveDown}
            upDisabled={upDisabled}
            downDisabled={downDisabled}
          />
          <button
            type="button"
            className="h-7 px-2.5 rounded-lg border border-danger/40 bg-danger/5 text-danger text-[11px] font-display uppercase tracking-widest hover:bg-danger/15 transition-colors cursor-pointer"
            onClick={onDelete}
          >
            {t("admin.forms.delete")}
          </button>
        </div>
      </div>

      {/* Type-specific config */}
      {question.type === "likert" && (
        <AnchorEditor
          values={(question.anchors ?? {}) as Record<string, string | undefined>}
          onChange={(next) => onChange({ anchors: next as typeof question.anchors })}
          fields={[
            { key: "low", labelEn: "Low anchor", labelId: "Label rendah" },
            { key: "mid", labelEn: "Mid anchor", labelId: "Label tengah" },
            { key: "high", labelEn: "High anchor", labelId: "Label tinggi" },
          ]}
        />
      )}

      {question.type === "nps" && (
        <AnchorEditor
          values={(question.npsAnchors ?? {}) as Record<string, string | undefined>}
          onChange={(next) => onChange({ npsAnchors: next as typeof question.npsAnchors })}
          fields={[
            { key: "low", labelEn: "Low (0) anchor", labelId: "Label rendah (0)" },
            { key: "high", labelEn: "High (10) anchor", labelId: "Label tinggi (10)" },
          ]}
        />
      )}

      {needsOptions && (
        <OptionsEditor
          options={question.options ?? []}
          onChange={(options) => onChange({ options })}
          showMax={question.type === "multi"}
          maxSelections={question.maxSelections}
          onMaxChange={(maxSelections) => onChange({ maxSelections })}
        />
      )}
    </div>
  );
}

// =============================================================================
// Subcomponents
// =============================================================================

function ReorderControls({
  onUp,
  onDown,
  upDisabled,
  downDisabled,
}: {
  onUp: () => void;
  onDown: () => void;
  upDisabled: boolean;
  downDisabled: boolean;
}) {
  return (
    <div className="flex gap-1">
      <button
        type="button"
        onClick={onUp}
        disabled={upDisabled}
        className="h-7 w-7 rounded-lg border border-glass-border bg-obsidian-surface text-text-secondary text-sm hover:border-cyan-accent/40 hover:text-cyan-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        aria-label="Move up"
      >
        ▲
      </button>
      <button
        type="button"
        onClick={onDown}
        disabled={downDisabled}
        className="h-7 w-7 rounded-lg border border-glass-border bg-obsidian-surface text-text-secondary text-sm hover:border-cyan-accent/40 hover:text-cyan-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        aria-label="Move down"
      >
        ▼
      </button>
    </div>
  );
}

function BilingualInput({
  placeholderEn,
  placeholderId,
  valueEn,
  valueId,
  onChange,
  multiline,
}: {
  placeholderEn: string;
  placeholderId: string;
  valueEn: string;
  valueId: string;
  onChange: (en: string, id: string) => void;
  multiline?: boolean;
}) {
  const cls =
    "w-full bg-obsidian-surface border border-glass-border rounded-lg px-3 py-2 text-[13px] text-text-primary placeholder-text-muted focus:outline-none focus:border-cyan-accent/40 transition-colors";
  if (multiline) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <textarea
          rows={2}
          placeholder={placeholderEn}
          value={valueEn}
          onChange={(e) => onChange(e.target.value, valueId)}
          className={`${cls} resize-y`}
        />
        <textarea
          rows={2}
          placeholder={placeholderId}
          value={valueId}
          onChange={(e) => onChange(valueEn, e.target.value)}
          className={`${cls} resize-y`}
        />
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <input
        type="text"
        placeholder={placeholderEn}
        value={valueEn}
        onChange={(e) => onChange(e.target.value, valueId)}
        className={cls}
      />
      <input
        type="text"
        placeholder={placeholderId}
        value={valueId}
        onChange={(e) => onChange(valueEn, e.target.value)}
        className={cls}
      />
    </div>
  );
}

function AnchorEditor({
  values,
  onChange,
  fields,
}: {
  values: Record<string, string | undefined>;
  onChange: (next: Record<string, string | undefined>) => void;
  fields: { key: string; labelEn: string; labelId: string }[];
}) {
  const { t } = useT();
  return (
    <div className="rounded-lg border border-glass-border bg-obsidian-surface/40 p-3 space-y-2">
      <p className="font-display text-[10px] uppercase tracking-widest text-text-muted">
        {t("admin.forms.anchors")}
      </p>
      {fields.map((f) => (
        <BilingualInput
          key={f.key}
          placeholderEn={f.labelEn}
          placeholderId={f.labelId}
          valueEn={values[`${f.key}En`] ?? ""}
          valueId={values[`${f.key}Id`] ?? ""}
          onChange={(en, id) =>
            onChange({
              ...values,
              [`${f.key}En`]: en || undefined,
              [`${f.key}Id`]: id || undefined,
            })
          }
        />
      ))}
    </div>
  );
}

function OptionsEditor({
  options,
  onChange,
  showMax,
  maxSelections,
  onMaxChange,
}: {
  options: SurveyOption[];
  onChange: (next: SurveyOption[]) => void;
  showMax: boolean;
  maxSelections?: number;
  onMaxChange: (n: number | undefined) => void;
}) {
  const { t } = useT();
  const update = (idx: number, patch: Partial<SurveyOption>) => {
    const next = [...options];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };
  const remove = (idx: number) => {
    if (options.length <= 1) return;
    onChange(options.filter((_, i) => i !== idx));
  };
  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= options.length) return;
    const next = [...options];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };
  const add = () => {
    const n = options.length + 1;
    onChange([
      ...options,
      { value: `option-${n}`, labelEn: `Option ${n}`, labelId: `Opsi ${n}` },
    ]);
  };
  return (
    <div className="rounded-lg border border-glass-border bg-obsidian-surface/40 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="font-display text-[10px] uppercase tracking-widest text-text-muted">
          {t("admin.forms.options")}
        </p>
        {showMax && (
          <label className="flex items-center gap-1.5 text-[11px] text-text-secondary">
            {t("admin.forms.maxSelections")}
            <input
              type="number"
              min={1}
              value={maxSelections ?? ""}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                onMaxChange(Number.isFinite(v) && v > 0 ? v : undefined);
              }}
              className="w-14 bg-obsidian-surface border border-glass-border rounded px-2 py-0.5 text-[12px] text-text-primary focus:outline-none focus:border-cyan-accent/40"
            />
          </label>
        )}
      </div>
      <div className="space-y-2">
        {options.map((opt, idx) => (
          <div
            key={`${opt.value}-${idx}`}
            className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-start"
          >
            <input
              type="text"
              placeholder="value"
              value={opt.value}
              onChange={(e) => update(idx, { value: e.target.value })}
              className="bg-obsidian-surface border border-glass-border rounded px-2 py-1.5 text-[12px] font-mono text-text-primary focus:outline-none focus:border-cyan-accent/40 w-32"
            />
            <input
              type="text"
              placeholder="Label (English)"
              value={opt.labelEn}
              onChange={(e) => update(idx, { labelEn: e.target.value })}
              className="bg-obsidian-surface border border-glass-border rounded px-2 py-1.5 text-[13px] text-text-primary focus:outline-none focus:border-cyan-accent/40"
            />
            <input
              type="text"
              placeholder="Label (Indonesia)"
              value={opt.labelId}
              onChange={(e) => update(idx, { labelId: e.target.value })}
              className="bg-obsidian-surface border border-glass-border rounded px-2 py-1.5 text-[13px] text-text-primary focus:outline-none focus:border-cyan-accent/40"
            />
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => move(idx, -1)}
                disabled={idx === 0}
                className="h-7 w-7 rounded border border-glass-border bg-obsidian-surface text-text-secondary text-[10px] hover:border-cyan-accent/40 hover:text-cyan-accent disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => move(idx, 1)}
                disabled={idx === options.length - 1}
                className="h-7 w-7 rounded border border-glass-border bg-obsidian-surface text-text-secondary text-[10px] hover:border-cyan-accent/40 hover:text-cyan-accent disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                ▼
              </button>
              <button
                type="button"
                onClick={() => remove(idx)}
                disabled={options.length <= 1}
                className="h-7 w-7 rounded border border-danger/40 bg-danger/5 text-danger text-[12px] hover:bg-danger/15 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="text-[11px] font-display uppercase tracking-widest text-cyan-accent hover:text-cyan-accent/80 cursor-pointer"
      >
        + {t("admin.forms.addOption")}
      </button>
    </div>
  );
}

function AddQuestionMenu({
  onPick,
  locale,
}: {
  onPick: (type: QuestionType) => void;
  locale: "en" | "id";
}) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[12px] font-display uppercase tracking-widest text-cyan-accent border border-cyan-accent/40 rounded-lg px-3 py-1.5 hover:bg-cyan-accent/10 transition-colors cursor-pointer"
      >
        + {t("admin.forms.addQuestion")}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute left-0 mt-2 z-30 rounded-xl border border-glass-border bg-obsidian-surface backdrop-blur-md shadow-lg overflow-hidden min-w-[220px]"
          >
            {QUESTION_TYPES.map((qt) => (
              <button
                key={qt.value}
                type="button"
                onClick={() => {
                  onPick(qt.value);
                  setOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-[13px] text-text-primary hover:bg-cyan-accent/10 transition-colors cursor-pointer"
              >
                {locale === "en" ? qt.labelEn : qt.labelId}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

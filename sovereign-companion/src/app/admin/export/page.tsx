"use client";

import { useMemo, useState } from "react";
import GlassPanel from "@/components/ui/GlassPanel";
import { useT } from "@/lib/i18n/useT";
import type { TranslateFn } from "@/lib/i18n/useT";
import { adminFetch } from "@/lib/adminFetch";

type Kind = "respondents" | "survey" | "transcripts";
type Fmt = "csv" | "json";

interface PresetFilter {
  key: string;
  params: Record<string, string>;
}

const PRESETS: PresetFilter[] = [
  { key: "all", params: {} },
  { key: "completed", params: { completed: "1" } },
  { key: "dropped", params: { dropped: "1" } },
  { key: "promoter", params: { nps: "promoter" } },
  { key: "detractor", params: { nps: "detractor" } },
  { key: "female", params: { gender: "female" } },
  { key: "male", params: { gender: "male" } },
  { key: "womb", params: { womb: "1" } },
  { key: "sperm", params: { sperm: "1" } },
];

export default function ExportPage() {
  const { t } = useT();
  const [kind, setKind] = useState<Kind>("respondents");
  const [format, setFormat] = useState<Fmt>("csv");
  const [anonymize, setAnonymize] = useState(false);
  const [presetKey, setPresetKey] = useState<string>(PRESETS[0].key);

  const preset = PRESETS.find((p) => p.key === presetKey) ?? PRESETS[0];

  const url = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("kind", kind);
    sp.set("format", format);
    if (anonymize) sp.set("anonymize", "1");
    for (const [k, v] of Object.entries(preset.params)) sp.set(k, v);
    return `/api/admin/export?${sp.toString()}`;
  }, [kind, format, anonymize, preset]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-semibold text-text-primary">
          {t("admin.export.title")}
        </h2>
        <p className="text-xs text-text-muted">{t("admin.export.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <GlassPanel variant="elevated" className="p-5 space-y-4">
          <Section title={t("admin.export.section.dataset")}>
            <Radio
              label={t("admin.export.dataset.respondents")}
              value={kind === "respondents"}
              onClick={() => setKind("respondents")}
            />
            <Radio
              label={t("admin.export.dataset.survey")}
              value={kind === "survey"}
              onClick={() => setKind("survey")}
            />
            <Radio
              label={t("admin.export.dataset.transcripts")}
              value={kind === "transcripts"}
              onClick={() => setKind("transcripts")}
            />
          </Section>

          <Section title={t("admin.export.section.format")}>
            <Radio
              label={t("admin.export.format.csv")}
              value={format === "csv"}
              onClick={() => setFormat("csv")}
            />
            <Radio
              label={t("admin.export.format.json")}
              value={format === "json"}
              onClick={() => setFormat("json")}
            />
          </Section>

          <Section title={t("admin.export.section.privacy")}>
            <button
              onClick={() => setAnonymize((v) => !v)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-sm transition-colors cursor-pointer ${
                anonymize
                  ? "bg-bio-green/15 text-bio-green border-bio-green/40"
                  : "glass text-text-muted border-glass-border hover:text-text-primary"
              }`}
            >
              <span>{t("admin.export.anonymize")}</span>
              <span className="text-[10px] font-display uppercase tracking-widest">
                {anonymize ? t("admin.common.on") : t("admin.common.off")}
              </span>
            </button>
            <p className="text-[11px] text-text-muted mt-1">
              {t("admin.export.anonymize.hint")}
            </p>
          </Section>
        </GlassPanel>

        <GlassPanel variant="elevated" className="p-5 lg:col-span-2">
          <h3 className="font-display text-xs font-semibold text-cyan-accent uppercase tracking-widest mb-3">
            {t("admin.export.presets.title")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
            {PRESETS.map((p) => (
              <PresetButton
                key={p.key}
                presetKey={p.key}
                active={presetKey === p.key}
                onClick={() => setPresetKey(p.key)}
                t={t}
              />
            ))}
          </div>

          <div className="glass border border-glass-border rounded-xl p-4 space-y-3">
            <p className="text-[10px] font-display uppercase tracking-widest text-text-muted">
              {t("admin.export.url.label")}
            </p>
            <code className="block text-[11px] text-cyan-accent break-all font-mono">
              {url}
            </code>
            <button
              onClick={async () => {
                const res = await adminFetch(url);
                if (!res.ok) return;
                const blob = await res.blob();
                const href = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = href;
                a.download = `sovereign-${kind}-${Date.now()}.${format}`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(href);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-accent/20 text-cyan-accent border border-cyan-accent/40 font-display font-semibold text-sm hover:bg-cyan-accent/30 transition-colors cursor-pointer"
            >
              {t("admin.export.download", { format: format.toUpperCase() })}
            </button>
            <p className="text-[11px] text-text-muted">
              {t("admin.export.custom.hint")}
            </p>
          </div>
        </GlassPanel>
      </div>

      <GlassPanel variant="elevated" className="p-5">
        <h3 className="font-display text-xs font-semibold text-cyan-accent uppercase tracking-widest mb-3">
          {t("admin.export.columns.title")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px]">
          <div>
            <p className="text-text-muted font-display uppercase tracking-widest mb-1">
              {t("admin.export.columns.identity")}
            </p>
            <p className="text-text-secondary">
              {t("admin.export.columns.identity.body")}
            </p>
          </div>
          <div>
            <p className="text-text-muted font-display uppercase tracking-widest mb-1">
              {t("admin.export.columns.companion")}
            </p>
            <p className="text-text-secondary">
              {t("admin.export.columns.companion.body")}
            </p>
          </div>
          <div>
            <p className="text-text-muted font-display uppercase tracking-widest mb-1">
              {t("admin.export.columns.survey")}
            </p>
            <p className="text-text-secondary">
              {t("admin.export.columns.survey.body")}
            </p>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}

function PresetButton({
  presetKey,
  active,
  onClick,
  t,
}: {
  presetKey: string;
  active: boolean;
  onClick: () => void;
  t: TranslateFn;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-xl border p-3 transition-colors cursor-pointer ${
        active
          ? "bg-cyan-accent/15 border-cyan-accent/40"
          : "glass border-glass-border hover:border-cyan-accent/25"
      }`}
    >
      <p className="font-display text-sm text-text-primary">
        {t(`admin.export.presets.${presetKey}.label`)}
      </p>
      <p className="text-[11px] text-text-muted mt-0.5">
        {t(`admin.export.presets.${presetKey}.desc`)}
      </p>
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-display uppercase tracking-widest text-text-muted">
        {title}
      </p>
      {children}
    </div>
  );
}

function Radio({
  label,
  value,
  onClick,
}: {
  label: string;
  value: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl border text-sm text-left transition-colors cursor-pointer ${
        value
          ? "bg-cyan-accent/15 border-cyan-accent/40 text-cyan-accent"
          : "glass border-glass-border text-text-secondary hover:text-text-primary"
      }`}
    >
      <span
        className={`w-3.5 h-3.5 rounded-full border flex-shrink-0 ${
          value ? "bg-cyan-accent border-cyan-accent" : "border-glass-border"
        }`}
      />
      {label}
    </button>
  );
}

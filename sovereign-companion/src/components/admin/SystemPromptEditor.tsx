"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassPanel from "@/components/ui/GlassPanel";
import GlassButton from "@/components/ui/GlassButton";
import { adminFetch } from "@/lib/adminFetch";
import { useT } from "@/lib/i18n/useT";
import {
  DEFAULT_OVERRIDES,
  type LocalePair,
  type RoleId,
  type SystemPromptOverrides,
} from "@/lib/systemPromptOverrides";
import type { BlockDefaults } from "@/lib/systemPromptDefaults";

// Sentinel default used when the API hasn't loaded yet. Never rendered to
// users — purely so the component has a stable shape during initial paint.
const EMPTY_DEFAULTS: BlockDefaults = {
  primeDirectives: { en: "", id: "" },
  sensualLayer: { en: "", id: "" },
  identityFreeExpression: { en: "", id: "" },
  roleVibes: {
    "romantic-partner": { en: "", id: "" },
    "dominant-assistant": { en: "", id: "" },
    "passive-listener": { en: "", id: "" },
    "intellectual-rival": { en: "", id: "" },
  },
};

const ROLE_LABELS: { id: RoleId; en: string; idLabel: string }[] = [
  { id: "romantic-partner",   en: "Romantic Partner",   idLabel: "Pasangan Romantis" },
  { id: "dominant-assistant", en: "Dominant Assistant", idLabel: "Asisten Dominan" },
  { id: "passive-listener",   en: "Passive Listener",   idLabel: "Pendengar Pasif" },
  { id: "intellectual-rival", en: "Intellectual Rival", idLabel: "Rival Intelektual" },
];

const VARIABLE_HINTS = [
  "{companionName}",
  "{petNames}",
  "{userOwnNickname}",
  "{userGender}",
  "{role}",
  "{firstHobby}",
];

export default function SystemPromptEditor() {
  const { t, locale } = useT();
  const [overrides, setOverrides] = useState<SystemPromptOverrides | null>(null);
  const [defaults, setDefaults] = useState<BlockDefaults>(EMPTY_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/system-prompt");
      const data = await res.json();
      setOverrides(data.overrides ?? DEFAULT_OVERRIDES);
      if (data.defaults) setDefaults(data.defaults as BlockDefaults);
      setError(null);
    } catch {
      setError(t("admin.prompt.error.load"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    if (!overrides) return;
    setSaving(true);
    setError(null);
    try {
      const res = await adminFetch("/api/admin/system-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overrides }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message ?? t("admin.prompt.error.save"));
      } else {
        setOverrides(data.overrides);
        setSavedAt(new Date());
      }
    } catch {
      setError(t("admin.prompt.error.save"));
    } finally {
      setSaving(false);
    }
  };

  const handleResetAll = async () => {
    if (!confirm(t("admin.prompt.confirm.reset"))) return;
    try {
      const res = await adminFetch("/api/admin/system-prompt?reset=1");
      const data = await res.json();
      if (data?.overrides) setOverrides(data.overrides);
      if (data?.defaults) setDefaults(data.defaults as BlockDefaults);
    } catch {
      setError(t("admin.prompt.error.load"));
    }
  };

  const updatePair = (key: keyof Omit<SystemPromptOverrides, "roleVibes">, pair: LocalePair) => {
    if (!overrides) return;
    setOverrides({ ...overrides, [key]: pair });
  };

  const updateRoleVibe = (role: RoleId, pair: LocalePair) => {
    if (!overrides) return;
    setOverrides({
      ...overrides,
      roleVibes: { ...overrides.roleVibes, [role]: pair },
    });
  };

  const clearPair = (key: keyof Omit<SystemPromptOverrides, "roleVibes">) => {
    updatePair(key, { en: "", id: "" });
  };

  if (loading || !overrides) {
    return <div className="text-text-muted text-sm">{t("admin.prompt.loading")}</div>;
  }

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <GlassPanel variant="elevated" className="p-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-lg font-bold text-text-primary">
            {t("admin.prompt.heading")}
          </h2>
          <p className="text-[12px] text-text-muted mt-0.5 max-w-[640px]">
            {t("admin.prompt.subheading")}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {savedAt && (
            <span className="text-[11px] text-bio-green font-display uppercase tracking-widest">
              {t("admin.prompt.saved")}
            </span>
          )}
          {error && (
            <span className="text-[11px] text-danger font-display uppercase tracking-widest">
              {error}
            </span>
          )}
          <GlassButton variant="secondary" size="sm" onClick={handleResetAll}>
            {t("admin.prompt.resetAll")}
          </GlassButton>
          <GlassButton size="sm" onClick={handleSave} disabled={saving}>
            {saving ? t("admin.prompt.saving") : t("admin.prompt.save")}
          </GlassButton>
        </div>
      </GlassPanel>

      {/* Variables hint */}
      <GlassPanel variant="inset" className="p-3 flex items-start gap-3 flex-wrap">
        <span className="font-display text-[10px] uppercase tracking-widest text-cyan-accent shrink-0 pt-0.5">
          {t("admin.prompt.variables")}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {VARIABLE_HINTS.map((v) => (
            <code
              key={v}
              className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-accent/10 border border-cyan-accent/30 text-cyan-accent"
            >
              {v}
            </code>
          ))}
        </div>
      </GlassPanel>

      {/* Header */}
      <PromptBlock
        title={t("admin.prompt.block.header.title")}
        description={t("admin.prompt.block.header.desc")}
        pair={overrides.header}
        onChange={(p) => updatePair("header", p)}
        onClear={() => clearPair("header")}
      />

      {/* Author identity (small string) */}
      <PromptBlock
        title={t("admin.prompt.block.authorIdentity.title")}
        description={t("admin.prompt.block.authorIdentity.desc")}
        pair={overrides.authorIdentity}
        onChange={(p) => updatePair("authorIdentity", p)}
        onClear={() => updatePair("authorIdentity", DEFAULT_OVERRIDES.authorIdentity)}
        inline
      />

      {/* Section overrides — defaults shown for context */}
      <PromptBlock
        title={t("admin.prompt.block.primeDirectives.title")}
        description={t("admin.prompt.block.primeDirectives.desc")}
        pair={overrides.primeDirectives}
        defaultPair={defaults.primeDirectives}
        onChange={(p) => updatePair("primeDirectives", p)}
        onClear={() => clearPair("primeDirectives")}
      />

      <PromptBlock
        title={t("admin.prompt.block.sensualLayer.title")}
        description={t("admin.prompt.block.sensualLayer.desc")}
        pair={overrides.sensualLayer}
        defaultPair={defaults.sensualLayer}
        onChange={(p) => updatePair("sensualLayer", p)}
        onClear={() => clearPair("sensualLayer")}
      />

      <PromptBlock
        title={t("admin.prompt.block.identityFreeExpression.title")}
        description={t("admin.prompt.block.identityFreeExpression.desc")}
        pair={overrides.identityFreeExpression}
        defaultPair={defaults.identityFreeExpression}
        onChange={(p) => updatePair("identityFreeExpression", p)}
        onClear={() => clearPair("identityFreeExpression")}
      />

      {/* Per-role vibes */}
      <GlassPanel variant="elevated" className="p-5 space-y-4">
        <div>
          <h3 className="font-display text-base font-semibold text-text-primary">
            {t("admin.prompt.block.roleVibes.title")}
          </h3>
          <p className="text-[12px] text-text-muted mt-0.5">
            {t("admin.prompt.block.roleVibes.desc")}
          </p>
        </div>
        {ROLE_LABELS.map((r) => (
          <RoleVibeBlock
            key={r.id}
            label={locale === "en" ? r.en : r.idLabel}
            pair={overrides.roleVibes[r.id]}
            defaultPair={defaults.roleVibes[r.id]}
            onChange={(p) => updateRoleVibe(r.id, p)}
          />
        ))}
      </GlassPanel>

      {/* Footer */}
      <PromptBlock
        title={t("admin.prompt.block.footer.title")}
        description={t("admin.prompt.block.footer.desc")}
        pair={overrides.footer}
        onChange={(p) => updatePair("footer", p)}
        onClear={() => clearPair("footer")}
      />
    </div>
  );
}

// ============================================================================
// Reusable bilingual textarea block
// ============================================================================

function PromptBlock({
  title,
  description,
  pair,
  defaultPair,
  onChange,
  onClear,
  inline,
}: {
  title: string;
  description: string;
  pair: LocalePair;
  // Active default text — what gets used at build time when override is empty.
  // Shown to admin as pre-filled placeholder so they always see the live
  // fallback text (and can copy/edit instead of guessing what's there).
  defaultPair?: LocalePair;
  onChange: (p: LocalePair) => void;
  onClear: () => void;
  inline?: boolean;
}) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const isOverridden = Boolean(
    (pair.en && pair.en.trim()) || (pair.id && pair.id.trim()),
  );

  // Show default text in the textarea when the admin hasn't overridden yet —
  // typing on it instantly turns it into an override.
  const fillFromDefault = (which: "en" | "id") => {
    if (!defaultPair) return;
    const next: LocalePair = { ...pair };
    if (which === "en" && !pair.en.trim()) next.en = defaultPair.en;
    if (which === "id" && !pair.id.trim()) next.id = defaultPair.id;
    onChange(next);
  };

  // Auto-fill both languages with default the first time the block is expanded
  // (only if override is currently empty). Lets the admin SEE the live default
  // immediately without an extra "Load Default" button click.
  const handleToggle = () => {
    setOpen((wasOpen) => {
      const next = !wasOpen;
      if (next && !isOverridden && defaultPair) {
        // open + currently empty + default available → pre-fill
        const seeded: LocalePair = {
          en: pair.en.trim() ? pair.en : defaultPair.en,
          id: pair.id.trim() ? pair.id : defaultPair.id,
        };
        onChange(seeded);
      }
      return next;
    });
  };

  // Distinguish "freshly seeded from default" vs "real override". When the
  // textarea contents EXACTLY match the default, we still treat the block as
  // "Using default" until admin actually edits the text.
  const matchesDefault = Boolean(
    defaultPair &&
      pair.en.trim() === defaultPair.en.trim() &&
      pair.id.trim() === defaultPair.id.trim(),
  );
  const effectivelyOverridden = isOverridden && !matchesDefault;

  return (
    <GlassPanel variant="elevated" className="p-5 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-[240px]">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-base font-semibold text-text-primary">{title}</h3>
            {effectivelyOverridden ? (
              <span className="text-[10px] font-display uppercase tracking-widest text-bio-green border border-bio-green/40 bg-bio-green/10 rounded-full px-2 py-0.5">
                {t("admin.prompt.status.overridden")}
              </span>
            ) : (
              <span className="text-[10px] font-display uppercase tracking-widest text-text-muted border border-glass-border rounded-full px-2 py-0.5">
                {t("admin.prompt.status.default")}
              </span>
            )}
          </div>
          <p className="text-[12px] text-text-muted mt-1 max-w-[640px]">{description}</p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {effectivelyOverridden && (
            <button
              type="button"
              onClick={onClear}
              className="h-7 px-2.5 rounded-lg border border-danger/40 bg-danger/5 text-danger text-[11px] font-display uppercase tracking-widest hover:bg-danger/15 transition-colors cursor-pointer"
            >
              {t("admin.prompt.clearOverride")}
            </button>
          )}
          <button
            type="button"
            onClick={handleToggle}
            className="h-7 px-2.5 rounded-lg border border-glass-border bg-obsidian-surface text-text-secondary text-[11px] font-display uppercase tracking-widest hover:border-cyan-accent/40 hover:text-cyan-accent transition-colors cursor-pointer"
          >
            {open ? t("admin.prompt.collapse") : t("admin.prompt.expand")}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <BilingualField
                label="English"
                value={pair.en}
                placeholder={defaultPair?.en}
                onChange={(v) => onChange({ ...pair, en: v })}
                onLoadDefault={defaultPair ? () => fillFromDefault("en") : undefined}
                inline={inline}
              />
              <BilingualField
                label="Bahasa Indonesia"
                value={pair.id}
                placeholder={defaultPair?.id}
                onChange={(v) => onChange({ ...pair, id: v })}
                onLoadDefault={defaultPair ? () => fillFromDefault("id") : undefined}
                inline={inline}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassPanel>
  );
}

function BilingualField({
  label,
  value,
  placeholder,
  onChange,
  onLoadDefault,
  inline,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
  // When provided, renders a "Load default" button that copies the default
  // text into the textarea so the admin can edit it instead of starting empty.
  onLoadDefault?: () => void;
  inline?: boolean;
}) {
  const { t } = useT();
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="font-display text-[10px] uppercase tracking-widest text-text-muted">
          {label}
        </label>
        {onLoadDefault && !value.trim() && placeholder && (
          <button
            type="button"
            onClick={onLoadDefault}
            className="text-[10px] font-display uppercase tracking-widest text-cyan-accent hover:text-cyan-accent/80 cursor-pointer"
          >
            ↓ {t("admin.prompt.loadDefault")}
          </button>
        )}
      </div>
      {inline ? (
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-obsidian-surface border border-glass-border rounded-lg px-3 py-2 text-[13px] text-text-primary placeholder-text-muted focus:outline-none focus:border-cyan-accent/40 transition-colors"
        />
      ) : (
        <textarea
          rows={14}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-obsidian-surface border border-glass-border rounded-lg px-3 py-2 text-[12.5px] font-mono text-text-primary placeholder-text-muted/60 focus:outline-none focus:border-cyan-accent/40 transition-colors resize-y leading-relaxed"
        />
      )}
    </div>
  );
}

function RoleVibeBlock({
  label,
  pair,
  defaultPair,
  onChange,
}: {
  label: string;
  pair: LocalePair;
  defaultPair?: LocalePair;
  onChange: (p: LocalePair) => void;
}) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const isOverridden = Boolean(
    (pair.en && pair.en.trim()) || (pair.id && pair.id.trim()),
  );
  const matchesDefault = Boolean(
    defaultPair &&
      pair.en.trim() === defaultPair.en.trim() &&
      pair.id.trim() === defaultPair.id.trim(),
  );
  const effectivelyOverridden = isOverridden && !matchesDefault;
  const fillFromDefault = (which: "en" | "id") => {
    if (!defaultPair) return;
    const next: LocalePair = { ...pair };
    if (which === "en" && !pair.en.trim()) next.en = defaultPair.en;
    if (which === "id" && !pair.id.trim()) next.id = defaultPair.id;
    onChange(next);
  };
  const handleToggle = () => {
    setOpen((wasOpen) => {
      const next = !wasOpen;
      if (next && !isOverridden && defaultPair) {
        onChange({
          en: pair.en.trim() ? pair.en : defaultPair.en,
          id: pair.id.trim() ? pair.id : defaultPair.id,
        });
      }
      return next;
    });
  };
  return (
    <div className="rounded-xl border border-glass-border bg-glass-bg/40 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-semibold text-text-primary">{label}</span>
          {effectivelyOverridden ? (
            <span className="text-[10px] font-display uppercase tracking-widest text-bio-green border border-bio-green/40 bg-bio-green/10 rounded-full px-2 py-0.5">
              {t("admin.prompt.status.overridden")}
            </span>
          ) : (
            <span className="text-[10px] font-display uppercase tracking-widest text-text-muted border border-glass-border rounded-full px-2 py-0.5">
              {t("admin.prompt.status.default")}
            </span>
          )}
        </div>
        <div className="flex gap-1.5">
          {effectivelyOverridden && (
            <button
              type="button"
              onClick={() => onChange({ en: "", id: "" })}
              className="h-7 px-2.5 rounded-lg border border-danger/40 bg-danger/5 text-danger text-[11px] font-display uppercase tracking-widest hover:bg-danger/15 transition-colors cursor-pointer"
            >
              {t("admin.prompt.clearOverride")}
            </button>
          )}
          <button
            type="button"
            onClick={handleToggle}
            className="h-7 px-2.5 rounded-lg border border-glass-border bg-obsidian-surface text-text-secondary text-[11px] font-display uppercase tracking-widest hover:border-cyan-accent/40 hover:text-cyan-accent transition-colors cursor-pointer"
          >
            {open ? t("admin.prompt.collapse") : t("admin.prompt.expand")}
          </button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <BilingualField
                label="English"
                value={pair.en}
                placeholder={defaultPair?.en}
                onChange={(v) => onChange({ ...pair, en: v })}
                onLoadDefault={defaultPair ? () => fillFromDefault("en") : undefined}
              />
              <BilingualField
                label="Bahasa Indonesia"
                value={pair.id}
                placeholder={defaultPair?.id}
                onChange={(v) => onChange({ ...pair, id: v })}
                onLoadDefault={defaultPair ? () => fillFromDefault("id") : undefined}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

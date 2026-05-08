"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import GlassPanel from "@/components/ui/GlassPanel";
import GlassButton from "@/components/ui/GlassButton";
import { adminFetch } from "@/lib/adminFetch";
import { useT } from "@/lib/i18n/useT";
import {
  type BilingualText,
  type HobbyPromptGroup,
  type SuggestionCategory,
  type SuggestionItem,
  type SuggestionTemplateShape,
} from "@/lib/suggestionTemplate";

function newCatId(): string {
  const ts = Date.now().toString(36).slice(-4);
  const r = Math.random().toString(36).slice(2, 7);
  return `cat-${ts}${r}`;
}

const ACCENT_PRESETS = ["#FF2D87", "#00F0FF", "#39FF14", "#FFD93D", "#6C5CE7", "#A8E6CF", "#FF9F43", "#F368E0"];

export default function SuggestionsBuilder() {
  const { t } = useT();
  const [template, setTemplate] = useState<SuggestionTemplateShape | null>(null);
  const [knownHobbies, setKnownHobbies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/suggestions");
      const data = await res.json();
      if (data.template) setTemplate(data.template);
      if (Array.isArray(data.knownHobbies)) setKnownHobbies(data.knownHobbies);
      setError(null);
    } catch {
      setError(t("admin.suggestions.error.load"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    if (!template) return;
    setSaving(true);
    setError(null);
    try {
      const res = await adminFetch("/api/admin/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message ?? t("admin.suggestions.error.save"));
      } else {
        setTemplate(data.template);
        setSavedAt(new Date());
      }
    } catch {
      setError(t("admin.suggestions.error.save"));
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefault = async () => {
    if (!confirm(t("admin.suggestions.confirm.reset"))) return;
    try {
      const res = await adminFetch("/api/admin/suggestions?reset=1");
      const data = await res.json();
      if (data?.template) setTemplate(data.template);
    } catch {
      setError(t("admin.suggestions.error.load"));
    }
  };

  // ---------- Category mutations ----------
  const updateCategory = (idx: number, patch: Partial<SuggestionCategory>) => {
    if (!template) return;
    const categories = [...template.categories];
    categories[idx] = { ...categories[idx], ...patch };
    setTemplate({ ...template, categories });
  };
  const moveCategory = (idx: number, dir: -1 | 1) => {
    if (!template) return;
    const target = idx + dir;
    if (target < 0 || target >= template.categories.length) return;
    const categories = [...template.categories];
    [categories[idx], categories[target]] = [categories[target], categories[idx]];
    setTemplate({ ...template, categories });
  };
  const deleteCategory = (idx: number) => {
    if (!template) return;
    if (!confirm(t("admin.suggestions.confirm.deleteCategory"))) return;
    setTemplate({ ...template, categories: template.categories.filter((_, i) => i !== idx) });
  };
  const addCategory = () => {
    if (!template) return;
    const cat: SuggestionCategory = {
      id: newCatId(),
      accent: ACCENT_PRESETS[template.categories.length % ACCENT_PRESETS.length],
      label: { en: "New Category", id: "Kategori Baru" },
      hint: { en: "", id: "" },
      items: [],
    };
    setTemplate({ ...template, categories: [...template.categories, cat] });
  };

  // ---------- Item mutations (inside a category) ----------
  const updateItem = (cIdx: number, iIdx: number, patch: Partial<SuggestionItem>) => {
    if (!template) return;
    const categories = [...template.categories];
    const items = [...categories[cIdx].items];
    items[iIdx] = { ...items[iIdx], ...patch };
    categories[cIdx] = { ...categories[cIdx], items };
    setTemplate({ ...template, categories });
  };
  const addItem = (cIdx: number) => {
    if (!template) return;
    const categories = [...template.categories];
    categories[cIdx] = {
      ...categories[cIdx],
      items: [...categories[cIdx].items, { en: "", id: "" }],
    };
    setTemplate({ ...template, categories });
  };
  const deleteItem = (cIdx: number, iIdx: number) => {
    if (!template) return;
    const categories = [...template.categories];
    const items = categories[cIdx].items.filter((_, i) => i !== iIdx);
    categories[cIdx] = { ...categories[cIdx], items };
    setTemplate({ ...template, categories });
  };
  const moveItem = (cIdx: number, iIdx: number, dir: -1 | 1) => {
    if (!template) return;
    const target = iIdx + dir;
    const items = [...template.categories[cIdx].items];
    if (target < 0 || target >= items.length) return;
    [items[iIdx], items[target]] = [items[target], items[iIdx]];
    const categories = [...template.categories];
    categories[cIdx] = { ...categories[cIdx], items };
    setTemplate({ ...template, categories });
  };

  // ---------- Hobby prompt mutations ----------
  const updateHobbyItem = (hIdx: number, iIdx: number, patch: Partial<SuggestionItem>) => {
    if (!template) return;
    const hobbyPrompts = [...template.hobbyPrompts];
    const items = [...hobbyPrompts[hIdx].items];
    items[iIdx] = { ...items[iIdx], ...patch };
    hobbyPrompts[hIdx] = { ...hobbyPrompts[hIdx], items };
    setTemplate({ ...template, hobbyPrompts });
  };
  const addHobbyItem = (hIdx: number) => {
    if (!template) return;
    const hobbyPrompts = [...template.hobbyPrompts];
    hobbyPrompts[hIdx] = {
      ...hobbyPrompts[hIdx],
      items: [...hobbyPrompts[hIdx].items, { en: "", id: "" }],
    };
    setTemplate({ ...template, hobbyPrompts });
  };
  const deleteHobbyItem = (hIdx: number, iIdx: number) => {
    if (!template) return;
    const hobbyPrompts = [...template.hobbyPrompts];
    const items = hobbyPrompts[hIdx].items.filter((_, i) => i !== iIdx);
    hobbyPrompts[hIdx] = { ...hobbyPrompts[hIdx], items };
    setTemplate({ ...template, hobbyPrompts });
  };
  const deleteHobbyGroup = (hIdx: number) => {
    if (!template) return;
    if (!confirm(t("admin.suggestions.confirm.deleteHobby"))) return;
    setTemplate({ ...template, hobbyPrompts: template.hobbyPrompts.filter((_, i) => i !== hIdx) });
  };
  const addHobbyGroup = (hobby: string) => {
    if (!template) return;
    const exists = template.hobbyPrompts.find((h) => h.hobby === hobby);
    if (exists) return;
    const group: HobbyPromptGroup = { hobby, items: [{ en: "", id: "" }] };
    setTemplate({ ...template, hobbyPrompts: [...template.hobbyPrompts, group] });
  };

  if (loading || !template) {
    return <div className="text-text-muted text-sm">{t("admin.suggestions.loading")}</div>;
  }

  const usedHobbies = new Set(template.hobbyPrompts.map((h) => h.hobby));
  const availableHobbies = knownHobbies.filter((h) => !usedHobbies.has(h));

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <GlassPanel variant="elevated" className="p-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-lg font-bold text-text-primary">
            {t("admin.suggestions.heading")}
          </h2>
          <p className="text-[12px] text-text-muted mt-0.5 max-w-[640px]">
            {t("admin.suggestions.subheading")}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {savedAt && (
            <span className="text-[11px] text-bio-green font-display uppercase tracking-widest">
              {t("admin.suggestions.saved")}
            </span>
          )}
          {error && (
            <span className="text-[11px] text-danger font-display uppercase tracking-widest">
              {error}
            </span>
          )}
          <GlassButton variant="secondary" size="sm" onClick={handleResetDefault}>
            {t("admin.suggestions.resetDefault")}
          </GlassButton>
          <GlassButton size="sm" onClick={handleSave} disabled={saving}>
            {saving ? t("admin.suggestions.saving") : t("admin.suggestions.save")}
          </GlassButton>
        </div>
      </GlassPanel>

      {/* Categories section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-display text-base font-semibold text-text-primary">
            {t("admin.suggestions.categories.heading")}
          </h3>
          <GlassButton size="sm" onClick={addCategory}>
            + {t("admin.suggestions.categories.add")}
          </GlassButton>
        </div>

        <AnimatePresence initial={false}>
          {template.categories.map((cat, cIdx) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
            >
              <CategoryCard
                category={cat}
                idx={cIdx}
                total={template.categories.length}
                onChange={(patch) => updateCategory(cIdx, patch)}
                onMoveUp={() => moveCategory(cIdx, -1)}
                onMoveDown={() => moveCategory(cIdx, 1)}
                onDelete={() => deleteCategory(cIdx)}
                onItemChange={(iIdx, patch) => updateItem(cIdx, iIdx, patch)}
                onItemAdd={() => addItem(cIdx)}
                onItemDelete={(iIdx) => deleteItem(cIdx, iIdx)}
                onItemMoveUp={(iIdx) => moveItem(cIdx, iIdx, -1)}
                onItemMoveDown={(iIdx) => moveItem(cIdx, iIdx, 1)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {template.categories.length === 0 && (
          <div className="rounded-xl border border-dashed border-glass-border bg-glass-bg/40 px-4 py-6 text-center text-[13px] text-text-muted">
            {t("admin.suggestions.categories.empty")}
          </div>
        )}
      </div>

      {/* Hobby prompts section */}
      <div className="space-y-4 pt-4 border-t border-glass-border">
        <div>
          <h3 className="font-display text-base font-semibold text-text-primary">
            {t("admin.suggestions.hobby.heading")}
          </h3>
          <p className="text-[12px] text-text-muted mt-0.5 max-w-[640px]">
            {t("admin.suggestions.hobby.subheading")}
          </p>
        </div>

        <AnimatePresence initial={false}>
          {template.hobbyPrompts.map((group, hIdx) => (
            <motion.div
              key={group.hobby}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
            >
              <HobbyGroupCard
                group={group}
                onItemChange={(iIdx, patch) => updateHobbyItem(hIdx, iIdx, patch)}
                onItemAdd={() => addHobbyItem(hIdx)}
                onItemDelete={(iIdx) => deleteHobbyItem(hIdx, iIdx)}
                onDeleteGroup={() => deleteHobbyGroup(hIdx)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add new hobby group selector */}
        {availableHobbies.length > 0 && (
          <GlassPanel variant="inset" className="p-4">
            <p className="font-display text-[10px] uppercase tracking-widest text-text-muted mb-2">
              {t("admin.suggestions.hobby.addGroup")}
            </p>
            <div className="flex flex-wrap gap-2">
              {availableHobbies.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => addHobbyGroup(h)}
                  className="px-3 py-1 rounded-full text-[12px] border border-cyan-accent/40 bg-cyan-accent/5 text-cyan-accent hover:bg-cyan-accent/15 transition-colors cursor-pointer"
                >
                  + {h}
                </button>
              ))}
            </div>
          </GlassPanel>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// CategoryCard
// =============================================================================

function CategoryCard({
  category,
  idx,
  total,
  onChange,
  onMoveUp,
  onMoveDown,
  onDelete,
  onItemChange,
  onItemAdd,
  onItemDelete,
  onItemMoveUp,
  onItemMoveDown,
}: {
  category: SuggestionCategory;
  idx: number;
  total: number;
  onChange: (patch: Partial<SuggestionCategory>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onItemChange: (iIdx: number, patch: Partial<SuggestionItem>) => void;
  onItemAdd: () => void;
  onItemDelete: (iIdx: number) => void;
  onItemMoveUp: (iIdx: number) => void;
  onItemMoveDown: (iIdx: number) => void;
}) {
  const { t } = useT();
  return (
    <GlassPanel variant="elevated" className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-[260px] space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: category.accent, boxShadow: `0 0 8px ${category.accent}` }}
            />
            <span className="font-display text-[10px] uppercase tracking-widest text-cyan-accent/80">
              {t("admin.suggestions.categoryLabel")} #{idx + 1}
            </span>
            <code className="text-[10px] text-text-muted font-mono">{category.id}</code>
          </div>
          <BilingualPair
            placeholderEn="Tab label (EN)"
            placeholderId="Label tab (ID)"
            value={category.label}
            onChange={(label) => onChange({ label })}
          />
          <BilingualPair
            placeholderEn="Hint text (EN, optional)"
            placeholderId="Teks bantuan (ID, opsional)"
            value={category.hint}
            onChange={(hint) => onChange({ hint })}
            multiline
          />
          <AccentEditor accent={category.accent} onChange={(accent) => onChange({ accent })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <ReorderControls
            onUp={onMoveUp}
            onDown={onMoveDown}
            upDisabled={idx === 0}
            downDisabled={idx === total - 1}
          />
          <button
            type="button"
            className="h-7 px-2.5 rounded-lg border border-danger/40 bg-danger/5 text-danger text-[11px] font-display uppercase tracking-widest hover:bg-danger/15 transition-colors cursor-pointer"
            onClick={onDelete}
          >
            {t("admin.suggestions.delete")}
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2">
        <p className="font-display text-[10px] uppercase tracking-widest text-text-muted">
          {t("admin.suggestions.items")} ({category.items.length})
        </p>
        {category.items.map((item, iIdx) => (
          <ItemEditor
            key={iIdx}
            item={item}
            onChange={(patch) => onItemChange(iIdx, patch)}
            onDelete={() => onItemDelete(iIdx)}
            onMoveUp={() => onItemMoveUp(iIdx)}
            onMoveDown={() => onItemMoveDown(iIdx)}
            upDisabled={iIdx === 0}
            downDisabled={iIdx === category.items.length - 1}
          />
        ))}
        {category.items.length === 0 && (
          <div className="rounded-lg border border-dashed border-glass-border bg-obsidian-surface/40 px-3 py-2 text-[12px] text-text-muted">
            {t("admin.suggestions.items.empty")}
          </div>
        )}
        <button
          type="button"
          onClick={onItemAdd}
          className="text-[11px] font-display uppercase tracking-widest text-cyan-accent hover:text-cyan-accent/80 cursor-pointer"
        >
          + {t("admin.suggestions.items.add")}
        </button>
      </div>
    </GlassPanel>
  );
}

// =============================================================================
// HobbyGroupCard
// =============================================================================

function HobbyGroupCard({
  group,
  onItemChange,
  onItemAdd,
  onItemDelete,
  onDeleteGroup,
}: {
  group: HobbyPromptGroup;
  onItemChange: (iIdx: number, patch: Partial<SuggestionItem>) => void;
  onItemAdd: () => void;
  onItemDelete: (iIdx: number) => void;
  onDeleteGroup: () => void;
}) {
  const { t } = useT();
  return (
    <GlassPanel variant="elevated" className="p-5 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="font-display text-base font-semibold text-text-primary">
            {group.hobby}
          </span>
          <span className="text-[10px] font-display uppercase tracking-widest text-text-muted border border-glass-border rounded-full px-2 py-0.5">
            {group.items.length} {t("admin.suggestions.items")}
          </span>
        </div>
        <button
          type="button"
          className="h-7 px-2.5 rounded-lg border border-danger/40 bg-danger/5 text-danger text-[11px] font-display uppercase tracking-widest hover:bg-danger/15 transition-colors cursor-pointer"
          onClick={onDeleteGroup}
        >
          {t("admin.suggestions.delete")}
        </button>
      </div>
      <div className="space-y-2">
        {group.items.map((item, iIdx) => (
          <ItemEditor
            key={iIdx}
            item={item}
            onChange={(patch) => onItemChange(iIdx, patch)}
            onDelete={() => onItemDelete(iIdx)}
            // Hobby items are unordered (concatenated at runtime), so no
            // reorder controls — keeps the editor visually simpler.
            onMoveUp={() => {}}
            onMoveDown={() => {}}
            upDisabled
            downDisabled
            hideReorder
          />
        ))}
        <button
          type="button"
          onClick={onItemAdd}
          className="text-[11px] font-display uppercase tracking-widest text-cyan-accent hover:text-cyan-accent/80 cursor-pointer"
        >
          + {t("admin.suggestions.items.add")}
        </button>
      </div>
    </GlassPanel>
  );
}

// =============================================================================
// Subcomponents
// =============================================================================

function ItemEditor({
  item,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  upDisabled,
  downDisabled,
  hideReorder,
}: {
  item: SuggestionItem;
  onChange: (patch: Partial<SuggestionItem>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  upDisabled: boolean;
  downDisabled: boolean;
  hideReorder?: boolean;
}) {
  return (
    <div className="rounded-lg border border-glass-border bg-obsidian-surface/30 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex-1 min-w-[240px]">
          <BilingualPair
            placeholderEn="Item text (EN)"
            placeholderId="Teks item (ID)"
            value={item}
            onChange={(v) => onChange(v)}
            multiline
          />
        </div>
        <div className="flex gap-1.5">
          {!hideReorder && (
            <ReorderControls
              onUp={onMoveUp}
              onDown={onMoveDown}
              upDisabled={upDisabled}
              downDisabled={downDisabled}
            />
          )}
          <button
            type="button"
            className="h-7 w-7 rounded-lg border border-danger/40 bg-danger/5 text-danger text-[12px] hover:bg-danger/15 transition-colors cursor-pointer"
            onClick={onDelete}
            aria-label="Delete item"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

function BilingualPair({
  placeholderEn,
  placeholderId,
  value,
  onChange,
  multiline,
}: {
  placeholderEn: string;
  placeholderId: string;
  value: BilingualText;
  onChange: (v: BilingualText) => void;
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
          value={value.en}
          onChange={(e) => onChange({ ...value, en: e.target.value })}
          className={`${cls} resize-y`}
        />
        <textarea
          rows={2}
          placeholder={placeholderId}
          value={value.id}
          onChange={(e) => onChange({ ...value, id: e.target.value })}
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
        value={value.en}
        onChange={(e) => onChange({ ...value, en: e.target.value })}
        className={cls}
      />
      <input
        type="text"
        placeholder={placeholderId}
        value={value.id}
        onChange={(e) => onChange({ ...value, id: e.target.value })}
        className={cls}
      />
    </div>
  );
}

function AccentEditor({
  accent,
  onChange,
}: {
  accent: string;
  onChange: (v: string) => void;
}) {
  const { t } = useT();
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="font-display text-[10px] uppercase tracking-widest text-text-muted">
        {t("admin.suggestions.accent")}
      </span>
      <div className="flex gap-1">
        {ACCENT_PRESETS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={`h-6 w-6 rounded-full border-2 transition-transform cursor-pointer ${
              accent === c ? "border-white scale-110" : "border-transparent hover:scale-105"
            }`}
            style={{ backgroundColor: c, boxShadow: `0 0 8px ${c}88` }}
            aria-label={`Pick accent ${c}`}
          />
        ))}
      </div>
      <input
        type="text"
        value={accent}
        onChange={(e) => onChange(e.target.value)}
        className="w-24 bg-obsidian-surface border border-glass-border rounded px-2 py-1 text-[12px] font-mono text-text-primary focus:outline-none focus:border-cyan-accent/40"
      />
    </div>
  );
}

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

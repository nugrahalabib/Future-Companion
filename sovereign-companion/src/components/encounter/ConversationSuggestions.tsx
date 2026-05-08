"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocaleStore } from "@/stores/useLocaleStore";
import {
  DEFAULT_SUGGESTIONS,
  type SuggestionCategory,
  type SuggestionItem,
  type SuggestionTemplateShape,
} from "@/lib/suggestionTemplate";

interface ConversationSuggestionsProps {
  hobbies: string[];
  onPick: (text: string) => void;
  disabled?: boolean;
}

export default function ConversationSuggestions({
  hobbies,
  onPick,
  disabled,
}: ConversationSuggestionsProps) {
  const locale = useLocaleStore((s) => s.locale);
  // Optimistic default render so the panel shows up immediately; replaced
  // with the live admin-edited template once the fetch resolves.
  const [template, setTemplate] = useState<SuggestionTemplateShape>(DEFAULT_SUGGESTIONS);

  // Live-fetch the active template so admin edits to /admin/suggestions land
  // even on in-flight encounter sessions:
  //   1. On mount (first paint).
  //   2. Every 60s while the panel is visible (covers the typical 5-min
  //      session length without hammering the API).
  //   3. When the tab regains focus (admin often edits in another tab and
  //      switches back — instant refresh on visibility change).
  useEffect(() => {
    let cancelled = false;
    const fetchTemplate = () => {
      fetch("/api/suggestions", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          if (cancelled) return;
          if (d?.template?.categories) setTemplate(d.template);
        })
        .catch(() => {
          // Silent fallback — encounter UX must never crash because
          // suggestions failed to load.
        });
    };
    fetchTemplate();
    const intervalId = setInterval(fetchTemplate, 60_000);
    const onVisibility = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchTemplate();
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisibility);
    }
    return () => {
      cancelled = true;
      clearInterval(intervalId);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibility);
      }
    };
  }, []);

  // Build a "Your Interests" category from per-hobby prompts that match the
  // companion's hobby selection. Auto-prepended so it sits at the front of
  // the tab strip when present.
  const hobbyCategory = useMemo<SuggestionCategory | null>(() => {
    const items: SuggestionItem[] = [];
    const promptsByHobby = new Map<string, SuggestionItem[]>();
    for (const group of template.hobbyPrompts) {
      promptsByHobby.set(group.hobby, group.items);
    }
    for (const h of hobbies) {
      const promptItems = promptsByHobby.get(h);
      if (promptItems) items.push(...promptItems);
    }
    if (items.length === 0) return null;
    return {
      id: "hobby",
      accent: "#FF2D87",
      label: { id: "Minat Kamu", en: "Your Interests" },
      hint: {
        id: "Disaring dari hobi yang kamu pilih tadi.",
        en: "Drawn from the hobbies you chose earlier.",
      },
      items,
    };
  }, [hobbies, template.hobbyPrompts]);

  const categories = useMemo<SuggestionCategory[]>(
    () => (hobbyCategory ? [hobbyCategory, ...template.categories] : template.categories),
    [hobbyCategory, template.categories],
  );

  const [activeId, setActiveId] = useState<string>(categories[0]?.id ?? "icebreaker");
  // Keep activeId in sync if categories list changes (e.g. admin deleted the
  // currently active tab) so the panel doesn't render an empty state.
  useEffect(() => {
    if (!categories.find((c) => c.id === activeId) && categories.length > 0) {
      setActiveId(categories[0].id);
    }
  }, [categories, activeId]);

  const active = categories.find((c) => c.id === activeId) ?? categories[0];

  if (!active) {
    // Admin deleted everything — render nothing rather than a broken panel.
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col gap-4 px-6 py-2 overflow-hidden">
      <div className="flex flex-col gap-1.5">
        <span className="font-display text-[12px] uppercase tracking-[0.32em] text-cyan-accent/80">
          {locale === "en" ? "Conversation Starters" : "Saran Obrolan"}
        </span>
        <span className="text-[13px] text-text-muted leading-relaxed">
          {locale === "en"
            ? "Tap one, she'll respond right away."
            : "Tap salah satu, dia langsung balas."}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => {
          const label = locale === "en" ? c.label.en : c.label.id;
          const isActive = c.id === activeId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveId(c.id)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-display uppercase tracking-[0.18em] transition-all ${
                isActive ? "text-obsidian-950" : "text-text-secondary hover:text-white"
              }`}
              style={
                isActive
                  ? { backgroundColor: c.accent }
                  : { backgroundColor: "rgba(255,255,255,0.04)" }
              }
            >
              {label}
            </button>
          );
        })}
      </div>

      <span className="text-[12.5px] italic text-text-muted/80 leading-snug">
        {locale === "en" ? active.hint.en : active.hint.id}
      </span>

      <div
        className="flex-1 flex flex-col gap-2.5 overflow-y-auto pr-1 -mr-1"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent 0, #000 20px, #000 calc(100% - 32px), transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0, #000 20px, #000 calc(100% - 32px), transparent 100%)",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-2.5"
          >
            {active.items.map((item, idx) => {
              const text = locale === "en" ? item.en : item.id;
              if (!text.trim()) return null;
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabled}
                  onClick={() => onPick(text)}
                  className="group text-left rounded-xl px-4 py-3.5 text-[14.5px] leading-relaxed text-text-primary/90 transition-all hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.035)",
                    borderLeft: `2px solid ${active.accent}55`,
                  }}
                >
                  {text}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

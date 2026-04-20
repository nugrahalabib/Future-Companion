"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { type TranscriptEntry } from "@/stores/useEncounterStore";
import { useT } from "@/lib/i18n/useT";

interface ChatStreamProps {
  entries: TranscriptEntry[];
}

// Typewriter — progressively reveals chars of `text`. When new fragments
// arrive (text grows), the effect continues typing smoothly from where it
// was instead of restarting. If we fall behind by many chars (live voice
// streams fast), advance multiple chars per tick so the caption stays
// roughly in sync with the audio. When `finalized` flips true, snap to
// full text so the bubble doesn't sit mid-word after the turn ends.
function TypewriterText({
  text,
  finalized,
  cps = 55,
}: {
  text: string;
  finalized?: boolean;
  cps?: number;
}) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    // Text shrank or diverged from what we've shown — snap to avoid garble.
    if (displayed.length > text.length || !text.startsWith(displayed)) {
      setDisplayed(text);
      return;
    }
    if (displayed === text) return;

    const intervalMs = Math.max(12, Math.floor(1000 / cps));
    const id = setInterval(() => {
      setDisplayed((prev) => {
        if (prev.length >= text.length) return prev;
        const gap = text.length - prev.length;
        // Catch up faster the further behind we are, so the caption keeps
        // pace with native-audio voice.
        const step = gap > 40 ? 5 : gap > 20 ? 3 : gap > 10 ? 2 : 1;
        return text.slice(0, prev.length + step);
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [text, displayed, cps]);

  useEffect(() => {
    if (finalized && displayed !== text) setDisplayed(text);
  }, [finalized, text, displayed]);

  const isTyping = !finalized && displayed.length < text.length;

  return (
    <>
      <span>{displayed}</span>
      {isTyping && (
        <span
          aria-hidden
          className="inline-block w-[2px] h-[1em] align-[-2px] ml-[2px] bg-current opacity-70 animate-pulse"
        />
      )}
    </>
  );
}

export default function ChatStream({ entries }: ChatStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useT();

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [entries]);

  return (
    <div
      ref={scrollRef}
      className="flex h-full w-full flex-col gap-3 overflow-y-auto pr-3 pl-2 py-4"
      style={{
        maskImage:
          "linear-gradient(to bottom, transparent 0, #000 48px, #000 calc(100% - 12px), transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0, #000 48px, #000 calc(100% - 12px), transparent 100%)",
      }}
    >
      {entries.length === 0 && (
        <div className="mt-auto mb-auto text-center text-[13px] italic tracking-wide text-text-muted/70">
          {t("encounter.chat.empty")}
        </div>
      )}

      <AnimatePresence initial={false}>
        {entries.map((entry) => {
          const isUser = entry.role === "user";
          return (
            <motion.div
              key={entry.id}
              layout
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <motion.div
                layout
                transition={{ layout: { duration: 0.15, ease: "easeOut" } }}
                className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed backdrop-blur-md ${
                  isUser
                    ? "rounded-br-md bg-[rgba(0,120,170,0.6)] text-white border border-cyan-accent/50"
                    : "rounded-bl-md bg-[rgba(18,24,34,0.82)] text-text-primary border border-glass-border"
                }`}
                style={
                  isUser
                    ? { boxShadow: "0 4px 18px rgba(0,120,170,0.35)" }
                    : { boxShadow: "0 4px 16px rgba(0,0,0,0.5)" }
                }
              >
                <TypewriterText text={entry.text} finalized={entry.finalized} />

              </motion.div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

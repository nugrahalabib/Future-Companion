"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { type TranscriptEntry } from "@/stores/useEncounterStore";

interface TranscriptScrollProps {
  entries: TranscriptEntry[];
}

export default function TranscriptScroll({ entries }: TranscriptScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="text-center text-text-muted text-sm py-4 italic">
        Mulai berbicara untuk melihat transkrip percakapan...
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="max-h-48 overflow-y-auto space-y-2 px-4 py-3"
    >
      {entries.map((entry, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex ${entry.role === "user" ? "justify-start" : "justify-end"}`}
        >
          <div
            className={`max-w-[80%] px-3 py-1.5 rounded-lg text-sm ${
              entry.role === "user"
                ? "glass text-text-secondary"
                : "bg-cyan-accent/10 text-cyan-accent border border-cyan-accent/20"
            }`}
          >
            {entry.text}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

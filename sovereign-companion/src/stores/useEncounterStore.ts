import { create } from "zustand";
import type { ToolEvent } from "@/lib/companionTools";

export interface TranscriptEntry {
  // Stable ID set once at creation — NEVER changes across merges. React keys
  // in ChatStream bind to this so the bubble animates in once and stays as
  // ONE element through the whole streaming turn. If we used `timestamp`
  // instead (which gets bumped every merge), AnimatePresence would see a new
  // key every fragment and render exit+enter for each word — which is what
  // caused the "ghost bubbles stacking" bug.
  id: string;
  role: "user" | "companion";
  text: string;
  // Latest fragment timestamp — drives the merge-gap window. Replaced on
  // every merge so the window moves forward with the user's speech.
  timestamp: number;
  // Marked `true` once the server sends `finished: true` for this turn's
  // transcription — downstream bubbles won't merge new fragments into a
  // finalized one even if the gap is short.
  finalized?: boolean;
}

export const ENCOUNTER_DURATION_SECONDS = 300; // 5 minutes
const MERGE_GAP_MS = 1500;

export type ConnectionPhase =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "closed"
  | "error";

interface EncounterState {
  transcript: TranscriptEntry[];
  toolEvents: ToolEvent[];
  isConnected: boolean;
  connectionPhase: ConnectionPhase;
  timeRemaining: number;
  isRecording: boolean;
  isPaused: boolean;
  isMuted: boolean;
  addTranscriptFragment: (
    role: "user" | "companion",
    text: string,
    timestamp: number,
    finalized?: boolean,
  ) => void;
  addToolEvent: (event: ToolEvent) => void;
  setConnected: (connected: boolean) => void;
  setConnectionPhase: (phase: ConnectionPhase) => void;
  setTimeRemaining: (seconds: number) => void;
  setRecording: (recording: boolean) => void;
  setPaused: (paused: boolean) => void;
  setMuted: (muted: boolean) => void;
  reset: () => void;
}

function normalizeFragment(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function smartJoin(a: string, b: string): string {
  if (!a) return b;
  if (!b) return a;
  const needsSpace = !/[\s\n]$/.test(a) && !/^[.,!?;:'")\]}]/.test(b);
  return needsSpace ? `${a} ${b}` : `${a}${b}`;
}

export const useEncounterStore = create<EncounterState>((set) => ({
  transcript: [],
  toolEvents: [],
  isConnected: false,
  connectionPhase: "idle",
  timeRemaining: ENCOUNTER_DURATION_SECONDS,
  isRecording: false,
  isPaused: false,
  isMuted: false,
  addTranscriptFragment: (role, text, timestamp, finalized) =>
    set((s) => {
      const clean = normalizeFragment(text);
      if (!clean) return s;
      const last = s.transcript[s.transcript.length - 1];
      const canMerge =
        last &&
        last.role === role &&
        !last.finalized &&
        timestamp - last.timestamp <= MERGE_GAP_MS;
      if (canMerge) {
        const merged: TranscriptEntry = {
          id: last.id, // preserve stable id so React key doesn't churn
          role: last.role,
          text: smartJoin(last.text, clean),
          timestamp,
          finalized: !!finalized,
        };
        return { transcript: [...s.transcript.slice(0, -1), merged] };
      }
      const entry: TranscriptEntry = {
        id: `${role}-${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
        role,
        text: clean,
        timestamp,
        finalized: !!finalized,
      };
      return { transcript: [...s.transcript, entry] };
    }),
  addToolEvent: (event) =>
    set((s) => ({ toolEvents: [...s.toolEvents, event].slice(-20) })),
  setConnected: (connected) => set({ isConnected: connected }),
  setConnectionPhase: (phase) =>
    set({
      connectionPhase: phase,
      isConnected: phase === "connected",
    }),
  setTimeRemaining: (seconds) => set({ timeRemaining: seconds }),
  setRecording: (recording) => set({ isRecording: recording }),
  setPaused: (paused) => set({ isPaused: paused }),
  setMuted: (muted) => set({ isMuted: muted }),
  reset: () =>
    set({
      transcript: [],
      toolEvents: [],
      isConnected: false,
      connectionPhase: "idle",
      timeRemaining: ENCOUNTER_DURATION_SECONDS,
      isRecording: false,
      isPaused: false,
      isMuted: false,
    }),
}));

// Highlight reel picker — chooses up to 3 companion lines with the best signal
// (length + sentence variety). Used post-encounter in checkout for a poetic
// callback moment.
export function pickHighlights(entries: TranscriptEntry[], max = 3): string[] {
  const companionLines = entries
    .filter((e) => e.role === "companion" && e.text.length >= 30 && e.text.length <= 180)
    .map((e) => e.text);
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const line of companionLines) {
    const key = line.slice(0, 40).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(line);
  }
  if (unique.length <= max) return unique;
  // Even-spaced sample across the conversation for arc coverage
  const step = unique.length / max;
  const picks: string[] = [];
  for (let i = 0; i < max; i++) {
    picks.push(unique[Math.floor(i * step)]);
  }
  return picks;
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Background from "@/components/layout/Background";
import GlassButton from "@/components/ui/GlassButton";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import UserWaveform from "@/components/encounter/UserWaveform";
import ChatStream from "@/components/encounter/ChatStream";
import CallControls from "@/components/encounter/CallControls";
import CompanionActionsOverlay from "@/components/encounter/CompanionActionsOverlay";
import LanguageToggle from "@/components/encounter/LanguageToggle";
import ConversationSuggestions from "@/components/encounter/ConversationSuggestions";
import { useGeminiLive, type ConnectionPhase as GeminiPhase } from "@/hooks/useGeminiLive";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import {
  ENCOUNTER_DURATION_SECONDS,
  useEncounterStore,
  type TranscriptEntry,
  pickHighlights,
} from "@/stores/useEncounterStore";
import { useCompanionStore } from "@/stores/useCompanionStore";
import { useUserStore } from "@/stores/useUserStore";
import { useSessionStore } from "@/stores/useSessionStore";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { buildSystemPrompt } from "@/lib/systemPromptBuilder";
import { getSkinTone } from "@/lib/companionAssets";
import { pickVoice, pickLanguage } from "@/lib/voiceMapping";
import { COMPANION_FUNCTION_DECLARATIONS, runCompanionTool, type ToolEvent } from "@/lib/companionTools";
import RouteGuard from "@/components/layout/RouteGuard";
import ErrorBoundary from "@/components/layout/ErrorBoundary";
import { useT } from "@/lib/i18n/useT";
import { useHydrated } from "@/lib/useHydrated";
import DemoPausedScreen from "@/components/ui/DemoPausedScreen";
import { useDemoStatus } from "@/lib/useDemoStatus";

type ConnState = "idle" | "connecting" | "connected" | "ended";

function formatTime(s: number) {
  const m = Math.floor(Math.max(0, s) / 60);
  const sec = Math.max(0, s) % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export default function EncounterPage() {
  const router = useRouter();
  const { status: demoStatus } = useDemoStatus(30000);
  const userId = useUserStore((s) => s.userId);
  const hydrated = useHydrated(["user", "session", "companion"]);
  const userOwnNickname = useUserStore((s) => s.nickname);
  const setStage = useSessionStore((s) => s.setStage);
  const getFullConfig = useCompanionStore((s) => s.getFullConfig);
  const finalImagePath = useCompanionStore((s) => s.finalImagePath);
  const skinTone = useCompanionStore((s) => s.skinTone);
  const companionName = useCompanionStore((s) => s.companionName);
  const skin = useMemo(() => getSkinTone(skinTone), [skinTone]);
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const { t } = useT();

  const {
    transcript,
    toolEvents,
    timeRemaining,
    isPaused,
    isMuted,
    connectionPhase,
    addTranscriptFragment,
    addToolEvent,
    setTimeRemaining,
    setConnected,
    setConnectionPhase,
    setPaused,
    setMuted,
    reset: resetEncounter,
  } = useEncounterStore();

  const [connectionState, setConnectionState] = useState<ConnState>("idle");
  const [error, setError] = useState("");
  const [endReason, setEndReason] = useState<"user" | "timer" | "">("");
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const endedRef = useRef(false);
  const startTimeRef = useRef<number>(0);
  const aiSilenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Snapshot the config so the voice/language don't flicker when the user
  // re-enters the store for other reads.
  const configSnapshot = useMemo(() => getFullConfig(), [getFullConfig]);

  const voiceName = useMemo(
    () => pickVoice(configSnapshot.gender as string, configSnapshot.role as string),
    [configSnapshot.gender, configSnapshot.role],
  );
  const languageCode = useMemo(() => pickLanguage(locale), [locale]);

  const systemPrompt = useMemo(
    () =>
      buildSystemPrompt(
        {
          ...configSnapshot,
          userOwnNickname,
        } as unknown as Parameters<typeof buildSystemPrompt>[0],
        locale,
      ),
    [configSnapshot, userOwnNickname, locale],
  );

  const player = useAudioPlayer();

  const handleTranscript = useCallback(
    (role: "user" | "companion", text: string, isFinal?: boolean) => {
      if (!text.trim()) return;
      addTranscriptFragment(role, text, Date.now(), isFinal);
    },
    [addTranscriptFragment],
  );

  // Mark AI speaking when audio chunks arrive, drop flag after brief silence.
  const handleAudioOutput = useCallback(
    (base64: string) => {
      player.playChunk(base64);
      setAiSpeaking(true);
      if (aiSilenceTimer.current) clearTimeout(aiSilenceTimer.current);
      aiSilenceTimer.current = setTimeout(() => setAiSpeaking(false), 600);
    },
    [player],
  );

  // User barged in — flush companion audio so it actually stops talking.
  const handleInterrupted = useCallback(() => {
    player.flushQueue();
    setAiSpeaking(false);
  }, [player]);

  // Function call executor — deterministic, feeds UI overlay.
  const handleFunctionCall = useCallback(
    async (name: string, args: Record<string, unknown>) => {
      return runCompanionTool(name, args, (ev: ToolEvent) => {
        addToolEvent(ev);
      });
    },
    [addToolEvent],
  );

  const handleGeminiPhase = useCallback(
    (phase: GeminiPhase) => {
      setConnectionPhase(phase);
    },
    [setConnectionPhase],
  );

  const gemini = useGeminiLive({
    systemPrompt,
    voiceName,
    languageCode,
    enableAffectiveFeatures: true,
    functionDeclarations: COMPANION_FUNCTION_DECLARATIONS as unknown as never[],
    onAudioOutput: handleAudioOutput,
    onTranscript: handleTranscript,
    onInterrupted: handleInterrupted,
    onFunctionCall: handleFunctionCall,
    onError: (err) => {
      setError(err);
      if (connectionState !== "connected") setConnectionState("idle");
    },
    onPhaseChange: handleGeminiPhase,
  });

  const recorder = useAudioRecorder({
    onAudioChunk: (chunk) => gemini.sendAudio(chunk),
  });

  // Timer tick — driven by page so pause is clean.
  useEffect(() => {
    if (connectionState !== "connected" || isPaused) return;
    const id = setInterval(() => {
      const cur = useEncounterStore.getState().timeRemaining;
      if (cur <= 1) {
        setTimeRemaining(0);
        clearInterval(id);
        handleEnd("timer");
        return;
      }
      setTimeRemaining(cur - 1);
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionState, isPaused]);

  const handleStart = async () => {
    setConnectionState("connecting");
    setError("");
    resetEncounter();

    try {
      player.init();
      await gemini.connect();
      await recorder.start();
      // Push-to-Talk: mic stream starts muted. User holds the PTT button to
      // open the gate. This stops Gemini's server-side VAD from sitting on
      // an open silent stream forever, which was stalling turn completion.
      recorder.setMuted(true);
      setMuted(true);

      startTimeRef.current = Date.now();
      setConnectionState("connected");
      setConnected(true);

      // Per Gemini Live best-practices: the model waits for user input before
      // responding. Kickoff text forces the model to speak first. CRITICAL:
      // user-messages override systemInstruction, so this kickoff must NOT
      // instruct the AI to ask for a name (system prompt §5 already bans it).
      // Instead it tells the model to USE the already-known pet-name + hook
      // a specific hobby — exactly matching the §5 opener directive.
      const petNames = Array.isArray(configSnapshot.userNicknames)
        ? (configSnapshot.userNicknames as string[]).filter((n) => n && n.trim())
        : [];
      const firstPet = petNames[0] ?? "";
      const hobbies = Array.isArray(configSnapshot.hobbies)
        ? (configSnapshot.hobbies as string[])
        : [];
      const firstHobby = hobbies[0] ?? "";
      const kickoff =
        locale === "en"
          ? `[session start — this is the FIRST time you meet] Open the conversation FIRST. Do NOT ask their name or what to call them — you already know. Greet them using ${firstPet ? `the pet-name "${firstPet}"` : "one pet-name from their list"} from the very first word${firstHobby ? `, and open genuine present-tense curiosity about ${firstHobby} (which you just learned is one of their interests — DO NOT reference any past conversation, you've never met before)` : ""}. One short sentence, paralinguistic cue, warm/seductive undertone. Present moment only — no fake memories.`
          : `[sesi dimulai — ini PERTAMA kali kalian ketemu] Buka obrolan DULUAN. JANGAN nanya nama atau mau dipanggil apa — kamu udah tahu. Sapa dia pakai ${firstPet ? `panggilan "${firstPet}"` : "salah satu panggilan dari list-nya"} dari kata pertama${firstHobby ? `, dan buka rasa penasaran present-tense tentang ${firstHobby} (yang baru kamu tahu dari minatnya — JANGAN bikin seolah kalian pernah ngobrol soal itu sebelumnya, kalian belum pernah ketemu)` : ""}. Satu kalimat pendek, sisipkan paralinguistik, undertone hangat/seduktif. Present moment — tanpa memori palsu.`;
      try { gemini.sendText(kickoff); } catch {}

      fetch("/api/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: useSessionStore.getState().sessionId,
          encounterStartAt: new Date().toISOString(),
        }),
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal memulai encounter. Silakan coba lagi.";
      setError(message);
      setConnectionState("idle");
      recorder.stop();
      gemini.disconnect();
      player.close();
    }
  };

  const handleEnd = useCallback(
    async (reason: "user" | "timer" = "user") => {
      if (endedRef.current) return;
      endedRef.current = true;

      setEndReason(reason);
      try { gemini.endAudioStream(); } catch {}
      recorder.stop();
      gemini.disconnect();
      player.close();
      setConnected(false);
      setConnectionState("ended");

      const durationSec = startTimeRef.current
        ? Math.round((Date.now() - startTimeRef.current) / 1000)
        : ENCOUNTER_DURATION_SECONDS - timeRemaining;

      const entries = useEncounterStore.getState().transcript;
      if (entries.length > 0 && userId) {
        // Stash highlights for checkout callback moment
        try {
          const highlights = pickHighlights(entries, 3);
          sessionStorage.setItem("sovereign-highlights", JSON.stringify(highlights));
        } catch {}

        await fetch("/api/transcripts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            entries: entries.map((e: TranscriptEntry) => ({
              role: e.role,
              content: e.text,
              timestamp: e.timestamp,
            })),
          }),
        });
      }

      await fetch("/api/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: useSessionStore.getState().sessionId,
          encounterEndAt: new Date().toISOString(),
          encounterDuration: durationSec,
        }),
      });

      setStage(6);
      setTimeout(() => router.push("/checkout"), 2000);
    },
    [recorder, gemini, player, setConnected, userId, setStage, router, timeRemaining],
  );

  const handleTogglePause = useCallback(async () => {
    if (isPaused) {
      await player.resume();
      setPaused(false);
    } else {
      await player.suspend();
      setPaused(true);
    }
  }, [isPaused, player, setPaused]);

  // Push-to-Talk gate — pressing opens the mic, releasing closes it AND
  // tells Gemini the user turn is done so it responds immediately instead
  // of waiting on server VAD silence. isMuted doubles as "not currently
  // talking" state (false while the button is held).
  const pttActiveRef = useRef(false);
  const handleTalkStart = useCallback(() => {
    if (pttActiveRef.current) return;
    if (isPaused) return;
    pttActiveRef.current = true;
    recorder.setMuted(false);
    setMuted(false);
  }, [isPaused, recorder, setMuted]);

  const handleTalkEnd = useCallback(() => {
    if (!pttActiveRef.current) return;
    pttActiveRef.current = false;
    recorder.setMuted(true);
    setMuted(true);
    try { gemini.endAudioStream(); } catch {}
  }, [gemini, recorder, setMuted]);

  // Spacebar as PTT hotkey — only while connected, and only when not
  // typing in an input/textarea.
  useEffect(() => {
    if (connectionState !== "connected") return;
    const isTypingTarget = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
    };
    const onDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      if (isTypingTarget(e.target)) return;
      e.preventDefault();
      handleTalkStart();
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      if (isTypingTarget(e.target)) return;
      e.preventDefault();
      handleTalkEnd();
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [connectionState, handleTalkStart, handleTalkEnd]);

  // Suggestion picked — send the text to Gemini AND render it in the chat as
  // a finalized user bubble. Without the manual bubble, the text would only
  // exist in the model's context (it's not sent through STT so no transcript
  // event fires).
  const handleSuggestionPick = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      try {
        gemini.sendText(text);
        addTranscriptFragment("user", text, Date.now(), true);
      } catch {}
    },
    [gemini, addTranscriptFragment],
  );

  const handleLanguageSwitch = useCallback(
    (next: "id" | "en") => {
      setLocale(next);
      try {
        const announce = next === "en"
          ? "Please continue our conversation in English from now on."
          : "Silakan lanjutkan percakapan kita dalam Bahasa Indonesia mulai sekarang.";
        gemini.sendText(announce);
      } catch {}
    },
    [gemini, setLocale],
  );

  useEffect(() => {
    if (!hydrated) return;
    if (!userId) router.replace("/register");
  }, [hydrated, userId, router]);

  if (!hydrated || !userId) return null;

  const isActiveSession = connectionState === "connected";
  // Under PTT, isMuted===true means "not currently talking", which is the
  // resting state — don't render the red "muted" warning for it.
  const micActive = isActiveSession && !isMuted && !isPaused;
  const isReconnecting = connectionPhase === "reconnecting";
  const statusText = isReconnecting
    ? t("encounter.statusReconnecting")
    : isPaused
      ? t("encounter.statusPaused")
      : aiSpeaking
        ? t("encounter.statusSpeaking")
        : micActive
          ? t("encounter.statusListening")
          : t("encounter.ctrl.pttHint");

  if (demoStatus && !demoStatus.active) {
    return (
      <RouteGuard requiredStage={5}>
        <main className="relative h-screen w-full overflow-hidden bg-obsidian-950">
          <Background />
          <DemoPausedScreen
            reason={demoStatus.reason === "ok" ? null : demoStatus.reason}
            message={demoStatus.message}
            schedule={demoStatus.schedule}
          />
        </main>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard requiredStage={5}>
      <ErrorBoundary fallbackMessage={t("encounter.error")}>
        <main className="relative h-screen w-full overflow-hidden bg-obsidian-950">
          {connectionState !== "connected" && <Background />}

          {/* HERO COMPANION IMAGE — pinned LEFT, full height */}
          {finalImagePath && isActiveSession && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-0 top-0 bottom-0 z-10"
              style={{ width: "clamp(320px, 40vw, 560px)" }}
            >
              <div
                className="absolute inset-0 transition-[filter] duration-700"
                style={{ filter: skin.cssFilter }}
              >
                <Image
                  src={finalImagePath}
                  alt={t("assembly.alt")}
                  fill
                  sizes="40vw"
                  className="object-contain object-center"
                  priority
                />
              </div>
              <div
                className="absolute inset-y-0 right-0 w-40 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(5,8,14,0) 0%, rgba(5,8,14,0.9) 100%)",
                }}
              />
            </motion.div>
          )}

          {/* TOP CENTER TIMER */}
          {isActiveSession && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center"
            >
              <span className="font-display text-[10px] uppercase tracking-[0.35em] text-text-muted">
                {t("encounter.timerLabel")}
              </span>
              <div
                className="mt-1 rounded-2xl border border-cyan-accent/30 bg-obsidian-950/70 backdrop-blur-md px-5 py-2"
                style={{ boxShadow: "0 0 24px rgba(0,240,255,0.18)" }}
              >
                <span
                  className="font-display text-4xl tabular-nums text-cyan-accent"
                  style={{ textShadow: "0 0 16px rgba(0,240,255,0.5)" }}
                >
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <div className="mt-1.5 h-[2px] w-28 overflow-hidden rounded-full bg-obsidian-border">
                <div
                  className="h-full bg-gradient-to-r from-cyan-accent to-[#39FF14] transition-[width] duration-1000"
                  style={{
                    width: `${(timeRemaining / ENCOUNTER_DURATION_SECONDS) * 100}%`,
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* TOP RIGHT — language toggle */}
          {isActiveSession && (
            <div className="absolute top-6 right-6 z-30">
              <LanguageToggle
                onSwitch={handleLanguageSwitch}
                disabled={isReconnecting || isPaused}
              />
            </div>
          )}

          {/* RECONNECT BANNER */}
          <AnimatePresence>
            {isReconnecting && isActiveSession && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-28 left-1/2 -translate-x-1/2 z-30 rounded-full border border-[#F5A524]/40 bg-obsidian-950/85 backdrop-blur-md px-4 py-1.5"
                style={{ boxShadow: "0 0 18px rgba(245,165,36,0.25)" }}
              >
                <span className="font-display text-[11px] uppercase tracking-[0.28em] text-[#F5A524]">
                  {t("encounter.reconnect.banner")}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CHAT HISTORY — centered column between hero image (left) and
              suggestions panel (right). Both side panels use the SAME clamp
              so the chat stays symmetric. */}
          {isActiveSession && (
            <div
              className="absolute top-24 z-20 flex flex-col"
              style={{
                left: "clamp(340px, 42vw, 600px)",
                right: "clamp(340px, 42vw, 600px)",
                bottom: "240px",
              }}
            >
              <ChatStream entries={transcript} />
            </div>
          )}

          {/* CONVERSATION SUGGESTIONS — pinned RIGHT, full height matching
              the hero image on the left. Soft bleed edge (no heavy border)
              so it feels like part of the stage, not a floating widget. */}
          {isActiveSession && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 top-0 bottom-0 z-10"
              style={{ width: "clamp(320px, 40vw, 560px)" }}
            >
              <div
                className="absolute inset-y-0 left-0 w-24 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(270deg, rgba(5,8,14,0) 0%, rgba(5,8,14,0.9) 100%)",
                }}
              />
              <div
                className="relative h-full w-full"
                style={{ paddingTop: "96px", paddingBottom: "220px" }}
              >
                <ConversationSuggestions
                  hobbies={
                    Array.isArray(configSnapshot.hobbies)
                      ? (configSnapshot.hobbies as string[])
                      : []
                  }
                  onPick={handleSuggestionPick}
                  disabled={isReconnecting || isPaused}
                />
              </div>
            </motion.div>
          )}

          {/* ACTIONS OVERLAY (function call results) — moved to center-bottom
              so it doesn't collide with the right-side suggestions panel. */}
          {isActiveSession && toolEvents.length > 0 && (
            <div
              className="absolute left-1/2 -translate-x-1/2 z-20"
              style={{ bottom: "260px" }}
            >
              <CompanionActionsOverlay events={toolEvents} />
            </div>
          )}

          {/* BOTTOM DOCK */}
          {isActiveSession && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="absolute inset-x-0 bottom-6 z-30 flex flex-col items-center gap-3"
            >
              <motion.div
                key={statusText}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-full border border-cyan-accent/30 bg-obsidian-950/70 backdrop-blur-md px-3.5 py-1.5"
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isReconnecting
                      ? "bg-[#F5A524]"
                      : isPaused
                        ? "bg-[#F5A524]"
                        : aiSpeaking
                          ? "bg-cyan-accent"
                          : "bg-[#39FF14]"
                  }`}
                  style={{
                    boxShadow: `0 0 10px ${
                      isReconnecting || isPaused
                        ? "#F5A524"
                        : aiSpeaking
                          ? "#00F0FF"
                          : "#39FF14"
                    }`,
                  }}
                />
                <span className="font-display text-[11px] uppercase tracking-[0.3em] text-text-secondary">
                  {statusText}
                </span>
              </motion.div>

              <div className="flex items-center gap-3 rounded-full border border-glass-border bg-obsidian-950/60 backdrop-blur-md px-4 py-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                    micActive ? "bg-cyan-accent/20" : "bg-obsidian-border"
                  }`}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                    <path
                      d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"
                      fill={micActive ? "#00F0FF" : "#888"}
                    />
                    <path
                      d="M17.3 11c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z"
                      fill={micActive ? "#00F0FF" : "#888"}
                    />
                  </svg>
                </div>
                <UserWaveform
                  getLevel={recorder.getLevel}
                  isActive={micActive}
                  width={200}
                  height={40}
                  bars={22}
                />
              </div>

              <CallControls
                isPaused={isPaused}
                isTalking={!isMuted}
                onHangUp={() => handleEnd("user")}
                onTogglePause={handleTogglePause}
              />
            </motion.div>
          )}

          {/* IDLE / CONNECTING / ENDED overlays */}
          <AnimatePresence>
            {connectionState !== "connected" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 flex items-center justify-center px-6"
              >
                <div className="text-center max-w-md">
                  {connectionState === "idle" && (
                    <div className="space-y-5">
                      <p className="text-text-secondary text-base leading-relaxed">
                        {companionName.trim()
                          ? t("encounter.prompt", { name: companionName.trim() })
                          : t("encounter.prompt.fallback")}
                      </p>
                      <GlassButton size="lg" pulse onClick={handleStart}>
                        {companionName.trim()
                          ? t("encounter.begin", { name: companionName.trim() })
                          : t("encounter.begin.fallback")}
                      </GlassButton>
                      {error && (
                        <div className="mt-3 p-3 rounded-xl bg-danger/10 border border-danger/20">
                          <p className="text-sm text-danger">{error}</p>
                          <p className="text-xs text-text-muted mt-1">
                            {t("encounter.errorContext")}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {connectionState === "connecting" && (
                    <LoadingSpinner
                      text={
                        companionName.trim()
                          ? t("encounter.loading", { name: companionName.trim() })
                          : t("encounter.loading.fallback")
                      }
                    />
                  )}

                  {connectionState === "ended" && (
                    <div className="space-y-2">
                      <p className="text-text-secondary">
                        {endReason === "timer"
                          ? t("encounter.timeUp")
                          : t("encounter.complete")}
                      </p>
                      <p className="text-sm text-text-muted">
                        {t("encounter.redirecting")}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </ErrorBoundary>
    </RouteGuard>
  );
}

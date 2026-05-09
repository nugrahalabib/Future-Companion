"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useT } from "@/lib/i18n/useT";

/**
 * Public welcome page — the booth's "ceremony start" surface. One giant
 * cinematic button. Clicking it:
 *   1. POSTs /api/welcome/trigger
 *   2. Plays the active welcome audio clip
 *   3. The same trigger broadcasts an SSE event server-side that resets
 *      every 2970 page (except /survey/* and /admin/*) to "/"
 *   4. The same trigger fires Tuya: all lights blue, soft box 2 pink
 *
 * Operators are expected to mount this at welcompanion.agentbuff.id
 * via reverse proxy (port 2975 → 2970/welcome OR the raw path).
 */

type Phase = "idle" | "triggering" | "playing" | "done" | "error";

export default function WelcomePage() {
  const { t } = useT();
  const [phase, setPhase] = useState<Phase>("idle");
  const [audioName, setAudioName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Side-button: fires the same Tuya scene as checkout's "Paket telah saya
  // terima" — all lights → bright white, lampu tidur → off. Reuses
  // /api/checkout/celebrate so the scene definition stays in one place.
  type RevealPhase = "idle" | "firing" | "done" | "error";
  const [revealPhase, setRevealPhase] = useState<RevealPhase>("idle");
  const revealCooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerReveal = useCallback(async () => {
    if (revealPhase === "firing") return;
    setRevealPhase("firing");
    try {
      const res = await fetch("/api/checkout/celebrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (!res.ok || !data.ok) {
        setRevealPhase("error");
      } else {
        setRevealPhase("done");
      }
    } catch {
      setRevealPhase("error");
    } finally {
      if (revealCooldownRef.current) clearTimeout(revealCooldownRef.current);
      revealCooldownRef.current = setTimeout(() => setRevealPhase("idle"), 2500);
    }
  }, [revealPhase]);

  const triggerWelcome = useCallback(async () => {
    if (phase === "triggering" || phase === "playing") return;
    setErrorMsg(null);
    setPhase("triggering");

    try {
      const res = await fetch("/api/welcome/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const data = (await res.json()) as {
        ok: boolean;
        audio?: { audioUrl: string; name: string; durationSeconds: number };
        error?: string;
      };
      if (!data.ok || !data.audio?.audioUrl) {
        setPhase("error");
        setErrorMsg(
          data.error === "no_active_welcome_audio"
            ? t("welcome.error.noActive")
            : data.error ?? t("welcome.error.trigger"),
        );
        return;
      }
      setAudioName(data.audio.name);

      // Play the audio. We use a fresh <audio> element each time so the
      // browser's autoplay policy treats the click as a user gesture.
      const a = new Audio(data.audio.audioUrl);
      audioRef.current = a;
      setPhase("playing");
      a.onended = () => {
        setPhase("done");
        // After a 4s "done" pulse, drop back to idle so the next visitor
        // gets a fresh button.
        if (cooldownRef.current) clearTimeout(cooldownRef.current);
        cooldownRef.current = setTimeout(() => {
          setPhase("idle");
          setAudioName(null);
        }, 4000);
      };
      a.onerror = () => {
        setPhase("error");
        setErrorMsg(t("welcome.error.playback"));
      };
      try {
        await a.play();
      } catch (err) {
        setPhase("error");
        const detail = err instanceof Error ? err.message : "";
        setErrorMsg(detail ? `${t("welcome.error.playbackBlocked")} ${detail}` : t("welcome.error.playbackBlocked"));
      }
    } catch (err) {
      setPhase("error");
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  }, [phase]);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
      if (revealCooldownRef.current) clearTimeout(revealCooldownRef.current);
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {}
      }
    };
  }, []);

  const buttonLabel =
    phase === "triggering"
      ? t("welcome.button.preparing")
      : phase === "playing"
        ? `▶  ${t("welcome.button.playing")}`
        : phase === "done"
          ? t("welcome.button.done")
          : phase === "error"
            ? t("welcome.button.retry")
            : t("welcome.button.idle");

  const buttonDisabled = phase === "triggering" || phase === "playing";

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Ambient gradient backdrop, doesn't render on the actual lights but
          gives the screen a presence while the audio plays. */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0.4 }}
        animate={{
          opacity: phase === "playing" ? 0.85 : phase === "done" ? 0.6 : 0.4,
          background:
            phase === "playing"
              ? "radial-gradient(ellipse at center, rgba(0,180,255,0.4), rgba(255,0,180,0.15) 60%, transparent 80%)"
              : "radial-gradient(ellipse at center, rgba(0,240,255,0.2), transparent 70%)",
        }}
        transition={{ duration: 1.2 }}
      />

      {/* Top-left small round button — fires the SAME Tuya scene as checkout's
          "Paket telah saya terima": soft box 1 + 2 + wall strip → bright white,
          lampu tidur → off. Lives outside the centered column so it doesn't
          compete visually with the main welcome CTA. */}
      <motion.button
        type="button"
        onClick={triggerReveal}
        disabled={revealPhase === "firing"}
        whileTap={revealPhase === "firing" ? undefined : { scale: 0.92 }}
        aria-label="Bright white scene"
        title="Bright white scene"
        className={`absolute top-4 left-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-md transition-colors ${
          revealPhase === "firing"
            ? "border-cyan-accent/60 bg-cyan-accent/15 text-cyan-accent cursor-wait"
            : revealPhase === "done"
              ? "border-bio-green/60 bg-bio-green/15 text-bio-green cursor-pointer"
              : revealPhase === "error"
                ? "border-danger/60 bg-danger/15 text-danger cursor-pointer"
                : "border-cyan-accent/30 bg-obsidian/40 text-cyan-accent hover:bg-cyan-accent/15 cursor-pointer"
        }`}
        style={{
          boxShadow:
            revealPhase === "done"
              ? "0 0 18px rgba(57,255,20,0.45)"
              : revealPhase === "firing"
                ? "0 0 18px rgba(0,240,255,0.45)"
                : revealPhase === "error"
                  ? "0 0 14px rgba(255,80,80,0.35)"
                  : "0 0 12px rgba(0,240,255,0.18)",
        }}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
          <circle cx="12" cy="12" r="4" fill="currentColor" />
          <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none">
            <line x1="12" y1="2.5" x2="12" y2="5.5" />
            <line x1="12" y1="18.5" x2="12" y2="21.5" />
            <line x1="2.5" y1="12" x2="5.5" y2="12" />
            <line x1="18.5" y1="12" x2="21.5" y2="12" />
            <line x1="4.6" y1="4.6" x2="6.7" y2="6.7" />
            <line x1="17.3" y1="17.3" x2="19.4" y2="19.4" />
            <line x1="4.6" y1="19.4" x2="6.7" y2="17.3" />
            <line x1="17.3" y1="6.7" x2="19.4" y2="4.6" />
          </g>
        </svg>
      </motion.button>

      <div className="relative z-10 flex flex-col items-center gap-8 px-6">
        {/* Wordmark */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-1"
        >
          <p className="font-display text-[11px] uppercase tracking-[0.4em] text-cyan-accent/80">
            The Sovereign Companion · 2075
          </p>
          <h1 className="font-display text-2xl sm:text-3xl text-text-primary tracking-wide">
            {t("welcome.greeting")}
          </h1>
        </motion.div>

        {/* The big button */}
        <motion.button
          type="button"
          onClick={triggerWelcome}
          disabled={buttonDisabled}
          whileTap={buttonDisabled ? undefined : { scale: 0.96 }}
          className={`relative font-display tracking-[0.3em] uppercase ${
            phase === "playing"
              ? "text-bio-green"
              : phase === "error"
                ? "text-danger"
                : "text-cyan-accent"
          } text-2xl sm:text-3xl px-12 sm:px-20 py-8 sm:py-10 rounded-full border ${
            buttonDisabled
              ? "border-bio-green/45 bg-bio-green/5 cursor-not-allowed"
              : phase === "error"
                ? "border-danger/50 bg-danger/5 hover:bg-danger/10 cursor-pointer"
                : "border-cyan-accent/45 bg-cyan-accent/5 hover:bg-cyan-accent/15 cursor-pointer"
          } backdrop-blur-md transition-colors shadow-[0_0_60px_rgba(0,240,255,0.25)]`}
          style={{
            boxShadow:
              phase === "playing"
                ? "0 0 80px rgba(57,255,20,0.45)"
                : phase === "error"
                  ? "0 0 60px rgba(255,80,80,0.3)"
                  : "0 0 60px rgba(0,240,255,0.25)",
          }}
        >
          {/* Pulse ring while playing */}
          {phase === "playing" && (
            <motion.span
              className="absolute inset-0 rounded-full border-2 border-bio-green/60 pointer-events-none"
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.6, 0.1, 0.6],
              }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          {buttonLabel}
        </motion.button>

        {/* Status line */}
        <AnimatePresence mode="wait">
          {audioName && phase === "playing" && (
            <motion.p
              key="now-playing"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-[12px] font-display uppercase tracking-widest text-text-muted"
            >
              ♪  {audioName}
            </motion.p>
          )}
          {phase === "done" && (
            <motion.p
              key="done"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[12px] font-display uppercase tracking-widest text-bio-green/80"
            >
              {t("welcome.done")}
            </motion.p>
          )}
          {phase === "error" && errorMsg && (
            <motion.p
              key="err"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[12px] font-display uppercase tracking-widest text-danger max-w-[480px] text-center"
            >
              {errorMsg}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

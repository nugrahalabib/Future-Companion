"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [phase, setPhase] = useState<Phase>("idle");
  const [audioName, setAudioName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
            ? "No welcome audio is set. Ask the booth admin to activate one in /admin/welcome."
            : data.error ?? "Trigger failed.",
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
        setErrorMsg("Audio playback failed.");
      };
      try {
        await a.play();
      } catch (err) {
        setPhase("error");
        setErrorMsg(
          err instanceof Error ? `Playback blocked: ${err.message}` : "Playback blocked.",
        );
      }
    } catch (err) {
      setPhase("error");
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  }, [phase]);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {}
      }
    };
  }, []);

  const buttonLabel =
    phase === "triggering"
      ? "Mempersiapkan…"
      : phase === "playing"
        ? "▶  Sedang Memutar"
        : phase === "done"
          ? "Selesai"
          : phase === "error"
            ? "Coba Lagi"
            : "WELCOME";

  const buttonDisabled = phase === "triggering" || phase === "playing";

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Ambient gradient backdrop — doesn't render on the actual lights but
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

      <div className="relative z-10 flex flex-col items-center gap-8 px-6">
        {/* Wordmark */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-1"
        >
          <p className="font-display text-[11px] uppercase tracking-[0.4em] text-cyan-accent/80">
            The Sovereign Companion · 2076
          </p>
          <h1 className="font-display text-2xl sm:text-3xl text-text-primary tracking-wide">
            Selamat Datang
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
              Selamat datang.
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

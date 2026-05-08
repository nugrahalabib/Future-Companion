"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassPanel from "@/components/ui/GlassPanel";
import GlassButton from "@/components/ui/GlassButton";
import { adminFetch } from "@/lib/adminFetch";
import { useT } from "@/lib/i18n/useT";
import { TTS_VOICES, type TtsVoice } from "@/lib/tts/voices";
import { TTS_LANGUAGES } from "@/lib/tts/languages";
import { AUDIO_TAGS, STYLE_PRESETS } from "@/lib/tts/audioTags";

const MODELS = [
  { id: "gemini-2.5-flash-preview-tts",  label: "Flash Preview (2.5)",  hint: "Fast, recommended for most cases" },
  { id: "gemini-3.1-flash-tts-preview",  label: "Flash Preview (3.1)",  hint: "Latest fast model" },
  { id: "gemini-2.5-pro-preview-tts",    label: "Pro Preview (2.5)",    hint: "Higher quality, slower" },
] as const;

type Mode = "single" | "multi";

interface HistoryItem {
  id: string;
  text: string;
  mode: Mode;
  model: string;
  voiceName?: string;
  speakers?: { speaker: string; voiceName: string }[];
  audioDataUrl: string;
  durationSeconds: number;
  generatedAt: number;
}

const HISTORY_LIMIT = 8;

function formatVoiceLabel(v: TtsVoice): string {
  const vibeIcon = v.vibe === "feminine" ? "♀" : v.vibe === "masculine" ? "♂" : "◇";
  return `${vibeIcon}  ${v.name} — ${v.tone}`;
}

export default function TtsPanel() {
  const { t } = useT();

  // ---------- form state ----------
  const [model, setModel] = useState<string>(MODELS[0].id);
  const [mode, setMode] = useState<Mode>("single");
  const [text, setText] = useState("");
  const [voiceName, setVoiceName] = useState("Kore");
  const [languageCode, setLanguageCode] = useState("id-ID");
  const [speakers, setSpeakers] = useState<{ speaker: string; voiceName: string }[]>([
    { speaker: "Joe",  voiceName: "Kore" },
    { speaker: "Jane", voiceName: "Aoede" },
  ]);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Voices grouped by vibe for nicer dropdown
  const groupedVoices = useMemo(() => {
    const fem: TtsVoice[] = [];
    const masc: TtsVoice[] = [];
    const neu: TtsVoice[] = [];
    for (const v of TTS_VOICES) {
      if (v.vibe === "feminine") fem.push(v);
      else if (v.vibe === "masculine") masc.push(v);
      else neu.push(v);
    }
    return { feminine: fem, masculine: masc, neutral: neu };
  }, []);

  const insertAtCursor = useCallback((snippet: string, prepend = false) => {
    const ta = textareaRef.current;
    if (!ta) {
      setText((prev) => (prepend ? snippet + prev : prev + snippet));
      return;
    }
    if (prepend) {
      setText((prev) => snippet + prev);
      // restore caret to end of injected snippet
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(snippet.length, snippet.length);
      });
      return;
    }
    const start = ta.selectionStart ?? text.length;
    const end = ta.selectionEnd ?? text.length;
    const next = text.slice(0, start) + snippet + text.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + snippet.length;
      ta.setSelectionRange(pos, pos);
    });
  }, [text]);

  const handleGenerate = async () => {
    if (busy) return;
    setError(null);
    if (!text.trim()) {
      setError(t("admin.tts.error.emptyText"));
      return;
    }
    if (mode === "multi") {
      for (const s of speakers) {
        if (!s.speaker.trim()) {
          setError(t("admin.tts.error.emptySpeaker"));
          return;
        }
      }
    }
    setBusy(true);
    try {
      const payload =
        mode === "single"
          ? { mode, model, text, voiceName, languageCode }
          : { mode, model, text, speakers };
      const res = await adminFetch("/api/admin/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        ok: boolean;
        audioDataUrl?: string;
        durationSeconds?: number;
        error?: string;
      };
      if (!data.ok || !data.audioDataUrl) {
        setError(data.error ?? t("admin.tts.error.generic"));
        return;
      }
      const item: HistoryItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        text,
        mode,
        model,
        voiceName: mode === "single" ? voiceName : undefined,
        speakers: mode === "multi" ? speakers : undefined,
        audioDataUrl: data.audioDataUrl,
        durationSeconds: data.durationSeconds ?? 0,
        generatedAt: Date.now(),
      };
      setHistory((prev) => [item, ...prev].slice(0, HISTORY_LIMIT));
      setActiveAudioId(item.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = (item: HistoryItem) => {
    const a = document.createElement("a");
    a.href = item.audioDataUrl;
    const fname = `tts-${item.mode}-${new Date(item.generatedAt).toISOString().replace(/[:.]/g, "-")}.wav`;
    a.download = fname;
    a.click();
  };

  // Track which history items have already been pushed to the welcome-
  // audio library this session so the "Save" button can flip to a
  // disabled "Saved ✓" state.
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  const handleSaveToLibrary = async (item: HistoryItem) => {
    if (savingIds.has(item.id) || savedIds.has(item.id)) return;
    const proposed = item.text.trim().slice(0, 60) || `Welcome ${new Date(item.generatedAt).toLocaleTimeString()}`;
    const name = window.prompt(t("admin.tts.history.saveAsPrompt"), proposed)?.trim();
    if (!name) return;
    setSavingIds((prev) => new Set(prev).add(item.id));
    try {
      const res = await adminFetch("/api/admin/welcome-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          transcript: item.text,
          mode: item.mode,
          model: item.model,
          voiceName: item.voiceName,
          speakers: item.speakers,
          audioDataUrl: item.audioDataUrl,
          durationSeconds: item.durationSeconds,
        }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setError(data.error ?? t("admin.tts.error.saveLibrary"));
        return;
      }
      setSavedIds((prev) => new Set(prev).add(item.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
    if (activeAudioId === id) setActiveAudioId(null);
  };

  // Auto-scroll active audio into view
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (activeAudioRef.current) {
      activeAudioRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeAudioId]);

  return (
    <div className="space-y-5">
      {/* Header / actions */}
      <GlassPanel variant="elevated" className="p-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-lg font-bold text-text-primary">
            {t("admin.tts.heading")}
          </h2>
          <p className="text-[12px] text-text-muted mt-0.5 max-w-[640px]">
            {t("admin.tts.subheading")}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {error && (
            <span className="text-[11px] text-danger font-display uppercase tracking-widest max-w-[420px] truncate">
              {error}
            </span>
          )}
          <GlassButton onClick={handleGenerate} disabled={busy} size="sm">
            {busy ? t("admin.tts.generating") : t("admin.tts.generate")}
          </GlassButton>
        </div>
      </GlassPanel>

      {/* Model + mode controls */}
      <GlassPanel variant="elevated" className="p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Model picker */}
          <div className="space-y-1.5">
            <label className="font-display text-[10px] uppercase tracking-widest text-text-muted">
              {t("admin.tts.field.model")}
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-obsidian-surface border border-glass-border rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-cyan-accent/40"
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} — {m.hint}
                </option>
              ))}
            </select>
          </div>

          {/* Mode toggle */}
          <div className="space-y-1.5">
            <label className="font-display text-[10px] uppercase tracking-widest text-text-muted">
              {t("admin.tts.field.mode")}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("single")}
                className={`flex-1 h-10 rounded-lg border font-display text-[12px] uppercase tracking-widest transition-colors cursor-pointer ${
                  mode === "single"
                    ? "border-cyan-accent/50 bg-cyan-accent/10 text-cyan-accent"
                    : "border-glass-border bg-obsidian-surface text-text-muted hover:text-text-secondary"
                }`}
              >
                {t("admin.tts.mode.single")}
              </button>
              <button
                type="button"
                onClick={() => setMode("multi")}
                className={`flex-1 h-10 rounded-lg border font-display text-[12px] uppercase tracking-widest transition-colors cursor-pointer ${
                  mode === "multi"
                    ? "border-cyan-accent/50 bg-cyan-accent/10 text-cyan-accent"
                    : "border-glass-border bg-obsidian-surface text-text-muted hover:text-text-secondary"
                }`}
              >
                {t("admin.tts.mode.multi")}
              </button>
            </div>
          </div>
        </div>

        {/* Single-mode voice + language */}
        {mode === "single" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-display text-[10px] uppercase tracking-widest text-text-muted">
                {t("admin.tts.field.voice")}
              </label>
              <select
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                className="w-full bg-obsidian-surface border border-glass-border rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-cyan-accent/40"
              >
                <optgroup label={t("admin.tts.voiceGroup.feminine")}>
                  {groupedVoices.feminine.map((v) => (
                    <option key={v.name} value={v.name}>{formatVoiceLabel(v)}</option>
                  ))}
                </optgroup>
                <optgroup label={t("admin.tts.voiceGroup.masculine")}>
                  {groupedVoices.masculine.map((v) => (
                    <option key={v.name} value={v.name}>{formatVoiceLabel(v)}</option>
                  ))}
                </optgroup>
                <optgroup label={t("admin.tts.voiceGroup.neutral")}>
                  {groupedVoices.neutral.map((v) => (
                    <option key={v.name} value={v.name}>{formatVoiceLabel(v)}</option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-display text-[10px] uppercase tracking-widest text-text-muted">
                {t("admin.tts.field.language")}
              </label>
              <select
                value={languageCode}
                onChange={(e) => setLanguageCode(e.target.value)}
                className="w-full bg-obsidian-surface border border-glass-border rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-cyan-accent/40"
              >
                <optgroup label={t("admin.tts.languageGroup.prominent")}>
                  {TTS_LANGUAGES.filter((l) => l.prominent).map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.englishName}{l.nativeName ? ` (${l.nativeName})` : ""} — {l.code}
                    </option>
                  ))}
                </optgroup>
                <optgroup label={t("admin.tts.languageGroup.others")}>
                  {TTS_LANGUAGES.filter((l) => !l.prominent).map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.englishName}{l.nativeName ? ` (${l.nativeName})` : ""} — {l.code}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>
        )}

        {/* Multi-mode speakers */}
        {mode === "multi" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {speakers.map((s, i) => (
              <div key={i} className="rounded-xl border border-glass-border bg-glass-bg/40 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-display uppercase tracking-widest text-cyan-accent">
                    {t("admin.tts.field.speaker")} {i + 1}
                  </span>
                </div>
                <input
                  type="text"
                  value={s.speaker}
                  maxLength={40}
                  onChange={(e) => {
                    const next = [...speakers];
                    next[i] = { ...next[i], speaker: e.target.value };
                    setSpeakers(next);
                  }}
                  placeholder={i === 0 ? "Joe" : "Jane"}
                  className="w-full bg-obsidian-surface border border-glass-border rounded-lg px-3 py-2 text-[13px] font-mono text-text-primary placeholder-text-muted/60 focus:outline-none focus:border-cyan-accent/40"
                />
                <select
                  value={s.voiceName}
                  onChange={(e) => {
                    const next = [...speakers];
                    next[i] = { ...next[i], voiceName: e.target.value };
                    setSpeakers(next);
                  }}
                  className="w-full bg-obsidian-surface border border-glass-border rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-cyan-accent/40"
                >
                  {TTS_VOICES.map((v) => (
                    <option key={v.name} value={v.name}>{formatVoiceLabel(v)}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </GlassPanel>

      {/* Style preset chips */}
      <GlassPanel variant="elevated" className="p-5 space-y-3">
        <div>
          <h3 className="font-display text-base font-semibold text-text-primary">
            {t("admin.tts.styles.heading")}
          </h3>
          <p className="text-[12px] text-text-muted mt-0.5 max-w-[640px]">
            {t("admin.tts.styles.subheading")}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STYLE_PRESETS.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => insertAtCursor(s.prefix, true)}
              className="text-[11px] font-display uppercase tracking-widest text-cyan-accent border border-cyan-accent/35 bg-cyan-accent/10 hover:bg-cyan-accent/15 rounded-full px-2.5 py-1 transition-colors cursor-pointer"
            >
              {s.label}
            </button>
          ))}
        </div>
      </GlassPanel>

      {/* Audio tags */}
      <GlassPanel variant="elevated" className="p-5 space-y-3">
        <div>
          <h3 className="font-display text-base font-semibold text-text-primary">
            {t("admin.tts.tags.heading")}
          </h3>
          <p className="text-[12px] text-text-muted mt-0.5 max-w-[640px]">
            {t("admin.tts.tags.subheading")}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {AUDIO_TAGS.map((tag) => (
            <button
              key={tag.tag}
              type="button"
              onClick={() => insertAtCursor(tag.tag)}
              title={tag.tag}
              className="text-[11px] font-display uppercase tracking-widest text-bio-green border border-bio-green/35 bg-bio-green/5 hover:bg-bio-green/15 rounded-full px-2.5 py-1 transition-colors cursor-pointer"
            >
              {tag.label}
            </button>
          ))}
        </div>
      </GlassPanel>

      {/* Transcript textarea */}
      <GlassPanel variant="elevated" className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h3 className="font-display text-base font-semibold text-text-primary">
              {t("admin.tts.transcript.heading")}
            </h3>
            <p className="text-[12px] text-text-muted mt-0.5">
              {mode === "multi"
                ? t("admin.tts.transcript.helpMulti")
                : t("admin.tts.transcript.helpSingle")}
            </p>
          </div>
          <span className="text-[11px] text-text-muted font-mono">
            {text.length} chars
          </span>
        </div>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            mode === "multi"
              ? `Joe: Hi Jane, ready for the demo?\nJane: [excitedly] Absolutely!`
              : `Say cheerfully: Selamat datang di Sovereign Companion!`
          }
          rows={10}
          maxLength={8000}
          className="w-full bg-obsidian-surface border border-glass-border rounded-lg px-3 py-2 text-[13px] font-mono text-text-primary placeholder-text-muted/60 focus:outline-none focus:border-cyan-accent/40 transition-colors resize-y leading-relaxed"
        />
      </GlassPanel>

      {/* History */}
      <GlassPanel variant="elevated" className="p-5 space-y-3">
        <div>
          <h3 className="font-display text-base font-semibold text-text-primary">
            {t("admin.tts.history.heading")}
          </h3>
          <p className="text-[12px] text-text-muted mt-0.5">
            {history.length === 0
              ? t("admin.tts.history.empty")
              : t("admin.tts.history.subheading", { count: history.length, max: HISTORY_LIMIT })}
          </p>
        </div>
        <AnimatePresence initial={false}>
          {history.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className={`rounded-xl border ${
                activeAudioId === item.id ? "border-bio-green/40" : "border-glass-border"
              } bg-glass-bg/40 p-3 space-y-2`}
            >
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-mono text-text-secondary truncate">
                    {item.text.slice(0, 140)}{item.text.length > 140 ? "…" : ""}
                  </p>
                  <p className="text-[10px] text-text-muted/80 mt-0.5">
                    {item.mode === "single"
                      ? `${item.voiceName}`
                      : `${item.speakers?.map((s) => `${s.speaker}/${s.voiceName}`).join(" + ")}`}
                    {" · "}
                    {item.model}
                    {" · "}
                    {item.durationSeconds.toFixed(2)}s
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleSaveToLibrary(item)}
                    disabled={savingIds.has(item.id) || savedIds.has(item.id)}
                    className={`text-[10px] font-display uppercase tracking-widest border rounded-full px-2 py-0.5 cursor-pointer transition-colors ${
                      savedIds.has(item.id)
                        ? "border-bio-green/45 bg-bio-green/15 text-bio-green cursor-default"
                        : savingIds.has(item.id)
                          ? "border-glass-border bg-glass-bg/30 text-text-muted cursor-wait"
                          : "border-bio-green/40 bg-bio-green/5 text-bio-green hover:bg-bio-green/15"
                    }`}
                  >
                    {savedIds.has(item.id)
                      ? t("admin.tts.history.savedToLibrary")
                      : savingIds.has(item.id)
                        ? t("admin.tts.history.saving")
                        : t("admin.tts.history.saveToLibrary")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(item)}
                    className="text-[10px] font-display uppercase tracking-widest text-cyan-accent border border-cyan-accent/35 bg-cyan-accent/10 hover:bg-cyan-accent/15 rounded-full px-2 py-0.5 cursor-pointer"
                  >
                    {t("admin.tts.history.download")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteHistoryItem(item.id)}
                    className="text-[10px] font-display uppercase tracking-widest text-danger border border-danger/35 bg-danger/5 hover:bg-danger/15 rounded-full px-2 py-0.5 cursor-pointer"
                  >
                    {t("admin.tts.history.delete")}
                  </button>
                </div>
              </div>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <audio
                ref={activeAudioId === item.id ? activeAudioRef : undefined}
                src={item.audioDataUrl}
                controls
                autoPlay={activeAudioId === item.id}
                className="w-full"
                style={{ filter: "invert(0.9) hue-rotate(180deg)" }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </GlassPanel>
    </div>
  );
}

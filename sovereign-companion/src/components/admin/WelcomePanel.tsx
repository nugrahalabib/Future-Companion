"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassPanel from "@/components/ui/GlassPanel";
import GlassButton from "@/components/ui/GlassButton";
import { adminFetch } from "@/lib/adminFetch";
import { useT } from "@/lib/i18n/useT";

interface WelcomeAudioRow {
  id: string;
  name: string;
  transcript: string;
  mode: string;
  model: string;
  voiceName: string | null;
  speakers: string | null;
  languageCode: string | null;
  durationSeconds: number;
  isActive: boolean;
  createdAt: string;
}

export default function WelcomePanel() {
  const { t } = useT();
  const [items, setItems] = useState<WelcomeAudioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch("/api/admin/welcome-audio");
      const data = (await res.json()) as { ok: boolean; items?: WelcomeAudioRow[]; error?: string };
      if (!data.ok) {
        setError(data.error ?? t("admin.welcome.error.load"));
      } else {
        setItems(data.items ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleActivate = async (id: string) => {
    if (busyId) return;
    setBusyId(id);
    setError(null);
    setInfo(null);
    try {
      const res = await adminFetch(`/api/admin/welcome-audio/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "activate" }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setError(data.error ?? t("admin.welcome.error.activate"));
      } else {
        setInfo(t("admin.welcome.info.activated"));
        await load();
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (busyId) return;
    if (!confirm(t("admin.welcome.confirm.delete"))) return;
    setBusyId(id);
    setError(null);
    try {
      const res = await adminFetch(`/api/admin/welcome-audio/${id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setError(data.error ?? t("admin.welcome.error.delete"));
      } else {
        await load();
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleTestTrigger = async () => {
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/welcome/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = (await res.json()) as {
        ok: boolean;
        broadcastRecipients?: number;
        lighting?: {
          ok: boolean;
          steps?: { label: string; ok: boolean; message?: string }[];
        };
        error?: string;
      };
      if (!data.ok) {
        setError(data.error ?? t("admin.welcome.error.trigger"));
      } else {
        const stepLine = (data.lighting?.steps ?? [])
          .map((s) => `${s.ok ? "✓" : "✗"} ${s.label}${!s.ok && s.message ? ` (${s.message})` : ""}`)
          .join(" · ");
        const lightingInfo = data.lighting?.ok
          ? `${t("admin.welcome.info.triggered.lightingOk")} ${stepLine}`
          : `${t("admin.welcome.info.triggered.lightingPartial")} ${stepLine}`;
        setInfo(
          `${t("admin.welcome.info.triggered.broadcast", { count: data.broadcastRecipients ?? 0 })} · ${lightingInfo}`,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  if (loading) {
    return <div className="text-text-muted text-sm">{t("admin.welcome.loading")}</div>;
  }

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <GlassPanel variant="elevated" className="p-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-lg font-bold text-text-primary">
            {t("admin.welcome.heading")}
          </h2>
          <p className="text-[12px] text-text-muted mt-0.5 max-w-[680px]">
            {t("admin.welcome.subheading")}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {info && (
            <span className="text-[11px] text-bio-green font-display uppercase tracking-widest">
              {info}
            </span>
          )}
          {error && (
            <span className="text-[11px] text-danger font-display uppercase tracking-widest max-w-[420px] truncate">
              {error}
            </span>
          )}
          <GlassButton size="sm" variant="secondary" onClick={handleTestTrigger}>
            {t("admin.welcome.testTrigger")}
          </GlassButton>
        </div>
      </GlassPanel>

      {/* Empty state */}
      {items.length === 0 && (
        <GlassPanel variant="inset" className="p-6 text-center space-y-2">
          <p className="text-text-secondary text-sm">{t("admin.welcome.empty.title")}</p>
          <p className="text-text-muted text-[12px]">{t("admin.welcome.empty.body")}</p>
        </GlassPanel>
      )}

      {/* Library */}
      <AnimatePresence initial={false}>
        {items.map((it) => (
          <motion.div
            key={it.id}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
          >
            <GlassPanel
              variant="elevated"
              className={`p-5 space-y-3 ${
                it.isActive ? "border border-bio-green/45 ring-1 ring-bio-green/20" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-[240px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display text-base font-semibold text-text-primary">
                      {it.name}
                    </h3>
                    {it.isActive && (
                      <span className="text-[10px] font-display uppercase tracking-widest text-bio-green border border-bio-green/45 bg-bio-green/10 rounded-full px-2 py-0.5">
                        {t("admin.welcome.activePill")}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-text-muted/80 mt-1 max-w-[640px] line-clamp-2">
                    {it.transcript || `(${t("admin.welcome.noTranscript")})`}
                  </p>
                  <p className="text-[10px] text-text-muted/70 mt-1 font-mono">
                    {it.mode === "single" ? it.voiceName : it.speakers}
                    {" · "}
                    {it.model}
                    {" · "}
                    {it.durationSeconds.toFixed(2)}s
                    {it.languageCode ? ` · ${it.languageCode}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {!it.isActive && (
                    <button
                      type="button"
                      onClick={() => handleActivate(it.id)}
                      disabled={busyId === it.id}
                      className="text-[11px] font-display uppercase tracking-widest text-bio-green border border-bio-green/40 bg-bio-green/5 hover:bg-bio-green/15 rounded-lg px-3 py-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {t("admin.welcome.setActive")}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(it.id)}
                    disabled={busyId === it.id}
                    className="text-[11px] font-display uppercase tracking-widest text-danger border border-danger/35 bg-danger/5 hover:bg-danger/15 rounded-lg px-3 py-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {t("admin.welcome.delete")}
                  </button>
                </div>
              </div>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <audio
                src={`/api/welcome-audio/${it.id}/audio`}
                controls
                preload="none"
                className="w-full"
                style={{ filter: "invert(0.9) hue-rotate(180deg)" }}
              />
            </GlassPanel>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

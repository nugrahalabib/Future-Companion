"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import GlassPanel from "@/components/ui/GlassPanel";
import { useT } from "@/lib/i18n/useT";

interface Snapshot {
  demoEnabled: boolean;
  pausedMessage: string;
  scheduleEnabled: boolean;
  activeFromHour: number;
  activeToHour: number;
  updatedAt: string;
  updatedBy: string;
}

interface Status {
  active: boolean;
  reason: "ok" | "manual_pause" | "outside_schedule";
  message: string;
  schedule: {
    enabled: boolean;
    activeFromHour: number;
    activeToHour: number;
  };
}

const PW_KEY = "sovereign-admin-pw";

function getPassword(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(PW_KEY) || "";
}

export default function AdminSettingsPage() {
  const { t, locale } = useT();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", {
        headers: { "x-admin-password": getPassword() },
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(res.status === 401 ? "unauthorized" : "fetch_failed");
      }
      const json = await res.json();
      setSnapshot(json.snapshot);
      setStatus(json.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown_error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const save = async (patch: Partial<Snapshot>) => {
    if (!snapshot) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": getPassword(),
        },
        body: JSON.stringify({ ...patch, updatedBy: "admin" }),
      });
      if (!res.ok) {
        throw new Error(res.status === 401 ? "unauthorized" : "save_failed");
      }
      const json = await res.json();
      setSnapshot(json.snapshot);
      setStatus(json.status);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown_error");
    } finally {
      setSaving(false);
    }
  };

  const dateLocale = locale === "id" ? "id-ID" : "en-US";
  const updatedAtLabel = useMemo(() => {
    if (!snapshot?.updatedAt) return "";
    try {
      return new Date(snapshot.updatedAt).toLocaleString(dateLocale);
    } catch {
      return snapshot.updatedAt;
    }
  }, [snapshot?.updatedAt, dateLocale]);

  if (loading) {
    return (
      <div className="p-8 text-sm text-text-muted">
        {t("admin.settings.loading")}
      </div>
    );
  }

  if (error === "unauthorized") {
    return (
      <GlassPanel variant="elevated" className="p-6 border border-danger/40">
        <p className="text-sm text-danger font-display">{t("admin.settings.unauthorized")}</p>
      </GlassPanel>
    );
  }

  if (!snapshot || !status) {
    return (
      <GlassPanel variant="elevated" className="p-6 border border-danger/40">
        <p className="text-sm text-danger">{t("admin.settings.loadError")}</p>
        <button
          onClick={fetchSettings}
          className="mt-3 px-3 py-1.5 rounded-lg text-xs font-display uppercase tracking-widest border border-glass-border hover:text-cyan-accent hover:border-cyan-accent/40 transition-colors cursor-pointer"
        >
          {t("admin.settings.retry")}
        </button>
      </GlassPanel>
    );
  }

  const statusTone = status.active
    ? "text-bio-green border-bio-green/40 bg-bio-green/10"
    : "text-danger border-danger/40 bg-danger/10";

  const reasonLabel = status.active
    ? t("admin.settings.status.active")
    : status.reason === "manual_pause"
      ? t("admin.settings.status.pausedManual")
      : t("admin.settings.status.pausedSchedule");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-semibold text-text-primary">
          {t("admin.settings.title")}
        </h2>
        <p className="text-xs text-text-muted mt-1 max-w-2xl">
          {t("admin.settings.subtitle")}
        </p>
      </div>

      <GlassPanel variant="elevated" className={`p-6 border ${statusTone}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-display uppercase tracking-widest opacity-80">
              {t("admin.settings.status.label")}
            </p>
            <p className="font-display text-2xl font-bold mt-1">{reasonLabel}</p>
            <p className="text-xs text-text-muted mt-2">
              {t("admin.settings.lastUpdated", { at: updatedAtLabel || "—" })}
            </p>
          </div>
          <div className={`text-[10px] font-display uppercase tracking-widest px-3 py-1.5 rounded-full border ${status.active ? "border-bio-green/40" : "border-danger/40"}`}>
            {status.active ? t("admin.common.on") : t("admin.common.off")}
          </div>
        </div>
      </GlassPanel>

      <GlassPanel variant="elevated" className="p-6 space-y-4">
        <div>
          <h3 className="font-display text-sm font-semibold text-text-primary">
            {t("admin.settings.killswitch.title")}
          </h3>
          <p className="text-xs text-text-muted mt-1">
            {t("admin.settings.killswitch.hint")}
          </p>
        </div>
        <button
          disabled={saving}
          onClick={() => save({ demoEnabled: !snapshot.demoEnabled })}
          className={`w-full flex items-center justify-between px-4 py-4 rounded-xl border text-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait ${
            snapshot.demoEnabled
              ? "bg-bio-green/15 text-bio-green border-bio-green/40"
              : "bg-danger/15 text-danger border-danger/40"
          }`}
        >
          <span className="font-display font-semibold">
            {snapshot.demoEnabled
              ? t("admin.settings.killswitch.on")
              : t("admin.settings.killswitch.off")}
          </span>
          <span className="text-[10px] font-display uppercase tracking-widest">
            {snapshot.demoEnabled ? t("admin.common.on") : t("admin.common.off")}
          </span>
        </button>
      </GlassPanel>

      <GlassPanel variant="elevated" className="p-6 space-y-4">
        <div>
          <h3 className="font-display text-sm font-semibold text-text-primary">
            {t("admin.settings.schedule.title")}
          </h3>
          <p className="text-xs text-text-muted mt-1">
            {t("admin.settings.schedule.hint")}
          </p>
        </div>
        <button
          disabled={saving}
          onClick={() => save({ scheduleEnabled: !snapshot.scheduleEnabled })}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait ${
            snapshot.scheduleEnabled
              ? "bg-cyan-accent/15 text-cyan-accent border-cyan-accent/40"
              : "glass text-text-muted border-glass-border hover:text-text-primary"
          }`}
        >
          <span>{t("admin.settings.schedule.toggle")}</span>
          <span className="text-[10px] font-display uppercase tracking-widest">
            {snapshot.scheduleEnabled ? t("admin.common.on") : t("admin.common.off")}
          </span>
        </button>
        <div className={`grid grid-cols-2 gap-3 ${snapshot.scheduleEnabled ? "" : "opacity-40 pointer-events-none"}`}>
          <HourField
            label={t("admin.settings.schedule.from")}
            value={snapshot.activeFromHour}
            onChange={(v) => save({ activeFromHour: v })}
            disabled={saving}
          />
          <HourField
            label={t("admin.settings.schedule.to")}
            value={snapshot.activeToHour}
            onChange={(v) => save({ activeToHour: v })}
            disabled={saving}
          />
        </div>
        <p className="text-[11px] text-text-muted">
          {t("admin.settings.schedule.note")}
        </p>
      </GlassPanel>

      <GlassPanel variant="elevated" className="p-6 space-y-3">
        <div>
          <h3 className="font-display text-sm font-semibold text-text-primary">
            {t("admin.settings.message.title")}
          </h3>
          <p className="text-xs text-text-muted mt-1">
            {t("admin.settings.message.hint")}
          </p>
        </div>
        <PausedMessageEditor
          value={snapshot.pausedMessage}
          disabled={saving}
          onSave={(v) => save({ pausedMessage: v })}
          t={t}
        />
      </GlassPanel>

      {saved && (
        <div className="text-xs font-display uppercase tracking-widest text-bio-green">
          {t("admin.settings.saved")}
        </div>
      )}
      {error && error !== "unauthorized" && (
        <div className="text-xs text-danger">{t("admin.settings.saveError")}</div>
      )}
    </div>
  );
}

function HourField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const [local, setLocal] = useState(String(value));
  useEffect(() => setLocal(String(value)), [value]);
  return (
    <label className="block">
      <span className="text-[10px] font-display uppercase tracking-widest text-text-muted">
        {label}
      </span>
      <select
        disabled={disabled}
        value={local}
        onChange={(e) => {
          setLocal(e.target.value);
          onChange(Number(e.target.value));
        }}
        className="mt-1 w-full bg-obsidian-surface border border-glass-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-cyan-accent/40"
      >
        {Array.from({ length: 24 }, (_, h) => (
          <option key={h} value={h}>
            {String(h).padStart(2, "0")}:00
          </option>
        ))}
      </select>
    </label>
  );
}

function PausedMessageEditor({
  value,
  disabled,
  onSave,
  t,
}: {
  value: string;
  disabled?: boolean;
  onSave: (v: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const dirty = draft !== value;
  return (
    <div className="space-y-2">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value.slice(0, 500))}
        placeholder={t("admin.settings.message.placeholder")}
        rows={3}
        className="w-full bg-obsidian-surface border border-glass-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-cyan-accent/40"
      />
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-display uppercase tracking-widest text-text-muted">
          {draft.length}/500
        </span>
        <button
          disabled={disabled || !dirty}
          onClick={() => onSave(draft)}
          className="px-3 py-1.5 rounded-lg text-xs font-display uppercase tracking-widest border border-cyan-accent/40 text-cyan-accent hover:bg-cyan-accent/15 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t("admin.settings.message.save")}
        </button>
      </div>
    </div>
  );
}

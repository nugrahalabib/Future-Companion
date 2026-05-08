"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import GlassPanel from "@/components/ui/GlassPanel";
import GlassButton from "@/components/ui/GlassButton";
import { adminFetch } from "@/lib/adminFetch";
import { useT } from "@/lib/i18n/useT";
import { SUGGESTED_COLOR_NAMES } from "@/lib/tuya/colorMap";
import type { TuyaDeviceCached, TuyaRegion } from "@/lib/tuya/types";

interface AdminState {
  enabled: boolean;
  credentials: {
    accessId: string;
    accessSecretMasked: string;
    region: TuyaRegion;
  } | null;
  hasSecret: boolean;
  devices: TuyaDeviceCached[];
}

const REGIONS: { value: TuyaRegion; label: string }[] = [
  { value: "us", label: "US (us-east)" },
  { value: "eu", label: "EU (Central Europe)" },
  { value: "cn", label: "CN (China)" },
  { value: "in", label: "IN (India)" },
];

export default function TuyaPanel() {
  const { t } = useT();
  const [state, setState] = useState<AdminState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ tone: "ok" | "err" | "info"; text: string } | null>(null);

  // Form state for credentials (separate from `state` so admin can edit
  // before saving)
  const [accessId, setAccessId] = useState("");
  const [accessSecret, setAccessSecret] = useState("");
  const [region, setRegion] = useState<TuyaRegion>("us");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/tuya");
      const data = (await res.json()) as AdminState & { ok?: boolean; error?: string };
      if (!data.ok && data.error) {
        setStatusMsg({ tone: "err", text: data.error });
      }
      setState(data);
      if (data.credentials) {
        setAccessId(data.credentials.accessId);
        setAccessSecret(data.credentials.accessSecretMasked);
        setRegion(data.credentials.region);
      }
    } catch {
      setStatusMsg({ tone: "err", text: t("admin.tuya.error.load") });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const post = async (payload: Record<string, unknown>): Promise<{ ok: boolean; data: Record<string, unknown> }> => {
    const res = await adminFetch("/api/admin/tuya", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as Record<string, unknown>;
    return { ok: res.ok && data.ok !== false, data };
  };

  const handleSave = async () => {
    setBusy("save");
    setStatusMsg(null);
    try {
      const r = await post({
        action: "save",
        credentials: { accessId, accessSecret, region },
        enabled: state?.enabled ?? true,
      });
      if (!r.ok) {
        setStatusMsg({ tone: "err", text: String(r.data.error ?? t("admin.tuya.error.save")) });
      } else {
        setStatusMsg({ tone: "ok", text: t("admin.tuya.saved") });
        await load();
      }
    } finally {
      setBusy(null);
    }
  };

  const handleTest = async () => {
    setBusy("test");
    setStatusMsg(null);
    const r = await post({ action: "test" });
    if (r.ok) {
      setStatusMsg({ tone: "ok", text: t("admin.tuya.connectionOk") });
    } else {
      setStatusMsg({ tone: "err", text: String(r.data.message ?? r.data.error ?? "Test failed") });
    }
    setBusy(null);
  };

  const handleSync = async () => {
    setBusy("sync");
    setStatusMsg(null);
    const r = await post({ action: "sync" });
    if (r.ok) {
      const count = Number(r.data.count ?? 0);
      setStatusMsg({ tone: "ok", text: t("admin.tuya.syncOk", { count }) });
      await load();
    } else {
      setStatusMsg({ tone: "err", text: String(r.data.error ?? "Sync failed") });
    }
    setBusy(null);
  };

  const handleToggle = async () => {
    if (!state) return;
    const next = !state.enabled;
    const r = await post({ action: "toggle", enabled: next });
    if (r.ok) {
      setState({ ...state, enabled: next });
      setStatusMsg({ tone: "info", text: next ? t("admin.tuya.enabled") : t("admin.tuya.disabled") });
    }
  };

  if (loading || !state) {
    return <div className="text-text-muted text-sm">{t("admin.tuya.loading")}</div>;
  }

  return (
    <div className="space-y-5">
      {/* Top status bar */}
      <GlassPanel variant="elevated" className="p-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-lg font-bold text-text-primary">{t("admin.tuya.heading")}</h2>
          <p className="text-[12px] text-text-muted mt-0.5 max-w-[640px]">
            {t("admin.tuya.subheading")}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {statusMsg && (
            <span
              className={`text-[11px] font-display uppercase tracking-widest ${
                statusMsg.tone === "ok"
                  ? "text-bio-green"
                  : statusMsg.tone === "err"
                    ? "text-danger"
                    : "text-cyan-accent"
              }`}
            >
              {statusMsg.text}
            </span>
          )}
          <button
            type="button"
            onClick={handleToggle}
            disabled={!state.hasSecret}
            className={`h-8 px-3 rounded-lg border font-display text-[11px] uppercase tracking-widest transition-colors cursor-pointer ${
              state.enabled
                ? "border-bio-green/50 bg-bio-green/10 text-bio-green hover:bg-bio-green/15"
                : "border-glass-border bg-glass-bg text-text-muted hover:text-text-secondary"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {state.enabled ? t("admin.tuya.toggle.on") : t("admin.tuya.toggle.off")}
          </button>
        </div>
      </GlassPanel>

      {/* Credentials form */}
      <GlassPanel variant="elevated" className="p-5 space-y-4">
        <div>
          <h3 className="font-display text-base font-semibold text-text-primary">{t("admin.tuya.creds.heading")}</h3>
          <p className="text-[12px] text-text-muted mt-0.5">{t("admin.tuya.creds.subheading")}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="font-display text-[10px] uppercase tracking-widest text-text-muted">
              {t("admin.tuya.field.accessId")}
            </label>
            <input
              type="text"
              value={accessId}
              onChange={(e) => setAccessId(e.target.value)}
              placeholder="iot-xxxxxxxxx"
              className="w-full bg-obsidian-surface border border-glass-border rounded-lg px-3 py-2 text-[13px] font-mono text-text-primary placeholder-text-muted focus:outline-none focus:border-cyan-accent/40 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-display text-[10px] uppercase tracking-widest text-text-muted">
              {t("admin.tuya.field.accessSecret")}
            </label>
            <input
              type="password"
              value={accessSecret}
              onChange={(e) => setAccessSecret(e.target.value)}
              placeholder={state.hasSecret ? "••••••••••••" : t("admin.tuya.field.accessSecret")}
              className="w-full bg-obsidian-surface border border-glass-border rounded-lg px-3 py-2 text-[13px] font-mono text-text-primary placeholder-text-muted focus:outline-none focus:border-cyan-accent/40 transition-colors"
            />
            <p className="text-[11px] text-text-muted/80">{t("admin.tuya.field.accessSecret.hint")}</p>
          </div>
          <div className="space-y-1.5">
            <label className="font-display text-[10px] uppercase tracking-widest text-text-muted">
              {t("admin.tuya.field.region")}
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value as TuyaRegion)}
              className="w-full bg-obsidian-surface border border-glass-border rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-cyan-accent/40 transition-colors"
            >
              {REGIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <GlassButton size="sm" onClick={handleSave} disabled={busy !== null}>
            {busy === "save" ? t("admin.tuya.saving") : t("admin.tuya.save")}
          </GlassButton>
          <GlassButton size="sm" variant="secondary" onClick={handleTest} disabled={busy !== null || !state.hasSecret}>
            {busy === "test" ? t("admin.tuya.testing") : t("admin.tuya.test")}
          </GlassButton>
          <GlassButton size="sm" variant="secondary" onClick={handleSync} disabled={busy !== null || !state.hasSecret}>
            {busy === "sync" ? t("admin.tuya.syncing") : t("admin.tuya.sync")}
          </GlassButton>
        </div>
      </GlassPanel>

      {/* Device list */}
      <GlassPanel variant="elevated" className="p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-display text-base font-semibold text-text-primary">{t("admin.tuya.devices.heading")}</h3>
            <p className="text-[12px] text-text-muted mt-0.5">
              {state.devices.length === 0
                ? t("admin.tuya.devices.empty")
                : `${t("admin.tuya.devices.count", { count: state.devices.length })} · ${t("admin.tuya.devices.allowedCount", { count: state.devices.filter((d) => d.allowed).length })}`}
            </p>
            <p className="text-[11px] text-text-muted/80 mt-1 max-w-[640px]">
              {t("admin.tuya.devices.allowlistNote")}
            </p>
          </div>
        </div>
        {state.devices.length > 0 && (
          <div className="space-y-2">
            {state.devices.map((d) => (
              <DeviceRow
                key={d.id}
                device={d}
                onActionDone={(msg) => setStatusMsg(msg)}
                onAllowedChange={(deviceId, allowed) => {
                  setState((prev) => prev ? {
                    ...prev,
                    devices: prev.devices.map((x) => x.id === deviceId ? { ...x, allowed } : x),
                  } : prev);
                }}
              />
            ))}
          </div>
        )}
      </GlassPanel>
    </div>
  );
}

// =============================================================================
// DeviceRow — manual test panel per device
// =============================================================================

function DeviceRow({
  device,
  onActionDone,
  onAllowedChange,
}: {
  device: TuyaDeviceCached;
  onActionDone: (msg: { tone: "ok" | "err" | "info"; text: string }) => void;
  onAllowedChange: (deviceId: string, allowed: boolean) => void;
}) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [allowBusy, setAllowBusy] = useState(false);
  const [brightness, setBrightness] = useState(70);
  const [color, setColor] = useState<string>("");

  const send = async (action: string, extra?: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await adminFetch("/api/admin/tuya/test-device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: device.name, action, ...extra }),
      });
      const data = (await res.json()) as { ok: boolean; message?: string; error?: string };
      onActionDone({
        tone: data.ok ? "ok" : "err",
        text: data.ok
          ? `${device.name}: ${data.message ?? "OK"}`
          : `${device.name}: ${data.error ?? data.message ?? "Failed"}`,
      });
    } finally {
      setBusy(false);
    }
  };

  const toggleAllowed = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (allowBusy) return;
    setAllowBusy(true);
    const next = !device.allowed;
    try {
      const res = await adminFetch("/api/admin/tuya", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set-allowed", deviceId: device.id, allowed: next }),
      });
      const data = (await res.json()) as { ok: boolean; allowed?: boolean; error?: string };
      if (data.ok && typeof data.allowed === "boolean") {
        onAllowedChange(device.id, data.allowed);
        onActionDone({
          tone: "ok",
          text: `${device.name}: ${data.allowed ? t("admin.tuya.allow.granted") : t("admin.tuya.allow.revoked")}`,
        });
      } else {
        onActionDone({
          tone: "err",
          text: `${device.name}: ${data.error ?? "failed"}`,
        });
      }
    } finally {
      setAllowBusy(false);
    }
  };

  const caps: string[] = [];
  if (device.switchCode) caps.push("on/off");
  if (device.supportsBrightness) caps.push("brightness");
  if (device.supportsColor) caps.push("color");
  if (device.supportsTempK) caps.push("temp");

  return (
    <div
      className={`rounded-xl border ${device.allowed ? "border-bio-green/40" : "border-glass-border"} bg-glass-bg/40 overflow-hidden transition-colors`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-glass-bg-hover transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={`h-2 w-2 rounded-full ${device.online ? "bg-bio-green" : "bg-text-muted"}`}
            style={device.online ? { boxShadow: "0 0 6px #39FF14" } : undefined}
          />
          <span className="font-display font-semibold text-text-primary">{device.name}</span>
          <code className="text-[10px] text-text-muted font-mono">{device.id}</code>
          {device.allowed ? (
            <span className="text-[10px] font-display uppercase tracking-widest text-bio-green border border-bio-green/45 bg-bio-green/10 rounded-full px-2 py-0.5">
              {t("admin.tuya.allow.allowedPill")}
            </span>
          ) : (
            <span className="text-[10px] font-display uppercase tracking-widest text-text-muted border border-glass-border rounded-full px-2 py-0.5">
              {t("admin.tuya.allow.blockedPill")}
            </span>
          )}
          {caps.map((c) => (
            <span
              key={c}
              className="text-[10px] font-display uppercase tracking-widest text-cyan-accent border border-cyan-accent/35 bg-cyan-accent/10 rounded-full px-2 py-0.5"
            >
              {c}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span
            role="button"
            tabIndex={0}
            onClick={toggleAllowed}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleAllowed(e as unknown as React.MouseEvent);
              }
            }}
            aria-pressed={device.allowed}
            className={`h-7 px-3 rounded-lg border text-[11px] font-display uppercase tracking-widest transition-colors cursor-pointer select-none ${
              device.allowed
                ? "border-bio-green/45 bg-bio-green/10 text-bio-green hover:bg-bio-green/20"
                : "border-glass-border bg-obsidian-surface text-text-muted hover:text-cyan-accent hover:border-cyan-accent/40"
            } ${allowBusy ? "opacity-60 pointer-events-none" : ""}`}
          >
            {device.allowed ? t("admin.tuya.allow.toggle.on") : t("admin.tuya.allow.toggle.off")}
          </span>
          <span className="text-[11px] font-display uppercase tracking-widest text-text-muted">
            {open ? "▴" : "▾"}
          </span>
        </div>
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border-t border-glass-border px-4 py-3 space-y-3"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => send("on")}
              disabled={busy || !device.switchCode}
              className="px-3 py-1.5 rounded-lg border border-bio-green/40 bg-bio-green/10 text-bio-green text-[12px] font-display uppercase tracking-widest hover:bg-bio-green/15 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {t("admin.tuya.test.on")}
            </button>
            <button
              type="button"
              onClick={() => send("off")}
              disabled={busy || !device.switchCode}
              className="px-3 py-1.5 rounded-lg border border-glass-border bg-glass-bg text-text-secondary text-[12px] font-display uppercase tracking-widest hover:bg-glass-bg-hover disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {t("admin.tuya.test.off")}
            </button>
          </div>
          {device.supportsBrightness && (
            <div className="flex items-center gap-3">
              <label className="font-display text-[10px] uppercase tracking-widest text-text-muted shrink-0">
                {t("admin.tuya.test.brightness")}
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="flex-1"
              />
              <span className="font-mono text-[11px] text-text-secondary w-12 text-right">{brightness}%</span>
              <button
                type="button"
                disabled={busy}
                onClick={() => send("set", { brightness })}
                className="px-3 py-1.5 rounded-lg border border-cyan-accent/40 bg-cyan-accent/10 text-cyan-accent text-[12px] font-display uppercase tracking-widest hover:bg-cyan-accent/15 disabled:opacity-40 cursor-pointer"
              >
                {t("admin.tuya.test.apply")}
              </button>
            </div>
          )}
          {device.supportsColor && (
            <div className="flex items-center gap-3 flex-wrap">
              <label className="font-display text-[10px] uppercase tracking-widest text-text-muted shrink-0">
                {t("admin.tuya.test.color")}
              </label>
              <select
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="bg-obsidian-surface border border-glass-border rounded-lg px-3 py-1.5 text-[12px] text-text-primary focus:outline-none focus:border-cyan-accent/40"
              >
                <option value="">—</option>
                {SUGGESTED_COLOR_NAMES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button
                type="button"
                disabled={busy || !color}
                onClick={() => send("set", { color })}
                className="px-3 py-1.5 rounded-lg border border-cyan-accent/40 bg-cyan-accent/10 text-cyan-accent text-[12px] font-display uppercase tracking-widest hover:bg-cyan-accent/15 disabled:opacity-40 cursor-pointer"
              >
                {t("admin.tuya.test.apply")}
              </button>
            </div>
          )}
          <div className="text-[10px] text-text-muted/80 font-mono">
            {device.category} · {device.productName}
          </div>
        </motion.div>
      )}
    </div>
  );
}

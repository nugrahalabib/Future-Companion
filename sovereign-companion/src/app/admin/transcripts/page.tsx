"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import GlassPanel from "@/components/ui/GlassPanel";
import { labelize, ROLE_LABEL, GENDER_LABEL } from "@/lib/admin/labels";
import { useT } from "@/lib/i18n/useT";

interface ListRow {
  userId: string;
  fullName: string;
  email: string;
  companionName: string;
  gender: string | null;
  role: string | null;
  finalImagePath: string | null;
  encounterStart: string | null;
  encounterEnd: string | null;
  durationSec: number | null;
  turns: number;
  userTurns: number;
  botTurns: number;
  totalWords: number;
  preview: string;
}

interface TranscriptItem {
  id: string;
  role: string;
  content: string;
  sequenceOrder: number;
  metadata: Record<string, unknown> | null;
  timestamp: string;
}

interface DetailData {
  user: { id: string; fullName: string; email: string; profession: string; age: number };
  companion: {
    companionName: string;
    gender: string;
    role: string;
    finalImagePath: string | null;
  } | null;
  session: {
    encounterStart: string | null;
    encounterEnd: string | null;
    durationSec: number | null;
  } | null;
  transcripts: TranscriptItem[];
}

export default function TranscriptsPage() {
  const { t, locale } = useT();
  const [list, setList] = useState<ListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [convoSearch, setConvoSearch] = useState("");

  useEffect(() => {
    const h = setTimeout(() => {
      setLoading(true);
      const sp = new URLSearchParams();
      if (q) sp.set("q", q);
      sp.set("minLength", "1");
      fetch(`/api/admin/transcripts?${sp.toString()}`)
        .then((r) => r.json())
        .then((d: { rows: ListRow[] }) => {
          setList(d.rows);
          setLoading(false);
          if (!selected && d.rows.length > 0) setSelected(d.rows[0].userId);
        });
    }, 300);
    return () => clearTimeout(h);
  }, [q, selected]);

  useEffect(() => {
    if (!selected) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    fetch(`/api/admin/transcripts/${selected}`)
      .then((r) => r.json())
      .then((d: DetailData) => setDetail(d))
      .finally(() => setDetailLoading(false));
  }, [selected]);

  const filteredTranscripts = useMemo(() => {
    if (!detail?.transcripts) return [];
    if (!convoSearch.trim()) return detail.transcripts;
    const needle = convoSearch.toLowerCase();
    return detail.transcripts.filter((tr) =>
      tr.content.toLowerCase().includes(needle),
    );
  }, [detail, convoSearch]);

  const copyAll = useCallback(() => {
    if (!detail) return;
    const text = detail.transcripts
      .map((tr) => `[${tr.role.toUpperCase()}] ${tr.content}`)
      .join("\n\n");
    navigator.clipboard?.writeText(text);
  }, [detail]);

  const downloadJson = useCallback(() => {
    if (!detail) return;
    const blob = new Blob([JSON.stringify(detail, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcript-${detail.user.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [detail]);

  const timeLocale = locale === "id" ? "id-ID" : "en-US";

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-lg font-semibold text-text-primary">
          {t("admin.trans.title")}
        </h2>
        <p className="text-xs text-text-muted">{t("admin.trans.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5 min-h-[70vh]">
        {/* Left: session list */}
        <GlassPanel variant="elevated" className="p-4 flex flex-col min-h-0">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("admin.trans.list.search")}
            className="w-full px-3 py-2 rounded-xl bg-obsidian-surface border border-glass-border text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-cyan-accent/40 mb-3"
          />
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
            {loading && (
              <p className="text-xs text-text-muted p-4 text-center">
                {t("admin.common.loading")}
              </p>
            )}
            {!loading && list.length === 0 && (
              <p className="text-xs text-text-muted p-4 text-center">
                {q ? t("admin.trans.list.noMatch") : t("admin.trans.list.empty")}
              </p>
            )}
            {list.map((row) => {
              const isSel = selected === row.userId;
              return (
                <button
                  key={row.userId}
                  onClick={() => setSelected(row.userId)}
                  className={`w-full text-left rounded-xl border p-3 transition-colors cursor-pointer ${
                    isSel
                      ? "bg-cyan-accent/10 border-cyan-accent/40"
                      : "glass border-glass-border hover:border-cyan-accent/20"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {row.finalImagePath && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={row.finalImagePath}
                        alt=""
                        className="w-9 h-9 rounded-lg object-cover border border-glass-border flex-shrink-0"
                        loading="lazy"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-display text-text-primary truncate">
                        {row.fullName}
                      </p>
                      <p className="text-[11px] text-text-muted truncate">
                        {row.companionName} · {labelize(GENDER_LABEL, row.gender, locale)} ·{" "}
                        {labelize(ROLE_LABEL, row.role, locale)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[10px] font-display uppercase tracking-widest text-text-muted">
                    <span>
                      {row.turns} {t("admin.trans.metrics.turns")}
                    </span>
                    <span>
                      {row.totalWords} {t("admin.trans.metrics.words")}
                    </span>
                    <span>
                      {row.durationSec != null
                        ? `${Math.floor(row.durationSec / 60)}:${String(row.durationSec % 60).padStart(2, "0")}`
                        : "—"}
                    </span>
                  </div>
                  {row.preview && (
                    <p className="text-[11px] text-text-muted mt-2 line-clamp-2">
                      “{row.preview}”
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </GlassPanel>

        {/* Right: viewer */}
        <GlassPanel variant="elevated" className="p-5 flex flex-col min-h-0">
          {!selected && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-text-muted text-sm">
                {t("admin.trans.viewer.empty")}
              </p>
            </div>
          )}
          {selected && detailLoading && (
            <p className="text-sm text-text-muted p-4">
              {t("admin.trans.viewer.loadingDetail")}
            </p>
          )}
          {selected && !detailLoading && detail && (
            <>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-display text-base text-text-primary">
                    {detail.user.fullName}
                  </h3>
                  <p className="text-[11px] text-text-muted">
                    {detail.user.email} ·{" "}
                    {t("admin.trans.viewer.age", { age: detail.user.age })} ·{" "}
                    {detail.user.profession}
                  </p>
                  {detail.companion && (
                    <p className="text-[11px] text-text-muted mt-0.5">
                      {t("admin.trans.viewer.talkingTo")}{" "}
                      <span className="text-cyan-accent">
                        {detail.companion.companionName}
                      </span>{" "}
                      · {labelize(ROLE_LABEL, detail.companion.role, locale)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={copyAll}
                    className="px-3 py-1.5 rounded-lg glass border border-glass-border text-[11px] font-display uppercase tracking-widest text-text-muted hover:text-cyan-accent transition-colors cursor-pointer"
                  >
                    {t("admin.trans.viewer.copy")}
                  </button>
                  <button
                    onClick={downloadJson}
                    className="px-3 py-1.5 rounded-lg glass border border-glass-border text-[11px] font-display uppercase tracking-widest text-text-muted hover:text-cyan-accent transition-colors cursor-pointer"
                  >
                    {t("admin.trans.viewer.download")}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <input
                  value={convoSearch}
                  onChange={(e) => setConvoSearch(e.target.value)}
                  placeholder={t("admin.trans.viewer.search")}
                  className="flex-1 px-3 py-2 rounded-xl bg-obsidian-surface border border-glass-border text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-cyan-accent/40"
                />
                <span className="text-[10px] font-display uppercase tracking-widest text-text-muted">
                  {t("admin.trans.viewer.turnCount", {
                    shown: filteredTranscripts.length,
                    total: detail.transcripts.length,
                  })}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
                {filteredTranscripts.length === 0 && (
                  <p className="text-sm text-text-muted">
                    {t("admin.trans.viewer.noMatch")}
                  </p>
                )}
                {filteredTranscripts.map((tr) => {
                  const isUser = tr.role === "user";
                  return (
                    <div
                      key={tr.id}
                      className={`rounded-xl border px-3 py-2.5 ${
                        isUser
                          ? "bg-cyan-accent/8 border-cyan-accent/25"
                          : "bg-bio-green/8 border-bio-green/25"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-display uppercase tracking-widest mb-1">
                        <span className={isUser ? "text-cyan-accent" : "text-bio-green"}>
                          {isUser
                            ? detail.user.fullName
                            : detail.companion?.companionName ||
                              t("admin.trans.viewer.bot")}
                        </span>
                        <span className="text-text-muted">
                          #{tr.sequenceOrder} ·{" "}
                          {new Date(tr.timestamp).toLocaleTimeString(timeLocale)}
                        </span>
                      </div>
                      <p className="text-sm text-text-primary whitespace-pre-line leading-relaxed">
                        {highlight(tr.content, convoSearch)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </GlassPanel>
      </div>
    </div>
  );
}

function highlight(text: string, q: string): React.ReactNode {
  if (!q.trim()) return text;
  const needle = q.trim();
  const re = new RegExp(`(${escapeRegex(needle)})`, "ig");
  const parts = text.split(re);
  return parts.map((p, i) =>
    p.toLowerCase() === needle.toLowerCase() ? (
      <mark key={i} className="bg-cyan-accent/30 text-text-primary rounded px-0.5">
        {p}
      </mark>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

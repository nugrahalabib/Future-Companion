"use client";

import { useEffect, useMemo, useState } from "react";
import GlassPanel from "@/components/ui/GlassPanel";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  ADMIN_COLORS, CHART_TOOLTIP_STYLE, CHART_TOOLTIP_LABEL_STYLE,
  AXIS_STROKE, GRID_STROKE,
} from "@/lib/admin/chartTheme";
import { labelize, ROLE_LABEL } from "@/lib/admin/labels";
import { useT } from "@/lib/i18n/useT";
import type { Locale } from "@/stores/useLocaleStore";

interface LikertItem {
  key: string;
  label: string;
  section: string;
  buckets: { score: number; count: number }[];
  mean: number;
  median: number;
  n: number;
}

interface ChoiceItem {
  key: string;
  label: string;
  buckets: { label: string; count: number }[];
}

interface QualitativeItem {
  key: string;
  label: string;
  items: {
    userId: string;
    fullName: string;
    content: string;
    sentiment: "positive" | "negative" | "neutral";
    createdAt: string;
    role: string | null;
  }[];
  sentimentCounts: { positive: number; negative: number; neutral: number };
}

interface ResearchData {
  totalSurveys: number;
  likertHistograms: LikertItem[];
  singleChoice: ChoiceItem[];
  multiChoice: ChoiceItem[];
  qualitative: QualitativeItem[];
  experienceByRole: { role: string; avg: number; n: number }[];
}

type Tab = "likert" | "choice" | "qualitative" | "crosstab";
type T = (key: string, params?: Record<string, string | number>) => string;

export default function ResearchPage() {
  const { t, locale } = useT();
  const [data, setData] = useState<ResearchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("likert");

  useEffect(() => {
    fetch("/api/admin/research")
      .then((r) => r.json())
      .then((d: ResearchData) => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="p-12 text-center text-text-muted font-display">
        {t("admin.research.loading")}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-text-primary">
            {t("admin.research.title")}
          </h2>
          <p className="text-xs text-text-muted">
            {t("admin.research.header.summary", { n: data.totalSurveys })}
          </p>
        </div>
        <div className="flex items-center gap-1 glass rounded-full border border-glass-border p-1">
          {(
            [
              { key: "likert", label: t("admin.research.tab.likert") },
              { key: "choice", label: t("admin.research.tab.choice") },
              { key: "qualitative", label: t("admin.research.tab.qualitative") },
              { key: "crosstab", label: t("admin.research.tab.crosstab") },
            ] as const
          ).map((btn) => (
            <button
              key={btn.key}
              onClick={() => setTab(btn.key)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-display uppercase tracking-widest transition-colors cursor-pointer ${
                tab === btn.key ? "bg-cyan-accent/20 text-cyan-accent" : "text-text-muted hover:text-text-primary"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "likert" && <LikertSection items={data.likertHistograms} t={t} />}
      {tab === "choice" && (
        <ChoiceSection
          single={data.singleChoice}
          multi={data.multiChoice}
          t={t}
        />
      )}
      {tab === "qualitative" && (
        <QualitativeSection items={data.qualitative} t={t} locale={locale} />
      )}
      {tab === "crosstab" && <CrossTabSection data={data} t={t} locale={locale} />}
    </div>
  );
}

function sectionLabel(section: string, t: T): string {
  const translated = t(`admin.research.likert.section.${section}`);
  return translated === `admin.research.likert.section.${section}` ? section : translated;
}

function fieldLabel(key: string, fallback: string, t: T): string {
  const translated = t(`admin.survey.${key}`);
  return translated === `admin.survey.${key}` ? fallback : translated;
}

function LikertSection({ items, t }: { items: LikertItem[]; t: T }) {
  const grouped = useMemo(() => {
    const m = new Map<string, LikertItem[]>();
    for (const it of items) {
      if (!m.has(it.section)) m.set(it.section, []);
      m.get(it.section)!.push(it);
    }
    return Array.from(m, ([section, list]) => ({ section, list }));
  }, [items]);
  return (
    <div className="space-y-6">
      {grouped.map((g) => (
        <div key={g.section}>
          <h3 className="font-display text-xs font-semibold text-cyan-accent uppercase tracking-widest mb-3">
            {sectionLabel(g.section, t)}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {g.list.map((it) => (
              <LikertHistogram key={it.key} item={it} t={t} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function LikertHistogram({ item, t }: { item: LikertItem; t: T }) {
  const color =
    item.mean >= 4 ? ADMIN_COLORS[1] : item.mean >= 3 ? ADMIN_COLORS[3] : ADMIN_COLORS[2];
  return (
    <GlassPanel variant="elevated" className="p-4">
      <div className="flex items-start justify-between mb-2">
        <p className="font-display text-xs text-text-primary uppercase tracking-widest">
          {fieldLabel(item.key, item.label, t)}
        </p>
        <span className="text-[10px] font-display text-text-muted">
          n={item.n}
        </span>
      </div>
      <div className="flex items-baseline gap-3 mb-3">
        <span className="font-display text-2xl font-bold" style={{ color }}>
          {item.mean.toFixed(2)}
        </span>
        <span className="text-[10px] font-display uppercase tracking-widest text-text-muted">
          {t("admin.research.likert.mean")}
        </span>
        <span className="text-[10px] font-display uppercase tracking-widest text-text-muted">
          {t("admin.research.likert.median", { n: item.median.toFixed(1) })}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={100}>
        <BarChart data={item.buckets}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
          <XAxis dataKey="score" stroke={AXIS_STROKE} fontSize={10} />
          <YAxis stroke={AXIS_STROKE} fontSize={9} allowDecimals={false} width={24} />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            labelStyle={CHART_TOOLTIP_LABEL_STYLE}
          />
          <Bar dataKey="count" fill={color} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </GlassPanel>
  );
}

function ChoiceSection({
  single, multi, t,
}: {
  single: ChoiceItem[];
  multi: ChoiceItem[];
  t: T;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-xs font-semibold text-cyan-accent uppercase tracking-widest mb-3">
          {t("admin.research.choice.single")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {single.map((it) => (
            <ChoiceHistogram key={it.key} item={it} color={ADMIN_COLORS[0]} t={t} />
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-display text-xs font-semibold text-cyan-accent uppercase tracking-widest mb-3">
          {t("admin.research.choice.multi")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {multi.map((it) => (
            <ChoiceHistogram key={it.key} item={it} color={ADMIN_COLORS[4]} t={t} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ChoiceHistogram({
  item, color, t,
}: {
  item: ChoiceItem;
  color: string;
  t: T;
}) {
  const total = item.buckets.reduce((a, b) => a + b.count, 0);
  return (
    <GlassPanel variant="elevated" className="p-4">
      <div className="flex items-start justify-between mb-3">
        <p className="font-display text-xs text-text-primary uppercase tracking-widest">
          {fieldLabel(item.key, item.label, t)}
        </p>
        <span className="text-[10px] font-display text-text-muted">n={total}</span>
      </div>
      {item.buckets.length === 0 ? (
        <p className="text-xs text-text-muted py-3">{t("admin.research.choice.empty")}</p>
      ) : (
        <div className="space-y-1.5">
          {item.buckets.map((b) => {
            const pct = total ? (b.count / total) * 100 : 0;
            return (
              <div key={b.label} className="flex items-center gap-2 text-xs">
                <span className="min-w-0 flex-1 truncate text-text-secondary">{b.label}</span>
                <div className="w-32 h-2 rounded-full bg-obsidian-surface overflow-hidden">
                  <div
                    className="h-full"
                    style={{
                      width: `${pct}%`,
                      background: color,
                      boxShadow: `0 0 8px ${color}55`,
                    }}
                  />
                </div>
                <span className="text-text-muted tabular-nums min-w-[48px] text-right">
                  {b.count} · {pct.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </GlassPanel>
  );
}

function QualitativeSection({
  items, t, locale,
}: {
  items: QualitativeItem[];
  t: T;
  locale: Locale;
}) {
  const [selected, setSelected] = useState<string>(items[0]?.key ?? "");
  const current = items.find((i) => i.key === selected) ?? items[0];
  const [filter, setFilter] = useState<"all" | "positive" | "negative" | "neutral">("all");
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    if (!current) return [];
    let arr = current.items;
    if (filter !== "all") arr = arr.filter((i) => i.sentiment === filter);
    if (search.trim())
      arr = arr.filter((i) =>
        i.content.toLowerCase().includes(search.trim().toLowerCase()),
      );
    return arr;
  }, [current, filter, search]);

  const dateLocale = locale === "id" ? "id-ID" : "en-US";

  if (!current) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {items.map((it) => (
          <button
            key={it.key}
            onClick={() => setSelected(it.key)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-display uppercase tracking-widest transition-colors cursor-pointer border ${
              selected === it.key
                ? "bg-cyan-accent/20 text-cyan-accent border-cyan-accent/40"
                : "glass text-text-muted border-glass-border hover:text-text-primary"
            }`}
          >
            {fieldLabel(it.key, it.label, t)} · {it.items.length}
          </button>
        ))}
      </div>

      <GlassPanel variant="elevated" className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 text-[11px] font-display">
            <SentimentPill
              label={t("admin.research.qualitative.positive")}
              count={current.sentimentCounts.positive}
              tone="positive"
              active={filter === "positive"}
              onClick={() => setFilter(filter === "positive" ? "all" : "positive")}
            />
            <SentimentPill
              label={t("admin.research.qualitative.neutral")}
              count={current.sentimentCounts.neutral}
              tone="neutral"
              active={filter === "neutral"}
              onClick={() => setFilter(filter === "neutral" ? "all" : "neutral")}
            />
            <SentimentPill
              label={t("admin.research.qualitative.negative")}
              count={current.sentimentCounts.negative}
              tone="negative"
              active={filter === "negative"}
              onClick={() => setFilter(filter === "negative" ? "all" : "negative")}
            />
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.research.qualitative.search")}
            className="flex-1 sm:flex-none sm:w-64 px-3 py-1.5 rounded-xl bg-obsidian-surface border border-glass-border text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-cyan-accent/40"
          />
        </div>
        {filtered.length === 0 ? (
          <p className="text-sm text-text-muted py-6 text-center">
            {t("admin.research.qualitative.empty")}
          </p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((it, idx) => (
              <li
                key={it.userId + idx}
                className={`rounded-xl border p-3 ${
                  it.sentiment === "positive"
                    ? "bg-bio-green/8 border-bio-green/25"
                    : it.sentiment === "negative"
                      ? "bg-danger/8 border-danger/25"
                      : "glass border-glass-border"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-display uppercase tracking-widest mb-1 text-text-muted">
                  <span>
                    {it.fullName} · {labelize(ROLE_LABEL, it.role ?? undefined, locale)}
                  </span>
                  <time>{new Date(it.createdAt).toLocaleDateString(dateLocale)}</time>
                </div>
                <p className="text-sm text-text-primary whitespace-pre-line leading-relaxed">
                  “{it.content}”
                </p>
              </li>
            ))}
          </ul>
        )}
      </GlassPanel>
    </div>
  );
}

function SentimentPill({
  label, count, tone, active, onClick,
}: {
  label: string;
  count: number;
  tone: "positive" | "negative" | "neutral";
  active: boolean;
  onClick: () => void;
}) {
  const toneClass =
    tone === "positive"
      ? "text-bio-green border-bio-green/30"
      : tone === "negative"
        ? "text-danger border-danger/30"
        : "text-text-muted border-glass-border";
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full border uppercase tracking-widest transition-colors cursor-pointer ${toneClass} ${
        active ? "ring-1 ring-current" : ""
      }`}
    >
      {label} · {count}
    </button>
  );
}

function CrossTabSection({
  data, t, locale,
}: {
  data: ResearchData;
  t: T;
  locale: Locale;
}) {
  return (
    <div className="space-y-6">
      <GlassPanel variant="elevated" className="p-5">
        <h3 className="font-display text-xs font-semibold text-cyan-accent uppercase tracking-widest mb-1">
          {t("admin.research.crosstab.expByRole.title")}
        </h3>
        <p className="text-[11px] text-text-muted mb-3">
          {t("admin.research.crosstab.expByRole.subtitle")}
        </p>
        {data.experienceByRole.length === 0 ? (
          <p className="text-sm text-text-muted">
            {t("admin.research.crosstab.expByRole.empty")}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={data.experienceByRole.map((r) => ({
                role: labelize(ROLE_LABEL, r.role, locale),
                avg: Number(r.avg.toFixed(2)),
                n: r.n,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis dataKey="role" stroke={AXIS_STROKE} fontSize={11} />
              <YAxis domain={[0, 5]} stroke={AXIS_STROKE} fontSize={11} />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                formatter={(v, _n, ctx) => [
                  `${v}/5 (n=${(ctx?.payload as { n: number } | undefined)?.n ?? 0})`,
                  t("admin.research.crosstab.tooltip.avg"),
                ]}
              />
              <Bar dataKey="avg" fill={ADMIN_COLORS[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </GlassPanel>

      <GlassPanel variant="elevated" className="p-5">
        <h3 className="font-display text-xs font-semibold text-cyan-accent uppercase tracking-widest mb-1">
          {t("admin.research.crosstab.likertRanked.title")}
        </h3>
        <p className="text-[11px] text-text-muted mb-3">
          {t("admin.research.crosstab.likertRanked.subtitle")}
        </p>
        <LikertMeansTable items={data.likertHistograms} t={t} />
      </GlassPanel>
    </div>
  );
}

function LikertMeansTable({ items, t }: { items: LikertItem[]; t: T }) {
  const sorted = [...items].sort((a, b) => b.mean - a.mean);
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="text-left text-[10px] font-display uppercase tracking-widest text-text-muted">
            <th className="px-3 py-2">{t("admin.research.table.rank")}</th>
            <th className="px-3 py-2">{t("admin.research.table.item")}</th>
            <th className="px-3 py-2">{t("admin.research.table.section")}</th>
            <th className="px-3 py-2">{t("admin.research.table.mean")}</th>
            <th className="px-3 py-2">{t("admin.research.table.median")}</th>
            <th className="px-3 py-2">{t("admin.research.table.n")}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((it, i) => (
            <tr key={it.key} className="border-t border-glass-border/40">
              <td className="px-3 py-2 text-text-muted font-display">{i + 1}</td>
              <td className="px-3 py-2 text-text-primary font-display">
                {fieldLabel(it.key, it.label, t)}
              </td>
              <td className="px-3 py-2 text-text-muted">{sectionLabel(it.section, t)}</td>
              <td className="px-3 py-2 text-cyan-accent font-display">{it.mean.toFixed(2)}</td>
              <td className="px-3 py-2 text-text-secondary">{it.median.toFixed(1)}</td>
              <td className="px-3 py-2 text-text-muted">{it.n}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

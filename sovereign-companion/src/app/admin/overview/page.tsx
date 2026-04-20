"use client";

import { useEffect, useMemo, useState } from "react";
import GlassPanel from "@/components/ui/GlassPanel";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, LineChart, Line,
} from "recharts";
import {
  ADMIN_COLORS, CHART_TOOLTIP_STYLE, CHART_TOOLTIP_LABEL_STYLE,
  AXIS_STROKE, GRID_STROKE,
} from "@/lib/admin/chartTheme";
import { useT } from "@/lib/i18n/useT";

interface KPIs {
  totalDemos: number;
  completionRate: number;
  avgEncounterDuration: number;
  avgExperienceScore: number;
}

interface FunnelItem {
  stage: string;
  count: number;
}

interface TimeSeriesPoint {
  date: string;
  registered: number;
  customized: number;
  encounter: number;
  surveyed: number;
}

interface HourlyBucket {
  hour: number;
  count: number;
}

type ActivityKind =
  | "completed"
  | "dropped"
  | "encounterEnd"
  | "encounterStart"
  | "customized"
  | "registered";

interface ActivityItem {
  id: string;
  type: "completed" | "dropped" | "in-progress" | "registered";
  kind: ActivityKind;
  userName: string;
  dropStage: string | null;
  companionName: string | null;
  role: string | null;
  experience: number | null;
  ago: string;
  at: string;
}

interface OverviewData {
  kpis: KPIs;
  funnel: FunnelItem[];
  timeseries: TimeSeriesPoint[];
  hourly: HourlyBucket[];
  activity: ActivityItem[];
  deltas: { totalDemos: number; completionRate: number; avgEncounterDuration: number };
}

export default function AdminOverviewPage() {
  const { t } = useT();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rangeDays, setRangeDays] = useState<7 | 30 | 90>(30);

  useEffect(() => {
    let aborted = false;
    setLoading(true);
    fetch(`/api/admin/overview?days=${rangeDays}`)
      .then((r) => r.json())
      .then((d: OverviewData) => {
        if (!aborted) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!aborted) setLoading(false);
      });
    return () => {
      aborted = true;
    };
  }, [rangeDays]);

  const dropoff = useMemo(() => {
    if (!data?.funnel.length) return [] as { stage: string; drop: number; pct: number }[];
    const out: { stage: string; drop: number; pct: number }[] = [];
    for (let i = 1; i < data.funnel.length; i++) {
      const prev = data.funnel[i - 1].count;
      const cur = data.funnel[i].count;
      const drop = Math.max(0, prev - cur);
      const fromLabel = t(`admin.overview.chart.funnel.stage.${data.funnel[i - 1].stage}`);
      const toLabel = t(`admin.overview.chart.funnel.stage.${data.funnel[i].stage}`);
      out.push({
        stage: `${fromLabel} → ${toLabel}`,
        drop,
        pct: prev > 0 ? (drop / prev) * 100 : 0,
      });
    }
    return out;
  }, [data, t]);

  if (loading || !data) {
    return <OverviewSkeleton />;
  }

  const localizedFunnel = data.funnel.map((f) => ({
    ...f,
    stage: t(`admin.overview.chart.funnel.stage.${f.stage}`),
  }));
  const localizedSeries = data.timeseries;

  const kpiCards = [
    {
      label: t("admin.overview.kpi.totalDemos"),
      value: data.kpis.totalDemos.toString(),
      unit: "",
      delta: data.deltas.totalDemos,
      deltaSuffix: "",
    },
    {
      label: t("admin.overview.kpi.completionRate"),
      value: Math.round(data.kpis.completionRate).toString(),
      unit: "%",
      delta: data.deltas.completionRate,
      deltaSuffix: t("admin.overview.unit.points"),
    },
    {
      label: t("admin.overview.kpi.avgEncounter"),
      value: Math.round((data.kpis.avgEncounterDuration ?? 0) / 60).toString(),
      unit: ` ${t("admin.overview.unit.minutes")}`,
      delta: data.deltas.avgEncounterDuration,
      deltaSuffix: t("admin.overview.unit.seconds"),
    },
    {
      label: t("admin.overview.kpi.avgExperience"),
      value: (data.kpis.avgExperienceScore ?? 0).toFixed(1),
      unit: "/5",
      delta: 0,
      deltaSuffix: "",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-lg font-semibold text-text-primary">
          {t("admin.overview.title")}
        </h2>
        <p className="text-xs text-text-muted">{t("admin.overview.subtitle")}</p>
      </div>

      {/* Range selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-display uppercase tracking-widest text-text-muted">
          {t("admin.overview.range.label")}
        </span>
        {([7, 30, 90] as const).map((d) => (
          <button
            key={d}
            onClick={() => setRangeDays(d)}
            className={`px-3 py-1 rounded-full text-xs font-display uppercase tracking-widest transition-colors cursor-pointer ${
              rangeDays === d
                ? "bg-cyan-accent/20 text-cyan-accent border border-cyan-accent/40"
                : "glass border border-glass-border text-text-muted hover:text-text-primary"
            }`}
          >
            {t(`admin.overview.range.${d}d`)}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <GlassPanel key={kpi.label} variant="elevated" className="p-5">
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-display">
              {kpi.label}
            </p>
            <p className="text-3xl font-display font-bold text-cyan-accent mt-2">
              {kpi.value}
              <span className="text-lg text-text-secondary">{kpi.unit}</span>
            </p>
            {kpi.delta !== 0 && (
              <p
                className={`mt-1 text-[11px] font-display ${
                  kpi.delta > 0 ? "text-bio-green" : "text-danger"
                }`}
              >
                {kpi.delta > 0 ? "▲" : "▼"} {Math.abs(kpi.delta).toFixed(1)}
                {kpi.deltaSuffix ? ` ${kpi.deltaSuffix}` : ""} ·{" "}
                <span className="text-text-muted">{t("admin.overview.delta.vsPrev")}</span>
              </p>
            )}
          </GlassPanel>
        ))}
      </div>

      {/* Time series */}
      <GlassPanel variant="elevated" className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-sm font-semibold text-text-primary uppercase tracking-widest">
            {t("admin.overview.chart.activity.title")}
          </h3>
          <span className="text-[10px] text-text-muted font-display uppercase tracking-widest">
            {t(`admin.overview.range.${rangeDays}d`)}
          </span>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={localizedSeries}>
            <defs>
              {(["registered", "customized", "encounter", "surveyed"] as const).map(
                (k, i) => (
                  <linearGradient
                    id={`grad-${k}`}
                    key={k}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={ADMIN_COLORS[i]} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={ADMIN_COLORS[i]} stopOpacity={0} />
                  </linearGradient>
                ),
              )}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis dataKey="date" stroke={AXIS_STROKE} fontSize={10} />
            <YAxis stroke={AXIS_STROKE} fontSize={10} allowDecimals={false} />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              labelStyle={CHART_TOOLTIP_LABEL_STYLE}
            />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: "monospace" }} />
            <Area
              type="monotone"
              dataKey="registered"
              name={t("admin.overview.chart.activity.registered")}
              stroke={ADMIN_COLORS[0]}
              fill="url(#grad-registered)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="customized"
              name={t("admin.overview.chart.activity.customized")}
              stroke={ADMIN_COLORS[1]}
              fill="url(#grad-customized)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="encounter"
              name={t("admin.overview.chart.activity.encounter")}
              stroke={ADMIN_COLORS[2]}
              fill="url(#grad-encounter)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="surveyed"
              name={t("admin.overview.chart.activity.surveyed")}
              stroke={ADMIN_COLORS[3]}
              fill="url(#grad-surveyed)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </GlassPanel>

      {/* Funnel + Hourly */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassPanel variant="elevated" className="p-5">
          <h3 className="font-display text-sm font-semibold text-text-primary mb-1 uppercase tracking-widest">
            {t("admin.overview.chart.funnel.title")}
          </h3>
          <p className="text-[11px] text-text-muted mb-4">
            {t("admin.overview.chart.funnel.subtitle")}
          </p>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={localizedFunnel} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis type="number" stroke={AXIS_STROKE} fontSize={11} />
              <YAxis
                type="category"
                dataKey="stage"
                stroke={AXIS_STROKE}
                fontSize={11}
                width={170}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                formatter={(v) => [v, t("admin.common.count")]}
              />
              <Bar dataKey="count" fill={ADMIN_COLORS[0]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
          {dropoff.length > 0 && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              {dropoff.map((d) => (
                <div
                  key={d.stage}
                  className="glass border border-glass-border rounded-lg px-3 py-2 flex items-center justify-between gap-2"
                >
                  <span className="text-text-muted">{d.stage}</span>
                  <span
                    className={
                      d.pct > 30 ? "text-danger font-display" : "text-text-secondary font-display"
                    }
                  >
                    −{d.drop} ({d.pct.toFixed(0)}%)
                  </span>
                </div>
              ))}
            </div>
          )}
        </GlassPanel>

        <GlassPanel variant="elevated" className="p-5">
          <h3 className="font-display text-sm font-semibold text-text-primary mb-1 uppercase tracking-widest">
            {t("admin.overview.chart.hourly.title")}
          </h3>
          <p className="text-[11px] text-text-muted mb-4">
            {t("admin.overview.chart.hourly.subtitle")}
          </p>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data.hourly}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis
                dataKey="hour"
                stroke={AXIS_STROKE}
                fontSize={11}
                tickFormatter={(h: number) => `${h}:00`}
              />
              <YAxis stroke={AXIS_STROKE} fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                labelFormatter={(h) => `${h}:00`}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke={ADMIN_COLORS[1]}
                strokeWidth={2}
                dot={{ r: 3, fill: ADMIN_COLORS[1] }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-[11px] text-text-muted mt-2">
            {t("admin.overview.hourlyHint")}
          </p>
        </GlassPanel>
      </div>

      {/* Activity feed */}
      <GlassPanel variant="elevated" className="p-5">
        <h3 className="font-display text-sm font-semibold text-text-primary mb-1 uppercase tracking-widest">
          {t("admin.overview.activity.title")}
        </h3>
        <p className="text-[11px] text-text-muted mb-4">
          {t("admin.overview.activity.subtitle")}
        </p>
        {data.activity.length === 0 ? (
          <p className="text-sm text-text-muted py-8 text-center">
            {t("admin.overview.activity.empty")}
          </p>
        ) : (
          <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {data.activity.map((a) => (
              <ActivityRow key={a.id} row={a} />
            ))}
          </ul>
        )}
      </GlassPanel>
    </div>
  );
}

function ActivityRow({ row }: { row: ActivityItem }) {
  const { t, locale } = useT();
  const name = row.userName;
  const stage = row.dropStage ?? "—";
  const labelKey = `admin.overview.activity.label.${row.kind}`;
  const label = t(labelKey, { name, stage });
  const companion = row.companionName ?? t("admin.overview.activity.subtitle.unnamed");
  // Role is stored as a code like "romantic-partner". Import labelize at top would
  // be ideal; for compactness we keep a tiny inline map here.
  const roleMap: Record<string, Record<string, string>> = {
    en: {
      "romantic-partner": "Romantic Partner",
      "dominant-assistant": "Dominant Assistant",
      "passive-listener": "Passive Listener",
      "intellectual-rival": "Intellectual Rival",
    },
    id: {
      "romantic-partner": "Pasangan Romantis",
      "dominant-assistant": "Asisten Dominan",
      "passive-listener": "Pendengar Pasif",
      "intellectual-rival": "Rival Intelektual",
    },
  };
  const role = row.role
    ? roleMap[locale]?.[row.role] ?? row.role
    : t("admin.overview.activity.subtitle.undecided");
  const subtitle = [
    companion,
    role,
    row.experience
      ? t("admin.overview.activity.subtitle.experience", { score: row.experience })
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <li className="glass border border-glass-border rounded-xl px-3 py-2.5 flex items-start gap-3">
      <span
        className={`mt-1 inline-block w-2 h-2 rounded-full flex-shrink-0 ${
          row.type === "completed"
            ? "bg-bio-green shadow-[0_0_10px_rgba(57,255,20,0.7)]"
            : row.type === "dropped"
              ? "bg-danger"
              : "bg-cyan-accent shadow-[0_0_10px_rgba(0,240,255,0.5)]"
        }`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary truncate">{label}</p>
        <p className="text-[11px] text-text-muted truncate">{subtitle}</p>
      </div>
      <time
        dateTime={row.at}
        className="text-[10px] font-display uppercase tracking-widest text-text-muted whitespace-nowrap"
      >
        {row.ago}
      </time>
    </li>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="glass border border-glass-border rounded-2xl h-28 animate-pulse"
          />
        ))}
      </div>
      <div className="glass border border-glass-border rounded-2xl h-[340px] animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass border border-glass-border rounded-2xl h-[360px] animate-pulse" />
        <div className="glass border border-glass-border rounded-2xl h-[360px] animate-pulse" />
      </div>
    </div>
  );
}

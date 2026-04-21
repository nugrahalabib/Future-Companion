"use client";

import { useEffect, useState } from "react";
import GlassPanel from "@/components/ui/GlassPanel";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, ResponsiveContainer, Legend,
} from "recharts";
import {
  ADMIN_COLORS, CHART_TOOLTIP_STYLE, CHART_TOOLTIP_LABEL_STYLE,
  AXIS_STROKE, GRID_STROKE,
} from "@/lib/admin/chartTheme";
import {
  FACE_LABEL, HAIR_LABEL, BODY_LABEL, SKIN_LABEL,
  ROLE_LABEL, HOBBY_LABEL, GENDER_LABEL, labelize,
} from "@/lib/admin/labels";
import { useT } from "@/lib/i18n/useT";
import { adminFetch } from "@/lib/adminFetch";
import type { Locale } from "@/stores/useLocaleStore";

interface WordItem { text: string; value: number }

interface InsightsData {
  roleDistribution: { role: string; count: number }[];
  averagePersona: {
    dominanceLevel: number;
    innocenceLevel: number;
    emotionalLevel: number;
    humorStyle: number;
  };
  personaByRole: {
    role: string;
    dominance: number;
    innocence: number;
    emotional: number;
    humor: number;
    n: number;
  }[];
  physicalDistribution: {
    face: { key: string; count: number }[];
    hair: { key: string; count: number }[];
    body: { key: string; count: number }[];
    skinTone: { key: string; count: number }[];
  };
  hobbyPopularity: { hobby: string; count: number }[];
  bioFeatureUsage: { artificialWomb: number; spermBank: number };
  topCombinations: { combo: string; imagePath: string; count: number }[];
  nps: { score: number; promoters: number; passives: number; detractors: number; total: number };
  ageBuckets: { label: string; count: number }[];
  relationshipDistribution: { status: string; count: number }[];
  genderRoleMatrix: { gender: string; role: string; count: number }[];
  purchaseBuckets: { score: number; count: number }[];
  totalConfigs: number;
  totalSurveys: number;
}

export default function InsightsPage() {
  const { t, locale } = useT();
  const [data, setData] = useState<InsightsData | null>(null);
  const [words, setWords] = useState<WordItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminFetch("/api/admin/insights").then((r) => r.json()),
      adminFetch("/api/admin/wordcloud").then((r) => r.json()),
    ]).then(([d, w]: [InsightsData, WordItem[]]) => {
      setData(d);
      setWords(w);
      setLoading(false);
    });
  }, []);

  if (loading || !data) {
    return (
      <div className="p-12 text-center text-text-muted font-display">
        {t("admin.insights.loading")}
      </div>
    );
  }

  const traitLabels = {
    dominance: t("admin.insights.trait.dominance"),
    innocence: t("admin.insights.trait.innocence"),
    emotional: t("admin.insights.trait.emotional"),
    humor: t("admin.insights.trait.humor"),
  };

  const radarData = [
    { trait: traitLabels.dominance, value: data.averagePersona.dominanceLevel },
    { trait: traitLabels.innocence, value: data.averagePersona.innocenceLevel },
    { trait: traitLabels.emotional, value: data.averagePersona.emotionalLevel },
    { trait: traitLabels.humor, value: data.averagePersona.humorStyle },
  ];
  const bioData = [
    { name: t("admin.insights.features.womb"), value: Math.round(data.bioFeatureUsage.artificialWomb) },
    { name: t("admin.insights.features.sperm"), value: Math.round(data.bioFeatureUsage.spermBank) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-semibold text-text-primary">
          {t("admin.insights.title")}
        </h2>
        <p className="text-xs text-text-muted">{t("admin.insights.subtitle")}</p>
      </div>

      {/* NPS + purchase intent + persona radar (top row) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassPanel variant="elevated" className="p-5">
          <h3 className="font-display text-sm font-semibold text-text-primary mb-1 uppercase tracking-widest">
            {t("admin.insights.nps.title")}
          </h3>
          <p className="text-[11px] text-text-muted mb-4">
            {t("admin.insights.nps.subtitle")}
          </p>
          <NPSGauge nps={data.nps} t={t} />
        </GlassPanel>

        <GlassPanel variant="elevated" className="p-5">
          <h3 className="font-display text-sm font-semibold text-text-primary mb-1 uppercase tracking-widest">
            {t("admin.insights.intent.title")}
          </h3>
          <p className="text-[11px] text-text-muted mb-3">
            {t("admin.insights.intent.subtitle")}
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.purchaseBuckets}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis dataKey="score" stroke={AXIS_STROKE} fontSize={11} />
              <YAxis stroke={AXIS_STROKE} fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} labelStyle={CHART_TOOLTIP_LABEL_STYLE} />
              <Bar dataKey="count" fill={ADMIN_COLORS[1]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[11px] text-text-muted mt-2">
            {t("admin.insights.intent.footnote")}
          </p>
        </GlassPanel>

        <GlassPanel variant="elevated" className="p-5">
          <h3 className="font-display text-sm font-semibold text-text-primary mb-1 uppercase tracking-widest">
            {t("admin.insights.persona.avg.title")}
          </h3>
          <p className="text-[11px] text-text-muted mb-3">
            {t("admin.insights.persona.avg.subtitle")}
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={GRID_STROKE} />
              <PolarAngleAxis dataKey="trait" stroke={AXIS_STROKE} fontSize={11} />
              <PolarRadiusAxis stroke={GRID_STROKE} domain={[0, 100]} />
              <Radar
                dataKey="value"
                stroke={ADMIN_COLORS[0]}
                fill={ADMIN_COLORS[0]}
                fillOpacity={0.22}
              />
            </RadarChart>
          </ResponsiveContainer>
        </GlassPanel>
      </div>

      {/* Role dist + persona by role */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassPanel variant="elevated" className="p-5">
          <h3 className="font-display text-sm font-semibold text-text-primary mb-1 uppercase tracking-widest">
            {t("admin.insights.role.title")}
          </h3>
          <p className="text-[11px] text-text-muted mb-3">
            {t("admin.insights.role.subtitle")}
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data.roleDistribution.map((r) => ({
                  role: labelize(ROLE_LABEL, r.role, locale),
                  count: r.count,
                }))}
                dataKey="count"
                nameKey="role"
                cx="50%"
                cy="50%"
                outerRadius={95}
                label={({ role }) => role}
                labelLine={false}
              >
                {data.roleDistribution.map((_, i) => (
                  <Cell key={i} fill={ADMIN_COLORS[i % ADMIN_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} labelStyle={CHART_TOOLTIP_LABEL_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </GlassPanel>

        <GlassPanel variant="elevated" className="p-5">
          <h3 className="font-display text-sm font-semibold text-text-primary mb-1 uppercase tracking-widest">
            {t("admin.insights.persona.byRole.title")}
          </h3>
          <p className="text-[11px] text-text-muted mb-3">
            {t("admin.insights.persona.byRole.subtitle")}
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={data.personaByRole.map((r) => ({
                role: labelize(ROLE_LABEL, r.role, locale),
                [traitLabels.dominance]: Math.round(r.dominance),
                [traitLabels.innocence]: Math.round(r.innocence),
                [traitLabels.emotional]: Math.round(r.emotional),
                [traitLabels.humor]: Math.round(r.humor),
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis dataKey="role" stroke={AXIS_STROKE} fontSize={10} />
              <YAxis stroke={AXIS_STROKE} fontSize={10} domain={[0, 100]} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} labelStyle={CHART_TOOLTIP_LABEL_STYLE} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey={traitLabels.dominance} fill={ADMIN_COLORS[0]} />
              <Bar dataKey={traitLabels.innocence} fill={ADMIN_COLORS[1]} />
              <Bar dataKey={traitLabels.emotional} fill={ADMIN_COLORS[2]} />
              <Bar dataKey={traitLabels.humor} fill={ADMIN_COLORS[3]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassPanel>
      </div>

      {/* Physical attribute distribution */}
      <GlassPanel variant="elevated" className="p-5">
        <h3 className="font-display text-sm font-semibold text-text-primary mb-1 uppercase tracking-widest">
          {t("admin.insights.physical.title")}
        </h3>
        <p className="text-[11px] text-text-muted mb-3">
          {t("admin.insights.physical.subtitle")}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <DistributionChart
            title={t("admin.insights.physical.face")}
            data={data.physicalDistribution.face.map((d) => ({ key: labelize(FACE_LABEL, d.key, locale), count: d.count }))}
            color={ADMIN_COLORS[0]}
          />
          <DistributionChart
            title={t("admin.insights.physical.hair")}
            data={data.physicalDistribution.hair.map((d) => ({ key: labelize(HAIR_LABEL, d.key, locale), count: d.count }))}
            color={ADMIN_COLORS[1]}
          />
          <DistributionChart
            title={t("admin.insights.physical.body")}
            data={data.physicalDistribution.body.map((d) => ({ key: labelize(BODY_LABEL, d.key, locale), count: d.count }))}
            color={ADMIN_COLORS[3]}
          />
          <DistributionChart
            title={t("admin.insights.physical.skin")}
            data={data.physicalDistribution.skinTone.map((d) => ({ key: labelize(SKIN_LABEL, d.key, locale), count: d.count }))}
            color={ADMIN_COLORS[2]}
          />
        </div>
      </GlassPanel>

      {/* Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassPanel variant="elevated" className="p-5">
          <h3 className="font-display text-sm font-semibold text-text-primary mb-3 uppercase tracking-widest">
            {t("admin.insights.age.title")}
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.ageBuckets}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis dataKey="label" stroke={AXIS_STROKE} fontSize={11} />
              <YAxis stroke={AXIS_STROKE} fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} labelStyle={CHART_TOOLTIP_LABEL_STYLE} />
              <Bar dataKey="count" fill={ADMIN_COLORS[4]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassPanel>

        <GlassPanel variant="elevated" className="p-5">
          <h3 className="font-display text-sm font-semibold text-text-primary mb-3 uppercase tracking-widest">
            {t("admin.insights.relationship.title")}
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.relationshipDistribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis type="number" stroke={AXIS_STROKE} fontSize={11} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="status"
                stroke={AXIS_STROKE}
                fontSize={11}
                width={120}
              />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} labelStyle={CHART_TOOLTIP_LABEL_STYLE} />
              <Bar dataKey="count" fill={ADMIN_COLORS[5]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassPanel>
      </div>

      {/* Cross-tab: Gender × Role */}
      <GlassPanel variant="elevated" className="p-5">
        <h3 className="font-display text-sm font-semibold text-text-primary mb-1 uppercase tracking-widest">
          {t("admin.insights.crosstab.title")}
        </h3>
        <p className="text-[11px] text-text-muted mb-3">
          {t("admin.insights.crosstab.subtitle")}
        </p>
        <CrossTabHeatmap
          matrix={data.genderRoleMatrix}
          locale={locale}
          headerLabel={t("admin.insights.crosstab.header")}
          emptyLabel={t("admin.insights.crosstab.empty")}
        />
      </GlassPanel>

      {/* Hobbies + Bio features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassPanel variant="elevated" className="p-5">
          <h3 className="font-display text-sm font-semibold text-text-primary mb-1 uppercase tracking-widest">
            {t("admin.insights.hobby.title")}
          </h3>
          <p className="text-[11px] text-text-muted mb-3">
            {t("admin.insights.hobby.subtitle")}
          </p>
          {data.hobbyPopularity.length === 0 ? (
            <p className="text-text-muted text-sm">{t("admin.insights.hobby.empty")}</p>
          ) : (
            <div className="space-y-2">
              {data.hobbyPopularity.slice(0, 17).map((h) => {
                const maxVal = data.hobbyPopularity[0]?.count || 1;
                const pct = (h.count / maxVal) * 100;
                return (
                  <div key={h.hobby} className="flex items-center gap-3 text-xs">
                    <span className="text-text-primary min-w-[110px] font-display">
                      {labelize(HOBBY_LABEL, h.hobby, locale)}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-obsidian-surface overflow-hidden">
                      <div
                        className="h-full bg-cyan-accent"
                        style={{
                          width: `${pct}%`,
                          boxShadow: "0 0 8px rgba(0,240,255,0.4)",
                        }}
                      />
                    </div>
                    <span className="text-text-muted font-display tabular-nums min-w-[30px] text-right">
                      {h.count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </GlassPanel>

        <GlassPanel variant="elevated" className="p-5">
          <h3 className="font-display text-sm font-semibold text-text-primary mb-1 uppercase tracking-widest">
            {t("admin.insights.features.title")}
          </h3>
          <p className="text-[11px] text-text-muted mb-3">
            {t("admin.insights.features.subtitle")}
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={bioData}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis dataKey="name" stroke={AXIS_STROKE} fontSize={11} />
              <YAxis
                stroke={AXIS_STROKE}
                fontSize={11}
                domain={[0, 100]}
                tickFormatter={(n) => `${n}%`}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                formatter={(v) => [`${v}%`, t("admin.insights.features.adoption")]}
              />
              <Bar dataKey="value" fill={ADMIN_COLORS[1]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassPanel>
      </div>

      {/* Top combinations */}
      <GlassPanel variant="elevated" className="p-5">
        <h3 className="font-display text-sm font-semibold text-text-primary mb-1 uppercase tracking-widest">
          {t("admin.insights.topCombos.title")}
        </h3>
        <p className="text-[11px] text-text-muted mb-3">
          {t("admin.insights.topCombos.subtitle")}
        </p>
        {data.topCombinations.length === 0 ? (
          <p className="text-text-muted text-sm py-6 text-center">
            {t("admin.insights.topCombos.empty")}
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {data.topCombinations.map((c, i) => (
              <div
                key={c.imagePath}
                className="rounded-xl overflow-hidden border border-glass-border bg-obsidian-surface relative aspect-[3/4]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.imagePath}
                  alt={c.combo}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-display bg-obsidian/80 text-cyan-accent border border-cyan-accent/30">
                  #{i + 1}
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-obsidian via-obsidian/80 to-transparent p-2">
                  <p className="text-[10px] font-display uppercase tracking-widest text-text-primary truncate">
                    {t("admin.insights.topCombos.picks", { n: c.count })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassPanel>

      {/* Word cloud */}
      <GlassPanel variant="elevated" className="p-5">
        <h3 className="font-display text-sm font-semibold text-text-primary mb-1 uppercase tracking-widest">
          {t("admin.insights.wordcloud.title")}
        </h3>
        <p className="text-[11px] text-text-muted mb-3">
          {t("admin.insights.wordcloud.subtitle")}
        </p>
        {words.length === 0 ? (
          <p className="text-text-muted text-sm py-8 text-center">
            {t("admin.insights.wordcloud.empty")}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 justify-center py-4">
            {words.slice(0, 80).map((w, i) => {
              const size = Math.max(12, Math.min(36, 12 + w.value * 2));
              const opacity = Math.max(0.4, Math.min(1, 0.4 + w.value * 0.05));
              return (
                <span
                  key={w.text}
                  className="font-display"
                  style={{
                    fontSize: size,
                    color: ADMIN_COLORS[i % ADMIN_COLORS.length],
                    opacity,
                  }}
                >
                  {w.text}
                </span>
              );
            })}
          </div>
        )}
      </GlassPanel>
    </div>
  );
}

function DistributionChart({
  title,
  data,
  color,
}: {
  title: string;
  data: { key: string; count: number }[];
  color: string;
}) {
  return (
    <div>
      <h4 className="font-display text-[10px] text-text-muted uppercase tracking-widest mb-2">
        {title}
      </h4>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
          <XAxis dataKey="key" stroke={AXIS_STROKE} fontSize={10} />
          <YAxis stroke={AXIS_STROKE} fontSize={10} allowDecimals={false} />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} labelStyle={CHART_TOOLTIP_LABEL_STYLE} />
          <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function NPSGauge({
  nps,
  t,
}: {
  nps: { score: number; promoters: number; passives: number; detractors: number; total: number };
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const pct = Math.max(0, Math.min(100, (nps.score + 100) / 2));
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <span
          className={`font-display text-4xl font-bold ${
            nps.score >= 30 ? "text-bio-green" : nps.score < 0 ? "text-danger" : "text-[#FFD93D]"
          }`}
        >
          {nps.score.toFixed(1)}
        </span>
        <span className="text-[11px] font-display uppercase tracking-widest text-text-muted">
          {t("admin.insights.nps.responses", { n: nps.total })}
        </span>
      </div>
      <div className="relative h-4 rounded-full bg-obsidian-surface border border-glass-border overflow-hidden">
        <div className="absolute inset-0 flex">
          <div className="flex-1 bg-danger/40" />
          <div className="flex-1 bg-[#FFD93D]/40" />
          <div className="flex-1 bg-bio-green/40" />
        </div>
        <div
          className="absolute top-0 bottom-0 w-1 bg-text-primary"
          style={{ left: `${pct}%`, boxShadow: "0 0 10px rgba(255,255,255,0.6)" }}
        />
      </div>
      <div className="grid grid-cols-3 gap-2 text-[11px] font-display text-center">
        <div className="glass border border-danger/30 rounded-lg py-1.5">
          <p className="text-danger">{t("admin.insights.nps.detractor")}</p>
          <p className="text-text-primary font-bold text-sm">{nps.detractors}</p>
        </div>
        <div className="glass border border-[#FFD93D]/30 rounded-lg py-1.5">
          <p className="text-[#FFD93D]">{t("admin.insights.nps.passive")}</p>
          <p className="text-text-primary font-bold text-sm">{nps.passives}</p>
        </div>
        <div className="glass border border-bio-green/30 rounded-lg py-1.5">
          <p className="text-bio-green">{t("admin.insights.nps.promoter")}</p>
          <p className="text-text-primary font-bold text-sm">{nps.promoters}</p>
        </div>
      </div>
    </div>
  );
}

function CrossTabHeatmap({
  matrix,
  locale,
  headerLabel,
  emptyLabel,
}: {
  matrix: { gender: string; role: string; count: number }[];
  locale: Locale;
  headerLabel: string;
  emptyLabel: string;
}) {
  const genders = Array.from(new Set(matrix.map((m) => m.gender))).sort();
  const roles = Array.from(new Set(matrix.map((m) => m.role))).sort();
  const lookup = new Map<string, number>();
  let max = 0;
  for (const m of matrix) {
    lookup.set(`${m.gender}|${m.role}`, m.count);
    if (m.count > max) max = m.count;
  }
  if (matrix.length === 0) {
    return <p className="text-sm text-text-muted">{emptyLabel}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead>
          <tr>
            <th className="text-left px-3 py-2 text-text-muted font-display uppercase tracking-widest text-[10px]">
              {headerLabel}
            </th>
            {roles.map((r) => (
              <th
                key={r}
                className="px-3 py-2 text-text-muted font-display uppercase tracking-widest text-[10px] whitespace-nowrap"
              >
                {labelize(ROLE_LABEL, r, locale)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {genders.map((g) => (
            <tr key={g}>
              <td className="px-3 py-2 font-display text-text-secondary">
                {labelize(GENDER_LABEL, g, locale)}
              </td>
              {roles.map((r) => {
                const val = lookup.get(`${g}|${r}`) ?? 0;
                const intensity = max > 0 ? val / max : 0;
                return (
                  <td key={r} className="px-1.5 py-1.5">
                    <div
                      className="rounded-lg text-center py-3 font-display text-sm"
                      style={{
                        background: `rgba(0, 240, 255, ${0.1 + intensity * 0.55})`,
                        color: intensity > 0.5 ? "#0A0A0A" : "#F0F0F0",
                        border: "1px solid rgba(0,240,255,0.25)",
                      }}
                    >
                      {val}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

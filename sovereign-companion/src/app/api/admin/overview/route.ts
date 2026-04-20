import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKPIs, getConversionFunnel } from "@/lib/analytics";
import { requireAdmin } from "@/lib/adminAuth";

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function ago(date: Date, now: Date): string {
  const diff = Math.max(0, now.getTime() - date.getTime());
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export async function GET(req: NextRequest) {
  const deny = requireAdmin(req);
  if (deny) return deny;
  const url = new URL(req.url);
  const days = Math.max(1, Math.min(365, Number(url.searchParams.get("days") ?? 30)));
  const now = new Date();
  const rangeStart = new Date(now.getTime() - (days - 1) * 86_400_000);
  rangeStart.setHours(0, 0, 0, 0);
  const prevStart = new Date(rangeStart.getTime() - days * 86_400_000);
  const prevEnd = new Date(rangeStart.getTime() - 1);

  const [kpis, funnel, sessions, prevSessions, activityUsers] = await Promise.all([
    getKPIs(),
    getConversionFunnel(),
    prisma.session.findMany({
      where: { startedAt: { gte: rangeStart } },
      select: {
        startedAt: true,
        registeredAt: true,
        customizedAt: true,
        encounterStartAt: true,
        surveyAt: true,
      },
    }),
    prisma.session.findMany({
      where: { startedAt: { gte: prevStart, lte: prevEnd } },
      select: { startedAt: true, surveyAt: true, encounterDuration: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      include: {
        session: true,
        companionConfig: { select: { companionName: true, role: true } },
        surveyResult: { select: { overallExperience: true } },
      },
    }),
  ]);

  // Build empty per-day buckets covering the range
  const timeseriesMap = new Map<string, {
    date: string;
    registered: number;
    customized: number;
    encounter: number;
    surveyed: number;
  }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(rangeStart.getTime() + i * 86_400_000);
    const key = formatDate(d);
    timeseriesMap.set(key, {
      date: key,
      registered: 0,
      customized: 0,
      encounter: 0,
      surveyed: 0,
    });
  }
  for (const s of sessions) {
    const bump = (date: Date | null | undefined, field: "registered" | "customized" | "encounter" | "surveyed") => {
      if (!date) return;
      const key = formatDate(date);
      const row = timeseriesMap.get(key);
      if (row) row[field]++;
    };
    bump(s.registeredAt, "registered");
    bump(s.customizedAt, "customized");
    bump(s.encounterStartAt, "encounter");
    bump(s.surveyAt, "surveyed");
  }
  const timeseries = Array.from(timeseriesMap.values());

  // Hourly aggregation (0–23)
  const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
  for (const s of sessions) {
    if (s.startedAt) {
      hourly[s.startedAt.getHours()].count++;
    }
  }

  // Deltas vs previous range
  const totalDemosDelta = sessions.length - prevSessions.length;
  const curCompleted = sessions.filter((s) => s.surveyAt).length;
  const prevCompleted = prevSessions.filter((s) => s.surveyAt).length;
  const curRate = sessions.length > 0 ? (curCompleted / sessions.length) * 100 : 0;
  const prevRate = prevSessions.length > 0 ? (prevCompleted / prevSessions.length) * 100 : 0;
  const completionRateDelta = curRate - prevRate;

  const prevAvgDuration =
    prevSessions
      .filter((s) => s.encounterDuration)
      .reduce((a, s) => a + (s.encounterDuration ?? 0), 0) /
    Math.max(1, prevSessions.filter((s) => s.encounterDuration).length);
  const avgEncounterDelta = (kpis.avgEncounterDuration ?? 0) - (prevAvgDuration || 0);

  // Activity feed — return structured kind + params so the client can render
  // the label in the user's current locale (EN / ID).
  type ActivityKind =
    | "completed"
    | "dropped"
    | "encounterEnd"
    | "encounterStart"
    | "customized"
    | "registered";
  type ActivityType = "completed" | "dropped" | "in-progress" | "registered";
  type ActivityRow = {
    id: string;
    type: ActivityType;
    kind: ActivityKind;
    userName: string;
    dropStage: string | null;
    companionName: string | null;
    role: string | null;
    experience: number | null;
    ago: string;
    at: string;
  };
  const activity: ActivityRow[] = activityUsers.map((u) => {
    const s = u.session;
    let type: ActivityType = "registered";
    let kind: ActivityKind = "registered";
    let at: Date = u.createdAt;
    let dropStage: string | null = null;
    if (s?.surveyAt) {
      type = "completed";
      kind = "completed";
      at = s.surveyAt;
    } else if (s?.dropped) {
      type = "dropped";
      kind = "dropped";
      dropStage = s.dropStage ?? null;
      at = s.startedAt;
    } else if (s?.encounterEndAt) {
      type = "in-progress";
      kind = "encounterEnd";
      at = s.encounterEndAt;
    } else if (s?.encounterStartAt) {
      type = "in-progress";
      kind = "encounterStart";
      at = s.encounterStartAt;
    } else if (s?.customizedAt) {
      type = "in-progress";
      kind = "customized";
      at = s.customizedAt;
    }
    return {
      id: u.id,
      type,
      kind,
      userName: u.fullName,
      dropStage,
      companionName: u.companionConfig?.companionName ?? null,
      role: u.companionConfig?.role ?? null,
      experience: u.surveyResult?.overallExperience ?? null,
      at: at.toISOString(),
      ago: ago(at, now),
    };
  });

  return Response.json({
    kpis,
    funnel,
    timeseries,
    hourly,
    activity,
    deltas: {
      totalDemos: totalDemosDelta,
      completionRate: completionRateDelta,
      avgEncounterDuration: avgEncounterDelta,
    },
  });
}

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { loadTemplate } from "@/lib/surveyTemplate";
import { parseJsonObject } from "@/lib/companionSerialize";

const POSITIVE_RE =
  /(love|suka|bagus|amazing|incredible|beautiful|great|perfect|excited|senang|impressive|fantastic|keren|mantap|hebat|indah|wow|luar biasa|menakjubkan)/i;
const NEGATIVE_RE =
  /(hate|worst|bad|terrible|awful|concern|worried|worry|scary|takut|khawatir|kurang|buruk|jelek|creepy|uncomfortable|tidak nyaman|aneh|tidak suka)/i;

function sentimentOf(text: string): "positive" | "negative" | "neutral" {
  const pos = POSITIVE_RE.test(text);
  const neg = NEGATIVE_RE.test(text);
  if (pos && !neg) return "positive";
  if (neg && !pos) return "negative";
  return "neutral";
}

// Pull a response value for a question. Prefers rawPayload (new dynamic
// shape) and falls back to the legacy hardcoded column for the same key —
// so historical data still appears in admin views even after a template
// edit removed the question.
function readValue(
  qid: string,
  rawPayload: Record<string, unknown> | null,
  legacyRow: Record<string, unknown>,
): unknown {
  if (rawPayload) {
    if (qid in rawPayload && rawPayload[qid] !== "" && rawPayload[qid] !== null && rawPayload[qid] !== undefined) {
      return rawPayload[qid];
    }
    // Some legacy clients posted the responses at the top level of body which
    // gets archived to rawPayload as well — try that too.
  }
  if (qid in legacyRow) return legacyRow[qid];
  return null;
}

function parseMaybeJsonArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  if (typeof v !== "string" || !v) return [];
  try {
    const p = JSON.parse(v);
    if (Array.isArray(p)) return p.filter((x): x is string => typeof x === "string");
    return [];
  } catch {
    return [];
  }
}

export async function GET(req: Request) {
  const deny = requireAdmin(req);
  if (deny) return deny;

  const [template, surveys] = await Promise.all([
    loadTemplate(),
    prisma.surveyResult.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            age: true,
            relationshipStatus: true,
            companionConfig: { select: { role: true, gender: true } },
          },
        },
      },
    }),
  ]);

  // Pre-parse rawPayload once per survey for cheap repeated lookup.
  const enriched = surveys.map((s) => ({
    survey: s,
    raw: parseJsonObject<Record<string, unknown>>(s.rawPayload) ?? null,
    legacy: s as unknown as Record<string, unknown>,
  }));

  // Walk the template and build field arrays grouped by question type.
  type LikertField = { key: string; label: string; section: string };
  type ChoiceField = { key: string; label: string };
  const likertFields: LikertField[] = [];
  const npsFields: LikertField[] = [];
  const singleChoiceFields: ChoiceField[] = [];
  const multiChoiceFields: ChoiceField[] = [];
  const qualitativeFields: ChoiceField[] = [];
  const dropdownFields: ChoiceField[] = [];

  for (const sec of template.sections) {
    const sectionLabel = sec.titleEn || sec.id;
    for (const q of sec.questions) {
      switch (q.type) {
        case "likert":
          likertFields.push({ key: q.id, label: q.labelEn, section: sectionLabel });
          break;
        case "nps":
          npsFields.push({ key: q.id, label: q.labelEn, section: sectionLabel });
          break;
        case "single":
          singleChoiceFields.push({ key: q.id, label: q.labelEn });
          break;
        case "dropdown":
          dropdownFields.push({ key: q.id, label: q.labelEn });
          break;
        case "multi":
          multiChoiceFields.push({ key: q.id, label: q.labelEn });
          break;
        case "text":
        case "longtext":
          qualitativeFields.push({ key: q.id, label: q.labelEn });
          break;
      }
    }
  }

  // Likert histograms (1..5)
  const likertHistograms = likertFields.map((f) => {
    const buckets = Array.from({ length: 5 }, (_, i) => ({ score: i + 1, count: 0 }));
    const values: number[] = [];
    for (const e of enriched) {
      const raw = readValue(f.key, e.raw, e.legacy);
      const n = typeof raw === "number" ? raw : Number(raw);
      if (Number.isFinite(n) && n >= 1 && n <= 5) {
        buckets[n - 1].count++;
        values.push(n);
      }
    }
    const mean =
      values.length > 0 ? values.reduce((a, v) => a + v, 0) / values.length : 0;
    const sorted = [...values].sort((a, b) => a - b);
    const median =
      sorted.length === 0
        ? 0
        : sorted.length % 2
          ? sorted[(sorted.length - 1) / 2]
          : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
    return { ...f, buckets, mean, median, n: values.length };
  });

  // NPS histograms (0..10)
  const npsHistograms = npsFields.map((f) => {
    const buckets = Array.from({ length: 11 }, (_, i) => ({ score: i, count: 0 }));
    const values: number[] = [];
    for (const e of enriched) {
      const raw = readValue(f.key, e.raw, e.legacy);
      const n = typeof raw === "number" ? raw : Number(raw);
      if (Number.isFinite(n) && n >= 0 && n <= 10) {
        buckets[n].count++;
        values.push(n);
      }
    }
    const mean =
      values.length > 0 ? values.reduce((a, v) => a + v, 0) / values.length : 0;
    return { ...f, buckets, mean, n: values.length };
  });

  // Single-choice + dropdown distributions (same shape, displayed similarly)
  const buildChoiceDist = (fields: ChoiceField[]) =>
    fields.map((f) => {
      const counts = new Map<string, number>();
      for (const e of enriched) {
        const v = readValue(f.key, e.raw, e.legacy);
        if (typeof v === "string" && v.trim() !== "") {
          counts.set(v, (counts.get(v) ?? 0) + 1);
        }
      }
      return {
        ...f,
        buckets: Array.from(counts, ([label, count]) => ({ label, count })).sort(
          (a, b) => b.count - a.count,
        ),
      };
    });

  const singleChoice = buildChoiceDist(singleChoiceFields);
  const dropdown = buildChoiceDist(dropdownFields);

  // Multi-choice
  const multiChoice = multiChoiceFields.map((f) => {
    const counts = new Map<string, number>();
    for (const e of enriched) {
      const v = readValue(f.key, e.raw, e.legacy);
      const arr = parseMaybeJsonArray(v);
      for (const item of arr) {
        if (item.trim() !== "") counts.set(item, (counts.get(item) ?? 0) + 1);
      }
    }
    return {
      ...f,
      buckets: Array.from(counts, ([label, count]) => ({ label, count })).sort(
        (a, b) => b.count - a.count,
      ),
    };
  });

  // Qualitative
  const qualitative = qualitativeFields.map((f) => {
    const items: {
      userId: string;
      fullName: string;
      content: string;
      sentiment: "positive" | "negative" | "neutral";
      createdAt: string;
      role: string | null;
    }[] = [];
    for (const e of enriched) {
      const content = readValue(f.key, e.raw, e.legacy);
      if (typeof content === "string" && content.trim().length > 2) {
        items.push({
          userId: e.survey.user.id,
          fullName: e.survey.user.fullName,
          content: content.trim(),
          sentiment: sentimentOf(content),
          createdAt: e.survey.createdAt.toISOString(),
          role: e.survey.user.companionConfig?.role ?? null,
        });
      }
    }
    const sentimentCounts = {
      positive: items.filter((i) => i.sentiment === "positive").length,
      negative: items.filter((i) => i.sentiment === "negative").length,
      neutral: items.filter((i) => i.sentiment === "neutral").length,
    };
    return { ...f, items, sentimentCounts };
  });

  // Cross-tab: overall experience by role (uses legacy column directly — still
  // present on every SurveyResult row).
  const experienceByRole = new Map<string, { sum: number; n: number }>();
  for (const s of surveys) {
    const role = s.user.companionConfig?.role ?? "unknown";
    if (typeof s.overallExperience === "number" && s.overallExperience > 0) {
      const b = experienceByRole.get(role) ?? { sum: 0, n: 0 };
      b.sum += s.overallExperience;
      b.n++;
      experienceByRole.set(role, b);
    }
  }
  const experienceByRoleArr = Array.from(experienceByRole, ([role, b]) => ({
    role,
    avg: b.n > 0 ? b.sum / b.n : 0,
    n: b.n,
  }));

  return Response.json({
    totalSurveys: surveys.length,
    likertHistograms,
    npsHistograms,
    singleChoice,
    multiChoice,
    dropdown,
    qualitative,
    experienceByRole: experienceByRoleArr,
  });
}

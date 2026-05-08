import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import {
  LEGACY_ARRAY_FIELDS,
  LEGACY_NUMBER_FIELDS,
  LEGACY_TEXT_FIELDS,
} from "@/lib/surveyTemplate";

// Coerce Likert / numeric field. Returns undefined if missing/invalid so we
// don't overwrite a previously-set value with garbage during upsert updates.
function num(x: unknown): number | undefined {
  if (x === null || x === undefined || x === "") return undefined;
  const n = Number(x);
  return Number.isFinite(n) ? n : undefined;
}

// Multi-select arrays are stored as a JSON string (SQLite has no array type).
function arr(x: unknown): string | undefined {
  if (!Array.isArray(x)) return undefined;
  return JSON.stringify(x.filter((v) => typeof v === "string"));
}

function text(x: unknown): string | undefined {
  if (typeof x !== "string") return undefined;
  return x.trim() || undefined;
}

// New flexible payload shape from the dynamic questionnaire:
//   POST { userId, responses: { [questionId]: value, ... } }
// We also still accept legacy flat-payload shape ({ userId, personaAccuracy, ... })
// so older clients / tests don't break.

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, responses } = body as {
    userId?: string;
    responses?: Record<string, unknown>;
  };

  if (!userId) {
    return Response.json({ error: "userId is required" }, { status: 400 });
  }

  // Merge: dynamic responses override flat-shape values for the same key.
  const merged: Record<string, unknown> = { ...body };
  if (responses && typeof responses === "object") {
    for (const [k, v] of Object.entries(responses)) merged[k] = v;
  }

  // Opportunistically populate legacy hardcoded columns. This keeps backward
  // compat with the admin Insights / Drawer / Research panels that read
  // those columns directly. Anything NOT in a legacy column lives only in
  // rawPayload.
  const legacyCore: Record<string, unknown> = {
    personaAccuracy: num(merged.personaAccuracy) ?? 0,
    replacementWillingness: num(merged.replacementWillingness) ?? 0,
    mostInfluentialFeature: text(merged.mostInfluentialFeature) ?? "",
    overallExperience: num(merged.overallExperience) ?? 0,
    uiEaseOfUse: num(merged.uiEaseOfUse) ?? 0,
    conceptFeasibility: num(merged.conceptFeasibility) ?? 0,
    additionalFeedback: text(merged.additionalFeedback) ?? null,
  };

  const legacyExpanded: Record<string, unknown> = {};
  for (const key of LEGACY_NUMBER_FIELDS) {
    if (legacyCore[key] !== undefined) continue;
    const v = num(merged[key]);
    if (v !== undefined) legacyExpanded[key] = v;
  }
  for (const key of LEGACY_TEXT_FIELDS) {
    if (legacyCore[key] !== undefined) continue;
    const v = text(merged[key]);
    if (v !== undefined) legacyExpanded[key] = v;
  }
  for (const key of LEGACY_ARRAY_FIELDS) {
    const v = arr(merged[key]);
    if (v !== undefined) legacyExpanded[key] = v;
  }

  // Always archive the full payload — this is the source of truth for any
  // dynamic question that doesn't map to a legacy column.
  legacyExpanded.rawPayload = JSON.stringify(merged);

  // Cast through Record to satisfy strict Prisma input typing — values are
  // already coerced/sanitized above (num/text/arr helpers).
  const createInput = {
    userId,
    personaAccuracy: (legacyCore.personaAccuracy as number) ?? 0,
    replacementWillingness: (legacyCore.replacementWillingness as number) ?? 0,
    mostInfluentialFeature: (legacyCore.mostInfluentialFeature as string) ?? "",
    overallExperience: (legacyCore.overallExperience as number) ?? 0,
    uiEaseOfUse: (legacyCore.uiEaseOfUse as number) ?? 0,
    conceptFeasibility: (legacyCore.conceptFeasibility as number) ?? 0,
    additionalFeedback: (legacyCore.additionalFeedback as string | null) ?? null,
    ...legacyExpanded,
  };
  const result = await prisma.surveyResult.upsert({
    where: { userId },
    create: createInput,
    update: { ...legacyCore, ...legacyExpanded },
  });

  // Mark session complete — only update if a Session row exists. The mobile
  // handoff path submits after the booth has already reset, so updateMany
  // handles the zero-match case gracefully.
  await prisma.session.updateMany({
    where: { userId },
    data: { surveyAt: new Date(), completedAt: new Date() },
  });

  return Response.json({ surveyId: result.id });
}

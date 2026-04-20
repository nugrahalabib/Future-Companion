import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

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

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId } = body;

  if (!userId) {
    return Response.json({ error: "userId is required" }, { status: 400 });
  }

  // Legacy core — always required for analytics compatibility. If the expanded
  // form omits them (shouldn't happen), fall back to 0 so upsert doesn't crash.
  const core = {
    personaAccuracy: num(body.personaAccuracy) ?? 0,
    replacementWillingness: num(body.replacementWillingness) ?? 0,
    mostInfluentialFeature: text(body.mostInfluentialFeature) ?? "",
    overallExperience: num(body.overallExperience) ?? 0,
    uiEaseOfUse: num(body.uiEaseOfUse) ?? 0,
    conceptFeasibility: num(body.conceptFeasibility) ?? 0,
    additionalFeedback: text(body.additionalFeedback) ?? null,
  };

  // Expanded research fields. All optional in the schema; only send what the
  // client provided so partial submissions (if we ever allow them) don't wipe
  // prior answers on an update.
  const expanded = {
    priorAiFamiliarity: num(body.priorAiFamiliarity),
    expectationAlignment: num(body.expectationAlignment),
    firstImpression: text(body.firstImpression),
    discoverySource: text(body.discoverySource),

    customizationDepth: num(body.customizationDepth),
    stepFlowIntuitiveness: num(body.stepFlowIntuitiveness),
    visualFidelity: num(body.visualFidelity),
    customizationTimeFeel: text(body.customizationTimeFeel),
    missingCustomization: text(body.missingCustomization),

    revealImpact: num(body.revealImpact),
    revealMatchedImagination: num(body.revealMatchedImagination),
    revealEmotions: arr(body.revealEmotions),

    voiceNaturalness: num(body.voiceNaturalness),
    voiceResponsiveness: num(body.voiceResponsiveness),
    companionPresence: num(body.companionPresence),
    conversationDepth: num(body.conversationDepth),
    preferredLongerSession: num(body.preferredLongerSession),

    ethicalConcernLevel: num(body.ethicalConcernLevel),
    ethicalConcerns: arr(body.ethicalConcerns),
    impactOnHumanRelations: num(body.impactOnHumanRelations),
    socialAcceptancePrediction: num(body.socialAcceptancePrediction),

    purchaseIntent: num(body.purchaseIntent),
    expectedPriceRange: text(body.expectedPriceRange),
    preferredPricingModel: text(body.preferredPricingModel),
    willingnessToPayPremium: num(body.willingnessToPayPremium),
    primaryUseCase: arr(body.primaryUseCase),
    targetDemographic: arr(body.targetDemographic),

    emotionalConnection: num(body.emotionalConnection),
    feltJudgedOrSafe: num(body.feltJudgedOrSafe),
    wouldMissCompanion: num(body.wouldMissCompanion),
    lonelinessAssist: num(body.lonelinessAssist),

    biggestConcern: text(body.biggestConcern),
    mostMemorableMoment: text(body.mostMemorableMoment),
    improvementSuggestion: text(body.improvementSuggestion),

    npsScore: num(body.npsScore),
    exhibitionQuality: num(body.exhibitionQuality),
    willRecommend: num(body.willRecommend),

    rawPayload: JSON.stringify(body),
  };

  // Strip keys whose values are undefined so Prisma doesn't try to set them.
  const cleanExpanded = Object.fromEntries(
    Object.entries(expanded).filter(([, v]) => v !== undefined),
  );

  const result = await prisma.surveyResult.upsert({
    where: { userId },
    create: { userId, ...core, ...cleanExpanded },
    update: { ...core, ...cleanExpanded },
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

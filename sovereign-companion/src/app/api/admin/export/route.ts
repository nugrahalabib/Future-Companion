import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseFeatures, parseHobbies, parseJsonObject, type FeaturesShape } from "@/lib/companionSerialize";
import {
  buildUserWhere,
  buildOrderBy,
  parseFilterFromSearchParams,
} from "@/lib/admin/filterBuilder";
import { requireAdmin } from "@/lib/adminAuth";

type ExportKind = "respondents" | "survey" | "transcripts";

const csvQ = (v: unknown): string => {
  if (v === null || v === undefined) return '""';
  const s = String(v).replace(/"/g, '""').replace(/\r?\n/g, " ");
  return `"${s}"`;
};

const anonymize = (u: {
  id: string;
  fullName: string;
  email: string;
  nickname: string;
}) => ({
  id: `anon-${u.id.slice(-6)}`,
  fullName: "Anonymous",
  email: `user-${u.id.slice(-6)}@redacted.local`,
  nickname: "",
});

export async function GET(req: NextRequest) {
  const deny = requireAdmin(req);
  if (deny) return deny;
  const url = new URL(req.url);
  const format = (url.searchParams.get("format") as "json" | "csv") || "csv";
  const kind = (url.searchParams.get("kind") as ExportKind) || "respondents";
  const anonymizeFlag = url.searchParams.get("anonymize") === "1";

  const filter = parseFilterFromSearchParams(url.searchParams);
  const where = buildUserWhere(filter);
  const orderBy = buildOrderBy(filter);

  const users = await prisma.user.findMany({
    where,
    orderBy,
    include: {
      companionConfig: true,
      transcripts: { orderBy: { sequenceOrder: "asc" } },
      surveyResult: true,
      session: true,
    },
  });

  const filename = `sovereign-${kind}-${Date.now()}.${format}`;
  const headers = (contentType: string) =>
    new Headers({
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename=${filename}`,
    });

  if (kind === "transcripts") {
    if (format === "json") {
      const payload = users.map((u) => {
        const ident = anonymizeFlag
          ? anonymize(u)
          : { id: u.id, fullName: u.fullName, email: u.email, nickname: u.nickname };
        return {
          user: ident,
          companion: u.companionConfig
            ? {
                companionName: u.companionConfig.companionName,
                role: u.companionConfig.role,
                gender: u.companionConfig.gender,
              }
            : null,
          session: u.session
            ? {
                encounterStart: u.session.encounterStartAt?.toISOString() ?? null,
                encounterEnd: u.session.encounterEndAt?.toISOString() ?? null,
                durationSec: u.session.encounterDuration ?? null,
              }
            : null,
          transcript: u.transcripts.map((t) => ({
            role: t.role,
            content: t.content,
            sequenceOrder: t.sequenceOrder,
            timestamp: t.timestamp.toISOString(),
          })),
        };
      });
      return new Response(JSON.stringify(payload, null, 2), {
        headers: headers("application/json"),
      });
    }
    // CSV (flattened: one row per transcript turn)
    const rows: string[] = [];
    rows.push(
      [
        "userId",
        "fullName",
        "email",
        "companionName",
        "sequenceOrder",
        "role",
        "timestamp",
        "content",
      ].join(","),
    );
    for (const u of users) {
      const ident = anonymizeFlag ? anonymize(u) : { id: u.id, fullName: u.fullName, email: u.email };
      for (const t of u.transcripts) {
        rows.push(
          [
            csvQ(ident.id),
            csvQ(ident.fullName),
            csvQ(ident.email),
            csvQ(u.companionConfig?.companionName ?? ""),
            t.sequenceOrder,
            csvQ(t.role),
            csvQ(t.timestamp.toISOString()),
            csvQ(t.content),
          ].join(","),
        );
      }
    }
    return new Response(rows.join("\n"), { headers: headers("text/csv") });
  }

  // respondents + survey share the master row format. The only difference is
  // that "survey" omits users without a surveyResult entirely.
  const dataUsers = kind === "survey" ? users.filter((u) => u.surveyResult) : users;

  if (format === "json") {
    const payload = dataUsers.map((u) => {
      const ident = anonymizeFlag
        ? anonymize(u)
        : { id: u.id, fullName: u.fullName, email: u.email, nickname: u.nickname };
      return {
        ...ident,
        age: u.age,
        profession: u.profession,
        relationshipStatus: u.relationshipStatus,
        createdAt: u.createdAt.toISOString(),
        companionConfig: u.companionConfig
          ? {
              ...u.companionConfig,
              hobbies: parseHobbies(u.companionConfig.hobbies),
              features: parseFeatures(u.companionConfig.features),
              fullConfig: parseJsonObject(u.companionConfig.fullConfig),
              createdAt: u.companionConfig.createdAt.toISOString(),
              updatedAt: u.companionConfig.updatedAt.toISOString(),
            }
          : null,
        session: u.session
          ? {
              ...u.session,
              startedAt: u.session.startedAt.toISOString(),
              registeredAt: u.session.registeredAt?.toISOString() ?? null,
              customizedAt: u.session.customizedAt?.toISOString() ?? null,
              assembledAt: u.session.assembledAt?.toISOString() ?? null,
              encounterStartAt: u.session.encounterStartAt?.toISOString() ?? null,
              encounterEndAt: u.session.encounterEndAt?.toISOString() ?? null,
              checkoutAt: u.session.checkoutAt?.toISOString() ?? null,
              surveyAt: u.session.surveyAt?.toISOString() ?? null,
              completedAt: u.session.completedAt?.toISOString() ?? null,
            }
          : null,
        survey: u.surveyResult
          ? {
              ...u.surveyResult,
              rawPayload: parseJsonObject(u.surveyResult.rawPayload),
              createdAt: u.surveyResult.createdAt.toISOString(),
            }
          : null,
        transcriptCount: u.transcripts.length,
      };
    });
    return new Response(JSON.stringify(payload, null, 2), {
      headers: headers("application/json"),
    });
  }

  // CSV — reuses the same column layout as the old exporter so existing
  // downstream tooling keeps working.
  const parseArr = (raw: string | null | undefined): string[] => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  };
  const rows: string[] = [];
  rows.push(
    [
      "userId", "fullName", "nickname", "email", "age", "profession", "relationshipStatus",
      "gender", "faceShape", "hairStyle", "bodyBuild", "skinTone",
      "artificialWomb", "spermBank",
      "role", "dominanceLevel", "innocenceLevel", "emotionalLevel", "humorStyle",
      "hobbies", "finalImagePath",
      "personaAccuracy", "replacementWillingness", "overallExperience", "uiEaseOfUse",
      "conceptFeasibility", "mostInfluentialFeature", "additionalFeedback",
      "priorAiFamiliarity", "expectationAlignment", "firstImpression", "discoverySource",
      "customizationDepth", "stepFlowIntuitiveness", "visualFidelity",
      "customizationTimeFeel", "missingCustomization",
      "revealImpact", "revealMatchedImagination", "revealEmotions",
      "voiceNaturalness", "voiceResponsiveness", "companionPresence",
      "conversationDepth", "preferredLongerSession",
      "ethicalConcernLevel", "ethicalConcerns",
      "impactOnHumanRelations", "socialAcceptancePrediction",
      "purchaseIntent", "expectedPriceRange", "preferredPricingModel", "willingnessToPayPremium",
      "primaryUseCase", "targetDemographic",
      "emotionalConnection", "feltJudgedOrSafe", "wouldMissCompanion", "lonelinessAssist",
      "biggestConcern", "mostMemorableMoment", "improvementSuggestion",
      "npsScore", "exhibitionQuality", "willRecommend",
      "encounterDuration", "completedAt", "transcriptCount",
    ].join(","),
  );
  for (const user of dataUsers) {
    const ident = anonymizeFlag
      ? anonymize(user)
      : { id: user.id, fullName: user.fullName, email: user.email, nickname: user.nickname };
    const c = user.companionConfig;
    const s = user.surveyResult as typeof user.surveyResult & Record<string, unknown> | null;
    const sess = user.session;
    const features: FeaturesShape = c ? parseFeatures(c.features) : {};
    const hobbies: string[] = c ? parseHobbies(c.hobbies) : [];
    const val = (k: string): unknown =>
      s ? (s as Record<string, unknown>)[k] ?? "" : "";
    const arrVal = (k: string): string =>
      s ? parseArr((s as Record<string, string | null | undefined>)[k]).join(";") : "";

    rows.push(
      [
        csvQ(ident.id),
        csvQ(ident.fullName),
        csvQ(ident.nickname),
        csvQ(ident.email),
        user.age,
        csvQ(user.profession),
        csvQ(user.relationshipStatus),
        csvQ(c?.gender ?? ""),
        csvQ(c?.faceShape ?? ""),
        csvQ(c?.hairStyle ?? ""),
        csvQ(c?.bodyBuild ?? ""),
        csvQ(c?.skinTone ?? ""),
        features.artificialWomb ? "true" : "false",
        features.spermBank ? "true" : "false",
        csvQ(c?.role ?? ""),
        c?.dominanceLevel ?? "",
        c?.innocenceLevel ?? "",
        c?.emotionalLevel ?? "",
        c?.humorStyle ?? "",
        csvQ(hobbies.join(";")),
        csvQ(c?.finalImagePath ?? ""),
        s?.personaAccuracy ?? "",
        s?.replacementWillingness ?? "",
        s?.overallExperience ?? "",
        s?.uiEaseOfUse ?? "",
        s?.conceptFeasibility ?? "",
        csvQ(s?.mostInfluentialFeature ?? ""),
        csvQ(s?.additionalFeedback ?? ""),
        val("priorAiFamiliarity"),
        val("expectationAlignment"),
        csvQ(val("firstImpression")),
        csvQ(val("discoverySource")),
        val("customizationDepth"),
        val("stepFlowIntuitiveness"),
        val("visualFidelity"),
        csvQ(val("customizationTimeFeel")),
        csvQ(val("missingCustomization")),
        val("revealImpact"),
        val("revealMatchedImagination"),
        csvQ(arrVal("revealEmotions")),
        val("voiceNaturalness"),
        val("voiceResponsiveness"),
        val("companionPresence"),
        val("conversationDepth"),
        val("preferredLongerSession"),
        val("ethicalConcernLevel"),
        csvQ(arrVal("ethicalConcerns")),
        val("impactOnHumanRelations"),
        val("socialAcceptancePrediction"),
        val("purchaseIntent"),
        csvQ(val("expectedPriceRange")),
        csvQ(val("preferredPricingModel")),
        val("willingnessToPayPremium"),
        csvQ(arrVal("primaryUseCase")),
        csvQ(arrVal("targetDemographic")),
        val("emotionalConnection"),
        val("feltJudgedOrSafe"),
        val("wouldMissCompanion"),
        val("lonelinessAssist"),
        csvQ(val("biggestConcern")),
        csvQ(val("mostMemorableMoment")),
        csvQ(val("improvementSuggestion")),
        val("npsScore"),
        val("exhibitionQuality"),
        val("willRecommend"),
        sess?.encounterDuration ?? "",
        sess?.completedAt?.toISOString() ?? "",
        user.transcripts.length,
      ].join(","),
    );
  }
  return new Response(rows.join("\n"), { headers: headers("text/csv") });
}

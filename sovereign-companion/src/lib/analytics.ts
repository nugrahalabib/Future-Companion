import { prisma } from "./prisma";
import { parseFeatures, parseHobbies, type FeaturesShape } from "./companionSerialize";

export async function getKPIs() {
  const [totalSessions, completedSessions, avgDuration, avgExperience] =
    await Promise.all([
      prisma.session.count(),
      prisma.session.count({ where: { completedAt: { not: null } } }),
      prisma.session.aggregate({
        _avg: { encounterDuration: true },
        where: { encounterDuration: { not: null } },
      }),
      prisma.surveyResult.aggregate({
        _avg: { overallExperience: true },
      }),
    ]);

  return {
    totalDemos: totalSessions,
    completionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
    avgEncounterDuration: avgDuration._avg.encounterDuration ?? 0,
    avgExperienceScore: avgExperience._avg.overallExperience ?? 0,
  };
}

export async function getConversionFunnel() {
  const [
    registered,
    customized,
    assembled,
    encounterStarted,
    encounterCompleted,
    checkedOut,
    surveyed,
  ] = await Promise.all([
    prisma.session.count({ where: { registeredAt: { not: null } } }),
    prisma.session.count({ where: { customizedAt: { not: null } } }),
    prisma.session.count({ where: { assembledAt: { not: null } } }),
    prisma.session.count({ where: { encounterStartAt: { not: null } } }),
    prisma.session.count({ where: { encounterEndAt: { not: null } } }),
    prisma.session.count({ where: { checkoutAt: { not: null } } }),
    prisma.session.count({ where: { surveyAt: { not: null } } }),
  ]);

  return [
    { stage: "Registered", count: registered },
    { stage: "Customized", count: customized },
    { stage: "Assembled", count: assembled },
    { stage: "Encounter Started", count: encounterStarted },
    { stage: "Encounter Completed", count: encounterCompleted },
    { stage: "Checkout", count: checkedOut },
    { stage: "Survey Completed", count: surveyed },
  ];
}

export async function getPreferenceHeatmap() {
  const [configs, roleCounts, faceCounts, hairCounts, bodyCounts, skinCounts, comboRaw, avgPersona] =
    await Promise.all([
      prisma.companionConfig.findMany({
        select: { hobbies: true, features: true },
      }),
      prisma.companionConfig.groupBy({ by: ["role"], _count: true }),
      prisma.companionConfig.groupBy({ by: ["faceShape"], _count: true }),
      prisma.companionConfig.groupBy({ by: ["hairStyle"], _count: true }),
      prisma.companionConfig.groupBy({ by: ["bodyBuild"], _count: true }),
      prisma.companionConfig.groupBy({ by: ["skinTone"], _count: true }),
      prisma.companionConfig.groupBy({
        by: ["finalImagePath"],
        _count: true,
        where: { finalImagePath: { not: null } },
      }),
      prisma.companionConfig.aggregate({
        _avg: {
          dominanceLevel: true,
          innocenceLevel: true,
          emotionalLevel: true,
          humorStyle: true,
        },
      }),
    ]);

  const hobbyCount: Record<string, number> = {};
  for (const c of configs) {
    for (const h of parseHobbies(c.hobbies)) {
      hobbyCount[h] = (hobbyCount[h] || 0) + 1;
    }
  }

  const totalConfigs = configs.length || 1;
  let wombCount = 0;
  let spermCount = 0;
  for (const c of configs) {
    const f = parseFeatures(c.features);
    if (f.artificialWomb) wombCount++;
    if (f.spermBank) spermCount++;
  }
  const bioFeatureUsage = {
    artificialWomb: (wombCount / totalConfigs) * 100,
    spermBank: (spermCount / totalConfigs) * 100,
  };

  const topCombinations = comboRaw
    .map((row) => ({
      combo: (row.finalImagePath ?? "unknown")
        .replace(/^\/companion-assets\/final\//, "")
        .replace(/\.(svg|jpg|png)$/, ""),
      count: row._count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    roleDistribution: roleCounts.map((r) => ({ role: r.role, count: r._count })),
    averagePersona: avgPersona._avg,
    physicalDistribution: {
      face: faceCounts.map((r) => ({ key: r.faceShape ?? "unset", count: r._count })),
      hair: hairCounts.map((r) => ({ key: r.hairStyle ?? "unset", count: r._count })),
      body: bodyCounts.map((r) => ({ key: r.bodyBuild ?? "unset", count: r._count })),
      skinTone: skinCounts.map((r) => ({ key: r.skinTone, count: r._count })),
    },
    topCombinations,
    hobbyPopularity: Object.entries(hobbyCount)
      .map(([hobby, count]) => ({ hobby, count }))
      .sort((a, b) => b.count - a.count),
    bioFeatureUsage,
  };
}

export async function getWordCloudData() {
  const transcripts = await prisma.transcript.findMany({
    select: { content: true },
  });

  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "can", "shall", "i", "you", "he", "she",
    "it", "we", "they", "me", "him", "her", "us", "them", "my", "your",
    "his", "its", "our", "their", "this", "that", "these", "those",
    "and", "but", "or", "not", "no", "so", "if", "of", "in", "to",
    "for", "with", "on", "at", "by", "from", "as", "into", "about",
    "than", "after", "before", "just", "also", "very", "too", "only",
    "yang", "dan", "di", "ke", "dari", "untuk", "dengan", "ini",
    "itu", "ada", "saya", "aku", "kamu", "dia", "apa", "ya", "tidak",
    "bisa", "sudah", "jadi", "lebih", "sangat", "seperti", "tapi",
  ]);

  const wordCount: Record<string, number> = {};
  for (const t of transcripts) {
    const words = t.content
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/);
    for (const w of words) {
      if (w.length > 2 && !stopWords.has(w)) {
        wordCount[w] = (wordCount[w] || 0) + 1;
      }
    }
  }

  return Object.entries(wordCount)
    .map(([text, value]) => ({ text, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 100);
}

export async function getExportData(format: "json" | "csv") {
  const data = await prisma.user.findMany({
    include: {
      companionConfig: true,
      transcripts: { orderBy: { sequenceOrder: "asc" } },
      surveyResult: true,
      session: true,
    },
  });

  if (format === "json") {
    return data.map((u) => ({
      ...u,
      companionConfig: u.companionConfig
        ? {
            ...u.companionConfig,
            hobbies: parseHobbies(u.companionConfig.hobbies),
            features: parseFeatures(u.companionConfig.features),
          }
        : null,
    }));
  }

  // CSV escape helper — quote + double any inner quotes so Excel / Sheets
  // don't split on commas inside open-ended answers.
  const q = (v: unknown): string => {
    if (v === null || v === undefined) return '""';
    const s = String(v).replace(/"/g, '""').replace(/\r?\n/g, " ");
    return `"${s}"`;
  };

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
      // Identity
      "userId", "fullName", "nickname", "email", "age", "profession", "relationshipStatus",
      // Companion config
      "gender", "faceShape", "hairStyle", "bodyBuild", "skinTone",
      "artificialWomb", "spermBank",
      "role", "dominanceLevel", "innocenceLevel", "emotionalLevel", "humorStyle",
      "hobbies", "finalImagePath",
      // Survey — legacy
      "personaAccuracy", "replacementWillingness", "overallExperience", "uiEaseOfUse",
      "conceptFeasibility", "mostInfluentialFeature", "additionalFeedback",
      // Survey — expanded research fields
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
      // Session
      "encounterDuration", "completedAt",
    ].join(","),
  );

  for (const user of data) {
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
        q(user.id),
        q(user.fullName),
        q(user.nickname),
        q(user.email),
        user.age,
        q(user.profession),
        q(user.relationshipStatus),
        q(c?.gender ?? ""),
        q(c?.faceShape ?? ""),
        q(c?.hairStyle ?? ""),
        q(c?.bodyBuild ?? ""),
        q(c?.skinTone ?? ""),
        features.artificialWomb ? "true" : "false",
        features.spermBank ? "true" : "false",
        q(c?.role ?? ""),
        c?.dominanceLevel ?? "",
        c?.innocenceLevel ?? "",
        c?.emotionalLevel ?? "",
        c?.humorStyle ?? "",
        q(hobbies.join(";")),
        q(c?.finalImagePath ?? ""),
        s?.personaAccuracy ?? "",
        s?.replacementWillingness ?? "",
        s?.overallExperience ?? "",
        s?.uiEaseOfUse ?? "",
        s?.conceptFeasibility ?? "",
        q(s?.mostInfluentialFeature ?? ""),
        q(s?.additionalFeedback ?? ""),
        val("priorAiFamiliarity"),
        val("expectationAlignment"),
        q(val("firstImpression")),
        q(val("discoverySource")),
        val("customizationDepth"),
        val("stepFlowIntuitiveness"),
        val("visualFidelity"),
        q(val("customizationTimeFeel")),
        q(val("missingCustomization")),
        val("revealImpact"),
        val("revealMatchedImagination"),
        q(arrVal("revealEmotions")),
        val("voiceNaturalness"),
        val("voiceResponsiveness"),
        val("companionPresence"),
        val("conversationDepth"),
        val("preferredLongerSession"),
        val("ethicalConcernLevel"),
        q(arrVal("ethicalConcerns")),
        val("impactOnHumanRelations"),
        val("socialAcceptancePrediction"),
        val("purchaseIntent"),
        q(val("expectedPriceRange")),
        q(val("preferredPricingModel")),
        val("willingnessToPayPremium"),
        q(arrVal("primaryUseCase")),
        q(arrVal("targetDemographic")),
        val("emotionalConnection"),
        val("feltJudgedOrSafe"),
        val("wouldMissCompanion"),
        val("lonelinessAssist"),
        q(val("biggestConcern")),
        q(val("mostMemorableMoment")),
        q(val("improvementSuggestion")),
        val("npsScore"),
        val("exhibitionQuality"),
        val("willRecommend"),
        sess?.encounterDuration ?? "",
        sess?.completedAt ?? "",
      ].join(","),
    );
  }

  return rows.join("\n");
}

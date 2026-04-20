import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  buildOrderBy,
  buildUserWhere,
  parseFilterFromSearchParams,
} from "@/lib/admin/filterBuilder";
import { parseFeatures, parseHobbies } from "@/lib/companionSerialize";
import { requireAdmin } from "@/lib/adminAuth";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 200;

export async function GET(req: NextRequest) {
  const deny = requireAdmin(req);
  if (deny) return deny;
  const url = new URL(req.url);
  const filter = parseFilterFromSearchParams(url.searchParams);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number(url.searchParams.get("limit") ?? DEFAULT_LIMIT)),
  );

  const where = buildUserWhere(filter);
  const orderBy = buildOrderBy(filter);

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        companionConfig: {
          select: {
            gender: true,
            role: true,
            faceShape: true,
            hairStyle: true,
            bodyBuild: true,
            skinTone: true,
            features: true,
            hobbies: true,
            companionName: true,
            finalImagePath: true,
            dominanceLevel: true,
            innocenceLevel: true,
            emotionalLevel: true,
            humorStyle: true,
          },
        },
        session: {
          select: {
            startedAt: true,
            registeredAt: true,
            customizedAt: true,
            assembledAt: true,
            encounterStartAt: true,
            encounterEndAt: true,
            checkoutAt: true,
            surveyAt: true,
            completedAt: true,
            encounterDuration: true,
            dropped: true,
            dropStage: true,
          },
        },
        surveyResult: {
          select: {
            overallExperience: true,
            personaAccuracy: true,
            npsScore: true,
            purchaseIntent: true,
            mostInfluentialFeature: true,
          },
        },
        _count: { select: { transcripts: true } },
      },
    }),
  ]);

  // Furthest stage reached helps the table show progress at a glance
  const stageOf = (s: (typeof users)[number]["session"]): string => {
    if (!s) return "Registered";
    if (s.completedAt || s.surveyAt) return "Completed";
    if (s.checkoutAt) return "Checkout";
    if (s.encounterEndAt) return "Encounter Ended";
    if (s.encounterStartAt) return "Encounter Active";
    if (s.assembledAt) return "Assembled";
    if (s.customizedAt) return "Customized";
    if (s.registeredAt) return "Registered";
    return "Registered";
  };

  const rows = users.map((u) => {
    const c = u.companionConfig;
    const features = c ? parseFeatures(c.features) : {};
    const hobbies = c ? parseHobbies(c.hobbies) : [];
    return {
      id: u.id,
      fullName: u.fullName,
      nickname: u.nickname,
      email: u.email,
      age: u.age,
      profession: u.profession,
      relationshipStatus: u.relationshipStatus,
      createdAt: u.createdAt.toISOString(),
      companion: c
        ? {
            companionName: c.companionName,
            gender: c.gender,
            role: c.role,
            faceShape: c.faceShape,
            hairStyle: c.hairStyle,
            bodyBuild: c.bodyBuild,
            skinTone: c.skinTone,
            finalImagePath: c.finalImagePath,
            features,
            hobbies,
            persona: {
              dominance: c.dominanceLevel,
              innocence: c.innocenceLevel,
              emotional: c.emotionalLevel,
              humor: c.humorStyle,
            },
          }
        : null,
      stage: stageOf(u.session),
      dropped: u.session?.dropped ?? false,
      dropStage: u.session?.dropStage ?? null,
      encounterDuration: u.session?.encounterDuration ?? null,
      surveyedAt: u.session?.surveyAt?.toISOString() ?? null,
      completedAt: u.session?.completedAt?.toISOString() ?? null,
      experience: u.surveyResult?.overallExperience ?? null,
      nps: u.surveyResult?.npsScore ?? null,
      purchaseIntent: u.surveyResult?.purchaseIntent ?? null,
      personaAccuracy: u.surveyResult?.personaAccuracy ?? null,
      transcriptCount: u._count.transcripts,
    };
  });

  // Filter option hints — distinct values for the filter panel. Cheap because
  // the cardinality is bounded (2 genders, 2 face shapes, etc).
  const [professions, relationships] = await Promise.all([
    prisma.user.findMany({
      distinct: ["profession"],
      select: { profession: true },
      orderBy: { profession: "asc" },
      take: 100,
    }),
    prisma.user.findMany({
      distinct: ["relationshipStatus"],
      select: { relationshipStatus: true },
      orderBy: { relationshipStatus: "asc" },
      take: 40,
    }),
  ]);

  return Response.json({
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    rows,
    options: {
      professions: professions.map((p) => p.profession).filter(Boolean),
      relationships: relationships.map((r) => r.relationshipStatus).filter(Boolean),
    },
  });
}

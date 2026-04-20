import { prisma } from "@/lib/prisma";
import { parseFeatures, parseHobbies, parseJsonObject } from "@/lib/companionSerialize";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const deny = requireAdmin(req);
  if (deny) return deny;
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      companionConfig: true,
      session: true,
      surveyResult: true,
      transcripts: { orderBy: { sequenceOrder: "asc" } },
    },
  });

  if (!user) return Response.json({ error: "not found" }, { status: 404 });

  const c = user.companionConfig;
  const survey = user.surveyResult;

  // Lazy survey-section helper: strip rawPayload from payload (we surface it
  // separately so the raw JSON stays inspectable) and coerce nullish→null.
  const surveyPublic = survey
    ? {
        ...survey,
        createdAt: survey.createdAt.toISOString(),
        rawPayload: parseJsonObject(survey.rawPayload),
      }
    : null;

  return Response.json({
    user: {
      id: user.id,
      fullName: user.fullName,
      nickname: user.nickname,
      email: user.email,
      age: user.age,
      profession: user.profession,
      relationshipStatus: user.relationshipStatus,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
    companion: c
      ? {
          ...c,
          userNicknames: parseJsonObject<string[]>(c.userNickname) ?? c.userNickname,
          features: parseFeatures(c.features),
          hobbies: parseHobbies(c.hobbies),
          fullConfig: parseJsonObject(c.fullConfig),
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
        }
      : null,
    session: user.session
      ? {
          ...user.session,
          startedAt: user.session.startedAt.toISOString(),
          registeredAt: user.session.registeredAt?.toISOString() ?? null,
          customizedAt: user.session.customizedAt?.toISOString() ?? null,
          assembledAt: user.session.assembledAt?.toISOString() ?? null,
          encounterStartAt: user.session.encounterStartAt?.toISOString() ?? null,
          encounterEndAt: user.session.encounterEndAt?.toISOString() ?? null,
          checkoutAt: user.session.checkoutAt?.toISOString() ?? null,
          surveyAt: user.session.surveyAt?.toISOString() ?? null,
          completedAt: user.session.completedAt?.toISOString() ?? null,
        }
      : null,
    survey: surveyPublic,
    transcripts: user.transcripts.map((t) => ({
      id: t.id,
      role: t.role,
      content: t.content,
      sequenceOrder: t.sequenceOrder,
      metadata: parseJsonObject(t.metadata),
      timestamp: t.timestamp.toISOString(),
    })),
  });
}

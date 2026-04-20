import { prisma } from "@/lib/prisma";
import { parseJsonObject } from "@/lib/companionSerialize";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const deny = requireAdmin(req);
  if (deny) return deny;
  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      companionConfig: true,
      transcripts: { orderBy: { sequenceOrder: "asc" } },
      session: true,
    },
  });

  if (!user) return Response.json({ error: "not found" }, { status: 404 });

  return Response.json({
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      profession: user.profession,
      age: user.age,
    },
    companion: user.companionConfig
      ? {
          companionName: user.companionConfig.companionName,
          gender: user.companionConfig.gender,
          role: user.companionConfig.role,
          finalImagePath: user.companionConfig.finalImagePath,
        }
      : null,
    session: user.session
      ? {
          encounterStart: user.session.encounterStartAt?.toISOString() ?? null,
          encounterEnd: user.session.encounterEndAt?.toISOString() ?? null,
          durationSec: user.session.encounterDuration ?? null,
        }
      : null,
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

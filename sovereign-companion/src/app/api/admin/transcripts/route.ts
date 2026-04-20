import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const minLength = Number(url.searchParams.get("minLength") ?? 1);
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") ?? 100)));

  // Group transcripts by user, compute summary stats. SQLite + Prisma has no
  // direct `groupBy` + text aggregate, so we fetch and reduce in JS. For the
  // exhibition-scale volume (hundreds of users) this is fine.
  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { fullName: { contains: q } },
            { email: { contains: q } },
            { companionConfig: { is: { companionName: { contains: q } } } },
            { transcripts: { some: { content: { contains: q } } } },
          ],
        }
      : {},
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      companionConfig: {
        select: { companionName: true, role: true, gender: true, finalImagePath: true },
      },
      transcripts: {
        orderBy: { sequenceOrder: "asc" },
        select: { role: true, content: true, sequenceOrder: true, timestamp: true },
      },
      session: {
        select: {
          encounterStartAt: true,
          encounterEndAt: true,
          encounterDuration: true,
        },
      },
    },
  });

  const rows = users
    .filter((u) => u.transcripts.length >= minLength)
    .map((u) => {
      const userLines = u.transcripts.filter((t) => t.role === "user");
      const botLines = u.transcripts.filter((t) => t.role !== "user");
      const totalWords = u.transcripts.reduce(
        (a, t) => a + t.content.split(/\s+/).filter(Boolean).length,
        0,
      );
      const preview =
        u.transcripts.find((t) => t.role === "user")?.content?.slice(0, 140) ?? "";
      return {
        userId: u.id,
        fullName: u.fullName,
        email: u.email,
        companionName: u.companionConfig?.companionName ?? "",
        gender: u.companionConfig?.gender ?? null,
        role: u.companionConfig?.role ?? null,
        finalImagePath: u.companionConfig?.finalImagePath ?? null,
        encounterStart: u.session?.encounterStartAt?.toISOString() ?? null,
        encounterEnd: u.session?.encounterEndAt?.toISOString() ?? null,
        durationSec: u.session?.encounterDuration ?? null,
        turns: u.transcripts.length,
        userTurns: userLines.length,
        botTurns: botLines.length,
        totalWords,
        preview,
      };
    });

  return Response.json({ rows, total: rows.length });
}

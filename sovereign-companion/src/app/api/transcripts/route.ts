import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { getDemoStatus } from "@/lib/demoMode";

export async function POST(req: NextRequest) {
  const status = await getDemoStatus();
  if (!status.active) {
    return Response.json(
      { error: "demo_paused", reason: status.reason, message: status.message },
      { status: 503 },
    );
  }
  const body = await req.json();
  const { userId, entries } = body;

  if (!userId || !entries || !Array.isArray(entries)) {
    return Response.json({ error: "userId and entries array required" }, { status: 400 });
  }

  const transcripts = await prisma.transcript.createMany({
    data: entries.map((entry: { role: string; content: string; timestamp: number }, index: number) => ({
      userId,
      role: entry.role,
      content: entry.content,
      sequenceOrder: index,
      timestamp: new Date(entry.timestamp),
    })),
  });

  // Update session
  await prisma.session.updateMany({
    where: { userId },
    data: { encounterEndAt: new Date() },
  });

  return Response.json({ count: transcripts.count });
}

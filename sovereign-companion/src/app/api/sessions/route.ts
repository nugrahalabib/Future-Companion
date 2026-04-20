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
  const { userId } = body;

  const session = await prisma.session.upsert({
    where: { userId },
    create: { userId },
    update: { startedAt: new Date() },
  });

  return Response.json({ sessionId: session.id });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { sessionId, ...data } = body;

  const session = await prisma.session.update({
    where: { id: sessionId },
    data,
  });

  return Response.json({ session });
}

import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getDemoStatus } from "@/lib/demoMode";
import { isValidAgeLowerBound } from "@/lib/ageRanges";
import { isValid2076Profession } from "@/lib/professions";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return Response.json({ error: "Email is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      session: true,
      companionConfig: true,
    },
  });

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const session = user.session;
  const hasConfig = !!user.companionConfig;

  let resumeStage = 2;
  if (hasConfig) resumeStage = 3;
  if (session?.customizedAt) resumeStage = 4;
  if (session?.assembledAt) resumeStage = 5;
  if (session?.encounterStartAt) resumeStage = 5;
  if (session?.encounterEndAt) resumeStage = 6;
  if (session?.checkoutAt) resumeStage = 7;
  if (session?.completedAt || session?.surveyAt) resumeStage = 8;

  return Response.json({
    userId: user.id,
    fullName: user.fullName,
    nickname: user.nickname,
    email: user.email,
    age: user.age,
    profession: user.profession,
    relationshipStatus: user.relationshipStatus,
    sessionId: session?.id ?? null,
    resumeStage,
  });
}

export async function POST(req: NextRequest) {
  const status = await getDemoStatus();
  if (!status.active) {
    return Response.json(
      { error: "demo_paused", reason: status.reason, message: status.message },
      { status: 503 },
    );
  }
  const body = await req.json();
  const action = body.action as "register" | "resume" | undefined;

  if (action === "resume") {
    const rawEmail = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!rawEmail || !password) {
      return Response.json({ error: "Email and password are required" }, { status: 400 });
    }
    const email = rawEmail.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
      include: { session: true, companionConfig: true },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const session = user.session;
    const hasConfig = !!user.companionConfig;

    let resumeStage = 2;
    if (hasConfig) resumeStage = 3;
    if (session?.customizedAt) resumeStage = 4;
    if (session?.assembledAt) resumeStage = 5;
    if (session?.encounterStartAt) resumeStage = 5;
    if (session?.encounterEndAt) resumeStage = 6;
    if (session?.checkoutAt) resumeStage = 7;
    if (session?.completedAt || session?.surveyAt) resumeStage = 8;

    return Response.json({
      userId: user.id,
      fullName: user.fullName,
      nickname: user.nickname,
      email: user.email,
      age: user.age,
      profession: user.profession,
      relationshipStatus: user.relationshipStatus,
      sessionId: session?.id ?? null,
      resumeStage,
    });
  }

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  // fullName is optional now (was deprecated 2026-05-09 for privacy);
  // we still accept and store it for backwards-compat with any old
  // client cache, but new registrations leave it empty.
  const fullName = str(body.fullName);
  const nickname = str(body.nickname);
  const email = str(body.email).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  const profession = str(body.profession);
  const relationshipStatus = str(body.relationshipStatus);
  const ageNum = Number(body.age);

  if (!nickname || !email || !password || !profession || !relationshipStatus) {
    return Response.json({ error: "All fields are required" }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Invalid email format" }, { status: 400 });
  }

  // Age must be one of the canonical age-range lower bounds (18, 25,
  // 31, 41, 51, 60). The register form picks a range and submits its
  // lower bound; storing the bound (not the range string) keeps the
  // existing `age` column as Int and lets the insights age-bucket chart
  // continue to work without a schema migration.
  if (!Number.isFinite(ageNum) || !isValidAgeLowerBound(ageNum)) {
    return Response.json({ error: "Invalid age range" }, { status: 400 });
  }

  // Profession must be one of the curated 2076 jobs. Free-form input is
  // no longer accepted to keep the dataset on-narrative for the
  // exhibition.
  if (!isValid2076Profession(profession)) {
    return Response.json({ error: "Invalid profession" }, { status: 400 });
  }

  if (password.length < 6) {
    return Response.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return Response.json(
      { error: "Email already registered. Use Resume Session with your password." },
      { status: 409 },
    );
  }

  const passwordHash = hashPassword(password);
  const user = await prisma.user.create({
    data: {
      fullName,
      nickname,
      email,
      passwordHash,
      age: ageNum,
      profession,
      relationshipStatus,
    },
  });

  const session = await prisma.session.upsert({
    where: { userId: user.id },
    create: { userId: user.id, registeredAt: new Date() },
    update: { registeredAt: new Date() },
  });

  return Response.json({ userId: user.id, sessionId: session.id, nickname: user.nickname });
}

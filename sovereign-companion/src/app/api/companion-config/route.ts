import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import {
  parseFeatures,
  parseHobbies,
  parseJsonObject,
  stringifyFeatures,
  stringifyHobbies,
  stringifyJson,
} from "@/lib/companionSerialize";
import { getDemoStatus } from "@/lib/demoMode";

interface IncomingConfig {
  userId: string;
  userNicknames?: string[];
  companionName?: string;
  // userGender belongs to the USER (not the companion) — captured during register
  // so the AI's language/addressing adapts. Stored only in the fullConfig JSON
  // snapshot, not a dedicated column.
  userGender?: string;
  gender?: string;
  faceShape?: string | null;
  hairStyle?: string | null;
  bodyBuild?: string | null;
  skinTone?: string;
  features?: Record<string, boolean>;
  role?: string;
  dominanceLevel?: number;
  innocenceLevel?: number;
  emotionalLevel?: number;
  humorStyle?: number;
  hobbies?: string[];
  finalImagePath?: string | null;
}

type ConfigFields = {
  userNickname?: string;
  companionName?: string;
  gender?: string;
  faceShape?: string | null;
  hairStyle?: string | null;
  bodyBuild?: string | null;
  skinTone?: string;
  features?: string;
  role?: string;
  dominanceLevel?: number;
  innocenceLevel?: number;
  emotionalLevel?: number;
  humorStyle?: number;
  hobbies?: string;
  finalImagePath?: string | null;
};

function pickData(body: IncomingConfig): ConfigFields {
  const {
    userNicknames,
    companionName,
    gender,
    faceShape,
    hairStyle,
    bodyBuild,
    skinTone,
    features,
    role,
    dominanceLevel,
    innocenceLevel,
    emotionalLevel,
    humorStyle,
    hobbies,
    finalImagePath,
  } = body;

  // DB column `userNickname` is a single String; we stash the JSON-serialized
  // nickname array there so up-to-3 pet-names round-trip through the schema
  // without needing a migration. fullConfig snapshot keeps the native array too.
  const serializedNicknames =
    userNicknames !== undefined
      ? JSON.stringify(userNicknames.filter((n) => typeof n === "string" && n.trim().length > 0))
      : undefined;

  return {
    ...(serializedNicknames !== undefined && { userNickname: serializedNicknames }),
    ...(companionName !== undefined && { companionName }),
    ...(gender !== undefined && { gender }),
    ...(faceShape !== undefined && { faceShape }),
    ...(hairStyle !== undefined && { hairStyle }),
    ...(bodyBuild !== undefined && { bodyBuild }),
    ...(skinTone !== undefined && { skinTone }),
    ...(features !== undefined && { features: stringifyFeatures(features) }),
    ...(role !== undefined && { role }),
    ...(dominanceLevel !== undefined && { dominanceLevel }),
    ...(innocenceLevel !== undefined && { innocenceLevel }),
    ...(emotionalLevel !== undefined && { emotionalLevel }),
    ...(humorStyle !== undefined && { humorStyle }),
    ...(hobbies !== undefined && { hobbies: stringifyHobbies(hobbies) }),
    ...(finalImagePath !== undefined && { finalImagePath }),
  };
}

export async function POST(req: NextRequest) {
  const status = await getDemoStatus();
  if (!status.active) {
    return Response.json(
      { error: "demo_paused", reason: status.reason, message: status.message },
      { status: 503 },
    );
  }
  const body = (await req.json()) as IncomingConfig;

  if (!body.userId) {
    return Response.json({ error: "userId is required" }, { status: 400 });
  }

  const data = pickData(body);
  const snapshot = stringifyJson(body);

  try {
    const [companionConfig] = await prisma.$transaction([
      prisma.companionConfig.upsert({
        where: { userId: body.userId },
        create: {
          userId: body.userId,
          ...data,
          fullConfig: snapshot,
        },
        update: {
          ...data,
          fullConfig: snapshot,
        },
      }),
      prisma.session.updateMany({
        where: { userId: body.userId },
        data: { customizedAt: new Date() },
      }),
    ]);
    return Response.json({ companionConfig });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[companion-config POST] failed:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return Response.json({ error: "userId is required" }, { status: 400 });
  }

  const config = await prisma.companionConfig.findUnique({
    where: { userId },
  });

  if (!config) return Response.json({ config: null });

  // userNickname column stores a JSON-serialized array (new) or a single
  // plain string (pre-v5 legacy rows). Normalize both to `userNicknames`.
  let userNicknames: string[] = [];
  const raw = config.userNickname ?? "";
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        userNicknames = parsed.filter(
          (n): n is string => typeof n === "string" && n.trim().length > 0,
        );
      } else if (typeof parsed === "string" && parsed.trim()) {
        userNicknames = [parsed.trim()];
      }
    } catch {
      // Legacy plain-string row — treat as single nickname.
      if (raw.trim()) userNicknames = [raw.trim()];
    }
  }

  return Response.json({
    config: {
      ...config,
      userNicknames,
      hobbies: parseHobbies(config.hobbies),
      features: parseFeatures(config.features),
      fullConfig: parseJsonObject(config.fullConfig),
    },
  });
}

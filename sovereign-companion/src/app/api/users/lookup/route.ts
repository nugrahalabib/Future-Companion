import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

// Email-based lookup used by the phone-side questionnaire handoff.
//
// GET /api/users/lookup           → list all registrants (email + name only)
//                                   — lightweight directory for the dropdown
// GET /api/users/lookup?email=... → single record (adds companionName + nickname)
//
// No auth: questionnaire runs on a public URL and the data returned is
// intentionally minimal (email + display name) so the user can identify
// themselves. Treat email as a shared research identifier, not a secret.
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();

  if (email) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        fullName: true,
        nickname: true,
        email: true,
        age: true,
        profession: true,
        companionConfig: {
          select: { companionName: true, userNickname: true },
        },
      },
    });
    if (!user) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    return Response.json({
      userId: user.id,
      fullName: user.fullName,
      nickname: user.nickname,
      email: user.email,
      age: user.age,
      profession: user.profession,
      companionName: user.companionConfig?.companionName ?? "",
      userNicknames: safeParseNicknames(user.companionConfig?.userNickname),
    });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, fullName: true, email: true, createdAt: true },
    take: 500,
  });
  return Response.json({
    users: users.map((u) => ({
      userId: u.id,
      fullName: u.fullName,
      email: u.email,
      registeredAt: u.createdAt,
    })),
  });
}

function safeParseNicknames(raw: string | undefined | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === "string");
    if (typeof parsed === "string" && parsed) return [parsed];
  } catch {
    if (typeof raw === "string" && raw.trim()) return [raw.trim()];
  }
  return [];
}

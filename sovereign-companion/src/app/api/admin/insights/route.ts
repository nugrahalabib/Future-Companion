import { prisma } from "@/lib/prisma";
import { parseFeatures, parseHobbies } from "@/lib/companionSerialize";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: Request) {
  const deny = requireAdmin(req);
  if (deny) return deny;
  const [configs, surveys] = await Promise.all([
    prisma.companionConfig.findMany({
      include: {
        user: {
          select: { age: true, relationshipStatus: true, profession: true },
        },
      },
    }),
    prisma.surveyResult.findMany({
      select: {
        userId: true,
        npsScore: true,
        overallExperience: true,
        purchaseIntent: true,
        emotionalConnection: true,
        expectationAlignment: true,
        ethicalConcernLevel: true,
        conceptFeasibility: true,
      },
    }),
  ]);

  // Role distribution
  const roleMap = new Map<string, number>();
  for (const c of configs) roleMap.set(c.role, (roleMap.get(c.role) ?? 0) + 1);
  const roleDistribution = Array.from(roleMap, ([role, count]) => ({ role, count }));

  // Physical distribution
  const dist = (key: "faceShape" | "hairStyle" | "bodyBuild" | "skinTone") => {
    const m = new Map<string, number>();
    for (const c of configs) {
      const v = c[key] ?? "unset";
      m.set(v, (m.get(v) ?? 0) + 1);
    }
    return Array.from(m, ([k, count]) => ({ key: k, count }));
  };

  // Avg persona
  const sum = { dom: 0, inn: 0, emo: 0, hum: 0 };
  for (const c of configs) {
    sum.dom += c.dominanceLevel;
    sum.inn += c.innocenceLevel;
    sum.emo += c.emotionalLevel;
    sum.hum += c.humorStyle;
  }
  const n = configs.length || 1;
  const averagePersona = {
    dominanceLevel: sum.dom / n,
    innocenceLevel: sum.inn / n,
    emotionalLevel: sum.emo / n,
    humorStyle: sum.hum / n,
  };

  // Persona by role — 4-bar chart per role
  const personaByRole: {
    role: string;
    dominance: number;
    innocence: number;
    emotional: number;
    humor: number;
    n: number;
  }[] = [];
  const roleGrouped = new Map<string, typeof configs>();
  for (const c of configs) {
    if (!roleGrouped.has(c.role)) roleGrouped.set(c.role, []);
    roleGrouped.get(c.role)!.push(c);
  }
  for (const [role, cs] of roleGrouped) {
    const rn = cs.length;
    personaByRole.push({
      role,
      dominance: cs.reduce((a, c) => a + c.dominanceLevel, 0) / rn,
      innocence: cs.reduce((a, c) => a + c.innocenceLevel, 0) / rn,
      emotional: cs.reduce((a, c) => a + c.emotionalLevel, 0) / rn,
      humor: cs.reduce((a, c) => a + c.humorStyle, 0) / rn,
      n: rn,
    });
  }

  // Hobby popularity
  const hobbyCount: Record<string, number> = {};
  for (const c of configs) {
    for (const h of parseHobbies(c.hobbies)) {
      hobbyCount[h] = (hobbyCount[h] ?? 0) + 1;
    }
  }
  const hobbyPopularity = Object.entries(hobbyCount)
    .map(([hobby, count]) => ({ hobby, count }))
    .sort((a, b) => b.count - a.count);

  // Extreme features
  let womb = 0;
  let sperm = 0;
  for (const c of configs) {
    const f = parseFeatures(c.features);
    if (f.artificialWomb) womb++;
    if (f.spermBank) sperm++;
  }
  const bioFeatureUsage = {
    artificialWomb: configs.length ? (womb / configs.length) * 100 : 0,
    spermBank: configs.length ? (sperm / configs.length) * 100 : 0,
  };

  // Top combinations
  const comboMap = new Map<string, number>();
  for (const c of configs) {
    if (!c.finalImagePath) continue;
    comboMap.set(c.finalImagePath, (comboMap.get(c.finalImagePath) ?? 0) + 1);
  }
  const topCombinations = Array.from(comboMap, ([path, count]) => ({
    combo: path.replace(/^\/assets\/combine\//, "").replace(/\.(png|jpg|svg)$/i, ""),
    imagePath: path,
    count,
  }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // NPS
  const npsValues = surveys.map((s) => s.npsScore).filter((v): v is number => v != null);
  const promoters = npsValues.filter((v) => v >= 9).length;
  const passives = npsValues.filter((v) => v >= 7 && v <= 8).length;
  const detractors = npsValues.filter((v) => v <= 6).length;
  const npsScore =
    npsValues.length > 0 ? ((promoters - detractors) / npsValues.length) * 100 : 0;

  // Age buckets
  const ageBuckets = [
    { label: "18–24", min: 18, max: 24, count: 0 },
    { label: "25–34", min: 25, max: 34, count: 0 },
    { label: "35–44", min: 35, max: 44, count: 0 },
    { label: "45–54", min: 45, max: 54, count: 0 },
    { label: "55+", min: 55, max: 200, count: 0 },
  ];
  for (const c of configs) {
    const age = c.user.age;
    for (const b of ageBuckets) {
      if (age >= b.min && age <= b.max) {
        b.count++;
        break;
      }
    }
  }

  // Relationship status
  const relMap = new Map<string, number>();
  for (const c of configs)
    relMap.set(c.user.relationshipStatus, (relMap.get(c.user.relationshipStatus) ?? 0) + 1);
  const relationshipDistribution = Array.from(relMap, ([status, count]) => ({
    status,
    count,
  }));

  // Cross-tab: Gender × Role
  const crossGenderRole = new Map<string, Map<string, number>>();
  for (const c of configs) {
    if (!crossGenderRole.has(c.gender)) crossGenderRole.set(c.gender, new Map());
    const inner = crossGenderRole.get(c.gender)!;
    inner.set(c.role, (inner.get(c.role) ?? 0) + 1);
  }
  const genderRoleMatrix: { gender: string; role: string; count: number }[] = [];
  for (const [gender, inner] of crossGenderRole) {
    for (const [role, count] of inner) {
      genderRoleMatrix.push({ gender, role, count });
    }
  }

  // Purchase intent distribution (1..5)
  const purchaseBuckets = Array.from({ length: 5 }, (_, i) => ({
    score: i + 1,
    count: 0,
  }));
  for (const s of surveys) {
    if (s.purchaseIntent && s.purchaseIntent >= 1 && s.purchaseIntent <= 5) {
      purchaseBuckets[s.purchaseIntent - 1].count++;
    }
  }

  return Response.json({
    roleDistribution,
    averagePersona,
    personaByRole,
    physicalDistribution: {
      face: dist("faceShape"),
      hair: dist("hairStyle"),
      body: dist("bodyBuild"),
      skinTone: dist("skinTone"),
    },
    hobbyPopularity,
    bioFeatureUsage,
    topCombinations,
    nps: {
      score: npsScore,
      promoters,
      passives,
      detractors,
      total: npsValues.length,
    },
    ageBuckets,
    relationshipDistribution,
    genderRoleMatrix,
    purchaseBuckets,
    totalConfigs: configs.length,
    totalSurveys: surveys.length,
  });
}

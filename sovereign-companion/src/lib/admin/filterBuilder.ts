import type { Prisma } from "@prisma/client";

// Filter state shared between client and server. Every field optional — absence
// means "no constraint". Arrays use OR-within-field, all fields AND-across.
export interface RespondentFilterState {
  q?: string; // free-text across name / email / profession / nickname
  gender?: string[]; // ["female", "male"]
  role?: string[];
  faceShape?: string[];
  hairStyle?: string[];
  bodyBuild?: string[];
  skinTone?: string[];
  artificialWomb?: boolean; // true = must be on, false = must be off, undef = any
  spermBank?: boolean;
  relationshipStatus?: string[];
  ageMin?: number;
  ageMax?: number;
  completedOnly?: boolean; // only sessions with surveyAt not null
  droppedOnly?: boolean;
  dateFrom?: string; // ISO yyyy-mm-dd
  dateTo?: string;
  experienceMin?: number;
  experienceMax?: number;
  npsBucket?: "promoter" | "passive" | "detractor";
  sort?:
    | "recent"
    | "oldest"
    | "experience_desc"
    | "experience_asc"
    | "duration_desc"
    | "duration_asc";
}

export function parseFilterFromSearchParams(
  sp: URLSearchParams,
): RespondentFilterState {
  const multi = (k: string): string[] | undefined => {
    const v = sp.get(k);
    return v ? v.split(",").filter(Boolean) : undefined;
  };
  const num = (k: string): number | undefined => {
    const v = sp.get(k);
    const n = v === null ? NaN : Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const bool = (k: string): boolean | undefined => {
    const v = sp.get(k);
    if (v === "1" || v === "true") return true;
    if (v === "0" || v === "false") return false;
    return undefined;
  };
  return {
    q: sp.get("q") ?? undefined,
    gender: multi("gender"),
    role: multi("role"),
    faceShape: multi("face"),
    hairStyle: multi("hair"),
    bodyBuild: multi("body"),
    skinTone: multi("skin"),
    artificialWomb: bool("womb"),
    spermBank: bool("sperm"),
    relationshipStatus: multi("rel"),
    ageMin: num("ageMin"),
    ageMax: num("ageMax"),
    completedOnly: bool("completed"),
    droppedOnly: bool("dropped"),
    dateFrom: sp.get("from") ?? undefined,
    dateTo: sp.get("to") ?? undefined,
    experienceMin: num("expMin"),
    experienceMax: num("expMax"),
    npsBucket: (sp.get("nps") as RespondentFilterState["npsBucket"]) ?? undefined,
    sort: (sp.get("sort") as RespondentFilterState["sort"]) ?? undefined,
  };
}

export function encodeFilterToSearchParams(
  f: RespondentFilterState,
): URLSearchParams {
  const sp = new URLSearchParams();
  const put = (k: string, v: string | number | boolean | undefined) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  };
  const putArr = (k: string, v: string[] | undefined) => {
    if (v && v.length) sp.set(k, v.join(","));
  };
  put("q", f.q);
  putArr("gender", f.gender);
  putArr("role", f.role);
  putArr("face", f.faceShape);
  putArr("hair", f.hairStyle);
  putArr("body", f.bodyBuild);
  putArr("skin", f.skinTone);
  if (f.artificialWomb !== undefined) put("womb", f.artificialWomb ? 1 : 0);
  if (f.spermBank !== undefined) put("sperm", f.spermBank ? 1 : 0);
  putArr("rel", f.relationshipStatus);
  put("ageMin", f.ageMin);
  put("ageMax", f.ageMax);
  if (f.completedOnly) put("completed", 1);
  if (f.droppedOnly) put("dropped", 1);
  put("from", f.dateFrom);
  put("to", f.dateTo);
  put("expMin", f.experienceMin);
  put("expMax", f.experienceMax);
  put("nps", f.npsBucket);
  put("sort", f.sort);
  return sp;
}

// Convert filter state into a Prisma User `where` clause. Relation fields
// (companionConfig, session, surveyResult) are matched via `is:` blocks.
export function buildUserWhere(
  f: RespondentFilterState,
): Prisma.UserWhereInput {
  const and: Prisma.UserWhereInput[] = [];

  if (f.q && f.q.trim().length > 0) {
    const q = f.q.trim();
    and.push({
      OR: [
        { fullName: { contains: q } },
        { email: { contains: q } },
        { profession: { contains: q } },
        { nickname: { contains: q } },
        { companionConfig: { is: { companionName: { contains: q } } } },
      ],
    });
  }

  if (f.ageMin !== undefined) and.push({ age: { gte: f.ageMin } });
  if (f.ageMax !== undefined) and.push({ age: { lte: f.ageMax } });
  if (f.relationshipStatus?.length)
    and.push({ relationshipStatus: { in: f.relationshipStatus } });

  if (f.dateFrom) and.push({ createdAt: { gte: new Date(f.dateFrom) } });
  if (f.dateTo) {
    const end = new Date(f.dateTo);
    end.setHours(23, 59, 59, 999);
    and.push({ createdAt: { lte: end } });
  }

  const companionConds: Prisma.CompanionConfigWhereInput[] = [];
  if (f.gender?.length) companionConds.push({ gender: { in: f.gender } });
  if (f.role?.length) companionConds.push({ role: { in: f.role } });
  if (f.faceShape?.length) companionConds.push({ faceShape: { in: f.faceShape } });
  if (f.hairStyle?.length) companionConds.push({ hairStyle: { in: f.hairStyle } });
  if (f.bodyBuild?.length) companionConds.push({ bodyBuild: { in: f.bodyBuild } });
  if (f.skinTone?.length) companionConds.push({ skinTone: { in: f.skinTone } });
  // features is a JSON string in SQLite — LIKE matching is the simplest
  // portable approach. `"artificialWomb":true` is unambiguous because the key
  // + value token only appears in that exact form.
  if (f.artificialWomb === true)
    companionConds.push({ features: { contains: '"artificialWomb":true' } });
  if (f.artificialWomb === false)
    companionConds.push({
      OR: [
        { features: { contains: '"artificialWomb":false' } },
        { NOT: { features: { contains: '"artificialWomb"' } } },
      ],
    });
  if (f.spermBank === true)
    companionConds.push({ features: { contains: '"spermBank":true' } });
  if (f.spermBank === false)
    companionConds.push({
      OR: [
        { features: { contains: '"spermBank":false' } },
        { NOT: { features: { contains: '"spermBank"' } } },
      ],
    });
  if (companionConds.length)
    and.push({ companionConfig: { is: { AND: companionConds } } });

  if (f.completedOnly)
    and.push({ session: { is: { surveyAt: { not: null } } } });
  if (f.droppedOnly) and.push({ session: { is: { dropped: true } } });

  if (f.experienceMin !== undefined)
    and.push({ surveyResult: { is: { overallExperience: { gte: f.experienceMin } } } });
  if (f.experienceMax !== undefined)
    and.push({ surveyResult: { is: { overallExperience: { lte: f.experienceMax } } } });

  if (f.npsBucket === "promoter")
    and.push({ surveyResult: { is: { npsScore: { gte: 9 } } } });
  if (f.npsBucket === "passive")
    and.push({ surveyResult: { is: { npsScore: { gte: 7, lte: 8 } } } });
  if (f.npsBucket === "detractor")
    and.push({ surveyResult: { is: { npsScore: { lte: 6 } } } });

  return and.length ? { AND: and } : {};
}

export function buildOrderBy(
  f: RespondentFilterState,
): Prisma.UserOrderByWithRelationInput[] {
  switch (f.sort) {
    case "oldest":
      return [{ createdAt: "asc" }];
    case "experience_desc":
      return [{ surveyResult: { overallExperience: "desc" } }, { createdAt: "desc" }];
    case "experience_asc":
      return [{ surveyResult: { overallExperience: "asc" } }, { createdAt: "desc" }];
    case "duration_desc":
      return [{ session: { encounterDuration: "desc" } }, { createdAt: "desc" }];
    case "duration_asc":
      return [{ session: { encounterDuration: "asc" } }, { createdAt: "desc" }];
    default:
      return [{ createdAt: "desc" }];
  }
}

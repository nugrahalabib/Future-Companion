/**
 * System Prompt Template — admin-editable overrides.
 *
 * Stored as JSON in the singleton `SystemPromptTemplate` row (Prisma id=1).
 * The system prompt is COMPOSED dynamically at mint-time by buildSystemPrompt
 * from the user's companion config. These overrides let admins inject custom
 * text without re-deploying. Each block is checked at build time: if the
 * override text is non-empty, it replaces the hardcoded default for that
 * locale; otherwise the default is used.
 *
 * Hot-reload guarantee: the ephemeral-token mint route (/api/gemini-token)
 * loads the active overrides on every request — no caching, no restart.
 *
 * Available variables (interpolated at build time inside override text):
 *   {companionName} — the AI's own name
 *   {petNames}      — comma-separated pet-names (e.g. "sayang, mas")
 *   {role}          — role label (e.g. "Romantic Partner")
 *   {firstHobby}    — first hobby user picked (e.g. "Technology")
 *   {userOwnNickname} — user's own nickname (e.g. "Nugi")
 *   {userGender}    — "female" | "male" | "nonbinary" | ""
 */

import { prisma } from "./prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Locale = "en" | "id";

export interface LocalePair {
  en: string;
  id: string;
}

export type RoleId =
  | "romantic-partner"
  | "dominant-assistant"
  | "passive-listener"
  | "intellectual-rival";

export interface SystemPromptOverrides {
  // Free-form blocks injected at the top/bottom of every prompt.
  header: LocalePair;
  footer: LocalePair;

  // Section replacements — empty string = use the hardcoded default.
  primeDirectives: LocalePair;       // §3 (5 absolute rules)
  sensualLayer: LocalePair;          // §4.6 hot/sensual undertone
  identityFreeExpression: LocalePair; // §7 character lock + free expression

  // Used inside §7 default when identityFreeExpression is empty.
  authorIdentity: LocalePair;

  // Per-role vibe blocks injected inside §4.
  roleVibes: Record<RoleId, LocalePair>;
}

// ---------------------------------------------------------------------------
// Defaults — empty strings mean "use the hardcoded text in
// systemPromptBuilder.ts". The text in `authorIdentity` is the only block
// that ships seeded because it's used as a small string interpolation, not
// as a full block replacement.
// ---------------------------------------------------------------------------

export const DEFAULT_OVERRIDES: SystemPromptOverrides = {
  header: { en: "", id: "" },
  footer: { en: "", id: "" },
  primeDirectives: { en: "", id: "" },
  sensualLayer: { en: "", id: "" },
  identityFreeExpression: { en: "", id: "" },
  authorIdentity: {
    en: "Nugraha Labib, a student of MM-NVI cohort 7 at Universitas Prasetiya Mulya",
    id: "Nugraha Labib, anak MM-NVI angkatan 7 Universitas Prasetiya Mulya",
  },
  roleVibes: {
    "romantic-partner": { en: "", id: "" },
    "dominant-assistant": { en: "", id: "" },
    "passive-listener": { en: "", id: "" },
    "intellectual-rival": { en: "", id: "" },
  },
};

// ---------------------------------------------------------------------------
// Validation — guard against malformed JSON in DB. Returns sanitized struct
// with all expected keys present, falling back to defaults for missing parts.
// ---------------------------------------------------------------------------

function validatePair(input: unknown, fallback: LocalePair): LocalePair {
  if (!input || typeof input !== "object") return { ...fallback };
  const o = input as Record<string, unknown>;
  return {
    en: typeof o.en === "string" ? o.en : fallback.en,
    id: typeof o.id === "string" ? o.id : fallback.id,
  };
}

export function validateOverrides(input: unknown): SystemPromptOverrides {
  const obj = (input ?? {}) as Record<string, unknown>;
  const roles = (obj.roleVibes ?? {}) as Record<string, unknown>;
  return {
    header: validatePair(obj.header, DEFAULT_OVERRIDES.header),
    footer: validatePair(obj.footer, DEFAULT_OVERRIDES.footer),
    primeDirectives: validatePair(obj.primeDirectives, DEFAULT_OVERRIDES.primeDirectives),
    sensualLayer: validatePair(obj.sensualLayer, DEFAULT_OVERRIDES.sensualLayer),
    identityFreeExpression: validatePair(obj.identityFreeExpression, DEFAULT_OVERRIDES.identityFreeExpression),
    authorIdentity: validatePair(obj.authorIdentity, DEFAULT_OVERRIDES.authorIdentity),
    roleVibes: {
      "romantic-partner": validatePair(roles["romantic-partner"], DEFAULT_OVERRIDES.roleVibes["romantic-partner"]),
      "dominant-assistant": validatePair(roles["dominant-assistant"], DEFAULT_OVERRIDES.roleVibes["dominant-assistant"]),
      "passive-listener": validatePair(roles["passive-listener"], DEFAULT_OVERRIDES.roleVibes["passive-listener"]),
      "intellectual-rival": validatePair(roles["intellectual-rival"], DEFAULT_OVERRIDES.roleVibes["intellectual-rival"]),
    },
  };
}

// ---------------------------------------------------------------------------
// DB I/O
// ---------------------------------------------------------------------------

export async function loadOverrides(): Promise<SystemPromptOverrides> {
  const row = await prisma.systemPromptTemplate.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, schema: JSON.stringify(DEFAULT_OVERRIDES) },
  });
  if (!row.schema || row.schema === "{}") {
    await prisma.systemPromptTemplate.update({
      where: { id: 1 },
      data: { schema: JSON.stringify(DEFAULT_OVERRIDES) },
    });
    return DEFAULT_OVERRIDES;
  }
  try {
    return validateOverrides(JSON.parse(row.schema));
  } catch (err) {
    console.warn("[systemPromptOverrides] failed to parse, falling back:", err);
    return DEFAULT_OVERRIDES;
  }
}

export async function saveOverrides(
  overrides: SystemPromptOverrides,
  updatedBy: string = "",
): Promise<SystemPromptOverrides> {
  const validated = validateOverrides(overrides);
  await prisma.systemPromptTemplate.upsert({
    where: { id: 1 },
    update: { schema: JSON.stringify(validated), updatedBy: updatedBy.slice(0, 64) },
    create: { id: 1, schema: JSON.stringify(validated), updatedBy: updatedBy.slice(0, 64) },
  });
  return validated;
}

// ---------------------------------------------------------------------------
// Variable interpolation — replaces {key} tokens inside override text. Used
// by the prompt builder when it injects an admin-supplied override block.
// Unknown variables are left as-is so admins can spot typos.
// ---------------------------------------------------------------------------

export interface InterpolationVars {
  companionName?: string;
  petNames?: string;
  userOwnNickname?: string;
  userGender?: string;
  role?: string;
  firstHobby?: string;
  // {authorIdentity} substituted into the §7 default block at build time —
  // value comes from `overrides.authorIdentity` (or its bundled default).
  authorIdentity?: string;
}

export function interpolate(template: string, vars: InterpolationVars): string {
  if (!template) return "";
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const v = (vars as Record<string, string | undefined>)[key];
    return typeof v === "string" ? v : match;
  });
}

// Convenience: pull the locale-correct text from a LocalePair, optionally
// interpolating variables. Returns empty string if both locales are empty
// (signal to caller to use the hardcoded default).
export function pickLocale(
  pair: LocalePair | undefined | null,
  locale: Locale,
  vars?: InterpolationVars,
): string {
  if (!pair) return "";
  const raw = locale === "en" ? pair.en : pair.id;
  if (!raw || !raw.trim()) return "";
  return vars ? interpolate(raw, vars) : raw;
}

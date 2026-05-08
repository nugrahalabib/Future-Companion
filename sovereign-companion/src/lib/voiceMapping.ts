import type { Locale } from "@/stores/useLocaleStore";

export type Gender = "female" | "male" | "nonbinary";

// Role ids match useCompanionStore.role values
export type RoleId =
  | "romantic-partner"
  | "dominant-assistant"
  | "passive-listener"
  | "intellectual-rival";

// Prebuilt Gemini voices — picked for timbre fit per archetype.
// Full catalog: Puck, Charon, Kore, Fenrir, Aoede, Leda, Orus, Zephyr,
// Achernar, Algenib, Algieba, Alnilam, Autonoe, Callirrhoe, Despina, Enceladus,
// Erinome, Gacrux, Iapetus, Laomedeia, Pulcherrima, Rasalgethi, Sadachbia,
// Sadaltager, Schedar, Sulafat, Umbriel, Vindemiatrix, Zubenelgenubi.
export const VOICE_MAP: Record<Gender, Record<RoleId, string>> = {
  female: {
    "romantic-partner":    "Leda",      // Youthful, warm — emotional partner tone
    "dominant-assistant":  "Kore",      // Firm, assertive — decisive lead
    "passive-listener":    "Achernar",  // Soft, gentle — attentive listener
    "intellectual-rival":  "Erinome",   // Clear, articulate — sharp debater
  },
  male: {
    "romantic-partner":    "Puck",      // Upbeat, playful — warm romantic
    "dominant-assistant":  "Orus",      // Firm, authoritative — commanding
    "passive-listener":    "Umbriel",   // Easy-going, relaxed — patient
    "intellectual-rival":  "Charon",    // Informative, measured — cerebral
  },
  // Non-binary roster — voices chosen for timbre that doesn't strongly index
  // a single gender. Aoede (warm/neutral), Iapetus (bright/clear), Despina
  // (soft/centered), Gacrux (cerebral/measured).
  nonbinary: {
    "romantic-partner":    "Aoede",     // Warm, neutral — present and intimate
    "dominant-assistant":  "Iapetus",   // Bright, decisive — confident neutral
    "passive-listener":    "Despina",   // Soft, centered — reflective listener
    "intellectual-rival":  "Gacrux",    // Cerebral, measured — sharp neutral
  },
};

const FALLBACK_VOICE_FEMALE = "Aoede";
const FALLBACK_VOICE_MALE = "Charon";
const FALLBACK_VOICE_NONBINARY = "Aoede";

function normalizeGender(g: string | null): Gender {
  if (g === "male" || g === "nonbinary") return g;
  return "female";
}

export function pickVoice(gender: string | null, role: string | null): string {
  const g = normalizeGender(gender);
  const roleMap = VOICE_MAP[g];
  if (role && role in roleMap) {
    return roleMap[role as RoleId];
  }
  return g === "male" ? FALLBACK_VOICE_MALE : g === "nonbinary" ? FALLBACK_VOICE_NONBINARY : FALLBACK_VOICE_FEMALE;
}

// Locale → BCP-47 language code used by Gemini speech synthesis
export function pickLanguage(locale: Locale | undefined): string {
  return locale === "en" ? "en-US" : "id-ID";
}

// Lightweight archetype descriptor pushed into the system prompt so the model
// matches verbal mannerisms to the voice timbre selected above.
export function describeVoiceArchetype(gender: string | null, role: string | null): string {
  const g = normalizeGender(gender);
  const pronoun =
    g === "male" ? "a male" :
    g === "nonbinary" ? "an androgynous, gender-neutral" :
    "a female";
  const roleDescriptors: Record<RoleId, string> = {
    "romantic-partner":
      "warm, tender, emotionally present; lingers on soft consonants; speaks as if close in a private space",
    "dominant-assistant":
      "decisive, assertive, precise; short confident sentences; commanding cadence with forward momentum",
    "passive-listener":
      "calm, patient, unhurried; open-ended questions; space between phrases; never interrupts",
    "intellectual-rival":
      "sharp, curious, quick-witted; dry levity; trades ideas at pace; challenges gently",
  };
  const descriptor = role && role in roleDescriptors
    ? roleDescriptors[role as RoleId]
    : "natural, attentive, confident";
  return `Your voice is ${pronoun} voice. Vocal mannerisms: ${descriptor}.`;
}

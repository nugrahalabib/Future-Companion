import type { Locale } from "@/stores/useLocaleStore";

export type Gender = "female" | "male";

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
};

const FALLBACK_VOICE_FEMALE = "Aoede";
const FALLBACK_VOICE_MALE = "Charon";

export function pickVoice(gender: string | null, role: string | null): string {
  const g: Gender = gender === "male" ? "male" : "female";
  const roleMap = VOICE_MAP[g];
  if (role && role in roleMap) {
    return roleMap[role as RoleId];
  }
  return g === "male" ? FALLBACK_VOICE_MALE : FALLBACK_VOICE_FEMALE;
}

// Locale → BCP-47 language code used by Gemini speech synthesis
export function pickLanguage(locale: Locale | undefined): string {
  return locale === "en" ? "en-US" : "id-ID";
}

// Lightweight archetype descriptor pushed into the system prompt so the model
// matches verbal mannerisms to the voice timbre selected above.
export function describeVoiceArchetype(gender: string | null, role: string | null): string {
  const g: Gender = gender === "male" ? "male" : "female";
  const pronoun = g === "male" ? "a male" : "a female";
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

// Locale-aware labels for the categorical enums stored in the DB.
// Admin UI shows these in plain, presentation-ready language (ID + EN) that
// matches what the user sees in the Creator Studio — so researchers and
// students reading the dashboard never see raw codes like "body1" or "alpha".

import type { Locale } from "@/stores/useLocaleStore";
import { getAssetLabel, type AssetAxis } from "@/lib/companionAssets";

export type LocalizedDict = Record<Locale, Record<string, string>>;

export const GENDER_LABEL: LocalizedDict = {
  en: { female: "Female", male: "Male", nonbinary: "Non-Binary" },
  id: { female: "Perempuan", male: "Laki-Laki", nonbinary: "Non-Biner" },
};

// Asset axis labels — IDs (A-F) are gender-aware in the new manifest, so the
// flat dict only carries axis-generic labels for filter chips. For row-level
// display where gender context is known, use `labelizeAsset(gender, axis, id)`.
export const FACE_LABEL: LocalizedDict = {
  en: { A: "Face A", B: "Face B", C: "Face C", D: "Face D", E: "Face E" },
  id: { A: "Wajah A", B: "Wajah B", C: "Wajah C", D: "Wajah D", E: "Wajah E" },
};

export const HAIR_LABEL: LocalizedDict = {
  en: { A: "Hair A", B: "Hair B", C: "Hair C", D: "Hair D", E: "Hair E" },
  id: { A: "Rambut A", B: "Rambut B", C: "Rambut C", D: "Rambut D", E: "Rambut E" },
};

export const BODY_LABEL: LocalizedDict = {
  en: { A: "Body A", B: "Body B", C: "Body C", D: "Body D", E: "Body E", F: "Body F" },
  id: { A: "Tubuh A", B: "Tubuh B", C: "Tubuh C", D: "Tubuh D", E: "Tubuh E", F: "Tubuh F" },
};

export const OUTFIT_LABEL: LocalizedDict = {
  en: { A: "Outfit A", B: "Outfit B", C: "Outfit C", D: "Outfit D", E: "Outfit E" },
  id: { A: "Busana A", B: "Busana B", C: "Busana C", D: "Busana D", E: "Busana E" },
};

export const SKIN_LABEL: LocalizedDict = {
  en: {
    fair: "Fair",
    medium: "Medium",
    tan: "Tan",
    deep: "Deep",
  },
  id: {
    fair: "Cerah",
    medium: "Sedang",
    tan: "Sawo Matang",
    deep: "Gelap",
  },
};

export const ROLE_LABEL: LocalizedDict = {
  en: {
    "romantic-partner": "Romantic Partner",
    "dominant-assistant": "Dominant Assistant",
    "passive-listener": "Passive Listener",
    "intellectual-rival": "Intellectual Rival",
  },
  id: {
    "romantic-partner": "Pasangan Romantis",
    "dominant-assistant": "Asisten Dominan",
    "passive-listener": "Pendengar Pasif",
    "intellectual-rival": "Rival Intelektual",
  },
};

export const HOBBY_LABEL: LocalizedDict = {
  en: {
    technology: "Technology",
    philosophy: "Philosophy",
    science: "Science",
    literature: "Literature",
    finance: "Finance",
    arts: "Arts",
    music: "Music",
    cooking: "Cooking",
    photography: "Photography",
    sensuality: "Sensuality",
    sports: "Sports",
    travel: "Travel",
    survival: "Survival",
    nightlife: "Nightlife",
    fashion: "Fashion",
    gaming: "Gaming",
    intimacy: "Intimacy",
  },
  id: {
    technology: "Teknologi",
    philosophy: "Filsafat",
    science: "Sains",
    literature: "Sastra",
    finance: "Keuangan",
    arts: "Seni",
    music: "Musik",
    cooking: "Memasak",
    photography: "Fotografi",
    sensuality: "Sensualitas",
    sports: "Olahraga",
    travel: "Jalan-jalan",
    survival: "Bertahan Hidup",
    nightlife: "Dunia Malam",
    fashion: "Fashion",
    gaming: "Gaming",
    intimacy: "Keintiman",
  },
};

export const RELATIONSHIP_LABEL: LocalizedDict = {
  en: {
    single: "Single",
    complicated: "Complicated",
    married: "Married",
    "opt-out": "Opting Out of Human Dating",
  },
  id: {
    single: "Lajang",
    complicated: "Rumit",
    married: "Menikah",
    "opt-out": "Memilih Keluar dari Kencan Manusia",
  },
};

// Stages shown in the respondent table + activity feed.
// Stored in DB as English strings ("Completed", "Checkout", etc.) so the map
// key matches the raw value from the API.
export const STAGE_LABEL: LocalizedDict = {
  en: {
    Registered: "Registered",
    Customized: "Customizing",
    Assembled: "Assembled",
    "Encounter Active": "Encounter Active",
    "Encounter Ended": "Encounter Ended",
    Checkout: "Checkout",
    Surveyed: "Surveyed",
    Completed: "Completed",
    Dropped: "Dropped",
    "In Progress": "In Progress",
  },
  id: {
    Registered: "Terdaftar",
    Customized: "Sedang Kustomisasi",
    Assembled: "Selesai Dirakit",
    "Encounter Active": "Sedang Bicara",
    "Encounter Ended": "Selesai Bicara",
    Checkout: "Checkout",
    Surveyed: "Mengisi Survei",
    Completed: "Selesai",
    Dropped: "Keluar Tengah Jalan",
    "In Progress": "Sedang Berjalan",
  },
};

export const FEATURE_LABEL: LocalizedDict = {
  en: {
    artificialWomb: "Artificial Womb",
    spermBank: "Sperm Bank",
  },
  id: {
    artificialWomb: "Rahim Buatan",
    spermBank: "Bank Sperma",
  },
};

// Sentiment tags on qualitative answers.
export const SENTIMENT_LABEL: LocalizedDict = {
  en: { positive: "Positive", negative: "Negative", neutral: "Neutral" },
  id: { positive: "Positif", negative: "Negatif", neutral: "Netral" },
};

// Transcript turn role.
export const TRANSCRIPT_ROLE_LABEL: LocalizedDict = {
  en: { user: "User", model: "Companion", assistant: "Companion" },
  id: { user: "Pengguna", model: "Companion", assistant: "Companion" },
};

export function labelize(
  dict: LocalizedDict,
  key: string | null | undefined,
  locale: Locale = "en",
): string {
  if (!key) return "-";
  return dict[locale]?.[key] ?? dict.en[key] ?? key;
}

// Gender-aware asset label resolver. Use this when rendering a row/drawer that
// has gender context — returns the actual product name ("Heart Shaped Elegant"
// instead of generic "Face A"). Falls back to the flat label if gender or id
// not resolvable.
export function labelizeAsset(
  gender: string | null | undefined,
  axis: AssetAxis,
  id: string | null | undefined,
  locale: Locale = "en",
): string {
  if (!id) return "-";
  const specific = getAssetLabel(gender ?? null, axis, id);
  if (specific) return specific;
  const dict =
    axis === "face" ? FACE_LABEL :
    axis === "hair" ? HAIR_LABEL :
    axis === "body" ? BODY_LABEL :
    OUTFIT_LABEL;
  return labelize(dict, id, locale);
}

export function stageColor(stage: string): string {
  switch (stage) {
    case "Completed":
      return "bg-bio-green/15 text-bio-green border-bio-green/30";
    case "Checkout":
    case "Surveyed":
      return "bg-cyan-accent/15 text-cyan-accent border-cyan-accent/30";
    case "Encounter Active":
    case "Encounter Ended":
      return "bg-[#6C5CE7]/15 text-[#A89BFF] border-[#6C5CE7]/30";
    case "Assembled":
    case "Customized":
      return "bg-[#FFD93D]/15 text-[#FFD93D] border-[#FFD93D]/30";
    case "Dropped":
      return "bg-danger/15 text-danger border-danger/30";
    default:
      return "bg-text-muted/15 text-text-muted border-glass-border";
  }
}

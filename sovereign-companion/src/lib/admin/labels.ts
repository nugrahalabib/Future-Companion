// Locale-aware labels for the categorical enums stored in the DB.
// Admin UI shows these in plain, presentation-ready language (ID + EN) that
// matches what the user sees in the Creator Studio — so researchers and
// students reading the dashboard never see raw codes like "body1" or "alpha".

import type { Locale } from "@/stores/useLocaleStore";

export type LocalizedDict = Record<Locale, Record<string, string>>;

export const GENDER_LABEL: LocalizedDict = {
  en: { female: "Female", male: "Male" },
  id: { female: "Perempuan", male: "Laki-Laki" },
};

// Face shape — matches customer-facing copy ("Dominant / Alpha" etc.).
export const FACE_LABEL: LocalizedDict = {
  en: { alpha: "Dominant (Alpha)", beta: "Soft (Beta)" },
  id: { alpha: "Dominan (Alpha)", beta: "Lembut (Beta)" },
};

// Hair — gender-agnostic label (female + male variants share the same vibe copy).
export const HAIR_LABEL: LocalizedDict = {
  en: { hair1: "Short & Neat", hair2: "Long & Flowing" },
  id: { hair1: "Pendek & Rapi", hair2: "Panjang & Tergerai" },
};

export const BODY_LABEL: LocalizedDict = {
  en: { body1: "Athletic & Broad", body2: "Slim & Elegant" },
  id: { body1: "Atletis & Kokoh", body2: "Langsing & Anggun" },
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
  if (!key) return "—";
  return dict[locale]?.[key] ?? dict.en[key] ?? key;
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

/**
 * Survey Template — dynamic questionnaire schema
 *
 * Stored as JSON in the singleton `SurveyTemplate` row (Prisma id=1). Loaded
 * by the public questionnaire and edited by admins via /admin/forms (a
 * Google-Forms-style builder). Section 0 (Identity / email lookup) is
 * built-in and never appears in the template — admins only manage the
 * post-identity sections.
 *
 * Question IDs in the DEFAULT_TEMPLATE intentionally match the legacy
 * SurveyResult column names so historical responses recorded in those
 * columns continue to render in admin views (Drawer / Research / Export).
 * New questions added by admins get cuid()-style IDs and live ONLY in
 * SurveyResult.rawPayload.
 */

import { prisma } from "./prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type QuestionType =
  | "likert"      // 1-5 numeric scale (LikertScale component)
  | "nps"         // 0-10 grid (NPSScale component)
  | "single"      // single-choice radio cards (SingleChoice component)
  | "multi"       // multi-select pills (MultiChoice component)
  | "dropdown"    // <select> single-choice
  | "text"        // single-line text input
  | "longtext";   // multi-line textarea

export interface SurveyOption {
  value: string;
  labelEn: string;
  labelId: string;
}

export interface LikertAnchors {
  lowEn?: string;
  lowId?: string;
  midEn?: string;
  midId?: string;
  highEn?: string;
  highId?: string;
}

export interface NpsAnchors {
  lowEn?: string;
  lowId?: string;
  highEn?: string;
  highId?: string;
}

export interface SurveyQuestion {
  id: string;
  type: QuestionType;
  required: boolean;
  labelEn: string;
  labelId: string;
  helperEn?: string;
  helperId?: string;
  // type-specific config
  options?: SurveyOption[];      // single | multi | dropdown
  anchors?: LikertAnchors;       // likert
  npsAnchors?: NpsAnchors;       // nps
  maxSelections?: number;        // multi
}

export interface SurveySection {
  id: string;
  titleEn: string;
  titleId: string;
  descriptionEn?: string;
  descriptionId?: string;
  questions: SurveyQuestion[];
}

export interface SurveyTemplateShape {
  version: number;
  sections: SurveySection[];
}

// ---------------------------------------------------------------------------
// Default template (mirrors the legacy hardcoded questionnaire)
// ---------------------------------------------------------------------------

export const DEFAULT_TEMPLATE: SurveyTemplateShape = {
  version: 1,
  sections: [
    {
      id: "expectations",
      titleEn: "First Impressions & Expectations",
      titleId: "Kesan Pertama & Ekspektasi",
      descriptionEn: "Help us understand the framing you brought into this experience.",
      descriptionId: "Bantu kami memahami harapan yang kamu bawa masuk ke pengalaman ini.",
      questions: [
        {
          id: "priorAiFamiliarity",
          type: "likert",
          required: true,
          labelEn: "How familiar were you with AI companions before this demo?",
          labelId: "Seberapa familiar kamu dengan AI companion sebelum demo ini?",
          anchors: { lowEn: "Not at all", highEn: "Very familiar", lowId: "Sama sekali tidak", highId: "Sangat familiar" },
        },
        {
          id: "expectationAlignment",
          type: "likert",
          required: true,
          labelEn: "Did the experience match what you imagined an AI companion would be?",
          labelId: "Apakah pengalaman ini sesuai dengan bayangan AI companion yang kamu pikirkan?",
          anchors: { lowEn: "Far below", highEn: "Far beyond", lowId: "Jauh di bawah", highId: "Jauh melampaui" },
        },
        {
          id: "firstImpression",
          type: "single",
          required: true,
          labelEn: "Your first emotional reaction was...",
          labelId: "Reaksi emosional pertamamu adalah...",
          options: [
            { value: "excited",       labelEn: "Excited",                 labelId: "Bersemangat" },
            { value: "curious",       labelEn: "Curious",                 labelId: "Penasaran" },
            { value: "skeptical",     labelEn: "Skeptical",               labelId: "Skeptis" },
            { value: "uncomfortable", labelEn: "Uncomfortable",           labelId: "Tidak nyaman" },
            { value: "inspired",      labelEn: "Inspired",                labelId: "Terinspirasi" },
          ],
        },
        {
          id: "discoverySource",
          type: "single",
          required: true,
          labelEn: "Where did you encounter this demo?",
          labelId: "Dari mana kamu menemukan demo ini?",
          options: [
            { value: "exhibition-booth", labelEn: "Exhibition booth (in person)", labelId: "Booth pameran (langsung)" },
            { value: "invited",          labelEn: "Invited by the team",          labelId: "Diundang oleh tim" },
            { value: "social-media",     labelEn: "Social media",                 labelId: "Media sosial" },
            { value: "press",            labelEn: "Press / news article",         labelId: "Pers / artikel berita" },
            { value: "other",            labelEn: "Other",                        labelId: "Lainnya" },
          ],
        },
      ],
    },
    {
      id: "creator",
      titleEn: "Creator Studio (Physical Customization)",
      titleId: "Creator Studio (Kustomisasi Fisik)",
      descriptionEn: "How did the design phase feel?",
      descriptionId: "Bagaimana fase perancangan terasa?",
      questions: [
        {
          id: "customizationDepth",
          type: "likert",
          required: true,
          labelEn: "How satisfying was the depth of customization?",
          labelId: "Seberapa memuaskan kedalaman kustomisasi yang tersedia?",
          anchors: { lowEn: "Too shallow", highEn: "Deeply rich", lowId: "Terlalu dangkal", highId: "Sangat kaya" },
        },
        {
          id: "stepFlowIntuitiveness",
          type: "likert",
          required: true,
          labelEn: "How intuitive did the step-by-step flow feel?",
          labelId: "Seberapa intuitif alur step-by-step terasa?",
          anchors: { lowEn: "Confusing", highEn: "Effortless", lowId: "Membingungkan", highId: "Sangat lancar" },
        },
        {
          id: "visualFidelity",
          type: "likert",
          required: true,
          labelEn: "How real did the visual portrait feel?",
          labelId: "Seberapa nyata potret visualnya terasa?",
          anchors: { lowEn: "Cartoonish", highEn: "Hyper-real", lowId: "Kartun", highId: "Hiper-realistik" },
        },
        {
          id: "customizationTimeFeel",
          type: "single",
          required: true,
          labelEn: "How did the time spent customizing feel?",
          labelId: "Bagaimana rasanya waktu yang kamu habiskan untuk kustomisasi?",
          options: [
            { value: "too-short", labelEn: "Too short",  labelId: "Terlalu singkat" },
            { value: "just-right", labelEn: "Just right", labelId: "Pas" },
            { value: "too-long",  labelEn: "Too long",   labelId: "Terlalu lama" },
          ],
        },
        {
          id: "missingCustomization",
          type: "longtext",
          required: false,
          labelEn: "What customization did you wish was available?",
          labelId: "Kustomisasi apa yang kamu harap ada?",
        },
        {
          id: "mostInfluentialFeature",
          type: "single",
          required: true,
          labelEn: "Which feature affected your impression the most?",
          labelId: "Fitur mana yang paling memengaruhi kesanmu?",
          options: [
            { value: "Physical Design (Face/Hair/Body/Skin)", labelEn: "Physical Design (Face/Hair/Body/Skin)", labelId: "Desain Fisik (Wajah/Rambut/Tubuh/Kulit)" },
            { value: "Biological Features",                   labelEn: "Biological Features",                  labelId: "Fitur Biologis" },
            { value: "Persona & Personality",                 labelEn: "Persona & Personality",                labelId: "Persona & Kepribadian" },
            { value: "Hobbies & Interests",                   labelEn: "Hobbies & Interests",                  labelId: "Hobi & Minat" },
            { value: "Voice Interaction",                     labelEn: "Voice Interaction",                    labelId: "Interaksi Suara" },
            { value: "Final Reveal Moment",                   labelEn: "Final Reveal Moment",                  labelId: "Momen Reveal Final" },
          ],
        },
      ],
    },
    {
      id: "encounter",
      titleEn: "The Encounter (Voice Session)",
      titleId: "Encounter (Sesi Suara)",
      descriptionEn: "About the conversation with your companion.",
      descriptionId: "Tentang percakapan dengan companion-mu.",
      questions: [
        {
          id: "revealImpact",
          type: "likert",
          required: true,
          labelEn: "How impactful was the final reveal moment?",
          labelId: "Seberapa berkesan momen reveal final?",
          anchors: { lowEn: "Forgettable", highEn: "Unforgettable", lowId: "Mudah lupa", highId: "Tak terlupakan" },
        },
        {
          id: "revealMatchedImagination",
          type: "likert",
          required: true,
          labelEn: "Did the final companion match the one in your imagination?",
          labelId: "Apakah companion final sesuai dengan yang kamu bayangkan?",
          anchors: { lowEn: "Far off", highEn: "Exactly", lowId: "Jauh berbeda", highId: "Persis" },
        },
        {
          id: "personaAccuracy",
          type: "likert",
          required: true,
          labelEn: "How accurately did the AI's voice match the persona you set?",
          labelId: "Seberapa akurat suara AI cocok dengan persona yang kamu atur?",
        },
        {
          id: "voiceNaturalness",
          type: "likert",
          required: true,
          labelEn: "How natural did the companion's voice sound?",
          labelId: "Seberapa natural suara companion?",
          anchors: { lowEn: "Robotic", highEn: "Human", lowId: "Robotik", highId: "Manusiawi" },
        },
        {
          id: "voiceResponsiveness",
          type: "likert",
          required: true,
          labelEn: "How responsive was the conversation?",
          labelId: "Seberapa responsif percakapannya?",
          anchors: { lowEn: "Sluggish", highEn: "Instant", lowId: "Lambat", highId: "Instan" },
        },
        {
          id: "companionPresence",
          type: "likert",
          required: true,
          labelEn: "Did it feel like a real person was present with you?",
          labelId: "Terasa seperti ada manusia sungguhan menemanimu?",
          anchors: { lowEn: "Cold/empty", highEn: "Vividly there", lowId: "Dingin/hampa", highId: "Sangat hadir" },
        },
        {
          id: "conversationDepth",
          type: "likert",
          required: true,
          labelEn: "How deep did the conversation feel?",
          labelId: "Seberapa dalam percakapannya terasa?",
          anchors: { lowEn: "Surface", highEn: "Soul-deep", lowId: "Permukaan", highId: "Sangat dalam" },
        },
        {
          id: "preferredLongerSession",
          type: "likert",
          required: true,
          labelEn: "Would you have wanted a longer session?",
          labelId: "Apakah kamu ingin sesi yang lebih panjang?",
          anchors: { lowEn: "Already enough", highEn: "Much longer", lowId: "Sudah cukup", highId: "Jauh lebih panjang" },
        },
      ],
    },
    {
      id: "ethics",
      titleEn: "Ethics & Societal Impact",
      titleId: "Etika & Dampak Sosial",
      descriptionEn: "Step back from the experience for a moment.",
      descriptionId: "Mundur sejenak dari pengalaman ini.",
      questions: [
        {
          id: "ethicalConcernLevel",
          type: "likert",
          required: true,
          labelEn: "How concerned are you about the ethics of this technology?",
          labelId: "Seberapa khawatir kamu tentang etika teknologi ini?",
          anchors: { lowEn: "Not at all", highEn: "Very concerned", lowId: "Sama sekali tidak", highId: "Sangat khawatir" },
        },
        {
          id: "ethicalConcerns",
          type: "multi",
          required: false,
          labelEn: "Which concerns resonate with you? (select all that apply)",
          labelId: "Kekhawatiran mana yang relevan denganmu? (pilih semua yang sesuai)",
          options: [
            { value: "privacy",            labelEn: "Privacy of intimate data",     labelId: "Privasi data intim" },
            { value: "dependency",         labelEn: "Emotional dependency",         labelId: "Ketergantungan emosional" },
            { value: "isolation",          labelEn: "Social isolation",             labelId: "Isolasi sosial" },
            { value: "psych-harm",         labelEn: "Psychological harm",           labelId: "Bahaya psikologis" },
            { value: "identity-confusion", labelEn: "Identity confusion",           labelId: "Kebingungan identitas" },
            { value: "inequality",         labelEn: "Access inequality",            labelId: "Ketimpangan akses" },
            { value: "exploitation",       labelEn: "Exploitation",                 labelId: "Eksploitasi" },
            { value: "none",               labelEn: "None — I see no major concerns", labelId: "Tidak ada — saya tidak melihat masalah besar" },
          ],
        },
        {
          id: "impactOnHumanRelations",
          type: "likert",
          required: true,
          labelEn: "What impact will tech like this have on human-to-human relationships?",
          labelId: "Dampak apa yang akan tech seperti ini berikan pada hubungan antar-manusia?",
          anchors: { lowEn: "Very negative", highEn: "Very positive", lowId: "Sangat negatif", highId: "Sangat positif" },
        },
        {
          id: "socialAcceptancePrediction",
          type: "likert",
          required: true,
          labelEn: "How socially accepted do you think this will be in 10 years?",
          labelId: "Seberapa diterima secara sosial menurutmu dalam 10 tahun ke depan?",
          anchors: { lowEn: "Rejected", highEn: "Mainstream", lowId: "Ditolak", highId: "Mainstream" },
        },
        {
          id: "conceptFeasibility",
          type: "likert",
          required: true,
          labelEn: "How feasible is this concept becoming reality in the near future?",
          labelId: "Seberapa layak konsep ini menjadi nyata di masa depan dekat?",
          anchors: { lowEn: "Sci-fi only", highEn: "Inevitable", lowId: "Hanya fiksi", highId: "Tak terhindarkan" },
        },
        {
          id: "replacementWillingness",
          type: "likert",
          required: true,
          labelEn: "Would you replace human intimacy with a synthetic companion if technology reached 100% biological parity?",
          labelId: "Akankah kamu menggantikan keintiman manusia dengan companion sintetis jika teknologi mencapai 100% paritas biologis?",
          anchors: { lowEn: "Never", highEn: "Absolutely", lowId: "Tidak akan pernah", highId: "Pasti" },
        },
      ],
    },
    {
      id: "market",
      titleEn: "Market & Purchase Intent",
      titleId: "Pasar & Niat Beli",
      descriptionEn: "Tell us about commercial fit.",
      descriptionId: "Ceritakan tentang kecocokan komersial.",
      questions: [
        {
          id: "purchaseIntent",
          type: "likert",
          required: true,
          labelEn: "If commercially available today, how likely would you purchase this?",
          labelId: "Jika tersedia komersial hari ini, seberapa mungkin kamu membelinya?",
          anchors: { lowEn: "Definitely not", highEn: "Definitely yes", lowId: "Pasti tidak", highId: "Pasti iya" },
        },
        {
          id: "expectedPriceRange",
          type: "dropdown",
          required: true,
          labelEn: "What price range would you expect for a unit like this?",
          labelId: "Range harga berapa yang kamu harapkan untuk unit seperti ini?",
          options: [
            { value: "under-50m",     labelEn: "Under Rp 50M",        labelId: "Di bawah Rp 50jt" },
            { value: "50-150m",       labelEn: "Rp 50M – 150M",       labelId: "Rp 50jt – 150jt" },
            { value: "150-500m",      labelEn: "Rp 150M – 500M",      labelId: "Rp 150jt – 500jt" },
            { value: "500m-1b",       labelEn: "Rp 500M – 1B",        labelId: "Rp 500jt – 1M" },
            { value: "over-1b",       labelEn: "Over Rp 1B",          labelId: "Di atas Rp 1M" },
            { value: "would-not-buy", labelEn: "I wouldn't purchase", labelId: "Saya tidak akan membeli" },
          ],
        },
        {
          id: "preferredPricingModel",
          type: "single",
          required: true,
          labelEn: "Which pricing model fits best?",
          labelId: "Model harga mana yang paling cocok?",
          options: [
            { value: "one-time",     labelEn: "One-time purchase",        labelId: "Beli sekali" },
            { value: "subscription", labelEn: "Monthly / yearly subscription", labelId: "Langganan bulanan / tahunan" },
            { value: "hybrid",       labelEn: "Hybrid (low cost + monthly)", labelId: "Hibrida (biaya awal + bulanan)" },
            { value: "pay-per-use",  labelEn: "Pay-per-use",              labelId: "Bayar per pemakaian" },
          ],
        },
        {
          id: "willingnessToPayPremium",
          type: "likert",
          required: true,
          labelEn: "Would you pay a premium for hyper-customization?",
          labelId: "Akankah kamu bayar lebih untuk hiper-kustomisasi?",
        },
        {
          id: "primaryUseCase",
          type: "multi",
          required: false,
          labelEn: "What use cases interest you most? (select up to 3)",
          labelId: "Use case mana yang paling menarik? (pilih maksimal 3)",
          maxSelections: 3,
          options: [
            { value: "companionship",  labelEn: "Companionship",       labelId: "Pendamping" },
            { value: "romance",        labelEn: "Romance",             labelId: "Romansa" },
            { value: "therapy",        labelEn: "Emotional support / therapy", labelId: "Dukungan emosional / terapi" },
            { value: "productivity",   labelEn: "Productivity / assistant",    labelId: "Produktivitas / asisten" },
            { value: "learning",       labelEn: "Learning / tutoring", labelId: "Belajar / tutor" },
            { value: "entertainment",  labelEn: "Entertainment",       labelId: "Hiburan" },
            { value: "elderly-care",   labelEn: "Elderly care",        labelId: "Perawatan lansia" },
            { value: "intimacy",       labelEn: "Intimacy",            labelId: "Keintiman" },
          ],
        },
        {
          id: "targetDemographic",
          type: "multi",
          required: false,
          labelEn: "Which audience would benefit most? (select up to 3)",
          labelId: "Audiens mana yang paling diuntungkan? (pilih maksimal 3)",
          maxSelections: 3,
          options: [
            { value: "single-young",        labelEn: "Single (under 30)",         labelId: "Lajang (di bawah 30)" },
            { value: "single-professional", labelEn: "Single professionals (30+)", labelId: "Profesional lajang (30+)" },
            { value: "divorced",            labelEn: "Divorced / separated",      labelId: "Bercerai / berpisah" },
            { value: "elderly",             labelEn: "Elderly / lonely seniors",   labelId: "Lansia / lansia kesepian" },
            { value: "caregivers",          labelEn: "Caregivers (burnout relief)", labelId: "Pengasuh (relief burnout)" },
            { value: "technophiles",        labelEn: "Tech enthusiasts",          labelId: "Pecinta teknologi" },
            { value: "lgbtq",               labelEn: "LGBTQ+ community",          labelId: "Komunitas LGBTQ+" },
          ],
        },
      ],
    },
    {
      id: "emotional",
      titleEn: "Emotional Impact & Recommendation",
      titleId: "Dampak Emosional & Rekomendasi",
      descriptionEn: "Last few questions, the most important ones.",
      descriptionId: "Beberapa pertanyaan terakhir, yang paling penting.",
      questions: [
        {
          id: "emotionalConnection",
          type: "likert",
          required: true,
          labelEn: "How strong was the emotional connection during the encounter?",
          labelId: "Seberapa kuat koneksi emosional selama encounter?",
          anchors: { lowEn: "None at all", highEn: "Profound", lowId: "Tidak ada", highId: "Sangat dalam" },
        },
        {
          id: "feltJudgedOrSafe",
          type: "likert",
          required: true,
          labelEn: "How safe / non-judged did you feel?",
          labelId: "Seberapa aman / tidak dihakimi rasanya?",
          anchors: { lowEn: "Judged", highEn: "Fully safe", lowId: "Merasa dihakimi", highId: "Sangat aman" },
        },
        {
          id: "wouldMissCompanion",
          type: "likert",
          required: true,
          labelEn: "Would you miss your companion if you couldn't return?",
          labelId: "Apakah kamu akan rindu companion-mu kalau tidak bisa kembali?",
          anchors: { lowEn: "Not at all", highEn: "Very much", lowId: "Sama sekali tidak", highId: "Sangat" },
        },
        {
          id: "lonelinessAssist",
          type: "likert",
          required: true,
          labelEn: "Could a companion like this help with loneliness?",
          labelId: "Apakah companion seperti ini bisa membantu mengatasi kesepian?",
          anchors: { lowEn: "Not at all", highEn: "Significantly", lowId: "Sama sekali tidak", highId: "Signifikan" },
        },
        {
          id: "overallExperience",
          type: "likert",
          required: true,
          labelEn: "Overall experience rating",
          labelId: "Rating pengalaman keseluruhan",
        },
        {
          id: "uiEaseOfUse",
          type: "likert",
          required: true,
          labelEn: "How easy was the UI to use?",
          labelId: "Seberapa mudah UI digunakan?",
        },
        {
          id: "exhibitionQuality",
          type: "likert",
          required: true,
          labelEn: "How would you rate the exhibition / demo experience?",
          labelId: "Bagaimana kamu menilai pengalaman pameran / demo?",
        },
        {
          id: "willRecommend",
          type: "likert",
          required: true,
          labelEn: "How likely are you to recommend this experience?",
          labelId: "Seberapa mungkin kamu merekomendasikan pengalaman ini?",
        },
        {
          id: "npsScore",
          type: "nps",
          required: true,
          labelEn: "On a scale of 0-10, how likely are you to tell a friend?",
          labelId: "Pada skala 0-10, seberapa mungkin kamu memberitahu teman?",
          npsAnchors: { lowEn: "Not at all", highEn: "Definitely", lowId: "Sama sekali tidak", highId: "Pasti" },
        },
        {
          id: "biggestConcern",
          type: "longtext",
          required: false,
          labelEn: "What is your biggest concern about this concept?",
          labelId: "Apa kekhawatiran terbesarmu tentang konsep ini?",
        },
        {
          id: "mostMemorableMoment",
          type: "longtext",
          required: false,
          labelEn: "What was the most memorable moment?",
          labelId: "Momen apa yang paling berkesan?",
        },
        {
          id: "improvementSuggestion",
          type: "longtext",
          required: false,
          labelEn: "What would you change or add?",
          labelId: "Apa yang akan kamu ubah atau tambahkan?",
        },
        {
          id: "additionalFeedback",
          type: "longtext",
          required: false,
          labelEn: "Any additional thoughts you'd like to share?",
          labelId: "Pemikiran tambahan yang ingin kamu sampaikan?",
        },
      ],
    },
  ],
};

// Set of question IDs that map 1:1 to legacy SurveyResult columns. Used by
// the survey submit handler to opportunistically populate those columns when
// the matching question still exists in the active template — keeps backward-
// compat with the admin Drawer / Insights panels that read those columns.
export const LEGACY_NUMBER_FIELDS: ReadonlySet<string> = new Set([
  "personaAccuracy",
  "replacementWillingness",
  "overallExperience",
  "uiEaseOfUse",
  "conceptFeasibility",
  "priorAiFamiliarity",
  "expectationAlignment",
  "customizationDepth",
  "stepFlowIntuitiveness",
  "visualFidelity",
  "revealImpact",
  "revealMatchedImagination",
  "voiceNaturalness",
  "voiceResponsiveness",
  "companionPresence",
  "conversationDepth",
  "preferredLongerSession",
  "ethicalConcernLevel",
  "impactOnHumanRelations",
  "socialAcceptancePrediction",
  "purchaseIntent",
  "willingnessToPayPremium",
  "emotionalConnection",
  "feltJudgedOrSafe",
  "wouldMissCompanion",
  "lonelinessAssist",
  "exhibitionQuality",
  "willRecommend",
  "npsScore",
]);

export const LEGACY_TEXT_FIELDS: ReadonlySet<string> = new Set([
  "mostInfluentialFeature",
  "additionalFeedback",
  "firstImpression",
  "discoverySource",
  "customizationTimeFeel",
  "missingCustomization",
  "expectedPriceRange",
  "preferredPricingModel",
  "biggestConcern",
  "mostMemorableMoment",
  "improvementSuggestion",
]);

export const LEGACY_ARRAY_FIELDS: ReadonlySet<string> = new Set([
  "revealEmotions",
  "ethicalConcerns",
  "primaryUseCase",
  "targetDemographic",
]);

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function validateTemplate(input: unknown): SurveyTemplateShape {
  if (!input || typeof input !== "object") {
    throw new Error("Template must be an object");
  }
  const obj = input as Record<string, unknown>;
  const sectionsRaw = obj.sections;
  if (!Array.isArray(sectionsRaw)) throw new Error("Template.sections must be an array");
  const allQuestionIds = new Set<string>();
  const sectionIds = new Set<string>();
  const sections: SurveySection[] = sectionsRaw.map((s, sIdx) => {
    if (!s || typeof s !== "object") throw new Error(`Section[${sIdx}] is not an object`);
    const sec = s as Record<string, unknown>;
    const id = String(sec.id ?? "").trim();
    if (!id) throw new Error(`Section[${sIdx}].id is required`);
    if (sectionIds.has(id)) throw new Error(`Duplicate section id: ${id}`);
    sectionIds.add(id);
    const titleEn = String(sec.titleEn ?? "").trim();
    const titleId = String(sec.titleId ?? "").trim();
    if (!titleEn || !titleId) throw new Error(`Section[${id}] requires titleEn + titleId`);
    const questionsRaw = sec.questions;
    if (!Array.isArray(questionsRaw)) throw new Error(`Section[${id}].questions must be an array`);
    const questions: SurveyQuestion[] = questionsRaw.map((q, qIdx) => {
      if (!q || typeof q !== "object") throw new Error(`Section[${id}].questions[${qIdx}] is not an object`);
      const qo = q as Record<string, unknown>;
      const qid = String(qo.id ?? "").trim();
      if (!qid) throw new Error(`Section[${id}].questions[${qIdx}].id required`);
      if (allQuestionIds.has(qid)) throw new Error(`Duplicate question id: ${qid}`);
      allQuestionIds.add(qid);
      const type = String(qo.type ?? "");
      const validTypes: QuestionType[] = ["likert", "nps", "single", "multi", "dropdown", "text", "longtext"];
      if (!(validTypes as string[]).includes(type)) throw new Error(`Question[${qid}] invalid type: ${type}`);
      const labelEn = String(qo.labelEn ?? "").trim();
      const labelId = String(qo.labelId ?? "").trim();
      if (!labelEn || !labelId) throw new Error(`Question[${qid}] requires labelEn + labelId`);
      const out: SurveyQuestion = {
        id: qid,
        type: type as QuestionType,
        required: Boolean(qo.required),
        labelEn,
        labelId,
      };
      if (typeof qo.helperEn === "string" && qo.helperEn.trim()) out.helperEn = qo.helperEn.trim();
      if (typeof qo.helperId === "string" && qo.helperId.trim()) out.helperId = qo.helperId.trim();
      if (out.type === "single" || out.type === "multi" || out.type === "dropdown") {
        if (!Array.isArray(qo.options)) throw new Error(`Question[${qid}] requires options[]`);
        const opts: SurveyOption[] = (qo.options as unknown[]).map((o, oIdx) => {
          if (!o || typeof o !== "object") throw new Error(`Question[${qid}].options[${oIdx}] not object`);
          const r = o as Record<string, unknown>;
          const value = String(r.value ?? "").trim();
          const opLabelEn = String(r.labelEn ?? "").trim();
          const opLabelId = String(r.labelId ?? "").trim();
          if (!value || !opLabelEn || !opLabelId) {
            throw new Error(`Question[${qid}].options[${oIdx}] requires value+labelEn+labelId`);
          }
          return { value, labelEn: opLabelEn, labelId: opLabelId };
        });
        if (opts.length === 0) throw new Error(`Question[${qid}] options[] cannot be empty`);
        out.options = opts;
      }
      if (out.type === "likert" && qo.anchors && typeof qo.anchors === "object") {
        const a = qo.anchors as Record<string, unknown>;
        out.anchors = {
          lowEn:  typeof a.lowEn === "string" ? a.lowEn  : undefined,
          lowId:  typeof a.lowId === "string" ? a.lowId  : undefined,
          midEn:  typeof a.midEn === "string" ? a.midEn  : undefined,
          midId:  typeof a.midId === "string" ? a.midId  : undefined,
          highEn: typeof a.highEn === "string" ? a.highEn : undefined,
          highId: typeof a.highId === "string" ? a.highId : undefined,
        };
      }
      if (out.type === "nps" && qo.npsAnchors && typeof qo.npsAnchors === "object") {
        const a = qo.npsAnchors as Record<string, unknown>;
        out.npsAnchors = {
          lowEn:  typeof a.lowEn === "string" ? a.lowEn  : undefined,
          lowId:  typeof a.lowId === "string" ? a.lowId  : undefined,
          highEn: typeof a.highEn === "string" ? a.highEn : undefined,
          highId: typeof a.highId === "string" ? a.highId : undefined,
        };
      }
      if (out.type === "multi" && typeof qo.maxSelections === "number" && qo.maxSelections > 0) {
        out.maxSelections = Math.floor(qo.maxSelections);
      }
      return out;
    });
    return {
      id,
      titleEn,
      titleId,
      descriptionEn: typeof sec.descriptionEn === "string" ? sec.descriptionEn : undefined,
      descriptionId: typeof sec.descriptionId === "string" ? sec.descriptionId : undefined,
      questions,
    };
  });
  return {
    version: typeof obj.version === "number" ? obj.version : 1,
    sections,
  };
}

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

export async function loadTemplate(): Promise<SurveyTemplateShape> {
  const row = await prisma.surveyTemplate.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, schema: JSON.stringify(DEFAULT_TEMPLATE) },
  });
  if (!row.schema || row.schema === "{}") {
    // First-time seed (column had its default empty JSON literal)
    await prisma.surveyTemplate.update({
      where: { id: 1 },
      data: { schema: JSON.stringify(DEFAULT_TEMPLATE) },
    });
    return DEFAULT_TEMPLATE;
  }
  try {
    const parsed = JSON.parse(row.schema);
    return validateTemplate(parsed);
  } catch (err) {
    console.warn("[surveyTemplate] failed to parse stored schema, falling back to default:", err);
    return DEFAULT_TEMPLATE;
  }
}

export async function saveTemplate(
  template: SurveyTemplateShape,
  updatedBy: string = "",
): Promise<SurveyTemplateShape> {
  const validated = validateTemplate(template);
  await prisma.surveyTemplate.upsert({
    where: { id: 1 },
    update: { schema: JSON.stringify(validated), version: validated.version, updatedBy: updatedBy.slice(0, 64) },
    create: { id: 1, schema: JSON.stringify(validated), version: validated.version, updatedBy: updatedBy.slice(0, 64) },
  });
  return validated;
}

// ---------------------------------------------------------------------------
// Response helpers (used by admin views)
// ---------------------------------------------------------------------------

// Pull a question's response value for a given user, preferring rawPayload
// (new dynamic) and falling back to the legacy hardcoded column.
export function readResponseValue(
  question: SurveyQuestion,
  rawPayload: Record<string, unknown> | null,
  legacyRow: Record<string, unknown> | null,
): unknown {
  if (rawPayload && question.id in rawPayload) {
    return rawPayload[question.id];
  }
  if (legacyRow && question.id in legacyRow) {
    return legacyRow[question.id];
  }
  return null;
}

// Generate a stable cuid-ish id for new questions/sections (no collisions
// for our scale; if migrating to high-volume, swap to crypto.randomUUID).
export function generateId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const ts = Date.now().toString(36).slice(-4);
  return `${prefix}-${ts}${rand}`;
}

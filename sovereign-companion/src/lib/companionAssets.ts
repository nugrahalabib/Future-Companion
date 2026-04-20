/**
 * Companion Asset Manifest
 *
 * Maps user Creator Studio selections to pre-generated image asset paths.
 * NO runtime AI rendering. App = pure lookup from combinatorial (gender, face, hair, body)
 * keys to a final composed hyper-realistic portrait.
 *
 * Assets supplied by design team under `/public/assets/`:
 *   - combine/{Gender} (G) - Face {Face} - Hair {H} - Body {B}.png   (16 composites)
 *   - detail-1on1/{GENDER}-FACE-{ALPHA|BETA}.png                      (face thumbnails)
 *   - detail-1on1/{FeMale|Male}-Hair-Style-{1|2}.png                  (hair thumbnails)
 *   - detail-1on1/{FeMale|Male}-Body-Type-{1|2}.png                   (body thumbnails)
 *
 * Axis cardinalities: 2 genders × 2 face shapes × 2 hair styles × 2 body builds = 16 composites.
 * Skin tone is applied at render time via CSS `filter`, NOT as a separate image variant.
 */

export type Gender = "female" | "male";

export interface VariantOption {
  id: string;
  label: string;
  description: string;
  thumbnail: string;
  labelKey?: string;
  descriptionKey?: string;
}

export interface SkinToneOption {
  id: string;
  label: string;
  description: string;
  cssFilter: string;
  swatch: string;
  labelKey?: string;
  descriptionKey?: string;
  comingSoon?: boolean;
}

// ------------------------------------------------------------------
// Step 2: Face Shape (gender-dependent, 2 variants each)
// ------------------------------------------------------------------
export const FACE_SHAPES: Record<Gender, VariantOption[]> = {
  female: [
    {
      id: "alpha",
      label: "Dominant / Alpha",
      description: "Strong, commanding facial architecture — sharp, assertive structure.",
      thumbnail: "/assets/detail-1on1/FEMALE-FACE-ALPHA.png",
      labelKey: "creator.face.female.alpha.label",
      descriptionKey: "creator.face.female.alpha.desc",
    },
    {
      id: "beta",
      label: "Soft / Beta",
      description: "Gentle, refined contours — warm and approachable presence.",
      thumbnail: "/assets/detail-1on1/FEMALE-FACE-BETA.png",
      labelKey: "creator.face.female.beta.label",
      descriptionKey: "creator.face.female.beta.desc",
    },
  ],
  male: [
    {
      id: "alpha",
      label: "Dominant / Alpha",
      description: "Strong masculine jawline — heroic, commanding profile.",
      thumbnail: "/assets/detail-1on1/MALE-FACE-ALPHA.png",
      labelKey: "creator.face.male.alpha.label",
      descriptionKey: "creator.face.male.alpha.desc",
    },
    {
      id: "beta",
      label: "Soft / Beta",
      description: "Refined gentle features — elegant, contemporary profile.",
      thumbnail: "/assets/detail-1on1/MALE-FACE-BETA.png",
      labelKey: "creator.face.male.beta.label",
      descriptionKey: "creator.face.male.beta.desc",
    },
  ],
};

// ------------------------------------------------------------------
// Step 3: Hair Style (gender-dependent, 2 variants each)
// ------------------------------------------------------------------
export const HAIR_STYLES: Record<Gender, VariantOption[]> = {
  female: [
    {
      id: "hair1",
      label: "Short / Neat",
      description: "Crisp short cut — minimalist, modern, and professional.",
      thumbnail: "/assets/detail-1on1/FeMale-Hair-Style-1.png",
      labelKey: "creator.hair.female.hair1.label",
      descriptionKey: "creator.hair.female.hair1.desc",
    },
    {
      id: "hair2",
      label: "Long / Flowing",
      description: "Long flowing strands — romantic, graceful silhouette.",
      thumbnail: "/assets/detail-1on1/FeMale-Hair-Style-2.png",
      labelKey: "creator.hair.female.hair2.label",
      descriptionKey: "creator.hair.female.hair2.desc",
    },
  ],
  male: [
    {
      id: "hair1",
      label: "Short / Neat",
      description: "Clean short cut — disciplined, timeless professional look.",
      thumbnail: "/assets/detail-1on1/Male-Hair-Style-1.png",
      labelKey: "creator.hair.male.hair1.label",
      descriptionKey: "creator.hair.male.hair1.desc",
    },
    {
      id: "hair2",
      label: "Long / Flowing",
      description: "Long flowing hair — artistic, philosopher-warrior presence.",
      thumbnail: "/assets/detail-1on1/Male-Hair-Style-2.png",
      labelKey: "creator.hair.male.hair2.label",
      descriptionKey: "creator.hair.male.hair2.desc",
    },
  ],
};

// ------------------------------------------------------------------
// Step 4: Body Build (gender-dependent thumbnails, 2 variants each)
// ------------------------------------------------------------------
export const BODY_BUILDS: Record<Gender, VariantOption[]> = {
  female: [
    {
      id: "body1",
      label: "Athletic / Broad",
      description: "Athletic, broad-shouldered frame — powerful, confident silhouette.",
      thumbnail: "/assets/detail-1on1/FeMale-Body-Type-1.png",
      labelKey: "creator.body.female.body1.label",
      descriptionKey: "creator.body.female.body1.desc",
    },
    {
      id: "body2",
      label: "Slim / Elegant",
      description: "Slim, elegantly proportioned frame — graceful, model-like silhouette.",
      thumbnail: "/assets/detail-1on1/FeMale-Body-Type-2.png",
      labelKey: "creator.body.female.body2.label",
      descriptionKey: "creator.body.female.body2.desc",
    },
  ],
  male: [
    {
      id: "body1",
      label: "Athletic / Broad",
      description: "Athletic, broad-shouldered build — strong, commanding physique.",
      thumbnail: "/assets/detail-1on1/Male-Body-Type-1.png",
      labelKey: "creator.body.male.body1.label",
      descriptionKey: "creator.body.male.body1.desc",
    },
    {
      id: "body2",
      label: "Slim / Elegant",
      description: "Slim, elegantly proportioned build — refined, graceful frame.",
      thumbnail: "/assets/detail-1on1/Male-Body-Type-2.png",
      labelKey: "creator.body.male.body2.label",
      descriptionKey: "creator.body.male.body2.desc",
    },
  ],
};

// ------------------------------------------------------------------
// Step 5: Skin Tone (CSS filter overlay — not a separate image variant)
// ------------------------------------------------------------------
export const SKIN_TONES: SkinToneOption[] = [
  {
    id: "fair",
    label: "Fair",
    description: "Porcelain-light complexion, cool undertones.",
    cssFilter: "brightness(1.08) saturate(0.95)",
    swatch: "#F3DFCB",
    labelKey: "creator.skin.fair.label",
    descriptionKey: "creator.skin.fair.desc",
  },
  {
    id: "medium",
    label: "Medium",
    description: "Warm olive balance, Mediterranean tone.",
    cssFilter: "none",
    swatch: "#D7A67A",
    labelKey: "creator.skin.medium.label",
    descriptionKey: "creator.skin.medium.desc",
  },
  {
    id: "tan",
    label: "Tan",
    description: "Sun-kissed bronze, warm amber depth.",
    cssFilter: "brightness(0.92) sepia(0.2) saturate(1.1)",
    swatch: "#B07A4B",
    labelKey: "creator.skin.tan.label",
    descriptionKey: "creator.skin.tan.desc",
    comingSoon: true,
  },
  {
    id: "deep",
    label: "Deep",
    description: "Rich dark complexion, luminous and regal.",
    cssFilter: "brightness(0.72) sepia(0.28) saturate(1.15) hue-rotate(-6deg)",
    swatch: "#6B3E22",
    labelKey: "creator.skin.deep.label",
    descriptionKey: "creator.skin.deep.desc",
    comingSoon: true,
  },
];

// ------------------------------------------------------------------
// Step 6: Extreme Biological Features (spec-only, does NOT change image)
// ------------------------------------------------------------------
export const EXTREME_FEATURES = [
  {
    id: "artificialWomb",
    label: "Synthetic Uterus Module",
    description:
      "Bio-engineered gestational chamber. Enables natural-equivalent reproduction with configurable fertility cycles.",
    badgeColor: "#39FF14",
    icon: "womb",
    labelKey: "creator.extreme.womb.label",
    descriptionKey: "creator.extreme.womb.desc",
  },
  {
    id: "spermBank",
    label: "Synthetic DNA / Sperm Bank",
    description:
      "Encrypted genetic library with on-demand viable gamete production. Heritage-customizable.",
    badgeColor: "#00F0FF",
    icon: "sperm",
    labelKey: "creator.extreme.sperm.label",
    descriptionKey: "creator.extreme.sperm.desc",
  },
] as const;

export type ExtremeFeatureId = (typeof EXTREME_FEATURES)[number]["id"];

export interface FeaturesState {
  artificialWomb: boolean;
  spermBank: boolean;
}

export const DEFAULT_FEATURES: FeaturesState = {
  artificialWomb: false,
  spermBank: false,
};

// ------------------------------------------------------------------
// Final composite lookup
// ------------------------------------------------------------------
export interface FinalImageInput {
  gender: Gender | string | null;
  faceShape: string | null;
  hairStyle: string | null;
  bodyBuild: string | null;
}

function faceLabelFromId(id: string): string | null {
  if (id === "alpha") return "Alpha";
  if (id === "beta") return "Beta";
  return null;
}

function hairNumberFromId(id: string): string | null {
  if (id === "hair1") return "1";
  if (id === "hair2") return "2";
  return null;
}

function bodyNumberFromId(id: string): string | null {
  if (id === "body1") return "1";
  if (id === "body2") return "2";
  return null;
}

/**
 * Resolves the composite portrait path. Returns null until all four axes are chosen
 * OR any id falls outside the known set (so we never generate a 404).
 *
 * File naming convention supplied by design team:
 *   `{Gender} (G) - Face {Face} - Hair {H} - Body {B}.png`
 *   e.g. `Female (F) - Face Alpha - Hair 1 - Body 1.png`
 */
export function getFinalImagePath(input: FinalImageInput): string | null {
  const { gender, faceShape, hairStyle, bodyBuild } = input;
  if (!gender || !faceShape || !hairStyle || !bodyBuild) return null;
  const genderWord = gender === "male" ? "Male" : "Female";
  const g = gender === "male" ? "M" : "F";
  const face = faceLabelFromId(faceShape);
  const hair = hairNumberFromId(hairStyle);
  const body = bodyNumberFromId(bodyBuild);
  if (!face || !hair || !body) return null;
  const filename = `${genderWord} (${g}) - Face ${face} - Hair ${hair} - Body ${body}.png`;
  return `/assets/combine/${encodeURIComponent(filename)}`;
}

// ------------------------------------------------------------------
// Step-specific lookups
// ------------------------------------------------------------------
export function getFaceOptions(gender: Gender | string | null): VariantOption[] {
  const g: Gender = gender === "male" ? "male" : "female";
  return FACE_SHAPES[g];
}

export function getHairOptions(gender: Gender | string | null): VariantOption[] {
  const g: Gender = gender === "male" ? "male" : "female";
  return HAIR_STYLES[g];
}

export function getBodyOptions(gender: Gender | string | null): VariantOption[] {
  const g: Gender = gender === "male" ? "male" : "female";
  return BODY_BUILDS[g];
}

export function getSkinTone(id: string | null | undefined): SkinToneOption {
  return SKIN_TONES.find((s) => s.id === id) ?? SKIN_TONES[1];
}

export function findVariant(
  options: VariantOption[],
  id: string | null | undefined,
): VariantOption | null {
  if (!id) return null;
  return options.find((o) => o.id === id) ?? null;
}

// ------------------------------------------------------------------
// Step metadata (for stepper header / progress indicator)
// ------------------------------------------------------------------
export interface CreatorStepMeta {
  step: number;
  key: string;
  title: string;
  subtitle: string;
  titleKey: string;
  subtitleKey: string;
}

export const CREATOR_STEPS: CreatorStepMeta[] = [
  { step: 1, key: "gender", title: "Gender", subtitle: "Choose the biological framework.", titleKey: "creator.gender.title", subtitleKey: "creator.gender.subtitle" },
  { step: 2, key: "faceShape", title: "Face Shape", subtitle: "Select the facial architecture.", titleKey: "creator.face.title", subtitleKey: "creator.face.subtitle" },
  { step: 3, key: "hairStyle", title: "Hair Style", subtitle: "Choose the crowning silhouette.", titleKey: "creator.hair.title", subtitleKey: "creator.hair.subtitle" },
  { step: 4, key: "bodyBuild", title: "Body Build", subtitle: "Define the physical frame.", titleKey: "creator.body.title", subtitleKey: "creator.body.subtitle" },
  { step: 5, key: "skinTone", title: "Skin Tone", subtitle: "Calibrate the dermal palette.", titleKey: "creator.skin.title", subtitleKey: "creator.skin.subtitle" },
  {
    step: 6,
    key: "features",
    title: "Extreme Features",
    subtitle: "Activate advanced biological modules.",
    titleKey: "creator.extreme.title",
    subtitleKey: "creator.extreme.subtitle",
  },
  { step: 7, key: "persona", title: "Persona", subtitle: "Shape the psychological core.", titleKey: "creator.persona.title", subtitleKey: "creator.persona.subtitle" },
  { step: 8, key: "hobbies", title: "Hobbies", subtitle: "Encode behavioral interests.", titleKey: "creator.hobbies.title", subtitleKey: "creator.hobbies.subtitle" },
];

export const TOTAL_CREATOR_STEPS = CREATOR_STEPS.length;

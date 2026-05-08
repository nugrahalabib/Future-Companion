/**
 * Companion Asset Manifest — v2 (3-gender × 4-axis × 16 composites)
 *
 * Maps Creator Studio selections → pre-rendered PNG asset paths.
 * NO runtime AI rendering. Pure lookup.
 *
 * Asset layout (under /public/assets/):
 *   {genderFolder}/face/FACE_{F|M|NG}_{A-E} — {Display Name}.png   (5 faces per gender)
 *   {genderFolder}/hair/HAIR_{F|M|NG}_{A-E} — {Display Name}.png   (5 hairs)
 *   {genderFolder}/body/BODY_{F|M|NG}_{A-F} — {Display Name}.png   (6 bodies)
 *   {genderFolder}/outfit/OUTFIT_{F|M|NG}_{A-E} — {Display Name}.png (5 outfits)
 *   {genderFolder}/combine/{FEM|MALE|NG}-COMP-{01..16} — {face} _ {hair} _ {body} _ {outfit}.png
 *
 * Per gender there are 6+5+5+5 = 21 individual options but only 16 *available*
 * combinations (2 face × 2 hair × 2 body × 2 outfit = 2^4). Items NOT used in
 * any combine are tagged `comingSoon: true` — UI lets user click + preview them
 * but blocks Next until an available item is picked.
 *
 * Skin tone is applied as a CSS `filter` overlay at render time (not a separate
 * image variant) — same as v1.
 */

// ==========================================================================
// Types
// ==========================================================================

export type Gender = "female" | "male" | "nonbinary";

export type AssetAxis = "face" | "hair" | "body" | "outfit";

export interface VariantOption {
  id: string;
  label: string;
  description: string;
  thumbnail: string;
  labelKey?: string;
  descriptionKey?: string;
  comingSoon?: boolean;
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

interface ComboEntry {
  face: string;
  hair: string;
  body: string;
  outfit: string;
  filename: string;
}

// ==========================================================================
// Folder + filename mappings per gender
// ==========================================================================

const GENDER_FOLDER: Record<Gender, string> = {
  female: "female",
  male: "male",
  nonbinary: "non-gender",
};

// ==========================================================================
// Gender meta (for GenderStep)
// ==========================================================================

export interface GenderOption {
  id: Gender;
  label: string;
  description: string;
  glyph: string;
  labelKey?: string;
  descriptionKey?: string;
}

export const GENDERS: GenderOption[] = [
  {
    id: "female",
    label: "Female",
    description: "Calibrate the feminine biological framework.",
    glyph: "♀",
    labelKey: "creator.gender.female.label",
    descriptionKey: "creator.gender.female.desc",
  },
  {
    id: "male",
    label: "Male",
    description: "Calibrate the masculine biological framework.",
    glyph: "♂",
    labelKey: "creator.gender.male.label",
    descriptionKey: "creator.gender.male.desc",
  },
  {
    id: "nonbinary",
    label: "Non-Binary",
    description: "Calibrate the androgynous neutral framework.",
    glyph: "⚧",
    labelKey: "creator.gender.nonbinary.label",
    descriptionKey: "creator.gender.nonbinary.desc",
  },
];

// ==========================================================================
// Face options (5 per gender)
// ==========================================================================

interface RawAsset {
  id: string;
  filename: string;
  label: string;
  description: string;
}

const FACE_RAW: Record<Gender, RawAsset[]> = {
  female: [
    { id: "A", filename: "FACE_F_A, Heart Shaped Elegant.png",  label: "Heart Shaped Elegant", description: "Sharp chin, refined heart-shaped contour." },
    { id: "B", filename: "FACE_F_B, Soft Oval Classic.png",     label: "Soft Oval Classic",    description: "Balanced oval architecture, classic feminine silhouette." },
    { id: "C", filename: "FACE_F_C, Round Youthful.png",        label: "Round Youthful",       description: "Round, soft cheeks, youthful presence." },
    { id: "D", filename: "FACE_F_D, Diamond Refined.png",       label: "Diamond Refined",      description: "Diamond contour with refined cheekbones." },
    { id: "E", filename: "FACE_F_E, Long Oval Serene.png",      label: "Long Oval Serene",     description: "Elongated oval, serene composure." },
  ],
  male: [
    { id: "A", filename: "FACE_M_A, Angular Strong.png",        label: "Angular Strong",        description: "Strong angular jaw, commanding masculine architecture." },
    { id: "B", filename: "FACE_M_B, Soft Masculine Oval.png",   label: "Soft Masculine Oval",   description: "Refined oval, contemporary masculine softness." },
    { id: "C", filename: "FACE_M_C, Rectangular Long.png",      label: "Rectangular Long",      description: "Elongated rectangular profile, classical hero look." },
    { id: "D", filename: "FACE_M_D, Broad Square.png",          label: "Broad Square",          description: "Broad square jaw, dominant frame." },
    { id: "E", filename: "FACE_M_E, Defined Oval Refined.png",  label: "Defined Oval Refined",  description: "Defined oval with sculpted refinement." },
  ],
  nonbinary: [
    { id: "A", filename: "FACE_NG_A, Soft Angular Androgynous.png", label: "Soft Angular Androgynous", description: "Soft angular features, balanced androgynous architecture." },
    { id: "B", filename: "FACE_NG_B, Balanced Neutral Oval.png",    label: "Balanced Neutral Oval",    description: "Neutral oval, balanced gender-fluid presence." },
    { id: "C", filename: "FACE_NG_C, Elongated Minimal.png",        label: "Elongated Minimal",        description: "Elongated minimal contour, sleek refinement." },
    { id: "D", filename: "FACE_NG_D, Round-Angular Hybrid.png",     label: "Round-Angular Hybrid",     description: "Hybrid round-angular interplay." },
    { id: "E", filename: "FACE_NG_E, Refined Narrow.png",           label: "Refined Narrow",           description: "Narrow refined frame, calm symmetry." },
  ],
};

// ==========================================================================
// Hair options (5 per gender)
// ==========================================================================

const HAIR_RAW: Record<Gender, RawAsset[]> = {
  female: [
    { id: "A", filename: "HAIR_F_A, Short Sleek.png",      label: "Short Sleek",      description: "Crisp short cut, minimalist modern silhouette." },
    { id: "B", filename: "HAIR_F_B, Medium Wavy.png",      label: "Medium Wavy",      description: "Mid-length waves, soft romantic flow." },
    { id: "C", filename: "HAIR_F_C, Long Straight.png",    label: "Long Straight",    description: "Long flowing straight strands, graceful presence." },
    { id: "D", filename: "HAIR_F_D, Wavy Bob.png",         label: "Wavy Bob",         description: "Wavy bob, playful framed silhouette." },
    { id: "E", filename: "HAIR_F_E, Layered Luxe.png",     label: "Layered Luxe",     description: "Layered luxe styling, runway-ready volume." },
  ],
  male: [
    { id: "A", filename: "HAIR_M_A, Short Classic.png",    label: "Short Classic",    description: "Clean short cut, disciplined timeless look." },
    { id: "B", filename: "HAIR_M_B, Medium Textured.png",  label: "Medium Textured",  description: "Medium textured layers, casual modern feel." },
    { id: "C", filename: "HAIR_M_C, Slick Back.png",       label: "Slick Back",       description: "Polished slick-back, executive sharpness." },
    { id: "D", filename: "HAIR_M_D, Curly Medium.png",     label: "Curly Medium",     description: "Medium curls, expressive artistic frame." },
    { id: "E", filename: "HAIR_M_E, Short Tousled.png",    label: "Short Tousled",    description: "Tousled short cut, effortless edge." },
  ],
  nonbinary: [
    { id: "A", filename: "HAIR_NG_A, Short Neutral.png",        label: "Short Neutral",        description: "Short neutral cut, gender-fluid clarity." },
    { id: "B", filename: "HAIR_NG_B, Medium Wavy Neutral.png",  label: "Medium Wavy Neutral",  description: "Medium wavy texture, balanced presence." },
    { id: "C", filename: "HAIR_NG_C, Long Sleek Neutral.png",   label: "Long Sleek Neutral",   description: "Long sleek neutral fall, modern minimal." },
    { id: "D", filename: "HAIR_NG_D, Layered Medium.png",       label: "Layered Medium",       description: "Layered medium length, soft volume." },
    { id: "E", filename: "HAIR_NG_E, Tousled Modern.png",       label: "Tousled Modern",       description: "Modern tousle, relaxed contemporary style." },
  ],
};

// ==========================================================================
// Body options (6 per gender)
// ==========================================================================

const BODY_RAW: Record<Gender, RawAsset[]> = {
  female: [
    { id: "A", filename: "BODY_F_A, Petite Slim.png",            label: "Petite Slim",            description: "Petite slim build, delicate proportions." },
    { id: "B", filename: "BODY_F_B, Soft Curvy.png",             label: "Soft Curvy",             description: "Soft curvy frame, warm feminine silhouette." },
    { id: "C", filename: "BODY_F_C, Athletic Lean.png",          label: "Athletic Lean",          description: "Athletic lean, toned and capable." },
    { id: "D", filename: "BODY_F_D, Voluptuous Hourglass.png",   label: "Voluptuous Hourglass",   description: "Voluptuous hourglass, classic feminine form." },
    { id: "E", filename: "BODY_F_E, Tall Elegant.png",           label: "Tall Elegant",           description: "Tall elegant frame, runway-poise." },
    { id: "F", filename: "BODY_F_F, Plus Size Soft.png",         label: "Plus Size Soft",         description: "Plus size soft, abundant warm presence." },
  ],
  male: [
    { id: "A", filename: "BODY_M_A, Lean Slim.png",              label: "Lean Slim",              description: "Lean slim build, modern minimal frame." },
    { id: "B", filename: "BODY_M_B, Athletic Balanced.png",      label: "Athletic Balanced",      description: "Athletic balanced, agile and capable." },
    { id: "C", filename: "BODY_M_C, Broad Shoulder Solid.png",   label: "Broad Shoulder Solid",   description: "Broad shoulders, solid commanding stance." },
    { id: "D", filename: "BODY_M_D, Muscular Defined.png",       label: "Muscular Defined",       description: "Muscular defined, sculpted physique." },
    { id: "E", filename: "BODY_M_E, Heavyset Soft.png",          label: "Heavyset Soft",          description: "Heavyset soft, warm grounded presence." },
    { id: "F", filename: "BODY_M_F, Tall Lean Muscular.png",     label: "Tall Lean Muscular",     description: "Tall lean muscular, athletic verticality." },
  ],
  nonbinary: [
    { id: "A", filename: "BODY_NG_A, Slim Neutral.png",          label: "Slim Neutral",           description: "Slim neutral build, androgynous balance." },
    { id: "B", filename: "BODY_NG_B, Soft Balanced.png",         label: "Soft Balanced",          description: "Soft balanced frame, gender-fluid warmth." },
    { id: "C", filename: "BODY_NG_C, Athletic Androgynous.png",  label: "Athletic Androgynous",   description: "Athletic androgynous, capable and centered." },
    { id: "D", filename: "BODY_NG_D, Tall Narrow.png",           label: "Tall Narrow",            description: "Tall narrow, vertical minimal silhouette." },
    { id: "E", filename: "BODY_NG_E, Curved Neutral.png",        label: "Curved Neutral",         description: "Curved neutral form, soft modern poise." },
    { id: "F", filename: "BODY_NG_F, Broad Neutral.png",         label: "Broad Neutral",          description: "Broad neutral build, grounded balanced presence." },
  ],
};

// ==========================================================================
// Outfit options (5 per gender)
// ==========================================================================

const OUTFIT_RAW: Record<Gender, RawAsset[]> = {
  female: [
    { id: "A", filename: "OUTFIT_F_A, Casual Luxe.png",            label: "Casual Luxe",          description: "Refined everyday luxe, easy elegance." },
    { id: "B", filename: "OUTFIT_F_B, Futuristic Minimal.png",     label: "Futuristic Minimal",   description: "Futuristic minimal silhouette, clean tech aesthetic." },
    { id: "C", filename: "OUTFIT_F_C, Evening Elegance.png",       label: "Evening Elegance",     description: "Evening elegance, formal soiree presence." },
    { id: "D", filename: "OUTFIT_F_D, Soft Domestic.png",          label: "Soft Domestic",        description: "Soft domestic comfort, intimate at-home." },
    { id: "E", filename: "OUTFIT_F_E, Sporty Activewear.png",      label: "Sporty Activewear",    description: "Sporty activewear, athletic kinetic energy." },
  ],
  male: [
    { id: "A", filename: "OUTFIT_M_A, Casual Luxe.png",            label: "Casual Luxe",          description: "Refined everyday luxe, contemporary ease." },
    { id: "B", filename: "OUTFIT_M_B, Futuristic Minimal.png",     label: "Futuristic Minimal",   description: "Futuristic minimal cut, modern tech style." },
    { id: "C", filename: "OUTFIT_M_C, Evening Formal.png",         label: "Evening Formal",       description: "Evening formalwear, executive black-tie composure." },
    { id: "D", filename: "OUTFIT_M_D, Soft Domestic.png",          label: "Soft Domestic",        description: "Soft domestic comfort, relaxed at-home." },
    { id: "E", filename: "OUTFIT_M_E, Sporty Activewear.png",      label: "Sporty Activewear",    description: "Sporty activewear, athletic dynamic energy." },
  ],
  nonbinary: [
    { id: "A", filename: "OUTFIT_NG_A, Minimal Neutral.png",          label: "Minimal Neutral",          description: "Minimal neutral cut, refined gender-fluid styling." },
    { id: "B", filename: "OUTFIT_NG_B, Futuristic Streamlined.png",   label: "Futuristic Streamlined",   description: "Futuristic streamlined, contemporary tech-fashion." },
    { id: "C", filename: "OUTFIT_NG_C, Lounge Neutral.png",           label: "Lounge Neutral",           description: "Lounge neutral, relaxed soft styling." },
    { id: "D", filename: "OUTFIT_NG_D, Evening Formal.png",           label: "Evening Formal",           description: "Evening formal, sleek modern composure." },
    { id: "E", filename: "OUTFIT_NG_E, Sporty Activewear.png",        label: "Sporty Activewear",        description: "Sporty activewear, kinetic neutral energy." },
  ],
};

// ==========================================================================
// Combine entries — 16 per gender (2^4 enumeration: face × hair × body × outfit)
// Filenames are verbatim from /public/assets/{folder}/combine/
// ==========================================================================

const COMBINES: Record<Gender, ComboEntry[]> = {
  female: [
    { face: "A", hair: "A", body: "A", outfit: "A", filename: "FEM-COMP-01, Heart _ Short Sleek _ Petite _ Casual Luxe.png" },
    { face: "A", hair: "A", body: "A", outfit: "C", filename: "FEM-COMP-02, Heart _ Short Sleek _ Petite _ Evening Elegance.png" },
    { face: "A", hair: "A", body: "D", outfit: "A", filename: "FEM-COMP-03, Heart _ Short Sleek _ Hourglass _ Casual Luxe.png" },
    { face: "A", hair: "A", body: "D", outfit: "C", filename: "FEM-COMP-04, Heart _ Short Sleek _ Hourglass _ Evening Elegance.png" },
    { face: "A", hair: "C", body: "A", outfit: "A", filename: "FEM-COMP-05, Heart _ Long Straight _ Petite _ Casual Luxe.png" },
    { face: "A", hair: "C", body: "A", outfit: "C", filename: "FEM-COMP-06, Heart _ Long Straight _ Petite _ Evening Elegance.png" },
    { face: "A", hair: "C", body: "D", outfit: "A", filename: "FEM-COMP-07, Heart _ Long Straight _ Hourglass _ Casual Luxe.png" },
    { face: "A", hair: "C", body: "D", outfit: "C", filename: "FEM-COMP-08, Heart _ Long Straight _ Hourglass _ Evening Elegance.png" },
    { face: "B", hair: "A", body: "A", outfit: "A", filename: "FEM-COMP-09, Oval _ Short Sleek _ Petite _ Casual Luxe.png" },
    { face: "B", hair: "A", body: "A", outfit: "C", filename: "FEM-COMP-10, Oval _ Short Sleek _ Petite _ Evening Elegance.png" },
    { face: "B", hair: "A", body: "D", outfit: "A", filename: "FEM-COMP-11, Oval _ Short Sleek _ Hourglass _ Casual Luxe.png" },
    { face: "B", hair: "A", body: "D", outfit: "C", filename: "FEM-COMP-12, Oval _ Short Sleek _ Hourglass _ Evening Elegance.png" },
    { face: "B", hair: "C", body: "A", outfit: "A", filename: "FEM-COMP-13, Oval _ Long Straight _ Petite _ Casual Luxe.png" },
    { face: "B", hair: "C", body: "A", outfit: "C", filename: "FEM-COMP-14, Oval _ Long Straight _ Petite _ Evening Elegance.png" },
    { face: "B", hair: "C", body: "D", outfit: "A", filename: "FEM-COMP-15, Oval _ Long Straight _ Hourglass _ Casual Luxe.png" },
    { face: "B", hair: "C", body: "D", outfit: "C", filename: "FEM-COMP-16, Oval _ Long Straight _ Hourglass _ Evening Elegance.png" },
  ],
  male: [
    { face: "A", hair: "A", body: "A", outfit: "A", filename: "MALE-COMP-01, Angular _ Short Classic _ Lean Slim _ Casual Luxe.png" },
    { face: "A", hair: "A", body: "A", outfit: "C", filename: "MALE-COMP-02, Angular _ Short Classic _ Lean Slim _ Evening Formal.png" },
    { face: "A", hair: "A", body: "D", outfit: "A", filename: "MALE-COMP-03, Angular _ Short Classic _ Muscular _ Casual Luxe.png" },
    { face: "A", hair: "A", body: "D", outfit: "C", filename: "MALE-COMP-04, Angular _ Short Classic _ Muscular _ Evening Formal.png" },
    { face: "A", hair: "C", body: "A", outfit: "A", filename: "MALE-COMP-05, Angular _ Slick Back _ Lean Slim _ Casual Luxe.png" },
    { face: "A", hair: "C", body: "A", outfit: "C", filename: "MALE-COMP-06, Angular _ Slick Back _ Lean Slim _ Evening Formal.png" },
    { face: "A", hair: "C", body: "D", outfit: "A", filename: "MALE-COMP-07, Angular _ Slick Back _ Muscular _ Casual Luxe.png" },
    { face: "A", hair: "C", body: "D", outfit: "C", filename: "MALE-COMP-08, Angular _ Slick Back _ Muscular _ Evening Formal.png" },
    { face: "B", hair: "A", body: "A", outfit: "A", filename: "MALE-COMP-09, Soft Oval _ Short Classic _ Lean Slim _ Casual Luxe.png" },
    { face: "B", hair: "A", body: "A", outfit: "C", filename: "MALE-COMP-10, Soft Oval _ Short Classic _ Lean Slim _ Evening Formal.png" },
    { face: "B", hair: "A", body: "D", outfit: "A", filename: "MALE-COMP-11, Soft Oval _ Short Classic _ Muscular _ Casual Luxe.png" },
    { face: "B", hair: "A", body: "D", outfit: "C", filename: "MALE-COMP-12, Soft Oval _ Short Classic _ Muscular _ Evening Formal.png" },
    { face: "B", hair: "C", body: "A", outfit: "A", filename: "MALE-COMP-13, Soft Oval _ Slick Back _ Lean Slim _ Casual Luxe.png" },
    { face: "B", hair: "C", body: "A", outfit: "C", filename: "MALE-COMP-14, Soft Oval _ Slick Back _ Lean Slim _ Evening Formal.png" },
    { face: "B", hair: "C", body: "D", outfit: "A", filename: "MALE-COMP-15, Soft Oval _ Slick Back _ Muscular _ Casual Luxe.png" },
    { face: "B", hair: "C", body: "D", outfit: "C", filename: "MALE-COMP-16, Soft Oval _ Slick Back _ Muscular _ Evening Formal.png" },
  ],
  nonbinary: [
    { face: "A", hair: "A", body: "A", outfit: "A", filename: "NG-COMP-01, Soft Angular _ Short Neutral _ Slim Neutral _ Minimal Neutral.png" },
    { face: "A", hair: "A", body: "A", outfit: "B", filename: "NG-COMP-02, Soft Angular _ Short Neutral _ Slim Neutral _ Futuristic Streamlined.png" },
    // Note: source file uses "Minimal" (without "Neutral") at this slot — kept verbatim.
    { face: "A", hair: "A", body: "C", outfit: "A", filename: "NG-COMP-03, Soft Angular _ Short Neutral _ Athletic Androgynous _ Minimal.png" },
    { face: "A", hair: "A", body: "C", outfit: "B", filename: "NG-COMP-04, Soft Angular _ Short Neutral _ Athletic Androgynous _ Futuristic Streamlined.png" },
    { face: "A", hair: "C", body: "A", outfit: "A", filename: "NG-COMP-05, Soft Angular _ Long Sleek Neutral _ Slim Neutral _ Minimal Neutral.png" },
    { face: "A", hair: "C", body: "A", outfit: "B", filename: "NG-COMP-06, Soft Angular _ Long Sleek Neutral _ Slim Neutral _ Futuristic Streamlined.png" },
    { face: "A", hair: "C", body: "C", outfit: "A", filename: "NG-COMP-07, Soft Angular _ Long Sleek Neutral _ Athletic Androgynous _ Minimal Neutral.png" },
    { face: "A", hair: "C", body: "C", outfit: "B", filename: "NG-COMP-08, Soft Angular _ Long Sleek Neutral _ Athletic Androgynous _ Futuristic Streamlined.png" },
    { face: "B", hair: "A", body: "A", outfit: "A", filename: "NG-COMP-09, Balanced Neutral Oval _ Short Neutral _ Slim Neutral _ Minimal Neutral.png" },
    { face: "B", hair: "A", body: "A", outfit: "B", filename: "NG-COMP-10, Balanced Neutral Oval _ Short Neutral _ Slim Neutral _ Futuristic Streamlined.png" },
    { face: "B", hair: "A", body: "C", outfit: "A", filename: "NG-COMP-11, Balanced Neutral Oval _ Short Neutral _ Athletic Androgynous _ Minimal Neutral.png" },
    { face: "B", hair: "A", body: "C", outfit: "B", filename: "NG-COMP-12, Balanced Neutral Oval _ Short Neutral _ Athletic Androgynous _ Futuristic Streamlined.png" },
    { face: "B", hair: "C", body: "A", outfit: "A", filename: "NG-COMP-13, Balanced Neutral Oval _ Long Sleek Neutral _ Slim Neutral _ Minimal Neutral.png" },
    { face: "B", hair: "C", body: "A", outfit: "B", filename: "NG-COMP-14, Balanced Neutral Oval _ Long Sleek Neutral _ Slim Neutral _ Futuristic Streamlined.png" },
    { face: "B", hair: "C", body: "C", outfit: "A", filename: "NG-COMP-15, Balanced Neutral Oval _ Long Sleek Neutral _ Athletic Androgynous _ Minimal Neutral.png" },
    { face: "B", hair: "C", body: "C", outfit: "B", filename: "NG-COMP-16, Balanced Neutral Oval _ Long Sleek Neutral _ Athletic Androgynous _ Futuristic Streamlined.png" },
  ],
};

// ==========================================================================
// Allowed-set derivation — which IDs appear in any combine for this gender×axis
// ==========================================================================

function deriveAllowedSet(gender: Gender, axis: AssetAxis): Set<string> {
  const set = new Set<string>();
  for (const c of COMBINES[gender]) set.add(c[axis]);
  return set;
}

const ALLOWED: Record<Gender, Record<AssetAxis, Set<string>>> = {
  female:    { face: deriveAllowedSet("female", "face"),    hair: deriveAllowedSet("female", "hair"),    body: deriveAllowedSet("female", "body"),    outfit: deriveAllowedSet("female", "outfit") },
  male:      { face: deriveAllowedSet("male", "face"),      hair: deriveAllowedSet("male", "hair"),      body: deriveAllowedSet("male", "body"),      outfit: deriveAllowedSet("male", "outfit") },
  nonbinary: { face: deriveAllowedSet("nonbinary", "face"), hair: deriveAllowedSet("nonbinary", "hair"), body: deriveAllowedSet("nonbinary", "body"), outfit: deriveAllowedSet("nonbinary", "outfit") },
};

export function isPickAvailable(gender: Gender, axis: AssetAxis, id: string | null | undefined): boolean {
  if (!id) return false;
  return ALLOWED[gender]?.[axis]?.has(id) === true;
}

// ==========================================================================
// Asset → VariantOption transformer
// ==========================================================================

function buildOptions(gender: Gender, axis: AssetAxis, raws: RawAsset[]): VariantOption[] {
  const allowed = ALLOWED[gender][axis];
  const folder = GENDER_FOLDER[gender];
  return raws.map((r) => ({
    id: r.id,
    label: r.label,
    description: r.description,
    thumbnail: `/assets/${folder}/${axis}/${encodeURIComponent(r.filename)}`,
    comingSoon: !allowed.has(r.id),
  }));
}

// Memoized per-gender option arrays (computed once at module load)
const FACE_OPTIONS: Record<Gender, VariantOption[]> = {
  female: buildOptions("female", "face", FACE_RAW.female),
  male:   buildOptions("male",   "face", FACE_RAW.male),
  nonbinary: buildOptions("nonbinary", "face", FACE_RAW.nonbinary),
};

const HAIR_OPTIONS: Record<Gender, VariantOption[]> = {
  female: buildOptions("female", "hair", HAIR_RAW.female),
  male:   buildOptions("male",   "hair", HAIR_RAW.male),
  nonbinary: buildOptions("nonbinary", "hair", HAIR_RAW.nonbinary),
};

const BODY_OPTIONS: Record<Gender, VariantOption[]> = {
  female: buildOptions("female", "body", BODY_RAW.female),
  male:   buildOptions("male",   "body", BODY_RAW.male),
  nonbinary: buildOptions("nonbinary", "body", BODY_RAW.nonbinary),
};

const OUTFIT_OPTIONS: Record<Gender, VariantOption[]> = {
  female: buildOptions("female", "outfit", OUTFIT_RAW.female),
  male:   buildOptions("male",   "outfit", OUTFIT_RAW.male),
  nonbinary: buildOptions("nonbinary", "outfit", OUTFIT_RAW.nonbinary),
};

// ==========================================================================
// Skin Tone (unchanged from v1 — applied as CSS filter overlay)
// ==========================================================================

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

// ==========================================================================
// Extreme Biological Features (unchanged from v1 — spec-only, no image variant)
// ==========================================================================

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

// ==========================================================================
// Final composite resolver
// ==========================================================================

export interface FinalImageInput {
  gender: Gender | string | null;
  faceShape: string | null;
  hairStyle: string | null;
  bodyBuild: string | null;
  outfit: string | null;
}

function normalizeGender(g: string | null | undefined): Gender | null {
  if (g === "female" || g === "male" || g === "nonbinary") return g;
  return null;
}

export function getFinalImagePath(input: FinalImageInput): string | null {
  const g = normalizeGender(input.gender);
  const { faceShape, hairStyle, bodyBuild, outfit } = input;
  if (!g || !faceShape || !hairStyle || !bodyBuild || !outfit) return null;
  const found = COMBINES[g].find(
    (c) => c.face === faceShape && c.hair === hairStyle && c.body === bodyBuild && c.outfit === outfit,
  );
  if (!found) return null;
  return `/assets/${GENDER_FOLDER[g]}/combine/${encodeURIComponent(found.filename)}`;
}

// ==========================================================================
// Step-specific lookups
// ==========================================================================

export function getFaceOptions(gender: Gender | string | null): VariantOption[] {
  const g = normalizeGender(gender) ?? "female";
  return FACE_OPTIONS[g];
}

export function getHairOptions(gender: Gender | string | null): VariantOption[] {
  const g = normalizeGender(gender) ?? "female";
  return HAIR_OPTIONS[g];
}

export function getBodyOptions(gender: Gender | string | null): VariantOption[] {
  const g = normalizeGender(gender) ?? "female";
  return BODY_OPTIONS[g];
}

export function getOutfitOptions(gender: Gender | string | null): VariantOption[] {
  const g = normalizeGender(gender) ?? "female";
  return OUTFIT_OPTIONS[g];
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

// Returns the raw filename for a given gender × axis × id (without path/encode).
// Used by admin labels / drawer for display name lookups.
export function getAssetLabel(
  gender: Gender | string | null,
  axis: AssetAxis,
  id: string | null | undefined,
): string | null {
  const g = normalizeGender(gender);
  if (!g || !id) return null;
  const list =
    axis === "face" ? FACE_RAW[g] :
    axis === "hair" ? HAIR_RAW[g] :
    axis === "body" ? BODY_RAW[g] :
    OUTFIT_RAW[g];
  const item = list.find((r) => r.id === id);
  return item?.label ?? null;
}

// ==========================================================================
// Step metadata (stepper header + progress)
// ==========================================================================

export interface CreatorStepMeta {
  step: number;
  key: string;
  title: string;
  subtitle: string;
  titleKey: string;
  subtitleKey: string;
}

export const CREATOR_STEPS: CreatorStepMeta[] = [
  { step: 1, key: "gender",     title: "Gender",           subtitle: "Choose the biological framework.",      titleKey: "creator.gender.title",  subtitleKey: "creator.gender.subtitle" },
  { step: 2, key: "faceShape",  title: "Face Shape",       subtitle: "Select the facial architecture.",       titleKey: "creator.face.title",    subtitleKey: "creator.face.subtitle" },
  { step: 3, key: "hairStyle",  title: "Hair Style",       subtitle: "Choose the crowning silhouette.",       titleKey: "creator.hair.title",    subtitleKey: "creator.hair.subtitle" },
  { step: 4, key: "bodyBuild",  title: "Body Build",       subtitle: "Define the physical frame.",            titleKey: "creator.body.title",    subtitleKey: "creator.body.subtitle" },
  { step: 5, key: "outfit",     title: "Outfit",           subtitle: "Tailor the wardrobe presence.",         titleKey: "creator.outfit.title",  subtitleKey: "creator.outfit.subtitle" },
  { step: 6, key: "skinTone",   title: "Skin Tone",        subtitle: "Calibrate the dermal palette.",         titleKey: "creator.skin.title",    subtitleKey: "creator.skin.subtitle" },
  { step: 7, key: "features",   title: "Extreme Features", subtitle: "Activate advanced biological modules.", titleKey: "creator.extreme.title", subtitleKey: "creator.extreme.subtitle" },
  { step: 8, key: "persona",    title: "Persona",          subtitle: "Shape the psychological core.",         titleKey: "creator.persona.title", subtitleKey: "creator.persona.subtitle" },
  { step: 9, key: "hobbies",    title: "Hobbies",          subtitle: "Encode behavioral interests.",          titleKey: "creator.hobbies.title", subtitleKey: "creator.hobbies.subtitle" },
];

export const TOTAL_CREATOR_STEPS = CREATOR_STEPS.length;

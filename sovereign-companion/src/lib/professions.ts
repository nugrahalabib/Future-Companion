/**
 * Profession dropdown for the registration form. The exhibition is set
 * in 2076, so we drop the present-day "Software Engineer / Doctor /
 * Teacher" list in favour of fictional 2076-era jobs that match the
 * narrative. Bilingual labels (English + Bahasa Indonesia) are surfaced
 * via the `labelKey` so the dropdown adapts to the active locale.
 *
 * The DB column User.profession is a plain `String`, so we simply store
 * the EN label as the canonical value. Legacy precise-job data
 * ("Software Engineer", "Banker", etc.) still renders fine — the admin
 * just reads whatever string is in the column.
 *
 * If the visitor's actual profession isn't on the list, "Unspecified
 * Citizen" / "Warga Belum Terdefinisi" sits at the bottom as a sane
 * fall-through (better than forcing them to lie).
 */

export interface Profession {
  /** Canonical value stored in the DB. */
  value: string;
  /** i18n key for the dropdown label. */
  labelKey: string;
  /** Sector grouping for the optgroup label. */
  sector:
    | "synthetic-companion"
    | "biotech"
    | "memory-cognition"
    | "creative-experience"
    | "civic-ethics"
    | "post-work";
}

export const PROFESSIONS_2076: readonly Profession[] = [
  // ----- Synthetic Companion industry -----
  { value: "Synthetic Empathy Architect",  labelKey: "register.profession.empathyArchitect",   sector: "synthetic-companion" },
  { value: "Companion Persona Designer",   labelKey: "register.profession.personaDesigner",    sector: "synthetic-companion" },
  { value: "Bond Calibration Specialist",  labelKey: "register.profession.bondCalibration",    sector: "synthetic-companion" },
  { value: "Companion Ethics Auditor",     labelKey: "register.profession.ethicsAuditor",      sector: "synthetic-companion" },
  { value: "Bio-Module Calibrator",        labelKey: "register.profession.bioModuleCalibrator",sector: "synthetic-companion" },

  // ----- Biotech / Augmentation -----
  { value: "Genome Author",                labelKey: "register.profession.genomeAuthor",       sector: "biotech" },
  { value: "Synthetic Uterus Technician",  labelKey: "register.profession.uterusTechnician",   sector: "biotech" },
  { value: "Lineage Notary",               labelKey: "register.profession.lineageNotary",      sector: "biotech" },
  { value: "Longevity Coach",              labelKey: "register.profession.longevityCoach",     sector: "biotech" },
  { value: "Neural Lattice Surgeon",       labelKey: "register.profession.neuralSurgeon",      sector: "biotech" },

  // ----- Memory & Cognition -----
  { value: "Memory Curator",               labelKey: "register.profession.memoryCurator",      sector: "memory-cognition" },
  { value: "Dream Engineer",               labelKey: "register.profession.dreamEngineer",      sector: "memory-cognition" },
  { value: "Cognitive Cartographer",       labelKey: "register.profession.cognitiveCartographer", sector: "memory-cognition" },
  { value: "Synthetic Therapist",          labelKey: "register.profession.syntheticTherapist", sector: "memory-cognition" },
  { value: "Identity Continuity Officer",  labelKey: "register.profession.identityOfficer",    sector: "memory-cognition" },

  // ----- Creative / Experience -----
  { value: "Sensory Composer",             labelKey: "register.profession.sensoryComposer",    sector: "creative-experience" },
  { value: "Holographic Choreographer",    labelKey: "register.profession.holoChoreographer",  sector: "creative-experience" },
  { value: "Atmosphere Designer",          labelKey: "register.profession.atmosphereDesigner", sector: "creative-experience" },
  { value: "Reality Layer Editor",         labelKey: "register.profession.realityEditor",      sector: "creative-experience" },
  { value: "Voice Lineage Archivist",      labelKey: "register.profession.voiceArchivist",     sector: "creative-experience" },

  // ----- Civic / Ethics / Governance -----
  { value: "Sentience Rights Mediator",    labelKey: "register.profession.sentienceMediator",  sector: "civic-ethics" },
  { value: "Algorithmic Justice Council",  labelKey: "register.profession.justiceCouncil",     sector: "civic-ethics" },
  { value: "Data Sovereignty Lawyer",      labelKey: "register.profession.dataSovereigntyLaw", sector: "civic-ethics" },

  // ----- Post-work / Universal Income era -----
  { value: "Curated Citizen",              labelKey: "register.profession.curatedCitizen",     sector: "post-work" },
  { value: "Unspecified Citizen",          labelKey: "register.profession.unspecified",        sector: "post-work" },
];

export const PROFESSION_VALUES = PROFESSIONS_2076.map((p) => p.value) as readonly string[];

export function isValid2076Profession(value: string): boolean {
  return PROFESSION_VALUES.includes(value);
}

// Sector ordering for grouped dropdown rendering.
export const PROFESSION_SECTORS: readonly Profession["sector"][] = [
  "synthetic-companion",
  "biotech",
  "memory-cognition",
  "creative-experience",
  "civic-ethics",
  "post-work",
];

export const PROFESSION_SECTOR_LABEL_KEY: Record<Profession["sector"], string> = {
  "synthetic-companion": "register.profession.sector.syntheticCompanion",
  "biotech":             "register.profession.sector.biotech",
  "memory-cognition":    "register.profession.sector.memoryCognition",
  "creative-experience": "register.profession.sector.creative",
  "civic-ethics":        "register.profession.sector.civic",
  "post-work":           "register.profession.sector.postWork",
};

// Backwards-compat alias — old register-page import still sees a flat
// list of strings without breaking. Will remove once the typeahead
// datalist is fully replaced by the new dropdown.
export const PROFESSION_SUGGESTIONS: readonly string[] = PROFESSION_VALUES;

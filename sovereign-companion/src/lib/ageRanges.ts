/**
 * Age ranges shown to the visitor at registration time. We collect a
 * range (not an exact age) for privacy and because the academic dataset
 * doesn't need year-precision — bucket-precision is more than enough for
 * the persona / insight charts.
 *
 * Storage convention: the User.age column stays a plain Int (no schema
 * migration needed). On submit, we store the LOWER BOUND of whatever
 * range the visitor picked. Any place in the admin that needs to show
 * the range derives it back via `ageToRange(age)` — historical rows that
 * stored a precise age (e.g. age=27) still resolve to the matching
 * bucket (25-30) so the legacy data remains analyzable side-by-side.
 *
 * The Insights page age-bucket chart keeps reading age as Int — no
 * change needed there.
 */

export interface AgeRange {
  /** Range identifier sent over the wire (e.g. "25-30"). */
  id: string;
  /** Lower bound in years. Stored on the User row. */
  min: number;
  /** Upper bound in years (inclusive). 200 = open-ended (60+). */
  max: number;
  /** Human-readable label for the dropdown / admin display. */
  label: string;
}

export const AGE_RANGES: readonly AgeRange[] = [
  { id: "18-24", min: 18, max: 24, label: "18 – 24" },
  { id: "25-30", min: 25, max: 30, label: "25 – 30" },
  { id: "31-40", min: 31, max: 40, label: "31 – 40" },
  { id: "41-50", min: 41, max: 50, label: "41 – 50" },
  { id: "51-60", min: 51, max: 60, label: "51 – 60" },
  { id: "60+",   min: 60, max: 200, label: "60+" },
];

const VALID_LOWER_BOUNDS = new Set(AGE_RANGES.map((r) => r.min));

export function isValidAgeLowerBound(value: number): boolean {
  return VALID_LOWER_BOUNDS.has(value);
}

export function ageRangeById(id: string): AgeRange | undefined {
  return AGE_RANGES.find((r) => r.id === id);
}

/**
 * Maps an integer age (legacy precise-age data OR the lower-bound we
 * now store) to the human label of its containing range. Returns "—"
 * for null/0 so the admin UI never renders a stray "0".
 */
export function ageToRangeLabel(age: number | null | undefined): string {
  if (age == null || age <= 0) return "—";
  for (const r of AGE_RANGES) {
    if (age >= r.min && age <= r.max) return r.label;
  }
  return "—";
}

export function ageToRangeId(age: number | null | undefined): string | null {
  if (age == null || age <= 0) return null;
  for (const r of AGE_RANGES) {
    if (age >= r.min && age <= r.max) return r.id;
  }
  return null;
}

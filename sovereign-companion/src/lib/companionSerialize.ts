export type FeaturesShape = { artificialWomb?: boolean; spermBank?: boolean };

export function parseHobbies(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function stringifyHobbies(hobbies: string[] | undefined | null): string {
  return JSON.stringify(Array.isArray(hobbies) ? hobbies : []);
}

export function parseFeatures(raw: string | null | undefined): FeaturesShape {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw);
    return typeof v === "object" && v !== null ? (v as FeaturesShape) : {};
  } catch {
    return {};
  }
}

export function stringifyFeatures(features: FeaturesShape | undefined | null): string {
  return JSON.stringify(features ?? {});
}

export function parseJsonObject<T = Record<string, unknown>>(raw: string | null | undefined): T | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    return typeof v === "object" && v !== null ? (v as T) : null;
  } catch {
    return null;
  }
}

export function stringifyJson(value: unknown): string {
  return JSON.stringify(value ?? {});
}

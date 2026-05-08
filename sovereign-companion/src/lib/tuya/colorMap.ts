// Color name → HSV mapping for Tuya RGB lights.
//
// Tuya HSV scale per spec:
//   h: 0–360 (degrees)
//   s: 0–1000 (saturation)
//   v: 0–1000 (value/brightness)
//
// Names accept English + Indonesian + a handful of mood synonyms so the AI
// can pass natural language ("red", "merah", "warm sunset") and we resolve.

export interface HsvColor {
  h: number;
  s: number;
  v: number;
}

export const COLOR_NAMES: Record<string, HsvColor> = {
  // ----- Pure spectrum -----
  red:        { h: 0,   s: 1000, v: 1000 },
  merah:      { h: 0,   s: 1000, v: 1000 },
  orange:     { h: 30,  s: 1000, v: 1000 },
  oranye:     { h: 30,  s: 1000, v: 1000 },
  jingga:     { h: 30,  s: 1000, v: 1000 },
  yellow:     { h: 60,  s: 1000, v: 1000 },
  kuning:     { h: 60,  s: 1000, v: 1000 },
  green:      { h: 120, s: 1000, v: 1000 },
  hijau:      { h: 120, s: 1000, v: 1000 },
  cyan:       { h: 180, s: 1000, v: 1000 },
  teal:       { h: 180, s: 1000, v: 1000 },
  blue:       { h: 240, s: 1000, v: 1000 },
  biru:       { h: 240, s: 1000, v: 1000 },
  indigo:     { h: 260, s: 1000, v: 1000 },
  purple:     { h: 280, s: 1000, v: 1000 },
  ungu:       { h: 280, s: 1000, v: 1000 },
  violet:     { h: 280, s: 1000, v: 1000 },
  pink:       { h: 330, s: 1000, v: 1000 },
  magenta:    { h: 320, s: 1000, v: 1000 },

  // ----- Mood / scene presets the AI is likely to invoke -----
  warm:       { h: 30,  s: 600,  v: 700 },   // amber
  hangat:     { h: 30,  s: 600,  v: 700 },
  cozy:       { h: 20,  s: 700,  v: 600 },
  romantic:   { h: 320, s: 800,  v: 600 },   // soft pink
  romantis:   { h: 320, s: 800,  v: 600 },
  sunset:     { h: 15,  s: 800,  v: 800 },   // golden orange
  candle:     { h: 25,  s: 700,  v: 500 },
  intimate:   { h: 350, s: 700,  v: 500 },
  intim:      { h: 350, s: 700,  v: 500 },
  passion:    { h: 350, s: 1000, v: 800 },
  panas:      { h: 350, s: 1000, v: 800 },
  calm:       { h: 220, s: 600,  v: 700 },
  tenang:     { h: 220, s: 600,  v: 700 },
  sad:        { h: 230, s: 700,  v: 500 },
  sedih:      { h: 230, s: 700,  v: 500 },
  galau:      { h: 230, s: 700,  v: 500 },
  focus:      { h: 200, s: 200,  v: 1000 },  // cool near-white for productivity
  fokus:      { h: 200, s: 200,  v: 1000 },
  party:      { h: 280, s: 1000, v: 1000 },
  energetic:  { h: 60,  s: 1000, v: 1000 },
  semangat:   { h: 60,  s: 1000, v: 1000 },
  dim:        { h: 30,  s: 500,  v: 200 },   // very low warm
  redup:      { h: 30,  s: 500,  v: 200 },
  sleep:      { h: 10,  s: 800,  v: 100 },   // very dim red
  tidur:      { h: 10,  s: 800,  v: 100 },
};

// Returns null when the color name isn't recognized — caller should fall
// back to the white mode or surface the error to the model.
export function resolveColor(input: string | null | undefined): HsvColor | null {
  if (!input) return null;
  const key = input.trim().toLowerCase();
  if (!key) return null;
  return COLOR_NAMES[key] ?? null;
}

// "white" / "putih" → no HSV; switches the device's work_mode to white.
export function isWhiteMode(input: string | null | undefined): boolean {
  if (!input) return false;
  const key = input.trim().toLowerCase();
  return key === "white" || key === "putih" || key === "netral";
}

// Public list (admin UI hint). Sorted by category for legibility.
export const SUGGESTED_COLOR_NAMES = [
  "red", "orange", "yellow", "green", "cyan", "blue", "purple", "pink", "white",
  "warm", "cozy", "romantic", "sunset", "candle", "passion",
  "calm", "sad", "focus", "party", "dim", "sleep",
];

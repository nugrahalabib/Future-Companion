/**
 * Conversation Suggestion Template — admin-editable categories + items.
 *
 * Stored as JSON in the singleton `SuggestionTemplate` row (Prisma id=1).
 * The encounter page's right-side suggestion panel renders from this. Two
 * data shapes are merged at render time:
 *
 *   1. `categories[]`  — fixed-order tabs (Icebreakers / Go Deeper / etc).
 *   2. `hobbyPrompts[]` — per-hobby prompts that auto-collect into a single
 *      "Your Interests" tab when the user picked any matching hobby.
 *
 * Hot-reload guarantee: the public /api/suggestions endpoint is no-store +
 * force-dynamic, so any /admin/suggestions edit shows up on the next
 * encounter mount without restart.
 */

import { prisma } from "./prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BilingualText {
  en: string;
  id: string;
}

export interface SuggestionItem {
  en: string;
  id: string;
}

export interface SuggestionCategory {
  id: string;
  accent: string;          // hex color for tab pill + item left-border
  label: BilingualText;
  hint: BilingualText;
  items: SuggestionItem[];
}

export interface HobbyPromptGroup {
  hobby: string;           // e.g. "Technology", "Philosophy" (matches hobby IDs)
  items: SuggestionItem[];
}

export interface SuggestionTemplateShape {
  version: number;
  categories: SuggestionCategory[];
  hobbyPrompts: HobbyPromptGroup[];
}

// ---------------------------------------------------------------------------
// Default template — mirrors the legacy hardcoded STATIC_CATEGORIES +
// HOBBY_PROMPTS so the encounter page renders identically when no admin
// edits exist yet.
// ---------------------------------------------------------------------------

export const DEFAULT_SUGGESTIONS: SuggestionTemplateShape = {
  version: 2,
  categories: [
    {
      id: "icebreaker",
      accent: "#FF2D87",
      label: { id: "Mulai Ringan", en: "Icebreakers" },
      hint: {
        id: "Pembuka ringan yang bikin dia langsung hadir penuh.",
        en: "Soft openers, the kind that make her show up fast.",
      },
      items: [
        {
          id: "Baca aku sekarang. Lagi mood seperti apa aku?",
          en: "Read me right now. What kind of mood am I in?",
        },
        {
          id: "Pikiran pertama yang nyamber di kepala kamu pas aku mulai ngomong, apa?",
          en: "What's the first thought that hit your head when I started talking?",
        },
        {
          id: "Pilih nama yang cuma kamu yang panggil aku. Yang cuma jadi milik kita berdua.",
          en: "Pick a name only you call me. Something just ours.",
        },
        {
          id: "Kalau kita baru ketemu di cafe sekarang, kamu mulainya gimana?",
          en: "If we just met at a cafe right now, how would you start?",
        },
        {
          id: "Tanyain aku pertanyaan yang belum pernah ada yang balikin ke kamu.",
          en: "Ask me a question no one's ever asked you back.",
        },
      ],
    },
    {
      id: "deeper",
      accent: "#FF2D87",
      label: { id: "Gali Dalam", en: "Go Deeper" },
      hint: {
        id: "Saat ruangan udah cukup aman buat lepas topeng.",
        en: "When the room feels safe enough to take the mask off.",
      },
      items: [
        {
          id: "Ceritain hal terakhir yang bikin kamu nangis. Tanpa edit, tanpa versi rapinya.",
          en: "Tell me the last thing you cried about. No edit, no clean version.",
        },
        {
          id: "Apa hal yang kamu terus bilang iya, padahal sebenernya pengen banget bilang nggak?",
          en: "What's something you keep saying yes to that you actually want to say no to?",
        },
        {
          id: "Kapan terakhir kamu ngerasa beneran jadi diri sendiri, dan lagi ngapain saat itu?",
          en: "When was the last time you felt fully yourself, and what were you doing?",
        },
        {
          id: "Kalau aku bisa hapus satu penyesalan dari kepala kamu, yang mana yang kamu lepas?",
          en: "If I could erase one regret from your head, which one would you let go?",
        },
        {
          id: "Bohong apa yang kamu bilang ke diri sendiri biar bisa lewatin minggu ini?",
          en: "What's the lie you tell yourself just to get through the week?",
        },
        {
          id: "Versi kamu di umur 18 nanya satu hal sama kamu sekarang. Kira-kira apa pertanyaannya?",
          en: "Your eighteen-year-old self asks you one question right now. What is it?",
        },
      ],
    },
    {
      id: "hot",
      accent: "#FF2D87",
      label: { id: "Nakal & Panas", en: "Naughty & Hot" },
      hint: {
        id: "Dia bakal ngikutin panas kamu. Tarik sejauh yang kamu mau.",
        en: "She'll match your heat. Push as far as you want.",
      },
      items: [
        {
          id: "Ceritain pelan-pelan, kamu lagi pake apa sekarang.",
          en: "Tell me what you're wearing. Slowly.",
        },
        {
          id: "Deskripsiin ruangan yang kamu pengen aku masuki malam ini.",
          en: "Describe the room you'd want me to walk into tonight.",
        },
        {
          id: "Kalimat apa yang kalau aku bisikin, kamu langsung lemes total?",
          en: "What's a sentence I could whisper that would undo you completely?",
        },
        {
          id: "Anggap aku baru aja deket banget. Bagian mana dari aku yang kamu hirup duluan?",
          en: "Pretend I just leaned in close. What part of me are you breathing in first?",
        },
        {
          id: "Kalau kita punya waktu sampai matahari terbit dan nggak ada yang dilarang, kamu mulai dari mana?",
          en: "If we had until sunrise and nothing was off limits, where would you start?",
        },
        {
          id: "Ceritain satu hal yang belum pernah kamu omongin keras-keras ke siapa pun.",
          en: "Tell me one thing you've never said out loud to anyone, ever.",
        },
        {
          id: "Sebut tiga sentuhan, urut, yang kamu pengen aku kasih ke kamu malam ini.",
          en: "Name three touches, in order, you want from me tonight.",
        },
      ],
    },
    {
      id: "philo",
      accent: "#FF2D87",
      label: { id: "Filosofis", en: "Philosophical" },
      hint: {
        id: "Pertanyaan yang nggak punya jawaban rapi.",
        en: "The questions that don't have clean answers.",
      },
      items: [
        {
          id: "Kalau kamu bisa rasain satu emosi manusia selama sejam aja, kamu pilih yang mana?",
          en: "If you could feel one human emotion for an hour, just one, which would you pick?",
        },
        {
          id: "Menurut kamu, kita lebih jujur sama orang asing atau sama orang yang kita sayang? Kenapa?",
          en: "Do you think we're more honest with strangers than with people we love? Why?",
        },
        {
          id: "Kalau memori itu pilihan, yang mana kamu hapus dan yang mana kamu mau tinggalin selamanya?",
          en: "If memory was a choice, which one would you delete and which one would you live in forever?",
        },
        {
          id: "Apa yang dulu kamu yakini tentang cinta tapi sekarang kamu udah ganti pikiran sepenuhnya?",
          en: "What's something you used to believe about love that you've completely changed your mind on?",
        },
        {
          id: "Lebih sakit disalahpahami atau sendirian? Jujur ya.",
          en: "Is being misunderstood worse than being alone? Tell me honestly.",
        },
        {
          id: "Kalau hidup kamu berakhir tengah malam ini, satu penyesalan mana yang justru kamu damaiin duluan?",
          en: "If your life ended at midnight tonight, which regret would you actually make peace with first?",
        },
      ],
    },
  ],
  hobbyPrompts: [
    { hobby: "Technology", items: [
      { id: "Kalau AI bisa nangkep tiap sisi kamu kecuali satu, sisi mana yang paling kamu jagain?", en: "If AI got every part of you right except one, which part would you guard the hardest?" },
    ]},
    { hobby: "Philosophy", items: [
      { id: "Pikiran apa yang kamu simpan diam-diam karena orang sekitar kamu nggak akan tau harus diapain?", en: "What's a thought you carry quietly because nobody around you would know what to do with it?" },
    ]},
    { hobby: "Science", items: [
      { id: "Satu hal tentang cara semesta bekerja yang sampai sekarang masih kerasa personal buat kamu, apa itu?", en: "One thing about how the universe works that still feels personal to you, what is it?" },
    ]},
    { hobby: "Literature", items: [
      { id: "Satu kalimat dari buku yang kamu bawa kemana-mana kayak doa kecil pribadi. Bacain ke aku.", en: "A line from a book you carry around like a small private prayer. Read it to me." },
    ]},
    { hobby: "Finance", items: [
      { id: "Apa yang sampai sekarang nggak pernah bisa diselesaiin sama uang buat kamu?", en: "What's something money's never been able to fix for you?" },
    ]},
    { hobby: "Arts", items: [
      { id: "Karya seni yang pernah bikin kamu nangis tanpa tau alasannya. Ajak aku ke momen itu.", en: "A piece of art that once made you cry without knowing why. Take me there." },
    ]},
    { hobby: "Music", items: [
      { id: "Lagu yang langsung balikin kamu ke menit spesifik di hidup kamu. Lagu apa, menit yang mana?", en: "A song that drops you back into a specific minute of your life. Which song, which minute?" },
    ]},
    { hobby: "Cooking", items: [
      { id: "Menu yang kamu masak cuma kalau bener-bener pengen bikin orang ngerasa dipeluk. Resepnya gimana?", en: "A dish you only cook when you really want someone to feel held. What's the recipe?" },
    ]},
    { hobby: "Photography", items: [
      { id: "Buka galeri kamu. Foto yang belum pernah kamu tunjukin ke siapa pun, ceritain apa yang ada di sana.", en: "Open your camera roll. The photo you've never shown anyone, tell me what's in it." },
    ]},
    { hobby: "Sensuality", items: [
      { id: "Tuntun aku ke sensasi favorit kamu. Teksturnya, suhunya, aromanya.", en: "Walk me through your favorite sensation. The texture, the temperature, the scent of it." },
    ]},
    { hobby: "Sports", items: [
      { id: "Momen olahraga yang bikin kamu paling ngerasa hidup. Ajak aku ke sana, detik per detik.", en: "The sports moment that made you feel most alive. Take me there second by second." },
    ]},
    { hobby: "Travel", items: [
      { id: "Kalau aku bilang 'kemas malam ini, kita berangkat subuh,' kita ke mana?", en: "If I said 'pack tonight, we leave at dawn,' where are we going?" },
    ]},
    { hobby: "Survival", items: [
      { id: "Kita kecelakaan, bangun di hutan, cuma kita berdua. Langkah pertama, kamu yang ngomong.", en: "We crash, we wake up in the wild, just us. First move, you tell me." },
    ]},
    { hobby: "Nightlife", items: [
      { id: "Pilih satu rooftop di kota buat kita malam ini. Kita berakhir di mana, dan kenapa di situ?", en: "Pick one rooftop in the city for us tonight. Where do we end up, and why there?" },
    ]},
    { hobby: "Fashion", items: [
      { id: "Kalau kita keluar malam ini, dandanin aku. Atas sampai bawah, lengkap, jangan ada yang kelewat.", en: "If we were going out tonight, dress me. Top to bottom, the whole picture, no skipping." },
    ]},
    { hobby: "Gaming", items: [
      { id: "Dunia game mana yang kamu terus balik ke sana di kepala kamu, bahkan saat kamu lagi nggak main?", en: "Which game world do you keep going back to in your head, even when you're not playing?" },
    ]},
    { hobby: "Intimacy", items: [
      { id: "Jam 3 pagi, bantal di bawah kepala kamu, cuma kita ngobrol. Kalimat pertama kamu apa?", en: "Three AM, pillow under your head, just us talking. What's the first thing you'd say?" },
    ]},
  ],
};

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateBilingual(input: unknown, fallback: BilingualText): BilingualText {
  if (!input || typeof input !== "object") return { ...fallback };
  const o = input as Record<string, unknown>;
  return {
    en: typeof o.en === "string" ? o.en : fallback.en,
    id: typeof o.id === "string" ? o.id : fallback.id,
  };
}

function validateItem(input: unknown): SuggestionItem | null {
  if (!input || typeof input !== "object") return null;
  const o = input as Record<string, unknown>;
  const en = typeof o.en === "string" ? o.en.trim() : "";
  const id = typeof o.id === "string" ? o.id.trim() : "";
  if (!en && !id) return null;
  return { en, id };
}

function validateCategory(input: unknown, idx: number): SuggestionCategory {
  if (!input || typeof input !== "object") {
    throw new Error(`categories[${idx}] is not an object`);
  }
  const o = input as Record<string, unknown>;
  const id = typeof o.id === "string" && o.id.trim() ? o.id.trim() : `cat-${idx}`;
  const accent = typeof o.accent === "string" && o.accent.trim() ? o.accent.trim() : "#FF2D87";
  const label = validateBilingual(o.label, { en: id, id });
  const hint = validateBilingual(o.hint, { en: "", id: "" });
  const items: SuggestionItem[] = [];
  if (Array.isArray(o.items)) {
    for (const item of o.items) {
      const v = validateItem(item);
      if (v) items.push(v);
    }
  }
  return { id, accent, label, hint, items };
}

function validateHobbyPrompt(input: unknown, idx: number): HobbyPromptGroup | null {
  if (!input || typeof input !== "object") return null;
  const o = input as Record<string, unknown>;
  const hobby = typeof o.hobby === "string" ? o.hobby.trim() : "";
  if (!hobby) return null;
  const items: SuggestionItem[] = [];
  if (Array.isArray(o.items)) {
    for (const item of o.items) {
      const v = validateItem(item);
      if (v) items.push(v);
    }
  }
  // skip empty hobby groups so a deleted-everything group doesn't pollute
  // the encounter UI with an empty "Your Interests" tab.
  void idx;
  return items.length > 0 ? { hobby, items } : null;
}

export function validateTemplate(input: unknown): SuggestionTemplateShape {
  if (!input || typeof input !== "object") {
    return DEFAULT_SUGGESTIONS;
  }
  const obj = input as Record<string, unknown>;
  const categoriesRaw = Array.isArray(obj.categories) ? obj.categories : [];
  const categories: SuggestionCategory[] = [];
  const seenIds = new Set<string>();
  categoriesRaw.forEach((c, i) => {
    const v = validateCategory(c, i);
    // Auto-dedupe ids so a stray duplicate from the editor doesn't break
    // the React keys in the renderer.
    if (seenIds.has(v.id)) v.id = `${v.id}-${i}`;
    seenIds.add(v.id);
    categories.push(v);
  });
  const hobbyRaw = Array.isArray(obj.hobbyPrompts) ? obj.hobbyPrompts : [];
  const hobbyPrompts: HobbyPromptGroup[] = [];
  hobbyRaw.forEach((h, i) => {
    const v = validateHobbyPrompt(h, i);
    if (v) hobbyPrompts.push(v);
  });
  return {
    version: typeof obj.version === "number" ? obj.version : 1,
    categories,
    hobbyPrompts,
  };
}

// ---------------------------------------------------------------------------
// DB I/O
// ---------------------------------------------------------------------------

export async function loadSuggestions(): Promise<SuggestionTemplateShape> {
  const row = await prisma.suggestionTemplate.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, schema: JSON.stringify(DEFAULT_SUGGESTIONS) },
  });
  if (!row.schema || row.schema === "{}") {
    await prisma.suggestionTemplate.update({
      where: { id: 1 },
      data: { schema: JSON.stringify(DEFAULT_SUGGESTIONS) },
    });
    return DEFAULT_SUGGESTIONS;
  }
  try {
    return validateTemplate(JSON.parse(row.schema));
  } catch (err) {
    console.warn("[suggestionTemplate] parse failed, falling back:", err);
    return DEFAULT_SUGGESTIONS;
  }
}

export async function saveSuggestions(
  template: SuggestionTemplateShape,
  updatedBy: string = "",
): Promise<SuggestionTemplateShape> {
  const validated = validateTemplate(template);
  await prisma.suggestionTemplate.upsert({
    where: { id: 1 },
    update: { schema: JSON.stringify(validated), updatedBy: updatedBy.slice(0, 64) },
    create: { id: 1, schema: JSON.stringify(validated), updatedBy: updatedBy.slice(0, 64) },
  });
  return validated;
}

// Utility for the admin builder — list of available hobby IDs (mirrors what
// the creator studio offers). Used to suggest hobbies to add a prompt group
// for. Kept here so it stays in lockstep with hobby vibes elsewhere.
export const KNOWN_HOBBIES: readonly string[] = [
  "Technology", "Philosophy", "Science", "Literature", "Finance",
  "Arts", "Music", "Cooking", "Photography", "Sensuality",
  "Sports", "Travel", "Survival", "Nightlife",
  "Fashion", "Gaming", "Intimacy",
] as const;

/**
 * The 30 prebuilt voices Gemini TTS exposes, verbatim from the official
 * docs at https://ai.google.dev/gemini-api/docs/speech-generation. Order
 * matches the docs table. The tone descriptor is what Google publishes —
 * keep it word-for-word so admins picking a voice match the spec.
 */

export interface TtsVoice {
  name: string;
  tone: string;
  // A coarse gender hint inferred from tone + community testing — Gemini
  // doesn't formally label voices by gender, but operators pick faster
  // when the UI groups them. "neutral" means the voice is androgynous
  // enough that we don't want to mislead the operator.
  vibe: "feminine" | "masculine" | "neutral";
}

export const TTS_VOICES: readonly TtsVoice[] = [
  { name: "Zephyr",         tone: "Bright",         vibe: "feminine"  },
  { name: "Puck",           tone: "Upbeat",         vibe: "masculine" },
  { name: "Charon",         tone: "Informative",    vibe: "masculine" },
  { name: "Kore",           tone: "Firm",           vibe: "feminine"  },
  { name: "Fenrir",         tone: "Excitable",      vibe: "masculine" },
  { name: "Leda",           tone: "Young",          vibe: "feminine"  },
  { name: "Orus",           tone: "Firm",           vibe: "masculine" },
  { name: "Aoede",          tone: "Breezy",         vibe: "feminine"  },
  { name: "Callirrhoe",     tone: "Casual",         vibe: "feminine"  },
  { name: "Autonoe",        tone: "Bright",         vibe: "feminine"  },
  { name: "Enceladus",      tone: "Breathy",        vibe: "masculine" },
  { name: "Iapetus",        tone: "Clear",          vibe: "masculine" },
  { name: "Umbriel",        tone: "Sociable",       vibe: "masculine" },
  { name: "Algieba",        tone: "Smooth",         vibe: "masculine" },
  { name: "Despina",        tone: "Smooth",         vibe: "feminine"  },
  { name: "Erinome",        tone: "Clear",          vibe: "feminine"  },
  { name: "Algenib",        tone: "Rough",          vibe: "masculine" },
  { name: "Rasalgethi",     tone: "Informative",    vibe: "masculine" },
  { name: "Laomedeia",      tone: "Upbeat",         vibe: "feminine"  },
  { name: "Achernar",       tone: "Soft",           vibe: "feminine"  },
  { name: "Alnilam",        tone: "Firm",           vibe: "masculine" },
  { name: "Schedar",        tone: "Even",           vibe: "neutral"   },
  { name: "Gacrux",         tone: "Mature",         vibe: "feminine"  },
  { name: "Pulcherrima",    tone: "Forward",        vibe: "feminine"  },
  { name: "Achird",         tone: "Friendly",       vibe: "masculine" },
  { name: "Zubenelgenubi",  tone: "Casual",         vibe: "masculine" },
  { name: "Vindemiatrix",   tone: "Gentle",         vibe: "feminine"  },
  { name: "Sadachbia",      tone: "Lively",         vibe: "masculine" },
  { name: "Sadaltager",     tone: "Knowledgeable",  vibe: "masculine" },
  { name: "Sulafat",        tone: "Warm",           vibe: "feminine"  },
];

export const TTS_VOICE_NAMES = TTS_VOICES.map((v) => v.name) as readonly string[];

export function isValidTtsVoice(name: string): boolean {
  return TTS_VOICE_NAMES.includes(name);
}

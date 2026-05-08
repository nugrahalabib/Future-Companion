/**
 * Audio-tag presets the operator can insert into the TTS transcript at
 * cursor position. Verbatim list from
 * https://ai.google.dev/gemini-api/docs/speech-generation. Tags are
 * wrapped in square brackets in the prompt and the model interprets
 * them as inline delivery modifiers.
 *
 * Style prefix presets ("Say cheerfully:", "Say in a spooky voice:")
 * are different — those go at the START of the prompt to set the tone
 * for the whole utterance. The model treats them as instructions, not
 * speech.
 */

export interface AudioTag {
  tag: string;        // exact text inserted at cursor (incl. brackets)
  // human-readable label for the chip in the toolbar — kept short so
  // a horizontal toolbar doesn't wrap awkwardly
  label: string;
  category: "delivery" | "emotion" | "pace" | "sound" | "character";
}

export const AUDIO_TAGS: readonly AudioTag[] = [
  // ----- delivery (volume / register) -----
  { tag: "[whispers]",      label: "whisper",       category: "delivery" },
  { tag: "[shouting]",      label: "shout",         category: "delivery" },
  { tag: "[breathlessly]",  label: "breathless",    category: "delivery" },

  // ----- emotion -----
  { tag: "[excitedly]",     label: "excited",       category: "emotion" },
  { tag: "[bored]",         label: "bored",         category: "emotion" },
  { tag: "[reluctantly]",   label: "reluctant",     category: "emotion" },
  { tag: "[mischievously]", label: "mischievous",   category: "emotion" },
  { tag: "[panicked]",      label: "panicked",      category: "emotion" },
  { tag: "[serious]",       label: "serious",       category: "emotion" },
  { tag: "[tired]",         label: "tired",         category: "emotion" },
  { tag: "[trembling]",     label: "trembling",     category: "emotion" },
  { tag: "[amazed]",        label: "amazed",        category: "emotion" },
  { tag: "[curious]",       label: "curious",       category: "emotion" },
  { tag: "[sarcastically]", label: "sarcastic",     category: "emotion" },

  // ----- pace -----
  { tag: "[very fast]",     label: "very fast",     category: "pace" },
  { tag: "[very slow]",     label: "very slow",     category: "pace" },
  { tag: "[sarcastically, one painfully slow word at a time]",
                            label: "snail-pace sarcasm", category: "pace" },

  // ----- non-verbal sounds -----
  { tag: "[laughs]",        label: "laughs",        category: "sound" },
  { tag: "[giggles]",       label: "giggles",       category: "sound" },
  { tag: "[sighs]",         label: "sighs",         category: "sound" },
  { tag: "[gasp]",          label: "gasp",          category: "sound" },
  { tag: "[cough]",         label: "cough",         category: "sound" },
  { tag: "[crying]",        label: "crying",        category: "sound" },

  // ----- character voices (creative) -----
  { tag: "[like a cartoon dog]", label: "cartoon dog", category: "character" },
  { tag: "[like dracula]",       label: "dracula",     category: "character" },
];

export interface StylePreset {
  prefix: string;     // gets prepended at the start of the prompt
  label: string;
}

export const STYLE_PRESETS: readonly StylePreset[] = [
  { prefix: "Say cheerfully: ",                 label: "Cheerful" },
  { prefix: "Say in a soft, romantic voice: ",  label: "Romantic" },
  { prefix: "Say in a spooky voice: ",          label: "Spooky" },
  { prefix: "Say with a heavy, sad tone: ",     label: "Sad" },
  { prefix: "Say in a confident, firm tone: ",  label: "Confident" },
  { prefix: "Say in a calm, soothing tone: ",   label: "Calm" },
  { prefix: "Read this like a podcast intro: ", label: "Podcast Intro" },
  { prefix: "Read this like a children's storybook: ", label: "Storybook" },
  { prefix: "Say in an exhausted, breathless whisper: ", label: "Tired Whisper" },
  { prefix: "Say in a quick, excited tone: ",   label: "Excited" },
];

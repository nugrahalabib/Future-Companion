/**
 * BCP-47 language codes Gemini TTS officially supports. Verbatim from
 * https://ai.google.dev/gemini-api/docs/speech-generation. The model
 * detects the input language automatically; this list is exposed to the
 * admin so they can hint the locale on speech-config and verify their
 * target language is on the supported list.
 */

export interface TtsLanguage {
  code: string;            // BCP-47, the value sent to the API
  englishName: string;     // for the operator UI
  nativeName?: string;     // optional native script name for the dropdown
  // True for languages we want to surface at the top of the dropdown
  // because the booth is Indonesian-first.
  prominent?: boolean;
}

// The 24 languages the docs explicitly call out in the supported-language
// section come first, with the 36 BCP-47 codes that follow.
export const TTS_LANGUAGES: readonly TtsLanguage[] = [
  // Indonesian-first booth — keep id at the very top
  { code: "id-ID",     englishName: "Indonesian",        nativeName: "Bahasa Indonesia", prominent: true },
  { code: "en-US",     englishName: "English (US)",      prominent: true },
  { code: "en-IN",     englishName: "English (India)",   prominent: true },
  { code: "ja-JP",     englishName: "Japanese",          nativeName: "日本語",           prominent: true },
  { code: "ko-KR",     englishName: "Korean",            nativeName: "한국어",           prominent: true },
  { code: "cmn-CN",    englishName: "Mandarin Chinese",  nativeName: "中文",             prominent: true },
  { code: "ar-EG",     englishName: "Arabic (Egyptian)", prominent: true },
  { code: "ms-MY",     englishName: "Malay",             nativeName: "Bahasa Melayu",   prominent: true },
  { code: "es-US",     englishName: "Spanish (US)",      prominent: true },
  { code: "fr-FR",     englishName: "French",            nativeName: "Français",        prominent: true },
  { code: "de-DE",     englishName: "German",            nativeName: "Deutsch",         prominent: true },
  { code: "it-IT",     englishName: "Italian",           nativeName: "Italiano",        prominent: true },
  { code: "pt-BR",     englishName: "Portuguese (Brazil)" },
  { code: "ru-RU",     englishName: "Russian",           nativeName: "Русский" },
  { code: "hi-IN",     englishName: "Hindi",             nativeName: "हिन्दी" },
  { code: "tr-TR",     englishName: "Turkish",           nativeName: "Türkçe" },
  { code: "pl-PL",     englishName: "Polish",            nativeName: "Polski" },
  { code: "nl-NL",     englishName: "Dutch",             nativeName: "Nederlands" },
  { code: "vi-VN",     englishName: "Vietnamese",        nativeName: "Tiếng Việt" },
  { code: "th-TH",     englishName: "Thai",              nativeName: "ภาษาไทย" },
  { code: "fil-PH",    englishName: "Filipino" },
  { code: "sw-KE",     englishName: "Swahili" },
  { code: "uk-UA",     englishName: "Ukrainian",         nativeName: "Українська" },
  { code: "el-GR",     englishName: "Greek",             nativeName: "Ελληνικά" },
  { code: "he-IL",     englishName: "Hebrew",            nativeName: "עברית" },
  { code: "fa-IR",     englishName: "Persian",           nativeName: "فارسی" },

  // Remaining BCP-47 codes from the docs list
  { code: "bn-BD",     englishName: "Bangla",            nativeName: "বাংলা" },
  { code: "fi-FI",     englishName: "Finnish",           nativeName: "Suomi" },
  { code: "gl-ES",     englishName: "Galician" },
  { code: "ka-GE",     englishName: "Georgian" },
  { code: "gu-IN",     englishName: "Gujarati",          nativeName: "ગુજરાતી" },
  { code: "ht-HT",     englishName: "Haitian Creole" },
  { code: "hu-HU",     englishName: "Hungarian",         nativeName: "Magyar" },
  { code: "is-IS",     englishName: "Icelandic" },
  { code: "jv-ID",     englishName: "Javanese",          nativeName: "Basa Jawa" },
  { code: "mr-IN",     englishName: "Marathi",           nativeName: "मराठी" },
  { code: "kn-IN",     englishName: "Kannada",           nativeName: "ಕನ್ನಡ" },
  { code: "kok-IN",    englishName: "Konkani" },
  { code: "ro-RO",     englishName: "Romanian" },
  { code: "ta-IN",     englishName: "Tamil",             nativeName: "தமிழ்" },
  { code: "te-IN",     englishName: "Telugu",            nativeName: "తెలుగు" },
  { code: "af-ZA",     englishName: "Afrikaans" },
  { code: "sq-AL",     englishName: "Albanian" },
  { code: "am-ET",     englishName: "Amharic" },
  { code: "hy-AM",     englishName: "Armenian" },
  { code: "az-AZ",     englishName: "Azerbaijani" },
  { code: "eu-ES",     englishName: "Basque" },
  { code: "be-BY",     englishName: "Belarusian" },
  { code: "bg-BG",     englishName: "Bulgarian" },
  { code: "my-MM",     englishName: "Burmese" },
  { code: "ca-ES",     englishName: "Catalan" },
  { code: "ceb-PH",    englishName: "Cebuano" },
  { code: "hr-HR",     englishName: "Croatian" },
  { code: "cs-CZ",     englishName: "Czech" },
  { code: "da-DK",     englishName: "Danish" },
  { code: "et-EE",     englishName: "Estonian" },
  { code: "lv-LV",     englishName: "Latvian" },
  { code: "lt-LT",     englishName: "Lithuanian" },
  { code: "lb-LU",     englishName: "Luxembourgish" },
  { code: "mk-MK",     englishName: "Macedonian" },
  { code: "mg-MG",     englishName: "Malagasy" },
  { code: "ml-IN",     englishName: "Malayalam" },
  { code: "mn-MN",     englishName: "Mongolian" },
  { code: "ne-NP",     englishName: "Nepali" },
  { code: "nb-NO",     englishName: "Norwegian Bokmål" },
  { code: "nn-NO",     englishName: "Norwegian Nynorsk" },
  { code: "or-IN",     englishName: "Odia" },
  { code: "ps-AF",     englishName: "Pashto" },
  { code: "pa-IN",     englishName: "Punjabi" },
  { code: "sr-RS",     englishName: "Serbian" },
  { code: "sd-PK",     englishName: "Sindhi" },
  { code: "si-LK",     englishName: "Sinhala" },
  { code: "sk-SK",     englishName: "Slovak" },
  { code: "sl-SI",     englishName: "Slovenian" },
  { code: "sv-SE",     englishName: "Swedish" },
  { code: "ur-PK",     englishName: "Urdu",              nativeName: "اُردُو" },
  { code: "la",        englishName: "Latin" },
  { code: "lo-LA",     englishName: "Lao" },
];

export const TTS_LANGUAGE_CODES = TTS_LANGUAGES.map((l) => l.code) as readonly string[];

export function isValidTtsLanguage(code: string): boolean {
  return TTS_LANGUAGE_CODES.includes(code);
}

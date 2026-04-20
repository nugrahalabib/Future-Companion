import type { Locale } from "@/stores/useLocaleStore";

export type UserGender = "female" | "male" | "nonbinary";

export type PresetGroupId = "romantic" | "playful" | "intimate" | "address";

export interface PresetGroup {
  id: PresetGroupId;
  chips: string[];
}

export const GROUP_LABEL_KEY: Record<PresetGroupId, string> = {
  romantic: "register.bond.group.romantic",
  playful: "register.bond.group.playful",
  intimate: "register.bond.group.intimate",
  address: "register.bond.group.address",
};

export const NICKNAME_GROUPS: Record<Locale, Record<UserGender, PresetGroup[]>> = {
  id: {
    female: [
      {
        id: "romantic",
        chips: [
          "sayang", "sayangku", "cintaku", "cinta", "ayang",
          "beb", "beyb", "honey", "darling", "my love", "belahan jiwa",
        ],
      },
      {
        id: "playful",
        chips: [
          "bebi", "baby", "dedek", "ade", "neng", "boneka",
          "kucing", "cinnamon", "princess", "putri", "tuan putri",
        ],
      },
      {
        id: "intimate",
        chips: [
          "nyonya", "madam", "baby girl", "doll", "kitten",
          "my girl", "bidadari", "permata", "jantung hati",
        ],
      },
      {
        id: "address",
        chips: ["dek", "adek", "non", "nona", "mbak", "kakak", "eneng"],
      },
    ],
    male: [
      {
        id: "romantic",
        chips: [
          "sayang", "sayangku", "cintaku", "cinta", "ayang",
          "beb", "beyb", "honey", "darling", "my love",
        ],
      },
      {
        id: "playful",
        chips: [
          "masku", "bang", "abang", "mas sayang", "ganteng",
          "mas ganteng", "jagoan", "pangeranku", "ksatriaku", "ayah",
        ],
      },
      {
        id: "intimate",
        chips: [
          "tuan", "raja", "king", "my king", "suamiku",
          "master", "daddy", "sir", "captain", "bossku",
        ],
      },
      {
        id: "address",
        chips: ["mas", "kakak", "kak", "bang", "abang", "bro", "mas bro"],
      },
    ],
    nonbinary: [
      {
        id: "romantic",
        chips: [
          "sayang", "sayangku", "cintaku", "cinta", "honey",
          "darling", "my love", "belahan jiwa", "partnerku",
        ],
      },
      {
        id: "playful",
        chips: ["beb", "beyb", "bebi", "baby", "cintaaa", "dedek"],
      },
      {
        id: "intimate",
        chips: ["permata", "jantung hati", "rembulan", "kilauku"],
      },
      {
        id: "address",
        chips: ["dek", "kak", "kakak", "kamu"],
      },
    ],
  },
  en: {
    female: [
      {
        id: "romantic",
        chips: [
          "love", "my love", "darling", "dear", "sweetheart",
          "beloved", "my heart", "treasure",
        ],
      },
      {
        id: "playful",
        chips: [
          "babe", "baby", "cutie", "honey bunny", "sunshine",
          "angel", "dollface", "sugar", "bunny",
        ],
      },
      {
        id: "intimate",
        chips: [
          "gorgeous", "beautiful", "goddess", "queen", "my queen",
          "kitten", "doll", "princess", "baby girl",
        ],
      },
      {
        id: "address",
        chips: ["ma'am", "lady", "miss"],
      },
    ],
    male: [
      {
        id: "romantic",
        chips: [
          "love", "my love", "darling", "dear", "sweetheart", "beloved",
        ],
      },
      {
        id: "playful",
        chips: [
          "babe", "handsome", "champ", "tiger", "cutie",
          "stud", "sugar", "ace", "sailor",
        ],
      },
      {
        id: "intimate",
        chips: [
          "sir", "king", "my king", "daddy", "captain",
          "master", "prince", "boss",
        ],
      },
      {
        id: "address",
        chips: ["mister", "sir", "buddy"],
      },
    ],
    nonbinary: [
      {
        id: "romantic",
        chips: [
          "love", "my love", "darling", "dear", "sweetheart",
          "beloved", "my heart",
        ],
      },
      {
        id: "playful",
        chips: ["babe", "honey", "cutie", "sunshine", "angel", "sugar"],
      },
      {
        id: "intimate",
        chips: ["treasure", "my soul", "starlight", "moonlight"],
      },
      {
        id: "address",
        chips: ["friend", "partner", "you"],
      },
    ],
  },
};

export const COMPANION_NAME_SAMPLES: Record<Locale, string[]> = {
  id: [
    "Ayu", "Laras", "Kirana", "Maya", "Nadia", "Dewi",
    "Raka", "Arjuna", "Bayu", "Satria", "Luna", "Aria",
  ],
  en: [
    "Ava", "Luna", "Nova", "Aria", "Zara", "Iris",
    "Kai", "Ezra", "Axel", "Orion", "Jinx", "Sage",
  ],
};

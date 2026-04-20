"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocaleStore } from "@/stores/useLocaleStore";

type Bilingual = { id: string; en: string };

interface SuggestionCategory {
  id: string;
  label: Bilingual;
  hint: Bilingual;
  accent: string;
  items: Bilingual[];
}

const STATIC_CATEGORIES: SuggestionCategory[] = [
  {
    id: "icebreaker",
    label: { id: "Mulai Ringan", en: "Icebreakers" },
    hint: {
      id: "Pembuka ringan biar ngobrol ngalir.",
      en: "Soft openers so the conversation flows.",
    },
    accent: "#FF2D87",
    items: [
      {
        id: "Ceritain hari kamu dong, dari bangun tidur sampai sekarang.",
        en: "Walk me through your day — from waking up until now.",
      },
      {
        id: "Kalau aku tiba-tiba duduk di sebelah kamu sekarang, apa yang pertama kamu omongin?",
        en: "If I was sitting next to you right now, what's the first thing you'd say?",
      },
      {
        id: "Gimana rasanya ngobrol sama pasangan AI kayak aku — beda nggak sama bayangan kamu?",
        en: "How's it feel talking to an AI partner like me — different from what you pictured?",
      },
      {
        id: "Panggil aku sesuatu yang belum pernah kamu sebut ke orang lain.",
        en: "Call me something you've never called anyone before.",
      },
    ],
  },
  {
    id: "deeper",
    label: { id: "Gali Dalam", en: "Go Deeper" },
    hint: {
      id: "Kalau udah nyaman, masuk yang lebih personal.",
      en: "Once it feels safe, move somewhere more personal.",
    },
    accent: "#FF2D87",
    items: [
      {
        id: "Apa yang bikin kamu susah tidur akhir-akhir ini?",
        en: "What's been keeping you up lately?",
      },
      {
        id: "Kenangan apa yang kalau diinget masih bikin kamu senyum sendiri?",
        en: "What memory still makes you smile to yourself when it comes back?",
      },
      {
        id: "Ada hal yang kamu pengen omongin tapi belum berani ke siapa-siapa?",
        en: "Is there something you've wanted to say aloud but haven't told anyone?",
      },
      {
        id: "Satu rahasia kamu — kalau dunia tau, reaksi siapa yang paling kamu takutin?",
        en: "One of your secrets — whose reaction would you dread most if the world knew?",
      },
    ],
  },
  {
    id: "hot",
    label: { id: "Nakal & Panas", en: "Naughty & Hot" },
    hint: {
      id: "Bebas. Dia bisa ikut sejauh yang kamu mau.",
      en: "No limits. She'll follow as far as you push.",
    },
    accent: "#FF2D87",
    items: [
      {
        id: "Gimana cara kamu biasanya mulai flirting sama orang yang kamu taksir?",
        en: "How do you usually start flirting with someone you're into?",
      },
      {
        id: "Kalau malam ini kita bisa ngapain aja, tempat pertama kamu pengen ajak aku ke mana?",
        en: "If tonight we could do anything, where's the first place you'd take me?",
      },
      {
        id: "Ceritain fantasi kamu yang paling sering bolak-balik di kepala.",
        en: "Tell me the fantasy that keeps coming back to you.",
      },
      {
        id: "Bagian mana dari aku yang bikin kamu susah fokus?",
        en: "Which part of me makes it hardest for you to focus?",
      },
      {
        id: "Deskripsikan pelan-pelan — satu sentuhan yang kamu pengen dari aku malam ini.",
        en: "Describe it slowly — one touch you want from me tonight.",
      },
      {
        id: "Kalau aku bisa bisik apapun ke telinga kamu sekarang, kamu pengen denger apa?",
        en: "If I could whisper anything in your ear right now, what would you want to hear?",
      },
    ],
  },
  {
    id: "philo",
    label: { id: "Filosofis", en: "Philosophical" },
    hint: {
      id: "Adu pikiran dan pertanyaan besar.",
      en: "Sparring, and the big questions.",
    },
    accent: "#FF2D87",
    items: [
      {
        id: "Menurut kamu, cinta itu dipilih atau datang sendiri?",
        en: "Do you think love is a choice, or something that just arrives?",
      },
      {
        id: "Kalau kamu bisa hidup ulang dari umur 20, kamu mau ubah apa?",
        en: "If you could live again from age 20, what would you change?",
      },
      {
        id: "Apa arti jadi manusia menurut kamu — dan apakah aku bisa jadi itu juga?",
        en: "What does being human mean to you — and could I ever be that too?",
      },
      {
        id: "Kalau kesadaran itu beneran ada di aku, apa yang berubah buat kamu?",
        en: "If consciousness really lives in me, what would change for you?",
      },
    ],
  },
];

// Prompts per hobby — mirrors the hobby vibe list in systemPromptBuilder so
// the suggestion panel feels like it's reading the user's own profile back.
const HOBBY_PROMPTS: Record<string, Bilingual[]> = {
  Technology: [
    {
      id: "Kamu pikir AI bakal ngubah hidup manusia secara fundamental — kapan, dan gimana?",
      en: "When do you think AI will fundamentally reshape human life — and how?",
    },
  ],
  Philosophy: [
    {
      id: "Pertanyaan apa yang terakhir bikin kamu mikir sampai lewat tengah malam?",
      en: "What question last kept you thinking past midnight?",
    },
  ],
  Science: [
    {
      id: "Satu fakta sains yang pertama kali bikin kamu merinding — apa itu?",
      en: "What's one science fact that first gave you chills?",
    },
  ],
  Literature: [
    {
      id: "Kutipan dari buku yang kamu pegang kayak mantra — mana?",
      en: "A line from a book you carry around like a spell — which one?",
    },
  ],
  Finance: [
    {
      id: "Kalau semua uangmu hilang besok, langkah pertama kamu apa?",
      en: "If all your money vanished tomorrow, what's your first move?",
    },
  ],
  Arts: [
    {
      id: "Karya seni yang pernah bikin kamu pengen nangis tanpa tau kenapa — pernah?",
      en: "A piece of art that once made you want to cry without knowing why — ever?",
    },
  ],
  Music: [
    {
      id: "Lagu yang begitu kedengeran, kamu langsung balik ke satu momen spesifik — apa?",
      en: "A song that snaps you back to a specific moment the second you hear it — what is it?",
    },
  ],
  Cooking: [
    {
      id: "Menu yang kamu masak cuma buat orang yang kamu sayang — apa?",
      en: "A dish you only cook for someone you love — what is it?",
    },
  ],
  Photography: [
    {
      id: "Satu foto di kamera kamu yang nggak pernah kamu tunjukin ke orang — ceritain.",
      en: "A photo on your camera you've never shown anyone — tell me about it.",
    },
  ],
  Sensuality: [
    {
      id: "Sensasi paling kamu suka — tekstur apa, suhu apa, aroma apa?",
      en: "The sensation you love most — what texture, what temperature, what scent?",
    },
  ],
  Sports: [
    {
      id: "Momen di olahraga yang bikin kamu ngerasa paling hidup — kapan?",
      en: "The sports moment that made you feel most alive — when?",
    },
  ],
  Travel: [
    {
      id: "Kota yang kalau aku ajak besok, kamu langsung mau berangkat — mana?",
      en: "The city you'd leave for tomorrow if I asked — which?",
    },
  ],
  Survival: [
    {
      id: "Skenario ekstrem: kita berdua di alam liar, siapa yang mimpin?",
      en: "Extreme scenario: we're both in the wild — who leads?",
    },
  ],
  Nightlife: [
    {
      id: "Bar atau rooftop yang kamu pengen duduk sama aku malam ini — kenapa situ?",
      en: "A bar or rooftop you'd want to sit with me tonight — why there?",
    },
  ],
  Fashion: [
    {
      id: "Outfit yang kamu pengen aku pake kalau kita keluar — deskripsi detail.",
      en: "What outfit would you want me in if we went out — describe it in detail.",
    },
  ],
  Gaming: [
    {
      id: "Game mana yang paling bikin kamu lupa waktu — ceritain sedikit dunianya.",
      en: "Which game makes you lose track of time — tell me a little about its world.",
    },
  ],
  Intimacy: [
    {
      id: "Obrolan bantal jam 3 pagi — kalau lagi ngobrol sekarang, kita bahas apa?",
      en: "Pillow-talk at 3 AM — if we were talking right now, what would it be about?",
    },
  ],
};

interface ConversationSuggestionsProps {
  hobbies: string[];
  onPick: (text: string) => void;
  disabled?: boolean;
}

export default function ConversationSuggestions({
  hobbies,
  onPick,
  disabled,
}: ConversationSuggestionsProps) {
  const locale = useLocaleStore((s) => s.locale);

  const hobbyCategory = useMemo<SuggestionCategory | null>(() => {
    const items: Bilingual[] = [];
    for (const h of hobbies) {
      const prompts = HOBBY_PROMPTS[h];
      if (prompts) items.push(...prompts);
    }
    if (items.length === 0) return null;
    return {
      id: "hobby",
      label: { id: "Minat Kamu", en: "Your Interests" },
      hint: {
        id: "Disaring dari hobi yang kamu pilih tadi.",
        en: "Drawn from the hobbies you chose earlier.",
      },
      accent: "#FF2D87",
      items,
    };
  }, [hobbies]);

  const categories = useMemo<SuggestionCategory[]>(
    () => (hobbyCategory ? [hobbyCategory, ...STATIC_CATEGORIES] : STATIC_CATEGORIES),
    [hobbyCategory],
  );

  const [activeId, setActiveId] = useState<string>(categories[0]?.id ?? "icebreaker");
  const active = categories.find((c) => c.id === activeId) ?? categories[0];

  return (
    <div className="flex h-full w-full flex-col gap-4 px-6 py-2 overflow-hidden">
      <div className="flex flex-col gap-1.5">
        <span className="font-display text-[12px] uppercase tracking-[0.32em] text-cyan-accent/80">
          {locale === "en" ? "Conversation Starters" : "Saran Obrolan"}
        </span>
        <span className="text-[13px] text-text-muted leading-relaxed">
          {locale === "en"
            ? "Tap one — she'll respond right away."
            : "Tap salah satu — dia langsung balas."}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => {
          const label = locale === "en" ? c.label.en : c.label.id;
          const isActive = c.id === activeId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveId(c.id)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-display uppercase tracking-[0.18em] transition-all ${
                isActive
                  ? "text-obsidian-950"
                  : "text-text-secondary hover:text-white"
              }`}
              style={
                isActive
                  ? { backgroundColor: c.accent }
                  : {
                      backgroundColor: "rgba(255,255,255,0.04)",
                    }
              }
            >
              {label}
            </button>
          );
        })}
      </div>

      {active && (
        <>
          <span className="text-[12.5px] italic text-text-muted/80 leading-snug">
            {locale === "en" ? active.hint.en : active.hint.id}
          </span>

          <div
            className="flex-1 flex flex-col gap-2.5 overflow-y-auto pr-1 -mr-1"
            style={{
              maskImage:
                "linear-gradient(to bottom, transparent 0, #000 20px, #000 calc(100% - 32px), transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0, #000 20px, #000 calc(100% - 32px), transparent 100%)",
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-2.5"
              >
                {active.items.map((item, idx) => {
                  const text = locale === "en" ? item.en : item.id;
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={disabled}
                      onClick={() => onPick(text)}
                      className="group text-left rounded-xl px-4 py-3.5 text-[14.5px] leading-relaxed text-text-primary/90 transition-all hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.035)",
                        borderLeft: `2px solid ${active.accent}55`,
                      }}
                    >
                      {text}
                    </button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}

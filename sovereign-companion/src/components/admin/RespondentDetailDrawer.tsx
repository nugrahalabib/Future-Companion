"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FACE_LABEL, GENDER_LABEL, HAIR_LABEL, BODY_LABEL, SKIN_LABEL,
  ROLE_LABEL, HOBBY_LABEL, RELATIONSHIP_LABEL, labelize,
} from "@/lib/admin/labels";
import { useT } from "@/lib/i18n/useT";
import type { TranslateFn } from "@/lib/i18n/useT";
import type { Locale } from "@/stores/useLocaleStore";

interface Props {
  userId: string | null;
  onClose: () => void;
}

interface DetailData {
  user: {
    id: string;
    fullName: string;
    nickname: string;
    email: string;
    age: number;
    profession: string;
    relationshipStatus: string;
    createdAt: string;
    updatedAt: string;
  };
  companion: {
    companionName: string;
    gender: string;
    faceShape: string | null;
    hairStyle: string | null;
    bodyBuild: string | null;
    skinTone: string;
    features: { artificialWomb?: boolean; spermBank?: boolean };
    hobbies: string[];
    role: string;
    dominanceLevel: number;
    innocenceLevel: number;
    emotionalLevel: number;
    humorStyle: number;
    finalImagePath: string | null;
    userNicknames: string[] | string;
  } | null;
  session: Record<string, string | number | boolean | null> | null;
  survey: Record<string, unknown> | null;
  transcripts: {
    id: string;
    role: string;
    content: string;
    sequenceOrder: number;
    timestamp: string;
  }[];
}

export default function RespondentDetailDrawer({ userId, onClose }: Props) {
  const { t, locale } = useT();
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"profile" | "companion" | "survey" | "transcript" | "session">(
    "profile",
  );

  useEffect(() => {
    if (!userId) {
      setData(null);
      return;
    }
    setLoading(true);
    fetch(`/api/admin/respondents/${userId}`)
      .then((r) => r.json())
      .then((d: DetailData) => setData(d))
      .finally(() => setLoading(false));
    setTab("profile");
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [userId, onClose]);

  const dateLocale = locale === "id" ? "id-ID" : "en-US";

  return (
    <AnimatePresence>
      {userId && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-obsidian/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 32 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[640px] lg:w-[760px] glass-elevated border-l border-glass-border overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-glass-border">
              <div className="min-w-0">
                <p className="text-[10px] font-display uppercase tracking-widest text-text-muted">
                  {t("admin.drawer.header")}
                </p>
                <h2 className="font-display text-lg font-bold text-text-primary truncate">
                  {data?.user.fullName ??
                    (loading ? t("admin.common.loading") : t("admin.drawer.fallbackName"))}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-text-muted hover:text-text-primary transition-colors cursor-pointer text-xl leading-none px-2"
                aria-label={t("admin.drawer.close")}
              >
                ×
              </button>
            </div>

            <div className="flex items-center gap-1 px-2 py-2 border-b border-glass-border overflow-x-auto">
              {(
                [
                  { key: "profile", label: t("admin.drawer.tab.profile") },
                  { key: "companion", label: t("admin.drawer.tab.companion") },
                  { key: "survey", label: t("admin.drawer.tab.survey") },
                  {
                    key: "transcript",
                    label: `${t("admin.drawer.tab.transcript")} (${data?.transcripts.length ?? 0})`,
                  },
                  { key: "session", label: t("admin.drawer.tab.session") },
                ] as const
              ).map((tb) => (
                <button
                  key={tb.key}
                  onClick={() => setTab(tb.key)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-display uppercase tracking-widest whitespace-nowrap transition-colors cursor-pointer ${
                    tab === tb.key
                      ? "bg-cyan-accent/20 text-cyan-accent"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  {tb.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {loading && (
                <p className="text-sm text-text-muted">{t("admin.drawer.loading")}</p>
              )}
              {!loading && data && tab === "profile" && (
                <ProfileSection data={data} t={t} locale={locale} dateLocale={dateLocale} />
              )}
              {!loading && data && tab === "companion" && (
                <CompanionSection data={data} t={t} locale={locale} />
              )}
              {!loading && data && tab === "survey" && <SurveySection data={data} t={t} />}
              {!loading && data && tab === "transcript" && (
                <TranscriptSection data={data} t={t} dateLocale={dateLocale} />
              )}
              {!loading && data && tab === "session" && (
                <SessionSection data={data} t={t} dateLocale={dateLocale} />
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 py-2 border-b border-glass-border/50 text-sm">
      <span className="text-text-muted font-display uppercase tracking-wider text-[10px]">
        {label}
      </span>
      <span className="text-text-primary break-words">{value ?? "—"}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display text-xs font-semibold text-cyan-accent uppercase tracking-widest mt-4 first:mt-0">
      {children}
    </h3>
  );
}

function ProfileSection({
  data, t, locale, dateLocale,
}: {
  data: DetailData;
  t: TranslateFn;
  locale: Locale;
  dateLocale: string;
}) {
  const u = data.user;
  return (
    <div className="space-y-1">
      <SectionTitle>{t("admin.drawer.profile.section.identity")}</SectionTitle>
      <KV label={t("admin.drawer.profile.fullName")} value={u.fullName} />
      <KV label={t("admin.drawer.profile.nickname")} value={u.nickname || "—"} />
      <KV label={t("admin.drawer.profile.email")} value={u.email} />
      <KV label={t("admin.drawer.profile.age")} value={u.age} />
      <KV label={t("admin.drawer.profile.profession")} value={u.profession} />
      <KV
        label={t("admin.drawer.profile.relationship")}
        value={labelize(RELATIONSHIP_LABEL, u.relationshipStatus, locale)}
      />
      <KV
        label={t("admin.drawer.profile.registered")}
        value={new Date(u.createdAt).toLocaleString(dateLocale)}
      />
      <KV
        label={t("admin.drawer.profile.lastUpdated")}
        value={new Date(u.updatedAt).toLocaleString(dateLocale)}
      />
      <KV
        label={t("admin.drawer.profile.recordId")}
        value={<code className="text-[11px] text-text-muted">{u.id}</code>}
      />
    </div>
  );
}

function CompanionSection({
  data, t, locale,
}: {
  data: DetailData;
  t: TranslateFn;
  locale: Locale;
}) {
  const c = data.companion;
  if (!c) return <p className="text-sm text-text-muted">{t("admin.drawer.companion.noConfig")}</p>;
  const nicknames = Array.isArray(c.userNicknames)
    ? c.userNicknames
    : typeof c.userNicknames === "string" && c.userNicknames.length > 0
      ? [c.userNicknames]
      : [];
  const activeFeatures = [
    c.features.artificialWomb ? t("admin.insights.features.womb") : null,
    c.features.spermBank ? t("admin.insights.features.sperm") : null,
  ].filter(Boolean) as string[];
  return (
    <div className="space-y-3">
      {c.finalImagePath && (
        <div className="rounded-xl overflow-hidden border border-glass-border bg-obsidian-surface relative aspect-[3/4] max-h-72 mx-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={c.finalImagePath}
            alt={c.companionName}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <SectionTitle>{t("admin.drawer.companion.naming")}</SectionTitle>
      <KV label={t("admin.drawer.companion.companionName")} value={c.companionName || "—"} />
      <KV
        label={t("admin.drawer.companion.userNicknames")}
        value={nicknames.length ? nicknames.join(", ") : "—"}
      />

      <SectionTitle>{t("admin.drawer.companion.physical")}</SectionTitle>
      <KV label={t("admin.drawer.companion.gender")} value={labelize(GENDER_LABEL, c.gender, locale)} />
      <KV label={t("admin.drawer.companion.face")} value={labelize(FACE_LABEL, c.faceShape, locale)} />
      <KV label={t("admin.drawer.companion.hair")} value={labelize(HAIR_LABEL, c.hairStyle, locale)} />
      <KV label={t("admin.drawer.companion.body")} value={labelize(BODY_LABEL, c.bodyBuild, locale)} />
      <KV label={t("admin.drawer.companion.skin")} value={labelize(SKIN_LABEL, c.skinTone, locale)} />

      <SectionTitle>{t("admin.drawer.companion.features.section")}</SectionTitle>
      <KV
        label={t("admin.drawer.companion.features.active")}
        value={
          activeFeatures.length ? (
            <span className="flex flex-wrap gap-1.5">
              {activeFeatures.map((f) => (
                <span
                  key={f}
                  className="px-2 py-0.5 rounded-full text-[11px] bg-bio-green/15 text-bio-green border border-bio-green/30"
                >
                  {f}
                </span>
              ))}
            </span>
          ) : (
            t("admin.drawer.companion.features.none")
          )
        }
      />

      <SectionTitle>{t("admin.drawer.companion.persona")}</SectionTitle>
      <KV label={t("admin.drawer.companion.role")} value={labelize(ROLE_LABEL, c.role, locale)} />
      <PersonaBar label={t("admin.drawer.companion.dominance")} value={c.dominanceLevel} />
      <PersonaBar label={t("admin.drawer.companion.innocence")} value={c.innocenceLevel} />
      <PersonaBar label={t("admin.drawer.companion.emotional")} value={c.emotionalLevel} />
      <PersonaBar label={t("admin.drawer.companion.humor")} value={c.humorStyle} />

      <SectionTitle>
        {t("admin.drawer.companion.hobbies.count", { n: c.hobbies.length })}
      </SectionTitle>
      {c.hobbies.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {c.hobbies.map((h) => (
            <span
              key={h}
              className="px-2.5 py-1 rounded-full text-[11px] bg-cyan-accent/10 text-cyan-accent border border-cyan-accent/25"
            >
              {labelize(HOBBY_LABEL, h, locale)}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-muted">{t("admin.drawer.companion.hobbies.empty")}</p>
      )}
    </div>
  );
}

function PersonaBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="py-2 border-b border-glass-border/50">
      <div className="flex justify-between text-[10px] font-display uppercase tracking-widest text-text-muted mb-1">
        <span>{label}</span>
        <span className="text-text-primary">{Math.round(value)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-obsidian-surface overflow-hidden">
        <div
          className="h-full bg-cyan-accent"
          style={{
            width: `${Math.max(0, Math.min(100, value))}%`,
            boxShadow: "0 0 8px rgba(0,240,255,0.6)",
          }}
        />
      </div>
    </div>
  );
}

const SURVEY_FIELD_GROUPS: {
  titleKey: string;
  fields: { key: string; kind?: "likert" | "text" | "raw" }[];
}[] = [
  {
    titleKey: "admin.drawer.survey.group.core",
    fields: [
      { key: "personaAccuracy", kind: "likert" },
      { key: "replacementWillingness", kind: "likert" },
      { key: "overallExperience", kind: "likert" },
      { key: "uiEaseOfUse", kind: "likert" },
      { key: "conceptFeasibility", kind: "likert" },
      { key: "mostInfluentialFeature" },
      { key: "additionalFeedback", kind: "text" },
    ],
  },
  {
    titleKey: "admin.drawer.survey.group.expectations",
    fields: [
      { key: "priorAiFamiliarity", kind: "likert" },
      { key: "expectationAlignment", kind: "likert" },
      { key: "firstImpression", kind: "text" },
      { key: "discoverySource" },
    ],
  },
  {
    titleKey: "admin.drawer.survey.group.creator",
    fields: [
      { key: "customizationDepth", kind: "likert" },
      { key: "stepFlowIntuitiveness", kind: "likert" },
      { key: "visualFidelity", kind: "likert" },
      { key: "customizationTimeFeel" },
      { key: "missingCustomization", kind: "text" },
    ],
  },
  {
    titleKey: "admin.drawer.survey.group.reveal",
    fields: [
      { key: "revealImpact", kind: "likert" },
      { key: "revealMatchedImagination", kind: "likert" },
      { key: "revealEmotions", kind: "raw" },
    ],
  },
  {
    titleKey: "admin.drawer.survey.group.encounter",
    fields: [
      { key: "voiceNaturalness", kind: "likert" },
      { key: "voiceResponsiveness", kind: "likert" },
      { key: "companionPresence", kind: "likert" },
      { key: "conversationDepth", kind: "likert" },
      { key: "preferredLongerSession", kind: "likert" },
    ],
  },
  {
    titleKey: "admin.drawer.survey.group.ethics",
    fields: [
      { key: "ethicalConcernLevel", kind: "likert" },
      { key: "ethicalConcerns", kind: "raw" },
      { key: "impactOnHumanRelations", kind: "likert" },
      { key: "socialAcceptancePrediction", kind: "likert" },
    ],
  },
  {
    titleKey: "admin.drawer.survey.group.market",
    fields: [
      { key: "purchaseIntent", kind: "likert" },
      { key: "expectedPriceRange" },
      { key: "preferredPricingModel" },
      { key: "willingnessToPayPremium", kind: "likert" },
      { key: "primaryUseCase", kind: "raw" },
      { key: "targetDemographic", kind: "raw" },
    ],
  },
  {
    titleKey: "admin.drawer.survey.group.emotional",
    fields: [
      { key: "emotionalConnection", kind: "likert" },
      { key: "feltJudgedOrSafe", kind: "likert" },
      { key: "wouldMissCompanion", kind: "likert" },
      { key: "lonelinessAssist", kind: "likert" },
    ],
  },
  {
    titleKey: "admin.drawer.survey.group.openEnded",
    fields: [
      { key: "biggestConcern", kind: "text" },
      { key: "mostMemorableMoment", kind: "text" },
      { key: "improvementSuggestion", kind: "text" },
    ],
  },
  {
    titleKey: "admin.drawer.survey.group.recommendation",
    fields: [
      { key: "npsScore" },
      { key: "exhibitionQuality", kind: "likert" },
      { key: "willRecommend", kind: "likert" },
    ],
  },
];

function SurveySection({ data, t }: { data: DetailData; t: TranslateFn }) {
  const s = data.survey as Record<string, unknown> | null;
  if (!s) return <p className="text-sm text-text-muted">{t("admin.drawer.survey.noneYet")}</p>;
  const renderValue = (raw: unknown, kind?: "likert" | "text" | "raw") => {
    if (raw === null || raw === undefined || raw === "") return "—";
    if (kind === "likert" && typeof raw === "number") {
      return (
        <span className="inline-flex items-center gap-2">
          <span className="font-display text-cyan-accent">{raw}</span>
          <span className="inline-flex gap-0.5" aria-hidden>
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                className={`w-3 h-1.5 rounded-sm ${n <= raw ? "bg-cyan-accent" : "bg-glass-border"}`}
              />
            ))}
          </span>
        </span>
      );
    }
    if (kind === "raw") {
      if (typeof raw === "string") {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed.join(", ");
        } catch {}
      }
      return String(raw);
    }
    if (kind === "text") return <span className="whitespace-pre-line">{String(raw)}</span>;
    return String(raw);
  };
  return (
    <div className="space-y-1">
      {SURVEY_FIELD_GROUPS.map((grp) => (
        <div key={grp.titleKey}>
          <SectionTitle>{t(grp.titleKey)}</SectionTitle>
          {grp.fields.map((f) => (
            <KV
              key={f.key}
              label={t(`admin.survey.${f.key}`)}
              value={renderValue(s[f.key], f.kind)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function TranscriptSection({
  data, t, dateLocale,
}: {
  data: DetailData;
  t: TranslateFn;
  dateLocale: string;
}) {
  if (data.transcripts.length === 0) {
    return <p className="text-sm text-text-muted">{t("admin.drawer.transcript.empty")}</p>;
  }
  return (
    <div className="space-y-2">
      {data.transcripts.map((tr) => {
        const isUser = tr.role === "user";
        return (
          <div
            key={tr.id}
            className={`rounded-xl border p-3 ${
              isUser
                ? "bg-cyan-accent/8 border-cyan-accent/25"
                : "bg-bio-green/8 border-bio-green/25"
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-display uppercase tracking-widest mb-1">
              <span className={isUser ? "text-cyan-accent" : "text-bio-green"}>
                {isUser
                  ? t("admin.drawer.transcript.user")
                  : t("admin.drawer.transcript.bot")}{" "}
                · #{tr.sequenceOrder}
              </span>
              <time className="text-text-muted">
                {new Date(tr.timestamp).toLocaleTimeString(dateLocale)}
              </time>
            </div>
            <p className="text-sm text-text-primary whitespace-pre-line leading-relaxed">
              {tr.content}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function SessionSection({
  data, t, dateLocale,
}: {
  data: DetailData;
  t: TranslateFn;
  dateLocale: string;
}) {
  const s = data.session;
  if (!s) return <p className="text-sm text-text-muted">{t("admin.drawer.session.noSession")}</p>;
  const ts = (k: string) => {
    const v = s[k];
    return v ? new Date(v as string).toLocaleString(dateLocale) : "—";
  };
  const dur = Number(s.encounterDuration);
  return (
    <div className="space-y-1">
      <SectionTitle>{t("admin.drawer.session.timestamps")}</SectionTitle>
      <KV label={t("admin.drawer.session.started")} value={ts("startedAt")} />
      <KV label={t("admin.drawer.session.registered")} value={ts("registeredAt")} />
      <KV label={t("admin.drawer.session.customized")} value={ts("customizedAt")} />
      <KV label={t("admin.drawer.session.assembled")} value={ts("assembledAt")} />
      <KV label={t("admin.drawer.session.encounterStart")} value={ts("encounterStartAt")} />
      <KV label={t("admin.drawer.session.encounterEnd")} value={ts("encounterEndAt")} />
      <KV label={t("admin.drawer.session.checkout")} value={ts("checkoutAt")} />
      <KV label={t("admin.drawer.session.survey")} value={ts("surveyAt")} />
      <KV label={t("admin.drawer.session.completed")} value={ts("completedAt")} />

      <SectionTitle>{t("admin.drawer.session.metrics")}</SectionTitle>
      <KV
        label={t("admin.drawer.session.duration")}
        value={
          s.encounterDuration
            ? t("admin.drawer.session.duration.value", {
                sec: Math.round(dur),
                m: Math.floor(dur / 60),
                s: Math.round(dur) % 60,
              })
            : "—"
        }
      />
      <KV
        label={t("admin.drawer.session.dropped")}
        value={
          s.dropped ? (
            <span className="text-danger">
              {t("admin.drawer.session.dropped.yes", {
                stage: String(s.dropStage ?? t("admin.drawer.session.dropped.unknownStage")),
              })}
            </span>
          ) : (
            t("admin.drawer.session.dropped.no")
          )
        }
      />
    </div>
  );
}

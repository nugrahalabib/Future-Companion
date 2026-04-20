"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Background from "@/components/layout/Background";
import GlassPanel from "@/components/ui/GlassPanel";
import GlassButton from "@/components/ui/GlassButton";
import LikertScale from "@/components/questionnaire/LikertScale";
import SingleChoice from "@/components/questionnaire/SingleChoice";
import MultiChoice from "@/components/questionnaire/MultiChoice";
import NPSScale from "@/components/questionnaire/NPSScale";
import EmailLookup, {
  type ResolvedUser,
} from "@/components/questionnaire/EmailLookup";
import { useUserStore } from "@/stores/useUserStore";
import { useSessionStore } from "@/stores/useSessionStore";
import { useT } from "@/lib/i18n/useT";
import { useHydrated } from "@/lib/useHydrated";

// Wrap the inner component in Suspense per Next.js 16 App Router rules for
// useSearchParams (see sovereign-companion/AGENTS.md → node_modules/next/dist/docs/).
export default function QuestionnairePage() {
  return (
    <Suspense fallback={null}>
      <QuestionnaireInner />
    </Suspense>
  );
}

// ---------- Option sets ----------
// Kept inside the module so translations can reference them via i18n keys.

const FIRST_IMPRESSION_OPTIONS = [
  { value: "excited", key: "q.firstImpression.excited" },
  { value: "curious", key: "q.firstImpression.curious" },
  { value: "skeptical", key: "q.firstImpression.skeptical" },
  { value: "uncomfortable", key: "q.firstImpression.uncomfortable" },
  { value: "inspired", key: "q.firstImpression.inspired" },
];

const DISCOVERY_SOURCE_OPTIONS = [
  { value: "exhibition-booth", key: "q.discovery.booth" },
  { value: "invited", key: "q.discovery.invited" },
  { value: "social-media", key: "q.discovery.social" },
  { value: "press", key: "q.discovery.press" },
  { value: "other", key: "q.discovery.other" },
];

const TIME_FEEL_OPTIONS = [
  { value: "too-short", key: "q.timeFeel.short" },
  { value: "just-right", key: "q.timeFeel.right" },
  { value: "too-long", key: "q.timeFeel.long" },
];

const REVEAL_EMOTION_OPTIONS = [
  { value: "surprised", key: "q.reveal.emotion.surprised" },
  { value: "moved", key: "q.reveal.emotion.moved" },
  { value: "excited", key: "q.reveal.emotion.excited" },
  { value: "satisfied", key: "q.reveal.emotion.satisfied" },
  { value: "unsettled", key: "q.reveal.emotion.unsettled" },
  { value: "underwhelmed", key: "q.reveal.emotion.underwhelmed" },
  { value: "proud", key: "q.reveal.emotion.proud" },
  { value: "nostalgic", key: "q.reveal.emotion.nostalgic" },
];

const ETHICAL_CONCERN_OPTIONS = [
  { value: "privacy", key: "q.ethics.privacy" },
  { value: "dependency", key: "q.ethics.dependency" },
  { value: "isolation", key: "q.ethics.isolation" },
  { value: "psych-harm", key: "q.ethics.psychHarm" },
  { value: "identity-confusion", key: "q.ethics.identity" },
  { value: "inequality", key: "q.ethics.inequality" },
  { value: "exploitation", key: "q.ethics.exploitation" },
  { value: "none", key: "q.ethics.none" },
];

const PRICE_RANGE_OPTIONS = [
  { value: "under-50m", key: "q.price.under50m" },
  { value: "50-150m", key: "q.price.50to150m" },
  { value: "150-500m", key: "q.price.150to500m" },
  { value: "500m-1b", key: "q.price.500mto1b" },
  { value: "over-1b", key: "q.price.over1b" },
  { value: "would-not-buy", key: "q.price.none" },
];

const PRICING_MODEL_OPTIONS = [
  { value: "one-time", key: "q.pricing.oneTime" },
  { value: "subscription", key: "q.pricing.subscription" },
  { value: "hybrid", key: "q.pricing.hybrid" },
  { value: "pay-per-use", key: "q.pricing.perUse" },
];

const USE_CASE_OPTIONS = [
  { value: "companionship", key: "q.useCase.companionship" },
  { value: "romance", key: "q.useCase.romance" },
  { value: "therapy", key: "q.useCase.therapy" },
  { value: "productivity", key: "q.useCase.productivity" },
  { value: "learning", key: "q.useCase.learning" },
  { value: "entertainment", key: "q.useCase.entertainment" },
  { value: "elderly-care", key: "q.useCase.elderly" },
  { value: "intimacy", key: "q.useCase.intimacy" },
];

const DEMOGRAPHIC_OPTIONS = [
  { value: "single-young", key: "q.demo.singleYoung" },
  { value: "single-professional", key: "q.demo.singleProfessional" },
  { value: "divorced", key: "q.demo.divorced" },
  { value: "elderly", key: "q.demo.elderly" },
  { value: "caregivers", key: "q.demo.caregivers" },
  { value: "technophiles", key: "q.demo.technophiles" },
  { value: "lgbtq", key: "q.demo.lgbtq" },
];

const FEATURE_OPTIONS = [
  { value: "Physical Design (Face/Hair/Body/Skin)", key: "q.feature.physical" },
  { value: "Biological Features", key: "q.feature.biological" },
  { value: "Persona & Personality", key: "q.feature.persona" },
  { value: "Hobbies & Interests", key: "q.feature.hobbies" },
  { value: "Voice Interaction", key: "q.feature.voice" },
  { value: "Final Reveal Moment", key: "q.feature.reveal" },
];

// ---------- Form state ----------

interface FormState {
  // Section B
  priorAiFamiliarity: number;
  expectationAlignment: number;
  firstImpression: string;
  discoverySource: string;
  // Section C
  customizationDepth: number;
  stepFlowIntuitiveness: number;
  visualFidelity: number;
  customizationTimeFeel: string;
  missingCustomization: string;
  mostInfluentialFeature: string;
  // Section D
  revealImpact: number;
  revealMatchedImagination: number;
  revealEmotions: string[];
  // Section E
  personaAccuracy: number;
  voiceNaturalness: number;
  voiceResponsiveness: number;
  companionPresence: number;
  conversationDepth: number;
  preferredLongerSession: number;
  // Section F
  ethicalConcernLevel: number;
  ethicalConcerns: string[];
  impactOnHumanRelations: number;
  socialAcceptancePrediction: number;
  conceptFeasibility: number;
  replacementWillingness: number;
  // Section G
  purchaseIntent: number;
  expectedPriceRange: string;
  preferredPricingModel: string;
  willingnessToPayPremium: number;
  primaryUseCase: string[];
  targetDemographic: string[];
  // Section H
  emotionalConnection: number;
  feltJudgedOrSafe: number;
  wouldMissCompanion: number;
  lonelinessAssist: number;
  // Section I
  biggestConcern: string;
  mostMemorableMoment: string;
  improvementSuggestion: string;
  // Section J
  overallExperience: number;
  uiEaseOfUse: number;
  exhibitionQuality: number;
  willRecommend: number;
  npsScore: number;
  additionalFeedback: string;
}

const INITIAL_FORM: FormState = {
  priorAiFamiliarity: 0,
  expectationAlignment: 0,
  firstImpression: "",
  discoverySource: "",
  customizationDepth: 0,
  stepFlowIntuitiveness: 0,
  visualFidelity: 0,
  customizationTimeFeel: "",
  missingCustomization: "",
  mostInfluentialFeature: "",
  revealImpact: 0,
  revealMatchedImagination: 0,
  revealEmotions: [],
  personaAccuracy: 0,
  voiceNaturalness: 0,
  voiceResponsiveness: 0,
  companionPresence: 0,
  conversationDepth: 0,
  preferredLongerSession: 0,
  ethicalConcernLevel: 0,
  ethicalConcerns: [],
  impactOnHumanRelations: 0,
  socialAcceptancePrediction: 0,
  conceptFeasibility: 0,
  replacementWillingness: 0,
  purchaseIntent: 0,
  expectedPriceRange: "",
  preferredPricingModel: "",
  willingnessToPayPremium: 0,
  primaryUseCase: [],
  targetDemographic: [],
  emotionalConnection: 0,
  feltJudgedOrSafe: 0,
  wouldMissCompanion: 0,
  lonelinessAssist: 0,
  biggestConcern: "",
  mostMemorableMoment: "",
  improvementSuggestion: "",
  overallExperience: 0,
  uiEaseOfUse: 0,
  exhibitionQuality: 0,
  willRecommend: 0,
  npsScore: -1,
  additionalFeedback: "",
};

const TOTAL_SECTIONS = 7;

function QuestionnaireInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeUserId = useUserStore((s) => s.userId);
  const hydrated = useHydrated();
  const setStage = useSessionStore((s) => s.setStage);
  const resetSession = useSessionStore((s) => s.reset);
  const { t } = useT();

  // The questionnaire is public: booth visitors who miss the QR scan can still
  // reach it directly and identify themselves via the email picker. Three
  // entry modes coexist:
  //   - `?uid=...`  → phone handoff from the booth's QR (skip stage updates,
  //                   the booth has already moved on)
  //   - active booth session (storeUserId present) → in-booth submission
  //   - neither    → public access; user MUST pick their email to identify
  // `bypassStageUpdate` collapses modes 1 and 3 — in both, we must not touch
  // the Session stage counter on submit because it would either hit another
  // visitor's session or none at all.
  const uidFromQuery = searchParams.get("uid");
  const bypassStageUpdate = Boolean(uidFromQuery) || !storeUserId;

  const [identity, setIdentity] = useState<ResolvedUser | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [section, setSection] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Only render the red highlights + banner AFTER the user has attempted to
  // leave the section with missing answers. Flips back off on every section
  // change so returning to a section doesn't greet them with red boxes.
  const [showErrors, setShowErrors] = useState(false);

  const activeUserId = identity?.userId ?? uidFromQuery ?? storeUserId;

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    setShowErrors(false);
  }, [section]);

  async function handleSubmit() {
    if (!activeUserId) {
      setSubmitError(t("q.identity.required"));
      setSection(0);
      return;
    }

    setLoading(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: activeUserId, ...form }),
      });
      if (!res.ok) throw new Error("submit_failed");
      if (!bypassStageUpdate) setStage(8);
      setSubmitted(true);
    } catch {
      setSubmitError(t("q.submit.error"));
    } finally {
      setLoading(false);
    }
  }

  // Public route: no redirect. Users without an active session identify
  // themselves via the email picker in Section 0 (Section 0's `canAdvance`
  // gate blocks progress until an `activeUserId` resolves).
  //
  // `router` is referenced elsewhere (post-submit "new demo" CTA) so we keep
  // the import; silence the unused-lint warning via void.
  void router;

  // Wait on hydration only when we might consult the session (neither uid
  // query present); a uid-based handoff doesn't need the booth store at all.
  const shouldRender = useMemo(
    () => Boolean(uidFromQuery) || hydrated,
    [uidFromQuery, hydrated],
  );
  if (!shouldRender) return null;

  const inputClass =
    "w-full bg-obsidian-surface border border-glass-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-cyan-accent/40 transition-colors";

  // Per-section list of unanswered required fields. A field is "required"
  // when it accepts structured input (Likert / single / multi / NPS); all
  // free-text fields remain optional. Shared by `canAdvance()` and the red
  // per-field highlighting.
  function missingFields(sec: number): string[] {
    const miss: string[] = [];
    const needLikert = (k: keyof FormState) => {
      if ((form[k] as number) <= 0) miss.push(k as string);
    };
    const needString = (k: keyof FormState) => {
      const v = form[k] as string | undefined;
      if (!v) miss.push(k as string);
    };
    const needArray = (k: keyof FormState) => {
      if (!(form[k] as string[])?.length) miss.push(k as string);
    };

    switch (sec) {
      case 0:
        if (!activeUserId) miss.push("identity");
        break;
      case 1:
        needLikert("priorAiFamiliarity");
        needLikert("expectationAlignment");
        needString("firstImpression");
        needString("discoverySource");
        break;
      case 2:
        needLikert("customizationDepth");
        needLikert("stepFlowIntuitiveness");
        needLikert("visualFidelity");
        needString("customizationTimeFeel");
        needString("mostInfluentialFeature");
        break;
      case 3:
        needLikert("revealImpact");
        needLikert("revealMatchedImagination");
        needLikert("personaAccuracy");
        needLikert("voiceNaturalness");
        needLikert("voiceResponsiveness");
        needLikert("companionPresence");
        needLikert("conversationDepth");
        needLikert("preferredLongerSession");
        break;
      case 4:
        needLikert("ethicalConcernLevel");
        needLikert("impactOnHumanRelations");
        needLikert("socialAcceptancePrediction");
        needLikert("conceptFeasibility");
        needLikert("replacementWillingness");
        break;
      case 5:
        needLikert("purchaseIntent");
        needString("expectedPriceRange");
        needString("preferredPricingModel");
        needLikert("willingnessToPayPremium");
        needArray("primaryUseCase");
        needArray("targetDemographic");
        break;
      case 6:
        needLikert("emotionalConnection");
        needLikert("feltJudgedOrSafe");
        needLikert("wouldMissCompanion");
        needLikert("lonelinessAssist");
        needLikert("overallExperience");
        needLikert("uiEaseOfUse");
        needLikert("exhibitionQuality");
        needLikert("willRecommend");
        if (form.npsScore < 0) miss.push("npsScore");
        break;
    }
    return miss;
  }

  const currentMissing = missingFields(section);
  const canAdvance = () => currentMissing.length === 0;
  const isInvalid = (field: string) =>
    showErrors && currentMissing.includes(field);

  function handleNext() {
    if (canAdvance()) {
      setSection((s) => s + 1);
    } else {
      setShowErrors(true);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }

  async function handleSubmitClick() {
    if (!canAdvance()) {
      setShowErrors(true);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }
    await handleSubmit();
  }

  return (
    <main className="relative flex-1 overflow-hidden">
      <Background />
      <div className="relative z-10 flex items-start justify-center min-h-screen px-6 py-12">
        {!submitted ? (
          <GlassPanel
            variant="elevated"
            className="w-full max-w-3xl p-6 sm:p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mb-6">
              <p className="font-display text-[11px] uppercase tracking-[0.35em] text-cyan-accent/80 mb-2">
                {t("q.badge")} · {section + 1} / {TOTAL_SECTIONS}
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary mb-2">
                {t("q.heading")}
              </h1>
              <p className="text-sm text-text-secondary">
                {t("q.subheading")}
              </p>
              <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-glass-border">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, #00F0FF 0%, #39FF14 100%)",
                    boxShadow: "0 0 10px rgba(0,240,255,0.5)",
                  }}
                  animate={{
                    width: `${((section + 1) / TOTAL_SECTIONS) * 100}%`,
                  }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>

            <AnimatePresence>
              {showErrors && !canAdvance() && (
                <motion.div
                  key="validation-banner"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  role="alert"
                  className="mb-5 rounded-xl border border-danger/70 bg-danger/10 px-4 py-3 flex items-start gap-3"
                  style={{ boxShadow: "0 0 18px rgba(255,90,90,0.25)" }}
                >
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-danger/25 text-danger font-display text-sm font-bold"
                  >
                    !
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-sm font-semibold text-danger">
                      {t("q.validation.banner.title")}
                    </p>
                    <p className="text-xs text-danger/90 mt-1">
                      {t("q.validation.banner.body").replace(
                        "{count}",
                        String(currentMissing.length),
                      )}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.section
                key={section}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {section === 0 && (
                  <SectionIdentity
                    emailInput={emailInput}
                    setEmailInput={setEmailInput}
                    identity={identity}
                    setIdentity={setIdentity}
                    hasActiveSession={Boolean(storeUserId) && !uidFromQuery}
                    activeUserId={activeUserId}
                    inputClass={inputClass}
                    invalid={isInvalid("identity")}
                  />
                )}
                {section === 1 && (
                  <SectionExpectations
                    form={form}
                    update={update}
                    isInvalid={isInvalid}
                  />
                )}
                {section === 2 && (
                  <SectionCreator
                    form={form}
                    update={update}
                    inputClass={inputClass}
                    isInvalid={isInvalid}
                  />
                )}
                {section === 3 && (
                  <SectionEncounter
                    form={form}
                    update={update}
                    isInvalid={isInvalid}
                  />
                )}
                {section === 4 && (
                  <SectionEthics
                    form={form}
                    update={update}
                    isInvalid={isInvalid}
                  />
                )}
                {section === 5 && (
                  <SectionMarket
                    form={form}
                    update={update}
                    isInvalid={isInvalid}
                  />
                )}
                {section === 6 && (
                  <SectionEmotional
                    form={form}
                    update={update}
                    inputClass={inputClass}
                    isInvalid={isInvalid}
                  />
                )}
              </motion.section>
            </AnimatePresence>

            {submitError && (
              <p className="text-sm text-danger mt-4">{submitError}</p>
            )}

            <div className="flex items-center justify-between pt-6 mt-6 border-t border-glass-border">
              <GlassButton
                variant="secondary"
                size="sm"
                onClick={() => setSection((s) => Math.max(0, s - 1))}
                disabled={section === 0 || loading}
              >
                {t("common.back")}
              </GlassButton>

              {section < TOTAL_SECTIONS - 1 ? (
                <GlassButton
                  size="sm"
                  onClick={handleNext}
                  disabled={loading}
                >
                  {t("common.next")}
                </GlassButton>
              ) : (
                <GlassButton
                  size="sm"
                  onClick={handleSubmitClick}
                  disabled={loading}
                  pulse={!loading && canAdvance()}
                >
                  {loading ? t("q.submit.loading") : t("q.submit")}
                </GlassButton>
              )}
            </div>
          </GlassPanel>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4 max-w-md"
          >
            <motion.div
              className="w-20 h-20 mx-auto rounded-full border-2 border-bio-green flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
            >
              <span className="text-bio-green text-3xl">✓</span>
            </motion.div>
            <h2 className="font-display text-3xl font-bold text-text-primary">
              {t("q.thanks.heading")}
            </h2>
            <p className="text-text-secondary">{t("q.thanks.body")}</p>
            {/* "New Demo" CTA only for booth-side submissions. Phone / public
                users don't own the booth state so resetting would be confusing. */}
            {!bypassStageUpdate && (
              <div className="pt-6 space-y-3">
                <GlassButton
                  variant="secondary"
                  onClick={() => {
                    resetSession();
                    useUserStore.getState().clearUser();
                    router.push("/");
                  }}
                >
                  {t("q.thanks.newDemo")}
                </GlassButton>
              </div>
            )}
            <p className="text-xs text-text-muted font-display uppercase tracking-widest pt-4">
              {t("q.footer")}
            </p>
          </motion.div>
        )}
      </div>
    </main>
  );
}

// ---------- Sections ----------

function SectionIdentity({
  emailInput,
  setEmailInput,
  identity,
  setIdentity,
  hasActiveSession,
  activeUserId,
  inputClass,
  invalid,
}: {
  emailInput: string;
  setEmailInput: (v: string) => void;
  identity: ResolvedUser | null;
  setIdentity: (u: ResolvedUser | null) => void;
  // True only when the booth session is the source of identity (i.e. not a
  // QR handoff and not a public visitor who hasn't picked an email yet).
  // Drives the "continuing with booth session" subtle hint.
  hasActiveSession: boolean;
  activeUserId: string | null;
  inputClass: string;
  invalid?: boolean;
}) {
  const { t } = useT();
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-lg text-text-primary mb-1">
          {t("q.identity.title")}
        </h2>
        <p className="text-sm text-text-secondary">
          {t("q.identity.helper")}
        </p>
      </div>

      <div
        className={`space-y-2 ${
          invalid
            ? "rounded-xl border border-danger/60 bg-danger/5 p-4 -mx-1"
            : ""
        }`}
        style={invalid ? { boxShadow: "0 0 14px rgba(255,90,90,0.18)" } : undefined}
      >
        <label
          className={`font-display text-xs uppercase tracking-widest ${
            invalid ? "text-danger" : "text-text-muted"
          }`}
        >
          {invalid && <span aria-hidden>● </span>}
          {t("q.identity.emailLabel")}
        </label>
        <EmailLookup
          value={emailInput}
          onChange={setEmailInput}
          onResolve={setIdentity}
        />
        {invalid && (
          <p className="text-[11px] text-danger font-display uppercase tracking-widest">
            {t("q.validation.required")}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="font-display text-xs uppercase tracking-widest text-text-muted">
            {t("q.identity.nameLabel")}
          </label>
          <input
            type="text"
            readOnly
            value={identity?.fullName ?? ""}
            placeholder={t("q.identity.autofillHint")}
            className={`${inputClass} opacity-80`}
          />
        </div>
        <div className="space-y-2">
          <label className="font-display text-xs uppercase tracking-widest text-text-muted">
            {t("q.identity.nicknameLabel")}
          </label>
          <input
            type="text"
            readOnly
            value={identity?.nickname ?? ""}
            placeholder={t("q.identity.autofillHint")}
            className={`${inputClass} opacity-80`}
          />
        </div>
        <div className="space-y-2">
          <label className="font-display text-xs uppercase tracking-widest text-text-muted">
            {t("q.identity.ageLabel")}
          </label>
          <input
            type="text"
            readOnly
            value={identity?.age ? String(identity.age) : ""}
            placeholder={t("q.identity.autofillHint")}
            className={`${inputClass} opacity-80`}
          />
        </div>
        <div className="space-y-2">
          <label className="font-display text-xs uppercase tracking-widest text-text-muted">
            {t("q.identity.professionLabel")}
          </label>
          <input
            type="text"
            readOnly
            value={identity?.profession ?? ""}
            placeholder={t("q.identity.autofillHint")}
            className={`${inputClass} opacity-80`}
          />
        </div>
      </div>

      {!activeUserId && (
        <p className="text-[11px] text-text-muted font-display uppercase tracking-widest">
          {t("q.identity.selectPrompt")}
        </p>
      )}
      {activeUserId && !identity && hasActiveSession && (
        <p className="text-[11px] text-cyan-accent font-display uppercase tracking-widest">
          {t("q.identity.usingSession")}
        </p>
      )}
    </div>
  );
}

function SectionExpectations({
  form,
  update,
  isInvalid,
}: {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  isInvalid: (field: string) => boolean;
}) {
  const { t } = useT();
  const hint = t("q.validation.required");
  return (
    <div className="space-y-6">
      <SectionHeading
        title={t("q.section.expectations.title")}
        hint={t("q.section.expectations.hint")}
      />
      <LikertScale
        question={t("q.priorFamiliarity")}
        questionId="priorAiFamiliarity"
        value={form.priorAiFamiliarity}
        onChange={(v) => update("priorAiFamiliarity", v)}
        lowLabel={t("q.anchor.neverHeard")}
        midLabel={t("q.anchor.neutral")}
        highLabel={t("q.anchor.expert")}
        invalid={isInvalid("priorAiFamiliarity")}
        requiredHint={hint}
      />
      <LikertScale
        question={t("q.expectationAlignment")}
        questionId="expectationAlignment"
        value={form.expectationAlignment}
        onChange={(v) => update("expectationAlignment", v)}
        lowLabel={t("q.anchor.farBelow")}
        midLabel={t("q.anchor.neutral")}
        highLabel={t("q.anchor.farExceeded")}
        invalid={isInvalid("expectationAlignment")}
        requiredHint={hint}
      />
      <SingleChoice
        question={t("q.firstImpressionPrompt")}
        options={FIRST_IMPRESSION_OPTIONS.map((o) => ({
          value: o.value,
          label: t(o.key),
        }))}
        value={form.firstImpression}
        onChange={(v) => update("firstImpression", v)}
        invalid={isInvalid("firstImpression")}
        requiredHint={hint}
      />
      <SingleChoice
        question={t("q.discoveryPrompt")}
        options={DISCOVERY_SOURCE_OPTIONS.map((o) => ({
          value: o.value,
          label: t(o.key),
        }))}
        value={form.discoverySource}
        onChange={(v) => update("discoverySource", v)}
        invalid={isInvalid("discoverySource")}
        requiredHint={hint}
      />
    </div>
  );
}

function SectionCreator({
  form,
  update,
  inputClass,
  isInvalid,
}: {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  inputClass: string;
  isInvalid: (field: string) => boolean;
}) {
  const { t } = useT();
  const hint = t("q.validation.required");
  const featureInvalid = isInvalid("mostInfluentialFeature");
  return (
    <div className="space-y-6">
      <SectionHeading
        title={t("q.section.creator.title")}
        hint={t("q.section.creator.hint")}
      />
      <LikertScale
        question={t("q.customizationDepth")}
        questionId="customizationDepth"
        value={form.customizationDepth}
        onChange={(v) => update("customizationDepth", v)}
        lowLabel={t("q.anchor.superficial")}
        midLabel={t("q.anchor.neutral")}
        highLabel={t("q.anchor.deep")}
        invalid={isInvalid("customizationDepth")}
        requiredHint={hint}
      />
      <LikertScale
        question={t("q.stepFlowIntuitive")}
        questionId="stepFlowIntuitiveness"
        value={form.stepFlowIntuitiveness}
        onChange={(v) => update("stepFlowIntuitiveness", v)}
        lowLabel={t("q.anchor.confusing")}
        midLabel={t("q.anchor.neutral")}
        highLabel={t("q.anchor.intuitive")}
        invalid={isInvalid("stepFlowIntuitiveness")}
        requiredHint={hint}
      />
      <LikertScale
        question={t("q.visualFidelity")}
        questionId="visualFidelity"
        value={form.visualFidelity}
        onChange={(v) => update("visualFidelity", v)}
        lowLabel={t("q.anchor.cartoonish")}
        midLabel={t("q.anchor.neutral")}
        highLabel={t("q.anchor.photorealistic")}
        invalid={isInvalid("visualFidelity")}
        requiredHint={hint}
      />
      <SingleChoice
        question={t("q.timeFeelPrompt")}
        options={TIME_FEEL_OPTIONS.map((o) => ({
          value: o.value,
          label: t(o.key),
        }))}
        value={form.customizationTimeFeel}
        onChange={(v) => update("customizationTimeFeel", v)}
        invalid={isInvalid("customizationTimeFeel")}
        requiredHint={hint}
      />
      <div
        className={`space-y-2 ${
          featureInvalid
            ? "rounded-xl border border-danger/60 bg-danger/5 p-4 -mx-1"
            : ""
        }`}
        style={
          featureInvalid
            ? { boxShadow: "0 0 14px rgba(255,90,90,0.18)" }
            : undefined
        }
      >
        <p
          className={`text-sm leading-relaxed flex items-start gap-2 ${
            featureInvalid ? "text-danger" : "text-text-primary"
          }`}
        >
          {featureInvalid && <span aria-hidden className="text-danger">●</span>}
          <span>{t("q.feature.prompt")}</span>
        </p>
        <select
          className={`${inputClass} cursor-pointer`}
          value={form.mostInfluentialFeature}
          onChange={(e) =>
            update("mostInfluentialFeature", e.target.value)
          }
        >
          <option value="" disabled>
            {t("q.feature.placeholder")}
          </option>
          {FEATURE_OPTIONS.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="bg-obsidian-surface"
            >
              {t(opt.key)}
            </option>
          ))}
        </select>
        {featureInvalid && (
          <p className="text-[11px] text-danger font-display uppercase tracking-widest">
            {hint}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <p className="text-sm text-text-primary">
          {t("q.missingCustomization")}
        </p>
        <textarea
          className={`${inputClass} min-h-[80px] resize-y`}
          placeholder={t("q.missingCustomization.placeholder")}
          value={form.missingCustomization}
          onChange={(e) => update("missingCustomization", e.target.value)}
        />
      </div>
    </div>
  );
}

function SectionEncounter({
  form,
  update,
  isInvalid,
}: {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  isInvalid: (field: string) => boolean;
}) {
  const { t } = useT();
  const hint = t("q.validation.required");
  return (
    <div className="space-y-6">
      <SectionHeading
        title={t("q.section.encounter.title")}
        hint={t("q.section.encounter.hint")}
      />
      <LikertScale
        question={t("q.revealImpact")}
        questionId="revealImpact"
        value={form.revealImpact}
        onChange={(v) => update("revealImpact", v)}
        lowLabel={t("q.anchor.flat")}
        midLabel={t("q.anchor.neutral")}
        highLabel={t("q.anchor.cinematic")}
        invalid={isInvalid("revealImpact")}
        requiredHint={hint}
      />
      <LikertScale
        question={t("q.revealMatched")}
        questionId="revealMatchedImagination"
        value={form.revealMatchedImagination}
        onChange={(v) => update("revealMatchedImagination", v)}
        lowLabel={t("q.anchor.notAtAll")}
        midLabel={t("q.anchor.neutral")}
        highLabel={t("q.anchor.exactly")}
        invalid={isInvalid("revealMatchedImagination")}
        requiredHint={hint}
      />
      <MultiChoice
        question={t("q.revealEmotionsPrompt")}
        helper={t("q.multi.helper")}
        options={REVEAL_EMOTION_OPTIONS.map((o) => ({
          value: o.value,
          label: t(o.key),
        }))}
        value={form.revealEmotions}
        onChange={(v) => update("revealEmotions", v)}
      />
      <LikertScale
        question={t("q.personaAccuracy")}
        questionId="personaAccuracy"
        value={form.personaAccuracy}
        onChange={(v) => update("personaAccuracy", v)}
        lowLabel={t("q.anchor.inaccurate")}
        midLabel={t("q.anchor.neutral")}
        highLabel={t("q.anchor.accurate")}
        invalid={isInvalid("personaAccuracy")}
        requiredHint={hint}
      />
      <LikertScale
        question={t("q.voiceNaturalness")}
        questionId="voiceNaturalness"
        value={form.voiceNaturalness}
        onChange={(v) => update("voiceNaturalness", v)}
        lowLabel={t("q.anchor.robotic")}
        midLabel={t("q.anchor.neutral")}
        highLabel={t("q.anchor.human")}
        invalid={isInvalid("voiceNaturalness")}
        requiredHint={hint}
      />
      <LikertScale
        question={t("q.voiceResponsiveness")}
        questionId="voiceResponsiveness"
        value={form.voiceResponsiveness}
        onChange={(v) => update("voiceResponsiveness", v)}
        lowLabel={t("q.anchor.slow")}
        midLabel={t("q.anchor.neutral")}
        highLabel={t("q.anchor.instant")}
        invalid={isInvalid("voiceResponsiveness")}
        requiredHint={hint}
      />
      <LikertScale
        question={t("q.companionPresence")}
        questionId="companionPresence"
        value={form.companionPresence}
        onChange={(v) => update("companionPresence", v)}
        lowLabel={t("q.anchor.toolLike")}
        midLabel={t("q.anchor.neutral")}
        highLabel={t("q.anchor.alive")}
        invalid={isInvalid("companionPresence")}
        requiredHint={hint}
      />
      <LikertScale
        question={t("q.conversationDepth")}
        questionId="conversationDepth"
        value={form.conversationDepth}
        onChange={(v) => update("conversationDepth", v)}
        lowLabel={t("q.anchor.shallow")}
        midLabel={t("q.anchor.neutral")}
        highLabel={t("q.anchor.deep")}
        invalid={isInvalid("conversationDepth")}
        requiredHint={hint}
      />
      <LikertScale
        question={t("q.preferLonger")}
        questionId="preferredLongerSession"
        value={form.preferredLongerSession}
        onChange={(v) => update("preferredLongerSession", v)}
        lowLabel={t("q.anchor.stronglyDisagree")}
        midLabel={t("q.anchor.neutral")}
        highLabel={t("q.anchor.stronglyAgree")}
        invalid={isInvalid("preferredLongerSession")}
        requiredHint={hint}
      />
    </div>
  );
}

function SectionEthics({
  form,
  update,
  isInvalid,
}: {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  isInvalid: (field: string) => boolean;
}) {
  const { t } = useT();
  const hint = t("q.validation.required");
  return (
    <div className="space-y-6">
      <SectionHeading
        title={t("q.section.ethics.title")}
        hint={t("q.section.ethics.hint")}
      />
      <LikertScale
        question={t("q.ethicalConcernLevel")}
        questionId="ethicalConcernLevel"
        value={form.ethicalConcernLevel}
        onChange={(v) => update("ethicalConcernLevel", v)}
        lowLabel={t("q.anchor.noneAtAll")}
        midLabel={t("q.anchor.neutral")}
        highLabel={t("q.anchor.deeplyConcerned")}
        invalid={isInvalid("ethicalConcernLevel")}
        requiredHint={hint}
      />
      <MultiChoice
        question={t("q.ethicalConcernsPrompt")}
        helper={t("q.multi.helper")}
        options={ETHICAL_CONCERN_OPTIONS.map((o) => ({
          value: o.value,
          label: t(o.key),
        }))}
        value={form.ethicalConcerns}
        onChange={(v) => update("ethicalConcerns", v)}
      />
      <LikertScale
        question={t("q.impactOnHumanRelations")}
        questionId="impactOnHumanRelations"
        value={form.impactOnHumanRelations}
        onChange={(v) => update("impactOnHumanRelations", v)}
        lowLabel={t("q.anchor.veryNegative")}
        midLabel={t("q.anchor.neutral")}
        highLabel={t("q.anchor.veryPositive")}
        invalid={isInvalid("impactOnHumanRelations")}
        requiredHint={hint}
      />
      <LikertScale
        question={t("q.socialAcceptance")}
        questionId="socialAcceptancePrediction"
        value={form.socialAcceptancePrediction}
        onChange={(v) => update("socialAcceptancePrediction", v)}
        lowLabel={t("q.anchor.fringe")}
        midLabel={t("q.anchor.neutral")}
        highLabel={t("q.anchor.mainstream")}
        invalid={isInvalid("socialAcceptancePrediction")}
        requiredHint={hint}
      />
      <LikertScale
        question={t("q.conceptFeasibility")}
        questionId="conceptFeasibility"
        value={form.conceptFeasibility}
        onChange={(v) => update("conceptFeasibility", v)}
        lowLabel={t("q.anchor.fantasy")}
        midLabel={t("q.anchor.neutral")}
        highLabel={t("q.anchor.veryLikely")}
        invalid={isInvalid("conceptFeasibility")}
        requiredHint={hint}
      />
      <LikertScale
        question={t("q.replacementWillingness")}
        questionId="replacementWillingness"
        value={form.replacementWillingness}
        onChange={(v) => update("replacementWillingness", v)}
        lowLabel={t("q.anchor.never")}
        midLabel={t("q.anchor.neutral")}
        highLabel={t("q.anchor.absolutely")}
        invalid={isInvalid("replacementWillingness")}
        requiredHint={hint}
      />
    </div>
  );
}

function SectionMarket({
  form,
  update,
  isInvalid,
}: {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  isInvalid: (field: string) => boolean;
}) {
  const { t } = useT();
  const hint = t("q.validation.required");
  return (
    <div className="space-y-6">
      <SectionHeading
        title={t("q.section.market.title")}
        hint={t("q.section.market.hint")}
      />
      <LikertScale
        question={t("q.purchaseIntent")}
        questionId="purchaseIntent"
        value={form.purchaseIntent}
        onChange={(v) => update("purchaseIntent", v)}
        lowLabel={t("q.anchor.definitelyNot")}
        midLabel={t("q.anchor.neutral")}
        highLabel={t("q.anchor.definitelyYes")}
        invalid={isInvalid("purchaseIntent")}
        requiredHint={hint}
      />
      <SingleChoice
        question={t("q.priceRangePrompt")}
        options={PRICE_RANGE_OPTIONS.map((o) => ({
          value: o.value,
          label: t(o.key),
        }))}
        value={form.expectedPriceRange}
        onChange={(v) => update("expectedPriceRange", v)}
        invalid={isInvalid("expectedPriceRange")}
        requiredHint={hint}
      />
      <SingleChoice
        question={t("q.pricingModelPrompt")}
        options={PRICING_MODEL_OPTIONS.map((o) => ({
          value: o.value,
          label: t(o.key),
        }))}
        value={form.preferredPricingModel}
        onChange={(v) => update("preferredPricingModel", v)}
        invalid={isInvalid("preferredPricingModel")}
        requiredHint={hint}
      />
      <LikertScale
        question={t("q.premiumWillingness")}
        questionId="willingnessToPayPremium"
        value={form.willingnessToPayPremium}
        onChange={(v) => update("willingnessToPayPremium", v)}
        lowLabel={t("q.anchor.notWilling")}
        midLabel={t("q.anchor.neutral")}
        highLabel={t("q.anchor.veryWilling")}
        invalid={isInvalid("willingnessToPayPremium")}
        requiredHint={hint}
      />
      <MultiChoice
        question={t("q.useCasePrompt")}
        helper={t("q.multi.helper")}
        options={USE_CASE_OPTIONS.map((o) => ({
          value: o.value,
          label: t(o.key),
        }))}
        value={form.primaryUseCase}
        onChange={(v) => update("primaryUseCase", v)}
        invalid={isInvalid("primaryUseCase")}
        requiredHint={hint}
      />
      <MultiChoice
        question={t("q.demographicPrompt")}
        helper={t("q.multi.helper")}
        options={DEMOGRAPHIC_OPTIONS.map((o) => ({
          value: o.value,
          label: t(o.key),
        }))}
        value={form.targetDemographic}
        onChange={(v) => update("targetDemographic", v)}
        invalid={isInvalid("targetDemographic")}
        requiredHint={hint}
      />
    </div>
  );
}

function SectionEmotional({
  form,
  update,
  inputClass,
  isInvalid,
}: {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  inputClass: string;
  isInvalid: (field: string) => boolean;
}) {
  const { t } = useT();
  const hint = t("q.validation.required");
  return (
    <div className="space-y-6">
      <SectionHeading
        title={t("q.section.emotional.title")}
        hint={t("q.section.emotional.hint")}
      />
      <LikertScale
        question={t("q.emotionalConnection")}
        questionId="emotionalConnection"
        value={form.emotionalConnection}
        onChange={(v) => update("emotionalConnection", v)}
        lowLabel={t("q.anchor.none")}
        midLabel={t("q.anchor.neutral")}
        highLabel={t("q.anchor.profound")}
        invalid={isInvalid("emotionalConnection")}
        requiredHint={hint}
      />
      <LikertScale
        question={t("q.feltJudgedOrSafe")}
        questionId="feltJudgedOrSafe"
        value={form.feltJudgedOrSafe}
        onChange={(v) => update("feltJudgedOrSafe", v)}
        lowLabel={t("q.anchor.judged")}
        midLabel={t("q.anchor.neutral")}
        highLabel={t("q.anchor.safe")}
        invalid={isInvalid("feltJudgedOrSafe")}
        requiredHint={hint}
      />
      <LikertScale
        question={t("q.wouldMissCompanion")}
        questionId="wouldMissCompanion"
        value={form.wouldMissCompanion}
        onChange={(v) => update("wouldMissCompanion", v)}
        lowLabel={t("q.anchor.notAtAll")}
        midLabel={t("q.anchor.neutral")}
        highLabel={t("q.anchor.deeply")}
        invalid={isInvalid("wouldMissCompanion")}
        requiredHint={hint}
      />
      <LikertScale
        question={t("q.lonelinessAssist")}
        questionId="lonelinessAssist"
        value={form.lonelinessAssist}
        onChange={(v) => update("lonelinessAssist", v)}
        lowLabel={t("q.anchor.stronglyDisagree")}
        midLabel={t("q.anchor.neutral")}
        highLabel={t("q.anchor.stronglyAgree")}
        invalid={isInvalid("lonelinessAssist")}
        requiredHint={hint}
      />
      <LikertScale
        question={t("q.overallExperience")}
        questionId="overallExperience"
        value={form.overallExperience}
        onChange={(v) => update("overallExperience", v)}
        lowLabel={t("q.anchor.veryBad")}
        midLabel={t("q.anchor.neutral")}
        highLabel={t("q.anchor.veryGood")}
        invalid={isInvalid("overallExperience")}
        requiredHint={hint}
      />
      <LikertScale
        question={t("q.uiEaseOfUse")}
        questionId="uiEaseOfUse"
        value={form.uiEaseOfUse}
        onChange={(v) => update("uiEaseOfUse", v)}
        lowLabel={t("q.anchor.veryHard")}
        midLabel={t("q.anchor.neutral")}
        highLabel={t("q.anchor.veryEasy")}
        invalid={isInvalid("uiEaseOfUse")}
        requiredHint={hint}
      />
      <LikertScale
        question={t("q.exhibitionQuality")}
        questionId="exhibitionQuality"
        value={form.exhibitionQuality}
        onChange={(v) => update("exhibitionQuality", v)}
        lowLabel={t("q.anchor.veryBad")}
        midLabel={t("q.anchor.neutral")}
        highLabel={t("q.anchor.veryGood")}
        invalid={isInvalid("exhibitionQuality")}
        requiredHint={hint}
      />
      <LikertScale
        question={t("q.willRecommend")}
        questionId="willRecommend"
        value={form.willRecommend}
        onChange={(v) => update("willRecommend", v)}
        lowLabel={t("q.anchor.definitelyNot")}
        midLabel={t("q.anchor.neutral")}
        highLabel={t("q.anchor.definitelyYes")}
        invalid={isInvalid("willRecommend")}
        requiredHint={hint}
      />
      <NPSScale
        question={t("q.nps")}
        value={form.npsScore < 0 ? null : form.npsScore}
        onChange={(v) => update("npsScore", v)}
        lowLabel={t("q.anchor.npsLow")}
        highLabel={t("q.anchor.npsHigh")}
        invalid={isInvalid("npsScore")}
        requiredHint={hint}
      />
      <div className="space-y-2">
        <p className="text-sm text-text-primary">
          {t("q.memorableMoment")}
        </p>
        <textarea
          className={`${inputClass} min-h-[80px] resize-y`}
          placeholder={t("q.memorableMoment.placeholder")}
          value={form.mostMemorableMoment}
          onChange={(e) => update("mostMemorableMoment", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-text-primary">{t("q.biggestConcern")}</p>
        <textarea
          className={`${inputClass} min-h-[80px] resize-y`}
          placeholder={t("q.biggestConcern.placeholder")}
          value={form.biggestConcern}
          onChange={(e) => update("biggestConcern", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-text-primary">
          {t("q.improvementSuggestion")}
        </p>
        <textarea
          className={`${inputClass} min-h-[80px] resize-y`}
          placeholder={t("q.improvementSuggestion.placeholder")}
          value={form.improvementSuggestion}
          onChange={(e) => update("improvementSuggestion", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <p className="text-sm text-text-primary">
          {t("q.feedback.prompt")}
        </p>
        <textarea
          className={`${inputClass} min-h-[100px] resize-y`}
          placeholder={t("q.feedback.placeholder")}
          value={form.additionalFeedback}
          onChange={(e) => update("additionalFeedback", e.target.value)}
        />
      </div>
    </div>
  );
}

function SectionHeading({ title, hint }: { title: string; hint: string }) {
  return (
    <div>
      <h2 className="font-display text-lg text-text-primary mb-1">{title}</h2>
      <p className="text-sm text-text-secondary">{hint}</p>
    </div>
  );
}

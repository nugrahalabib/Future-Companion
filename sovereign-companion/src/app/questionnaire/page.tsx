"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Background from "@/components/layout/Background";
import GlassPanel from "@/components/ui/GlassPanel";
import GlassButton from "@/components/ui/GlassButton";
import DynamicSection, { type ResponseValue } from "@/components/questionnaire/DynamicSection";
import EmailLookup, { type ResolvedUser } from "@/components/questionnaire/EmailLookup";
import { useUserStore } from "@/stores/useUserStore";
import { useSessionStore } from "@/stores/useSessionStore";
import { useT } from "@/lib/i18n/useT";
import { useHydrated } from "@/lib/useHydrated";
import { ageToRangeLabel, ageRangeById, AGE_RANGES } from "@/lib/ageRanges";
import {
  PROFESSIONS_2075,
  PROFESSION_SECTORS,
  PROFESSION_SECTOR_LABEL_KEY,
} from "@/lib/professions";
import {
  DEFAULT_TEMPLATE,
  type SurveyQuestion,
  type SurveyTemplateShape,
} from "@/lib/surveyTemplate";

// Wrap inner in Suspense per Next.js 16 App Router rules for useSearchParams.
export default function QuestionnairePage() {
  return (
    <Suspense fallback={null}>
      <QuestionnaireInner />
    </Suspense>
  );
}

function QuestionnaireInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeUserId = useUserStore((s) => s.userId);
  const hydrated = useHydrated();
  const setStage = useSessionStore((s) => s.setStage);
  const resetSession = useSessionStore((s) => s.reset);
  const { t } = useT();

  // Three entry modes coexist (see prior comments). bypassStageUpdate handles
  // the case where this submission is NOT part of the active booth session.
  const uidFromQuery = searchParams.get("uid");
  const bypassStageUpdate = Boolean(uidFromQuery) || !storeUserId;

  // Template state
  const [template, setTemplate] = useState<SurveyTemplateShape>(DEFAULT_TEMPLATE);
  const [templateLoaded, setTemplateLoaded] = useState(false);

  const [identity, setIdentity] = useState<ResolvedUser | null>(null);
  const [emailInput, setEmailInput] = useState("");
  // Guest-mode form fields. Used when the visitor reaches the questionnaire
  // without a booth registration (no `?uid=`, no active store session, and
  // no email match in the lookup). On Lanjut the page POSTs /api/users
  // action=guest with these values to mint a fresh User row so the survey
  // submission can attach to it.
  const [guestNickname, setGuestNickname] = useState("");
  const [guestAge, setGuestAge] = useState(""); // age range id (e.g. "25-30")
  const [guestProfession, setGuestProfession] = useState("");
  const [responses, setResponses] = useState<Record<string, ResponseValue>>({});
  const [section, setSection] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Only render red highlights AFTER user attempts to leave a section with
  // missing answers. Resets on section change.
  const [showErrors, setShowErrors] = useState(false);

  const activeUserId = identity?.userId ?? uidFromQuery ?? storeUserId;
  // True when we're on a fresh /questionnaire visit without any prior
  // registration context. The identity card switches into editable form
  // mode in this case so the visitor can fill nickname/age/profession
  // themselves.
  const isGuestMode =
    !uidFromQuery && !storeUserId && !identity;

  // Load active template on mount
  useEffect(() => {
    let cancelled = false;
    fetch("/api/survey-template")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.template?.sections) {
          setTemplate(data.template);
        }
        setTemplateLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        // Fall back to bundled default; UI can still proceed.
        setTemplateLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setShowErrors(false);
  }, [section]);

  const setResponse = (id: string, value: ResponseValue) => {
    setResponses((prev) => ({ ...prev, [id]: value }));
  };

  const totalSections = 1 + template.sections.length; // +1 for identity

  // ---- Validation: per section, what's missing? ----
  function missingFieldsFor(sectionIndex: number): string[] {
    const miss: string[] = [];
    if (sectionIndex === 0) {
      // Already have a user from booth flow / URL handoff / resolved email.
      if (activeUserId) return miss;
      // Guest mode: email is OPTIONAL (server synthesises one if blank)
      // but if the visitor types something it must be a valid format.
      // Nickname / age / profession are all required so the dataset
      // stays usable for analytics.
      const e = emailInput.trim();
      if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) miss.push("identity");
      if (!guestNickname.trim()) miss.push("nickname");
      if (!guestAge) miss.push("age");
      if (!guestProfession) miss.push("profession");
      return miss;
    }
    const sec = template.sections[sectionIndex - 1];
    if (!sec) return miss;
    for (const q of sec.questions) {
      if (!q.required) continue;
      if (!isAnswered(q, responses[q.id])) miss.push(q.id);
    }
    return miss;
  }

  function isAnswered(q: SurveyQuestion, value: ResponseValue | undefined): boolean {
    if (value === undefined || value === null) return false;
    switch (q.type) {
      case "likert":
        return typeof value === "number" && value > 0;
      case "nps":
        return typeof value === "number" && value >= 0 && value <= 10;
      case "single":
      case "dropdown":
      case "text":
      case "longtext":
        return typeof value === "string" && value.trim().length > 0;
      case "multi":
        return Array.isArray(value) && value.length > 0;
    }
  }

  const currentMissing = missingFieldsFor(section);
  const canAdvance = () => currentMissing.length === 0;
  const isInvalid = (field: string) => showErrors && currentMissing.includes(field);

  async function handleNext() {
    if (!canAdvance()) {
      setShowErrors(true);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }
    // Leaving the identity section without a userId — mint a guest User
    // server-side using the form values, then continue. Mirrors the
    // /api/users register payload shape with `action: "guest"` so no
    // password is required.
    if (section === 0 && !activeUserId) {
      setLoading(true);
      setSubmitError(null);
      try {
        const range = ageRangeById(guestAge);
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "guest",
            email: emailInput.trim(),
            nickname: guestNickname.trim(),
            age: range?.min ?? 0,
            profession: guestProfession,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setSubmitError(data.error || t("q.identity.guestError"));
          return;
        }
        // Fold the guest record into the identity slot so activeUserId
        // resolves on subsequent renders and submit attaches correctly.
        setIdentity({
          userId: data.userId,
          fullName: "",
          nickname: guestNickname.trim(),
          email: data.email || emailInput.trim(),
          age: range?.min ?? 0,
          profession: guestProfession,
          companionName: "",
          userNicknames: [],
        });
        setSection((s) => s + 1);
      } catch {
        setSubmitError(t("q.submit.error"));
      } finally {
        setLoading(false);
      }
      return;
    }
    setSection((s) => s + 1);
  }

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
        body: JSON.stringify({ userId: activeUserId, responses }),
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

  void router; // referenced in submitted-state CTA below

  const shouldRender = useMemo(
    () => Boolean(uidFromQuery) || hydrated,
    [uidFromQuery, hydrated],
  );
  if (!shouldRender || !templateLoaded) return null;

  const inputClass =
    "w-full bg-obsidian-surface border border-glass-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-cyan-accent/40 transition-colors";

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
                {t("q.badge")} · {section + 1} / {totalSections}
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary mb-2">
                {t("q.heading")}
              </h1>
              <p className="text-sm text-text-secondary">{t("q.subheading")}</p>
              <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-glass-border">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: "linear-gradient(90deg, #00F0FF 0%, #39FF14 100%)",
                    boxShadow: "0 0 10px rgba(0,240,255,0.5)",
                  }}
                  animate={{ width: `${((section + 1) / totalSections) * 100}%` }}
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
                {section === 0 ? (
                  <SectionIdentity
                    emailInput={emailInput}
                    setEmailInput={setEmailInput}
                    identity={identity}
                    setIdentity={setIdentity}
                    hasActiveSession={Boolean(storeUserId) && !uidFromQuery}
                    activeUserId={activeUserId}
                    inputClass={inputClass}
                    isGuestMode={isGuestMode}
                    guestNickname={guestNickname}
                    setGuestNickname={setGuestNickname}
                    guestAge={guestAge}
                    setGuestAge={setGuestAge}
                    guestProfession={guestProfession}
                    setGuestProfession={setGuestProfession}
                    isFieldInvalid={(f) => isInvalid(f)}
                  />
                ) : (
                  <DynamicSection
                    section={template.sections[section - 1]}
                    responses={responses}
                    setResponse={setResponse}
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

              {section < totalSections - 1 ? (
                <GlassButton size="sm" onClick={handleNext} disabled={loading}>
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

// ---------- Section 0 — Identity (kept inline; not editable via builder) ----------

function SectionIdentity({
  emailInput,
  setEmailInput,
  identity,
  setIdentity,
  hasActiveSession,
  activeUserId,
  inputClass,
  isGuestMode,
  guestNickname,
  setGuestNickname,
  guestAge,
  setGuestAge,
  guestProfession,
  setGuestProfession,
  isFieldInvalid,
}: {
  emailInput: string;
  setEmailInput: (v: string) => void;
  identity: ResolvedUser | null;
  setIdentity: (u: ResolvedUser | null) => void;
  hasActiveSession: boolean;
  activeUserId: string | null;
  inputClass: string;
  isGuestMode: boolean;
  guestNickname: string;
  setGuestNickname: (v: string) => void;
  guestAge: string;
  setGuestAge: (v: string) => void;
  guestProfession: string;
  setGuestProfession: (v: string) => void;
  isFieldInvalid: (field: string) => boolean;
}) {
  const { t } = useT();
  const emailInvalid = isFieldInvalid("identity");
  const nicknameInvalid = isFieldInvalid("nickname");
  const ageInvalid = isFieldInvalid("age");
  const professionInvalid = isFieldInvalid("profession");

  // Field-level CSS helpers — re-used by all three editable inputs so the
  // red highlight styling stays in lockstep with the validation banner.
  const labelCls = (invalid: boolean) =>
    `font-display text-xs uppercase tracking-widest ${
      invalid ? "text-danger" : "text-text-muted"
    }`;
  const fieldCls = (invalid: boolean) =>
    `${inputClass} ${invalid ? "border-danger/60" : ""}`;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-lg text-text-primary mb-1">
          {t("q.identity.title")}
        </h2>
        <p className="text-sm text-text-secondary">
          {isGuestMode ? t("q.identity.helperGuest") : t("q.identity.helper")}
        </p>
      </div>

      <div
        className={`space-y-2 ${
          emailInvalid ? "rounded-xl border border-danger/60 bg-danger/5 p-4 -mx-1" : ""
        }`}
        style={emailInvalid ? { boxShadow: "0 0 14px rgba(255,90,90,0.18)" } : undefined}
      >
        <label className={labelCls(emailInvalid)}>
          {emailInvalid && <span aria-hidden>● </span>}
          {t("q.identity.emailLabel")}
          {isGuestMode && (
            <span className="ml-2 text-text-muted normal-case tracking-normal">
              ({t("common.optional")})
            </span>
          )}
        </label>
        <EmailLookup value={emailInput} onChange={setEmailInput} onResolve={setIdentity} />
        {emailInvalid && (
          <p className="text-[11px] text-danger font-display uppercase tracking-widest">
            {t("q.identity.emailInvalidFormat")}
          </p>
        )}
        {isGuestMode && !emailInvalid && (
          <p className="text-[11px] text-text-muted">
            {t("q.identity.emailHelperGuest")}
          </p>
        )}
      </div>

      {/* Guest-mode banner — surfaces the moment the visitor types an
          email that doesn't match a registered booth user, so they
          understand why the fields below switched to editable. */}
      {isGuestMode && emailInput.trim() && !emailInvalid && (
        <div className="rounded-xl border border-bio-green/40 bg-bio-green/[0.06] px-3.5 py-2.5">
          <p className="text-[12px] leading-relaxed text-bio-green/90">
            {t("q.identity.guestNote")}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Legacy fullName — only rendered for resolved respondents who
            registered before fullName was retired (2026-05-09). */}
        {identity?.fullName?.trim() && (
          <div className="space-y-2">
            <label className="font-display text-xs uppercase tracking-widest text-text-muted">
              {t("q.identity.nameLabel")}
            </label>
            <input
              type="text"
              readOnly
              value={identity.fullName}
              placeholder={t("q.identity.autofillHint")}
              className={`${inputClass} opacity-80`}
            />
          </div>
        )}

        {/* Nickname */}
        <div className="space-y-2">
          <label className={labelCls(nicknameInvalid)}>
            {nicknameInvalid && <span aria-hidden>● </span>}
            {t("q.identity.nicknameLabel")}
          </label>
          {isGuestMode ? (
            <input
              type="text"
              value={guestNickname}
              onChange={(e) => setGuestNickname(e.target.value)}
              placeholder={t("q.identity.nicknamePlaceholder")}
              className={fieldCls(nicknameInvalid)}
              maxLength={40}
            />
          ) : (
            <input
              type="text"
              readOnly
              value={identity?.nickname ?? ""}
              placeholder={t("q.identity.autofillHint")}
              className={`${inputClass} opacity-80`}
            />
          )}
        </div>

        {/* Age range */}
        <div className="space-y-2">
          <label className={labelCls(ageInvalid)}>
            {ageInvalid && <span aria-hidden>● </span>}
            {t("q.identity.ageLabel")}
          </label>
          {isGuestMode ? (
            <select
              value={guestAge}
              onChange={(e) => setGuestAge(e.target.value)}
              className={`${fieldCls(ageInvalid)} cursor-pointer`}
            >
              <option value="" disabled>
                {t("q.identity.agePlaceholder")}
              </option>
              {AGE_RANGES.map((r) => (
                <option key={r.id} value={r.id} className="bg-obsidian-surface">
                  {r.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              readOnly
              value={identity?.age ? ageToRangeLabel(identity.age) : ""}
              placeholder={t("q.identity.autofillHint")}
              className={`${inputClass} opacity-80`}
            />
          )}
        </div>

        {/* Profession */}
        <div className="space-y-2 sm:col-span-2">
          <label className={labelCls(professionInvalid)}>
            {professionInvalid && <span aria-hidden>● </span>}
            {t("q.identity.professionLabel")}
          </label>
          {isGuestMode ? (
            <select
              value={guestProfession}
              onChange={(e) => setGuestProfession(e.target.value)}
              className={`${fieldCls(professionInvalid)} cursor-pointer`}
            >
              <option value="" disabled>
                {t("q.identity.professionPlaceholder")}
              </option>
              {PROFESSION_SECTORS.map((sector) => {
                const items = PROFESSIONS_2075.filter((p) => p.sector === sector);
                if (items.length === 0) return null;
                return (
                  <optgroup
                    key={sector}
                    label={t(PROFESSION_SECTOR_LABEL_KEY[sector])}
                  >
                    {items.map((p) => (
                      <option key={p.value} value={p.value} className="bg-obsidian-surface">
                        {t(p.labelKey)}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          ) : (
            <input
              type="text"
              readOnly
              value={identity?.profession ?? ""}
              placeholder={t("q.identity.autofillHint")}
              className={`${inputClass} opacity-80`}
            />
          )}
        </div>
      </div>

      {!activeUserId && !isGuestMode && (
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

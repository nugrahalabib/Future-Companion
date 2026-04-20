"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Background from "@/components/layout/Background";
import GlassPanel from "@/components/ui/GlassPanel";
import GlassButton from "@/components/ui/GlassButton";
import DemoPausedScreen from "@/components/ui/DemoPausedScreen";
import { useDemoStatus } from "@/lib/useDemoStatus";
import { useUserStore } from "@/stores/useUserStore";
import { useSessionStore } from "@/stores/useSessionStore";
import { useCompanionStore, type UserGender } from "@/stores/useCompanionStore";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { useT } from "@/lib/i18n/useT";
import { PROFESSION_SUGGESTIONS } from "@/lib/professions";
import {
  NICKNAME_GROUPS,
  COMPANION_NAME_SAMPLES,
  GROUP_LABEL_KEY,
} from "@/lib/bondPresets";

const MAX_NICKNAMES = 3;

const relationshipOptions: { value: string; key: string }[] = [
  { value: "Single", key: "register.status.single" },
  { value: "Complicated", key: "register.status.complicated" },
  { value: "Married", key: "register.status.married" },
  { value: "Opting Out of Human Dating", key: "register.status.optOut" },
];

const stageRoutes: Record<number, string> = {
  2: "/register",
  3: "/creator",
  4: "/assembly",
  5: "/encounter",
  6: "/checkout",
  7: "/farewell",
  8: "/encounter",
};

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useUserStore((s) => s.setUser);
  const setSessionId = useSessionStore((s) => s.setSessionId);
  const setStage = useSessionStore((s) => s.setStage);
  const locale = useLocaleStore((s) => s.locale);
  const { t } = useT();

  const [tab, setTab] = useState<"new" | "resume">("new");
  const [phase, setPhase] = useState<"identity" | "bond">("identity");
  const [form, setForm] = useState({
    fullName: "",
    nickname: "",
    email: "",
    password: "",
    age: "",
    profession: "",
    relationshipStatus: "",
    userGender: "" as UserGender,
    userNicknames: [] as string[],
    customNickname: "",
    companionName: "",
  });

  const addNickname = (raw: string) => {
    const candidate = raw.trim();
    if (!candidate) return;
    setForm((prev) => {
      if (prev.userNicknames.length >= MAX_NICKNAMES) return prev;
      const exists = prev.userNicknames.some(
        (n) => n.toLowerCase() === candidate.toLowerCase(),
      );
      if (exists) return prev;
      return { ...prev, userNicknames: [...prev.userNicknames, candidate] };
    });
  };

  const removeNickname = (name: string) => {
    setForm((prev) => ({
      ...prev,
      userNicknames: prev.userNicknames.filter((n) => n !== name),
    }));
  };

  const toggleNickname = (chip: string) => {
    setForm((prev) => {
      const exists = prev.userNicknames.some(
        (n) => n.toLowerCase() === chip.toLowerCase(),
      );
      if (exists) {
        return {
          ...prev,
          userNicknames: prev.userNicknames.filter(
            (n) => n.toLowerCase() !== chip.toLowerCase(),
          ),
        };
      }
      if (prev.userNicknames.length >= MAX_NICKNAMES) return prev;
      return { ...prev, userNicknames: [...prev.userNicknames, chip] };
    });
  };

  const nicknameGroups = useMemo(
    () =>
      form.userGender
        ? NICKNAME_GROUPS[locale][form.userGender]
        : null,
    [locale, form.userGender],
  );
  const companionSamples = useMemo(() => COMPANION_NAME_SAMPLES[locale], [locale]);
  const [showPassword, setShowPassword] = useState(false);
  const [resume, setResume] = useState({ email: "", password: "" });
  const [showResumePassword, setShowResumePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validateIdentity = (): string | null => {
    const trimmed = {
      fullName: form.fullName.trim(),
      nickname: form.nickname.trim(),
      email: form.email.trim(),
      age: form.age.trim(),
      profession: form.profession.trim(),
      relationshipStatus: form.relationshipStatus,
    };

    if (
      !trimmed.fullName ||
      !trimmed.nickname ||
      !trimmed.email ||
      !form.password ||
      !trimmed.age ||
      !trimmed.profession ||
      !trimmed.relationshipStatus
    ) {
      return t("register.error.required");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed.email)) {
      return t("register.error.emailInvalid");
    }

    const ageNum = Number(trimmed.age);
    if (!Number.isFinite(ageNum) || ageNum < 18 || ageNum > 100) {
      return t("register.error.ageInvalid");
    }

    if (form.password.length < 6) {
      return t("register.error.passwordShort");
    }

    return null;
  };

  const handleContinue = () => {
    setError("");
    const err = validateIdentity();
    if (err) {
      setError(err);
      return;
    }
    setPhase("bond");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const identityErr = validateIdentity();
    if (identityErr) {
      setError(identityErr);
      setPhase("identity");
      return;
    }

    const trimmed = {
      fullName: form.fullName.trim(),
      nickname: form.nickname.trim(),
      email: form.email.trim(),
      password: form.password,
      age: Number(form.age.trim()),
      profession: form.profession.trim(),
      relationshipStatus: form.relationshipStatus,
      userGender: form.userGender,
      userNicknames: form.userNicknames.map((n) => n.trim()).filter((n) => n.length > 0),
      companionName: form.companionName.trim(),
    };

    if (!trimmed.userGender) {
      setError(t("register.error.genderRequired"));
      return;
    }

    if (trimmed.userNicknames.length === 0 || !trimmed.companionName) {
      setError(t("register.error.bondRequired"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: trimmed.fullName,
          nickname: trimmed.nickname,
          email: trimmed.email,
          password: trimmed.password,
          age: trimmed.age,
          profession: trimmed.profession,
          relationshipStatus: trimmed.relationshipStatus,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) setError(t("register.error.emailTaken"));
        else setError(data.error || t("register.error.network"));
        return;
      }

      setUser({
        userId: data.userId,
        fullName: trimmed.fullName,
        nickname: trimmed.nickname,
        email: trimmed.email,
        age: trimmed.age,
        profession: trimmed.profession,
        relationshipStatus: trimmed.relationshipStatus,
      });
      setSessionId(data.sessionId);

      // Seed the companion store with the bond contract BEFORE reset would wipe it,
      // so the creator studio opens already knowing how the AI should address the user.
      const companion = useCompanionStore.getState();
      companion.reset();
      companion.setUserNicknames(trimmed.userNicknames);
      companion.setCompanionName(trimmed.companionName);
      companion.setUserGender(trimmed.userGender);
      companion.setIntroCompleted(true);

      // Persist the bond to CompanionConfig immediately so a mid-booth refresh
      // doesn't lose the user's chosen pet-names and companion name.
      try {
        await fetch("/api/companion-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: data.userId,
            userNicknames: trimmed.userNicknames,
            companionName: trimmed.companionName,
            userGender: trimmed.userGender,
          }),
        });
      } catch {
        // Non-fatal — auto-save in creator will retry.
      }

      setStage(3);
      router.push("/creator");
    } catch {
      setError(t("register.error.network"));
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const email = resume.email.trim();
    const password = resume.password;

    if (!email || !password) {
      setError(t("register.error.resumeRequired"));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t("register.error.emailInvalid"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resume", email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 404) setError(t("register.error.notFound"));
        else if (res.status === 401) setError(t("register.error.invalidCredentials"));
        else setError(data.error || t("register.error.network"));
        return;
      }

      setUser({
        userId: data.userId,
        fullName: data.fullName,
        nickname: data.nickname || "",
        email: data.email,
        age: data.age,
        profession: data.profession,
        relationshipStatus: data.relationshipStatus,
      });
      if (data.sessionId) setSessionId(data.sessionId);

      const nextStage = data.resumeStage ?? 3;
      setStage(nextStage);
      router.push(stageRoutes[nextStage] ?? "/creator");
    } catch {
      setError(t("register.error.network"));
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-obsidian-surface border border-glass-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-cyan-accent/40 focus:ring-1 focus:ring-cyan-accent/20 transition-colors";

  const labelClass = "block text-xs text-text-secondary mb-1.5 uppercase tracking-wider";

  const { status: demoStatus } = useDemoStatus();

  if (demoStatus && !demoStatus.active) {
    return (
      <main className="relative flex-1 overflow-hidden">
        <Background />
        <DemoPausedScreen
          reason={demoStatus.reason === "ok" ? null : demoStatus.reason}
          message={demoStatus.message}
          schedule={demoStatus.schedule}
        />
      </main>
    );
  }

  return (
    <main className="relative flex-1 overflow-hidden">
      <Background />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12 gap-4">
        <GlassPanel
          variant="elevated"
          className="w-full max-w-lg p-8"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="font-display text-2xl font-bold text-text-primary mb-1">
              {t("register.heading")}
            </h1>
            <p className="text-sm text-text-secondary mb-5">
              {t("register.subheading")}
            </p>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-obsidian-surface rounded-xl p-1">
              <button
                type="button"
                className={`flex-1 py-2 rounded-lg text-sm font-display font-medium transition-colors cursor-pointer ${
                  tab === "new"
                    ? "bg-cyan-accent/20 text-cyan-accent"
                    : "text-text-muted hover:text-text-secondary"
                }`}
                onClick={() => { setTab("new"); setError(""); }}
              >
                {t("register.tab.new")}
              </button>
              <button
                type="button"
                className={`flex-1 py-2 rounded-lg text-sm font-display font-medium transition-colors cursor-pointer ${
                  tab === "resume"
                    ? "bg-cyan-accent/20 text-cyan-accent"
                    : "text-text-muted hover:text-text-secondary"
                }`}
                onClick={() => { setTab("resume"); setError(""); }}
              >
                {t("register.tab.resume")}
              </button>
            </div>

            {tab === "new" ? (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
                {/* Phase indicator */}
                <div className="flex items-center gap-2">
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-cyan-accent/30" />
                  <span className="font-display text-[10px] uppercase tracking-[0.28em] text-cyan-accent/80">
                    {phase === "identity"
                      ? t("register.phase.step1of2")
                      : t("register.phase.step2of2")}
                  </span>
                  <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-cyan-accent/30" />
                </div>

                <AnimatePresence mode="wait">
                  {phase === "identity" ? (
                    <motion.div
                      key="identity"
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>
                            {t("register.field.fullName")} <span className="text-cyan-accent">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            minLength={2}
                            autoComplete="name"
                            className={inputClass}
                            placeholder={t("register.field.fullName.placeholder")}
                            value={form.fullName}
                            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>
                            {t("register.field.nickname")} <span className="text-cyan-accent">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            minLength={1}
                            autoComplete="nickname"
                            className={inputClass}
                            placeholder={t("register.field.nickname.placeholder")}
                            value={form.nickname}
                            onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={labelClass}>
                          {t("register.field.email")} <span className="text-cyan-accent">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          autoComplete="email"
                          className={inputClass}
                          placeholder={t("register.field.email.placeholder")}
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>
                          {t("register.field.password")} <span className="text-cyan-accent">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            required
                            minLength={6}
                            autoComplete="new-password"
                            className={`${inputClass} pr-16`}
                            placeholder={t("register.field.password.placeholder")}
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((s) => !s)}
                            className="absolute inset-y-0 right-0 px-3 text-[10px] font-display uppercase tracking-widest text-text-muted hover:text-cyan-accent transition-colors cursor-pointer"
                          >
                            {showPassword ? t("register.password.hide") : t("register.password.show")}
                          </button>
                        </div>
                        <p className="mt-1 text-[10px] text-text-muted">
                          {t("register.field.password.hint")}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>
                            {t("register.field.age")} <span className="text-cyan-accent">*</span>
                          </label>
                          <input
                            type="number"
                            required
                            min={18}
                            max={100}
                            className={inputClass}
                            placeholder={t("register.field.age.placeholder")}
                            value={form.age}
                            onChange={(e) => setForm({ ...form, age: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>
                            {t("register.field.profession")} <span className="text-cyan-accent">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            minLength={2}
                            list="profession-suggestions"
                            autoComplete="organization-title"
                            className={inputClass}
                            placeholder={t("register.field.profession.placeholder")}
                            value={form.profession}
                            onChange={(e) => setForm({ ...form, profession: e.target.value })}
                          />
                          <datalist id="profession-suggestions">
                            {PROFESSION_SUGGESTIONS.map((p) => (
                              <option key={p} value={p} />
                            ))}
                          </datalist>
                        </div>
                      </div>

                      <div>
                        <label className={labelClass}>
                          {t("register.field.relationship")} <span className="text-cyan-accent">*</span>
                        </label>
                        <select
                          required
                          className={`${inputClass} cursor-pointer`}
                          value={form.relationshipStatus}
                          onChange={(e) => setForm({ ...form, relationshipStatus: e.target.value })}
                        >
                          <option value="" disabled>
                            {t("register.field.relationship.placeholder")}
                          </option>
                          {relationshipOptions.map((opt) => (
                            <option key={opt.value} value={opt.value} className="bg-obsidian-surface">
                              {t(opt.key)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {error && <p className="text-sm text-danger">{error}</p>}

                      <GlassButton
                        type="button"
                        className="w-full mt-2"
                        onClick={handleContinue}
                        disabled={loading}
                      >
                        {t("register.phase.continue")}
                      </GlassButton>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="bond"
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 16 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-[6px] w-[6px] rounded-full"
                          style={{ backgroundColor: "#00F0FF", boxShadow: "0 0 8px #00F0FF" }}
                        />
                        <span className="font-display text-[10px] uppercase tracking-[0.32em] text-cyan-accent/80">
                          {t("register.bond.sectionLabel")}
                        </span>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-cyan-accent/30 to-transparent" />
                      </div>

                      <div>
                        <h3 className="font-display text-sm font-semibold text-text-primary">
                          {t("register.bond.heading")}
                        </h3>
                        <p className="mt-0.5 text-[11.5px] text-text-secondary leading-relaxed">
                          {t("register.bond.subtitle")}
                        </p>
                      </div>

                      {/* User gender */}
                      <div>
                        <label className={labelClass}>
                          {t("register.bond.userGender.label")} <span className="text-cyan-accent">*</span>
                        </label>
                        <p className="mb-1.5 text-[10.5px] italic text-text-muted">
                          {t("register.bond.userGender.hint")}
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {(["female", "male", "nonbinary"] as const).map((g) => {
                            const active = form.userGender === g;
                            return (
                              <button
                                key={g}
                                type="button"
                                onClick={() => setForm({ ...form, userGender: g, userNicknames: [] })}
                                className={`rounded-xl border px-3 py-2 text-[12px] font-display transition-colors cursor-pointer ${
                                  active
                                    ? "border-cyan-accent text-cyan-accent bg-cyan-accent/10"
                                    : "border-glass-border text-text-secondary hover:border-cyan-accent/40 hover:text-text-primary bg-obsidian-surface"
                                }`}
                                style={active ? { boxShadow: "0 0 10px rgba(0,240,255,0.25)" } : undefined}
                              >
                                {t(`register.bond.userGender.${g}`)}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* User nicknames — multi-select up to 3 */}
                      <div>
                        <label className={labelClass}>
                          {t("register.bond.userNickname.label")} <span className="text-cyan-accent">*</span>
                        </label>
                        <p className="mb-2 text-[10.5px] italic text-text-muted">
                          {t("register.bond.userNickname.hint")}
                        </p>

                        {/* Selected counter + removable tags */}
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="font-display text-[9px] uppercase tracking-[0.28em] text-text-muted">
                            {t("register.bond.userNickname.selected").replace(
                              "{count}",
                              String(form.userNicknames.length),
                            )}
                          </span>
                          {form.userNicknames.length >= MAX_NICKNAMES && (
                            <span className="text-[9.5px] italic text-cyan-accent/80">
                              {t("register.bond.userNickname.maxReached")}
                            </span>
                          )}
                        </div>
                        {form.userNicknames.length > 0 && (
                          <div className="mb-2.5 flex flex-wrap gap-1.5">
                            {form.userNicknames.map((n) => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => removeNickname(n)}
                                className="group flex items-center gap-1.5 rounded-full border border-cyan-accent/60 bg-cyan-accent/15 px-2.5 py-1 text-[12px] text-cyan-accent transition-colors cursor-pointer hover:border-danger hover:text-danger hover:bg-danger/10"
                                style={{ boxShadow: "0 0 10px rgba(0,240,255,0.25)" }}
                                title="Remove"
                              >
                                <span>{n}</span>
                                <span className="text-[10px] opacity-70 group-hover:opacity-100">✕</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {nicknameGroups ? (
                          <div className="space-y-2.5">
                            {nicknameGroups.map((group) => (
                              <div key={group.id}>
                                <div className="mb-1 font-display text-[9px] uppercase tracking-[0.28em] text-text-muted">
                                  {t(GROUP_LABEL_KEY[group.id])}
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {group.chips.map((chip) => {
                                    const active = form.userNicknames.some(
                                      (n) => n.toLowerCase() === chip.toLowerCase(),
                                    );
                                    const atMax =
                                      !active && form.userNicknames.length >= MAX_NICKNAMES;
                                    return (
                                      <button
                                        key={chip}
                                        type="button"
                                        disabled={atMax}
                                        onClick={() => toggleNickname(chip)}
                                        className={`rounded-full border px-3 py-1 text-[12px] transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
                                          active
                                            ? "border-cyan-accent text-cyan-accent bg-cyan-accent/10"
                                            : "border-glass-border text-text-secondary hover:border-cyan-accent/40 hover:text-text-primary bg-obsidian-surface"
                                        }`}
                                        style={
                                          active
                                            ? { boxShadow: "0 0 10px rgba(0,240,255,0.3)" }
                                            : undefined
                                        }
                                      >
                                        {chip}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="rounded-xl border border-dashed border-glass-border bg-obsidian-surface/60 px-3 py-2.5 text-[11.5px] text-text-muted italic">
                            {t("register.bond.userNickname.pickFirst")}
                          </p>
                        )}

                        <input
                          type="text"
                          maxLength={40}
                          className={`${inputClass} mt-2.5`}
                          placeholder={t("register.bond.userNickname.placeholder")}
                          value={form.customNickname}
                          onChange={(e) => setForm({ ...form, customNickname: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addNickname(form.customNickname);
                              setForm((prev) => ({ ...prev, customNickname: "" }));
                            }
                          }}
                          disabled={form.userNicknames.length >= MAX_NICKNAMES}
                        />

                        {/* Combined preview — Pet + user's own nickname */}
                        {form.userNicknames.length > 0 && form.nickname.trim() && (
                          <div className="mt-3 rounded-xl border border-bio-green/30 bg-bio-green/[0.06] px-3 py-2.5">
                            <div className="font-display text-[9px] uppercase tracking-[0.28em] text-bio-green/80">
                              {t("register.bond.userNickname.combinedPreview")}
                            </div>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {form.userNicknames.map((pet) => {
                                const cap = pet.charAt(0).toUpperCase() + pet.slice(1);
                                return (
                                  <span
                                    key={pet}
                                    className="rounded-full border border-bio-green/40 bg-bio-green/10 px-2.5 py-0.5 text-[11.5px] text-bio-green"
                                  >
                                    {cap} {form.nickname.trim()}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Companion name (what user calls the AI) */}
                      <div>
                        <label className={labelClass}>
                          {t("register.bond.companionName.label")} <span className="text-cyan-accent">*</span>
                        </label>
                        <p className="mb-2 text-[10.5px] italic text-text-muted">
                          {t("register.bond.companionName.hint")}
                        </p>

                        <div className="mb-1 font-display text-[9px] uppercase tracking-[0.28em] text-text-muted">
                          {t("register.bond.companionName.sampleLabel")}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {companionSamples.map((sample) => {
                            const active =
                              form.companionName.trim().toLowerCase() === sample.toLowerCase();
                            return (
                              <button
                                key={sample}
                                type="button"
                                onClick={() => setForm({ ...form, companionName: sample })}
                                className={`rounded-full border px-3 py-1 text-[12px] transition-colors cursor-pointer ${
                                  active
                                    ? "border-bio-green text-bio-green bg-bio-green/10"
                                    : "border-glass-border text-text-secondary hover:border-bio-green/40 hover:text-text-primary bg-obsidian-surface"
                                }`}
                                style={
                                  active
                                    ? { boxShadow: "0 0 10px rgba(57,255,20,0.3)" }
                                    : undefined
                                }
                              >
                                {sample}
                              </button>
                            );
                          })}
                        </div>

                        <input
                          type="text"
                          maxLength={40}
                          className={`${inputClass} mt-2.5`}
                          placeholder={t("register.bond.companionName.placeholder")}
                          value={form.companionName}
                          onChange={(e) => setForm({ ...form, companionName: e.target.value })}
                        />
                      </div>

                      {error && <p className="text-sm text-danger">{error}</p>}

                      <div className="flex gap-2 pt-1">
                        <GlassButton
                          type="button"
                          variant="secondary"
                          className="flex-1"
                          onClick={() => {
                            setError("");
                            setPhase("identity");
                          }}
                          disabled={loading}
                        >
                          {t("register.phase.back")}
                        </GlassButton>
                        <GlassButton type="submit" className="flex-1" disabled={loading}>
                          {loading ? t("register.submit.loading") : t("register.submit")}
                        </GlassButton>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            ) : (
              <form onSubmit={handleResume} className="space-y-4">
                <p className="text-xs text-text-muted">
                  {t("register.resumeSubtitle")}
                </p>
                <div>
                  <label className={labelClass}>
                    {t("register.field.email")} <span className="text-cyan-accent">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    className={inputClass}
                    placeholder={t("register.field.email.placeholder")}
                    value={resume.email}
                    onChange={(e) => setResume({ ...resume, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    {t("register.field.password")} <span className="text-cyan-accent">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showResumePassword ? "text" : "password"}
                      required
                      minLength={1}
                      autoComplete="current-password"
                      className={`${inputClass} pr-16`}
                      placeholder={t("register.field.password.placeholder")}
                      value={resume.password}
                      onChange={(e) => setResume({ ...resume, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowResumePassword((s) => !s)}
                      className="absolute inset-y-0 right-0 px-3 text-[10px] font-display uppercase tracking-widest text-text-muted hover:text-cyan-accent transition-colors cursor-pointer"
                    >
                      {showResumePassword ? t("register.password.hide") : t("register.password.show")}
                    </button>
                  </div>
                </div>

                {error && <p className="text-sm text-danger">{error}</p>}

                <GlassButton type="submit" className="w-full mt-2" disabled={loading}>
                  {loading ? t("register.resume.loading") : t("register.resume")}
                </GlassButton>
              </form>
            )}
          </motion.div>
        </GlassPanel>

        {/* Data-use badge — visible notice for exhibition visitors */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="w-full max-w-lg flex items-start gap-2.5 rounded-xl border border-cyan-accent/30 bg-cyan-accent/[0.06] px-4 py-3"
        >
          <span
            aria-hidden
            className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border border-cyan-accent/50 text-cyan-accent text-[11px] font-display"
            style={{ textShadow: "0 0 8px rgba(0, 240, 255, 0.6)" }}
          >
            i
          </span>
          <div className="flex-1">
            <div className="font-display text-[10px] uppercase tracking-[0.28em] text-cyan-accent/80">
              {t("register.consent.title")}
            </div>
            <p className="mt-1 text-[11.5px] leading-relaxed text-text-secondary">
              {t("register.consent.body")}
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

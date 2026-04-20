"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GlassPanel from "@/components/ui/GlassPanel";
import RespondentDetailDrawer from "@/components/admin/RespondentDetailDrawer";
import {
  FACE_LABEL, GENDER_LABEL, HAIR_LABEL, BODY_LABEL, SKIN_LABEL,
  ROLE_LABEL, RELATIONSHIP_LABEL, STAGE_LABEL, labelize, stageColor,
  type LocalizedDict,
} from "@/lib/admin/labels";
import {
  type RespondentFilterState,
  encodeFilterToSearchParams,
  parseFilterFromSearchParams,
} from "@/lib/admin/filterBuilder";
import { useT } from "@/lib/i18n/useT";
import type { Locale } from "@/stores/useLocaleStore";

interface Row {
  id: string;
  fullName: string;
  nickname: string;
  email: string;
  age: number;
  profession: string;
  relationshipStatus: string;
  createdAt: string;
  companion: {
    companionName: string;
    gender: string;
    role: string;
    faceShape: string | null;
    hairStyle: string | null;
    bodyBuild: string | null;
    skinTone: string;
    finalImagePath: string | null;
    features: { artificialWomb?: boolean; spermBank?: boolean };
    hobbies: string[];
    persona: {
      dominance: number;
      innocence: number;
      emotional: number;
      humor: number;
    };
  } | null;
  stage: string;
  dropped: boolean;
  dropStage: string | null;
  encounterDuration: number | null;
  surveyedAt: string | null;
  completedAt: string | null;
  experience: number | null;
  nps: number | null;
  purchaseIntent: number | null;
  transcriptCount: number;
}

interface ApiResponse {
  total: number;
  page: number;
  limit: number;
  pages: number;
  rows: Row[];
  options: {
    professions: string[];
    relationships: string[];
  };
}

const GENDER_OPTIONS = ["female", "male"];
const ROLE_OPTIONS = [
  "romantic-partner",
  "dominant-assistant",
  "passive-listener",
  "intellectual-rival",
];
const FACE_OPTIONS = ["alpha", "beta"];
const HAIR_OPTIONS = ["hair1", "hair2"];
const BODY_OPTIONS = ["body1", "body2"];
const SKIN_OPTIONS = ["fair", "medium", "tan", "deep"];

export default function RespondentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useT();

  const filter = useMemo<RespondentFilterState>(
    () => parseFilterFromSearchParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(true);
  const [searchInput, setSearchInput] = useState<string>(filter.q ?? "");

  useEffect(() => {
    setSearchInput(filter.q ?? "");
  }, [filter.q]);

  const updateFilter = useCallback(
    (patch: Partial<RespondentFilterState>, resetPage = true) => {
      const next = { ...filter, ...patch };
      const sp = encodeFilterToSearchParams(next);
      if (!resetPage) sp.set("page", String(page));
      router.replace(`/admin/respondents?${sp.toString()}`);
    },
    [filter, page, router],
  );

  const setPage = useCallback(
    (p: number) => {
      const sp = encodeFilterToSearchParams(filter);
      sp.set("page", String(p));
      router.replace(`/admin/respondents?${sp.toString()}`);
    },
    [filter, router],
  );

  useEffect(() => {
    let aborted = false;
    setLoading(true);
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("page", String(page));
    fetch(`/api/admin/respondents?${sp.toString()}`)
      .then((r) => r.json())
      .then((d: ApiResponse) => {
        if (!aborted) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!aborted) setLoading(false);
      });
    return () => {
      aborted = true;
    };
  }, [searchParams, page]);

  useEffect(() => {
    const h = setTimeout(() => {
      if ((searchInput ?? "") !== (filter.q ?? "")) {
        updateFilter({ q: searchInput || undefined });
      }
    }, 350);
    return () => clearTimeout(h);
  }, [searchInput, filter.q, updateFilter]);

  const activeFilterCount = countActiveFilters(filter);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-text-primary">
            {t("admin.resp.title")}
            <span className="ml-2 text-text-muted text-sm font-normal">
              {data
                ? `${data.total} ${t("admin.common.total").toLowerCase()} · ${data.page}/${data.pages || 1}`
                : "…"}
            </span>
          </h2>
          <p className="text-xs text-text-muted">{t("admin.resp.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("admin.resp.search.placeholder")}
            className="w-64 px-3 py-2 rounded-xl bg-obsidian-surface border border-glass-border text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-cyan-accent/40"
          />
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className={`px-3 py-2 rounded-xl text-xs font-display uppercase tracking-widest border transition-colors cursor-pointer ${
              activeFilterCount
                ? "bg-cyan-accent/20 text-cyan-accent border-cyan-accent/40"
                : "glass border-glass-border text-text-muted hover:text-text-primary"
            }`}
          >
            {t("admin.resp.filter.title")}
            {activeFilterCount > 0 ? ` · ${activeFilterCount}` : ""}
          </button>
          <button
            onClick={() => router.replace(`/admin/respondents`)}
            className="px-3 py-2 rounded-xl text-xs font-display uppercase tracking-widest glass border border-glass-border text-text-muted hover:text-danger transition-colors cursor-pointer"
          >
            {t("admin.common.reset")}
          </button>
          <a
            href={`/api/admin/export?format=csv&${encodeFilterToSearchParams(filter).toString()}`}
            className="px-3 py-2 rounded-xl text-xs font-display uppercase tracking-widest glass border border-glass-border text-text-primary hover:text-cyan-accent transition-colors"
          >
            {t("admin.resp.export")}
          </a>
        </div>
      </div>

      {filterOpen && (
        <GlassPanel variant="elevated" className="p-5">
          <FilterPanel
            filter={filter}
            options={data?.options ?? { professions: [], relationships: [] }}
            onChange={(patch) => updateFilter(patch)}
            t={t}
            locale={locale}
          />
        </GlassPanel>
      )}

      <GlassPanel variant="elevated" className="overflow-hidden">
        {loading && !data ? (
          <div className="p-12 text-center text-text-muted font-display text-sm">
            {t("admin.common.loading")}
          </div>
        ) : data && data.rows.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-display text-text-primary">{t("admin.resp.empty")}</p>
            <p className="text-xs text-text-muted mt-2">{t("admin.common.reset")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-obsidian-surface/60 border-b border-glass-border">
                <tr className="text-left text-[10px] font-display uppercase tracking-widest text-text-muted">
                  <Th>#</Th>
                  <Th>{t("admin.resp.table.name")}</Th>
                  <Th>{t("admin.resp.table.companion")}</Th>
                  <Th>{t("admin.resp.filter.role")}</Th>
                  <Th>{t("admin.resp.table.design")}</Th>
                  <Th>{t("admin.resp.table.stage")}</Th>
                  <Th>
                    <SortBtn
                      current={filter.sort}
                      asc="experience_asc"
                      desc="experience_desc"
                      onClick={(s) => updateFilter({ sort: s })}
                    >
                      {t("admin.resp.table.experience")}
                    </SortBtn>
                  </Th>
                  <Th>{t("admin.resp.table.nps")}</Th>
                  <Th>{t("admin.survey.purchaseIntent")}</Th>
                  <Th>
                    <SortBtn
                      current={filter.sort}
                      asc="duration_asc"
                      desc="duration_desc"
                      onClick={(s) => updateFilter({ sort: s })}
                    >
                      {t("admin.drawer.session.duration")}
                    </SortBtn>
                  </Th>
                  <Th>{t("admin.resp.table.transcript")}</Th>
                  <Th>
                    <SortBtn
                      current={filter.sort}
                      asc="oldest"
                      desc="recent"
                      onClick={(s) => updateFilter({ sort: s })}
                    >
                      {t("admin.resp.table.date")}
                    </SortBtn>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {data?.rows.map((r, i) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className="border-b border-glass-border/40 cursor-pointer hover:bg-cyan-accent/5 transition-colors"
                  >
                    <Td>{(data.page - 1) * data.limit + i + 1}</Td>
                    <Td>
                      <div className="flex flex-col">
                        <span className="text-text-primary font-display">{r.fullName}</span>
                        <span className="text-text-muted text-[11px]">{r.email}</span>
                        <span className="text-text-muted text-[11px]">
                          {t("admin.resp.table.age")} {r.age} · {r.profession}
                        </span>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        {r.companion?.finalImagePath && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={r.companion.finalImagePath}
                            alt=""
                            className="w-8 h-8 rounded-lg object-cover border border-glass-border"
                            loading="lazy"
                          />
                        )}
                        <div className="flex flex-col">
                          <span className="text-text-primary truncate max-w-[160px]">
                            {r.companion?.companionName || "—"}
                          </span>
                          <span className="text-text-muted text-[11px]">
                            {labelize(GENDER_LABEL, r.companion?.gender, locale)}
                          </span>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <span className="text-text-secondary">
                        {labelize(ROLE_LABEL, r.companion?.role, locale)}
                      </span>
                    </Td>
                    <Td>
                      <span className="text-[11px] text-text-muted">
                        {labelize(FACE_LABEL, r.companion?.faceShape, locale)} /{" "}
                        {labelize(HAIR_LABEL, r.companion?.hairStyle, locale)} /{" "}
                        {labelize(BODY_LABEL, r.companion?.bodyBuild, locale)} /{" "}
                        {labelize(SKIN_LABEL, r.companion?.skinTone, locale)}
                      </span>
                      <div className="flex gap-1 mt-1">
                        {r.companion?.features.artificialWomb && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-bio-green/15 text-bio-green border border-bio-green/25">
                            {t("admin.resp.filter.womb")}
                          </span>
                        )}
                        {r.companion?.features.spermBank && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-accent/15 text-cyan-accent border border-cyan-accent/25">
                            {t("admin.resp.filter.sperm")}
                          </span>
                        )}
                      </div>
                    </Td>
                    <Td>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-display uppercase tracking-widest border ${stageColor(r.stage)}`}
                      >
                        {labelize(STAGE_LABEL, r.stage, locale)}
                      </span>
                      {r.dropped && (
                        <div className="text-[10px] text-danger mt-1">
                          {labelize(STAGE_LABEL, "Dropped", locale)} · {r.dropStage ?? "?"}
                        </div>
                      )}
                    </Td>
                    <Td>{r.experience != null ? `${r.experience}/5` : "—"}</Td>
                    <Td>
                      {r.nps != null ? (
                        <span
                          className={`font-display ${
                            r.nps >= 9
                              ? "text-bio-green"
                              : r.nps <= 6
                                ? "text-danger"
                                : "text-[#FFD93D]"
                          }`}
                        >
                          {r.nps}
                        </span>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td>{r.purchaseIntent != null ? `${r.purchaseIntent}/5` : "—"}</Td>
                    <Td>
                      {r.encounterDuration != null
                        ? `${Math.floor(r.encounterDuration / 60)}m ${r.encounterDuration % 60}s`
                        : "—"}
                    </Td>
                    <Td>{r.transcriptCount}</Td>
                    <Td>
                      <time className="text-[11px] text-text-muted">
                        {new Date(r.createdAt).toLocaleDateString(
                          locale === "id" ? "id-ID" : "en-US",
                        )}
                      </time>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-glass-border">
            <span className="text-xs text-text-muted font-display">
              {t("admin.resp.pagination.summary", {
                from: (data.page - 1) * data.limit + 1,
                to: Math.min(data.page * data.limit, data.total),
                total: data.total,
              })}
            </span>
            <div className="flex gap-1">
              <PageBtn disabled={data.page <= 1} onClick={() => setPage(1)}>
                ««
              </PageBtn>
              <PageBtn
                disabled={data.page <= 1}
                onClick={() => setPage(Math.max(1, data.page - 1))}
              >
                ‹
              </PageBtn>
              <span className="px-3 py-1 text-xs text-text-primary font-display">
                {data.page} / {data.pages}
              </span>
              <PageBtn
                disabled={data.page >= data.pages}
                onClick={() => setPage(Math.min(data.pages, data.page + 1))}
              >
                ›
              </PageBtn>
              <PageBtn
                disabled={data.page >= data.pages}
                onClick={() => setPage(data.pages)}
              >
                »»
              </PageBtn>
            </div>
          </div>
        )}
      </GlassPanel>

      <RespondentDetailDrawer
        userId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 whitespace-nowrap">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-top">{children}</td>;
}

function PageBtn({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-2.5 py-1 rounded-lg glass border border-glass-border text-text-primary text-xs disabled:opacity-40 hover:text-cyan-accent transition-colors cursor-pointer"
    >
      {children}
    </button>
  );
}

function SortBtn({
  current,
  asc,
  desc,
  onClick,
  children,
}: {
  current?: RespondentFilterState["sort"];
  asc: RespondentFilterState["sort"];
  desc: RespondentFilterState["sort"];
  onClick: (s: RespondentFilterState["sort"]) => void;
  children: React.ReactNode;
}) {
  const isAsc = current === asc;
  const isDesc = current === desc;
  return (
    <button
      onClick={() => onClick(isDesc ? asc : desc)}
      className={`inline-flex items-center gap-1 hover:text-cyan-accent transition-colors cursor-pointer ${
        isAsc || isDesc ? "text-cyan-accent" : ""
      }`}
    >
      {children}
      <span className="text-[8px]">{isAsc ? "▲" : isDesc ? "▼" : "↕"}</span>
    </button>
  );
}

function FilterPanel({
  filter,
  options,
  onChange,
  t,
  locale,
}: {
  filter: RespondentFilterState;
  options: { professions: string[]; relationships: string[] };
  onChange: (patch: Partial<RespondentFilterState>) => void;
  t: (k: string, p?: Record<string, string | number>) => string;
  locale: Locale;
}) {
  // Flatten the localized dict for a given locale so ChipGroup can look up labels.
  const flat = (d: LocalizedDict): Record<string, string> => d[locale] ?? d.en;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
      <ChipGroup
        title={t("admin.resp.filter.gender")}
        values={GENDER_OPTIONS}
        labels={flat(GENDER_LABEL)}
        selected={filter.gender}
        onChange={(v) => onChange({ gender: v })}
      />
      <ChipGroup
        title={t("admin.resp.filter.role")}
        values={ROLE_OPTIONS}
        labels={flat(ROLE_LABEL)}
        selected={filter.role}
        onChange={(v) => onChange({ role: v })}
      />
      <ChipGroup
        title={t("admin.resp.filter.face")}
        values={FACE_OPTIONS}
        labels={flat(FACE_LABEL)}
        selected={filter.faceShape}
        onChange={(v) => onChange({ faceShape: v })}
      />
      <ChipGroup
        title={t("admin.resp.filter.hair")}
        values={HAIR_OPTIONS}
        labels={flat(HAIR_LABEL)}
        selected={filter.hairStyle}
        onChange={(v) => onChange({ hairStyle: v })}
      />
      <ChipGroup
        title={t("admin.resp.filter.body")}
        values={BODY_OPTIONS}
        labels={flat(BODY_LABEL)}
        selected={filter.bodyBuild}
        onChange={(v) => onChange({ bodyBuild: v })}
      />
      <ChipGroup
        title={t("admin.resp.filter.skin")}
        values={SKIN_OPTIONS}
        labels={flat(SKIN_LABEL)}
        selected={filter.skinTone}
        onChange={(v) => onChange({ skinTone: v })}
      />
      <ChipGroup
        title={t("admin.resp.filter.relationship")}
        values={options.relationships}
        labels={flat(RELATIONSHIP_LABEL)}
        selected={filter.relationshipStatus}
        onChange={(v) => onChange({ relationshipStatus: v })}
      />
      <TriState
        title={t("admin.drawer.companion.features")}
        t={t}
        items={[
          {
            key: "artificialWomb",
            label: t("admin.resp.filter.womb"),
            value: filter.artificialWomb,
            set: (v) => onChange({ artificialWomb: v }),
          },
          {
            key: "spermBank",
            label: t("admin.resp.filter.sperm"),
            value: filter.spermBank,
            set: (v) => onChange({ spermBank: v }),
          },
        ]}
      />
      <div>
        <FilterLabel>
          {t("admin.resp.filter.age.min")} – {t("admin.resp.filter.age.max")}
        </FilterLabel>
        <div className="flex items-center gap-2 mt-1.5">
          <NumInput
            value={filter.ageMin}
            onChange={(n) => onChange({ ageMin: n })}
            placeholder={t("admin.resp.filter.age.min")}
          />
          <span className="text-text-muted">–</span>
          <NumInput
            value={filter.ageMax}
            onChange={(n) => onChange({ ageMax: n })}
            placeholder={t("admin.resp.filter.age.max")}
          />
        </div>
      </div>
      <div>
        <FilterLabel>
          {t("admin.resp.filter.experience.min")} – {t("admin.resp.filter.experience.max")}
        </FilterLabel>
        <div className="flex items-center gap-2 mt-1.5">
          <NumInput
            value={filter.experienceMin}
            onChange={(n) => onChange({ experienceMin: n })}
            placeholder={t("admin.resp.filter.experience.min")}
          />
          <span className="text-text-muted">–</span>
          <NumInput
            value={filter.experienceMax}
            onChange={(n) => onChange({ experienceMax: n })}
            placeholder={t("admin.resp.filter.experience.max")}
          />
        </div>
      </div>
      <div>
        <FilterLabel>
          {t("admin.resp.filter.date.from")} – {t("admin.resp.filter.date.to")}
        </FilterLabel>
        <div className="flex items-center gap-2 mt-1.5">
          <input
            type="date"
            value={filter.dateFrom ?? ""}
            onChange={(e) => onChange({ dateFrom: e.target.value || undefined })}
            className="px-2 py-1.5 rounded-lg bg-obsidian-surface border border-glass-border text-xs text-text-primary"
          />
          <input
            type="date"
            value={filter.dateTo ?? ""}
            onChange={(e) => onChange({ dateTo: e.target.value || undefined })}
            className="px-2 py-1.5 rounded-lg bg-obsidian-surface border border-glass-border text-xs text-text-primary"
          />
        </div>
      </div>
      <ChipGroup
        title={t("admin.resp.filter.nps.label")}
        values={["promoter", "passive", "detractor"]}
        labels={{
          promoter: t("admin.resp.filter.nps.promoter"),
          passive: t("admin.resp.filter.nps.passive"),
          detractor: t("admin.resp.filter.nps.detractor"),
        }}
        selected={filter.npsBucket ? [filter.npsBucket] : undefined}
        onChange={(v) =>
          onChange({
            npsBucket: (v?.[v.length - 1] as "promoter" | "passive" | "detractor" | undefined) ?? undefined,
          })
        }
      />
      <div className="flex flex-wrap gap-2 items-end">
        <Toggle
          label={t("admin.resp.filter.completed")}
          value={filter.completedOnly === true}
          onChange={(v) => onChange({ completedOnly: v ? true : undefined })}
        />
        <Toggle
          label={t("admin.resp.filter.dropped")}
          value={filter.droppedOnly === true}
          onChange={(v) => onChange({ droppedOnly: v ? true : undefined })}
        />
      </div>
    </div>
  );
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-display uppercase tracking-widest text-text-muted">
      {children}
    </p>
  );
}

function ChipGroup({
  title,
  values,
  labels,
  selected,
  onChange,
}: {
  title: string;
  values: string[];
  labels?: Record<string, string>;
  selected?: string[];
  onChange: (v: string[] | undefined) => void;
}) {
  const toggle = (v: string) => {
    const cur = selected ?? [];
    const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
    onChange(next.length ? next : undefined);
  };
  if (values.length === 0) return null;
  return (
    <div>
      <FilterLabel>{title}</FilterLabel>
      <div className="flex flex-wrap gap-1.5 mt-1.5">
        {values.map((v) => {
          const active = selected?.includes(v);
          return (
            <button
              key={v}
              onClick={() => toggle(v)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-display transition-colors cursor-pointer border ${
                active
                  ? "bg-cyan-accent/20 text-cyan-accent border-cyan-accent/40"
                  : "glass text-text-muted border-glass-border hover:text-text-primary"
              }`}
            >
              {labels?.[v] ?? v}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TriState({
  title,
  items,
  t,
}: {
  title: string;
  items: {
    key: string;
    label: string;
    value: boolean | undefined;
    set: (v: boolean | undefined) => void;
  }[];
  t: (k: string) => string;
}) {
  const nextState = (v: boolean | undefined): boolean | undefined => {
    if (v === undefined) return true;
    if (v === true) return false;
    return undefined;
  };
  const display = (v: boolean | undefined): string => {
    if (v === true) return t("admin.resp.filter.tri.on");
    if (v === false) return t("admin.resp.filter.tri.off");
    return t("admin.resp.filter.tri.any");
  };
  return (
    <div>
      <FilterLabel>{title}</FilterLabel>
      <div className="flex flex-col gap-1.5 mt-1.5">
        {items.map((it) => (
          <button
            key={it.key}
            onClick={() => it.set(nextState(it.value))}
            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-display transition-colors cursor-pointer border ${
              it.value === true
                ? "bg-bio-green/15 text-bio-green border-bio-green/30"
                : it.value === false
                  ? "bg-danger/10 text-danger border-danger/30"
                  : "glass text-text-muted border-glass-border hover:text-text-primary"
            }`}
          >
            <span>{it.label}</span>
            <span className="tracking-widest">{display(it.value)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function NumInput({
  value,
  onChange,
  placeholder,
}: {
  value?: number;
  onChange: (n: number | undefined) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      value={value ?? ""}
      onChange={(e) => {
        const s = e.target.value.trim();
        if (s === "") onChange(undefined);
        else {
          const n = Number(s);
          onChange(Number.isFinite(n) ? n : undefined);
        }
      }}
      placeholder={placeholder}
      className="w-24 px-2 py-1.5 rounded-lg bg-obsidian-surface border border-glass-border text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-cyan-accent/40"
    />
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`px-3 py-1.5 rounded-full text-[11px] font-display uppercase tracking-widest cursor-pointer border transition-colors ${
        value
          ? "bg-cyan-accent/20 text-cyan-accent border-cyan-accent/40"
          : "glass text-text-muted border-glass-border hover:text-text-primary"
      }`}
    >
      {label}
    </button>
  );
}

function countActiveFilters(f: RespondentFilterState): number {
  let n = 0;
  if (f.q) n++;
  if (f.gender?.length) n++;
  if (f.role?.length) n++;
  if (f.faceShape?.length) n++;
  if (f.hairStyle?.length) n++;
  if (f.bodyBuild?.length) n++;
  if (f.skinTone?.length) n++;
  if (f.artificialWomb !== undefined) n++;
  if (f.spermBank !== undefined) n++;
  if (f.relationshipStatus?.length) n++;
  if (f.ageMin !== undefined) n++;
  if (f.ageMax !== undefined) n++;
  if (f.completedOnly) n++;
  if (f.droppedOnly) n++;
  if (f.dateFrom) n++;
  if (f.dateTo) n++;
  if (f.experienceMin !== undefined) n++;
  if (f.experienceMax !== undefined) n++;
  if (f.npsBucket) n++;
  return n;
}

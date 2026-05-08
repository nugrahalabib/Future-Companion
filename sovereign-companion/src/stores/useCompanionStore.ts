import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  DEFAULT_FEATURES,
  getFinalImagePath,
  type ExtremeFeatureId,
  type FeaturesState,
  type Gender,
} from "@/lib/companionAssets";

export type UserGender = "female" | "male" | "nonbinary" | "";

export interface CompanionState {
  // Step 0 (captured during register) — personal naming contract
  // userNicknames: up to 3 pet-names the AI rotates through (e.g. ["sayang","mas","cintaku"])
  // companionName: the name the user gave the AI itself
  // userGender: the user's own gender — informs AI's descriptive grammar
  userNicknames: string[];
  companionName: string;
  userGender: UserGender;
  introCompleted: boolean; // marks naming contract as done
  // Step 1 — Gender ("female" | "male" | "nonbinary")
  gender: Gender;
  // Step 2-5 — Physical selection (single-letter ids: A,B,C,D,E,F)
  faceShape: string | null;
  hairStyle: string | null;
  bodyBuild: string | null;
  outfit: string | null;
  // Step 6 — Skin tone (categorical id, applied via CSS filter)
  skinTone: string;
  // Step 7 — Extreme biological features (spec-only, does not change image)
  features: FeaturesState;
  // Step 8 — Persona
  role: string;
  dominanceLevel: number;
  innocenceLevel: number;
  emotionalLevel: number;
  humorStyle: number;
  // Step 9 — Hobbies
  hobbies: string[];
  // Derived — final composite image path (computed once Step 1-5 set)
  finalImagePath: string | null;
  // Stepper cursor (1-9)
  currentStep: number;
  // Actions
  setGender: (gender: Gender) => void;
  setFaceShape: (id: string) => void;
  setHairStyle: (id: string) => void;
  setBodyBuild: (id: string) => void;
  setOutfit: (id: string) => void;
  setSkinTone: (id: string) => void;
  setFeature: (id: ExtremeFeatureId, enabled: boolean) => void;
  setRole: (role: string) => void;
  setSlider: (key: "dominanceLevel" | "innocenceLevel" | "emotionalLevel" | "humorStyle", value: number) => void;
  setHobbies: (hobbies: string[]) => void;
  setUserNicknames: (names: string[]) => void;
  setCompanionName: (name: string) => void;
  setUserGender: (gender: UserGender) => void;
  setIntroCompleted: (v: boolean) => void;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  recomputeFinalImagePath: () => void;
  getFullConfig: () => Record<string, unknown>;
  reset: () => void;
  _hasHydrated: boolean;
}

const defaults: Pick<
  CompanionState,
  | "userNicknames"
  | "companionName"
  | "userGender"
  | "introCompleted"
  | "gender"
  | "faceShape"
  | "hairStyle"
  | "bodyBuild"
  | "outfit"
  | "skinTone"
  | "features"
  | "role"
  | "dominanceLevel"
  | "innocenceLevel"
  | "emotionalLevel"
  | "humorStyle"
  | "hobbies"
  | "finalImagePath"
  | "currentStep"
> = {
  userNicknames: [],
  companionName: "",
  userGender: "",
  introCompleted: false,
  gender: "female",
  faceShape: null,
  hairStyle: null,
  bodyBuild: null,
  outfit: null,
  skinTone: "medium",
  features: { ...DEFAULT_FEATURES },
  role: "romantic-partner",
  dominanceLevel: 50,
  innocenceLevel: 50,
  emotionalLevel: 50,
  humorStyle: 50,
  hobbies: [],
  finalImagePath: null,
  currentStep: 1,
};

const TOTAL_STEPS = 9;

const noopStorage: Storage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  key: () => null,
  length: 0,
};

const storage = typeof window !== "undefined" ? localStorage : noopStorage;

function resolveFinalPath(
  gender: Gender,
  faceShape: string | null,
  hairStyle: string | null,
  bodyBuild: string | null,
  outfit: string | null,
): string | null {
  return getFinalImagePath({ gender, faceShape, hairStyle, bodyBuild, outfit });
}

export const useCompanionStore = create<CompanionState>()(
  persist(
    (set, get) => ({
      ...defaults,
      _hasHydrated: false,
      setGender: (gender) =>
        set((s) => ({
          gender,
          // Gender change invalidates ALL physical selection (options differ per gender)
          faceShape: null,
          hairStyle: null,
          bodyBuild: null,
          outfit: null,
          // Gender-aware bio modules:
          //  - female keeps artificialWomb, clears spermBank
          //  - male keeps spermBank, clears artificialWomb
          //  - nonbinary keeps BOTH (free choice — they may toggle either or both)
          features: {
            artificialWomb:
              gender === "female" || gender === "nonbinary" ? s.features.artificialWomb : false,
            spermBank:
              gender === "male" || gender === "nonbinary" ? s.features.spermBank : false,
          },
          finalImagePath: null,
        })),
      setFaceShape: (id) =>
        set((s) => ({
          faceShape: id,
          finalImagePath: resolveFinalPath(s.gender, id, s.hairStyle, s.bodyBuild, s.outfit),
        })),
      setHairStyle: (id) =>
        set((s) => ({
          hairStyle: id,
          finalImagePath: resolveFinalPath(s.gender, s.faceShape, id, s.bodyBuild, s.outfit),
        })),
      setBodyBuild: (id) =>
        set((s) => ({
          bodyBuild: id,
          finalImagePath: resolveFinalPath(s.gender, s.faceShape, s.hairStyle, id, s.outfit),
        })),
      setOutfit: (id) =>
        set((s) => ({
          outfit: id,
          finalImagePath: resolveFinalPath(s.gender, s.faceShape, s.hairStyle, s.bodyBuild, id),
        })),
      setSkinTone: (id) => set({ skinTone: id }),
      setFeature: (id, enabled) =>
        set((s) => ({ features: { ...s.features, [id]: enabled } })),
      setRole: (role) => set({ role }),
      setSlider: (key, value) => set({ [key]: value } as Partial<CompanionState>),
      setHobbies: (hobbies) => set({ hobbies }),
      setUserNicknames: (userNicknames) => set({ userNicknames: userNicknames.slice(0, 3) }),
      setCompanionName: (companionName) => set({ companionName }),
      setUserGender: (userGender) => set({ userGender }),
      setIntroCompleted: (introCompleted) => set({ introCompleted }),
      setStep: (step) => set({ currentStep: Math.min(TOTAL_STEPS, Math.max(1, step)) }),
      nextStep: () => set((s) => ({ currentStep: Math.min(TOTAL_STEPS, s.currentStep + 1) })),
      prevStep: () => set((s) => ({ currentStep: Math.max(1, s.currentStep - 1) })),
      recomputeFinalImagePath: () =>
        set((s) => ({
          finalImagePath: resolveFinalPath(s.gender, s.faceShape, s.hairStyle, s.bodyBuild, s.outfit),
        })),
      getFullConfig: () => {
        const s = get();
        return {
          userNicknames: s.userNicknames,
          companionName: s.companionName,
          userGender: s.userGender,
          gender: s.gender,
          faceShape: s.faceShape,
          hairStyle: s.hairStyle,
          bodyBuild: s.bodyBuild,
          outfit: s.outfit,
          skinTone: s.skinTone,
          features: s.features,
          role: s.role,
          dominanceLevel: s.dominanceLevel,
          innocenceLevel: s.innocenceLevel,
          emotionalLevel: s.emotionalLevel,
          humorStyle: s.humorStyle,
          hobbies: s.hobbies,
          finalImagePath: s.finalImagePath,
        };
      },
      reset: () => set({ ...defaults, features: { ...DEFAULT_FEATURES } }),
    }),
    {
      name: "sovereign-companion",
      storage: createJSONStorage(() => storage),
      version: 6,
      onRehydrateStorage: () => () => {
        useCompanionStore.setState({ _hasHydrated: true });
      },
      migrate: (persisted, fromVersion) => {
        type LegacyShape = Partial<CompanionState> & { userNickname?: string };
        const state = persisted as LegacyShape | undefined;
        if (!state) return { ...defaults } as CompanionState;
        // v5 → v6: asset ID system migrated from "alpha"|"beta", "hair1"|"hair2",
        // "body1"|"body2" → "A"-"F". Legacy IDs no longer resolve, so we drop them
        // and force re-pick. Outfit field is new; default null.
        const isV5OrEarlier = (fromVersion ?? 0) < 6;
        // v4 → v5: userNickname (string) → userNicknames (string[])
        const legacySingle = typeof state.userNickname === "string" ? state.userNickname.trim() : "";
        const nicknames = Array.isArray(state.userNicknames)
          ? state.userNicknames.filter((n): n is string => typeof n === "string" && n.trim().length > 0).slice(0, 3)
          : legacySingle
            ? [legacySingle]
            : [];
        // Validate gender (now also accepts "nonbinary")
        const validGender: Gender =
          state.gender === "male" || state.gender === "nonbinary" ? state.gender : "female";
        // For v5 or earlier, drop legacy face/hair/body IDs (don't match new A-F system)
        const validFaceIds = new Set(["A", "B", "C", "D", "E"]);
        const validHairIds = new Set(["A", "B", "C", "D", "E"]);
        const validBodyIds = new Set(["A", "B", "C", "D", "E", "F"]);
        const validOutfitIds = new Set(["A", "B", "C", "D", "E"]);
        const face = !isV5OrEarlier && state.faceShape && validFaceIds.has(state.faceShape) ? state.faceShape : null;
        const hair = !isV5OrEarlier && state.hairStyle && validHairIds.has(state.hairStyle) ? state.hairStyle : null;
        const body = !isV5OrEarlier && state.bodyBuild && validBodyIds.has(state.bodyBuild) ? state.bodyBuild : null;
        const outfit = !isV5OrEarlier && state.outfit && validOutfitIds.has(state.outfit) ? state.outfit : null;
        return {
          ...defaults,
          ...state,
          userNicknames: nicknames,
          companionName: state.companionName ?? "",
          userGender: state.userGender ?? "",
          introCompleted: state.introCompleted ?? false,
          gender: validGender,
          faceShape: face,
          hairStyle: hair,
          bodyBuild: body,
          outfit,
          finalImagePath: null,
        } as CompanionState;
      },
    },
  ),
);

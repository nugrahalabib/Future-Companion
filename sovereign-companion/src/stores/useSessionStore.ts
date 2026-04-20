import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SessionState {
  sessionId: string | null;
  currentStage: number;
  _hasHydrated: boolean;
  setSessionId: (id: string) => void;
  advanceStage: () => void;
  setStage: (stage: number) => void;
  reset: () => void;
}

const noopStorage: Storage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  key: () => null,
  length: 0,
};

const storage = typeof window !== "undefined" ? localStorage : noopStorage;

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      sessionId: null,
      currentStage: 1,
      _hasHydrated: false,
      setSessionId: (id) => set({ sessionId: id }),
      advanceStage: () => set((s) => ({ currentStage: s.currentStage + 1 })),
      setStage: (stage) => set({ currentStage: stage }),
      reset: () => set({ sessionId: null, currentStage: 1 }),
    }),
    {
      name: "sovereign-session",
      storage: createJSONStorage(() => storage),
      partialize: (s) => ({
        sessionId: s.sessionId,
        currentStage: s.currentStage,
      }),
      onRehydrateStorage: () => () => {
        useSessionStore.setState({ _hasHydrated: true });
      },
    },
  ),
);

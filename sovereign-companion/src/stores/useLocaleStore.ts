"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Locale = "id" | "en";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set, get) => ({
      locale: "id",
      setLocale: (locale) => set({ locale }),
      toggleLocale: () => set({ locale: get().locale === "id" ? "en" : "id" }),
    }),
    {
      name: "sovereign-locale",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
              clear: () => {},
              key: () => null,
              length: 0,
            },
      ),
    },
  ),
);

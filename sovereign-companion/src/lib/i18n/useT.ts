"use client";

import { useCallback } from "react";
import { useLocaleStore, type Locale } from "@/stores/useLocaleStore";
import { translations } from "./dictionary";

export type TranslateFn = (
  key: string,
  params?: Record<string, string | number>,
) => string;

function interpolate(template: string, params?: Record<string, string | number>) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, name) =>
    name in params ? String(params[name]) : `{${name}}`,
  );
}

export function useT(): { t: TranslateFn; locale: Locale } {
  const locale = useLocaleStore((s) => s.locale);

  const t = useCallback<TranslateFn>(
    (key, params) => {
      const dict = translations[locale] || translations.en;
      const raw = dict[key] ?? translations.en[key] ?? key;
      return interpolate(raw, params);
    },
    [locale],
  );

  return { t, locale };
}

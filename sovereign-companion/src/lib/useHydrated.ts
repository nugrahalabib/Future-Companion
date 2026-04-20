"use client";

import { useEffect, useState } from "react";

// Client-only mount flag. Zustand `persist` middleware reads localStorage
// synchronously during module init, so by the time this effect fires the
// stores are fully rehydrated. The stores argument is accepted for
// backwards-compat with callers that list the stores they depend on — the
// implementation is store-agnostic because mount on client implies all
// stores are ready.
export function useHydrated(
  _stores?: ReadonlyArray<"user" | "session" | "companion">,
): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  void _stores;
  return mounted;
}

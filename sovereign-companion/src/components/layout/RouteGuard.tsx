"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/stores/useSessionStore";
import { useHydrated } from "@/lib/useHydrated";

const stageRoutes: Record<number, string> = {
  1: "/",
  2: "/register",
  3: "/creator",
  4: "/assembly",
  5: "/encounter",
  6: "/checkout",
  7: "/farewell",
  8: "/",
};

interface RouteGuardProps {
  requiredStage: number;
  children: React.ReactNode;
}

export default function RouteGuard({ requiredStage, children }: RouteGuardProps) {
  const currentStage = useSessionStore((s) => s.currentStage);
  const router = useRouter();
  const hydrated = useHydrated(["user", "session"]);

  useEffect(() => {
    if (!hydrated) return;
    if (currentStage < requiredStage) {
      const redirectTo = stageRoutes[currentStage] ?? "/";
      router.replace(redirectTo);
    }
  }, [hydrated, currentStage, requiredStage, router]);

  if (!hydrated) return null;
  if (currentStage < requiredStage) return null;
  return <>{children}</>;
}

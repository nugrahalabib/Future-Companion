"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Background from "@/components/layout/Background";
import GlassPanel from "@/components/ui/GlassPanel";
import GlassButton from "@/components/ui/GlassButton";
import RouteGuard from "@/components/layout/RouteGuard";
import NeuroSigil from "@/components/checkout/NeuroSigil";
import { useUserStore } from "@/stores/useUserStore";
import { useSessionStore } from "@/stores/useSessionStore";
import { useCompanionStore } from "@/stores/useCompanionStore";
import { useT } from "@/lib/i18n/useT";
import { useHydrated } from "@/lib/useHydrated";

type Phase = "checkout" | "countdown" | "delivered" | "confirmed";
type GeoPhase = "scanning" | "typing" | "confirmed";

// Staged address. The "satellite mesh" animation pretends to geo-locate the
// user, then the address types itself into the field. Hardcoded per brief —
// this is a demo, not a real geo-IP lookup.
const DROP_POINT_ADDRESS =
  "Jl. R.A. Kartini, RT.14/RW.6, Cilandak Bar., Kec. Cilandak, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12430";

export default function CheckoutPage() {
  const router = useRouter();
  const userId = useUserStore((s) => s.userId);
  const hydrated = useHydrated(["user", "session", "companion"]);
  const sessionId = useSessionStore((s) => s.sessionId);
  const setStage = useSessionStore((s) => s.setStage);
  const companionName = useCompanionStore((s) => s.companionName);
  const { t } = useT();

  const [phase, setPhase] = useState<Phase>("checkout");
  const [address, setAddress] = useState("");
  const [count, setCount] = useState(10);
  const [geoPhase, setGeoPhase] = useState<GeoPhase>("scanning");

  // Geo-lookup simulation: 1.8s scanning → typewriter the address in → confirmed.
  useEffect(() => {
    const scanTimer = setTimeout(() => setGeoPhase("typing"), 1800);
    return () => clearTimeout(scanTimer);
  }, []);

  useEffect(() => {
    if (geoPhase !== "typing") return;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setAddress(DROP_POINT_ADDRESS.slice(0, i));
      if (i >= DROP_POINT_ADDRESS.length) {
        clearInterval(id);
        setTimeout(() => setGeoPhase("confirmed"), 350);
      }
    }, 22);
    return () => clearInterval(id);
  }, [geoPhase]);

  const sigilSeed = `${sessionId ?? "demo"}-${userId ?? "guest"}`;

  const handlePayment = useCallback(() => {
    setPhase("countdown");
  }, []);

  // Countdown logic
  useEffect(() => {
    if (phase !== "countdown") return;
    if (count <= 0) {
      setPhase("delivered");
      return;
    }
    const timer = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, count]);

  const handleReceived = async () => {
    // Update session
    if (sessionId) {
      await fetch("/api/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, checkoutAt: new Date().toISOString() }),
      });
    }
    try {
      sessionStorage.removeItem("sovereign-highlights");
    } catch {
      // noop — not used in checkout UI anymore, but the encounter page still
      // writes it and we clean up so stale data doesn't linger in storage.
    }
    setPhase("confirmed");
    setStage(7);
    // The booth visitor scans the QR with their phone to fill the questionnaire
    // on /questionnaire remotely — this screen frees up for the next user.
    setTimeout(() => router.push("/farewell"), 1500);
  };

  useEffect(() => {
    if (!hydrated) return;
    if (!userId) router.replace("/register");
  }, [hydrated, userId, router]);

  if (!hydrated || !userId) return null;

  return (
    <RouteGuard requiredStage={6}>
    <main className="relative flex-1 overflow-hidden">
      <Background />
      <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
        <AnimatePresence mode="wait">
          {phase === "checkout" && (
            <motion.div
              key="checkout"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md space-y-5"
            >
              <GlassPanel variant="elevated" className="p-8 text-center space-y-6">
                <h1 className="font-display text-2xl font-bold text-text-primary">
                  {t("checkout.heading")}
                </h1>
                <p className="text-sm text-text-secondary">
                  {companionName.trim()
                    ? t("checkout.subheading", { name: companionName.trim() })
                    : t("checkout.subheading.fallback")}
                </p>

                {/* Neuro-sigil (future-QR). Animated authorization glyph that
                    reads as "scan-to-pay" for the 2076 setting. */}
                <div className="flex justify-center py-4">
                  <NeuroSigil seed={sigilSeed} size={220} />
                </div>
                <p className="text-xs text-text-muted">
                  {t("checkout.qr")}
                </p>

                {/* Address — auto-located by fake satellite mesh, then
                    typewritten into the field. User can still edit. */}
                <div className="text-left">
                  <label className="block text-xs text-text-secondary mb-1.5 uppercase tracking-wider">
                    {t("checkout.address")}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly={geoPhase !== "confirmed"}
                      className="w-full bg-obsidian-surface border border-glass-border rounded-xl px-4 py-3 pr-10 text-text-primary placeholder-text-muted focus:outline-none focus:border-cyan-accent/40 transition-colors"
                      placeholder={t("checkout.address.placeholder")}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                      {geoPhase === "scanning" && (
                        <motion.div
                          className="h-2.5 w-2.5 rounded-full bg-cyan-accent"
                          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.15, 0.8] }}
                          transition={{ repeat: Infinity, duration: 1.1 }}
                          style={{ boxShadow: "0 0 10px rgba(0,240,255,0.7)" }}
                        />
                      )}
                      {geoPhase === "typing" && (
                        <motion.div
                          className="h-2.5 w-2.5 rounded-full bg-[#F5A524]"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 0.7 }}
                          style={{ boxShadow: "0 0 10px rgba(245,165,36,0.7)" }}
                        />
                      )}
                      {geoPhase === "confirmed" && (
                        <motion.span
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-bio-green text-base leading-none"
                          style={{ textShadow: "0 0 8px rgba(57,255,20,0.7)" }}
                        >
                          ✓
                        </motion.span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 min-h-[1rem]">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={geoPhase}
                        initial={{ opacity: 0, y: -2 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="font-display text-[10px] uppercase tracking-[0.22em]"
                        style={{
                          color:
                            geoPhase === "confirmed"
                              ? "#39FF14"
                              : geoPhase === "typing"
                                ? "#F5A524"
                                : "#00F0FF",
                        }}
                      >
                        {geoPhase === "scanning"
                          ? t("checkout.geo.locating")
                          : geoPhase === "typing"
                            ? t("checkout.geo.found")
                            : t("checkout.geo.confirmed")}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>

                <GlassButton
                  className={`w-full ${geoPhase !== "confirmed" ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={handlePayment}
                  disabled={geoPhase !== "confirmed"}
                >
                  {t("checkout.payment")}
                </GlassButton>
              </GlassPanel>
            </motion.div>
          )}

          {phase === "countdown" && (
            <motion.div
              key="countdown"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <motion.p
                className="text-sm text-text-muted font-display uppercase tracking-widest mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {t("checkout.countdownHeading")}
              </motion.p>
              <motion.div
                key={count}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="font-display text-[12rem] font-bold text-cyan-accent leading-none"
                style={{
                  textShadow: "0 0 60px rgba(0, 240, 255, 0.4), 0 0 120px rgba(0, 240, 255, 0.2)",
                }}
              >
                {count}
              </motion.div>
            </motion.div>
          )}

          {phase === "delivered" && (
            <motion.div
              key="delivered"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-6 max-w-lg"
            >
              <motion.div
                className="w-16 h-16 mx-auto rounded-full border-2 border-bio-green flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.3 }}
              >
                <span className="text-bio-green text-2xl">✓</span>
              </motion.div>
              <h2 className="font-display text-3xl font-bold text-text-primary">
                {companionName.trim()
                  ? t("checkout.delivered.heading", { name: companionName.trim() })
                  : t("checkout.delivered.heading.fallback")}
              </h2>
              <p className="text-text-secondary">
                {t("checkout.delivered.instruction")}
              </p>
              <GlassButton onClick={handleReceived} size="lg">
                {t("checkout.delivered.button")}
              </GlassButton>
            </motion.div>
          )}

          {phase === "confirmed" && (
            <motion.div
              key="confirmed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <p className="text-text-secondary font-display">
                {t("checkout.confirmed")}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
    </RouteGuard>
  );
}

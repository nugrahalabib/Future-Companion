"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import Background from "@/components/layout/Background";
import AdminTabBar from "@/components/admin/AdminTabBar";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { useT } from "@/lib/i18n/useT";
import { ADMIN_AUTH_KEY as AUTH_KEY, ADMIN_PW_KEY as PW_KEY } from "@/lib/adminConfig";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { t } = useT();
  const [authenticated, setAuthenticated] = useState(false);
  const [checked, setChecked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const authed = sessionStorage.getItem(AUTH_KEY) === "1";
      const hasPw = !!sessionStorage.getItem(PW_KEY);
      if (authed && hasPw) {
        setAuthenticated(true);
      } else if (authed && !hasPw) {
        sessionStorage.removeItem(AUTH_KEY);
      }
    }
    setChecked(true);
  }, []);

  const checkPassword = async () => {
    if (verifying) return;
    setVerifying(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setAuthenticated(true);
        setError(false);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(AUTH_KEY, "1");
          sessionStorage.setItem(PW_KEY, password);
        }
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setVerifying(false);
    }
  };

  if (!checked) return null;

  if (!authenticated) {
    return (
      <main className="relative flex-1">
        <Background />
        <LanguageSwitcher />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="glass-elevated rounded-2xl p-8 w-full max-w-sm space-y-4">
            <p className="text-[10px] font-display uppercase tracking-widest text-cyan-accent">
              {t("admin.lock.badge")}
            </p>
            <h2 className="font-display text-xl font-bold text-text-primary">
              {t("admin.lock.title")}
            </h2>
            <p className="text-sm text-text-muted">
              {t("admin.lock.subtitle")}
            </p>
            <input
              type="password"
              className={`w-full bg-obsidian-surface border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-cyan-accent/40 transition-colors ${error ? "border-danger" : "border-glass-border"}`}
              placeholder={t("admin.lock.placeholder")}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              onKeyDown={(e) => { if (e.key === "Enter") checkPassword(); }}
              autoFocus
            />
            {error && (
              <p className="text-xs text-danger">{t("admin.lock.error")}</p>
            )}
            <button
              disabled={verifying}
              className="w-full py-3 rounded-xl bg-cyan-accent/20 text-cyan-accent font-display font-semibold hover:bg-cyan-accent/30 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait"
              onClick={checkPassword}
            >
              {t("admin.lock.submit")}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex-1">
      <Background />
      <LanguageSwitcher />
      <div className="relative z-10 min-h-screen p-6 lg:p-8">
        <div className="flex items-center justify-between gap-4 mb-6 pr-28 sm:pr-32">
          <div>
            <Link
              href="/admin/overview"
              className="font-display text-2xl sm:text-3xl font-bold text-text-primary hover:text-cyan-accent transition-colors"
            >
              {t("admin.header.title")}
            </Link>
            <p className="text-xs sm:text-sm text-text-secondary mt-1">
              {t("admin.header.subtitle")}
            </p>
          </div>
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                sessionStorage.removeItem(AUTH_KEY);
                sessionStorage.removeItem(PW_KEY);
              }
              setAuthenticated(false);
            }}
            className="text-xs font-display uppercase tracking-widest text-text-muted hover:text-danger transition-colors cursor-pointer"
          >
            {t("admin.header.signout")}
          </button>
        </div>

        <AdminTabBar />

        {children}
      </div>
    </main>
  );
}

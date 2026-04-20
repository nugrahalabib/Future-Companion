"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useT } from "@/lib/i18n/useT";

interface UserRow {
  userId: string;
  fullName: string;
  email: string;
  registeredAt: string;
}

export interface ResolvedUser {
  userId: string;
  fullName: string;
  nickname: string;
  email: string;
  age: number;
  profession: string;
  companionName: string;
  userNicknames: string[];
}

interface EmailLookupProps {
  value: string;
  onChange: (email: string) => void;
  onResolve: (user: ResolvedUser | null) => void;
}

// Searchable email-picker. Fetches the directory once, filters client-side,
// and resolves the detailed record (companion name + nicknames) when the user
// picks an email. Backing store for the top of the questionnaire so each
// submission is tied back to the correct User row in the DB.
export default function EmailLookup({ value, onChange, onResolve }: EmailLookupProps) {
  const { t } = useT();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const resolvedRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/users/lookup");
        const data = await res.json();
        if (!cancelled) setUsers(data.users ?? []);
      } catch {
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return users.slice(0, 12);
    return users
      .filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          u.fullName.toLowerCase().includes(q),
      )
      .slice(0, 12);
  }, [value, users]);

  async function handlePick(email: string) {
    onChange(email);
    setOpen(false);
    if (resolvedRef.current === email) return;
    resolvedRef.current = email;
    setResolving(true);
    setResolveError(null);
    try {
      const res = await fetch(
        `/api/users/lookup?email=${encodeURIComponent(email)}`,
      );
      if (!res.ok) {
        setResolveError(t("q.identity.notFound"));
        onResolve(null);
        return;
      }
      const data = (await res.json()) as ResolvedUser;
      onResolve(data);
    } catch {
      setResolveError(t("q.identity.notFound"));
      onResolve(null);
    } finally {
      setResolving(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="email"
        value={value}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          resolvedRef.current = null;
          onResolve(null);
        }}
        placeholder={t("q.identity.emailPlaceholder")}
        className="w-full bg-obsidian-surface border border-glass-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-cyan-accent/40 transition-colors"
        autoComplete="email"
      />

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute z-20 mt-2 w-full rounded-xl border border-glass-border bg-obsidian-surface shadow-2xl max-h-64 overflow-auto"
          >
            {loading ? (
              <div className="px-4 py-3 text-xs text-text-muted">
                {t("common.loading")}
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-3 text-xs text-text-muted">
                {t("q.identity.noMatches")}
              </div>
            ) : (
              filtered.map((u) => (
                <button
                  type="button"
                  key={u.userId}
                  onClick={() => handlePick(u.email)}
                  className="w-full text-left px-4 py-2 hover:bg-cyan-accent/10 transition-colors cursor-pointer"
                >
                  <div className="text-sm text-text-primary">{u.email}</div>
                  <div className="text-[11px] text-text-muted">{u.fullName}</div>
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {resolving && (
        <p className="mt-2 text-[11px] text-text-muted font-display uppercase tracking-widest">
          {t("q.identity.resolving")}
        </p>
      )}
      {resolveError && (
        <p className="mt-2 text-[11px] text-danger font-display">
          {resolveError}
        </p>
      )}
    </div>
  );
}

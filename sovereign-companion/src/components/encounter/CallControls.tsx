"use client";

import { motion } from "framer-motion";
import { useT } from "@/lib/i18n/useT";

interface CallControlsProps {
  isPaused: boolean;
  isTalking: boolean;
  onHangUp: () => void;
  onTogglePause: () => void;
}

function CircleButton({
  onClick,
  label,
  color,
  glow,
  children,
}: {
  onClick: () => void;
  label: string;
  color: string;
  glow: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <motion.button
        type="button"
        aria-label={label}
        onClick={onClick}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="flex h-14 w-14 items-center justify-center rounded-full transition-shadow cursor-pointer"
        style={{
          backgroundColor: color,
          boxShadow: `0 0 22px ${glow}, inset 0 0 0 1px rgba(255,255,255,0.12)`,
        }}
      >
        {children}
      </motion.button>
      <span className="font-display text-[10px] uppercase tracking-[0.25em] text-text-secondary">
        {label}
      </span>
    </div>
  );
}

// Space-bar is the ONLY way to talk. This pill is a passive visual indicator:
// not clickable, just shows the current PTT state so the user knows whether
// the mic is open.
function SpacePttIndicator({ isTalking, labelIdle, labelActive }: {
  isTalking: boolean;
  labelIdle: string;
  labelActive: string;
}) {
  const color = isTalking ? "#FF2D87" : "#00B4D4";
  const glow = isTalking ? "rgba(255,45,135,0.55)" : "rgba(0,180,212,0.35)";
  return (
    <motion.div
      animate={
        isTalking
          ? { scale: [1, 1.03, 1], transition: { repeat: Infinity, duration: 1.1 } }
          : { scale: 1 }
      }
      className="flex items-center gap-3 rounded-full px-5 py-3 select-none"
      style={{
        backgroundColor: "rgba(10,14,22,0.7)",
        border: `1px solid ${color}55`,
        boxShadow: `0 0 ${isTalking ? 28 : 18}px ${glow}`,
      }}
    >
      <kbd
        className="font-display text-[11px] uppercase tracking-[0.18em] rounded-md px-2.5 py-1"
        style={{
          backgroundColor: color,
          color: "#0A0E16",
          boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.2)",
        }}
      >
        SPACE
      </kbd>
      <span
        className="font-display text-[12px] uppercase tracking-[0.22em]"
        style={{ color }}
      >
        {isTalking ? labelActive : labelIdle}
      </span>
    </motion.div>
  );
}

export default function CallControls({
  isPaused,
  isTalking,
  onHangUp,
  onTogglePause,
}: CallControlsProps) {
  const { t } = useT();

  return (
    <div className="flex items-center gap-6">
      <CircleButton
        onClick={onHangUp}
        label={t("encounter.ctrl.hangup")}
        color="#E5484D"
        glow="rgba(229,72,77,0.45)"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="#fff" aria-hidden>
          <path d="M21 15.46l-5.27-.61c-.62-.07-1.23.14-1.67.58l-3.82 3.82a15.04 15.04 0 01-6.59-6.59l3.83-3.83c.44-.44.65-1.05.58-1.67L7.45 2c-.13-.96-.94-1.68-1.91-1.68H2.99C1.88.32 1 1.22 1.03 2.33c.2 3.71 1.37 7.33 3.54 10.53a19.81 19.81 0 008.58 8.59c3.2 2.16 6.82 3.34 10.53 3.54 1.11.03 2.01-.85 2.01-1.96v-2.55c0-.95-.72-1.77-1.69-1.92z" transform="rotate(135 12 12)" />
        </svg>
      </CircleButton>

      <SpacePttIndicator
        isTalking={isTalking}
        labelIdle={t("encounter.ctrl.pttIdle")}
        labelActive={t("encounter.ctrl.pttActive")}
      />

      <CircleButton
        onClick={onTogglePause}
        label={isPaused ? t("encounter.ctrl.resume") : t("encounter.ctrl.pause")}
        color="#F5A524"
        glow="rgba(245,165,36,0.45)"
      >
        {isPaused ? (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="#fff" aria-hidden>
            <path d="M8 5v14l11-7z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="#fff" aria-hidden>
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        )}
      </CircleButton>
    </div>
  );
}

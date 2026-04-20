"use client";

import { motion } from "framer-motion";

interface ToggleSwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function ToggleSwitch({
  label,
  description,
  checked,
  onChange,
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      className="flex items-center justify-between w-full py-3 px-4 rounded-xl glass-inset cursor-pointer group"
      onClick={() => onChange(!checked)}
    >
      <div className="text-left">
        <span className="text-base font-medium text-text-primary">{label}</span>
        {description && (
          <p className="text-sm text-text-muted mt-1 leading-relaxed">{description}</p>
        )}
      </div>
      <div
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? "bg-cyan-accent/30 border-cyan-accent/50" : "bg-obsidian-border"
        } border border-glass-border`}
      >
        <motion.div
          className={`absolute top-0.5 w-5 h-5 rounded-full ${
            checked ? "bg-cyan-accent" : "bg-text-muted"
          }`}
          animate={{ left: checked ? "calc(100% - 22px)" : "2px" }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          style={checked ? { boxShadow: "0 0 8px rgba(0, 240, 255, 0.5)" } : {}}
        />
      </div>
    </button>
  );
}

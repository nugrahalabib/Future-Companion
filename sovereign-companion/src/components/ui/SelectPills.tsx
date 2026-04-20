"use client";

import { motion } from "framer-motion";

interface SelectPillsProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  renderLabel?: (option: string) => string;
}

export default function SelectPills({
  label,
  options,
  selected,
  onChange,
  renderLabel,
}: SelectPillsProps) {
  const toggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className={label ? "space-y-2" : ""}>
      {label && <span className="text-xs text-text-secondary">{label}</span>}
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const isActive = selected.includes(option);
          return (
            <motion.button
              key={option}
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggle(option)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? "bg-cyan-accent/20 text-cyan-accent border border-cyan-accent/40"
                  : "glass border border-glass-border text-text-secondary hover:text-text-primary"
              }`}
            >
              {renderLabel ? renderLabel(option) : option}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

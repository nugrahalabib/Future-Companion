"use client";

import { motion } from "framer-motion";

export default function LoadingSpinner({
  text,
  className = "",
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="relative w-12 h-12">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-cyan-accent/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border-t-2 border-cyan-accent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
      {text && (
        <motion.p
          className="text-sm text-text-secondary font-display"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}

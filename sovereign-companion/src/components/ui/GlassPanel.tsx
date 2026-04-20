"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

type Variant = "default" | "elevated" | "inset";

interface GlassPanelProps extends HTMLMotionProps<"div"> {
  variant?: Variant;
  glow?: boolean;
}

const variantClasses: Record<Variant, string> = {
  default: "glass",
  elevated: "glass-elevated",
  inset: "glass-inset",
};

export default function GlassPanel({
  variant = "default",
  glow = false,
  className = "",
  children,
  ...props
}: GlassPanelProps) {
  return (
    <motion.div
      className={`rounded-2xl ${variantClasses[variant]} ${glow ? "glow-cyan" : ""} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

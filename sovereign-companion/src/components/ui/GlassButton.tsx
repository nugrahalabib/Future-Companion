"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

interface GlassButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
}

export default function GlassButton({
  variant = "primary",
  size = "md",
  pulse = false,
  className = "",
  children,
  ...props
}: GlassButtonProps) {
  const baseClasses =
    "relative font-display font-semibold tracking-wide rounded-xl transition-colors cursor-pointer select-none";

  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-10 py-4 text-lg",
  };

  const variantClasses = {
    primary:
      "glass-elevated text-cyan-accent border border-cyan-accent/20 hover:border-cyan-accent/40 glow-cyan",
    secondary:
      "glass text-text-primary border border-glass-border hover:bg-glass-bg-hover",
    danger:
      "glass-elevated text-danger border border-danger/20 hover:border-danger/40",
  };

  return (
    <motion.button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      animate={
        pulse
          ? {
              boxShadow: [
                "0 0 20px rgba(0, 240, 255, 0.15)",
                "0 0 40px rgba(0, 240, 255, 0.3)",
                "0 0 20px rgba(0, 240, 255, 0.15)",
              ],
            }
          : undefined
      }
      transition={
        pulse
          ? { boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" } }
          : undefined
      }
      {...props}
    >
      {children}
    </motion.button>
  );
}

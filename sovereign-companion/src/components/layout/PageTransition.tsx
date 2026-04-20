"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";

const variants = {
  hidden: { opacity: 0, y: 20 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export default function PageTransition({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="enter"
      exit="exit"
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`flex-1 ${className}`}
    >
      {children}
    </motion.div>
  );
}

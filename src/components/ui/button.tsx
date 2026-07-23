"use client";

import type { ComponentProps } from "react";
import { motion, useReducedMotion } from "motion/react";

type ButtonProps = ComponentProps<typeof motion.button> & { variant?: "default" | "outline" | "ghost" | "inverse"; size?: "default" | "sm" };
const styles = {
  default: "border-2 border-[#172539] bg-[#172539] text-white shadow-[3px_3px_0_#f36d57] hover:bg-[#2c4160]",
  outline: "border-2 border-[#172539] bg-white text-[#172539] shadow-[3px_3px_0_#172539] hover:bg-[#fdcc48]",
  ghost: "border-2 border-transparent bg-transparent hover:border-[#172539] hover:bg-white",
  inverse: "border-2 border-[#172539] bg-[#f7f1e7] text-[#172539] shadow-[3px_3px_0_#172539] hover:bg-white",
};

export function Button({ className = "", variant = "default", size = "default", type = "button", ...props }: ButtonProps) {
  const reduceMotion = useReducedMotion();

  return <motion.button type={type} whileHover={reduceMotion ? undefined : { y: -3, scale: 1.015 }} whileTap={reduceMotion ? undefined : { y: 1, scale: 0.97 }} transition={{ type: "spring", stiffness: 480, damping: 24 }} className={`inline-flex items-center justify-center gap-2 rounded-xl font-mono text-xs font-black uppercase tracking-[0.1em] transition-[background-color,box-shadow] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f36d57] disabled:cursor-not-allowed disabled:opacity-50 ${size === "sm" ? "h-9 px-3" : "h-11 px-4"} ${styles[variant]} ${className}`} {...props} />;
}
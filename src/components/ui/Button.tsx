"use client";

import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "social";
  fullWidth?: boolean;
  isLoading?: boolean;
}

export function Button({
  variant = "primary",
  fullWidth = false,
  isLoading = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-bold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  const variants: Record<string, string> = {
    primary:
      "bg-gradient-to-br from-[var(--pink)] to-[var(--purple)] text-white rounded-xl py-[0.85rem] px-6 text-[0.95rem] hover:shadow-[0_4px_25px_var(--pink-glow)] hover:-translate-y-px",
    secondary:
      "bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text)] rounded-xl py-[0.85rem] px-6 text-[0.95rem] hover:border-[var(--muted)] hover:bg-[var(--card-hover)]",
    ghost:
      "bg-transparent text-[var(--dim)] rounded-xl py-[0.85rem] px-6 text-[0.95rem] hover:text-[var(--text)]",
    danger:
      "bg-[var(--danger)] text-white rounded-xl py-[0.85rem] px-6 text-[0.95rem] hover:shadow-[0_4px_25px_var(--danger-dim)] hover:-translate-y-px",
    social:
      "bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text)] rounded-[10px] py-[0.7rem] px-4 text-[0.82rem] font-bold hover:border-[var(--muted)] hover:bg-[var(--card-hover)]",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}

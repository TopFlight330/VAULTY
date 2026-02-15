"use client";

import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefix?: string;
}

export function Input({
  label,
  error,
  prefix,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="mb-[1.2rem]">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-[0.78rem] font-bold text-[var(--dim)] mb-[0.4rem] uppercase tracking-[0.06em]"
        >
          {label}
        </label>
      )}
      <div className={prefix ? "relative" : ""}>
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] font-bold text-[0.92rem]">
            {prefix}
          </span>
        )}
        <input
          id={inputId}
          className={`w-full py-3 ${prefix ? "pl-8 pr-4" : "px-4"} bg-[var(--input-bg)] border ${
            error
              ? "border-[var(--danger)]"
              : "border-[var(--border)] focus:border-[var(--pink)]"
          } rounded-[10px] text-[var(--text)] text-[0.92rem] font-semibold outline-none transition-colors duration-200 placeholder:text-[var(--muted)] ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-[0.72rem] text-[var(--danger)] font-semibold">
          {error}
        </p>
      )}
    </div>
  );
}

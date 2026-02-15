"use client";

import { InputHTMLAttributes, useState } from "react";

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
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ marginBottom: "1.2rem" }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            display: "block",
            fontSize: "0.78rem",
            fontWeight: 700,
            color: "var(--dim)",
            marginBottom: "0.4rem",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: prefix ? "relative" : undefined }}>
        {prefix && (
          <span
            style={{
              position: "absolute",
              left: "1rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--muted)",
              fontWeight: 700,
              fontSize: "0.92rem",
            }}
          >
            {prefix}
          </span>
        )}
        <input
          id={inputId}
          className={className}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            padding: prefix ? "0.75rem 1rem 0.75rem 2rem" : "0.75rem 1rem",
            background: "var(--input-bg)",
            border: `1px solid ${
              error
                ? "var(--danger)"
                : focused
                  ? "var(--pink)"
                  : "var(--border)"
            }`,
            borderRadius: "10px",
            color: "var(--text)",
            fontFamily: "inherit",
            fontSize: "0.92rem",
            fontWeight: 600,
            outline: "none",
            transition: "border-color 0.2s",
          }}
          {...props}
        />
      </div>
      {error && (
        <p
          style={{
            marginTop: "0.25rem",
            fontSize: "0.72rem",
            color: "var(--danger)",
            fontWeight: 600,
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

"use client";

import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "social";
  fullWidth?: boolean;
  isLoading?: boolean;
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: {
    background: "linear-gradient(135deg, #f43f8e, #8b5cf6)",
    color: "#fff",
    borderRadius: "12px",
    padding: "0.85rem",
    fontSize: "0.95rem",
    border: "none",
  },
  secondary: {
    background: "var(--input-bg)",
    color: "var(--text)",
    borderRadius: "12px",
    padding: "0.85rem",
    fontSize: "0.95rem",
    border: "1px solid var(--border)",
  },
  ghost: {
    background: "none",
    color: "var(--dim)",
    borderRadius: "12px",
    padding: "0.85rem",
    fontSize: "0.95rem",
    border: "none",
  },
  danger: {
    background: "#ef4444",
    color: "#fff",
    borderRadius: "12px",
    padding: "0.85rem",
    fontSize: "0.95rem",
    border: "none",
  },
  social: {
    background: "var(--input-bg)",
    color: "var(--text)",
    borderRadius: "10px",
    padding: "0.7rem",
    fontSize: "0.82rem",
    border: "1px solid var(--border)",
  },
};

export function Button({
  variant = "primary",
  fullWidth = false,
  isLoading = false,
  className = "",
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      className={className}
      disabled={disabled || isLoading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        fontFamily: "inherit",
        fontWeight: 700,
        cursor: disabled || isLoading ? "not-allowed" : "pointer",
        transition: "all 0.2s",
        opacity: disabled || isLoading ? 0.5 : 1,
        width: fullWidth ? "100%" : undefined,
        ...variantStyles[variant],
        ...style,
      }}
      onMouseEnter={(e) => {
        if (variant === "primary" || variant === "danger") {
          (e.target as HTMLElement).style.boxShadow =
            variant === "primary"
              ? "0 4px 25px rgba(244,63,142,0.25)"
              : "0 4px 25px rgba(239,68,68,0.25)";
          (e.target as HTMLElement).style.transform = "translateY(-1px)";
        } else if (variant === "social") {
          (e.target as HTMLElement).style.borderColor = "var(--muted)";
          (e.target as HTMLElement).style.background = "var(--card-hover)";
        } else if (variant === "ghost") {
          (e.target as HTMLElement).style.color = "var(--text)";
        }
      }}
      onMouseLeave={(e) => {
        (e.target as HTMLElement).style.boxShadow = "";
        (e.target as HTMLElement).style.transform = "";
        if (variant === "social") {
          (e.target as HTMLElement).style.borderColor = "var(--border)";
          (e.target as HTMLElement).style.background = "var(--input-bg)";
        } else if (variant === "ghost") {
          (e.target as HTMLElement).style.color = "var(--dim)";
        }
      }}
      {...props}
    >
      {isLoading && (
        <svg
          style={{ animation: "spin 1s linear infinite", width: 16, height: 16 }}
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            opacity={0.25}
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            opacity={0.75}
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}

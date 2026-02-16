"use client";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastData {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

const variantConfig: Record<
  ToastVariant,
  { bg: string; border: string; color: string; glow: string }
> = {
  success: {
    bg: "rgba(34, 197, 94, 0.08)",
    border: "rgba(34, 197, 94, 0.25)",
    color: "#22c55e",
    glow: "0 0 20px rgba(34, 197, 94, 0.15)",
  },
  error: {
    bg: "rgba(239, 68, 68, 0.08)",
    border: "rgba(239, 68, 68, 0.25)",
    color: "#ef4444",
    glow: "0 0 20px rgba(239, 68, 68, 0.15)",
  },
  info: {
    bg: "rgba(139, 92, 246, 0.08)",
    border: "rgba(139, 92, 246, 0.25)",
    color: "#8b5cf6",
    glow: "0 0 20px rgba(139, 92, 246, 0.15)",
  },
  warning: {
    bg: "rgba(245, 197, 66, 0.08)",
    border: "rgba(245, 197, 66, 0.25)",
    color: "#f5c542",
    glow: "0 0 20px rgba(245, 197, 66, 0.15)",
  },
};

function ToastIcon({ variant }: { variant: ToastVariant }) {
  const color = variantConfig[variant].color;

  if (variant === "success") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    );
  }
  if (variant === "error") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    );
  }
  if (variant === "warning") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

interface ToastItemProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

export function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const config = variantConfig[toast.variant];

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        background: config.bg,
        backdropFilter: "blur(16px)",
        border: `1px solid ${config.border}`,
        borderRadius: "14px",
        padding: "0.85rem 1.1rem",
        boxShadow: `0 8px 32px rgba(0,0,0,0.3), ${config.glow}`,
        minWidth: "320px",
        maxWidth: "420px",
        animation: "slideInRight 250ms cubic-bezier(0.16, 1, 0.3, 1)",
        overflow: "hidden",
        pointerEvents: "auto",
      }}
    >
      {/* Icon */}
      <span style={{ flexShrink: 0, display: "flex" }}>
        <ToastIcon variant={toast.variant} />
      </span>

      {/* Message */}
      <p
        style={{
          fontSize: "0.85rem",
          fontWeight: 600,
          color: "var(--text)",
          lineHeight: 1.45,
          flex: 1,
          margin: 0,
        }}
      >
        {toast.message}
      </p>

      {/* Close */}
      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          flexShrink: 0,
          color: "var(--muted)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "2px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "6px",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--text)";
          e.currentTarget.style.background = "rgba(255,255,255,0.05)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--muted)";
          e.currentTarget.style.background = "none";
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </button>

      {/* Progress bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "2px",
          overflow: "hidden",
          borderRadius: "0 0 14px 14px",
        }}
      >
        <div
          style={{
            height: "100%",
            background: config.color,
            opacity: 0.6,
            animation: `shrink ${toast.duration}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}

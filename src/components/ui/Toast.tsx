"use client";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastData {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

const variantStyles: Record<
  ToastVariant,
  { border: string; icon: string }
> = {
  success: { border: "var(--success)", icon: "\u2713" },
  error: { border: "var(--danger)", icon: "\u2715" },
  info: { border: "var(--purple)", icon: "i" },
  warning: { border: "var(--warning)", icon: "!" },
};

interface ToastItemProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

export function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const vs = variantStyles[toast.variant];

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "flex-start",
        gap: "0.75rem",
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "0.85rem 1.2rem",
        boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
        minWidth: "300px",
        maxWidth: "400px",
        animation: "slideInRight 200ms ease-out",
        borderLeftWidth: "4px",
        borderLeftColor: vs.border,
      }}
    >
      {/* Icon */}
      <span
        style={{
          flexShrink: 0,
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.7rem",
          fontWeight: 700,
          color: "#fff",
          marginTop: "1px",
          background: vs.border,
        }}
      >
        {vs.icon}
      </span>

      {/* Message */}
      <p
        style={{
          fontSize: "0.85rem",
          fontWeight: 600,
          color: "var(--text)",
          lineHeight: 1.4,
          flex: 1,
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
          marginTop: "1px",
          transition: "color 0.2s",
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
          borderRadius: "0 0 12px 12px",
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: "0 0 12px 12px",
            background: vs.border,
            animation: `shrink ${toast.duration}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}

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
  success: { border: "var(--success)", icon: "✓" },
  error: { border: "var(--danger)", icon: "✕" },
  info: { border: "var(--purple)", icon: "i" },
  warning: { border: "var(--warning)", icon: "!" },
};

interface ToastItemProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

export function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const style = variantStyles[toast.variant];

  return (
    <div
      className="relative flex items-start gap-3 bg-[var(--card)] border border-[var(--border)] rounded-xl py-[0.85rem] px-[1.2rem] shadow-[0_16px_48px_rgba(0,0,0,0.4)] min-w-[300px] max-w-[400px]"
      style={{
        animation: "slideInRight 200ms ease-out",
        borderLeftWidth: "4px",
        borderLeftColor: style.border,
      }}
    >
      {/* Icon */}
      <span
        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[0.7rem] font-bold text-white mt-px"
        style={{ background: style.border }}
      >
        {style.icon}
      </span>

      {/* Message */}
      <p className="text-[0.85rem] font-semibold text-[var(--text)] leading-snug flex-1">
        {toast.message}
      </p>

      {/* Close */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 text-[var(--muted)] hover:text-[var(--text)] transition-colors mt-px"
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
      <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden rounded-b-xl">
        <div
          className="h-full rounded-b-xl"
          style={{
            background: style.border,
            animation: `shrink ${toast.duration}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}

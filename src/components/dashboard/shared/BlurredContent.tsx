"use client";

import type { Visibility } from "@/types/database";

interface BlurredContentProps {
  visibility: Visibility;
  ppvPrice?: number | null;
  children: React.ReactNode;
  onSubscribe?: () => void;
  onUnlock?: () => void;
}

export function BlurredContent({
  visibility,
  ppvPrice,
  children,
  onSubscribe,
  onUnlock,
}: BlurredContentProps) {
  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 14 }}>
      <div style={{ filter: "blur(20px)", pointerEvents: "none" }}>
        {children}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(14,11,20,0.6)",
          backdropFilter: "blur(4px)",
          gap: 12,
          zIndex: 2,
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ width: 36, height: 36, color: "var(--pink)" }}
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
        {visibility === "ppv" ? (
          <>
            <span style={{ fontWeight: 800, fontSize: "0.95rem" }}>
              Unlock for {ppvPrice} credits
            </span>
            {onUnlock && (
              <button
                onClick={onUnlock}
                style={{
                  padding: "0.55rem 1.5rem",
                  background: "linear-gradient(135deg, #f43f8e, #8b5cf6)",
                  border: "none",
                  borderRadius: 12,
                  color: "#fff",
                  fontFamily: "inherit",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Unlock Now
              </button>
            )}
          </>
        ) : (
          <>
            <span style={{ fontWeight: 800, fontSize: "0.95rem" }}>
              Subscribe to unlock
            </span>
            {onSubscribe && (
              <button
                onClick={onSubscribe}
                style={{
                  padding: "0.55rem 1.5rem",
                  background: "linear-gradient(135deg, #f43f8e, #8b5cf6)",
                  border: "none",
                  borderRadius: 12,
                  color: "#fff",
                  fontFamily: "inherit",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Subscribe
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

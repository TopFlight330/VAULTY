"use client";

import { useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: "sm" | "md" | "lg";
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  children: React.ReactNode;
}

const sizeMap = {
  sm: "360px",
  md: "420px",
  lg: "520px",
};

export function Modal({
  isOpen,
  onClose,
  title,
  size = "md",
  showCloseButton = true,
  closeOnOverlayClick = true,
  children,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const modal = (
    <div
      ref={overlayRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        animation: "fadeIn 200ms ease-out",
      }}
      onClick={(e) => {
        if (closeOnOverlayClick && e.target === overlayRef.current)
          onClose();
      }}
    >
      {/* Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: sizeMap[size],
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "2.5rem",
          animation: "slideUp 200ms ease-out",
        }}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--muted)",
              background: "none",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "color 0.2s",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        )}

        {title && (
          <h2
            style={{
              fontFamily: "var(--font-sora), 'Sora', sans-serif",
              fontSize: "1.25rem",
              fontWeight: 800,
              color: "var(--text)",
              marginBottom: "0.5rem",
            }}
          >
            {title}
          </h2>
        )}

        {children}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

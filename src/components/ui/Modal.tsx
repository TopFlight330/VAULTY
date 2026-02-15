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
  sm: "max-w-[360px]",
  md: "max-w-[420px]",
  lg: "max-w-[520px]",
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ animation: "fadeIn 200ms ease-out" }}
      onClick={(e) => {
        if (closeOnOverlayClick && e.target === overlayRef.current)
          onClose();
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Content */}
      <div
        className={`relative w-full ${sizeMap[size]} bg-[var(--card)] border border-[var(--border)] rounded-2xl p-10`}
        style={{ animation: "slideUp 200ms ease-out" }}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition-colors rounded-lg hover:bg-[var(--input-bg)]"
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
            className="text-[1.25rem] font-extrabold text-[var(--text)] mb-2"
            style={{ fontFamily: "var(--font-sora), sans-serif" }}
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
